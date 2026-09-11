import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wrench, User, Lock, Eye, EyeOff, KeyRound, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  function handleAutoFill() {
    setUsername('admin');
    setPassword('admin123');
    setError('');
    toast.info('Fixed admin credentials filled!');
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-100/80 p-4 sm:p-6 overflow-hidden text-gray-900 selection:bg-red-600 selection:text-white">
      {/* Background Decorative Pattern & Floating Blob Visual Elements (Inspired by Design) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid dots background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

        {/* Dynamic Floating Abstract Shapes */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-[15%] sm:left-[22%] -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-400/30 to-indigo-400/20 blur-2xl"
        />

        <motion.div
          animate={{
            y: [0, 14, 0],
            rotate: [0, -8, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-[18%] sm:left-[25%] -translate-y-1/2 w-56 h-56 rounded-full bg-gradient-to-tr from-amber-400/40 to-yellow-300/30 blur-xl"
        />

        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 8, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-2/5 left-[12%] sm:left-[20%] w-72 h-72 rounded-full bg-gradient-to-tr from-rose-500/25 to-red-400/20 blur-3xl"
        />

        {/* Playful Floating Confetti Dots & Shapes */}
        <motion.div
          animate={{ y: [-5, 8, -5], rotate: [0, 180, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/3 left-[26%] hidden lg:block text-amber-400/80"
        >
          ▲
        </motion.div>
        <motion.div
          animate={{ y: [6, -8, 6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-[16%] hidden lg:block w-3.5 h-3.5 rounded-full bg-rose-400/70"
        />
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-2/5 left-[28%] hidden lg:block text-indigo-400/70"
        >
          ✦
        </motion.div>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Top Centered Brand Logo Badge (Inspired by WordPress Emblem style) */}
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 6 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black p-1 shadow-xl shadow-gray-900/15 ring-4 ring-white"
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-inner">
              <Wrench size={32} strokeWidth={2.2} />
            </div>
          </motion.div>

          <div className="space-y-0.5">
            <h1 className="font-display text-2xl font-black tracking-tight text-gray-900">
              JAYJEF INVENTORY
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Auto Parts &amp; Supplies Management
            </p>
          </div>
        </div>

        {/* Login Card (Shadcn UI Card) */}
        <Card className="relative overflow-hidden rounded-[2rem] border border-gray-200/90 bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-gray-950/5 space-y-6">
          <CardHeader className="p-0 space-y-1 text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck size={20} className="text-red-600" />
              Administrator Access
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Sign in with your fixed administrator credentials to access system features.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-5">
            {/* Error Message Box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
              >
                {error}
              </motion.div>
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
                    placeholder="Username (e.g. admin)"
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

              {/* Remember Me & Auto-Fill Options */}
              <div className="flex items-center justify-between pt-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-md border-gray-300 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                  />
                  Remember Me
                </label>

                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline transition-all"
                >
                  <Sparkles size={13} />
                  Fill Credentials
                </button>
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

            {/* Fixed Credentials Helper Callout */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <KeyRound size={14} className="text-amber-700" />
                Default Admin Credentials
              </div>
              <div className="font-mono text-[11px] bg-white/90 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                <span>Username: <strong className="text-gray-900">admin</strong></span>
                <span>Password: <strong className="text-gray-900">admin123</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Sub-links (Inspired by design: Lost password / Back link) */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center text-xs text-gray-500">
          <button
            type="button"
            onClick={handleAutoFill}
            className="hover:text-gray-800 transition-colors underline font-medium"
          >
            Lost your password?
          </button>

          <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <ArrowLeft size={12} />
            <span>Back to JayJef Auto Parts System Gateway</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
