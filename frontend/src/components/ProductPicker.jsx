import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listProducts } from '../api/products.js';

const inputClasses = 'h-10 w-full min-w-0 rounded border border-input bg-white px-3 py-1 text-base outline-none transition-colors focus-visible:border-black-900 focus-visible:ring-2 focus-visible:ring-black-900/15';

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
      <div className="flex h-10 items-center justify-between rounded border border-gray-300 bg-white px-3 text-sm">
        <span className="truncate text-black-900"><span className="font-mono">{selected.sku}</span> — {selected.name}</span>
        {onClear && (
          <button type="button" onClick={onClear} className="ml-2 shrink-0 text-black-500 transition-colors hover:text-black-900" aria-label="Clear selection">
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
      <input
        className={`${inputClasses} pl-9`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {options.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-md">
          {options.map((p) => (
            <button
              type="button"
              key={p.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
              onClick={() => { onSelect(p); setQuery(''); setOptions([]); }}
            >
              <span className="font-mono">{p.sku}</span> — {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
