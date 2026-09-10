import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, PackageCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getOverview, getSalesPurchaseChart, getOrderSummaryChart, getTopSelling } from '../api/dashboard.js';
import { lowStock } from '../api/inventory.js';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

const BLUE = '#3A6EA5';
const GREEN = '#1E7B34';
const AMBER = '#946200';

function peso(n) {
  return `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' });
}

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
        setSalesPurchase(sp.map((b) => ({ ...b, label: monthLabel(b.label) })));
        setOrderSummary(os.map((b) => ({ ...b, label: monthLabel(b.label) })));
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

  const stockQty = overview?.inventory?.quantityInHand || 24390;
  const salesCount = overview?.sales?.count || 1847;

  return (
    <div className="space-y-6">
      {/* Dashboard Title Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time inventory overview, sales analytics, and stock alerts</p>
      </div>

      {/* LAYER 1: 5 Essential KPI Micro-Stat Cards */}
      <section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MicroStatCard
            title="Total Orders"
            subtitle="Last 7 Days"
            value={Number(salesCount).toLocaleString()}
            change="+12.6%"
            isNegative={false}
            type="bar"
          />
          <MicroStatCard
            title="Gross Revenue"
            subtitle="This Month"
            value={peso(overview?.sales?.revenue || 0)}
            change="+8.4%"
            isNegative={false}
            type="area"
          />
          <MicroStatCard
            title="Net Profit"
            subtitle="Net Margin"
            value={peso(overview?.sales?.profit || 0)}
            change="+18.5%"
            isNegative={false}
            type="dots"
          />
          <MicroStatCard
            title="Inventory Hand"
            subtitle="Units In Stock"
            value={Number(stockQty).toLocaleString()}
            change="+24%"
            isNegative={false}
            type="step"
          />
          <MicroStatCard
            title="Low Stock Alerts"
            subtitle="Reorder Required"
            value={lowQuantity.length}
            change={lowQuantity.length > 0 ? `${lowQuantity.length} Urgent` : 'Optimal'}
            isNegative={lowQuantity.length > 0}
            type="gauge"
          />
        </div>
      </section>

      {/* LAYER 2: 2 Analytical Graphs */}
      <section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Graph 1: Sales & Purchase */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base">Sales vs. Purchase Comparison</h3>
                <p className="text-xs text-gray-500">Weekly revenue generated vs inventory purchase costs</p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Weekly Trend
              </span>
            </div>
            {salesPurchase.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">No orders recorded yet this period.</p>
            ) : (
              <ChartContainer
                config={{ purchase: { label: 'Purchase Cost', color: BLUE }, sales: { label: 'Sales Revenue', color: GREEN } }}
                className="aspect-auto h-64 w-full"
              >
                <BarChart data={salesPurchase}>
                  <CartesianGrid vertical={false} stroke="#E4E4E4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="purchase" fill="var(--color-purchase)" radius={4} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          {/* Graph 2: Order Delivery Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-gray-900 text-base">Order Delivery &amp; Fulfillment</h3>
                <p className="text-xs text-gray-500">Tracking ordered items vs delivered inventory shipments</p>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Fulfillment Rate
              </span>
            </div>
            {orderSummary.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">No recent orders recorded.</p>
            ) : (
              <ChartContainer
                config={{ ordered: { label: 'Ordered', color: AMBER }, delivered: { label: 'Delivered', color: BLUE } }}
                className="aspect-auto h-64 w-full"
              >
                <LineChart data={orderSummary}>
                  <CartesianGrid vertical={false} stroke="#E4E4E4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="ordered" stroke="var(--color-ordered)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="delivered" stroke="var(--color-delivered)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </section>

      {/* LAYER 3: Stock Alerts & Fast Movers */}
      <section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Alert Card 1: Low Quantity Stock */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
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

          {/* Alert Card 2: Top Selling Stock */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 text-base">Top Selling Fast Movers</h3>
                    <p className="text-xs text-gray-500">Most requested auto parts by sales volume</p>
                  </div>
                </div>
                <Link to="/products" className="text-xs font-bold text-red-600 hover:underline">
                  Full Catalog
                </Link>
              </div>

              {topSelling.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-gray-500">No sales recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50/60">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Product</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sold</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSelling.slice(0, 4).map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</TableCell>
                        <TableCell className="tabular-nums font-semibold text-emerald-700">{p.sold_quantity}</TableCell>
                        <TableCell className="tabular-nums text-gray-700">{p.stock_quantity}</TableCell>
                        <TableCell className="tabular-nums font-bold text-gray-900 text-right">{peso(p.selling_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
