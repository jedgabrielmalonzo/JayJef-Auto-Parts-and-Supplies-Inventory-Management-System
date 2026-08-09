import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, Loader2, Pencil, PackageCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getOrder, confirmOrder, fulfillOrder, cancelOrder, orderPdfUrl } from '../api/orders.js';
import { ORDER_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

function formatActionError(err) {
  return err.details
    ? `${err.message}: ${err.details.map((d) => `${d.sku} (have ${d.available}, need ${d.requested})`).join(', ')}`
    : err.message;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getOrder(id).then(setOrder).catch((err) => setLoadError(err.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function runAction(action, successMessage) {
    setBusy(true);
    try {
      // confirm/fulfill/cancel return the order without `items` (docs/06) —
      // re-fetch the full shape rather than rendering the partial response.
      await action();
      const fresh = await getOrder(id);
      setOrder(fresh);
      toast.success(successMessage);
    } catch (err) {
      toast.error(formatActionError(err));
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

  if (loadError || !order) {
    return (
      <div className="rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
        {loadError || 'Order not found.'}
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
            <Button render={<Link to={`/orders/${order.id}/edit`} />} nativeButton={false} variant="secondary">
              <Pencil size={16} />
              Edit
            </Button>
          )}
          <Button render={<a href={orderPdfUrl(order.id)} target="_blank" rel="noreferrer" />} nativeButton={false} variant="secondary">
            <Download size={16} />
            PDF
          </Button>
        </div>
      </div>

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-black-900">{i.product_sku}</TableCell>
                <TableCell className="text-black-900">{i.product_name}</TableCell>
                <TableCell className="tabular-nums text-black-900">{i.quantity} {i.product_unit}</TableCell>
                <TableCell className="tabular-nums text-black-900">{peso(i.unit_price)}</TableCell>
                <TableCell className="tabular-nums text-black-900 text-right">{peso(i.line_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          <Button disabled={busy} onClick={() => runAction(() => confirmOrder(order.id), 'Order confirmed')}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Confirm
          </Button>
        )}
        {order.status === 'confirmed' && (
          <Button disabled={busy} onClick={() => runAction(() => fulfillOrder(order.id), 'Order marked fulfilled')}>
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

      <AlertDialog open={confirmCancel} onOpenChange={(v) => !v && setConfirmCancel(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This order will be marked cancelled. No stock movements will be created. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={() => runAction(() => cancelOrder(order.id), 'Order cancelled')}>Cancel Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
