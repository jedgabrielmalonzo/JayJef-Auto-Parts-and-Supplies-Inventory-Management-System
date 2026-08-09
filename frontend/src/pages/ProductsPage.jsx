import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, PackageSearch, Loader2, LayoutGrid, List, LayoutList, Box, Truck as TruckIcon, AlertTriangle } from 'lucide-react';
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
import StatCard from '../components/StatCard.jsx';
import ProductFormPage from './ProductFormPage.jsx';
import ProductDetailPage from './ProductDetailPage.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

const BLUE = '#3A6EA5';
const GREEN = '#1E7B34';
const AMBER = '#946200';

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
    const timeout = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    // The add/edit form is a modal overlaid on this page (it no longer
    // navigates away), so refresh the list whenever it closes back here.
    if (location.pathname === '/products') load();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
    : 'No products yet — add your first part to get started.';

  return (
    <div>
      {modal}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Products</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button render={<Link to="/products/new" />} nativeButton={false}>
          <Plus size={16} strokeWidth={2.5} />
          Add Product
        </Button>
      </div>

      {summary && (
        <div className="mb-4">
          <StatCard
            title="Overall Inventory"
            items={[
              { icon: LayoutList, value: summary.products.categoryCount, label: 'Categories', tint: BLUE },
              { icon: Box, value: total, label: 'Total Products', tint: GREEN },
              { icon: TruckIcon, value: summary.products.supplierCount, label: 'Suppliers', tint: AMBER },
              { icon: AlertTriangle, value: lowStockTotal, label: 'Low Stock', tint: '#6B6B6B' },
            ]}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
            <Input
              className="w-64 pl-9"
              placeholder="Search SKU, name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
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
          <Label className="flex items-center gap-2 text-sm normal-case tracking-normal text-black-700">
            <Checkbox checked={lowStockOnly} onCheckedChange={(v) => setLowStockOnly(!!v)} />
            Low stock only
          </Label>
        </div>

        <div className="flex items-center gap-0.5 rounded border border-gray-300 p-0.5">
          <button
            title="List view"
            onClick={() => setView('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${view === 'list' ? 'bg-gray-100 text-black-900' : 'text-black-500 hover:text-black-900'}`}
          >
            <List size={16} />
          </button>
          <button
            title="Grid view"
            onClick={() => setView('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${view === 'grid' ? 'bg-gray-100 text-black-900' : 'text-black-500 hover:text-black-900'}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-black-500">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 py-16 text-black-500">
          <PackageSearch size={28} className="text-black-300" strokeWidth={1.5} />
          <span>{emptyMessage}</span>
        </div>
      )}

      {!loading && products.length > 0 && view === 'list' && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const avail = availability(p);
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                    <TableCell><ProductThumb product={p} /></TableCell>
                    <TableCell className="font-mono text-black-900">{p.sku}</TableCell>
                    <TableCell className="text-black-900">{p.name}</TableCell>
                    <TableCell><Badge>{formatCategory(p.category)}</Badge></TableCell>
                    <TableCell className="tabular-nums text-black-900">{p.stock_quantity}</TableCell>
                    <TableCell className="text-black-900 tabular-nums">₱{Number(p.selling_price).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={avail.variant}>{avail.label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button render={<Link to={`/products/${p.id}/edit`} />} nativeButton={false} variant="ghost" size="icon-sm" title="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete"
                          className="hover:bg-red-50 hover:text-red-600"
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

      {!loading && products.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const avail = availability(p);
            return (
              <Card key={p.id} className="cursor-pointer overflow-hidden py-0" onClick={() => navigate(`/products/${p.id}`)}>
                <ProductThumb product={p} size="h-40 w-full" />
                <CardContent className="space-y-2 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-heading font-bold text-black-900">{p.name}</p>
                      <p className="font-mono text-xs text-black-500">{p.sku}</p>
                    </div>
                    <Badge>{formatCategory(p.category)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black-900 tabular-nums">{p.stock_quantity} in stock</span>
                      <Badge variant={avail.variant}>{avail.label}</Badge>
                    </div>
                    <span className="font-heading font-bold text-black-900 tabular-nums">₱{Number(p.selling_price).toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button render={<Link to={`/products/${p.id}/edit`} />} nativeButton={false} variant="secondary" size="sm" className="flex-1">
                      <Pencil size={14} />Edit
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

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} product{total === 1 ? '' : 's'}</p>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.name}" will be removed from active listings. This can't be undone from here.` : ''}
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

// `/products/:id` is a full-page swap to the detail view (needs its own
// matched Route so useParams() actually resolves `id` inside it), while
// new/:id/edit stay Dialog overlays on top of the list — same `modal`-prop
// pattern as OrdersPage/SuppliersPage.
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
