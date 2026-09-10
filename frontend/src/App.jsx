import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Wrench, LayoutDashboard, Package, ClipboardList, FileText, ScanLine, Map, BarChart3, Bot, Sparkles } from 'lucide-react';
import { Toaster } from './components/ui/sonner.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OcrPage from './pages/OcrPage.jsx';
import MapPage from './pages/MapPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';
import AiChatbot from './components/AiChatbot.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, isSpecial: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/orders', label: 'Orders', icon: FileText },
  { to: '/ocr', label: 'OCR Capture', icon: ScanLine },
  { to: '/map', label: 'Shop Map', icon: Map },
];

function NavItem({ to, label, icon: Icon, isSpecial }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'border-red-600 bg-red-50 text-black-900 font-bold'
            : isSpecial
            ? 'border-transparent text-red-600 hover:bg-red-50'
            : 'border-transparent text-black-500 hover:bg-gray-50 hover:text-black-900'
        }`
      }
    >
      <Icon size={18} className={isSpecial ? 'text-red-600' : ''} />
      <span>{label}</span>
      {isSpecial && (
        <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
          AI
        </span>
      )}
    </NavLink>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-600 text-white">
              <Wrench size={18} strokeWidth={2} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base text-black-900">JAYJEF</span>
              <span className="block text-[10px] font-medium uppercase tracking-wide text-black-500">
                Auto Parts &amp; Supplies
              </span>
            </span>
          </NavLink>
          <nav className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-4">
            {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} />)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-x-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/products/*" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/orders/*" element={<OrdersPage />} />
            <Route path="/ocr/*" element={<OcrPage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </main>
      </div>
      <AiChatbot />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
