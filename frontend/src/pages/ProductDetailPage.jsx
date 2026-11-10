import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Pencil, Loader2, Tag, Box, MapPin, Truck, FileText,
  Plus, Minus, DollarSign, Layers, Activity, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { getProduct } from '../api/products.js';
import { listMovements, createMovement } from '../api/inventory.js';
import { formatCategory, MOVEMENT_REASON_LABELS, availability } from '../constants.js';
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
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${m.quantity_change >= 0
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
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStock, setUpdatingStock] = useState(false);

  const loadData = async () => {
    try {
      const p = await getProduct(id);
      setProduct(p);
      const movementsRes = await listMovements({ product_id: id, page_size: 100 });
      setMovements(movementsRes.items || []);
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
        note: delta < 0 ? '1-Click Quick Deduction (-1)' : '1-Click Quick Restock (+1)',
      });
      toast.success(
        delta < 0
          ? `Deducted 1 unit of "${product.name}" (Stock: ${newQty})`
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
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Product Catalog
        </Link>
      </motion.div>

      {/* Main Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-4">
          <ProductThumb
            src={product.image_path}
            alt={product.name}
            className="size-16 sm:size-20 rounded-2xl border border-gray-200/80 shadow-xs shrink-0"
            iconSize={32}
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                {product.sku}
              </span>
              <Badge variant="outline" className="font-semibold text-xs border-gray-200 text-gray-700">
                {formatCategory(product.category)}
              </Badge>
              {isLow && (
                <Badge variant="destructive" className="flex items-center gap-1 font-bold text-xs bg-amber-500">
                  <AlertTriangle size={12} /> Low Stock Alert
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Brand: <span className="font-bold text-gray-700">{product.brand || 'Unbranded'}</span>
              {locationText && (
                <> • Bin/Aisle: <span className="font-bold text-gray-700">{locationText}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 shadow-xs transition-all"
          >
            <Pencil size={15} />
            Edit Product
          </Button>
        </div>
      </motion.div>

      {/* Detail Content with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60 max-w-md">
            <TabsTrigger value="overview" className="rounded-xl font-bold text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="rounded-xl font-bold text-xs">
              Adjustments ({adjustments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-bold text-xs">
              Full Movement History ({movements.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stock & Pricing Summary Card */}
              <Card className="p-6 border-gray-200/90 rounded-3xl shadow-xs space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Live Inventory Count</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black font-heading text-gray-900 tabular-nums">
                      {product.stock_quantity}
                    </span>
                    <span className="text-sm font-bold text-gray-500">{product.unit || 'units'}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant={avail.badgeVariant} className="font-bold text-xs">
                      {avail.label}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Reorder Alert Threshold</span>
                    <span className="font-bold text-gray-900 tabular-nums">{product.reorder_threshold} units</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Purchase Cost</span>
                    <span className="font-bold text-gray-900">{peso(product.cost_price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Selling Price</span>
                    <span className="font-bold text-emerald-600 font-mono text-base">{peso(product.selling_price)}</span>
                  </div>
                </div>

                {/* 1-Click Fast Stock Adjuster */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    Quick Stock Adjustment
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={updatingStock || product.stock_quantity <= 0}
                      onClick={() => handleQuickAdjust(-1)}
                      variant="outline"
                      className="flex-1 rounded-xl border-gray-300 hover:border-red-600 hover:text-red-700 font-bold text-xs py-2.5 shadow-xs"
                    >
                      <Minus size={14} strokeWidth={3} />
                      Deduct (-1)
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

              {/* Technical Specifications */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-gray-200/90 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <Box size={18} className="text-red-600" />
                    <h3 className="font-heading text-base font-bold text-gray-900">Technical Specifications</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-500">Part Number</span>
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
                        <Truck size={14} className="text-gray-400" /> Compatible Vehicles / Units
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
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ADJUSTMENTS */}
          <TabsContent value="adjustments" className="mt-6">
            <Card className="overflow-hidden border-gray-200/90 rounded-3xl shadow-xs">
              <MovementsTable movements={adjustments} emptyText="No manual adjustments or corrections recorded for this product yet." />
            </Card>
          </TabsContent>

          {/* TAB 3: FULL HISTORY */}
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
