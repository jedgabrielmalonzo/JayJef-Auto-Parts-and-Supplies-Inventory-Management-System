import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, Loader2, Package, PlusCircle, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { lowStock, listMovements, createMovement } from '../api/inventory.js';
import { getOverview } from '../api/dashboard.js';
import { MOVEMENT_REASON_LABELS, formatCategory } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import StatCard from '../components/StatCard.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

const DIRECTION_LABELS = { in: 'Stock In (+)', out: 'Stock Out (−)' };
const REASON_OPTIONS = { manual_adjustment: 'Manual Adjustment', correction: 'Correction' };

function AdjustStockModal({ open, onClose, onSaved }) {
  const [product, setProduct] = useState(null);
  const [direction, setDirection] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('manual_adjustment');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setProduct(null); setDirection('in');
      setQuantity(''); setReason('manual_adjustment'); setNote('');
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product || !quantity) return;
    setSaving(true);
    try {
      const signedQuantity = direction === 'in' ? Number(quantity) : -Number(quantity);
      await createMovement({ product_id: product.id, quantity_change: signedQuantity, reason, note: note || undefined });
      toast.success('Stock movement recorded');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product<span className="text-red-600">*</span></Label>
            <ProductPicker selected={product} onSelect={setProduct} onClear={() => setProduct(null)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => DIRECTION_LABELS[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (+)</SelectItem>
                  <SelectItem value="out">Stock Out (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity<span className="text-red-600">*</span></Label>
              <Input type="number" min="1" className="tabular-nums" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v) => REASON_OPTIONS[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea className="min-h-20" placeholder="e.g. shelf recount, damaged in transit" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving || !product || !quantity}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving...' : 'Record Movement'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [low, movementResult] = await Promise.all([lowStock({}), listMovements({ page_size: 25 })]);
      setLowStockItems(low);
      setMovements(movementResult.items);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getOverview().then(setSummary).catch(() => {}); }, []);

  function handleAdjusted() {
    setAdjustOpen(false);
    load();
    getOverview().then(setSummary).catch(() => {});
  }

  return (
    <div>
      <AdjustStockModal open={adjustOpen} onClose={() => setAdjustOpen(false)} onSaved={handleAdjusted} />

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

      {summary && (
        <div className="mb-6">
          <StatCard
            title="Inventory Summary"
            items={[
              { icon: Package, value: summary.inventory.quantityInHand, label: 'Quantity in Hand', tint: '#3A6EA5' },
              { icon: Truck, value: summary.inventory.toBeReceived, label: 'To be received', tint: '#946200' },
              { icon: AlertTriangle, value: lowStockItems.length, label: 'Low Stock', tint: '#6B6B6B' },
            ]}
          />
        </div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-black-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-black-300" strokeWidth={1.5} />
                        No stock movements recorded yet.
                      </div>
                    </TableCell></TableRow>
                  )}
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="text-black-900">{m.product_name}</p>
                        <p className="font-mono text-xs text-black-500">{m.product_sku}</p>
                      </TableCell>
                      <TableCell className={`tabular-nums font-medium ${m.quantity_change >= 0 ? 'text-green-600' : 'text-black-900'}`}>
                        {m.quantity_change >= 0 ? '+' : '−'}{Math.abs(m.quantity_change)}
                      </TableCell>
                      <TableCell className="text-black-700">{MOVEMENT_REASON_LABELS[m.reason] || m.reason}</TableCell>
                      <TableCell className="text-black-500">{new Date(m.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
