import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, PackageSearch, Loader2, LayoutGrid, List, Eye, Tag, MapPin, Box, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { listProducts, deleteProduct } from '../api/products.js';
import { createMovement } from '../api/inventory.js';
import { getOverview } from '../api/dashboard.js';
import { CATEGORIES, formatCategory, availability } from '../constants.js';
import { soundService } from '../lib/sound.js';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { Label } from '../components/ui/label.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';
import ProductFormPage from './ProductFormPage.jsx';
import ProductDetailPage from './ProductDetailPage.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

function ProductsListView({ modal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [view, setView] = useState('list'); // Default to table list view
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deductingId, setDeductingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, lowStockResult] = await Promise.all([
        listProducts({ search, category, low_stock: lowStockOnly || undefined, is_active: true }),
        listProducts({ low_stock: true, is_active: true, page_size: 1 }),
      ]);
      setProducts(result.items);
      setTotal(result.total);
      setLowStockTotal(lowStockResult.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, lowStockOnly]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (location.pathname === '/products') load();
  }, [location.pathname]);

  useEffect(() => {
    getOverview().then(setSummary).catch(() => {});
  }, []);

  async function handleDelete() {
    try {
      await deleteProduct(pendingDelete.id);
      toast.success(`"${pendingDelete.name}" deleted`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setPendingDelete(null);
    }
  }

  async function handleQuickDeduct(p) {
    if (p.stock_quantity <= 0) {
      soundService.playStockoutAlert();
      toast.error(`"${p.name}" is out of stock!`);
      return;
    }
    setDeductingId(p.id);

    const newQty = Math.max(0, p.stock_quantity - 1);

    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, stock_quantity: newQty } : item))
    );

    // Audio alert signal when stock drops to 0 or crosses threshold
    soundService.checkAndPlayAlert(newQty, p.reorder_threshold);

    try {
      await createMovement({
        product_id: p.id,
        quantity_change: -1,
        reason: 'manual_adjustment',
        note: '1-Click Quick Sale (-1)',
      });
      if (newQty === 0) {
        toast.error(`🔴 OUT OF STOCK: "${p.name}" reached 0 units!`);
      } else if (newQty <= (p.reorder_threshold || 5)) {
        toast.warning(`⚠️ REORDER WARNING: "${p.name}" is low in stock (${newQty} left)!`);
      } else {
        toast.success(`Sold 1 unit of "${p.name}" (Stock: ${newQty})`);
      }
      getOverview().then(setSummary).catch(() => {});
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setDeductingId(null);
    }
  }

  async function handleQuickRestock(p) {
    setDeductingId(p.id);

    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, stock_quantity: item.stock_quantity + 1 } : item))
    );

    try {
      await createMovement({
        product_id: p.id,
        quantity_change: 1,
        reason: 'manual_adjustment',
        note: '1-Click Quick Restock (+1)',
      });
      toast.success(`Restocked 1 unit to "${p.name}" (Stock: ${p.stock_quantity + 1})`);
      getOverview().then(setSummary).catch(() => {});
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setDeductingId(null);
    }
  }

  const emptyMessage = search || category || lowStockOnly
    ? 'No products match these filters.'
    : 'No products yet — add your first auto part to get started.';

  return (
    <div className="space-y-6">
      {modal}

      {/* Header */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage auto parts, prices, categories, and stock thresholds</p>
        </div>
        <Button render={<Link to="/products/new" />} nativeButton={false} className="shadow-md bg-red-600 hover:bg-red-700">
          <Plus size={18} strokeWidth={2.5} />
          Add New Product
        </Button>
      </motion.div>

      {/* Modern Filter Toolbar */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="w-full pl-10 rounded-xl border-gray-300 focus:border-red-600 focus:ring-red-600/20"
              placeholder="Search by SKU, product name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-[190px] rounded-xl border-gray-300">
              <SelectValue placeholder="All categories">
                {(v) => (!v || v === '_all') ? 'All categories' : formatCategory(v)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{formatCategory(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Checkbox checked={lowStockOnly} onCheckedChange={(v) => setLowStockOnly(!!v)} />
            Low stock only
          </Label>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          <button
            title="Grid view"
            onClick={() => setView('grid')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              view === 'grid' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            title="List view"
            onClick={() => setView('list')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              view === 'list' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 size={20} className="animate-spin text-red-600" />
          Loading products...
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <PackageSearch size={36} className="text-gray-300" strokeWidth={1.5} />
          <p className="text-base font-semibold text-gray-700">{emptyMessage}</p>
        </div>
      )}

      {/* Grid Card View (Matching User Reference Image Design) */}
      {!loading && products.length > 0 && view === 'grid' && (
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const avail = availability(p);
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-[#f4f4f6]/60 p-3.5 shadow-xs hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                {/* Top Image Container with Top-Left Dark Overlay SKU Badge */}
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gray-200">
                  <ProductThumb
                    product={p}
                    size="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Floating SKU Pill Badge */}
                  <span className="absolute top-3 left-3 rounded-lg bg-[#09090b]/90 px-3 py-1 font-mono text-[11px] font-bold text-white shadow-md backdrop-blur-xs border border-white/10">
                    {p.sku}
                  </span>
                </div>

                {/* Content Area Matching Reference Layout */}
                <div className="mt-4 px-1 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Category Pill Tag */}
                    <span className="inline-flex rounded-full bg-[#18181b] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                      {formatCategory(p.category)}
                    </span>

                    {/* Product Title */}
                    <h3 className="font-heading text-lg font-bold tracking-tight text-gray-900 line-clamp-1 mt-2">
                      {p.name}
                    </h3>

                    {/* Vehicle Fitment / Brand */}
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {p.brand ? `${p.brand} • ` : ''}{p.compatible_vehicles || 'Universal fitment auto part'}
                    </p>
                  </div>

                  {/* Metadata Rows with Icons */}
                  <div className="space-y-1.5 pt-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-gray-400" />
                      <span className="font-heading text-base font-bold text-gray-900 tabular-nums">
                        ₱{Number(p.selling_price).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-400">/ {p.unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Box size={14} className="text-gray-400" />
                      <span>Stock: <strong className="text-gray-900">{p.stock_quantity}</strong> {p.unit}</span>
                      {p.location_aisle && (
                        <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-md">
                          <MapPin size={10} /> {p.location_aisle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Footer Matching Reference Button */}
                <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between gap-2 px-1">
                  <Badge variant={avail.variant}>{avail.label}</Badge>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={p.stock_quantity <= 0 || deductingId === p.id}
                      onClick={() => handleQuickDeduct(p)}
                      title="1-Click Quick Sell (-1 Unit)"
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                    >
                      <Minus size={13} strokeWidth={3} />
                      1 Sold
                    </button>
                    <button
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#09090b] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-gray-800 transition-colors"
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Table List View */}
      {!loading && products.length > 0 && view === 'list' && (
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                <TableHead className="font-semibold text-gray-700">Product Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Category</TableHead>
                <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                <TableHead className="font-semibold text-gray-700">Price</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const avail = availability(p);
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-red-50/30 transition-colors"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <TableCell><ProductThumb product={p} /></TableCell>
                    <TableCell className="font-mono text-xs font-bold text-red-600">{p.sku}</TableCell>
                    <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{formatCategory(p.category)}</Badge></TableCell>
                    <TableCell className="tabular-nums font-semibold text-gray-900" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={p.stock_quantity <= 0 || deductingId === p.id}
                          onClick={() => handleQuickDeduct(p)}
                          title="1-Click Quick Sell (-1 Unit)"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 transition-colors"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 tabular-nums">{p.stock_quantity}</span>
                        <button
                          disabled={deductingId === p.id}
                          onClick={() => handleQuickRestock(p)}
                          title="1-Click Quick Restock (+1 Unit)"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40 transition-colors"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="font-heading font-bold text-gray-900 tabular-nums">
                      ₱{Number(p.selling_price).toFixed(2)}
                    </TableCell>
                    <TableCell><Badge variant={avail.variant}>{avail.label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          render={<Link to={`/products/${p.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          title="View"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          render={<Link to={`/products/${p.id}/edit`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete"
                          className="hover:bg-red-100 hover:text-red-600"
                          onClick={() => setPendingDelete(p)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.name}" will be removed from active listings. This action can be reversed in store settings.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Routes>
      <Route index element={<ProductsListView />} />
      <Route path="new" element={<ProductsListView modal={<ProductFormPage />} />} />
      <Route path=":id/edit" element={<ProductsListView modal={<ProductFormPage />} />} />
      <Route path=":id" element={<ProductDetailPage />} />
    </Routes>
  );
}


