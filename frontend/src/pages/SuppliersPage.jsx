import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listSuppliers, deleteSupplier } from '../api/suppliers.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';
import SupplierFormPage from './SupplierFormPage.jsx';

export default function SuppliersPage() {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSuppliers({ search });
      setSuppliers(result.items);
      setTotal(result.total);
    } catch (err) {
      toast.error(err.message);
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
      toast.success(`"${pendingDelete.name}" deleted`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
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
        <Button render={<Link to="/suppliers/new" />} nativeButton={false}>
          <Plus size={16} strokeWidth={2.5} />
          Add Supplier
        </Button>
      </div>

      <div className="relative mb-4 w-64">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
        <Input
          className="pl-9"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-black-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center text-black-500">
                  <div className="flex flex-col items-center gap-2">
                    <Truck size={28} className="text-black-300" strokeWidth={1.5} />
                    <span>{search ? 'No suppliers match this search.' : 'No suppliers yet — add one to assign to parts and orders.'}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-black-900">{s.name}</TableCell>
                <TableCell className="text-black-700">{s.contact_person || '—'}</TableCell>
                <TableCell className="text-black-700">{s.phone || '—'}</TableCell>
                <TableCell className="text-black-700">{s.email || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button render={<Link to={`/suppliers/${s.id}/edit`} />} nativeButton={false} variant="ghost" size="icon-sm" title="Edit">
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Delete" className="hover:bg-red-50 hover:text-red-600" onClick={() => setPendingDelete(s)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!loading && total > 0 && (
        <p className="mt-3 text-xs text-black-500">{total} supplier{total === 1 ? '' : 's'}</p>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.name}" will be removed. This can't be undone. Suppliers linked to products or orders can't be deleted — remove those links first.` : ''}
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
