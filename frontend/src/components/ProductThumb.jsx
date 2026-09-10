import { Package } from 'lucide-react';
import { API_ORIGIN } from '../api/client.js';

export default function ProductThumb({ product, size = 'h-10 w-10', className = '' }) {
  const isImage = !!product?.image_path;

  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-gray-100 to-gray-200/80 ${className}`}>
      {isImage ? (
        <img
          src={`${API_ORIGIN}${product.image_path}`}
          alt={product.name || 'Product'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-gray-400">
          <Package size={28} strokeWidth={1.5} className="text-gray-400/80" />
          <span className="mt-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">No Photo</span>
        </div>
      )}
    </div>
  );
}
