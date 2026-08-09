import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getProduct, getProductPurchases } from '../api/products.js';
import { getSupplier } from '../api/suppliers.js';
import { listMovements } from '../api/inventory.js';
import { formatCategory, MOVEMENT_REASON_LABELS, ORDER_STATUS_BADGE } from '../constants.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

function peso(n) {
  return `₱${Number(n || 0).toFixed(2)}`;
}

const ADJUSTMENT_REASONS = ['manual_adjustment', 'correction'];

function MovementsTable({ movements, emptyText }) {
  if (movements.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-black-500">{emptyText}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Change</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className={`tabular-nums font-medium ${m.quantity_change >= 0 ? 'text-green-600' : 'text-black-900'}`}>
              {m.quantity_change >= 0 ? '+' : '−'}{Math.abs(m.quantity_change)}
            </TableCell>
            <TableCell className="text-black-700">{MOVEMENT_REASON_LABELS[m.reason] || m.reason}</TableCell>
            <TableCell className="text-black-500">{m.note || '—'}</TableCell>
            <TableCell className="text-black-500">{new Date(m.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(async (p) => {
        setProduct(p);
        const [purchasesRes, movementsRes, supplierRes] = await Promise.all([
          getProductPurchases(id),
          listMovements({ product_id: id, page_size: 100 }),
          p.supplier_id ? getSupplier(p.supplier_id).catch(() => null) : null,
        ]);
        setPurchases(purchasesRes);
        setMovements(movementsRes.items);
        setSupplier(supplierRes);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-black-500">
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </div>
    );
  }

  if (!product) return null;

  const isLow = product.stock_quantity <= product.reorder_threshold;
  const adjustments = movements.filter((m) => ADJUSTMENT_REASONS.includes(m.reason));

  return (
    <div className="max-w-3xl">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-black-500 hover:text-black-900 mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-black-900">{product.name}</h1>
          <div className="h-1 w-16 bg-black-900 mt-2" />
        </div>
        <Button render={<Link to={`/products/${product.id}/edit`} />} nativeButton={false} variant="secondary">
          <Pencil size={16} />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-5">
              <section>
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-2">Primary Details</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-black-500">SKU</dt><dd className="font-mono text-black-900">{product.sku}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-black-500">Category</dt><dd><Badge>{formatCategory(product.category)}</Badge></dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-black-500">Brand</dt><dd className="text-black-900">{product.brand || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-black-500">Compatible Vehicles</dt><dd className="text-black-900 text-right">{product.compatible_vehicles || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-black-500">Location</dt><dd className="text-black-900">{[product.location_aisle, product.location_shelf, product.location_bin].filter(Boolean).join(' / ') || '—'}</dd></div>
                  {product.notes && <div className="flex justify-between gap-4"><dt className="text-black-500">Notes</dt><dd className="text-black-900 text-right">{product.notes}</dd></div>}
                </dl>
              </section>

              {supplier && (
                <section>
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-black-500 mb-2">Supplier Details</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-black-500">Supplier name</dt><dd className="text-black-900">{supplier.name}</dd></div>
                    {supplier.phone && <div className="flex justify-between gap-4"><dt className="text-black-500">Contact Number</dt><dd className="text-black-900">{supplier.phone}</dd></div>}
                  </dl>
                </section>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <ProductThumb product={product} size="h-32 w-32" />
              <dl className="w-40 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-black-500">Remaining Stock</dt><dd className="tabular-nums text-black-900">{product.stock_quantity}</dd></div>
                <div className="flex justify-between items-center"><dt className="text-black-500">Threshold</dt><dd className="tabular-nums text-black-900">{product.reorder_threshold}</dd></div>
                {isLow && <Badge variant="warning">Low Stock</Badge>}
                <div className="flex justify-between"><dt className="text-black-500">Cost Price</dt><dd className="tabular-nums text-black-900">{peso(product.cost_price)}</dd></div>
                <div className="flex justify-between"><dt className="text-black-500">Selling Price</dt><dd className="tabular-nums text-black-900">{peso(product.selling_price)}</dd></div>
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="pt-5">
          <div className="rounded-lg border border-gray-200 shadow-sm">
            {purchases.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-black-500">No purchase or sale orders include this product yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((o) => (
                    <TableRow key={`${o.order_id}`}>
                      <TableCell className="font-mono text-black-900">{o.order_number}</TableCell>
                      <TableCell className="text-black-700">{o.supplier_name || o.party_name || '—'}</TableCell>
                      <TableCell className="tabular-nums text-black-900">{o.quantity}</TableCell>
                      <TableCell className="tabular-nums text-black-900">{peso(o.unit_price)}</TableCell>
                      <TableCell><Badge variant={ORDER_STATUS_BADGE[o.status]}>{o.status}</Badge></TableCell>
                      <TableCell className="text-black-500">{new Date(o.order_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="pt-5">
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <MovementsTable movements={adjustments} emptyText="No manual adjustments or corrections for this product yet." />
          </div>
        </TabsContent>

        <TabsContent value="history" className="pt-5">
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <MovementsTable movements={movements} emptyText="No stock movements recorded for this product yet." />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
