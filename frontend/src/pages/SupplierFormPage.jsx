import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus, Trash2, PackageCheck, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { getSupplier, createSupplier, updateSupplier, getSupplierProducts, updateSupplierProducts } from '../api/suppliers.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' };

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

export default function SupplierFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [constantProducts, setConstantProducts] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([
      getSupplier(id),
      getSupplierProducts(id).catch(() => []),
    ])
      .then(([supplier, products]) => {
        setForm({ ...EMPTY_FORM, ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, supplier[k] ?? ''])) });
        setConstantProducts(products);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function close() {
    navigate('/suppliers');
  }

  function addConstantProduct(prod) {
    if (!prod) return;
    if (constantProducts.some((p) => p.id === prod.id)) {
      toast.info('Product is already in this supplier constant memory list');
      return;
    }
    setConstantProducts((prev) => [...prev, prod]);
  }

  function removeConstantProduct(prodId) {
    setConstantProducts((prev) => prev.filter((p) => p.id !== prodId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      let supplierId = id;
      if (isEdit) {
        await updateSupplier(id, form);
      } else {
        const created = await createSupplier(form);
        supplierId = created.id;
      }

      // Save memory of constant products for this supplier
      const productIds = constantProducts.map((p) => p.id);
      await updateSupplierProducts(supplierId, productIds);

      toast.success(isEdit ? 'Supplier updated successfully' : 'New supplier added to catalog');
      close();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="border-b border-gray-100 pb-4 mb-2">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck size={20} className="text-red-600" />
            {isEdit ? 'Edit Supplier & Constant Products' : 'Add New Supplier'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 size={18} className="animate-spin text-red-600" />
            Loading supplier details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Field label="Supplier Name" required error={fieldErrors.name}>
                <Input
                  className="rounded-xl border-gray-300 font-semibold focus:border-red-600"
                  aria-invalid={!!fieldErrors.name}
                  placeholder="e.g. Denso Philippines Distribution"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </Field>

              <Field label="Contact Representative">
                <Input
                  className="rounded-xl border-gray-300"
                  placeholder="e.g. Maria Santos (Key Accounts Mgr)"
                  value={form.contact_person}
                  onChange={(e) => set('contact_person', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone / Mobile">
                  <Input
                    className="rounded-xl border-gray-300 font-mono text-sm"
                    placeholder="e.g. 0917 123 4567"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    className="rounded-xl border-gray-300 text-sm"
                    placeholder="e.g. orders@denso.ph"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Office / Warehouse Address">
                <Input
                  className="rounded-xl border-gray-300 text-sm"
                  placeholder="e.g. 123 Industrial Ave, Quezon City"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </Field>

              <Field label="Supplier Notes & Lead Time">
                <Textarea
                  className="rounded-xl border-gray-300 text-sm min-h-20"
                  placeholder="e.g. 30-day net terms, 3-day lead time for aircon compressors."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </Field>
            </div>

            {/* CONSTANT PRODUCTS MEMORY SECTION */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-red-600" />
                    Constant Products Memory ({constantProducts.length})
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Products regularly ordered from this supplier. Pick below to memorize.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <ProductPicker
                  selected={null}
                  onSelect={addConstantProduct}
                  placeholder="Search SKU or name to assign to this supplier..."
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden max-h-56 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-gray-100/70">
                    <TableRow>
                      <TableHead className="text-[11px] font-bold text-gray-700">Product</TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-700">Cost Price</TableHead>
                      <TableHead className="text-[11px] font-bold text-gray-700">In Stock</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {constantProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-xs text-gray-400">
                          No constant products memorized yet for this supplier.
                        </TableCell>
                      </TableRow>
                    )}
                    {constantProducts.map((p) => (
                      <TableRow key={p.id} className="hover:bg-white transition-colors">
                        <TableCell>
                          <div className="font-semibold text-xs text-gray-900">{p.name}</div>
                          <div className="font-mono text-[10px] text-gray-500">{p.sku}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-gray-900">
                          ₱{Number(p.cost_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="tabular-nums text-xs">
                          <span className="font-bold text-gray-900">{p.stock_quantity || 0}</span> {p.unit || 'pc'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Remove product"
                            className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                            onClick={() => removeConstantProduct(p.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={close} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white text-xs shadow-md"
              >
                {saving && <Loader2 size={16} className="animate-spin mr-1" />}
                {saving ? 'Saving...' : 'Save Supplier & Memory'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
