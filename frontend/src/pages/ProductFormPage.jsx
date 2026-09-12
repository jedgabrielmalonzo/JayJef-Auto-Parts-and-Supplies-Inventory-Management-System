import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ImagePlus, X, DollarSign, Tag, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getProduct, createProduct, updateProduct } from '../api/products.js';
import { listSuppliers } from '../api/suppliers.js';
import { API_ORIGIN } from '../api/client.js';
import { CATEGORIES, formatCategory } from '../constants.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';

const STANDARD_UNITS = [
  { value: 'pc', label: 'Piece (pc)' },
  { value: 'set', label: 'Set (set)' },
  { value: 'pair', label: 'Pair (pair)' },
  { value: 'box', label: 'Box (box)' },
  { value: 'liter', label: 'Liter (liter)' },
  { value: 'can', label: 'Can (can)' },
  { value: 'bottle', label: 'Bottle (bottle)' },
  { value: 'meter', label: 'Meter (meter)' },
  { value: 'roll', label: 'Roll (roll)' },
  { value: 'kg', label: 'Kilogram (kg)' },
];

function Section({ title, children }) {
  return (
    <section className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
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
  image_path: '',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
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
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function close() {
    navigate('/products');
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    set('image_path', '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const payload = {
      ...form,
      cost_price: form.cost_price === '' ? undefined : Number(form.cost_price),
      selling_price: form.selling_price === '' ? undefined : Number(form.selling_price),
      reorder_threshold: form.reorder_threshold === '' ? undefined : Number(form.reorder_threshold),
      supplier_id: form.supplier_id === '' ? undefined : Number(form.supplier_id),
      initial_stock: isEdit || form.initial_stock === '' ? undefined : Number(form.initial_stock),
      image: imageFile || undefined,
    };

    try {
      if (isEdit) {
        await updateProduct(id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('New product added to catalog');
      }
      close();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const displayedImage = imagePreview || (form.image_path ? `${API_ORIGIN}${form.image_path}` : null);

  const [modalSize, setModalSize] = useState(() => localStorage.getItem('jayjef_modal_size') || 'standard');

  function changeModalSize(newSize) {
    setModalSize(newSize);
    localStorage.setItem('jayjef_modal_size', newSize);
  }

  const SIZE_CLASSES = {
    standard: 'sm:max-w-xl max-h-[90vh]',
    wide: 'sm:max-w-4xl max-h-[92vh]',
    'extra-wide': 'sm:max-w-6xl max-h-[94vh]',
    fullscreen: 'sm:max-w-[98vw] sm:w-[98vw] w-[98vw] max-w-[98vw] h-[95vh] max-h-[95vh]',
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className={`${SIZE_CLASSES[modalSize] || SIZE_CLASSES.standard} overflow-y-auto rounded-2xl p-6 shadow-2xl border border-gray-200 transition-all duration-200`}>
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 pr-8">
          <DialogTitle className="font-heading text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Auto Part'}
          </DialogTitle>

          {/* Modal Size Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            <span className="text-[11px] text-gray-500 font-bold px-1.5">Size:</span>
            {[
              { key: 'standard', label: 'Standard' },
              { key: 'wide', label: 'Wide' },
              { key: 'extra-wide', label: 'Extra Wide' },
              { key: 'fullscreen', label: 'Full Screen' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => changeModalSize(s.key)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  modalSize === s.key ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 size={18} className="animate-spin text-red-600" />
            <span>Loading product specifications...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <Section title="Product Image">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-xs">
                  {displayedImage ? (
                    <img src={displayedImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={24} className="text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product-image" className="w-fit cursor-pointer">
                    <span className="inline-flex h-9 items-center rounded-xl border border-gray-300 bg-white px-3.5 text-xs font-semibold text-gray-800 shadow-xs hover:bg-gray-50 transition-colors">
                      {displayedImage ? 'Change Photo' : 'Upload Part Photo'}
                    </span>
                    <input id="product-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </Label>
                  {displayedImage && (
                    <button type="button" onClick={clearImage} className="inline-flex w-fit items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                      <X size={13} /> Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Basic Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Part Number" required error={fieldErrors.sku}>
                  <Input
                    className="font-mono text-sm uppercase rounded-xl border-gray-300 focus:border-red-600"
                    aria-invalid={!!fieldErrors.sku}
                    placeholder="e.g. CMP-1023"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Category" required error={fieldErrors.category}>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger className="rounded-xl border-gray-300" aria-invalid={!!fieldErrors.category}>
                      <SelectValue placeholder="Select Category">{(v) => v && formatCategory(v)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Product Title / Name" required error={fieldErrors.name}>
                <Input
                  className="rounded-xl border-gray-300 focus:border-red-600"
                  aria-invalid={!!fieldErrors.name}
                  placeholder="e.g. AC Compressor — Denso 10PA17C"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Brand / Manufacturer">
                  <Input className="rounded-xl border-gray-300" placeholder="e.g. Denso, Sanden, Valeo" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </Field>
                <Field label="Packaging Unit">
                  <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue placeholder="Select Unit">
                        {(v) => STANDARD_UNITS.find((u) => u.value === v)?.label || v}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Compatible Vehicles">
                  <Input className="rounded-xl border-gray-300" value={form.compatible_vehicles} onChange={(e) => set('compatible_vehicles', e.target.value)} placeholder="e.g. Toyota Vios 2013–2018" />
                </Field>
                <Field label="Default Supplier">
                  <Select value={form.supplier_id} onValueChange={(v) => set('supplier_id', v)}>
                    <SelectTrigger className="rounded-xl border-gray-300">
                      <SelectValue placeholder="Select Supplier">
                        {(v) => suppliers.find((s) => String(s.id) === v)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Philippine Peso (₱) Pricing &amp; Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Cost Price (₱)">
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 font-heading font-bold text-sm text-gray-500">₱</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7 rounded-xl border-gray-300 font-mono text-sm tabular-nums"
                      placeholder="0.00"
                      value={form.cost_price}
                      onChange={(e) => set('cost_price', e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Selling Price (₱)">
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 font-heading font-bold text-sm text-red-600">₱</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7 rounded-xl border-gray-300 font-mono font-bold text-sm text-gray-900 tabular-nums"
                      placeholder="0.00"
                      value={form.selling_price}
                      onChange={(e) => set('selling_price', e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Reorder Alert Qty">
                  <Input type="number" min="0" className="rounded-xl border-gray-300 font-mono text-sm tabular-nums" placeholder="5" value={form.reorder_threshold} onChange={(e) => set('reorder_threshold', e.target.value)} />
                </Field>
              </div>
              {!isEdit && (
                <Field label="Initial Stock Quantity" error={fieldErrors.initial_stock}>
                  <Input type="number" min="0" className="rounded-xl border-gray-300 font-mono text-sm tabular-nums" placeholder="0" value={form.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} />
                </Field>
              )}
            </Section>

            <Section title="Shop Storage Location">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Aisle">
                  <Input className="rounded-xl border-gray-300 font-mono uppercase" placeholder="e.g. A1" value={form.location_aisle} onChange={(e) => set('location_aisle', e.target.value)} />
                </Field>
                <Field label="Shelf">
                  <Input className="rounded-xl border-gray-300 font-mono uppercase" placeholder="e.g. S2" value={form.location_shelf} onChange={(e) => set('location_shelf', e.target.value)} />
                </Field>
                <Field label="Bin">
                  <Input className="rounded-xl border-gray-300 font-mono uppercase" placeholder="e.g. B3" value={form.location_bin} onChange={(e) => set('location_bin', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Notes / Specifications">
              <Textarea
                className="rounded-xl border-gray-300 text-sm"
                placeholder="Fitment details, OEM interchange part numbers, supplier warranty..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Section>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button type="submit" disabled={saving} className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Product'}
              </Button>
              <Button type="button" variant="secondary" onClick={close} className="rounded-xl border border-gray-200">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

