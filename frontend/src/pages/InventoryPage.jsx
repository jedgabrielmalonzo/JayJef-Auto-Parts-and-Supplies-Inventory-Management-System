import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Loader2, PlusCircle, Search } from 'lucide-react';
import { lowStock, listMovements, createMovement } from '../api/inventory.js';
import { MOVEMENT_REASON_LABELS, formatCategory } from '../constants.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Field, { inputClasses } from '../components/Field.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

function AdjustStockModal({ open, onClose, onSaved }) {
  const [product, setProduct] = useState(null);
  const [direction, setDirection] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('manual_adjustment');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setProduct(null); setDirection('in');
      setQuantity(''); setReason('manual_adjustment'); setNote(''); setError(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product || !quantity) return;
    setSaving(true);
    setError(null);
    try {
      const signedQuantity = direction === 'in' ? Number(quantity) : -Number(quantity);
      await createMovement({ product_id: product.id, quantity_change: signedQuantity, reason, note: note || undefined });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Adjust Stock" onClose={onClose} maxWidth="max-w-lg">
      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Product" required>
          <ProductPicker selected={product} onSelect={setProduct} onClear={() => setProduct(null)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Direction">
            <select className={inputClasses(false)} value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (−)</option>
            </select>
          </Field>
          <Field label="Quantity" required>
            <input type="number" min="1" className={`${inputClasses(false)} tabular-nums`} placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </Field>
        </div>

        <Field label="Reason">
          <select className={inputClasses(false)} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="manual_adjustment">Manual Adjustment</option>
            <option value="correction">Correction</option>
          </select>
        </Field>

        <Field label="Note">
          <textarea className={`${inputClasses(false)} h-20`} placeholder="e.g. shelf recount, damaged in transit" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={saving || !product || !quantity}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving...' : 'Record Movement'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function InventoryPage() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [low, movementResult] = await Promise.all([lowStock({}), listMovements({ page_size: 25 })]);
      setLowStockItems(low);
      setMovements(movementResult.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <AdjustStockModal open={adjustOpen} onClose={() => setAdjustOpen(false)} onSaved={() => { setAdjustOpen(false); load(); }} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Inventory</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button onClick={() => setAdjustOpen(true)}>
          <PlusCircle size={16} strokeWidth={2.5} />
          Adjust Stock
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-black-500">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-black-500 mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-700" />
              Low Stock ({lowStockItems.length})
            </h2>
            <div className="rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
              {lowStockItems.length === 0 && (
                <p className="px-4 py-6 text-sm text-black-500">Nothing below its reorder threshold right now.</p>
              )}
              {lowStockItems.map((p) => (
                <Link key={p.id} to={`/products/${p.id}/edit`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-black-900 font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-black-500">{p.sku} · <Badge>{formatCategory(p.category)}</Badge></p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-black-900">{p.stock_quantity} / {p.reorder_threshold}</p>
                    <Badge variant="warning">Low Stock</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-black-500 mb-3 flex items-center gap-2">
              <ClipboardList size={15} />
              Recent Movements
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Change</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-black-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-black-300" strokeWidth={1.5} />
                        No stock movements recorded yet.
                      </div>
                    </td></tr>
                  )}
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-black-900">{m.product_name}</p>
                        <p className="font-mono text-xs text-black-500">{m.product_sku}</p>
                      </td>
                      <td className={`px-4 py-3 tabular-nums font-medium ${m.quantity_change >= 0 ? 'text-green-600' : 'text-black-900'}`}>
                        {m.quantity_change >= 0 ? '+' : '−'}{Math.abs(m.quantity_change)}
                      </td>
                      <td className="px-4 py-3 text-black-700">{MOVEMENT_REASON_LABELS[m.reason] || m.reason}</td>
                      <td className="px-4 py-3 text-black-500 whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
