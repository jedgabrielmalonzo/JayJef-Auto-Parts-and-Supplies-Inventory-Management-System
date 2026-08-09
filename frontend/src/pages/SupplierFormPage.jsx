import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSupplier, createSupplier, updateSupplier } from '../api/suppliers.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' };

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

export default function SupplierFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    getSupplier(id)
      .then((supplier) => {
        setForm({ ...EMPTY_FORM, ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, supplier[k] ?? ''])) });
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (isEdit) {
        await updateSupplier(id, form);
        toast.success('Supplier saved');
      } else {
        await createSupplier(form);
        toast.success('Supplier added');
      }
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-black-500">
            <Loader2 size={16} className="animate-spin" />
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" required error={fieldErrors.name}>
              <Input aria-invalid={!!fieldErrors.name} placeholder="e.g. Denso Philippines Distribution" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Contact Person">
              <Input placeholder="e.g. Maria Santos" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <Input placeholder="e.g. 0917 123 4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" placeholder="e.g. orders@supplier.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <Input placeholder="e.g. 123 Industrial Ave, Quezon City" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Payment terms, lead time, etc." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Supplier'}
              </Button>
              <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
