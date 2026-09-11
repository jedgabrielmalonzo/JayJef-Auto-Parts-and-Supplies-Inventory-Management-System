import { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Plus, Pencil, Trash2, Truck, Loader2, Layers, Phone, Mail, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { listSuppliers, deleteSupplier, getSupplierProducts } from '../api/suppliers.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog.jsx';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '../components/ui/alert-dialog.jsx';
import SupplierFormPage from './SupplierFormPage.jsx';

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

function ConstantProductsViewerModal({ supplier, open, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplier || !open) return;
    setLoading(true);
    getSupplierProducts(supplier.id)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [supplier, open]);

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader className="border-b border-gray-100 pb-3 mb-2">
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers size={18} className="text-red-600" />
            Constant Products for {supplier.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500">
            <Loader2 size={16} className="animate-spin text-red-600" />
            Loading catalog items...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-gray-500">
              Below are the products constantly ordered from <strong className="text-gray-900">{supplier.name}</strong>.
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-gray-700">Product & SKU</TableHead>
                    <TableHead className="text-xs font-bold text-gray-700">Cost Price</TableHead>
                    <TableHead className="text-xs font-bold text-gray-700">In Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-xs text-gray-400">
                        No constant products assigned yet to this supplier.
                      </TableCell>
                    </TableRow>
                  )}
                  {products.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/60">
                      <TableCell>
                        <div className="font-bold text-xs text-gray-900">{p.name}</div>
                        <div className="font-mono text-[10px] text-gray-500">{p.sku}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-gray-900">
                        ₱{Number(p.cost_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs">
                        <span className="font-bold text-gray-900">{p.stock_quantity || 0}</span> {p.unit || 'pc'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={onClose} variant="secondary" className="rounded-xl text-xs font-bold">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SuppliersPage() {
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [viewSupplierProducts, setViewSupplierProducts] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSuppliers({ search, page, page_size: pageSize });
      setSuppliers(result.items);
      setTotal(result.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

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
      toast.success(`"${pendingDelete.name}" deleted successfully`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
      setPendingDelete(null);
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1;
  const suppliersWithProductsCount = suppliers.filter((s) => Number(s.product_count || 0) > 0).length;

  return (
    <div className="space-y-6 text-gray-900">
      <Routes>
        <Route path="new" element={<SupplierFormPage />} />
        <Route path=":id/edit" element={<SupplierFormPage />} />
      </Routes>

      <ConstantProductsViewerModal
        supplier={viewSupplierProducts}
        open={!!viewSupplierProducts}
        onClose={() => setViewSupplierProducts(null)}
      />

      {/* HEADER SECTION */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Suppliers Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage vendor profiles, contact details, and constant product ordering memory
          </p>
        </div>
        <Button render={<Link to="/suppliers/new" />} nativeButton={false} className="bg-red-600 hover:bg-red-700 font-bold text-white shadow-md rounded-xl text-xs">
          <Plus size={16} strokeWidth={2.5} />
          Add Supplier
        </Button>
      </motion.div>

      {/* MICRO STAT CARDS */}
      <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MicroStatCard
            title="Total Suppliers"
            subtitle="Registered Vendor Partners"
            value={total.toString()}
          />
          <MicroStatCard
            title="Constant Memory Products"
            subtitle="Suppliers with Products Memory"
            value={suppliersWithProductsCount.toString()}
          />
          <MicroStatCard
            title="Catalog Status"
            subtitle="Inventory Integration"
            value="100%"
          />
        </div>
      </motion.section>

      {/* MAIN CONTENT TABLE & SEARCH */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9 rounded-xl border-gray-300 text-xs focus:border-red-600"
              placeholder="Search supplier name or contact..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Showing {suppliers.length} of {total} supplier{total === 1 ? '' : 's'}
          </span>
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-bold text-gray-700">Supplier Name</TableHead>
                <TableHead className="font-bold text-gray-700">Contact Person</TableHead>
                <TableHead className="font-bold text-gray-700">Phone &amp; Email</TableHead>
                <TableHead className="font-bold text-gray-700">Constant Products Memory</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-red-600" />
                      Loading supplier catalog...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Truck size={32} className="text-gray-300" strokeWidth={1.5} />
                      <span className="font-medium text-sm text-gray-700">
                        {search ? 'No suppliers match your search.' : 'No suppliers added yet.'}
                      </span>
                      <p className="text-xs text-gray-400">
                        Add vendor partners to organize recurring purchase orders and constant products.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && suppliers.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell>
                    <div className="font-bold text-sm text-gray-900">{s.name}</div>
                    {s.address && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {s.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-700 font-medium">
                    {s.contact_person || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    <div className="space-y-0.5">
                      {s.phone && (
                        <div className="font-mono text-gray-900 font-semibold flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400" /> {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="text-gray-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" /> {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && <span className="text-gray-400">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setViewSupplierProducts(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-800 transition-colors"
                    >
                      <Layers size={13} className="text-red-600" />
                      <span>{s.product_count || 0} Memorized Products</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        render={<Link to={`/suppliers/${s.id}/edit`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        title="Edit Supplier & Memory"
                        className="rounded-lg hover:bg-gray-100 text-gray-600"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete Supplier"
                        className="rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-600"
                        onClick={() => setPendingDelete(s)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && total > pageSize && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-xs text-gray-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl text-xs font-bold"
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl text-xs font-bold"
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-gray-900">Delete Supplier Partner?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              {pendingDelete
                ? `"${pendingDelete.name}" will be removed from your active vendor list. Suppliers linked to products or purchase orders cannot be deleted until unlinked.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white text-xs">
              Delete Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
