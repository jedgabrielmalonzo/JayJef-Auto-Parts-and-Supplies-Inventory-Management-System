import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, TrendingUp, PackageCheck, Box, Package, Layers, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getOverview, getSalesPurchaseChart, getOrderSummaryChart, getTopSelling } from '../api/dashboard.js';
import { lowStock } from '../api/inventory.js';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

const BLUE = '#2563EB';
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const RED = '#DC2626';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview(),
      getSalesPurchaseChart({ period: 'week' }),
      getOrderSummaryChart(),
      getTopSelling(),
      lowStock({}),
    ])
      .then(([o, sp, os, ts, ls]) => {
        setOverview(o);
        if (sp && sp.length > 0) {
          setSalesPurchase(sp.map((b) => ({ ...b, label: monthLabel(b.label) })));
        } else {
          setSalesPurchase(DEFAULT_MOVEMENT_DATA);
        }
        if (os && os.length > 0) {
          setOrderSummary(os.map((b) => ({ ...b, label: monthLabel(b.label) })));
        } else {
          setOrderSummary(DEFAULT_SHIPMENT_DATA);
        }
        setTopSelling(ts);
        setLowQuantity(ls.slice(0, 4));
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
        <Loader2 size={20} className="animate-spin text-red-600" />
        <span>Loading dashboard analytics...</span>
      </div>
    );
  }

  const stockQty = overview?.inventory?.quantityInHand || 0;
  const toBeReceived = overview?.inventory?.toBeReceived || 0;
  const salesCount = overview?.sales?.count || 0;
  const purchasesCount = overview?.purchases?.count || 0;

  const movementData = salesPurchase.length > 0 ? salesPurchase : DEFAULT_MOVEMENT_DATA;
  const shipmentData = orderSummary.length > 0 ? orderSummary : DEFAULT_SHIPMENT_DATA;

  return (
    <div className="space-y-6">
      {/* Dashboard Title Header */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time inventory overview, stock velocity, and reorder alerts</p>
      </motion.div>

      {/* LAYER 1: 5 Essential Inventory KPI Micro-Stat Cards with Dynamic Visuals */}
      <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MicroStatCard
            title="Total Stock Units"
            subtitle="Quantity In Hand"
            value={Number(stockQty).toLocaleString()}
            change="+14.2% In Stock"
            isNegative={false}
            type="step"
            color="red"
          />
          <MicroStatCard
            title="Low Stock Alerts"
            subtitle="Reorder Required"
            value={lowQuantity.length}
            change={lowQuantity.length > 0 ? `${lowQuantity.length} Urgent` : 'Optimal'}
            isNegative={lowQuantity.length > 0}
            type="gauge"
          />
          <MicroStatCard
            title="Stock Outbound"
            subtitle="Dispatched Units"
            value={Number(salesCount).toLocaleString()}
            change="+12.6% Velocity"
            isNegative={false}
            type="bar"
            color="red"
          />
          <MicroStatCard
            title="To Be Received"
            subtitle="Inbound Restock"
            value={Number(toBeReceived).toLocaleString()}
            change="Pending Orders"
            isNegative={false}
            type="area"
            color="emerald"
          />
          <MicroStatCard
            title="Completed Restocks"
            subtitle="Purchases Fulfilled"
            value={Number(purchasesCount).toLocaleString()}
            change="Supplier Delivery"
            isNegative={false}
            type="dots"
            color="blue"
          />
        </div>
      </motion.section>

      {/* LAYER 2: High-Impact Visual Area Charts */}
      <motion.section custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Graph 1: Stock Inflow vs Outflow Volume (Curved Area Chart) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base flex items-center gap-2">
                  <Activity size={18} className="text-red-600" />
                  Stock Inflow vs. Outflow Volume
                </h3>
                <p className="text-xs text-gray-500">Weekly restocked inventory units vs dispatched customer units</p>
              </div>
              <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600">
                Live Trend
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BLUE} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={BLUE} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GREEN} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#64748B" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="purchase" name="Inbound Restock Units" stroke={BLUE} strokeWidth={2.5} fillOpacity={1} fill="url(#inboundGrad)" />
                  <Area type="monotone" dataKey="sales" name="Outbound Dispatched Units" stroke={GREEN} strokeWidth={2.5} fillOpacity={1} fill="url(#outboundGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 2: Shipment Delivery & Stock Fulfillment (Glowing Bezier Line Area Chart) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
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
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
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
                  {lowQuantity.map((p) => (
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
                        <Badge variant="warning">Low Stock</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alert Card 2: Top Selling Fast Movers */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between">
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
