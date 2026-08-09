import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PackageSearch, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { listProducts } from '../api/products.js';
import { formatCategory, availability } from '../constants.js';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import ProductThumb from '../components/ProductThumb.jsx';

function location(p) {
  const parts = [p.location_aisle, p.location_shelf, p.location_bin].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

// Dedicated, read-only, phone-call-speed screen: big search box, big
// results, no edit/delete actions — staff just need yes/no + qty + shelf
// while a customer is on the line. Keep it open in its own tab.
export default function LookupPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!search.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const result = await listProducts({ search, is_active: true, page_size: 20 });
      setProducts(result.items);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(load, 200);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-black-900">Quick Stock Lookup</h1>
        <div className="mt-2 h-1 w-16 bg-black-900" />
        <p className="mt-3 text-sm text-black-500">Search by SKU, name, brand, or vehicle — for fast answers while a customer is on the phone.</p>
      </div>

      <div className="relative mb-6">
        <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black-400" />
        <Input
          autoFocus
          className="h-14 pl-12 text-lg"
          placeholder="Type a part name, SKU, brand, or vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-black-500">
          <Loader2 size={16} className="animate-spin" />
          Searching...
        </div>
      )}

      {!loading && !search.trim() && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 py-16 text-black-500">
          <Search size={28} className="text-black-300" strokeWidth={1.5} />
          <span>Start typing to search inventory</span>
        </div>
      )}

      {!loading && search.trim() && products.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 py-16 text-black-500">
          <PackageSearch size={28} className="text-black-300" strokeWidth={1.5} />
          <span>No matching parts found</span>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="space-y-3">
          {products.map((p) => {
            const avail = availability(p);
            const loc = location(p);
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <ProductThumb product={p} size="h-16 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-heading text-lg font-bold text-black-900">{p.name}</p>
                    <Badge>{formatCategory(p.category)}</Badge>
                  </div>
                  <p className="font-mono text-sm text-black-500">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</p>
                  {loc && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-black-500">
                      <MapPin size={14} />{loc}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={avail.variant} className="text-sm">{avail.label}</Badge>
                  <p className="text-2xl font-bold tabular-nums text-black-900">{p.stock_quantity}</p>
                  <p className="text-xs text-black-500">₱{Number(p.selling_price).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
