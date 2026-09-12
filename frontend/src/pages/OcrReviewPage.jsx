import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Download, ExternalLink, Loader2, Maximize2,
  Plus, RotateCw, Trash2, X, XCircle, ZoomIn, ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import { getReceipt, updateReceiptItems, confirmReceipt, rejectReceipt } from '../api/ocr.js';
import { API_ORIGIN } from '../api/client.js';
import { OCR_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { Label } from '../components/ui/label.jsx';
import ProductPicker from '../components/ProductPicker.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';

let tempKeySeq = 0;

export default function OcrReviewPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  // Lightbox & image zoom state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    getReceipt(id)
      .then((r) => {
        setReceipt(r);
        setItems(r.items.map((i) => ({ ...i, _key: i.id })));
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isImageModalOpen) {
        setIsImageModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen]);

  function handleZoomIn() { setZoomLevel((z) => Math.min(z + 0.5, 4)); }
  function handleZoomOut() { setZoomLevel((z) => Math.max(z - 0.5, 0.5)); }
  function handleResetZoom() { setZoomLevel(1); setRotation(0); }
  function handleRotate() { setRotation((r) => (r + 90) % 360); }

  function openInspector() {
    setZoomLevel(1);
    setRotation(0);
    setIsImageModalOpen(true);
  }

  function updateItem(key, field, value) {
    setItems((list) => list.map((i) => (i._key === key ? { ...i, [field]: value } : i)));
  }

  function dismissItem(key) {
    setItems((list) => list.filter((i) => i._key !== key));
  }

  function addManualLine() {
    setItems((list) => [...list, {
      _key: `new-${tempKeySeq++}`, id: undefined, raw_text: null,
      parsed_name: '', parsed_quantity: '', parsed_price: '', matched_product_id: null, is_confirmed: false,
    }]);
  }

  async function saveChanges(announce = true) {
    setSaving(true);
    try {
      const payload = items.map((i) => ({
        id: i.id,
        parsed_name: i.parsed_name,
        parsed_quantity: i.parsed_quantity === '' ? null : Number(i.parsed_quantity),
        parsed_price: i.parsed_price === '' ? null : Number(i.parsed_price),
        matched_product_id: i.matched_product_id,
        is_confirmed: i.is_confirmed,
      }));
      const updated = await updateReceiptItems(id, payload);
      setItems(updated.map((i) => ({ ...i, _key: i.id })));
      if (announce) toast.success('Changes saved');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      if (!(await saveChanges(false))) return;
      const updated = await confirmReceipt(id);
      setReceipt(updated);
      setItems(updated.items.map((i) => ({ ...i, _key: i.id })));
      toast.success('Receipt confirmed — stock updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleReject() {
    try {
      const updated = await rejectReceipt(id);
      setReceipt(updated);
      toast.success('Receipt rejected');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirmReject(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-black-500 py-12">
        <Loader2 size={18} className="animate-spin text-red-600" />
        <span>Loading receipt details...</span>
      </div>
    );
  }

  if (!receipt) {
    return <div className="rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError || 'Receipt not found.'}</div>;
  }

  const isPending = receipt.status === 'pending_review';
  const hasConfirmedLine = items.some((i) => i.is_confirmed);
  const imageUrl = receipt.image_path?.startsWith('http') || receipt.image_path?.startsWith('data:')
    ? receipt.image_path
    : `${API_ORIGIN}${receipt.image_path}`;

  return (
    <div className="max-w-7xl w-full pb-12">
      <Link to="/ocr" className="inline-flex items-center gap-1.5 text-sm font-medium text-black-500 hover:text-black-900 mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Receipts
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Receipt #{receipt.id}</h1>
        <Badge variant={OCR_STATUS_BADGE[receipt.status]}>{receipt.status.replace('_', ' ')}</Badge>
      </div>

      {receipt.ocr_warning && (
        <div className="mb-4 rounded border border-amber-700 bg-amber-100 px-4 py-3 text-sm text-amber-700">{receipt.ocr_warning}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Receipt Image Card Column */}
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500">Receipt Image</h3>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                onClick={openInspector}
              >
                <Maximize2 size={13} className="mr-1 text-red-600" />
                Enlarge
              </Button>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 p-1"
                title="Open raw image in new window"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div
            onClick={openInspector}
            className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xs transition-all hover:border-red-500 hover:shadow-md"
          >
            <img
              src={imageUrl}
              alt="Uploaded receipt"
              className="w-full max-h-[520px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 shadow-xl backdrop-blur-xs">
                <ZoomIn size={15} className="text-red-600" />
                Click to inspect clear image
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center">Click image to open high-resolution lightbox with zoom & rotate controls</p>
        </div>

        {/* Line Items Editor Column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500">Line Items</h3>
            {isPending && (
              <button type="button" onClick={addManualLine} className="inline-flex items-center gap-1 text-xs font-medium text-black-700 hover:text-black-900 transition-colors">
                <Plus size={14} />
                Add line manually
              </button>
            )}
          </div>

          {items.length === 0 && (
            <div className="rounded-lg border border-gray-200 px-4 py-10 text-center text-sm text-black-500">
              No line items detected. {isPending && 'Add one manually above.'}
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const matched = item.matched_product_id
                ? { id: item.matched_product_id, sku: item.matched_product_sku, name: item.matched_product_name }
                : null;
              return (
                <div key={item._key} className="rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-start mb-2">
                    <Input
                      placeholder="Item name"
                      value={item.parsed_name || ''}
                      disabled={!isPending}
                      onChange={(e) => updateItem(item._key, 'parsed_name', e.target.value)}
                    />
                    <Input
                      type="number" min="0" className="w-20 tabular-nums" placeholder="Qty"
                      value={item.parsed_quantity ?? ''} disabled={!isPending}
                      onChange={(e) => updateItem(item._key, 'parsed_quantity', e.target.value)}
                    />
                    <Input
                      type="number" min="0" step="0.01" className="w-24 tabular-nums" placeholder="Price"
                      value={item.parsed_price ?? ''} disabled={!isPending}
                      onChange={(e) => updateItem(item._key, 'parsed_price', e.target.value)}
                    />
                  </div>
                  {item.raw_text && <p className="mb-2 text-xs text-black-500">OCR read: “{item.raw_text}”</p>}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      {isPending ? (
                        <ProductPicker
                          selected={matched}
                          onSelect={(p) => updateItem(item._key, 'matched_product_id', p.id)}
                          onClear={() => updateItem(item._key, 'matched_product_id', null)}
                          placeholder="Match to a catalog product..."
                        />
                      ) : (
                        <p className="text-sm text-black-700">{matched ? `${matched.sku} — ${matched.name}` : 'No matched product'}</p>
                      )}
                    </div>
                    {isPending && (
                      <>
                        <Label className="flex items-center gap-1.5 text-xs normal-case tracking-normal text-black-700 whitespace-nowrap">
                          <Checkbox
                            checked={item.is_confirmed}
                            disabled={!item.matched_product_id || !item.parsed_quantity}
                            onCheckedChange={(v) => updateItem(item._key, 'is_confirmed', !!v)}
                          />
                          Include in stock update
                        </Label>
                        <button type="button" title="Dismiss" onClick={() => dismissItem(item._key)} className="text-black-500 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isPending && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
              <Button type="button" variant="secondary" disabled={saving} onClick={() => saveChanges(true)}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" disabled={confirming || !hasConfirmedLine} onClick={handleConfirm} title={!hasConfirmedLine ? 'Confirm at least one matched line item first' : undefined}>
                {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirm & Commit
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirmReject(true)}>
                <XCircle size={16} />
                Reject Receipt
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / High-Resolution Image Inspector Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative flex flex-col max-w-6xl w-full h-[90vh] rounded-2xl bg-gray-950 border border-gray-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/90 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-gray-100">Receipt #{receipt.id} Image Inspector</span>
                <span className="text-xs text-gray-400 font-mono">Zoom: {Math.round(zoomLevel * 100)}% | Rotation: {rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="px-2 py-1 text-xs font-mono text-gray-300 hover:bg-gray-700 rounded hover:text-white transition-colors"
                    title="Reset Zoom to 100%"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 4}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white border border-gray-700 transition-colors"
                  title="Rotate 90 degrees clockwise"
                >
                  <RotateCw size={14} />
                  Rotate
                </button>

                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white border border-gray-700 transition-colors"
                  title="Open original image in new tab"
                >
                  <ExternalLink size={14} />
                  Original
                </a>

                <a
                  href={imageUrl}
                  download={`receipt-${receipt.id}.png`}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white border border-gray-700 transition-colors"
                  title="Download picture"
                >
                  <Download size={14} />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-1.5 bg-gray-800 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-colors ml-2"
                  title="Close Inspector (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Viewport */}
            <div
              className="relative flex-1 overflow-auto p-6 flex items-center justify-center bg-black/60 select-none cursor-grab active:cursor-grabbing"
              onWheel={(e) => {
                if (e.deltaY < 0) handleZoomIn();
                else if (e.deltaY > 0) handleZoomOut();
              }}
            >
              <div
                className="transition-transform duration-150 ease-out origin-center flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={imageUrl}
                  alt="High Resolution Receipt"
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl border border-gray-800"
                  style={{ imageRendering: 'high-quality' }}
                />
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/80 px-4 py-2 text-xs text-gray-400">
              <span>Scroll wheel to zoom in/out | Click & drag window to pan around</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono text-[10px] text-gray-300">ESC</kbd> to close viewer</span>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={confirmReject} onOpenChange={(v) => !v && setConfirmReject(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              No stock movements will be created and this receipt will be marked rejected. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject Receipt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

