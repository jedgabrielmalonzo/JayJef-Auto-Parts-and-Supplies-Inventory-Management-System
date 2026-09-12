import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ClipboardList, Loader2, PlusCircle, Search, Layers, ListFilter, Calendar, Clock, ChevronLeft, ChevronRight
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

function ModalSection({ title, children }) {
  return (
    <section className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ModalField({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function AdjustStockModal({ open, onClose, onSaved }) {
  // Mode: 'single' | 'bundle'
  const [mode, setMode] = useState('single');

  // Single adjustment state
  const [product, setProduct] = useState(null);
  const [direction, setDirection] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('manual_adjustment');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Bundle adjustment state
  const [bundleItems, setBundleItems] = useState([]);
  const [bundleReason, setBundleReason] = useState('manual_adjustment');
  const [bundleNote, setBundleNote] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [addItemProduct, setAddItemProduct] = useState(null);

  // Modal Size State (Synchronized with localStorage)
  const [modalSize, setModalSize] = useState(() => {
    return localStorage.getItem('jayjef_modal_size') || 'standard';
  });

  const SIZE_CLASSES = {
    standard: 'sm:max-w-xl max-h-[90vh]',
    wide: 'sm:max-w-4xl max-h-[92vh]',
    'extra-wide': 'sm:max-w-6xl max-h-[94vh]',
    fullscreen: 'sm:max-w-[98vw] sm:w-[98vw] w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh]',
  };

  function changeModalSize(newSize) {
    setModalSize(newSize);
    localStorage.setItem('jayjef_modal_size', newSize);
  }

  // Load orders for bundle selection when modal opens
  useEffect(() => {
    if (open) {
      listOrders({ page_size: 100 })
        .then((res) => {
          setOrders(res?.items || []);
        })
        .catch(() => {});
    }
  }, [open]);

  // Handle loading line items from an existing order
  async function handleSelectOrder(orderId) {
    setSelectedOrderId(orderId);
    if (!orderId) return;

    setLoadingOrder(true);
    try {
      const order = await getOrder(orderId);
      const isPurchase = order.type === 'purchase';
      const items = (order.items || []).map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name || i.name || 'Unknown Product',
        product_sku: i.product_sku || i.sku || 'NO-SKU',
        quantity: i.quantity,
        direction: isPurchase ? 'in' : 'out',
      }));

      setBundleItems(items);
      setBundleReason(isPurchase ? 'purchase_order_received' : 'order_fulfillment');
      setBundleNote(`Imported from Order ${order.order_number}`);
      toast.success(`Loaded ${items.length} items from ${order.order_number}`);
    } catch (err) {
      toast.error(`Failed to load order items: ${err.message}`);
    } finally {
      setLoadingOrder(false);
    }
  }

  function handleAddProductToBundle(prod) {
    if (!prod) return;
    setBundleItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === prod.id);
      if (existingIdx >= 0) {
        toast.info(`Updated quantity for "${prod.name}"`);
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          product_name: prod.name,
          product_sku: prod.sku,
          quantity: 1,
          direction: 'in',
        },
      ];
    });
    setAddItemProduct(null);
  }

  function updateBundleItem(idx, field, value) {
    setBundleItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: field === 'quantity' ? Number(value) : value };
      return updated;
    });
  }

  function removeBundleItem(idx) {
    setBundleItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmitSingle(e) {
    e.preventDefault();
    if (!product || !quantity) return;
    setSaving(true);
    try {
      const qty = parseInt(quantity, 10);
      const change = direction === 'out' ? -Math.abs(qty) : Math.abs(qty);
      await createMovement({
        product_id: product.id,
        quantity_change: change,
        reason,
        note: note.trim() || undefined,
      });
      toast.success(`Adjusted ${product.name} by ${change > 0 ? `+${change}` : change}`);
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
      toast.error('Please add at least one item to the bundle.');
      return;
    }

    setSaving(true);
    try {
      const adjustments = bundleItems.map((item) => ({
        product_id: item.product_id,
        quantity_change: item.direction === 'out' ? -Math.abs(item.quantity) : Math.abs(item.quantity),
      }));

      await createBatchMovements({
        adjustments,
        reason: bundleReason,
        note: bundleNote.trim() || undefined,
        reference_order_id: selectedOrderId || undefined,
      });

      toast.success(`Successfully adjusted stock for ${bundleItems.length} items!`);
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${SIZE_CLASSES[modalSize] || SIZE_CLASSES.standard} overflow-y-auto rounded-2xl p-6 shadow-2xl border border-gray-200 transition-all duration-200`}>
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 pr-8">
          <DialogTitle className="font-heading text-xl font-bold text-gray-900">
            Adjust Stock
          </DialogTitle>

          {/* Modal Size Switcher matching ProductFormPage */}
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

        {/* Mode Switcher Segmented Control */}
        <div className="pt-1 pb-1">
          <div className="inline-flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-white text-gray-900 shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single Product
            </button>
            <button
              type="button"
              onClick={() => setMode('bundle')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'bundle'
                  ? 'bg-white text-gray-900 shadow-xs font-extrabold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Adjust by Bundle / Whole Order
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSubmitSingle} className="space-y-5 pt-2">
            <ModalSection title="Target Product">
              <ModalField label="Auto Part / Product" required>
                <ProductPicker selected={product} onSelect={setProduct} onClear={() => setProduct(null)} />
              </ModalField>
            </ModalSection>

            <ModalSection title="Stock Movement Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalField label="Movement Direction" required>
                  <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In (+)</SelectItem>
                      <SelectItem value="out">Stock Out (−)</SelectItem>
                    </SelectContent>
                  </Select>
                </ModalField>
                <ModalField label="Quantity" required>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="rounded-xl border-gray-300 font-mono text-sm tabular-nums focus:border-red-600"
                    required
                  />
                </ModalField>
              </div>
            </ModalSection>

            <ModalSection title="Reason & Documentation">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalField label="Adjustment Reason" required>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </ModalField>
                <ModalField label="Note / Reference (optional)">
                  <Input
                    placeholder="Reason for adjustment, PO #, etc."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="rounded-xl border-gray-300 text-sm"
                  />
                </ModalField>
              </div>
            </ModalSection>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button type="submit" disabled={saving || !product || !quantity} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md font-semibold">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Recording Movement...' : 'Record Movement'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl border border-gray-200">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitBundle} className="space-y-5 pt-2">
            <ModalSection title="Source Order or Custom Items">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalField label="Load Items from Existing Order">
                  <Select value={selectedOrderId} onValueChange={handleSelectOrder}>
                    <SelectTrigger className="w-full rounded-xl border-gray-300 text-xs">
                      <SelectValue placeholder="Select Order (PO / Invoice)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>
                          {o.order_number} ({o.type === 'purchase' ? 'PO' : 'Sale Invoice'}) — {o.party_name || o.supplier_name || 'No Party'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingOrder && <p className="text-xs text-gray-500">Loading order items...</p>}
                </ModalField>

                <ModalField label="Or Add Products Manually">
                  <ProductPicker selected={addItemProduct} onSelect={handleAddProductToBundle} onClear={() => setAddItemProduct(null)} placeholder="Search product to add to bundle..." />
                </ModalField>
              </div>
            </ModalSection>

            <ModalSection title={`Bundle Line Items (${bundleItems.length})`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Review quantities and direction before recording batch adjustments.</span>
                {bundleItems.length > 0 && (
                  <button type="button" onClick={() => setBundleItems([])} className="text-xs text-red-600 hover:underline font-semibold">
                    Clear All Items
                  </button>
                )}
              </div>

              {bundleItems.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-xl py-8 text-center text-xs text-gray-500 bg-gray-50/50">
                  No items in bundle. Select an order above or search and add products manually.
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
                  <div className="max-h-64 overflow-y-auto overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-bold text-gray-700">Product & SKU</TableHead>
                          <TableHead className="font-bold text-gray-700 w-32">Direction</TableHead>
                          <TableHead className="font-bold text-gray-700 w-24">Qty</TableHead>
                          <TableHead className="w-16 text-right font-bold text-gray-700">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bundleItems.map((item, idx) => (
                          <TableRow key={`${item.product_id}_${idx}`} className="hover:bg-gray-50/60">
                            <TableCell className="py-2">
                              <p className="font-bold text-gray-900">{item.product_name}</p>
                              <p className="font-mono text-[11px] text-gray-500">{item.product_sku}</p>
                            </TableCell>
                            <TableCell className="py-2">
                              <Select value={item.direction} onValueChange={(val) => updateBundleItem(idx, 'direction', val)}>
                                <SelectTrigger className="h-8 text-xs rounded-lg border-gray-300">
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
                                className="h-8 text-xs font-mono tabular-nums rounded-lg border-gray-300"
                              />
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <button type="button" onClick={() => removeBundleItem(idx)} className="text-xs text-red-600 hover:underline font-semibold">
                                Remove
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </ModalSection>

            <ModalSection title="Batch Reason & Documentation">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalField label="Batch Adjustment Reason" required>
                  <Select value={bundleReason} onValueChange={setBundleReason}>
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                      <SelectItem value="purchase_order_received">Purchase Order Restock</SelectItem>
                      <SelectItem value="order_fulfillment">Sales Order Fulfillment</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </ModalField>
                <ModalField label="Batch Note (optional)">
                  <Input
                    placeholder="Order #, Restock batch, etc."
                    value={bundleNote}
                    onChange={(e) => setBundleNote(e.target.value)}
                    className="rounded-xl border-gray-300 text-sm"
                  />
                </ModalField>
              </div>
            </ModalSection>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button type="submit" disabled={saving || bundleItems.length === 0} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md font-semibold">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Adjusting Stock...' : `Adjust Stock (${bundleItems.length} items)`}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl border border-gray-200">
                Cancel
              </Button>
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
