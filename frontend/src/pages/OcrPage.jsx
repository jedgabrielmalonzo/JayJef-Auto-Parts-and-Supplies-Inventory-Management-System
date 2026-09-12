import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Grid,
  HardDrive,
  List,
  Loader2,
  Pencil,
  Printer,
  Radio,
  ScanLine,
  Search,
  Sparkles,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import { deleteReceipt, getScannerEvents, getScannerStatus, ingestScannedDocument, listOcrFolders, listReceipts, uploadReceipt } from '../api/ocr.js';
import { listSuppliers } from '../api/suppliers.js';
import { OCR_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
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

const OCR_MODAL_SIZE_CLASSES = {
  standard: 'sm:max-w-xl max-h-[90vh]',
  wide: 'sm:max-w-4xl max-h-[92vh]',
  'extra-wide': 'sm:max-w-6xl max-h-[94vh]',
  fullscreen: 'sm:max-w-[98vw] sm:w-[98vw] w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh]',
};

function HardwareScanModal({ onClose, onScanComplete }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [modalSize, setModalSize] = useState(() => localStorage.getItem('jayjef_modal_size') || 'standard');

  function changeModalSize(newSize) {
    setModalSize(newSize);
    localStorage.setItem('jayjef_modal_size', newSize);
  }

  async function handleScanSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setIngesting(true);
    try {
      const receipt = await uploadReceipt(file);
      toast.success(`Scan ingested: ${file.name}`);
      if (onScanComplete) {
        onScanComplete(receipt);
      } else if (receipt?.id) {
        navigate(`/ocr/${receipt.id}`);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Error processing scan file');
    } finally {
      setIngesting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`${OCR_MODAL_SIZE_CLASSES[modalSize] || OCR_MODAL_SIZE_CLASSES.standard} overflow-y-auto rounded-2xl p-6 shadow-2xl border border-gray-200 transition-all duration-200`}>
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3 mb-2 pr-8">
          <DialogTitle className="font-heading text-xl font-bold text-gray-900">
            HP DeskJet / LaserJet 4275 Network Scanner Setup
          </DialogTitle>

          {/* Modal Size Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            <span className="text-[11px] text-gray-500 font-bold px-1.5">Size:</span>
            {[
              { key: 'standard', label: 'Standard' },
              { key: 'wide', label: 'Wide' },
              { key: 'extra-wide', label: 'Extra Wide' },
              { key: 'fullscreen', label: 'Full Screen' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => changeModalSize(s.key)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  modalSize === s.key ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
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

          <form onSubmit={handleScanSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Select Scanned Receipt File from Network / Computer</Label>
              {file ? (
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 shadow-xs">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Scan preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Change scanned file
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 text-center transition-colors hover:border-red-600 hover:bg-gray-50/80"
                >
                  <Printer size={28} className="text-red-500" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-gray-800">
                    Click to upload scanned receipt image from HP 4275
                  </span>
                  <span className="text-xs text-gray-400">Supports JPG, PNG, WEBP, TIFF</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button type="submit" disabled={ingesting || !file} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md font-semibold">
                {ingesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {ingesting ? 'Processing Scan...' : 'Ingest & Run OCR'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl border border-gray-200">Cancel</Button>
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
  const [modalSize, setModalSize] = useState(() => localStorage.getItem('jayjef_modal_size') || 'standard');

  function changeModalSize(newSize) {
    setModalSize(newSize);
    localStorage.setItem('jayjef_modal_size', newSize);
  }

  useEffect(() => {
    listSuppliers({ page_size: 500 }).then((r) => setSuppliers(r.items)).catch(() => { });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const receipt = await uploadReceipt(file, supplierId || undefined);
      toast.success('Receipt uploaded & auto-folder organized!');
      navigate(`/ocr/${receipt.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`${OCR_MODAL_SIZE_CLASSES[modalSize] || OCR_MODAL_SIZE_CLASSES.standard} overflow-y-auto rounded-2xl p-6 shadow-2xl border border-gray-200 transition-all duration-200`}>
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3 mb-2 pr-8">
          <DialogTitle className="font-heading text-xl font-bold text-gray-900">
            Upload Receipt Photo
          </DialogTitle>

          {/* Modal Size Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            <span className="text-[11px] text-gray-500 font-bold px-1.5">Size:</span>
            {[
              { key: 'standard', label: 'Standard' },
              { key: 'wide', label: 'Wide' },
              { key: 'extra-wide', label: 'Extra Wide' },
              { key: 'fullscreen', label: 'Full Screen' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => changeModalSize(s.key)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  modalSize === s.key ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Receipt Photo<span className="text-red-600">*</span></Label>
            {file ? (
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5 shadow-xs">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Receipt preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-bold text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Remove & choose another file
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition-colors hover:border-red-600 hover:bg-gray-50"
              >
                <UploadCloud size={32} className="text-gray-400" strokeWidth={1.5} />
                <span className="text-sm font-medium text-gray-700">Click to choose a photo, or drag one here</span>
                <span className="text-xs text-gray-400">OCR will automatically detect receipt date & organize into folder</span>
              </button>
            )}
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
            <Label className="text-xs font-semibold text-gray-700">Supplier (optional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full rounded-xl border-gray-300">
                <SelectValue placeholder="Unknown / not in catalog">
                  {(v) => suppliers.find((s) => String(s.id) === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <Button type="submit" disabled={uploading || !file} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md font-semibold">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {uploading ? 'Uploading & Sorting...' : 'Upload & Auto-Organize'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl border border-gray-200">Cancel</Button>
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
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('drive'); // 'drive' or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const lastEventTimeRef = useRef(new Date().toISOString());

  const loadFolders = useCallback(async () => {
    try {
      const res = await listOcrFolders();
      setFolders(res.folders || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listReceipts({
        status: status === '_all' ? undefined : status,
        folder_date: selectedFolder || undefined,
        page_size: 100,
      });
      setReceipts(result.items || []);
      setTotal(result.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, selectedFolder]);

  useEffect(() => {
    loadFolders();
    loadReceipts();
  }, [loadFolders, loadReceipts]);

  useEffect(() => {
    if (location.pathname === '/ocr') {
      loadFolders();
      loadReceipts();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll hardware scanner events and status
  useEffect(() => {
    getScannerStatus().catch(() => { });

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
          loadFolders();
          loadReceipts();
        }
      } catch { }
    }, 3000);

    return () => clearInterval(interval);
  }, [loadFolders, loadReceipts, navigate]);

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteReceipt(pendingDelete.id);
      toast.success(`Receipt #${pendingDelete.id} deleted successfully`);
      setPendingDelete(null);
      loadFolders();
      loadReceipts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete receipt');
    } finally {
      setDeleting(false);
    }
  }

  // Filter receipts by search query
  const filteredReceipts = receipts.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(r.id).includes(q) ||
      (r.supplier_name && r.supplier_name.toLowerCase().includes(q)) ||
      (r.receipt_date && r.receipt_date.includes(q)) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {modal}
      {hardwareModal}

      {/* Title & Actions Bar */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
            OCR Smart Capture
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Automated receipt date scanning & Google Drive-style folder vault</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => navigate('/ocr/hardware')} variant="outline" className="border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100/70 hover:text-red-800">
            <Printer size={16} strokeWidth={2} />
            HP 4275 Scanner
          </Button>
          <Button onClick={() => navigate('/ocr/upload')} className="bg-red-600 hover:bg-red-700">
            <UploadCloud size={16} strokeWidth={2.5} />
            Upload & Scan
          </Button>
        </div>
      </motion.div>



      {/* Toolbar: Search, Status Filter, View Toggle */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders, dates, receipts..."
            className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue>{(v) => STATUS_LABELS[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle Button */}
          <div className="flex items-center rounded-lg bg-gray-100 p-0.5 border border-gray-200">
            <button
              onClick={() => setViewMode('drive')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'drive' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              title="Google Drive Folder Grid View"
            >
              <Grid size={14} /> Drive Folders
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              title="Flat Table View"
            >
              <List size={14} /> Table View
            </button>
          </div>
        </div>
      </motion.div>

      {/* Google Drive Folders Section */}
      {viewMode === 'drive' && !selectedFolder && (
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen size={16} className="text-amber-500" /> Date Folders ({folders.length})
            </h2>
            {folders.length > 0 && <span className="text-xs text-gray-500">Auto-created from receipt transaction dates</span>}
          </div>

          {folders.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 text-center text-gray-500 text-xs">
              <Folder className="mx-auto mb-2 text-amber-300" size={32} />
              No date folders created yet. Upload a receipt or trigger a scan to start organizing by date automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {folders.map((f) => {
                const isSelected = selectedFolder === f.folder_date;
                return (
                  <motion.div
                    key={f.folder_date}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFolder(f.folder_date)}
                    className={`group cursor-pointer rounded-2xl border p-4 transition-all shadow-xs hover:shadow-md ${isSelected
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100/90 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <Folder size={22} fill="currentColor" strokeWidth={1} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm font-mono text-gray-900 group-hover:text-amber-900 flex items-center gap-1.5">
                            {f.folder_date}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <FileText size={12} /> {f.total_receipts} receipt{f.total_receipts === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      {f.pending_count > 0 ? (
                        <Badge variant="outline" className="border-amber-300 bg-amber-100/80 text-amber-800 font-semibold text-[10px]">
                          {f.pending_count} Pending Review
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-medium text-[10px]">
                          {f.confirmed_count} Confirmed
                        </Badge>
                      )}
                      <span className="text-[11px] font-semibold text-gray-400 group-hover:text-amber-600 flex items-center gap-0.5">
                        Open <ChevronRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Selected Folder Breadcrumb Banner */}
      {selectedFolder && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-amber-600" />
            <span>Viewing Receipts inside folder <strong>{selectedFolder}</strong></span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSelectedFolder(null)} className="h-7 text-xs text-amber-800 hover:bg-amber-100">
            Show All Folders
          </Button>
        </div>
      )}

      {/* Receipts Table / Grid View — Only shown when inside a folder OR in Table View mode */}
      {(selectedFolder || viewMode === 'table') && (
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Receipt File</TableHead>
                <TableHead className="font-semibold text-gray-700">Date Folder</TableHead>
                <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
                <TableHead className="font-semibold text-gray-700">Items</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Uploaded</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-red-600" />Loading receipt vault...</div>
                </TableCell></TableRow>
              )}
              {!loading && filteredReceipts.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-14 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <ScanLine size={28} className="text-gray-300" strokeWidth={1.5} />
                    No receipts found in this view — scan a receipt on HP 4275 or upload a photo to populate your vault.
                  </div>
                </TableCell></TableRow>
              )}
              {!loading && filteredReceipts.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-amber-50/30 transition-colors" onClick={() => navigate(`/ocr/${r.id}`)}>
                  <TableCell className="text-gray-900 font-bold text-xs font-mono flex items-center gap-2">
                    <FileText size={16} className="text-red-500" />
                    <span>Receipt #{r.id}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded">
                      <Folder size={12} className="text-amber-600" fill="currentColor" />
                      {r.receipt_date || new Date(r.created_at).toISOString().split('T')[0]}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 font-medium text-xs">{r.supplier_name || '—'}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-gray-900 text-xs">{r.item_count}</TableCell>
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
      )}

      {!loading && total > 0 && (
        <p className="mt-2 text-xs text-gray-500">{total} receipt{total === 1 ? '' : 's'} in vault</p>
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
