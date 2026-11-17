import { useState } from 'react';
import { Package } from 'lucide-react';
import { API_ORIGIN } from '../api/client.js';

export default function ProductThumb({
  product,
  src,
  alt,
  size = 'h-10 w-10',
  className = '',
  imgClassName = '',
  fit = 'contain',
  iconSize = 28,
}) {
  const [loadError, setLoadError] = useState(false);
  const rawPath = src || product?.image_path;
  const isImage = !!rawPath && !loadError;

  const imageUrl = isImage
    ? (rawPath.startsWith('data:') || rawPath.startsWith('http'))
      ? rawPath
      : `${API_ORIGIN}${rawPath}`
    : null;

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt || product?.name || 'Product'}
          className={`h-full w-full ${fitClass} ${imgClassName}`}
          onError={() => setLoadError(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-gray-400">
          <Package size={iconSize} strokeWidth={1.5} className="text-gray-400/80" />
          <span className="mt-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">No Photo</span>
        </div>
      )}
    </div>
  );
}
