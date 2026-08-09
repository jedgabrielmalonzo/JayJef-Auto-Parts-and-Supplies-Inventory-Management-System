import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Wallet, PiggyBank, Receipt, Package, Truck,
  ShoppingBag, XCircle, Users, LayoutGrid, Loader2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getOverview, getSalesPurchaseChart, getOrderSummaryChart, getTopSelling } from '../api/dashboard.js';
import { lowStock } from '../api/inventory.js';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart.jsx';
import StatCard from '../components/StatCard.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

const BLUE = '#3A6EA5';
const GREEN = '#1E7B34';
const AMBER = '#946200';
const GRAY = '#6B6B6B';

function peso(n) {
  return `₱${Number(n || 0).toFixed(2)}`;
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
        setLowQuantity(ls.slice(0, 3));
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-black-500">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-black-900">Dashboard</h1>
        <div className="h-1 w-16 bg-black-900 mt-2" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard
          title="Sales Overview"
          items={[
            { icon: ShoppingCart, value: overview.sales.count, label: 'Sales', tint: BLUE },
            { icon: Wallet, value: peso(overview.sales.revenue), label: 'Revenue', tint: GREEN },
            { icon: PiggyBank, value: peso(overview.sales.profit), label: 'Profit', tint: AMBER },
            { icon: Receipt, value: peso(overview.sales.cost), label: 'Cost', tint: GRAY },
          ]}
        />
        <StatCard
          title="Inventory Summary"
          items={[
            { icon: Package, value: overview.inventory.quantityInHand, label: 'Quantity in Hand', tint: BLUE },
            { icon: Truck, value: overview.inventory.toBeReceived, label: 'To be received', tint: AMBER },
          ]}
        />
        <StatCard
          title="Purchase Overview"
          items={[
            { icon: ShoppingBag, value: overview.purchases.count, label: 'Purchase', tint: BLUE },
            { icon: Receipt, value: peso(overview.purchases.cost), label: 'Cost', tint: GREEN },
            { icon: XCircle, value: overview.purchases.cancelled, label: 'Cancelled', tint: GRAY },
          ]}
        />
        <StatCard
          title="Product Summary"
          items={[
            { icon: Users, value: overview.products.supplierCount, label: 'Number of Suppliers', tint: BLUE },
            { icon: LayoutGrid, value: overview.products.categoryCount, label: 'Number of Categories', tint: AMBER },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-heading font-bold text-black-900">Sales &amp; Purchase</h3>
          {salesPurchase.length === 0 ? (
            <p className="py-10 text-center text-sm text-black-500">No orders yet this period.</p>
          ) : (
            <ChartContainer
              config={{ purchase: { label: 'Purchase', color: BLUE }, sales: { label: 'Sales', color: GREEN } }}
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

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-heading font-bold text-black-900">Order Summary</h3>
          {orderSummary.length === 0 ? (
            <p className="py-10 text-center text-sm text-black-500">No orders yet.</p>
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="font-heading font-bold text-black-900">Top Selling Stock</h3>
            <Link to="/products" className="text-sm font-medium text-red-600 hover:underline">See All</Link>
          </div>
          {topSelling.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-black-500">No sales recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sold Quantity</TableHead>
                  <TableHead>Remaining Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSelling.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-black-900">{p.name}</TableCell>
                    <TableCell className="tabular-nums text-black-700">{p.sold_quantity}</TableCell>
                    <TableCell className="tabular-nums text-black-700">{p.stock_quantity}</TableCell>
                    <TableCell className="tabular-nums text-black-900">{peso(p.selling_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="font-heading font-bold text-black-900">Low Quantity Stock</h3>
            <Link to="/inventory" className="text-sm font-medium text-red-600 hover:underline">See All</Link>
          </div>
          {lowQuantity.length === 0 ? (
            <p className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-black-500">
              <AlertTriangle size={20} className="text-black-300" />
              Nothing below its reorder threshold right now.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 p-4 pt-2">
              {lowQuantity.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ProductThumb product={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-black-900">{p.name}</p>
                    <p className="text-xs text-black-500">Remaining Quantity: {p.stock_quantity} {p.unit}</p>
                  </div>
                  <Badge variant="warning">Low</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
