import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus, ShoppingBag, Receipt, ShoppingCart, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { listOrders } from '../api/orders.js';
import { getOverview } from '../api/dashboard.js';
import { ORDER_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import StatCard from '../components/StatCard.jsx';
import OrderFormPage from './OrderFormPage.jsx';
import OrderDetailPage from './OrderDetailPage.jsx';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const STATUS_LABELS = { _all: 'All statuses', draft: 'Draft', confirmed: 'Confirmed', fulfilled: 'Fulfilled', cancelled: 'Cancelled' };

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

function OrdersListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [type, setType] = useState('purchase');
  const [status, setStatus] = useState('_all');
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listOrders({ type, status: status === '_all' ? undefined : status });
      setOrders(result.items);
      setTotal(result.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getOverview().then(setSummary).catch(() => {}); }, []);

  useEffect(() => {
    if (location.pathname === '/orders') load();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {modal}

      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Orders and Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage purchase orders, sales invoices, and supplier receipts</p>
        </div>
        <Button onClick={() => navigate(`/orders/new?type=${type}`)} className="bg-red-600 hover:bg-red-700">
          <Plus size={16} strokeWidth={2.5} />
          New Order
        </Button>
      </motion.div>

      {summary && (
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <StatCard
            title="Overall Orders"
            items={[
              { icon: ShoppingBag, value: summary.purchases.count, label: 'Purchases Fulfilled', tint: '#3A6EA5' },
              { icon: Receipt, value: peso(summary.purchases.cost), label: 'Purchase Cost', tint: '#946200' },
              { icon: ShoppingCart, value: summary.sales.count, label: 'Sales Fulfilled', tint: '#1E7B34' },
              { icon: Wallet, value: peso(summary.sales.revenue), label: 'Sales Revenue', tint: '#6B6B6B' },
            ]}
          />
        </motion.div>
      )}

      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-wrap items-center gap-3">
        <Tabs value={type} onValueChange={setType}>
          <TabsList>
            <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
            <TabsTrigger value="sale">Sales Invoices</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>{(v) => STATUS_LABELS[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Order #</TableHead>
              <TableHead className="font-semibold text-gray-700">{type === 'purchase' ? 'Supplier' : 'Customer'}</TableHead>
              <TableHead className="font-semibold text-gray-700">Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-red-600" />Loading orders...</div>
              </TableCell></TableRow>
            )}
            {!loading && orders.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-14 text-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={28} className="text-gray-300" strokeWidth={1.5} />
                  No {type === 'purchase' ? 'purchase orders' : 'sales invoices'} yet.
                </div>
              </TableCell></TableRow>
            )}
            {!loading && orders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <TableCell className="font-mono font-bold text-red-600 text-xs">{o.order_number}</TableCell>
                <TableCell className="font-medium text-gray-900">{o.supplier_name || o.party_name || '—'}</TableCell>
                <TableCell className="text-gray-500 text-xs">{new Date(o.order_date).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant={ORDER_STATUS_BADGE[o.status]}>{o.status}</Badge></TableCell>
                <TableCell className="tabular-nums font-bold text-gray-900 text-right">{peso(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-gray-500">{total} order{total === 1 ? '' : 's'}</p>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Routes>
      <Route index element={<OrdersListView />} />
      <Route path="new" element={<OrdersListView modal={<OrderFormPage />} />} />
      <Route path=":id/edit" element={<OrdersListView modal={<OrderFormPage />} />} />
      <Route path=":id" element={<OrderDetailPage />} />
    </Routes>
  );
}

