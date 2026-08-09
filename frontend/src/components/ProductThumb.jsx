import { ImageOff } from 'lucide-react';
import { API_ORIGIN } from '../api/client.js';

export default function ProductThumb({ product, size = 'h-10 w-10' }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100`}>
      {product.image_path ? (
        <img src={`${API_ORIGIN}${product.image_path}`} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-black-300">
          <ImageOff size={16} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
