import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { listOrders } from '../api/orders.js';
import { ORDER_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import OrderFormPage from './OrderFormPage.jsx';
import OrderDetailPage from './OrderDetailPage.jsx';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

const STATUS_LABELS = { _all: 'All statuses', draft: 'Draft', confirmed: 'Confirmed', fulfilled: 'Fulfilled', cancelled: 'Cancelled' };

function OrdersListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [type, setType] = useState('purchase');
  const [status, setStatus] = useState('_all');
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
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

  useEffect(() => {
    if (location.pathname === '/orders') load();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {modal}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Orders</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button onClick={() => navigate(`/orders/new?type=${type}`)}>
          <Plus size={16} strokeWidth={2.5} />
          New Order
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
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
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>{type === 'purchase' ? 'Supplier' : 'Customer'}</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-black-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Loading...</div>
              </TableCell></TableRow>
            )}
            {!loading && orders.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-14 text-center text-black-500">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={28} className="text-black-300" strokeWidth={1.5} />
                  No {type === 'purchase' ? 'purchase orders' : 'sales invoices'} yet.
                </div>
              </TableCell></TableRow>
            )}
            {!loading && orders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <TableCell className="font-mono text-black-900">{o.order_number}</TableCell>
                <TableCell className="text-black-900">{o.supplier_name || o.party_name || '—'}</TableCell>
                <TableCell className="text-black-700">{new Date(o.order_date).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant={ORDER_STATUS_BADGE[o.status]}>{o.status}</Badge></TableCell>
                <TableCell className="tabular-nums text-black-900 text-right">{peso(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} order{total === 1 ? '' : 's'}</p>
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
