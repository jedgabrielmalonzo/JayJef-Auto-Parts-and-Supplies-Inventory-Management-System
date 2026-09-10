import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ClipboardList, Loader2, PlusCircle, Search, Layers, ListFilter, Calendar, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { lowStock, listMovements, createMovement } from '../api/inventory.js';
import { getOverview } from '../api/dashboard.js';
import { MOVEMENT_REASON_LABELS, formatCategory } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';
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

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

/**
 * Groups raw movement logs by Product ID/SKU AND Calendar Date (YYYY-MM-DD).
 * Multiple movements for the same product on the same day are stacked into 1 summary row.
 * When a new day comes, movements on that date form a new row.
 */
function groupMovementsByDateAndProduct(movements) {
  const groups = {};

  movements.forEach((m) => {
    const d = new Date(m.created_at);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const groupKey = `${m.product_id || m.product_sku}_${dateKey}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        product_id: m.product_id,
        product_name: m.product_name,
        product_sku: m.product_sku,
        dateKey,
        dateObj: d,
        totalChange: 0,
        count: 0,
        reasons: new Set(),
        latestTime: m.created_at,
      };
    }

    groups[groupKey].totalChange += Number(m.quantity_change || 0);
    groups[groupKey].count += 1;
    if (m.reason) groups[groupKey].reasons.add(MOVEMENT_REASON_LABELS[m.reason] || m.reason);

    if (new Date(m.created_at) > new Date(groups[groupKey].latestTime)) {
      groups[groupKey].latestTime = m.created_at;
    }
  });

  return Object.values(groups).sort((a, b) => new Date(b.latestTime) - new Date(a.latestTime));
}

function formatDateLabel(dateObj) {
  const today = new Date();
  const isToday =
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  if (isToday) return `Today (${dateObj.toLocaleDateString()})`;
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
            <Button type="submit" disabled={saving || !product || !quantity} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
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
  const [isStacked, setIsStacked] = useState(true); // Default to Stacked Daily View

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [low, movementResult] = await Promise.all([lowStock({}).catch(() => []), listMovements({ page_size: 150 }).catch(() => ({ items: [] }))]);
      setLowStockItems(Array.isArray(low) ? low : []);
      setMovements(Array.isArray(movementResult?.items) ? movementResult.items : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getOverview().then(setSummary).catch(() => {}); }, []);

  const stackedMovements = useMemo(() => {
    return groupMovementsByDateAndProduct(movements);
  }, [movements]);

  function handleAdjusted() {
    setAdjustOpen(false);
    load();
    getOverview().then(setSummary).catch(() => {});
  }

  const stockQty = summary?.inventory?.quantityInHand || 0;
  const toBeReceived = summary?.inventory?.toBeReceived || 0;

  return (
    <div className="space-y-6">
      <AdjustStockModal open={adjustOpen} onClose={() => setAdjustOpen(false)} onSaved={handleAdjusted} />

      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Stock and Movement</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory levels, daily stock movements, and audit log</p>
        </div>
        <Button onClick={() => setAdjustOpen(true)} className="bg-red-600 hover:bg-red-700 shadow-md">
          <PlusCircle size={16} strokeWidth={2.5} />
          Adjust Stock
        </Button>
      </motion.div>

      {/* LAYER 1: 4 KPI Micro-Stat Cards */}
      <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MicroStatCard
            title="Quantity In Hand"
            subtitle="Total Stocked Units"
            value={Number(stockQty).toLocaleString()}
            change="+14.2%"
            isNegative={false}
            type="step"
          />
          <MicroStatCard
            title="To Be Received"
            subtitle="Pending Shipments"
            value={Number(toBeReceived).toLocaleString()}
            change="Incoming"
            isNegative={false}
            type="bar"
          />
          <MicroStatCard
            title="Low Stock Alerts"
            subtitle="Reorder Required"
            value={lowStockItems.length.toString()}
            change={lowStockItems.length > 0 ? `${lowStockItems.length} Urgent` : 'Optimal'}
            isNegative={lowStockItems.length > 0}
            type="gauge"
          />
          <MicroStatCard
            title="Stacked Daily Groups"
            subtitle="Unique Daily Products"
            value={stackedMovements.length.toString()}
            change="Stacked"
            isNegative={false}
            type="dots"
          />
        </div>
      </motion.section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 size={16} className="animate-spin text-red-600" />
          Loading inventory movements...
        </div>
      ) : (
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Low Stock Alerts */}
          <section className="lg:col-span-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-700" />
              Low Stock Alerts ({lowStockItems.length})
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xs divide-y divide-gray-100 overflow-hidden">
              {lowStockItems.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-500">Nothing below its reorder threshold right now.</p>
              )}
              {lowStockItems.map((p) => (
                <Link key={p.id} to={`/products/${p.id}/edit`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-gray-900 font-semibold">{p.name}</p>
                    <p className="font-mono text-xs text-gray-500">{p.sku} · <Badge>{formatCategory(p.category)}</Badge></p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-gray-900 font-bold">{p.stock_quantity} / {p.reorder_threshold}</p>
                    <Badge variant="warning">Low Stock</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Movements Table with Daily Stacking */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                <ClipboardList size={15} />
                {isStacked ? 'Stacked Daily Movements' : 'All Raw Movement Logs'}
              </h2>

              {/* Toggle Switch: Stacked vs Raw Logs */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsStacked(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    isStacked ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers size={13} />
                  Stacked View
                </button>
                <button
                  type="button"
                  onClick={() => setIsStacked(false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    !isStacked ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListFilter size={13} />
                  Raw Logs ({movements.length})
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Product & SKU</TableHead>
                    <TableHead className="font-bold text-gray-700">{isStacked ? 'Daily Net Change' : 'Change'}</TableHead>
                    <TableHead className="font-bold text-gray-700">{isStacked ? 'Activity' : 'Reason'}</TableHead>
                    <TableHead className="font-bold text-gray-700">Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* STACKED DAILY VIEW */}
                  {isStacked && stackedMovements.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-gray-300" strokeWidth={1.5} />
                        No stock movements recorded yet.
                      </div>
                    </TableCell></TableRow>
                  )}

                  {isStacked && stackedMovements.map((g) => (
                    <TableRow key={g.id} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell>
                        <p className="text-gray-900 font-bold">{g.product_name}</p>
                        <p className="font-mono text-xs text-gray-500">{g.product_sku}</p>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            g.totalChange >= 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {g.totalChange >= 0 ? `+${g.totalChange}` : g.totalChange} Total
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-800">
                            {g.count} {g.count === 1 ? 'operation' : 'operations stacked'}
                          </span>
                          <p className="text-xs text-gray-500 font-medium">
                            {Array.from(g.reasons).join(', ') || 'Manual Adjustment'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {formatDateLabel(g.dateObj)}
                          </span>
                          <span className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock size={11} />
                            Last at {new Date(g.latestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* UNSTACKED RAW LOGS VIEW */}
                  {!isStacked && movements.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500">
                      No stock movements recorded yet.
                    </TableCell></TableRow>
                  )}

                  {!isStacked && movements.map((m) => (
                    <TableRow key={m.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <p className="text-gray-900 font-medium">{m.product_name}</p>
                        <p className="font-mono text-xs text-gray-500">{m.product_sku}</p>
                      </TableCell>
                      <TableCell className={`tabular-nums font-bold ${m.quantity_change >= 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {m.quantity_change >= 0 ? '+' : '−'}{Math.abs(m.quantity_change)}
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">{MOVEMENT_REASON_LABELS[m.reason] || m.reason}</TableCell>
                      <TableCell className="text-gray-500 text-xs">{new Date(m.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
