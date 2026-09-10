import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, PackageSearch, Loader2, LayoutGrid, List, LayoutList, Box, Truck as TruckIcon, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { listProducts, deleteProduct } from '../api/products.js';
import { getOverview } from '../api/dashboard.js';
import { CATEGORIES, formatCategory, availability } from '../constants.js';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { Label } from '../components/ui/label.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';
import ProductFormPage from './ProductFormPage.jsx';
import ProductDetailPage from './ProductDetailPage.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

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
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const emptyMessage = search || category || lowStockOnly
    ? 'No products match these filters.'
    : 'No products yet — add your first auto part to get started.';

  return (
    <div className="space-y-6">
      {modal}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage auto parts, prices, categories, and stock thresholds</p>
        </div>
        <Button render={<Link to="/products/new" />} nativeButton={false} className="shadow-md bg-red-600 hover:bg-red-700">
          <Plus size={18} strokeWidth={2.5} />
          Add New Product
        </Button>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
            title="List view"
            onClick={() => setView('list')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              view === 'list' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List size={18} />
          </button>
          <button
            title="Grid view"
            onClick={() => setView('grid')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
              view === 'grid' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

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

      {/* Table List View */}
      {!loading && products.length > 0 && view === 'list' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                    <TableCell className="tabular-nums font-semibold text-gray-900">{p.stock_quantity}</TableCell>
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
      )}

      {/* Grid Card View */}
      {!loading && products.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const avail = availability(p);
            return (
              <Card
                key={p.id}
                className="cursor-pointer overflow-hidden rounded-2xl border-gray-200 transition-all hover:border-red-500 hover:shadow-md group"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <ProductThumb product={p} size="h-44 w-full object-cover group-hover:scale-105 transition-transform" />
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-red-600">{p.sku}</p>
                      <h3 className="font-heading font-bold text-gray-900 truncate mt-0.5">{p.name}</h3>
                    </div>
                    <Badge variant="outline">{formatCategory(p.category)}</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="block text-xs text-gray-500">{p.stock_quantity} in stock</span>
                      <Badge variant={avail.variant} className="mt-1">{avail.label}</Badge>
                    </div>
                    <span className="font-heading font-bold text-lg text-gray-900 tabular-nums">
                      ₱{Number(p.selling_price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button render={<Link to={`/products/${p.id}/edit`} />} nativeButton={false} variant="secondary" size="sm" className="flex-1">
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" title="Delete" onClick={() => setPendingDelete(p)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
