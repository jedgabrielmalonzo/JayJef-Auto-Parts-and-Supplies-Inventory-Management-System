import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, PackageSearch, Loader2, LayoutGrid, List, Eye, Tag, Box, Minus, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { listProducts, deleteProduct, bulkDeleteProducts } from '../api/products.js';
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
import { Skeleton } from '../components/ui/skeleton.jsx';
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

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
    getOverview().then(setSummary).catch(() => { });
  }, []);

  // Multi-selection handlers
  function handleToggleSelectAll() {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  }

  function handleToggleSelectProduct(id, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleDelete() {
    try {
      await deleteProduct(pendingDelete.id);
      toast.success(`"${pendingDelete.name}" deleted`);
      setSelectedIds((prev) => prev.filter((id) => id !== pendingDelete.id));
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setPendingDelete(null);
    }
  }

  async function handleConfirmBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteProducts(selectedIds);
      toast.success(res.message || `Deleted ${selectedIds.length} products`);
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
      load();
      getOverview().then(setSummary).catch(() => { });
    } catch (err) {
      toast.error(err.message || 'Failed to delete selected products');
    } finally {
      setBulkDeleting(false);
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
      getOverview().then(setSummary).catch(() => { });
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setDeductingId(null);
    }
  }

  async function handleStockInputChange(p, newQty) {
    if (isNaN(newQty) || newQty < 0 || newQty === p.stock_quantity) {
      return;
    }
    const diff = newQty - p.stock_quantity;
    setDeductingId(p.id);

    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, stock_quantity: newQty } : item))
    );

    soundService.checkAndPlayAlert(newQty, p.reorder_threshold);

    try {
      await createMovement({
        product_id: p.id,
        quantity_change: diff,
        reason: 'manual_adjustment',
        note: `Manual stock adjustment to ${newQty}`,
      });
      if (newQty === 0) {
        toast.error(`🔴 OUT OF STOCK: "${p.name}" reached 0 units!`);
      } else if (newQty <= (p.reorder_threshold || 5)) {
        toast.warning(`⚠️ REORDER WARNING: "${p.name}" is low in stock (${newQty} left)!`);
      } else {
        toast.success(`Updated stock for "${p.name}" to ${newQty}`);
      }
      getOverview().then(setSummary).catch(() => { });
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
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
      getOverview().then(setSummary).catch(() => { });
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Products Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage auto parts, prices, categories, and stock thresholds</p>
        </div>
        <Button render={<Link to="/products/new" />} nativeButton={false} className="shadow-md bg-red-600 hover:bg-red-700">
          <Plus size={18} strokeWidth={2.5} />
          Add New Product
        </Button>
      </motion.div>

      {/* Modern Filter Toolbar */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9 pr-8 text-xs h-9 rounded-xl border-gray-200 bg-white"
              placeholder="Search by part number, product name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="w-full sm:w-56">
              <Select value={category} onValueChange={(v) => setCategory(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-gray-200 bg-white">
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
            </div>

            {/* Low Stock Checkbox Toggle */}
            <Label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer bg-gray-50/70 border border-gray-200 px-3 h-9 rounded-xl hover:bg-gray-100 transition-colors shrink-0">
              <Checkbox checked={lowStockOnly} onCheckedChange={(v) => setLowStockOnly(!!v)} />
              Low stock only
            </Label>

            {/* Reset */}
            {(search || category || lowStockOnly) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setLowStockOnly(false);
                }}
                className="h-9 px-2.5 text-xs text-gray-500 hover:text-gray-900 rounded-xl shrink-0"
              >
                <RotateCcw size={13} className="mr-1" />
                Reset
              </Button>
            )}

            {/* View Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/70 p-0.5 h-9 shrink-0 ml-auto lg:ml-0">
              <button
                type="button"
                title="Grid view"
                onClick={() => setView('grid')}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  view === 'grid' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                title="List view"
                onClick={() => setView('list')}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {loading && view === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-[#f4f4f6]/60 p-3.5 space-y-3">
              <Skeleton className="w-full aspect-square rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && view === 'list' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <Table className="w-full">
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-10 px-4"></TableHead>
                <TableHead className="font-bold text-gray-700">Part Number</TableHead>
                <TableHead className="font-bold text-gray-700">Name</TableHead>
                <TableHead className="font-bold text-gray-700">Category</TableHead>
                <TableHead className="font-bold text-gray-700">Stock</TableHead>
                <TableHead className="font-bold text-gray-700">Price</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="w-24 text-right font-bold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100">
                  <TableCell className="w-10 px-4"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-20 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-16 rounded-xl ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            const isSelected = selectedIds.includes(p.id);
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -4 }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-3.5 shadow-xs transition-all cursor-pointer ${isSelected
                    ? 'border-red-500/80 bg-red-50/20 ring-2 ring-red-500/30'
                    : 'border-gray-200/80 bg-[#f4f4f6]/60 hover:border-gray-300 hover:shadow-md'
                  }`}
                onClick={() => navigate(`/products/${p.id}`)}
              >
                {/* Top Image Container with Top-Left Dark Overlay SKU Badge & Top-Right Selection Checkbox */}
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-white border border-gray-100/90 shadow-2xs p-3 flex items-center justify-center">
                  <ProductThumb
                    product={p}
                    fit="contain"
                    size="h-full w-full"
                    imgClassName="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                    className="border-none bg-transparent rounded-none"
                  />
                  {/* Floating SKU Pill Badge */}
                  <span className="absolute top-2.5 left-2.5 z-10 rounded-lg bg-[#09090b]/85 px-2.5 py-1 font-mono text-[11px] font-bold text-white shadow-xs backdrop-blur-xs border border-white/10">
                    {p.sku}
                  </span>

                  {/* Multi-Select Checkbox Overlay */}
                  <div
                    className="absolute top-2.5 right-2.5 z-10 flex items-center justify-center rounded-lg bg-white/90 p-1.5 shadow-xs backdrop-blur-xs border border-gray-200 transition-transform hover:scale-110 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectProduct(p.id);
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                  </div>
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
                      <span className="text-xs text-gray-500">Stock:</span>
                      <span className="font-heading text-base font-bold text-gray-900 tabular-nums">
                        {p.stock_quantity}
                      </span>
                      <span className="text-[10px] text-gray-400">/ {p.unit}</span>
                    </div>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="w-10 px-4">
                    <Checkbox
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onCheckedChange={handleToggleSelectAll}
                      title="Select all products"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Part Number</TableHead>
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
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-red-50/30'
                        }`}
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <TableCell
                        className="w-10 px-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectProduct(p.id);
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-red-600">{p.sku}</TableCell>
                      <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                      <TableCell><Badge variant="outline">{formatCategory(p.category)}</Badge></TableCell>
                      <TableCell className="tabular-nums font-semibold text-gray-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            key={`${p.id}-${p.stock_quantity}`}
                            defaultValue={p.stock_quantity}
                            title="Directly edit stock quantity (Press Enter to save)"
                            className="w-20 h-8 text-center font-bold text-xs font-mono rounded-lg border-gray-300 bg-white hover:border-gray-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              } else if (e.key === 'Escape') {
                                e.target.value = p.stock_quantity;
                                e.target.blur();
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 0 || val === p.stock_quantity) {
                                e.target.value = p.stock_quantity;
                                return;
                              }
                              handleStockInputChange(p, val);
                            }}
                          />
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
          </div>
        </motion.div>
      )}

      {/* Floating Bottom Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl bg-white px-5 py-3 text-gray-900 shadow-2xl border border-gray-200 ring-1 ring-black/5"
        >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-xs">
                {selectedIds.length}
              </span>
                <span className="text-xs font-bold text-gray-900 tracking-wide">
                  {selectedIds.length === 1 ? 'Product' : 'Products'} selected
                </span>
            </div>

            <div className="h-4 w-px bg-gray-200" />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-xs font-medium"
              >
                Deselect All
              </Button>
              <Button
                size="sm"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm text-xs font-bold gap-1.5"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
        </motion.div>
      )}

      {/* Single Delete Alert Dialog */}
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

      {/* Bulk Delete Alert Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 size={20} />
              Delete {selectedIds.length} {selectedIds.length === 1 ? 'product' : 'products'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete these <strong>{selectedIds.length}</strong> selected products?
              </p>
              <p className="text-xs text-gray-500">
                They will be deactivated and removed from the active catalog and shop inventory.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
              {bulkDeleting ? 'Deleting...' : `Confirm Delete (${selectedIds.length})`}
            </AlertDialogAction>
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
      <Route path=":id/edit" element={<ProductDetailPage initialEdit />} />
      <Route path=":id" element={<ProductDetailPage />} />
    </Routes>
  );
}


