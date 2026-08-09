import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getOrder, createOrder, updateOrder } from '../api/orders.js';
import { listSuppliers } from '../api/suppliers.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

function peso(n) {
  return `₱${Number(n || 0).toFixed(2)}`;
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function OrderFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [type, setType] = useState(searchParams.get('type') === 'sale' ? 'sale' : 'purchase');
  const [supplierId, setSupplierId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyContact, setPartyContact] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [itemsError, setItemsError] = useState(null);

  useEffect(() => {
    listSuppliers({ page_size: 500 }).then((r) => setSuppliers(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getOrder(id)
      .then((order) => {
        setType(order.type);
        setSupplierId(order.supplier_id ? String(order.supplier_id) : '');
        setPartyName(order.party_name || '');
        setPartyContact(order.party_contact || '');
        setOrderDate(order.order_date ? order.order_date.slice(0, 10) : '');
        setNotes(order.notes || '');
        setItems(order.items.map((i) => ({
          product_id: i.product_id, sku: i.product_sku, name: i.product_name,
          quantity: i.quantity, unit_price: i.unit_price,
        })));
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function addItem(product) {
    if (items.some((i) => i.product_id === product.id)) return;
    const unitPrice = type === 'purchase' ? product.cost_price : product.selling_price;
    setItems((list) => [...list, { product_id: product.id, sku: product.sku, name: product.name, quantity: 1, unit_price: unitPrice }]);
    setItemsError(null);
  }

  function updateItem(productId, field, value) {
    setItems((list) => list.map((i) => (i.product_id === productId ? { ...i, [field]: value } : i)));
  }

  function removeItem(productId) {
    setItems((list) => list.filter((i) => i.product_id !== productId));
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);

  function close() {
    navigate('/orders');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      setItemsError('Add at least one line item.');
      return;
    }
    setSaving(true);

    const payload = {
      type,
      supplier_id: type === 'purchase' && supplierId ? Number(supplierId) : undefined,
      party_name: partyName || undefined,
      party_contact: partyContact || undefined,
      order_date: orderDate || undefined,
      notes: notes || undefined,
      items: items.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
    };

    try {
      if (isEdit) {
        await updateOrder(id, payload);
        toast.success('Order saved');
      } else {
        await createOrder(payload);
        toast.success('Order created');
      }
      close();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Order' : 'New Order'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-black-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isEdit && (
              <Field label="Type">
                <div className="flex gap-2">
                  {[['purchase', 'Purchase (restock from supplier)'], ['sale', 'Sale (to customer)']].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setType(value)}
                      className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                        type === value ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-black-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              {type === 'purchase' ? (
                <Field label="Supplier">
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No catalog supplier (use party name)">
                        {(v) => suppliers.find((s) => String(s.id) === v)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field label="Customer Name">
                  <Input placeholder="e.g. Juan Dela Cruz" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </Field>
              )}
              <Field label={type === 'purchase' ? 'Supplier Contact (if no catalog supplier)' : 'Customer Contact'}>
                <Input placeholder="Phone or email" value={partyContact} onChange={(e) => setPartyContact(e.target.value)} />
              </Field>
            </div>

            <Field label="Order Date">
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </Field>

            <Field label="Add Product">
              <ProductPicker selected={null} onSelect={addItem} placeholder="Search SKU or name to add a line..." />
            </Field>

            {itemsError && <p className="text-sm text-red-700">{itemsError}</p>}

            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Unit Price</TableHead>
                    <TableHead className="w-28 text-right">Line Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-6 text-center text-black-500">No line items yet — search above to add one.</TableCell></TableRow>
                  )}
                  {items.map((i) => (
                    <TableRow key={i.product_id}>
                      <TableCell>
                        <p className="text-black-900">{i.name}</p>
                        <p className="font-mono text-xs text-black-500">{i.sku}</p>
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="1" className="h-9 tabular-nums" value={i.quantity} onChange={(e) => updateItem(i.product_id, 'quantity', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" step="0.01" className="h-9 tabular-nums" value={i.unit_price} onChange={(e) => updateItem(i.product_id, 'unit_price', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-black-900">{peso(i.quantity * i.unit_price)}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon-sm" title="Remove" className="hover:bg-red-50 hover:text-red-600" onClick={() => removeItem(i.product_id)}>
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-48 text-right">
                <p className="text-xs uppercase tracking-wide text-black-500">Total</p>
                <p className="font-display text-xl text-black-900">{peso(subtotal)}</p>
              </div>
            </div>

            <Field label="Notes">
              <Textarea placeholder="Delivery instructions, payment terms, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
              <span className="ml-auto self-center inline-flex items-center gap-1 text-xs text-black-500">
                <Plus size={12} /> Draft — confirm and fulfill from the order detail page
              </span>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
