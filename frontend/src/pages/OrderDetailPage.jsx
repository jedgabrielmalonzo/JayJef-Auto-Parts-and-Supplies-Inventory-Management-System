import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, Loader2, Pencil, PackageCheck, XCircle } from 'lucide-react';
import { getOrder, confirmOrder, fulfillOrder, cancelOrder, orderPdfUrl } from '../api/orders.js';
import { ORDER_STATUS_BADGE } from '../constants.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getOrder(id).then(setOrder).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function runAction(action) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await action();
      setOrder(updated);
    } catch (err) {
      setActionError(err.details ? `${err.message}: ${err.details.map((d) => `${d.sku} (have ${d.available}, need ${d.requested})`).join(', ')}` : err.message);
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-black-500">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Order not found.'}
      </div>
    );
  }

  const party = order.type === 'purchase'
    ? { label: 'Supplier', name: order.supplier_name || order.party_name || '—', contact: order.party_contact }
    : { label: 'Customer', name: order.party_name || '—', contact: order.party_contact };

  return (
    <div className="max-w-3xl">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-black-500 hover:text-black-900 mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-black-900">{order.order_number}</h1>
            <Badge variant={ORDER_STATUS_BADGE[order.status]}>{order.status}</Badge>
          </div>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <div className="flex gap-2">
          {order.status === 'draft' && (
            <Button as={Link} to={`/orders/${order.id}/edit`} variant="secondary">
              <Pencil size={16} />
              Edit
            </Button>
          )}
          <Button as="a" href={orderPdfUrl(order.id)} target="_blank" rel="noreferrer" variant="secondary">
            <Download size={16} />
            PDF
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-1">{party.label}</h3>
          <p className="text-black-900">{party.name}</p>
          {party.contact && <p className="text-sm text-black-700">{party.contact}</p>}
        </div>
        <div className="text-right">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-1">Date</h3>
          <p className="text-black-900">{new Date(order.order_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-3 font-mono text-black-900">{i.product_sku}</td>
                <td className="px-4 py-3 text-black-900">{i.product_name}</td>
                <td className="px-4 py-3 tabular-nums text-black-900">{i.quantity} {i.product_unit}</td>
                <td className="px-4 py-3 tabular-nums text-black-900">{peso(i.unit_price)}</td>
                <td className="px-4 py-3 tabular-nums text-black-900 text-right">{peso(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-48 text-right">
          <p className="text-xs uppercase tracking-wide text-black-500">Total</p>
          <p className="font-display text-2xl text-black-900">{peso(order.total)}</p>
        </div>
      </div>

      {order.notes && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-1">Notes</h3>
          <p className="text-sm text-black-700">{order.notes}</p>
        </div>
      )}

      <div className="flex gap-3 border-t border-gray-200 pt-5">
        {order.status === 'draft' && (
          <Button disabled={busy} onClick={() => runAction(() => confirmOrder(order.id))}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirm
          </Button>
        )}
        {order.status === 'confirmed' && (
          <Button disabled={busy} onClick={() => runAction(() => fulfillOrder(order.id))}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
            Mark Fulfilled
          </Button>
        )}
        {['draft', 'confirmed'].includes(order.status) && (
          <Button variant="destructive" disabled={busy} onClick={() => setConfirmCancel(true)}>
            <XCircle size={16} />
            Cancel Order
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        description="This order will be marked cancelled. No stock movements will be created. This can't be undone."
        confirmLabel="Cancel Order"
        onConfirm={() => runAction(() => cancelOrder(order.id))}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
