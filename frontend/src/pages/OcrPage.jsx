import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, Loader2, Pencil, Printer, Radio, ScanLine, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { deleteReceipt, getScannerEvents, getScannerStatus, ingestScannedDocument, listReceipts, uploadReceipt } from '../api/ocr.js';
import { listSuppliers } from '../api/suppliers.js';
import { OCR_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Label } from '../components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.jsx';
import OcrReviewPage from './OcrReviewPage.jsx';

const STATUS_LABELS = { _all: 'All statuses', pending_review: 'Pending Review', confirmed: 'Confirmed', rejected: 'Rejected' };

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

function HardwareScanModal({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  async function handleScanSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setIngesting(true);
    try {
      const res = await ingestScannedDocument(file);
      toast.success('📄 Document ingested from HP DeskJet 4275 scanner!');
      if (res.event?.id) {
        navigate(`/ocr/${res.event.id}`);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to ingest scan');
    } finally {
      setIngesting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="text-red-600" size={20} />
            HP DeskJet / LaserJet 4275 Network Scanner Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-blue-200 bg-blue-50/75 p-3.5 text-blue-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 size={15} className="text-blue-600" />
              Printer is on a different PC or Network Wi-Fi?
            </div>
            <p className="text-blue-800 leading-relaxed">
              When your HP 4275 printer/scanner is connected to a different computer on the shop network, use any of these 2 quick setup methods:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-medium text-blue-900">
              <li><strong>Method 1 (Network Folder)</strong>: On the printer's PC, set HP Scan to save scans into a shared folder (e.g. <code className="bg-blue-100 px-1 rounded font-mono font-semibold">C:\JayJef\ScannedReceipts</code> shared on your local network).</li>
              <li><strong>Method 2 (Web Upload)</strong>: Transfer or select the scanned image file below to run OCR parsing instantly.</li>
            </ul>
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Select Scanned Receipt File from Network / Computer</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 text-center transition-colors hover:border-red-600 hover:bg-gray-50/80"
              >
                <Printer size={28} className="text-red-500" strokeWidth={1.5} />
                <span className="text-sm font-medium text-gray-800">
                  {file ? file.name : 'Click to upload scanned receipt image from HP 4275'}
                </span>
                <span className="text-xs text-gray-400">Supports JPG, PNG, WEBP, TIFF</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={ingesting || !file} className="bg-red-600 hover:bg-red-700">
                {ingesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {ingesting ? 'Processing Scan...' : 'Ingest & Run OCR'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function UploadModal({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listSuppliers({ page_size: 500 }).then((r) => setSuppliers(r.items)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const receipt = await uploadReceipt(file, supplierId || undefined);
      toast.success('Receipt uploaded — scanning for line items');
      navigate(`/ocr/${receipt.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Receipt Photo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Receipt Photo<span className="text-red-600">*</span></Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-black-900 hover:bg-gray-50"
            >
              <UploadCloud size={24} className="text-black-500" strokeWidth={1.5} />
              <span className="text-sm text-black-700">{file ? file.name : 'Click to choose a photo, or drag one here'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Supplier (optional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unknown / not in catalog">
                  {(v) => suppliers.find((s) => String(s.id) === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={uploading || !file}>
              {uploading && <Loader2 size={16} className="animate-spin" />}
              {uploading ? 'Uploading...' : 'Upload & Scan'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OcrListView({ modal, hardwareModal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('_all');
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [scannerStatus, setScannerStatus] = useState(null);
  const lastEventTimeRef = useRef(new Date().toISOString());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listReceipts({ status: status === '_all' ? undefined : status });
      setReceipts(result.items);
      setTotal(result.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (location.pathname === '/ocr') load();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll hardware scanner events and status
  useEffect(() => {
    getScannerStatus().then(setScannerStatus).catch(() => {});

    const interval = setInterval(async () => {
      try {
        const data = await getScannerEvents(lastEventTimeRef.current);
        if (data.events && data.events.length > 0) {
          data.events.forEach((evt) => {
            toast.success(`📄 ${evt.deviceName}: New receipt scanned!`, {
              description: `Receipt #${evt.id} parsed ${evt.itemsCount} item(s)`,
              action: {
                label: 'Review Items',
                onClick: () => navigate(`/ocr/${evt.id}`),
              },
            });
          });
          lastEventTimeRef.current = new Date().toISOString();
          load();
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [load, navigate]);

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteReceipt(pendingDelete.id);
      toast.success(`Receipt #${pendingDelete.id} deleted successfully`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to delete receipt');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {modal}
      {hardwareModal}

      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">OCR Smart Capture</h1>
          <p className="text-sm text-gray-500 mt-1">Scan supplier receipts, parse line items automatically, and sync to stock</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => navigate('/ocr/hardware')} variant="outline" className="border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100/70 hover:text-red-800">
            <Printer size={16} strokeWidth={2} />
            HP 4275 Scanner
          </Button>
          <Button onClick={() => navigate('/ocr/upload')} className="bg-red-600 hover:bg-red-700">
            <UploadCloud size={16} strokeWidth={2.5} />
            Upload Photo
          </Button>
        </div>
      </motion.div>

      {/* HP DeskJet 4275 Auto-Scan Hardware Status Banner */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-linear-to-r from-gray-900 to-gray-800 p-4 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-600/90 text-white shadow-xs">
            <Printer size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">HP DeskJet / LaserJet 4275 Scanner</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                <Radio size={10} className="animate-pulse text-emerald-400" /> Auto-Folder Watcher Listening
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Scans saved to <code className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">C:\JayJef\ScannedReceipts</code> are auto-ingested instantly.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/ocr/hardware')} size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border border-white/20">
          <Sparkles size={14} /> Scan from HP 4275
        </Button>
      </motion.div>

      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>{(v) => STATUS_LABELS[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Receipt</TableHead>
              <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
              <TableHead className="font-semibold text-gray-700">Items</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Uploaded</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-red-600" />Scanning receipts...</div>
              </TableCell></TableRow>
            )}
            {!loading && receipts.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-14 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <ScanLine size={28} className="text-gray-300" strokeWidth={1.5} />
                  No receipts yet — scan a paper receipt on your HP DeskJet 4275 or upload a photo to get started.
                </div>
              </TableCell></TableRow>
            )}
            {!loading && receipts.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => navigate(`/ocr/${r.id}`)}>
                <TableCell className="text-gray-900 font-bold text-xs font-mono">Receipt #{r.id}</TableCell>
                <TableCell className="text-gray-700 font-medium">{r.supplier_name || '—'}</TableCell>
                <TableCell className="tabular-nums font-semibold text-gray-900">{r.item_count}</TableCell>
                <TableCell><Badge variant={OCR_STATUS_BADGE[r.status]}>{r.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell className="text-gray-500 text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="View Details"
                      onClick={() => navigate(`/ocr/${r.id}`)}
                      className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Review / Update"
                      onClick={() => navigate(`/ocr/${r.id}`)}
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete Receipt"
                      onClick={() => setPendingDelete(r)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-gray-500">{total} receipt{total === 1 ? '' : 's'}</p>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete receipt #{pendingDelete?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this OCR receipt? All associated scanned line items will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Deleting...' : 'Delete Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OcrPage() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route index element={<OcrListView />} />
      <Route path="upload" element={<OcrListView modal={<UploadModal onClose={() => navigate('/ocr')} />} />} />
      <Route path="hardware" element={<OcrListView hardwareModal={<HardwareScanModal onClose={() => navigate('/ocr')} />} />} />
      <Route path=":id" element={<OcrReviewPage />} />
    </Routes>
  );
}



