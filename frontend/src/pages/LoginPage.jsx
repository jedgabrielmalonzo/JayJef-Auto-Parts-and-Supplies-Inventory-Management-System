import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
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
    }, 350);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 sm:p-6 text-gray-900 selection:bg-red-600 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Login Card (Shadcn UI Card) */}
        <Card className="rounded-[2rem] border border-gray-200 bg-white p-6 sm:p-8 shadow-xl space-y-5">
          <CardHeader className="p-0 text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-gray-900">
              Admin Login
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Error Message Box */}
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-600 pl-1">
                  Username or Email Address
                </Label>
                <div className="relative flex items-center">
                  <User size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="text"
                    className="h-12 w-full rounded-full border-gray-200 bg-gray-50/70 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-600 pl-1">
                  Password
                </Label>
                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-gray-400 pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="h-12 w-full rounded-full border-gray-200 bg-gray-50/70 pl-11 pr-11 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all font-mono"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Log in Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-full bg-red-600 hover:bg-red-700 active:scale-[0.98] font-bold text-white text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Log in'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
