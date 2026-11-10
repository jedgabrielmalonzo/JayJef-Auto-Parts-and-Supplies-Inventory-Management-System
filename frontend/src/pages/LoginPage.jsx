import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { JayJefLogo } from '../components/JayJefLogo.jsx';

/* ─── Product Image Carousels (4 Rows × 4 Photos, 100% Authentic Aircon Parts) ─── */
const ROW_1_IMAGES = [
  { id: '1', image: '/products/part-compressor.png', name: 'Denso AC Compressor' },
  { id: '2', image: '/products/part-condenser-dual.png', name: 'Dual Condenser / Radiator' },
  { id: '3', image: '/products/part-block-valve.png', name: 'Block Expansion Valve' },
  { id: '4', image: '/products/part-evaporator.png', name: 'Evaporator Core' },
];

const ROW_2_IMAGES = [
  { id: '5', image: '/products/part-valeo-compressor.webp', name: 'Valeo DCS Compressor' },
  { id: '6', image: '/products/part-receiver-drier.png', name: 'Receiver Drier Bottle' },
  { id: '7', image: '/products/part-cabin-filters.png', name: 'Cabin & Air Filters' },
  { id: '8', image: '/products/part-pressure-sensor.webp', name: 'AC Pressure Sensor' },
];

const ROW_3_IMAGES = [
  { id: '9', image: '/products/part-condenser-parallel.webp', name: 'Parallel Flow Condenser' },
  { id: '10', image: '/products/part-blower-wheel.webp', name: 'Dual Blower Impeller Fan' },
  { id: '11', image: '/products/part-expansion-valve.png', name: 'Capillary TXV Valve' },
  { id: '12', image: '/products/part-valeo-drier.png', name: 'Valeo Black Filter Drier' },
];

const ROW_4_IMAGES = [
  { id: '13', image: '/products/part-evaporator-tubing.webp', name: 'Evaporator with Manifold' },
  { id: '14', image: '/products/part-radiators-triple.png', name: 'Triple Radiator Stack' },
  { id: '15', image: '/products/part-valeo-compressor.webp', name: 'Valeo DCS Compressor' },
  { id: '16', image: '/products/part-compressor.png', name: 'Denso AC Compressor' },
];

/* ─── Single Photo-Only Card (No Words, No Text) ─── */
function ProductMarqueeCard({ item }) {
  return (
    <div className="relative flex h-32 w-40 sm:h-36 sm:w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/15 border border-white/80 p-2.5 select-none transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <img
        src={item.image}
        alt={item.name || 'JayJef Aircon Component'}
        className="h-full w-full object-contain filter drop-shadow-sm"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    </div>
  );
}

/* ─── Straight Infinite Marquee Row (Seamless Loop, Level) ─── */
function ProductMarqueeRow({ items, speedClass = 'animate-marquee-left' }) {
  // Triple array for seamless infinite loop
  const seamlessItems = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden w-full flex">
      <div className={`flex gap-5 ${speedClass}`}>
        {seamlessItems.map((item, idx) => (
          <ProductMarqueeCard key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
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

      {/* ─── Right Panel: Branded #FF0A33 Multi-Row Product Marquee Carousel ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between"
        style={{
          background: 'linear-gradient(135deg, #FF0A33 0%, #D60026 50%, #990018 100%)',
        }}
      >
        {/* Soft Ambient Radial Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-black/20 blur-3xl" />
        </div>

        {/* ── 4-Row Product Carousel (Pictures Only, Perfectly Straight) ── */}
        <div className="relative z-10 pt-6 sm:pt-8 space-y-3.5">
          {/* Row 1: Drifts Left ← */}
          <ProductMarqueeRow
            items={ROW_1_IMAGES}
            speedClass="animate-marquee-left"
          />

          {/* Row 2: Drifts Right → */}
          <ProductMarqueeRow
            items={ROW_2_IMAGES}
            speedClass="animate-marquee-right"
          />

          {/* Row 3: Drifts Left ← */}
          <ProductMarqueeRow
            items={ROW_3_IMAGES}
            speedClass="animate-marquee-left-fast"
          />

          {/* Row 4: Drifts Right → */}
          <ProductMarqueeRow
            items={ROW_4_IMAGES}
            speedClass="animate-marquee-right"
          />
        </div>

        {/* ── Bottom Headline with Gradient for 100% Contrast ── */}
        <div className="relative z-20 p-10 sm:p-14 bg-gradient-to-t from-[#800010] via-[#B30018]/90 to-transparent pt-28">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.12] tracking-tight drop-shadow-md">
            Every auto part,<br />
            in plain sight.
          </h2>
        </div>
      </motion.div>
    </div>
  );
}
