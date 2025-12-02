import { useState, useCallback, memo } from 'react';

interface FallbackImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  draggable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
}

/**
 * Componente de imagen con fallback elegante cuando falla la carga
 */
export const FallbackImage = memo(function FallbackImage({
  src,
  alt,
  className,
  fallback,
  draggable = true,
  onContextMenu,
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className || ''} ${isLoading ? 'img-loading' : 'img-loaded'}`}
      draggable={draggable}
      onContextMenu={onContextMenu}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
});
