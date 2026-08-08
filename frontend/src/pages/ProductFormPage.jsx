import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getProduct, createProduct, updateProduct } from '../api/products.js';
import { listSuppliers } from '../api/suppliers.js';
import { CATEGORIES, formatCategory } from '../constants.js';
import Button from '../components/Button.jsx';
import Field, { inputClasses } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';

function Section({ title, children }) {
  return (
    <section className="border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const EMPTY_FORM = {
  sku: '',
  name: '',
  category: '',
  brand: '',
  compatible_vehicles: '',
  unit: 'pc',
  cost_price: '',
  selling_price: '',
  reorder_threshold: '',
  supplier_id: '',
  location_aisle: '',
  location_shelf: '',
  location_bin: '',
  notes: '',
  initial_stock: '',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    listSuppliers({ page_size: 500 }).then((r) => setSuppliers(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id)
      .then((product) => {
        setForm({
          ...EMPTY_FORM,
          ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, product[k] ?? ''])),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function close() {
    navigate('/products');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      ...form,
      cost_price: form.cost_price === '' ? undefined : Number(form.cost_price),
      selling_price: form.selling_price === '' ? undefined : Number(form.selling_price),
      reorder_threshold: form.reorder_threshold === '' ? undefined : Number(form.reorder_threshold),
      supplier_id: form.supplier_id === '' ? undefined : Number(form.supplier_id),
      initial_stock: isEdit || form.initial_stock === '' ? undefined : Number(form.initial_stock),
    };

    try {
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      close();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Product' : 'Add Product'} onClose={close}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-black-500">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Section title="Basic Info">
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU" required error={fieldErrors.sku}>
                  <input
                    className={`${inputClasses(!!fieldErrors.sku)} font-mono`}
                    placeholder="e.g. CMP-1023"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Category" required error={fieldErrors.category}>
                  <select className={inputClasses(!!fieldErrors.category)} value={form.category} onChange={(e) => set('category', e.target.value)} required>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Name" required error={fieldErrors.name}>
                <input
                  className={inputClasses(!!fieldErrors.name)}
                  placeholder="e.g. AC Compressor — Denso 10PA17C"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand">
                  <input className={inputClasses(false)} placeholder="e.g. Denso, Sanden, Valeo" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </Field>
                <Field label="Unit">
                  <input className={inputClasses(false)} value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="pc, set, box, liter, kg" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Compatible Vehicles">
                  <input className={inputClasses(false)} value={form.compatible_vehicles} onChange={(e) => set('compatible_vehicles', e.target.value)} placeholder="e.g. Toyota Vios 2013–2018" />
                </Field>
                <Field label="Supplier">
                  <select className={inputClasses(false)} value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
                    <option value="">No default supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Pricing & Stock">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Cost Price">
                  <input type="number" step="0.01" min="0" className={`${inputClasses(false)} tabular-nums`} placeholder="0.00" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} />
                </Field>
                <Field label="Selling Price">
                  <input type="number" step="0.01" min="0" className={`${inputClasses(false)} tabular-nums`} placeholder="0.00" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} />
                </Field>
                <Field label="Reorder Threshold">
                  <input type="number" min="0" className={`${inputClasses(false)} tabular-nums`} placeholder="5" value={form.reorder_threshold} onChange={(e) => set('reorder_threshold', e.target.value)} />
                </Field>
              </div>
              {!isEdit && (
                <Field label="Initial Stock" error={fieldErrors.initial_stock}>
                  <input type="number" min="0" className={`${inputClasses(false)} tabular-nums`} placeholder="0" value={form.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} />
                </Field>
              )}
            </Section>

            <Section title="Location">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Aisle">
                  <input className={inputClasses(false)} placeholder="e.g. A1" value={form.location_aisle} onChange={(e) => set('location_aisle', e.target.value)} />
                </Field>
                <Field label="Shelf">
                  <input className={inputClasses(false)} placeholder="e.g. S2" value={form.location_shelf} onChange={(e) => set('location_shelf', e.target.value)} />
                </Field>
                <Field label="Bin">
                  <input className={inputClasses(false)} placeholder="e.g. B3" value={form.location_bin} onChange={(e) => set('location_bin', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Notes">
              <textarea
                className={`${inputClasses(false)} h-24`}
                placeholder="Anything worth flagging — fitment quirks, supplier notes, etc."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Section>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Product'}
              </Button>
              <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
