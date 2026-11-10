import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ImagePlus, X, DollarSign, Tag, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getProduct, createProduct, updateProduct } from '../api/products.js';
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
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (form.image_path) {
      const fullUrl = form.image_path.startsWith('http') ? form.image_path : `${API_ORIGIN}${form.image_path}`;
      setImagePreview(fullUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile, form.image_path]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files (JPG, PNG, WebP) are allowed');
        return;
      }
      setImageFile(file);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    set('image_path', '');
  }

  function validate() {
    const errs = {};
    if (!form.sku.trim()) errs.sku = 'SKU / Part Number is required';
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.category) errs.category = 'Category selection is required';

    const cost = Number(form.cost_price);
    const sell = Number(form.selling_price);
    if (form.cost_price && (isNaN(cost) || cost < 0)) errs.cost_price = 'Cost price cannot be negative';
    if (form.selling_price && (isNaN(sell) || sell < 0)) errs.selling_price = 'Selling price cannot be negative';

    const init = Number(form.initial_stock);
    if (!isEdit && form.initial_stock && (isNaN(init) || init < 0)) {
      errs.initial_stock = 'Initial stock cannot be negative';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix highlighted errors in the form.');
      return;
    }

    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    });
    if (imageFile) fd.append('image', imageFile);

    try {
      if (isEdit) {
        await updateProduct(id, fd);
        toast.success(`Updated "${form.name}"`);
      } else {
        await createProduct(fd);
        toast.success(`Created "${form.name}"`);
      }
      navigate('/products');
    } catch (err) {
      if (err.data?.fields) setFieldErrors(err.data.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && navigate('/products')}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-gray-200">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <PackageCheck size={20} />
            </span>
            <div>
              <DialogTitle className="font-heading text-lg font-bold text-gray-900">
                {isEdit ? `Edit Part — ${form.sku || 'Loading...'}` : 'Add New Aircon Part / Supply'}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEdit ? 'Update product information and catalog details' : 'Enter product specs and catalog details'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex h-72 items-center justify-center gap-2 text-gray-500">
            <Loader2 className="animate-spin text-red-600" size={24} />
            <span className="text-sm">Loading part details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <Section title="Product Image">
              <div className="flex items-center gap-4">
                <div className="relative size-24 shrink-0 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden group">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <ImagePlus size={24} className="text-gray-400" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="inline-block">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer shadow-xs transition-colors">
                      <ImagePlus size={14} /> Choose File
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    JPG, PNG, or WebP. Square aspect ratio recommended (e.g. 600×600 px). Max 5MB.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="General Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Part Number / SKU" required error={fieldErrors.sku}>
                  <Input
                    className="font-mono uppercase rounded-xl border-gray-300 focus:border-red-600"
                    aria-invalid={!!fieldErrors.sku}
                    placeholder="e.g. COMP-DEN-10PA17"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    required
                  />
                </Field>
                <Field label="AC Component Category" required error={fieldErrors.category}>
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

              <Field label="Compatible Vehicles / Notes">
                <Input className="rounded-xl border-gray-300" value={form.compatible_vehicles} onChange={(e) => set('compatible_vehicles', e.target.value)} placeholder="e.g. Toyota Vios 2013–2018, Innova 2.5 D4D" />
              </Field>
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
                placeholder="Fitment details, OEM interchange part numbers, notes..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
              />
            </Section>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" className="rounded-xl border-gray-300 font-semibold" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
