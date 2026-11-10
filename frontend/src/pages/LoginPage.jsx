import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { JayJefLogo } from '../components/JayJefLogo.jsx';

/**
 * Automotive hero background art matching the FurFeel design concept:
 * 1. Giant stylized car silhouette watermark in the upper area (like the paw print)
 * 2. Crisp horizontal aerodynamic speedline cutting edge-to-edge (like the heartbeat pulse)
 */
function AutomotiveHeroArt() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* ── Giant Minimalist Car Silhouette (Watermark) ── */}
      <g opacity="0.14" transform="translate(130, 110) scale(1.18)">
        {/* Sleek Aerodynamic Car Silhouette Body */}
        <path
          d="M 40 260
             C 50 260, 65 215, 105 215
             C 145 215, 160 260, 170 260
             L 370 260
             C 380 260, 395 215, 435 215
             C 475 215, 490 260, 500 260
             L 535 260
             C 545 250, 550 230, 540 215
             C 525 190, 500 185, 460 180
             C 415 175, 370 165, 330 105
             C 290 45, 240 35, 170 35
             C 115 35, 80 65, 55 105
             L 15 150
             C 0 165, -10 185, -5 210
             C 0 235, 20 255, 40 260
             Z"
          fill="white"
        />

        {/* Windows / Cabin Glass Cutout */}
        <path
          d="M 170 55
             C 230 55, 275 65, 310 120
             L 170 120
             Z"
          fill="#FF0A33"
          fillOpacity="0.45"
        />
        <path
          d="M 150 60
             L 150 120
             L 70 120
             C 90 85, 120 62, 150 60
             Z"
          fill="#FF0A33"
          fillOpacity="0.45"
        />

        {/* Wheels & Tires */}
        <circle cx="105" cy="260" r="40" fill="#FF0A33" fillOpacity="0.35" stroke="white" strokeWidth="8" />
        <circle cx="105" cy="260" r="16" fill="white" />
        <circle cx="435" cy="260" r="40" fill="#FF0A33" fillOpacity="0.35" stroke="white" strokeWidth="8" />
        <circle cx="435" cy="260" r="16" fill="white" />
      </g>

      {/* ── Crisp Horizontal Automotive Speedline across center ── */}

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

      {/* ─── Right Panel: Branded #FF0A33 Hero (FurFeel Concept with Car Elements) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-end p-12 sm:p-16 lg:p-20"
        style={{
          backgroundColor: '#FF0A33',
        }}
      >
        <AutomotiveHeroArt />

        {/* Hero Headline — Bottom-Left Aligned, exactly like the reference */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
            Every auto part,<br />
            in plain sight.
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
