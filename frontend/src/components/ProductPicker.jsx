import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listProducts } from '../api/products.js';
import { formatCategory } from '../constants.js';

const inputClasses = 'h-10 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-1 text-sm outline-none transition-colors focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/15';

/** Search-and-pick control shared by any form that attaches a product to a line item. */
export default function ProductPicker({ selected, onSelect, onClear, placeholder = 'Search part number or name...' }) {
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
    const categoryName = formatCategory(selected.category);
    return (
      <div className="flex min-h-10 py-1.5 items-center justify-between rounded-xl border border-gray-300 bg-gray-50/80 px-3.5 text-sm shadow-xs gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
          <span className="font-mono font-bold text-red-600">{selected.sku}</span>
          <span className="text-gray-300 font-light">—</span>
          <span className="font-semibold text-gray-900">{selected.name}</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 border border-gray-200">
            <span className="text-[11px] font-medium text-gray-500">Brand:</span>
            <span className="font-semibold text-gray-900">{selected.brand || 'Unbranded'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 border border-gray-200">
            <span className="text-[11px] font-medium text-gray-500">Category:</span>
            <span className="font-semibold text-gray-900">{categoryName || 'Other'}</span>
          </span>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="ml-2 shrink-0 text-gray-400 transition-colors hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer"
            aria-label="Clear selection"
          >
            <X size={15} />
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
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl divide-y divide-gray-100">
          {options.map((p) => (
            <button
              type="button"
              key={p.id}
              className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-red-50/40 transition-colors cursor-pointer"
              onClick={() => { onSelect(p); setQuery(''); setOptions([]); }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-mono font-bold text-red-600 text-xs mr-2">{p.sku}</span>
                  <span className="text-gray-900 font-medium">{p.name}</span>
                  {p.brand && <span className="text-gray-500 text-xs ml-2">({p.brand})</span>}
                </div>
                {p.category && (
                  <span className="shrink-0 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    {formatCategory(p.category)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
