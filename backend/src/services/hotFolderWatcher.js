import { existsSync, mkdirSync, copyFileSync, statSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';
import chokidar from 'chokidar';
import { requestOcrParse } from './ocrClient.js';
import { parseReceiptText, matchProduct } from './ocrParser.js';
import * as ocrReceiptModel from '../models/ocrReceiptModel.js';
import * as productModel from '../models/productModel.js';
import { uploadsDir } from './uploads.js';

// Default target folder where HP DeskJet / LaserJet 4275 (HP Scan / HP Smart) saves scanned receipts
export const HOT_FOLDER_PATH = process.env.HOT_FOLDER_PATH || 'C:\\JayJef\\ScannedReceipts';
const FALLBACK_HOT_FOLDER = path.join(process.cwd(), 'scanned_receipts');

// Recent scan notifications queue for real-time frontend toast alerts
const recentScanEvents = [];
const MAX_EVENT_HISTORY = 50;

export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

function ensureDirs() {
  try {
    if (!existsSync(HOT_FOLDER_PATH)) mkdirSync(HOT_FOLDER_PATH, { recursive: true });
  } catch {
    // If permission issue creating C:\JayJef\ScannedReceipts, fallback
  }
  if (!existsSync(FALLBACK_HOT_FOLDER)) mkdirSync(FALLBACK_HOT_FOLDER, { recursive: true });
}

async function isFileReady(filePath, retries = 5, delay = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const stat1 = statSync(filePath);
      await new Promise((r) => setTimeout(r, delay));
      const stat2 = statSync(filePath);
      if (stat1.size > 0 && stat1.size === stat2.size) return true;
    } catch {
      // File still being written by scanner software
    }
  }
  return false;
}

export async function processScannedFile(filePath, deviceName = 'HP DeskJet 4275') {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'].includes(ext)) return null;

  const ready = await isFileReady(filePath);
  if (!ready) return null;

  const filename = `hp4275-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const targetPath = path.join(uploadsDir, filename);
  const webPath = `/uploads/receipts/${filename}`;

  try {
    copyFileSync(filePath, targetPath);
    try { unlinkSync(filePath); } catch {}
  } catch (err) {
    console.error(`[HotFolder] Error copying scanned file: ${err.message}`);
    return null;
  }

  console.log(`[HotFolder] Processing scanned receipt from ${deviceName}: ${filename}`);

  let ocrResult = null;
  try {
    ocrResult = await requestOcrParse(targetPath);
  } catch (err) {
    console.warn(`[HotFolder] OCR parsing offline fallback: ${err.message}`);
  }

  let items = [];
  if (ocrResult && ocrResult.raw_text) {
    const candidateLines = parseReceiptText(ocrResult.raw_text);
    const { items: catalog } = await productModel.list({ isActive: true, pageSize: 10000 });
    items = candidateLines.map((line) => ({
      ...line,
      matched_product_id: matchProduct(line.parsed_name, catalog)?.id ?? null,
    }));
  }

  const receipt = await ocrReceiptModel.create({
    imagePath: webPath,
    rawOcrJson: ocrResult,
    supplierId: null,
    items,
  });

  const event = {
    id: receipt.id,
    deviceName,
    filename,
    itemsCount: items.length,
    timestamp: new Date().toISOString(),
    status: receipt.status,
  };

  recentScanEvents.unshift(event);
  if (recentScanEvents.length > MAX_EVENT_HISTORY) recentScanEvents.pop();

  return event;
}

export function initHotFolderWatcher() {
  ensureDirs();

  const watchPaths = [FALLBACK_HOT_FOLDER];
  if (existsSync(HOT_FOLDER_PATH)) watchPaths.push(HOT_FOLDER_PATH);

  console.log(`[HotFolder] Starting HP 4275 Scanner watcher on:`, watchPaths);

  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 200,
    },
  });

  watcher.on('add', async (filePath) => {
    console.log(`[HotFolder] Scanned document detected: ${filePath}`);
    try {
      await processScannedFile(filePath, 'HP DeskJet 4275');
    } catch (err) {
      console.error(`[HotFolder] Failed to process scanned receipt:`, err);
    }
  });

  return watcher;
}

export function getScanEvents(sinceTimestamp) {
  if (!sinceTimestamp) return recentScanEvents.slice(0, 10);
  const sinceDate = new Date(sinceTimestamp).getTime();
  return recentScanEvents.filter((e) => new Date(e.timestamp).getTime() > sinceDate);
}

export function getHotFolderInfo() {
  const localIps = getLocalIpAddresses();
  const primaryIp = localIps[0] || 'localhost';
  return {
    active: true,
    primaryPath: HOT_FOLDER_PATH,
    fallbackPath: FALLBACK_HOT_FOLDER,
    device: 'HP DeskJet / LaserJet 4275 Scanner (Remote / Network Mode)',
    localIp: primaryIp,
    uploadEndpoint: `http://${primaryIp}:4000/api/ocr/scanner/ingest`,
    latestEvent: recentScanEvents[0] || null,
  };
}

