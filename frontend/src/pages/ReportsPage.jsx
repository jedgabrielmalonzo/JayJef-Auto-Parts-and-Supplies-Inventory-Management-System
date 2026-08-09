import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ShoppingCart, ShoppingBag, Receipt, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getOverview, getBestSellingCategories, getProfitRevenueChart, getBestSellingProducts } from '../api/reports.js';
import { formatCategory } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart.jsx';
import StatCard from '../components/StatCard.jsx';

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

function ChangeBadge({ pct }) {
  const positive = pct >= 0;
  const Icon = positive ? ArrowUpCircle : ArrowDownCircle;
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${positive ? 'text-green-600' : 'text-black-900'}`}>
      <Icon size={13} />
      {positive ? '+' : ''}{pct}%
    </span>
  );
}

export default function ReportsPage() {
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [chart, setChart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getBestSellingCategories(), getProfitRevenueChart(), getBestSellingProducts()])
      .then(([o, c, ch, p]) => {
        setOverview(o);
        setCategories(c);
        setChart(ch.map((b) => ({ ...b, label: monthLabel(b.label) })));
        setProducts(p);
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
        <h1 className="font-display text-3xl text-black-900">Reports</h1>
        <div className="h-1 w-16 bg-black-900 mt-2" />
      </div>

      <StatCard
        title="Overview"
        items={[
          { icon: TrendingUp, value: peso(overview.totalProfit), label: 'Total Profit', tint: GREEN },
          { icon: Wallet, value: peso(overview.revenue), label: 'Revenue', tint: BLUE },
          { icon: ShoppingCart, value: overview.sales, label: 'Sales', tint: AMBER },
          { icon: ShoppingBag, value: peso(overview.netPurchaseValue), label: 'Net purchase value', tint: GRAY },
          { icon: Receipt, value: peso(overview.netSalesValue), label: 'Net sales value', tint: BLUE },
          { icon: overview.momProfitPct >= 0 ? ArrowUpCircle : ArrowDownCircle, value: `${overview.momProfitPct >= 0 ? '+' : ''}${overview.momProfitPct}%`, label: 'MoM Profit', tint: overview.momProfitPct >= 0 ? GREEN : GRAY },
          { icon: overview.yoyProfitPct >= 0 ? ArrowUpCircle : ArrowDownCircle, value: `${overview.yoyProfitPct >= 0 ? '+' : ''}${overview.yoyProfitPct}%`, label: 'YoY Profit', tint: overview.yoyProfitPct >= 0 ? GREEN : GRAY },
        ]}
      />

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-heading font-bold text-black-900">Profit &amp; Revenue</h3>
        {chart.length === 0 ? (
          <p className="py-10 text-center text-sm text-black-500">No fulfilled orders yet.</p>
        ) : (
          <ChartContainer
            config={{ revenue: { label: 'Revenue', color: BLUE }, profit: { label: 'Profit', color: AMBER } }}
            className="aspect-auto h-64 w-full"
          >
            <LineChart data={chart}>
              <CartesianGrid vertical={false} stroke="#E4E4E4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h3 className="px-4 pt-4 font-heading font-bold text-black-900">Best Selling Category</h3>
          {categories.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-black-500">No sales recorded this month.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Turn Over</TableHead>
                  <TableHead>Increase By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.category}>
                    <TableCell className="text-black-900">{formatCategory(c.category)}</TableCell>
                    <TableCell className="tabular-nums text-black-900">{peso(c.turnover)}</TableCell>
                    <TableCell><ChangeBadge pct={c.increaseByPct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h3 className="px-4 pt-4 font-heading font-bold text-black-900">Best Selling Product</h3>
          {products.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-black-500">No sales recorded this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Remaining Qty</TableHead>
                    <TableHead>Turn Over</TableHead>
                    <TableHead>Increase By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="text-black-900">{p.name}</p>
                        <p className="font-mono text-xs text-black-500">{p.sku}</p>
                      </TableCell>
                      <TableCell><Badge variant="neutral">{formatCategory(p.category)}</Badge></TableCell>
                      <TableCell className="tabular-nums text-black-700">{p.remainingQuantity}</TableCell>
                      <TableCell className="tabular-nums text-black-900">{peso(p.turnover)}</TableCell>
                      <TableCell><ChangeBadge pct={p.increaseByPct} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
