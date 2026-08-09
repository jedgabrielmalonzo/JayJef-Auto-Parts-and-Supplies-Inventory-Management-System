import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ScanLine, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { listReceipts, uploadReceipt } from '../api/ocr.js';
import { listSuppliers } from '../api/suppliers.js';
import { OCR_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Label } from '../components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import OcrReviewPage from './OcrReviewPage.jsx';

const STATUS_LABELS = { _all: 'All statuses', pending_review: 'Pending Review', confirmed: 'Confirmed', rejected: 'Rejected' };

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
          <DialogTitle>Upload Receipt</DialogTitle>
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

function OcrListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('_all');
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      {modal}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">OCR Receipt Capture</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button onClick={() => navigate('/ocr/upload')}>
          <UploadCloud size={16} strokeWidth={2.5} />
          Upload Receipt
        </Button>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[200px] mb-4">
          <SelectValue>{(v) => STATUS_LABELS[v]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-black-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Loading...</div>
              </TableCell></TableRow>
            )}
            {!loading && receipts.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-14 text-center text-black-500">
                <div className="flex flex-col items-center gap-2">
                  <ScanLine size={28} className="text-black-300" strokeWidth={1.5} />
                  No receipts yet — upload a photo of a supplier receipt to get started.
                </div>
              </TableCell></TableRow>
            )}
            {!loading && receipts.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/ocr/${r.id}`)}>
                <TableCell className="text-black-900">Receipt #{r.id}</TableCell>
                <TableCell className="text-black-700">{r.supplier_name || '—'}</TableCell>
                <TableCell className="tabular-nums text-black-700">{r.item_count}</TableCell>
                <TableCell><Badge variant={OCR_STATUS_BADGE[r.status]}>{r.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell className="text-black-500">{new Date(r.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} receipt{total === 1 ? '' : 's'}</p>
      )}
    </div>
  );
}

export default function OcrPage() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route index element={<OcrListView />} />
      <Route path="upload" element={<OcrListView modal={<UploadModal onClose={() => navigate('/ocr')} />} />} />
      <Route path=":id" element={<OcrReviewPage />} />
    </Routes>
  );
}
