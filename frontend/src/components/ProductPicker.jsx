import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listProducts } from '../api/products.js';

const inputClasses = 'h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-1 text-sm outline-none transition-colors focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/15';

/** Search-and-pick control shared by any form that attaches a product to a line item. */
export default function ProductPicker({ selected, onSelect, onClear, placeholder = 'Search SKU or name...' }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!query) { setOptions([]); return; }
    const timeout = setTimeout(() => {
      listProducts({ search: query, is_active: true, page_size: 15 }).then((r) => setOptions(r.items)).catch(() => {});
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  if (selected) {
    return (
      <div className="flex h-10 items-center justify-between rounded-xl border border-gray-300 bg-gray-50/80 px-3.5 text-sm shadow-xs">
        <span className="truncate text-gray-900 font-medium">
          <span className="font-mono font-bold text-red-600">{selected.sku}</span> — {selected.name}
        </span>
        {onClear && (
          <button type="button" onClick={onClear} className="ml-2 shrink-0 text-gray-400 transition-colors hover:text-red-600 p-0.5 rounded-lg hover:bg-red-50" aria-label="Clear selection">
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        className={`${inputClasses} pl-9`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {options.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl divide-y divide-gray-100">
          {options.map((p) => (
            <button
              type="button"
              key={p.id}
              className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-red-50/40 transition-colors"
              onClick={() => { onSelect(p); setQuery(''); setOptions([]); }}
            >
              <span className="font-mono font-bold text-red-600 text-xs mr-1">{p.sku}</span> — <span className="text-gray-800">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
