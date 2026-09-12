import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Search, Filter, RefreshCw, UserCheck, FileText, ArrowRight,
  TrendingUp, TrendingDown, Clock, Calendar, ChevronLeft, ChevronRight, Layers, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { listMovements } from '../api/inventory.js';
import { MOVEMENT_REASON_LABELS } from '../constants.js';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import MicroStatCard from '../components/MicroStatCard.jsx';

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function AuditLogPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMovements({ page_size: 300 });
      setMovements(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Derived Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return movements.filter((m) => {
      // Reason filter
      if (reasonFilter !== 'all' && m.reason !== reasonFilter) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchProduct = m.product_name && m.product_name.toLowerCase().includes(q);
        const matchSku = m.product_sku && m.product_sku.toLowerCase().includes(q);
        const matchUser = m.user_name && m.user_name.toLowerCase().includes(q);
        const matchNote = m.note && m.note.toLowerCase().includes(q);
        const matchReason = m.reason && m.reason.toLowerCase().includes(q);
        const matchRef = m.reference_id && String(m.reference_id).includes(q);
        if (!matchProduct && !matchSku && !matchUser && !matchNote && !matchReason && !matchRef) {
          return false;
        }
      }
      return true;
    });
  }, [movements, search, reasonFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalEvents = movements.length;
    let totalIn = 0;
    let totalOut = 0;
    let manualAdjustments = 0;

    movements.forEach((m) => {
      const change = Number(m.quantity_change || 0);
      if (change > 0) totalIn += change;
      if (change < 0) totalOut += Math.abs(change);
      if (m.reason === 'manual_adjustment' || m.reason === 'correction') manualAdjustments++;
    });

    return { totalEvents, totalIn, totalOut, manualAdjustments };
  }, [movements]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
            System Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete timeline of inventory adjustments, staff actions, PO receipts, and system overrides
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="rounded-xl border-gray-200 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 shadow-xs"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards Layer */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={1}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MicroStatCard
          icon={ShieldCheck}
          iconBgColor="bg-red-50 text-red-600"
          title="Total Audit Events"
          value={metrics.totalEvents}
        />
        <MicroStatCard
          icon={TrendingUp}
          iconBgColor="bg-emerald-50 text-emerald-600"
          title="Total Units Received"
          value={`+${metrics.totalIn}`}
        />
        <MicroStatCard
          icon={TrendingDown}
          iconBgColor="bg-amber-50 text-amber-600"
          title="Total Units Removed"
          value={`-${metrics.totalOut}`}
        />
        <MicroStatCard
          icon={UserCheck}
          iconBgColor="bg-blue-50 text-blue-600"
          title="Manual Adjustments"
          value={metrics.manualAdjustments}
        />
      </motion.div>

      {/* Search & Filter Toolbar */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={2}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs"
      >
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            className="pl-9 h-9 text-xs rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
            placeholder="Search product, SKU, staff, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <Select value={reasonFilter} onValueChange={(val) => { setReasonFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs w-44 rounded-xl border-gray-200 bg-white">
                <SelectValue placeholder="All Event Reasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Reasons</SelectItem>
                <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="purchase_order">Purchase Order</SelectItem>
                <SelectItem value="ocr_intake">OCR Smart Intake</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs font-semibold text-gray-400">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      </motion.div>

      {/* Audit Log Table */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={3}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs"
      >
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="font-bold text-gray-700">Date &amp; Time</TableHead>
              <TableHead className="font-bold text-gray-700">Staff Member</TableHead>
              <TableHead className="font-bold text-gray-700">Product &amp; SKU</TableHead>
              <TableHead className="font-bold text-gray-700">Action / Reason</TableHead>
              <TableHead className="font-bold text-gray-700">Stock Audit (Before → After)</TableHead>
              <TableHead className="font-bold text-gray-700">Reference &amp; Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-400 text-xs font-semibold">
                  Loading audit log history...
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-400 text-xs font-semibold">
                  No system audit records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((m) => (
                <TableRow key={m.id} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell className="text-xs">
                    <div className="font-bold text-gray-900">
                      {new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                      <UserCheck size={13} className="text-gray-400" />
                      {m.user_name || 'System Manager'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-bold text-xs text-gray-900">{m.product_name || 'Unknown Part'}</div>
                    <div className="font-mono text-[10px] text-gray-500">{m.product_sku || '—'}</div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-800 border border-gray-200">
                      {MOVEMENT_REASON_LABELS[m.reason] || m.reason}
                    </span>
                  </TableCell>

                  <TableCell className="tabular-nums text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-mono">{m.quantity_before ?? '—'}</span>
                      <span className="text-gray-400 font-bold">→</span>
                      <span className="font-extrabold text-gray-900 font-mono">{m.quantity_after ?? '—'}</span>
                      <span
                        className={`ml-1 text-[11px] font-extrabold px-1.5 py-0.2 rounded ${
                          m.quantity_change >= 0
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-red-700 bg-red-50 border border-red-200'
                        }`}
                      >
                        {m.quantity_change >= 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-gray-600 max-w-[200px]">
                    {m.reference_type && (
                      <div className="font-mono text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <FileText size={10} />
                        {m.reference_type === 'purchase_order' ? `PO #${m.reference_id}` : `OCR #${m.reference_id}`}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 truncate" title={m.note || 'No notes attached'}>
                      {m.note || <span className="text-gray-300">—</span>}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {filteredLogs.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl text-xs font-bold h-8 px-3"
            >
              <ChevronLeft size={13} /> Prev
            </Button>
            <span className="text-[11px] text-gray-500 font-semibold">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl text-xs font-bold h-8 px-3"
            >
              Next <ChevronRight size={13} />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
