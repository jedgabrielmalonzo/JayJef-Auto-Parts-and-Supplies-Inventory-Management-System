import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    setTimeout(() => {
      const res = login(username, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
      } else {
        setError(res.error);
        toast.error('Login failed. Please check credentials.');
      }
      setSubmitting(false);
    }, 300);
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-gray-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 block">
            Auto Parts &amp; Supplies System
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">
            JAYJEF INVENTORY
          </h1>
        </div>

        {/* Login Card */}
        <Card className="w-full shadow-lg border border-gray-200 rounded-2xl bg-white p-6 space-y-5">
          <CardHeader className="p-0 pb-2 space-y-1">
            <CardTitle className="text-xl font-bold text-gray-900">Admin Login</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Enter admin credentials to access the system dashboard and catalog.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            {/* Fixed Credentials Callout */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold text-amber-950">Fixed Admin Credentials</div>
              <div className="font-mono text-[11px] bg-white/80 p-2 rounded-lg border border-amber-200 space-y-0.5">
                <div>Username: <strong className="text-gray-900">admin</strong></div>
                <div>Password: <strong className="text-gray-900">admin123</strong></div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Username</Label>
                <Input
                  type="text"
                  className="rounded-xl border-gray-300 font-mono text-sm focus:border-red-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Password</Label>
                <Input
                  type="password"
                  className="rounded-xl border-gray-300 font-mono text-sm focus:border-red-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white shadow-md transition-all text-xs"
              >
                {submitting ? 'Authenticating...' : 'Log In to System'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 font-mono">
          JayJef Auto Parts &amp; Supplies &bull; System Gateway
        </p>
      </div>
    </div>
  );
}
