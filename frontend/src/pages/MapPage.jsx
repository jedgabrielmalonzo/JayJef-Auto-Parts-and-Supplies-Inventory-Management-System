import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Search, MapPin } from 'lucide-react';
import { getProductLocations } from '../api/products.js';
import { findCabinet } from '../features/shop-map/layout.js';
import Scene from '../features/shop-map/Scene.jsx';
import { inputClasses } from '../components/Field.jsx';

export default function MapPage() {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!query) { setOptions([]); return; }
    const timeout = setTimeout(() => {
      getProductLocations({ search: query }).then(setOptions).catch(() => {});
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const cabinet = selected ? findCabinet(selected.location_aisle) : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-black-900">Shop Map</h1>
        <div className="h-1 w-16 bg-black-900 mt-2" />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-500" />
        <input
          className={`${inputClasses(false)} pl-9`}
          placeholder="Search a product to locate it..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
        />
        {options.length > 0 && !selected && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-md">
            {options.map((p) => (
              <button
                type="button"
                key={p.id}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                onClick={() => { setSelected(p); setQuery(`${p.sku} — ${p.name}`); setOptions([]); }}
              >
                <span className="font-mono">{p.sku}</span> — {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && !cabinet && (
        <div className="mb-4 rounded border border-amber-700 bg-amber-100 px-4 py-3 text-sm text-amber-700">
          This product's aisle ({selected.location_aisle}) isn't on the current map layout yet.
        </div>
      )}

      <div className="h-[560px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
        <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene
              highlightedAisle={cabinet?.location_aisle}
              flyTarget={cabinet?.position}
              highlightedProduct={selected}
            />
          </Suspense>
        </Canvas>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-black-500">
        <MapPin size={13} />
        Drag to rotate, scroll to zoom — this is a spatial reference, not a live tracker.
      </p>
    </div>
  );
}
