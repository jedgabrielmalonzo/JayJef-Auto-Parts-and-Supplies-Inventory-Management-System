import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { getSettings, updateSettings } from '../api/shopSettings.js';
import { soundService } from '../lib/sound.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { Badge } from '../components/ui/badge.jsx';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(soundService.isAudioEnabled());

  useEffect(() => {
    getSettings()
      .then((s) => setForm({ name: s.name ?? '', address: s.address ?? '', phone: s.phone ?? '' }))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveShop(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Shop settings updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleToggleAudio() {
    const next = !audioEnabled;
    soundService.setAudioEnabled(next);
    setAudioEnabled(next);
    toast.success(`Audio alert signals ${next ? 'enabled' : 'disabled'}`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
            System Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage store profile, audio notification signals, administrator session, and system configurations.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs defaultValue="store" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="store" className="rounded-lg text-xs font-bold px-4 py-2">
            Store Profile
          </TabsTrigger>
          <TabsTrigger value="audio" className="rounded-lg text-xs font-bold px-4 py-2">
            Audio Signals
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-xs font-bold px-4 py-2">
            Admin Account
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg text-xs font-bold px-4 py-2">
            System Status
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Store Profile */}
        <TabsContent value="store" className="pt-4">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs p-6 space-y-5">
            <CardHeader className="p-0 pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">Shop Profile &amp; Details</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Business information displayed on printed purchase orders, sales receipts, and header.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading shop profile...</div>
              ) : (
                <form onSubmit={handleSaveShop} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Shop Name</Label>
                      <Input
                        className="rounded-xl border-gray-300 text-sm font-semibold"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="JayJef Auto Parts and Supplies"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">Contact Number</Label>
                      <Input
                        className="rounded-xl border-gray-300 text-sm font-mono"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0917 123 4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Shop Address</Label>
                    <Input
                      className="rounded-xl border-gray-300 text-sm"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. 123 Industrial Ave, Quezon City, Philippines"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={saving} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white text-xs shadow-xs">
                      {saving ? 'Saving...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Audio Signals */}
        <TabsContent value="audio" className="pt-4">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs p-6 space-y-5">
            <CardHeader className="p-0 pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Audio Alert Signals</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Real-time Web Audio API chimes for low stock reorder thresholds and stockout outages.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleAudio}
                className="rounded-xl border-gray-300 text-xs font-bold"
              >
                Audio Status: {audioEnabled ? 'Active' : 'Muted'}
              </Button>
            </CardHeader>
            <CardContent className="p-0 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                <div className="font-bold text-amber-950">Low Stock Signal (E5 - G5)</div>
                <p className="text-amber-900 text-[11px]">Triggers when product quantity drops to or below the reorder threshold.</p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
                <div className="font-bold text-rose-950">Stockout Alarm Signal (A5 - D5)</div>
                <p className="text-rose-900 text-[11px]">Triggers when product stock quantity reaches 0 units (critical outage).</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Admin Account */}
        <TabsContent value="account" className="pt-4">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs p-6 space-y-5">
            <CardHeader className="p-0 pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">Admin Session &amp; Account</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Active administrator credentials and session termination.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                <div>
                  <div className="font-bold text-sm text-gray-900">{user?.name || 'Administrator'}</div>
                  <div className="text-xs text-gray-500 font-mono">Username: @{user?.username || 'admin'} &bull; Role: {user?.role || 'Administrator'}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    logout();
                    toast.info('Administrator logged out');
                  }}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold"
                >
                  Log Out Administrator
                </Button>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-1">
                <div className="font-bold text-blue-950">Fixed Credentials Access</div>
                <p className="text-[11px]">System access is protected by fixed administrator credentials (Username: admin | Password: admin123).</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: System Status */}
        <TabsContent value="system" className="pt-4">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-xs p-6 space-y-5">
            <CardHeader className="p-0 pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900">System Information</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Core system build specifications and database engine health.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-1">
                <span className="text-gray-500 font-semibold block uppercase text-[10px]">App Version</span>
                <span className="font-bold text-gray-900 text-sm font-mono">v2.4.0-stable</span>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-1">
                <span className="text-gray-500 font-semibold block uppercase text-[10px]">Database Engine</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">PostgreSQL / Supabase</span>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-1">
                <span className="text-gray-500 font-semibold block uppercase text-[10px]">Environment</span>
                <span className="font-bold text-gray-900 text-sm font-mono">Production Ready</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
