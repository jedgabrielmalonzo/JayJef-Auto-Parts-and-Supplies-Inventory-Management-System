import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getSupplier, createSupplier, updateSupplier } from '../api/suppliers.js';
import Button from '../components/Button.jsx';
import Field, { inputClasses } from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';

const EMPTY_FORM = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' };

export default function SupplierFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    getSupplier(id)
      .then((supplier) => {
        setForm({ ...EMPTY_FORM, ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, supplier[k] ?? ''])) });
      })
      .catch((err) => setError(err.message))
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
    setError(null);
    setFieldErrors({});
    try {
      if (isEdit) await updateSupplier(id, form);
      else await createSupplier(form);
      close();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit Supplier' : 'Add Supplier'} onClose={close} maxWidth="max-w-lg">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" required error={fieldErrors.name}>
              <input className={inputClasses(!!fieldErrors.name)} placeholder="e.g. Denso Philippines Distribution" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Contact Person">
              <input className={inputClasses(false)} placeholder="e.g. Maria Santos" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <input className={inputClasses(false)} placeholder="e.g. 0917 123 4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="email" className={inputClasses(false)} placeholder="e.g. orders@supplier.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <input className={inputClasses(false)} placeholder="e.g. 123 Industrial Ave, Quezon City" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea className={`${inputClasses(false)} h-20`} placeholder="Payment terms, lead time, etc." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Supplier'}
              </Button>
              <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
