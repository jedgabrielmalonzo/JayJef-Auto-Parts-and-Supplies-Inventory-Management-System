import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Truck, Loader2 } from 'lucide-react';
import { listSuppliers, deleteSupplier } from '../api/suppliers.js';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { inputClasses } from '../components/Field.jsx';
import SupplierFormPage from './SupplierFormPage.jsx';

export default function SuppliersPage() {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listSuppliers({ search });
      setSuppliers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (location.pathname === '/suppliers') load();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    try {
      await deleteSupplier(pendingDelete.id);
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
        <Route path="new" element={<SupplierFormPage />} />
        <Route path=":id/edit" element={<SupplierFormPage />} />
      </Routes>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">Suppliers</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button as={Link} to="/suppliers/new">
          <Plus size={16} strokeWidth={2.5} />
          Add Supplier
        </Button>
      </div>

      <div className="relative mb-4 w-64">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
        <input
          className={`${inputClasses(false)} pl-9`}
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-black-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-black-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            )}
            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-black-500">
                  <div className="flex flex-col items-center gap-2">
                    <Truck size={28} className="text-black-300" strokeWidth={1.5} />
                    <span>{search ? 'No suppliers match this search.' : 'No suppliers yet — add one to assign to parts and orders.'}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && suppliers.map((s) => (
              <tr key={s.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-black-900">{s.name}</td>
                <td className="px-4 py-3 text-black-700">{s.contact_person || '—'}</td>
                <td className="px-4 py-3 text-black-700">{s.phone || '—'}</td>
                <td className="px-4 py-3 text-black-700">{s.email || '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/suppliers/${s.id}/edit`}
                      title="Edit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-black-500 hover:bg-gray-100 hover:text-black-900 transition-colors"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      title="Delete"
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-black-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => setPendingDelete(s)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} supplier{total === 1 ? '' : 's'}</p>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this supplier?"
        description={pendingDelete ? `"${pendingDelete.name}" will be removed. This can't be undone. Suppliers linked to products or orders can't be deleted — remove those links first.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
