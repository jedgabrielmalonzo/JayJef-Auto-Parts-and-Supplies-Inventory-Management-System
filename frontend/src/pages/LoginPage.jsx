import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { JayJefLogo } from '../components/JayJefLogo.jsx';

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
    <div className="min-h-screen w-full flex bg-white text-gray-900 selection:bg-[#FF0A33] selection:text-white">
      {/* ─── Left Panel: Login Form ─── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full lg:w-1/2 flex flex-col justify-between px-8 sm:px-14 md:px-20 lg:px-24 py-10"
      >
        {/* Logo top-left */}
        <div>
          <JayJefLogo variant="sidebar" className="border-none shadow-none p-0" />
        </div>

        {/* Form area — vertically centered */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to access JayJef Auto Parts &amp; Supplies Inventory.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#FF0A33]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Username or Email
              </Label>
              <Input
                type="text"
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#FF0A33] focus:ring-2 focus:ring-[#FF0A33]/20 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-11 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#FF0A33] focus:ring-2 focus:ring-[#FF0A33]/20 transition-all font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Sign in button — Plain flat red #FF0A33 button, no gradient, no glow shadow */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-[#FF0A33] hover:bg-[#E60026] active:bg-[#CC0022] disabled:opacity-50 font-bold text-white text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none outline-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer disclaimer */}
        <p className="text-[11px] text-gray-400 mt-6">
          JayJef Auto Parts &amp; Supplies — Aircon parts inventory, always&nbsp;under&nbsp;control.
        </p>
      </motion.div>

      {/* ─── Right Panel: Branded #FF0A33 Hero (Minimalist FurFeel Concept) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-end p-12 sm:p-16 lg:p-20"
        style={{
          backgroundColor: '#FF0A33',
        }}
      >
        {/* Crisp Horizontal Speedline across center */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 800 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M 0 470
               L 180 470
               C 220 470, 245 445, 275 390
               C 310 330, 355 310, 420 310
               C 485 310, 530 335, 565 395
               C 595 445, 615 470, 660 470
               L 800 470"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
          />
        </svg>

        {/* Hero Headline — Bottom-Left Aligned */}
        <div className="relative z-20 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
            Every auto part,<br />
            in plain sight.
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
