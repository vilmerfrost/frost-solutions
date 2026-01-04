// app/components/performance/OptimizedImage.tsx

/**
 * Optimized Image Component
 * Based on Deepseek implementation
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
 src: string;
 alt: string;
 width?: number;
 height?: number;
 className?: string;
 priority?: boolean;
 placeholder?: 'blur' | 'empty';
 blurDataURL?: string;
 onLoad?: () => void;
 onError?: () => void;
}

export function OptimizedImage({
 src,
 alt,
 width,
 height,
 className,
 priority = false,
 placeholder = 'empty',
 blurDataURL,
 onLoad,
 onError,
}: OptimizedImageProps) {
 const [isLoading, setIsLoading] = useState(true);
 const [hasError, setHasError] = useState(false);

 if (hasError) {
  return (
   <div
    className={cn(
     'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
     className
    )}
    style={{ width, height }}
   >
    <span className="text-gray-400 text-sm">Bild kunde inte laddas</span>
   </div>
  );
 }

 return (
  <div className={cn('relative overflow-hidden', className)}>
   {isLoading && placeholder === 'blur' && blurDataURL && (
    <div
     className="absolute inset-0 blur-sm scale-110"
     style={{
      backgroundImage: `url(${blurDataURL})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
     }}
    />
   )}
   <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={priority}
    placeholder={placeholder}
    blurDataURL={blurDataURL}
    className={cn(
     'transition-opacity duration-300',
     isLoading ? 'opacity-0' : 'opacity-100'
    )}
    onLoad={() => {
     setIsLoading(false);
     onLoad?.();
    }}
    onError={() => {
     setIsLoading(false);
     setHasError(true);
     onError?.();
    }}
   />
  </div>
 );
}

