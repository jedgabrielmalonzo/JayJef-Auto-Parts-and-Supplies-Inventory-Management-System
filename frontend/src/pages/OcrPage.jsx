import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ScanLine, UploadCloud } from 'lucide-react';
import { listReceipts, uploadReceipt } from '../api/ocr.js';
import { listSuppliers } from '../api/suppliers.js';
import { OCR_STATUS_BADGE } from '../constants.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Field, { inputClasses } from '../components/Field.jsx';
import OcrReviewPage from './OcrReviewPage.jsx';

function UploadModal({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listSuppliers({ page_size: 500 }).then((r) => setSuppliers(r.items)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const receipt = await uploadReceipt(file, supplierId || undefined);
      navigate(`/ocr/${receipt.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open title="Upload Receipt" onClose={onClose} maxWidth="max-w-md">
      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Receipt Photo" required>
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
        </Field>

        <Field label="Supplier (optional)">
          <select className={inputClasses(false)} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Unknown / not in catalog</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={uploading || !file}>
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading ? 'Uploading...' : 'Upload & Scan'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function OcrListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listReceipts({ status: status || undefined });
      setReceipts(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
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

      <select className={`${inputClasses(false)} max-w-[200px] mb-4`} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        <option value="pending_review">Pending Review</option>
        <option value="confirmed">Confirmed</option>
        <option value="rejected">Rejected</option>
      </select>

      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
              <th className="px-4 py-3 font-medium">Receipt</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-black-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Loading...</div>
              </td></tr>
            )}
            {!loading && receipts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-black-500">
                <div className="flex flex-col items-center gap-2">
                  <ScanLine size={28} className="text-black-300" strokeWidth={1.5} />
                  No receipts yet — upload a photo of a supplier receipt to get started.
                </div>
              </td></tr>
            )}
            {!loading && receipts.map((r) => (
              <tr key={r.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/ocr/${r.id}`)}>
                <td className="px-4 py-3 text-black-900">Receipt #{r.id}</td>
                <td className="px-4 py-3 text-black-700">{r.supplier_name || '—'}</td>
                <td className="px-4 py-3 tabular-nums text-black-700">{r.item_count}</td>
                <td className="px-4 py-3"><Badge variant={OCR_STATUS_BADGE[r.status]}>{r.status.replace('_', ' ')}</Badge></td>
                <td className="px-4 py-3 text-black-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
