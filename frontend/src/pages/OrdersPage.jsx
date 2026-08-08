import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Loader2, Plus } from 'lucide-react';
import { listOrders } from '../api/orders.js';
import { ORDER_STATUS_BADGE } from '../constants.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import { inputClasses } from '../components/Field.jsx';
import OrderFormPage from './OrderFormPage.jsx';
import OrderDetailPage from './OrderDetailPage.jsx';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

function OrdersListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [type, setType] = useState('purchase');
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listOrders({ type, status: status || undefined });
      setOrders(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
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
        <div className="flex rounded border border-gray-300 p-0.5">
          {[['purchase', 'Purchase Orders'], ['sale', 'Sales Invoices']].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                type === value ? 'bg-black-900 text-white' : 'text-black-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select className={`${inputClasses(false)} max-w-[180px]`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">{type === 'purchase' ? 'Supplier' : 'Customer'}</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-black-500">
                <div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Loading...</div>
              </td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-black-500">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={28} className="text-black-300" strokeWidth={1.5} />
                  No {type === 'purchase' ? 'purchase orders' : 'sales invoices'} yet.
                </div>
              </td></tr>
            )}
            {!loading && orders.map((o) => (
              <tr
                key={o.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <td className="px-4 py-3 font-mono text-black-900">{o.order_number}</td>
                <td className="px-4 py-3 text-black-900">{o.supplier_name || o.party_name || '—'}</td>
                <td className="px-4 py-3 text-black-700">{new Date(o.order_date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge variant={ORDER_STATUS_BADGE[o.status]}>{o.status}</Badge></td>
                <td className="px-4 py-3 tabular-nums text-black-900 text-right">{peso(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
