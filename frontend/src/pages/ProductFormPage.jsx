import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ImagePlus, X } from 'lucide-react';
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

function Section({ title, children }) {
  return (
    <section className="border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-700">{error}</p>}
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

  // Revoke the object URL for a locally-picked file when it's replaced/unmounted.
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
        toast.success('Product saved');
      } else {
        await createProduct(payload);
        toast.success('Product added');
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

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-black-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Section title="Photo">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100">
                  {displayedImage ? (
                    <img src={displayedImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={22} className="text-black-300" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product-image" className="w-fit cursor-pointer">
                    <span className="inline-flex h-9 items-center rounded border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-black-900 hover:bg-gray-50">
                      {displayedImage ? 'Change photo' : 'Upload photo'}
                    </span>
                    <input id="product-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </Label>
                  {displayedImage && (
                    <button type="button" onClick={clearImage} className="inline-flex w-fit items-center gap-1 text-xs text-black-500 hover:text-red-600">
                      <X size={12} /> Remove photo
                    </button>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Basic Info">
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU" required error={fieldErrors.sku}>
                  <Input
                    className="font-mono"
                    aria-invalid={!!fieldErrors.sku}
                    placeholder="e.g. CMP-1023"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Category" required error={fieldErrors.category}>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger aria-invalid={!!fieldErrors.category}>
                      <SelectValue placeholder="Select a category">{(v) => v && formatCategory(v)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Name" required error={fieldErrors.name}>
                <Input
                  aria-invalid={!!fieldErrors.name}
                  placeholder="e.g. AC Compressor — Denso 10PA17C"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand">
                  <Input placeholder="e.g. Denso, Sanden, Valeo" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                </Field>
                <Field label="Unit">
                  <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="pc, set, box, liter, kg" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Compatible Vehicles">
                  <Input value={form.compatible_vehicles} onChange={(e) => set('compatible_vehicles', e.target.value)} placeholder="e.g. Toyota Vios 2013–2018" />
                </Field>
                <Field label="Supplier">
                  <Select value={form.supplier_id} onValueChange={(v) => set('supplier_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No default supplier">
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

            <Section title="Pricing & Stock">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Cost Price">
                  <Input type="number" step="0.01" min="0" className="tabular-nums" placeholder="0.00" value={form.cost_price} onChange={(e) => set('cost_price', e.target.value)} />
                </Field>
                <Field label="Selling Price">
                  <Input type="number" step="0.01" min="0" className="tabular-nums" placeholder="0.00" value={form.selling_price} onChange={(e) => set('selling_price', e.target.value)} />
                </Field>
                <Field label="Reorder Threshold">
                  <Input type="number" min="0" className="tabular-nums" placeholder="5" value={form.reorder_threshold} onChange={(e) => set('reorder_threshold', e.target.value)} />
                </Field>
              </div>
              {!isEdit && (
                <Field label="Initial Stock" error={fieldErrors.initial_stock}>
                  <Input type="number" min="0" className="tabular-nums" placeholder="0" value={form.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} />
                </Field>
              )}
            </Section>

            <Section title="Location">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Aisle">
                  <Input placeholder="e.g. A1" value={form.location_aisle} onChange={(e) => set('location_aisle', e.target.value)} />
                </Field>
                <Field label="Shelf">
                  <Input placeholder="e.g. S2" value={form.location_shelf} onChange={(e) => set('location_shelf', e.target.value)} />
                </Field>
                <Field label="Bin">
                  <Input placeholder="e.g. B3" value={form.location_bin} onChange={(e) => set('location_bin', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Notes">
              <Textarea
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
        )}
      </DialogContent>
    </Dialog>
  );
}
