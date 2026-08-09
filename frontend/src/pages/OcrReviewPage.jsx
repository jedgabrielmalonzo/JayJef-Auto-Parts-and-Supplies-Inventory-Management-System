import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
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

  // `announce` is false when called internally from handleConfirm, so the
  // "changes saved" toast doesn't fire redundantly alongside "receipt confirmed".
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
      <div className="flex items-center gap-2 text-black-500">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
    );
  }

  if (!receipt) {
    return <div className="rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError || 'Receipt not found.'}</div>;
  }

  const isPending = receipt.status === 'pending_review';
  const hasConfirmedLine = items.some((i) => i.is_confirmed);

  return (
    <div className="max-w-4xl">
      <Link to="/ocr" className="inline-flex items-center gap-1.5 text-sm font-medium text-black-500 hover:text-black-900 mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Receipts
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-3xl text-black-900">Receipt #{receipt.id}</h1>
        <Badge variant={OCR_STATUS_BADGE[receipt.status]}>{receipt.status.replace('_', ' ')}</Badge>
      </div>

      {receipt.ocr_warning && (
        <div className="mb-4 rounded border border-amber-700 bg-amber-100 px-4 py-3 text-sm text-amber-700">{receipt.ocr_warning}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-2">Receipt Image</h3>
          <img
            src={`${API_ORIGIN}${receipt.image_path}`}
            alt="Uploaded receipt"
            className="w-full rounded-lg border border-gray-200 object-contain"
          />
        </div>

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
