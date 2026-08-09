import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSettings } from '../api/shopSettings.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';

export default function SettingsPage() {
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    getSettings()
      .then((s) => setForm({ name: s.name ?? '', address: s.address ?? '', phone: s.phone ?? '' }))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await updateSettings(form);
      toast.success('Shop settings saved');
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-black-500">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-black-900">Manage Store</h1>
        <div className="h-1 w-16 bg-black-900 mt-2" />
      </div>

      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shop Name<span className="text-red-600">*</span></Label>
              <Input aria-invalid={!!fieldErrors.name} value={form.name} onChange={(e) => set('name', e.target.value)} required />
              {fieldErrors.name && <p className="text-sm text-red-700">Required.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="e.g. 123 Industrial Ave, Quezon City" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="e.g. 0917 123 4567" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
