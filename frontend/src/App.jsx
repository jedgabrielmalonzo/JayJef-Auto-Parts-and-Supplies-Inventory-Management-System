import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Wrench, LayoutDashboard, Package, ClipboardList, FileText, ScanLine, Truck, Map, BarChart3, Store, Search } from 'lucide-react';
import { Toaster } from './components/ui/sonner.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LookupPage from './pages/LookupPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OcrPage from './pages/OcrPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import MapPage from './pages/MapPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lookup', label: 'Quick Lookup', icon: Search },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/orders', label: 'Orders', icon: FileText },
  { to: '/ocr', label: 'OCR Capture', icon: ScanLine },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/map', label: 'Shop Map', icon: Map },
  { to: '/settings', label: 'Manage Store', icon: Store },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'border-red-600 bg-red-50 text-black-900'
            : 'border-transparent text-black-500 hover:bg-gray-50 hover:text-black-900'
        }`
      }
    >
      <Icon size={18} />
      {label}
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
            <Route path="/lookup" element={<LookupPage />} />
            <Route path="/products/*" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/orders/*" element={<OrdersPage />} />
            <Route path="/ocr/*" element={<OcrPage />} />
            <Route path="/suppliers/*" element={<SuppliersPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
