import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Activity, PackageCheck, AlertTriangle, TrendingUp, AlertOctagon, Layers, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getOverview, getSalesPurchaseChart, getOrderSummaryChart, getTopSelling } from '../api/dashboard.js';
import { lowStock } from '../api/inventory.js';
import { listProducts } from '../api/products.js';
import { CATEGORIES, formatCategory } from '../constants.js';
import { soundService } from '../lib/sound.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import ProductThumb from '../components/ProductThumb.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';

function CustomCategoryStockTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isOutOfStock = Number(data.stock_quantity) === 0;
  const isLowStock = Number(data.stock_quantity) > 0 && Number(data.stock_quantity) <= Number(data.reorder_threshold);

  return (
    <div className="rounded-xl bg-[#09090b] p-3 text-white shadow-xl text-xs space-y-1.5 max-w-xs border border-gray-800">
      <p className="font-bold text-sm text-gray-100">{data.name}</p>
      <p className="text-gray-400 font-mono text-[11px]">SKU: {data.sku} &bull; Category: {formatCategory(data.category || 'other')}</p>
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-800 text-xs">
        <span className="text-gray-300">Stock On Hand:</span>
        <span className="font-extrabold text-white tabular-nums">{data.stock_quantity} {data.unit || 'pc'}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-gray-300">Reorder Threshold:</span>
        <span className="font-semibold text-gray-400 tabular-nums">{data.reorder_threshold} {data.unit || 'pc'}</span>
      </div>
      <div className="pt-1 flex items-center justify-between">
        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Status:</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          isOutOfStock ? 'bg-rose-950 text-rose-300 border border-rose-800' :
          isLowStock ? 'bg-amber-950 text-amber-300 border border-amber-800' :
          'bg-emerald-950 text-emerald-300 border border-emerald-800'
        }`}>
          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Healthy'}
        </span>
      </div>
    </div>
  );
}

const BLUE = '#2563EB';
const GREEN = '#10B981';
const AMBER = '#F59E0B';

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' });
}

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

// Default high-visual fallback data for initial system setup
const DEFAULT_MOVEMENT_DATA = [
  { label: 'Wk 1', purchase: 45, sales: 32 },
  { label: 'Wk 2', purchase: 65, sales: 48 },
  { label: 'Wk 3', purchase: 35, sales: 58 },
  { label: 'Wk 4', purchase: 85, sales: 72 },
  { label: 'Wk 5', purchase: 55, sales: 64 },
  { label: 'Wk 6', purchase: 95, sales: 88 },
];

const DEFAULT_SHIPMENT_DATA = [
  { label: 'May', ordered: 14, delivered: 12 },
  { label: 'Jun', ordered: 20, delivered: 18 },
  { label: 'Jul', ordered: 16, delivered: 16 },
  { label: 'Aug', ordered: 26, delivered: 24 },
  { label: 'Sep', ordered: 32, delivered: 30 },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [salesPurchase, setSalesPurchase] = useState([]);
  const [orderSummary, setOrderSummary] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [lowQuantity, setLowQuantity] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [audioOn, setAudioOn] = useState(soundService.isAudioEnabled());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview(),
      getSalesPurchaseChart({ period: 'week' }),
      getOrderSummaryChart(),
      getTopSelling(),
      lowStock({}),
      listProducts({ pageSize: 100, is_active: true }),
    ])
      .then(([o, sp, os, ts, ls, prodRes]) => {
        setOverview(o || {});
        if (Array.isArray(sp) && sp.length > 0) {
          setSalesPurchase(sp.map((b) => ({ ...b, label: monthLabel(b.label) })));
        } else {
          setSalesPurchase(DEFAULT_MOVEMENT_DATA);
        }
        if (Array.isArray(os) && os.length > 0) {
          setOrderSummary(os.map((b) => ({ ...b, label: monthLabel(b.label) })));
        } else {
          setOrderSummary(DEFAULT_SHIPMENT_DATA);
        }
        setTopSelling(Array.isArray(ts) ? ts : []);
        setLowQuantity(Array.isArray(ls) ? ls : []);
        setAllProducts(prodRes?.items || []);
      })
      .catch((err) => {
        toast.error(err.message);
        setOverview({});
        setSalesPurchase(DEFAULT_MOVEMENT_DATA);
        setOrderSummary(DEFAULT_SHIPMENT_DATA);
        setTopSelling([]);
        setLowQuantity([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
        <Loader2 size={28} className="animate-spin text-red-600" />
        <span className="text-sm font-medium">Loading dashboard analytics...</span>
      </div>
    );
  }

  const stockQty = overview?.inventory?.quantityInHand || 0;
  const toBeReceived = overview?.inventory?.toBeReceived || 0;
  const salesCount = overview?.sales?.count || 0;

  const outOfStockCount = overview?.inventory?.outOfStockCount ?? lowQuantity.filter((p) => Number(p.stock_quantity) === 0).length;
  const lowStockCount = overview?.inventory?.lowStockCount ?? lowQuantity.filter((p) => Number(p.stock_quantity) > 0).length;

  const movementData = salesPurchase.length > 0 ? salesPurchase : DEFAULT_MOVEMENT_DATA;
  const shipmentData = orderSummary.length > 0 ? orderSummary : DEFAULT_SHIPMENT_DATA;

  const categoryFilteredProducts = (
    selectedCategory === 'all'
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory)
  )
    .slice(0, 10)
    .map((p) => ({
      ...p,
      shortName: p.name.length > 15 ? p.name.slice(0, 13) + '...' : p.name,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dashboard Title Header */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory overview, stock velocity, and reorder alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newState = !audioOn;
              soundService.setAudioEnabled(newState);
              setAudioOn(newState);
              if (newState) toast.success('Audio alerts enabled');
            }}
            className="rounded-xl border-gray-200 text-xs font-semibold shadow-xs hover:bg-gray-50 transition-all"
          >
            {audioOn ? <Volume2 size={16} className="text-emerald-600" /> : <VolumeX size={16} className="text-gray-400" />}
            Audio Signals: {audioOn ? 'ON' : 'OFF'}
          </Button>
        </div>
      </motion.div>

      {/* LAYER 1: CLEAN BENTO GRID (Hero Essential Metric + 4 Clean Metric Bento Cards) */}
      <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* HERO BENTO CARD: Total Inventory Units On Hand */}
          <div className="lg:col-span-6 rounded-3xl bg-[#09090b] p-8 text-white shadow-xl border border-gray-800 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              Total Inventory Units On Hand
            </span>
            <div className="mt-4 flex items-baseline gap-3">
              <h2 className="font-display text-6xl font-extrabold tracking-tight text-white tabular-nums">
                {Number(stockQty).toLocaleString()}
              </h2>
              <span className="text-lg font-semibold text-gray-400">Units</span>
            </div>
          </div>

          {/* RIGHT SIDE BENTO GRID: 4 Clean Metric Bento Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* CARD 1: Out of Stock (P0 Critical) */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 shadow-xs flex flex-col justify-center transition-all hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Out of Stock</span>
                <span className="rounded-full bg-rose-100 p-1.5 text-rose-700">
                  <AlertOctagon size={16} />
                </span>
              </div>
              <div className="mt-3 font-display text-4xl font-extrabold text-rose-950 tabular-nums">
                {outOfStockCount}
              </div>
              <p className="text-xs font-semibold text-rose-800 mt-1">
                {outOfStockCount > 0 ? `${outOfStockCount} critical stockouts` : 'Zero stockout outages'}
              </p>
            </div>

            {/* CARD 2: Low Stock Warning (P1 Warning) */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-xs flex flex-col justify-center transition-all hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Low Stock</span>
                <span className="rounded-full bg-amber-100 p-1.5 text-amber-700">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="mt-3 font-display text-4xl font-extrabold text-amber-950 tabular-nums">
                {lowStockCount}
              </div>
              <p className="text-xs font-semibold text-amber-800 mt-1">
                {lowStockCount > 0 ? `${lowStockCount} parts near limit` : 'No reorder warnings'}
              </p>
            </div>

            {/* CARD 3: To Be Received */}
            <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-6 shadow-xs flex flex-col justify-center transition-all hover:shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">To Be Received</span>
              <div className="mt-3 font-display text-4xl font-extrabold text-blue-950 tabular-nums">
                {Number(toBeReceived).toLocaleString()}
              </div>
              <p className="text-xs font-semibold text-blue-700 mt-1">
                Pending Shipments
              </p>
            </div>

            {/* CARD 4: Outbound Dispatched */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-center transition-all hover:shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Outbound Dispatched</span>
              <div className="mt-3 font-display text-4xl font-extrabold text-gray-900 tabular-nums">
                {Number(salesCount).toLocaleString()}
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                Dispatched Sales Units
              </p>
            </div>

          </div>
        </div>
      </motion.section>

      {/* LAYER 2: High-Impact Visual Area Charts */}
      <motion.section custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Graph 1: Category Product Stock Status Bar Chart */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base flex items-center gap-2">
                  <Layers size={18} className="text-red-600" />
                  Category Stock Status
                </h3>
                <p className="text-xs text-gray-500">Product stock levels vs reorder safety thresholds per category</p>
              </div>

              {/* Category Dropdown Filter */}
              <div className="flex items-center gap-2 min-w-[190px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-gray-50 font-medium border-gray-200">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-64 w-full">
              {categoryFilteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400">
                  No active products found in this category.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryFilteredProducts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={11}
                      stroke="#64748B"
                      interval={0}
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#64748B" />
                    <Tooltip content={<CustomCategoryStockTooltip />} />
                    <Bar dataKey="stock_quantity" name="Stock On Hand" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {categoryFilteredProducts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            Number(entry.stock_quantity) === 0
                              ? '#F43F5E'
                              : Number(entry.stock_quantity) <= Number(entry.reorder_threshold)
                              ? '#F59E0B'
                              : '#10B981'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Graph 2: Shipment Delivery & Stock Fulfillment (Glowing Bezier Line Area Chart) */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base flex items-center gap-2">
                  <PackageCheck size={18} className="text-emerald-600" />
                  Shipment Delivery &amp; Stock Fulfillment
                </h3>
                <p className="text-xs text-gray-500">Tracking purchase shipments ordered vs stock units delivered into inventory</p>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Fulfillment Rate
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shipmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="shipmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BLUE} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={BLUE} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#64748B" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="ordered" name="Ordered Shipments" stroke={AMBER} strokeWidth={2.5} fillOpacity={1} fill="url(#shipmentGrad)" />
                  <Area type="monotone" dataKey="delivered" name="Delivered into Stock" stroke={BLUE} strokeWidth={2.5} fillOpacity={1} fill="url(#deliveredGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>

      {/* LAYER 3: Stock Reorder Alerts & Fast-Moving Auto Parts */}
      <motion.section custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Alert Card 1: Low Quantity Stock */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 text-base">Low Quantity Reorder Alerts</h3>
                    <p className="text-xs text-gray-500">Parts below minimum threshold requiring supplier reorder</p>
                  </div>
                </div>
                <Link to="/inventory" className="text-xs font-bold text-red-600 hover:underline">
                  View All ({lowQuantity.length})
                </Link>
              </div>

              {lowQuantity.length === 0 ? (
                <p className="flex flex-col items-center gap-2 p-10 text-center text-sm text-gray-500">
                  <PackageCheck size={28} className="text-emerald-500" />
                  All auto parts are currently well-stocked.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 p-5 pt-1">
                  {lowQuantity.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductThumb product={p} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 font-mono">SKU: {p.sku} &bull; Threshold: {p.reorder_threshold}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 tabular-nums">
                          {p.stock_quantity} {p.unit}
                        </span>
                        <Badge variant={p.stock_quantity === 0 ? 'destructive' : 'warning'}>
                          {p.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alert Card 2: Top Selling Fast Movers */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 text-base">Top Selling Fast Movers</h3>
                    <p className="text-xs text-gray-500">Most requested auto parts by stock movement volume</p>
                  </div>
                </div>
                <Link to="/products" className="text-xs font-bold text-red-600 hover:underline">
                  Full Catalog
                </Link>
              </div>

              {topSelling.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-gray-500">No stock movement recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50/60">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Product</TableHead>
                      <TableHead className="font-semibold text-gray-700">Units Sold</TableHead>
                      <TableHead className="font-semibold text-gray-700">Current Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSelling.slice(0, 4).map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</TableCell>
                        <TableCell className="tabular-nums font-semibold text-emerald-700">{p.sold_quantity} pc</TableCell>
                        <TableCell className="tabular-nums font-bold text-gray-900">{p.stock_quantity} pc</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.stock_quantity <= 5 ? 'warning' : 'success'}>
                            {p.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
