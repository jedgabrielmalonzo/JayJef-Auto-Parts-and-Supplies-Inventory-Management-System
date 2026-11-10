import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Search, RotateCcw, X, ShieldAlert,
  ArrowUpRight, PackageX, Layers, ExternalLink, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { lowStock } from '../api/inventory.js';
import { CATEGORIES, formatCategory } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import ProductThumb from '../components/ProductThumb.jsx';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../components/ui/pagination.jsx';

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'out_of_stock' | 'low_stock'

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lowStock();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load low stock alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const outOfStock = items.filter((p) => Number(p.stock_quantity || 0) <= 0).length;
    const lowQuantity = items.filter((p) => Number(p.stock_quantity || 0) > 0).length;
    const totalDeficit = items.reduce((acc, p) => {
      const deficit = Math.max(0, (Number(p.reorder_threshold) || 0) - (Number(p.stock_quantity) || 0));
      return acc + deficit;
    }, 0);

    return { total, outOfStock, lowQuantity, totalDeficit };
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    let list = items;

    if (category && category !== '_all') {
      list = list.filter((p) => p.category === category);
    }

    if (statusFilter === 'out_of_stock') {
      list = list.filter((p) => Number(p.stock_quantity || 0) <= 0);
    } else if (statusFilter === 'low_stock') {
      list = list.filter((p) => Number(p.stock_quantity || 0) > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.compatible_vehicles?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, category, statusFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  return (
    <div className="space-y-6 text-gray-900">
      {/* Header */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <AlertTriangle size={22} />
            </span>
            Admin — Low Stock Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tracking of auto parts below minimum safety thresholds and critical stockouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLowStock}
            disabled={loading}
            className="rounded-xl border-gray-200 text-xs font-semibold gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Link to="/inventory">
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md rounded-xl text-xs font-bold gap-1.5">
              <Layers size={14} />
              Stock &amp; Movements
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.section custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MicroStatCard
            title="Total Alert Items"
            subtitle="Require Attention"
            value={stats.total.toString()}
          />
          <MicroStatCard
            title="Out of Stock"
            subtitle="Critical Outages (0 Qty)"
            value={stats.outOfStock.toString()}
          />
          <MicroStatCard
            title="Low Quantity"
            subtitle="Approaching Depletion"
            value={stats.lowQuantity.toString()}
          />
          <MicroStatCard
            title="Units Deficit"
            subtitle="Total Units Below Threshold"
            value={stats.totalDeficit.toLocaleString()}
          />
        </div>
      </motion.section>

      {/* Main Filter & Table Section */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-4">
        {/* Search and Filters Bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search low stock by product name, SKU, brand, or vehicle..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 text-xs h-9 rounded-xl border-gray-200 bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-full lg:w-56">
              <Select
                value={category || '_all'}
                onValueChange={(val) => {
                  setCategory(val === '_all' ? '' : val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatCategory(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('out_of_stock');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'out_of_stock'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 hover:text-red-800'
                }`}
              >
                Out of Stock ({stats.outOfStock})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('low_stock');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'low_stock'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                Low Stock ({stats.lowQuantity})
              </button>
            </div>

            {/* Reset */}
            {(search || category || statusFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="h-9 px-2.5 text-xs text-gray-500 hover:text-gray-900 rounded-xl shrink-0"
              >
                <RotateCcw size={13} className="mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
              <Loader2 size={18} className="animate-spin text-red-600" />
              Loading low stock alerts...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500">
              {items.length === 0 ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-1">
                    <ShieldAlert size={24} />
                  </div>
                  <p className="font-heading font-bold text-gray-900 text-base">All Products Well Stocked</p>
                  <p className="text-xs text-gray-400 max-w-sm">
                    No products have fallen below their configured safety reorder thresholds.
                  </p>
                </>
              ) : (
                <>
                  <Search size={24} className="text-gray-300" strokeWidth={1.5} />
                  <p className="font-semibold text-gray-700">No items matched your search filter</p>
                  <p className="text-xs text-gray-400">Try adjusting your search terms or clearing the category filter.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-bold text-gray-700">Product &amp; SKU</TableHead>
                    <TableHead className="font-bold text-gray-700">Category &amp; Brand</TableHead>
                    <TableHead className="font-bold text-gray-700">Stock vs Reorder Threshold</TableHead>
                    <TableHead className="font-bold text-gray-700">Status</TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((p) => {
                    const isOutOfStock = Number(p.stock_quantity || 0) <= 0;
                    const ratio = p.reorder_threshold > 0 
                      ? Math.min(100, Math.round((Number(p.stock_quantity) / Number(p.reorder_threshold)) * 100))
                      : 0;

                    return (
                      <TableRow key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductThumb product={p} />
                            <div>
                              <Link
                                to={`/products/${p.id}/edit`}
                                className="font-bold text-gray-900 hover:text-red-600 transition-colors block text-sm"
                              >
                                {p.name}
                              </Link>
                              <span className="font-mono text-xs text-gray-500">{p.sku}</span>
                              {p.compatible_vehicles && (
                                <p className="text-[11px] text-gray-400 truncate max-w-xs">{p.compatible_vehicles}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-[11px] py-0 font-medium">
                              {formatCategory(p.category)}
                            </Badge>
                            {p.brand && (
                              <p className="text-xs text-gray-600 font-medium">{p.brand}</p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1.5 min-w-[140px] max-w-[200px]">
                            <div className="flex items-center justify-between text-xs tabular-nums">
                              <span className="font-bold text-gray-900">
                                {p.stock_quantity} <span className="text-gray-400 font-normal">{p.unit || 'units'}</span>
                              </span>
                              <span className="text-gray-500 font-mono text-[11px]">
                                Limit: {p.reorder_threshold}
                              </span>
                            </div>
                            {/* Stock Level Progress Bar */}
                            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOutOfStock ? 'bg-red-500' : ratio <= 40 ? 'bg-amber-500' : 'bg-yellow-400'
                                }`}
                                style={{ width: `${Math.max(4, ratio)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={isOutOfStock ? 'destructive' : 'warning'}
                            className="text-[11px] font-bold"
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Link
                            to={`/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          >
                            Manage
                            <ExternalLink size={12} />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredItems.length > pageSize && (
          <div className="pt-2 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </motion.div>
    </div>
  );
}
