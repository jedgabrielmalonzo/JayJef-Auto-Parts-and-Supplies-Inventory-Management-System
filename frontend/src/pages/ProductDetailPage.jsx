import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Pencil, Loader2, Tag, Box, MapPin, Truck, FileText,
  Plus, Minus, Building2, DollarSign, Layers, Activity, AlertTriangle, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { getProduct, getProductPurchases } from '../api/products.js';
import { getSupplier } from '../api/suppliers.js';
import { listMovements, createMovement } from '../api/inventory.js';
import { formatCategory, MOVEMENT_REASON_LABELS, ORDER_STATUS_BADGE, availability } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

function peso(n) {
  return `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ADJUSTMENT_REASONS = ['manual_adjustment', 'correction'];

function MovementsTable({ movements, emptyText }) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity size={32} className="text-gray-300 mb-2" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-500">{emptyText}</p>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50/80">
          <TableHead className="font-bold text-gray-700">Change</TableHead>
          <TableHead className="font-bold text-gray-700">Reason</TableHead>
          <TableHead className="font-bold text-gray-700">Note / Reference</TableHead>
          <TableHead className="font-bold text-gray-700">Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id} className="hover:bg-gray-50/60 transition-colors">
            <TableCell className="tabular-nums font-bold">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                  m.quantity_change >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {m.quantity_change >= 0 ? `+${m.quantity_change}` : m.quantity_change}
              </span>
            </TableCell>
            <TableCell className="font-medium text-gray-900">
              {MOVEMENT_REASON_LABELS[m.reason] || m.reason}
            </TableCell>
            <TableCell className="text-gray-600 text-xs">{m.note || '—'}</TableCell>
            <TableCell className="text-gray-500 text-xs tabular-nums">
              {new Date(m.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStock, setUpdatingStock] = useState(false);

  const loadData = async () => {
    try {
      const p = await getProduct(id);
      setProduct(p);
      const [purchasesRes, movementsRes, supplierRes] = await Promise.all([
        getProductPurchases(id),
        listMovements({ product_id: id, page_size: 100 }),
        p.supplier_id ? getSupplier(p.supplier_id).catch(() => null) : null,
      ]);
      setPurchases(purchasesRes);
      setMovements(movementsRes.items);
      setSupplier(supplierRes);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleQuickAdjust(delta) {
    if (!product) return;
    if (delta < 0 && product.stock_quantity <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
      return;
    }

    setUpdatingStock(true);
    const newQty = Math.max(0, product.stock_quantity + delta);
    setProduct((prev) => ({ ...prev, stock_quantity: newQty }));

    try {
      await createMovement({
        product_id: product.id,
        quantity_change: delta,
        reason: 'manual_adjustment',
        note: delta < 0 ? '1-Click Quick Sale (-1)' : '1-Click Quick Restock (+1)',
      });
      toast.success(
        delta < 0
          ? `Sold 1 unit of "${product.name}" (Stock: ${newQty})`
          : `Restocked 1 unit to "${product.name}" (Stock: ${newQty})`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
      loadData();
    } finally {
      setUpdatingStock(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 size={28} className="animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) return null;

  const avail = availability(product);
  const isLow = product.stock_quantity <= product.reorder_threshold;
  const adjustments = movements.filter((m) => ADJUSTMENT_REASONS.includes(m.reason));
  const locationText = [product.location_aisle, product.location_shelf, product.location_bin].filter(Boolean).join(' / ');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back Navigation Button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Product Catalog
        </Link>
      </motion.div>

      {/* Header Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-black px-3 py-1 font-mono text-xs font-bold text-white shadow-xs">
                {product.sku}
              </span>
              <Badge variant="outline" className="font-semibold text-gray-700">
                {formatCategory(product.category)}
              </Badge>
              <Badge variant={avail.variant} className="font-bold">
                {avail.label}
              </Badge>
            </div>

            <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {product.brand && (
              <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                <Tag size={15} className="text-gray-400" />
                Brand: <span className="font-bold text-gray-800">{product.brand}</span>
              </p>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {product.location_aisle && (
              <Button
                variant="outline"
                onClick={() => navigate(`/map?search=${encodeURIComponent(product.sku)}`)}
                className="rounded-xl border-gray-300 hover:border-red-600 hover:text-red-600"
              >
                <MapPin size={16} />
                Find on Shop Map
              </Button>
            )}
            <Button
              render={<Link to={`/products/${product.id}/edit`} />}
              nativeButton={false}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md font-bold"
            >
              <Pencil size={16} />
              Edit Product
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Top 4 Key Metric Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Metric 1: Stock On Hand */}
        <Card className="p-5 border-gray-200/90 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Stock On Hand</span>
            <div className={`p-2 rounded-xl ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isLow ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-gray-900 tabular-nums">
              {product.stock_quantity}
            </span>
            <span className="text-xs font-semibold text-gray-500">{product.unit || 'pcs'}</span>
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-2">
            {isLow ? '⚠️ Below reorder limit' : '✅ Optimal inventory level'}
          </p>
        </Card>

        {/* Metric 2: Reorder Threshold */}
        <Card className="p-5 border-gray-200/90 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Reorder Threshold</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-gray-900 tabular-nums">
              {product.reorder_threshold}
            </span>
            <span className="text-xs font-semibold text-gray-500">{product.unit || 'pcs'}</span>
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-2">
            Minimum stock trigger limit
          </p>
        </Card>

        {/* Metric 3: Selling Price */}
        <Card className="p-5 border-gray-200/90 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Selling Price</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-emerald-700 tabular-nums">
              {peso(product.selling_price)}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-2">
            Customer retail price
          </p>
        </Card>

        {/* Metric 4: Cost Price */}
        <Card className="p-5 border-gray-200/90 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cost Price</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-extrabold text-gray-900 tabular-nums">
              {peso(product.cost_price)}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 border-t border-gray-100 pt-2">
            Supplier wholesale cost
          </p>
        </Card>
      </motion.div>

      {/* Main Tabs Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-100 p-1.5 rounded-2xl border border-gray-200/80 inline-flex">
            <TabsTrigger value="overview" className="rounded-xl px-5 py-2 text-xs font-bold transition-all">
              Overview & Specs
            </TabsTrigger>
            <TabsTrigger value="purchases" className="rounded-xl px-5 py-2 text-xs font-bold transition-all">
              Orders ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="rounded-xl px-5 py-2 text-xs font-bold transition-all">
              Adjustments ({adjustments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-5 py-2 text-xs font-bold transition-all">
              Movement History ({movements.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW & SPECS */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Media & Quick Action Card */}
              <Card className="p-6 border-gray-200/90 rounded-3xl shadow-xs flex flex-col justify-between items-center text-center">
                <div className="w-full space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Product Media</span>
                  <div className="relative mx-auto h-52 w-full max-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-inner">
                    <ProductThumb product={product} size="h-full w-full object-cover" />
                  </div>
                </div>

                {/* Inline Quick Stock Actions */}
                <div className="mt-6 w-full pt-4 border-t border-gray-100 space-y-3">
                  <span className="text-xs font-semibold text-gray-500 block">1-Click Quick Adjustments</span>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      disabled={product.stock_quantity <= 0 || updatingStock}
                      onClick={() => handleQuickAdjust(-1)}
                      className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 shadow-xs"
                    >
                      <Minus size={14} strokeWidth={3} />
                      1 Sold (-1)
                    </Button>
                    <Button
                      disabled={updatingStock}
                      onClick={() => handleQuickAdjust(1)}
                      variant="outline"
                      className="flex-1 rounded-xl border-gray-300 hover:border-emerald-600 hover:text-emerald-700 font-bold text-xs py-2.5 shadow-xs"
                    >
                      <Plus size={14} strokeWidth={3} />
                      Restock (+1)
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Technical Specifications & Supplier Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Specifications Card */}
                <Card className="p-6 border-gray-200/90 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <Box size={18} className="text-red-600" />
                    <h3 className="font-heading text-base font-bold text-gray-900">Technical Specifications</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500">Stock Keeping Unit (SKU)</span>
                      <p className="font-mono text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/80 inline-block">
                        {product.sku}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500">Category</span>
                      <p className="font-semibold text-gray-900">{formatCategory(product.category)}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500">Manufacturer / Brand</span>
                      <p className="font-semibold text-gray-900">{product.brand || 'Unspecified'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500">Count Unit</span>
                      <p className="font-semibold text-gray-900">{product.unit || 'pc'}</p>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Truck size={14} className="text-gray-400" /> Compatible Vehicles
                      </span>
                      <p className="font-medium text-gray-800 bg-gray-50/80 p-3 rounded-xl border border-gray-200/60">
                        {product.compatible_vehicles || 'No specific vehicle fitment notes recorded.'}
                      </p>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" /> Shop Floor Storage Location
                      </span>
                      <p className="font-bold text-gray-900 bg-gray-50/80 p-3 rounded-xl border border-gray-200/60 flex items-center gap-2">
                        {locationText ? (
                          <>
                            <span className="inline-block size-2 rounded-full bg-red-600" />
                            {locationText}
                          </>
                        ) : (
                          <span className="text-gray-400 font-normal">Unassigned (Aisle / Shelf / Bin not set)</span>
                        )}
                      </p>
                    </div>

                    {product.notes && (
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <FileText size={14} className="text-gray-400" /> Internal Notes
                        </span>
                        <p className="text-gray-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs leading-relaxed">
                          {product.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Supplier Card */}
                {supplier && (
                  <Card className="p-6 border-gray-200/90 rounded-3xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Building2 size={18} className="text-red-600" />
                      <h3 className="font-heading text-base font-bold text-gray-900">Primary Supplier Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Supplier Name</span>
                        <p className="font-bold text-gray-900 mt-0.5">{supplier.name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Contact Person</span>
                        <p className="font-semibold text-gray-800 mt-0.5">{supplier.contact_person || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Phone Number</span>
                        <p className="font-mono text-gray-800 mt-0.5">{supplier.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 block">Email Address</span>
                        <p className="text-gray-800 mt-0.5">{supplier.email || '—'}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: PURCHASES & SALES */}
          <TabsContent value="purchases" className="mt-6">
            <Card className="overflow-hidden border-gray-200/90 rounded-3xl shadow-xs">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={36} className="text-gray-300 mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-gray-500">No purchase or sale orders include this product yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="font-bold text-gray-700">Order #</TableHead>
                      <TableHead className="font-bold text-gray-700">Type / Counterparty</TableHead>
                      <TableHead className="font-bold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-bold text-gray-700">Unit Price</TableHead>
                      <TableHead className="font-bold text-gray-700">Line Total</TableHead>
                      <TableHead className="font-bold text-gray-700">Status</TableHead>
                      <TableHead className="font-bold text-gray-700">Order Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((o) => (
                      <TableRow key={`${o.order_id}`} className="hover:bg-gray-50/60 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-red-600">
                          {o.order_number}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {o.supplier_name || o.party_name || 'Counterparty N/A'}
                        </TableCell>
                        <TableCell className="tabular-nums font-bold text-gray-900">
                          {o.quantity}
                        </TableCell>
                        <TableCell className="tabular-nums font-medium text-gray-800">
                          {peso(o.unit_price)}
                        </TableCell>
                        <TableCell className="tabular-nums font-bold text-gray-900">
                          {peso(o.line_total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ORDER_STATUS_BADGE[o.status]} className="font-bold uppercase text-[10px]">
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs tabular-nums">
                          {new Date(o.order_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: ADJUSTMENTS */}
          <TabsContent value="adjustments" className="mt-6">
            <Card className="overflow-hidden border-gray-200/90 rounded-3xl shadow-xs">
              <MovementsTable movements={adjustments} emptyText="No manual adjustments or corrections recorded for this product yet." />
            </Card>
          </TabsContent>

          {/* TAB 4: HISTORY */}
          <TabsContent value="history" className="mt-6">
            <Card className="overflow-hidden border-gray-200/90 rounded-3xl shadow-xs">
              <MovementsTable movements={movements} emptyText="No stock movements recorded for this product yet." />
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
