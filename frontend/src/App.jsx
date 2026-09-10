import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  Wrench, LayoutDashboard, Package, ClipboardList, FileText, ScanLine, Map, BarChart3, Bot,
  Search, Menu, X
} from 'lucide-react';
import { Toaster } from './components/ui/sonner.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OcrPage from './pages/OcrPage.jsx';
import MapPage from './pages/MapPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products and Catalog', icon: Package },
  { to: '/inventory', label: 'Stock and Movement', icon: ClipboardList },
  { to: '/orders', label: 'Orders and Receipts', icon: FileText },
  { to: '/reports', label: 'Report and Analytics', icon: BarChart3 },
  { to: '/ocr', label: 'OCR Smart Capture', icon: ScanLine },
  { to: '/map', label: 'Shop Map 3D', icon: Map },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
];

function HeaderBar({ onToggleMobileSidebar }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 truncate">
          JayJef Auto Parts • Main Branch
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
          <Search size={14} className="text-gray-400" />
          <span>Quick search products, SKUs...</span>
          <kbd className="rounded border border-gray-300 bg-white px-1.5 text-[10px] font-bold text-gray-600 shadow-xs">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-bold text-gray-900">JayJef Staff</span>
            <span className="text-[10px] font-medium text-gray-500">{time}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs shadow-sm">
            JJ
          </div>
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, label, icon: Icon, isSpecial, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? 'bg-red-600 text-white font-bold shadow-sm'
            : isSpecial
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={18} className={isSpecial ? 'text-red-600' : ''} />
      <span className="flex-1 truncate">{label}</span>
      {isSpecial && (
        <span className="rounded-full bg-red-100 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase">
          AI
        </span>
      )}
    </NavLink>
  );
}

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50/70 text-gray-900">
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Shop Brand Logo & Mobile Close */}
            <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-gray-100 pb-5">
              <NavLink to="/dashboard" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                  <Wrench size={22} strokeWidth={2.5} />
                </span>
                <span className="leading-none">
                  <span className="block font-display text-lg tracking-tight text-gray-900">JAYJEF</span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600 mt-1">
                    Auto Parts &amp; Supplies
                  </span>
                </span>
              </NavLink>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Category */}
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              System Modules
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} {...item} onClick={() => setMobileSidebarOpen(false)} />
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area with Header */}
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderBar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products/*" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/orders/*" element={<OrdersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/ocr/*" element={<OcrPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
