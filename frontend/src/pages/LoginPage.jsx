import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { JayJefLogo } from '../components/JayJefLogo.jsx';

/**
 * Decorative SVG background for the right panel — gear/wrench motif with
 * an EKG-style line, adapted to an auto-parts aesthetic.
 */
function RightPanelDecoration() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Large gear — top right */}
      <circle cx="680" cy="120" r="140" fill="white" fillOpacity="0.06" />
      <circle cx="680" cy="120" r="100" fill="white" fillOpacity="0.05" />
      {/* Medium gear — center left */}
      <circle cx="100" cy="500" r="100" fill="white" fillOpacity="0.06" />
      <circle cx="100" cy="500" r="65" fill="white" fillOpacity="0.05" />
      {/* Small gear — bottom right */}
      <circle cx="650" cy="750" r="80" fill="white" fillOpacity="0.06" />
      <circle cx="650" cy="750" r="50" fill="white" fillOpacity="0.05" />
      {/* Tiny accent */}
      <circle cx="350" cy="200" r="40" fill="white" fillOpacity="0.04" />

      {/* Wrench silhouette (simplified) */}
      <g transform="translate(500, 350) rotate(-30)" opacity="0.07">
        <rect x="-12" y="-120" width="24" height="200" rx="12" fill="white" />
        <circle cx="0" cy="-130" r="36" fill="none" stroke="white" strokeWidth="14" />
      </g>

      {/* EKG / pulse line across the middle */}
      <polyline
        points="0,480 150,480 200,480 240,480 280,460 310,520 340,400 370,540 400,460 430,480 500,480 560,480 600,460 630,520 660,400 690,480 800,480"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );
}

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
    <div className="min-h-screen w-full flex bg-white text-gray-900 selection:bg-red-600 selection:text-white">
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Sign in to manage your inventory — your parts are waiting&nbsp;for&nbsp;you.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username / Email */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Username or Email
              </Label>
              <Input
                type="text"
                className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@example.com"
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
                  className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 pr-11 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all font-mono"
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

              {/* Forgot password link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.98] font-bold text-white text-sm shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Footer disclaimer */}
        <p className="text-[11px] text-gray-400 mt-6">
          JayJef Auto Parts &amp; Supplies — Inventory management, not&nbsp;guesswork.
        </p>
      </motion.div>

      {/* ─── Right Panel: Branded Decoration ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-950 items-end justify-center"
      >
        <RightPanelDecoration />

        {/* Hero tagline */}
        <div className="relative z-10 px-12 pb-20">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
            Every part counted,<br />
            every order tracked.
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
