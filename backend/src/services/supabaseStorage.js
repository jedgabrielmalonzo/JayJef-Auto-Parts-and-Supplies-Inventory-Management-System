import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Supabase Storage client initialized for bucket uploads.');
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err.message);
  }
}

/**
 * Uploads a file buffer or disk path to Supabase Storage bucket 'receipts'.
 * If Supabase Storage is not configured or fails, returns a portable Base64 Data URI
 * so receipt photos are visible across ALL devices (laptop, desktop, Vercel live host).
 */
export async function uploadToSupabaseStorage({ filePath, fileBuffer, originalName, mimeType, receiptDate }) {
  const filename = `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName || 'image.jpg') || '.jpg'}`;
  const folder = receiptDate || new Date().toISOString().split('T')[0];
  const storagePath = `${folder}/${filename}`;

  let buffer = fileBuffer;
  if (!buffer && filePath && fs.existsSync(filePath)) {
    try {
      buffer = fs.readFileSync(filePath);
    } catch (err) {
      console.warn('Could not read file from path:', err.message);
    }
  }

  // 1. Try uploading to Supabase Storage bucket
  if (supabase && buffer) {
    try {
      const bucketName = 'receipts';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
        if (publicUrlData?.publicUrl) {
          console.log('✅ Uploaded receipt photo to Supabase Storage:', publicUrlData.publicUrl);
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('⚠️ Supabase Storage upload note (using portable Data URI fallback):', error.message);
      }
    } catch (err) {
      console.warn('⚠️ Supabase Storage exception:', err.message);
    }
  }

  // 2. Fallback: Convert to portable Data URI so image is visible on ALL devices
  if (buffer) {
    const base64 = buffer.toString('base64');
    const type = mimeType || 'image/jpeg';
    console.log('⚡ Using portable Data URI for receipt image to ensure cross-device visibility.');
    return `data:${type};base64,${base64}`;
  }

  return `/uploads/receipts/${folder}/${filename}`;
}
