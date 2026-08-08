import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getOrder, createOrder, updateOrder } from '../api/orders.js';
import { listSuppliers } from '../api/suppliers.js';
import Button from '../components/Button.jsx';
import Field, { inputClasses } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

function peso(n) {
  return `₱${Number(n || 0).toFixed(2)}`;
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
  const [error, setError] = useState(null);

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
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function addItem(product) {
    if (items.some((i) => i.product_id === product.id)) return;
    const unitPrice = type === 'purchase' ? product.cost_price : product.selling_price;
    setItems((list) => [...list, { product_id: product.id, sku: product.sku, name: product.name, quantity: 1, unit_price: unitPrice }]);
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
      setError('Add at least one line item.');
      return;
    }
    setSaving(true);
    setError(null);

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
      if (isEdit) await updateOrder(id, payload);
      else await createOrder(payload);
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Order' : 'New Order'} onClose={close} maxWidth="max-w-3xl">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-black-500">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

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
                  <select className={inputClasses(false)} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    <option value="">No catalog supplier (use party name)</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              ) : (
                <Field label="Customer Name">
                  <input className={inputClasses(false)} placeholder="e.g. Juan Dela Cruz" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </Field>
              )}
              <Field label={type === 'purchase' ? 'Supplier Contact (if no catalog supplier)' : 'Customer Contact'}>
                <input className={inputClasses(false)} placeholder="Phone or email" value={partyContact} onChange={(e) => setPartyContact(e.target.value)} />
              </Field>
            </div>

            <Field label="Order Date">
              <input type="date" className={inputClasses(false)} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </Field>

            <Field label="Add Product">
              <ProductPicker selected={null} onSelect={addItem} placeholder="Search SKU or name to add a line..." />
            </Field>

            <div className="rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium w-24">Qty</th>
                    <th className="px-3 py-2 font-medium w-28">Unit Price</th>
                    <th className="px-3 py-2 font-medium w-28 text-right">Line Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-black-500">No line items yet — search above to add one.</td></tr>
                  )}
                  {items.map((i) => (
                    <tr key={i.product_id} className="border-b border-gray-200 last:border-b-0">
                      <td className="px-3 py-2">
                        <p className="text-black-900">{i.name}</p>
                        <p className="font-mono text-xs text-black-500">{i.sku}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" className={`${inputClasses(false)} h-9 tabular-nums`} value={i.quantity} onChange={(e) => updateItem(i.product_id, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.01" className={`${inputClasses(false)} h-9 tabular-nums`} value={i.unit_price} onChange={(e) => updateItem(i.product_id, 'unit_price', e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-black-900">{peso(i.quantity * i.unit_price)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => removeItem(i.product_id)} className="inline-flex h-8 w-8 items-center justify-center rounded text-black-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-48 text-right">
                <p className="text-xs uppercase tracking-wide text-black-500">Total</p>
                <p className="font-display text-xl text-black-900">{peso(subtotal)}</p>
              </div>
            </div>

            <Field label="Notes">
              <textarea className={`${inputClasses(false)} h-20`} placeholder="Delivery instructions, payment terms, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        </>
      )}
    </Modal>
  );
}
