import { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, LayoutDashboard, Package, ClipboardList, FileText, ScanLine, Map, BarChart3, Bot,
  Menu, X, Settings, Truck
} from 'lucide-react';
import { Toaster } from './components/ui/sonner.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import OcrPage from './pages/OcrPage.jsx';
import MapPage from './pages/MapPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products and Catalog', icon: Package },
  { to: '/inventory', label: 'Stock and Movement', icon: ClipboardList },
  { to: '/orders', label: 'Orders and Receipts', icon: FileText },
  { to: '/suppliers', label: 'Suppliers Catalog', icon: Truck },
  { to: '/reports', label: 'Report and Analytics', icon: BarChart3 },
  { to: '/ocr', label: 'OCR Smart Capture', icon: ScanLine },
  { to: '/map', label: 'Shop Map 3D', icon: Map },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
];

const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const navListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

function HeaderBar({ onToggleMobileSidebar }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMobileSidebar}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </motion.button>
        <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 truncate">
          JayJef Auto Parts
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              {isAdmin ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Admin ({user?.name || 'Manager'})
                </>
              ) : (
                'JayJef Staff'
              )}
            </span>
            <span className="text-[10px] font-medium text-gray-500">{time}</span>
          </div>
          <NavLink to="/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity">
            {isAdmin ? 'AD' : 'JJ'}
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label, icon: Icon, isSpecial, onClick }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <motion.div variants={navItemVariants}>
      <NavLink
        to={to}
        onClick={onClick}
        className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive
          ? 'text-white font-bold'
          : isSpecial
            ? 'text-red-600 hover:bg-red-50/70 hover:text-red-700'
            : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
          }`}
      >
        {/* Animated Gliding Active Background Pill */}
        {isActive && (
          <motion.span
            layoutId="activeSidebarPill"
            className="absolute inset-0 rounded-xl bg-red-600 shadow-md shadow-red-600/30"
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />
        )}

        <motion.div
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="relative z-10"
        >
          <Icon size={18} className={isSpecial && !isActive ? 'text-red-600' : ''} />
        </motion.div>

        <span className="relative z-10 flex-1 truncate">{label}</span>

        {isSpecial && (
          <span
            className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${isActive
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-red-100 border border-red-200 text-red-600'
              }`}
          >
            AI
          </span>
        )}
      </NavLink>
    </motion.div>
  );
}

function SidebarContent({ onCloseMobile }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Shop Brand Logo & Mobile Close */}
        <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-gray-100 pb-5">
          <NavLink to="/dashboard" onClick={onCloseMobile} className="flex items-center gap-3">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30"
            >
              <Wrench size={22} strokeWidth={2.5} />
            </motion.span>
            <span className="leading-none">
              <span className="block font-display text-lg tracking-tight text-gray-900">JAYJEF</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600 mt-1">
                Auto Parts &amp; Supplies
              </span>
            </span>
          </NavLink>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Navigation Category */}

        <motion.nav
          variants={navListVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1"
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} onClick={onCloseMobile} />
          ))}
        </motion.nav>
      </div>

      {/* Bottom Sidebar Section: Settings */}
      <div className="pt-3 border-t border-gray-100 mt-auto">
        <NavItem to="/settings" label="Settings & Admin" icon={Settings} onClick={onCloseMobile} />
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAssistant = location.pathname.startsWith('/assistant');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname.split('/')[1] || 'dashboard'}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full ${isAssistant ? 'h-full flex flex-col' : ''}`}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products/*" element={<ProductsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders/*" element={<OrdersPage />} />
          <Route path="/suppliers/*" element={<SuppliersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ocr/*" element={<OcrPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}


function MainAppLayout() {
  const { isAdmin } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // FIRST ENCOUNTER GATEKEEPER:
  // If user is not logged in as Admin, display full-screen Admin Login page immediately!
  if (!isAdmin) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-gray-900">
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar (Animated Drawer) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white shadow-2xl lg:hidden"
          >
            <SidebarContent onCloseMobile={() => setMobileSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Static Layout with Settings at the bottom) */}
      <aside className="hidden lg:flex inset-y-0 left-0 z-50 h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white sticky top-0">
        <SidebarContent onCloseMobile={() => { }} />
      </aside>

      {/* Main Content Area with Header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderBar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainAppLayout />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}


