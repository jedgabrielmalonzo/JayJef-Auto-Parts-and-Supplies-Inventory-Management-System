import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    <span className={`inline-flex items-center gap-1 tabular-nums font-semibold ${positive ? 'text-emerald-600' : 'text-gray-900'}`}>
      <Icon size={13} />
      {positive ? '+' : ''}{pct}%
    </span>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

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
      <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
        <Loader2 size={16} className="animate-spin text-red-600" />
        Loading financial reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Report and Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Financial performance, profit margins, and fast-selling category analytics</p>
      </motion.div>

      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
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
      </motion.div>

      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <h3 className="mb-3 font-heading font-bold text-gray-900 text-base">Profit &amp; Revenue Trend</h3>
        {chart.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No fulfilled orders yet.</p>
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
      </motion.div>

      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <h3 className="p-5 pb-3 font-heading font-bold text-gray-900 text-base border-b border-gray-100">Best Selling Category</h3>
          {categories.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No sales recorded this month.</p>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Turnover</TableHead>
                  <TableHead className="font-semibold text-gray-700">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.category} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-900 font-medium">{formatCategory(c.category)}</TableCell>
                    <TableCell className="tabular-nums font-bold text-gray-900">{peso(c.turnover)}</TableCell>
                    <TableCell><ChangeBadge pct={c.increaseByPct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <h3 className="p-5 pb-3 font-heading font-bold text-gray-900 text-base border-b border-gray-100">Best Selling Product</h3>
          {products.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">No sales recorded this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Product</TableHead>
                    <TableHead className="font-semibold text-gray-700">Category</TableHead>
                    <TableHead className="font-semibold text-gray-700">Stock Qty</TableHead>
                    <TableHead className="font-semibold text-gray-700">Turnover</TableHead>
                    <TableHead className="font-semibold text-gray-700">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <p className="text-gray-900 font-medium">{p.name}</p>
                        <p className="font-mono text-xs text-gray-500">{p.sku}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{formatCategory(p.category)}</Badge></TableCell>
                      <TableCell className="tabular-nums font-semibold text-gray-700">{p.remainingQuantity}</TableCell>
                      <TableCell className="tabular-nums font-bold text-gray-900">{peso(p.turnover)}</TableCell>
                      <TableCell><ChangeBadge pct={p.increaseByPct} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

