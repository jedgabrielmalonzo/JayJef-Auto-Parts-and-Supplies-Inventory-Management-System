import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ClipboardList, Loader2, PlusCircle, Search, Layers, ListFilter, Calendar, Clock, ChevronLeft, ChevronRight,
  Package, Boxes, Trash2, ArrowRightLeft, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { lowStock, listMovements, createMovement, createBatchMovements } from '../api/inventory.js';
import { listOrders, getOrder } from '../api/orders.js';
import { getOverview } from '../api/dashboard.js';
import { MOVEMENT_REASON_LABELS, formatCategory } from '../constants.js';
import { soundService } from '../lib/sound.js';
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
import { DatePickerWithRange } from '../components/DatePickerWithRange.jsx';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../components/ui/pagination.jsx';

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
 */
function groupMovementsByDateAndProduct(movements) {
  const groups = {};

  (movements || []).forEach((m) => {
    const d = new Date(m.created_at);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const groupKey = `${dateKey}_${m.product_id}`;

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
  const [mode, setMode] = useState('single'); // 'single' | 'bundle'

  // Single mode state
  const [product, setProduct] = useState(null);
  const [direction, setDirection] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('manual_adjustment');
  const [note, setNote] = useState('');

  // Bundle mode state
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundleReason, setBundleReason] = useState('manual_adjustment');
  const [bundleNote, setBundleNote] = useState('');
  const [addItemProduct, setAddItemProduct] = useState(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('single');
      setProduct(null); setDirection('in');
      setQuantity(''); setReason('manual_adjustment'); setNote('');
      setSelectedOrderId(''); setBundleItems([]);
      setBundleReason('manual_adjustment'); setBundleNote('');
      setAddItemProduct(null);
    } else {
      listOrders({ pageSize: 100 }).then((res) => {
        setOrders(res?.items || []);
      }).catch(() => {});
    }
  }, [open]);

  async function handleSelectOrder(orderId) {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    setLoadingOrder(true);
    try {
      const order = await getOrder(orderId);
      if (order && Array.isArray(order.items)) {
        const mapped = order.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity || 1,
          direction: order.type === 'purchase' ? 'in' : 'out',
          stock_quantity: item.stock_quantity,
        }));
        setBundleItems(mapped);
        setBundleNote(`Adjusted via Order #${order.order_number}`);
        setBundleReason(order.type === 'purchase' ? 'purchase_order_received' : 'order_fulfillment');
        toast.success(`Loaded ${mapped.length} items from ${order.order_number}`);
      }
    } catch (err) {
      toast.error('Failed to load order details: ' + err.message);
    } finally {
      setLoadingOrder(false);
    }
  }

  function handleAddProductToBundle(p) {
    if (!p) return;
    if (bundleItems.some((item) => item.product_id === p.id)) {
      toast.error('Product is already in the bundle list');
      return;
    }
    setBundleItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        quantity: 1,
        direction: 'in',
        stock_quantity: p.stock_quantity || 0,
      },
    ]);
    setAddItemProduct(null);
  }

  function updateBundleItem(index, field, value) {
    setBundleItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeBundleItem(index) {
    setBundleItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitSingle(e) {
    e.preventDefault();
    if (!product || !quantity) return;
    setSaving(true);
    try {
      const signedQuantity = direction === 'in' ? Number(quantity) : -Number(quantity);
      await createMovement({ product_id: product.id, quantity_change: signedQuantity, reason, note: note || undefined });

      const newQty = Math.max(0, (product.stock_quantity || 0) + signedQuantity);
      if (signedQuantity < 0) {
        soundService.checkAndPlayAlert(newQty, product.reorder_threshold || 5);
      }

      toast.success('Stock movement recorded');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitBundle(e) {
    e.preventDefault();
    if (bundleItems.length === 0) {
      toast.error('Please add at least one product to the bundle');
      return;
    }
    setSaving(true);
    try {
      const movements = bundleItems.map((item) => ({
        product_id: item.product_id,
        quantity_change: item.direction === 'in' ? Number(item.quantity) : -Number(item.quantity),
        reason: bundleReason,
        note: bundleNote || `Bundle Stock Adjustment (${bundleItems.length} items)`,
      }));

      await createBatchMovements(movements);

      // Check alerts for outgoing items
      bundleItems.forEach((item) => {
        const change = item.direction === 'in' ? Number(item.quantity) : -Number(item.quantity);
        if (change < 0) {
          const newQty = Math.max(0, (item.stock_quantity || 0) + change);
          soundService.checkAndPlayAlert(newQty, 5);
        }
      });

      toast.success(`Successfully adjusted stock for ${bundleItems.length} items in bundle!`);
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-red-600" />
            Adjust Inventory Stock
          </DialogTitle>
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                mode === 'single' ? 'bg-red-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package size={14} />
              Single Product
            </button>
            <button
              type="button"
              onClick={() => setMode('bundle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                mode === 'bundle' ? 'bg-red-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Boxes size={14} />
              Adjust by Bundle / Whole Order
            </button>
          </div>
        </DialogHeader>

        {mode === 'single' ? (
          <form onSubmit={handleSubmitSingle} className="space-y-4 pt-1">
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
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
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
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Reason for adjustment, PO #, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || !product || !quantity} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                {saving ? 'Saving...' : 'Record Movement'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitBundle} className="space-y-4 pt-1">
            {/* Load from Existing Order */}
            <div className="space-y-1.5 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <Label className="font-bold text-xs text-gray-700 flex items-center gap-1.5">
                <FileText size={14} className="text-red-600" />
                Option A: Load Items from Existing Order
              </Label>
              <div className="flex gap-2 items-center">
                <Select value={selectedOrderId} onValueChange={handleSelectOrder}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select an order (PO / Invoice)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.order_number} ({o.type === 'purchase' ? 'PO' : 'Sale Invoice'}) — {o.party_name || o.supplier_name || 'No Party'} ({o.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingOrder && <Loader2 size={16} className="animate-spin text-red-600 shrink-0" />}
              </div>
            </div>

            {/* Add Custom Products to Bundle */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs text-gray-700">Option B: Add Products to Bundle Manually</Label>
              <ProductPicker selected={addItemProduct} onSelect={handleAddProductToBundle} onClear={() => setAddItemProduct(null)} placeholder="Search and pick product to add..." />
            </div>

            {/* Bundle Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs uppercase tracking-wide text-gray-500">
                  Bundle Items ({bundleItems.length})
                </Label>
                {bundleItems.length > 0 && (
                  <button type="button" onClick={() => setBundleItems([])} className="text-xs text-red-600 hover:underline">
                    Clear All Items
                  </button>
                )}
              </div>

              {bundleItems.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl py-8 text-center text-xs text-gray-500">
                  No items in bundle yet. Select an order above or pick products to add.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-bold text-gray-700">Product</TableHead>
                        <TableHead className="font-bold text-gray-700">Direction</TableHead>
                        <TableHead className="font-bold text-gray-700 w-24">Qty</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundleItems.map((item, idx) => (
                        <TableRow key={`${item.product_id}_${idx}`}>
                          <TableCell className="py-2">
                            <p className="font-bold text-gray-900">{item.product_name}</p>
                            <p className="font-mono text-[11px] text-gray-500">{item.product_sku}</p>
                          </TableCell>
                          <TableCell className="py-2">
                            <Select value={item.direction} onValueChange={(val) => updateBundleItem(idx, 'direction', val)}>
                              <SelectTrigger className="h-7 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in">In (+)</SelectItem>
                                <SelectItem value="out">Out (−)</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateBundleItem(idx, 'quantity', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <button type="button" onClick={() => removeBundleItem(idx)} className="text-gray-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Batch Reason</Label>
                <Select value={bundleReason} onValueChange={setBundleReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                    <SelectItem value="purchase_order_received">Purchase Order Restock</SelectItem>
                    <SelectItem value="order_fulfillment">Sales Order Fulfillment</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch Note (optional)</Label>
                <Input
                  placeholder="Order #, Restock batch, etc."
                  value={bundleNote}
                  onChange={(e) => setBundleNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving || bundleItems.length === 0} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                {saving ? 'Saving Bundle...' : `Adjust Stock for Bundle (${bundleItems.length} items)`}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked' | 'raw'
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [dateRange, setDateRange] = useState(undefined); // { from: Date, to: Date } or undefined

  // Pagination States
  const [lowStockPage, setLowStockPage] = useState(1);
  const lowStockPageSize = 5;

  const [movementsPage, setMovementsPage] = useState(1);
  const movementsPageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [low, movementResult] = await Promise.all([
        lowStock(),
        listMovements({ page_size: 500 }),
      ]);
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

  // Filter movements by Date Range
  const filteredMovements = useMemo(() => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) return movements;
    const fromTime = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : 0;
    const toTime = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : Infinity;

    return movements.filter((m) => {
      const time = new Date(m.created_at).getTime();
      return time >= fromTime && time <= toTime;
    });
  }, [movements, dateRange]);

  const stackedMovements = useMemo(() => {
    return groupMovementsByDateAndProduct(filteredMovements);
  }, [filteredMovements]);

  // Derived Paginated Data
  const totalLowStockPages = Math.ceil(lowStockItems.length / lowStockPageSize) || 1;
  const paginatedLowStockItems = useMemo(() => {
    const start = (lowStockPage - 1) * lowStockPageSize;
    return lowStockItems.slice(start, start + lowStockPageSize);
  }, [lowStockItems, lowStockPage, lowStockPageSize]);

  const currentMovementsList = viewMode === 'stacked' ? stackedMovements : filteredMovements;

  const totalMovementsPages = Math.ceil(currentMovementsList.length / movementsPageSize) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (movementsPage - 1) * movementsPageSize;
    return currentMovementsList.slice(start, start + movementsPageSize);
  }, [currentMovementsList, movementsPage, movementsPageSize]);

  function handleAdjusted() {
    setAdjustOpen(false);
    load();
    getOverview().then(setSummary).catch(() => {});
  }

  const outOfStockCount = useMemo(() => {
    return lowStockItems.filter((p) => Number(p.stock_quantity || 0) === 0).length;
  }, [lowStockItems]);

  const stockQty = summary?.inventory?.quantityInHand || 0;
  const toBeReceived = summary?.inventory?.toBeReceived || 0;

  return (
    <div className="space-y-6 text-gray-900">
      <AdjustStockModal open={adjustOpen} onClose={() => setAdjustOpen(false)} onSaved={handleAdjusted} />

      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Stock and Movement</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory levels, daily stock movements, and system audit log</p>
        </div>
        <Button onClick={() => setAdjustOpen(true)} className="bg-red-600 hover:bg-red-700 shadow-md rounded-xl text-xs font-bold">
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
          />
          <MicroStatCard
            title="To Be Received"
            subtitle="Pending Shipments"
            value={Number(toBeReceived).toLocaleString()}
          />
          <MicroStatCard
            title="Low Stock Alerts"
            subtitle="Reorder Required"
            value={lowStockItems.length.toString()}
          />
          <MicroStatCard
            title="Out of Stock"
            subtitle="Critical Outages"
            value={outOfStockCount.toString()}
          />
        </div>
      </motion.section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 size={16} className="animate-spin text-red-600" />
          Loading inventory movements...
        </div>
      ) : (
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-6 w-full">
          {/* Low Stock Alerts (Full Width Row) */}
          <section className="w-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-700" />
                  Low Stock Alerts ({lowStockItems.length})
                </h2>
                {lowStockItems.length > 0 && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    Page {lowStockPage} of {totalLowStockPages}
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xs divide-y divide-gray-100 overflow-hidden w-full">
                {lowStockItems.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-500">Nothing below its reorder threshold right now.</p>
                )}
                {paginatedLowStockItems.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}/edit`} className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-gray-900 font-bold">{p.name}</p>
                      <p className="font-mono text-xs text-gray-500">{p.sku} · <Badge>{formatCategory(p.category)}</Badge></p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-gray-900 font-bold">{p.stock_quantity} / {p.reorder_threshold}</p>
                      <Badge variant="warning">Low Stock</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Low Stock Shadcn UI Pagination Controls */}
            {lowStockItems.length > lowStockPageSize && (
              <div className="pt-3 border-t border-gray-100 mt-3 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={lowStockPage <= 1}
                        onClick={() => setLowStockPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalLowStockPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === lowStockPage}
                          onClick={() => setLowStockPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        disabled={lowStockPage >= totalLowStockPages}
                        onClick={() => setLowStockPage((p) => Math.min(totalLowStockPages, p + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </section>

          {/* Movements Table / Audit Log Section (Full Width Row at Bottom) */}
          <section className="w-full">
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <ClipboardList size={15} />
                  {viewMode === 'stacked' ? 'Stacked Daily Movements' : 'All Raw Movement Logs'}
                </h2>

                {/* View Switcher & Date Range Picker Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={(d) => {
                      setDateRange(d);
                      setMovementsPage(1);
                    }}
                  />

                  <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('stacked');
                        setMovementsPage(1);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        viewMode === 'stacked' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Layers size={13} />
                      Stacked
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('raw');
                        setMovementsPage(1);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        viewMode === 'raw' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ListFilter size={13} />
                      Raw Logs ({filteredMovements.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* MAIN TABLE */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs w-full">
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                  {/* 1. STACKED DAILY VIEW */}
                  {viewMode === 'stacked' && (
                    <>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-bold text-gray-700">Product & SKU</TableHead>
                          <TableHead className="font-bold text-gray-700">Daily Net Change</TableHead>
                          <TableHead className="font-bold text-gray-700">Activity</TableHead>
                          <TableHead className="font-bold text-gray-700">Date & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stackedMovements.length === 0 && (
                          <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Search size={24} className="text-gray-300" strokeWidth={1.5} />
                              No stock movements recorded yet.
                            </div>
                          </TableCell></TableRow>
                        )}
                        {paginatedMovements.map((g) => (
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
                      </TableBody>
                    </>
                  )}

                  {/* 2. UNSTACKED RAW LOGS VIEW */}
                  {viewMode === 'raw' && (
                    <>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-bold text-gray-700">Product & SKU</TableHead>
                          <TableHead className="font-bold text-gray-700">Change</TableHead>
                          <TableHead className="font-bold text-gray-700">Reason</TableHead>
                          <TableHead className="font-bold text-gray-700">Date & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.length === 0 && (
                          <TableRow><TableCell colSpan={4} className="py-10 text-center text-gray-500">
                            No stock movements recorded yet.
                          </TableCell></TableRow>
                        )}
                        {paginatedMovements.map((m) => (
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
                    </>
                  )}
                </Table>
              </div>
            </div>
            </div>

            {/* Movements / Audit Log Shadcn UI Pagination Controls */}
            {currentMovementsList.length > movementsPageSize && (
              <div className="pt-3 border-t border-gray-100 mt-3 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={movementsPage <= 1}
                        onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalMovementsPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === movementsPage}
                          onClick={() => setMovementsPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        disabled={movementsPage >= totalMovementsPages}
                        onClick={() => setMovementsPage((p) => Math.min(totalMovementsPages, p + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </section>
        </motion.div>
      )}
    </div>
  );
}
