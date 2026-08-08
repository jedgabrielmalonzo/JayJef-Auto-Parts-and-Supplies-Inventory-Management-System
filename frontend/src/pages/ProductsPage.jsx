import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, PackageSearch, Loader2 } from 'lucide-react';
import { listProducts, deleteProduct } from '../api/products.js';
import { CATEGORIES, formatCategory } from '../constants.js';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { inputClasses } from '../components/Field.jsx';
import ProductFormPage from './ProductFormPage.jsx';

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProducts({
        search,
        category,
        low_stock: lowStockOnly || undefined,
        is_active: true,
      });
      setProducts(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
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

  async function handleDelete() {
    try {
      await deleteProduct(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <Routes>
        <Route path="new" element={<ProductFormPage />} />
        <Route path=":id/edit" element={<ProductFormPage />} />
      </Routes>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Products</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button as={Link} to="/products/new">
          <Plus size={16} strokeWidth={2.5} />
          Add Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
          <input
            className={`${inputClasses(false)} w-64 pl-9`}
            placeholder="Search SKU, name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={`${inputClasses(false)} max-w-[200px]`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{formatCategory(c)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-black-700 select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded-sm border-gray-300 text-red-600 transition-colors focus:ring-2 focus:ring-red-600/30"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-black-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-black-500">
                  <div className="flex flex-col items-center gap-2">
                    <PackageSearch size={28} className="text-black-300" strokeWidth={1.5} />
                    <span>
                      {search || category || lowStockOnly
                        ? 'No products match these filters.'
                        : 'No products yet — add your first part to get started.'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && products.map((p) => {
              const isLow = p.stock_quantity <= p.reorder_threshold;
              return (
                <tr key={p.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-black-900 whitespace-nowrap">{p.sku}</td>
                  <td className="px-4 py-3 text-black-900">{p.name}</td>
                  <td className="px-4 py-3"><Badge>{formatCategory(p.category)}</Badge></td>
                  <td className="px-4 py-3 text-black-700">{p.brand || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-black-900 tabular-nums">{p.stock_quantity}</span>
                      {isLow && <Badge variant="warning">Low Stock</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black-900 tabular-nums">₱{Number(p.selling_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/products/${p.id}/edit`}
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-black-500 hover:bg-gray-100 hover:text-black-900 transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-black-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={() => setPendingDelete(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} product{total === 1 ? '' : 's'}</p>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this product?"
        description={pendingDelete ? `"${pendingDelete.name}" will be removed from active listings. This can't be undone from here.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
