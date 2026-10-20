import React, { useState, useEffect } from 'react';
import { PLACEHOLDER_IMAGE } from '../data/products';

const cache = new Map<string, string>();
const inFlightPromises = new Map<string, Promise<string>>();

export const getCachedImage = (src: string): string | undefined => {
  return cache.get(src);
};

export const processAndCacheImage = (src: string, threshold: number = 230, referrerPolicy?: string): Promise<string> => {
  if (!src) return Promise.resolve('');
  if (src.startsWith('data:image/svg') || src.includes('placeholder.com')) {
    cache.set(src, src);
    return Promise.resolve(src);
  }
  if (cache.has(src)) return Promise.resolve(cache.get(src)!);
  if (inFlightPromises.has(src)) return inFlightPromises.get(src)!;

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = (referrerPolicy as any) || 'no-referrer';
    img.src = src;

    img.onload = () => {
      try {
        const maxDim = 360;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cache.set(src, src);
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // 1. Grayscale representation for Sobel edge detection
        const gray = new Uint8Array(totalPixels);
        for (let i = 0; i < totalPixels; i++) {
          const rIdx = i * 4;
          gray[i] = (77 * data[rIdx] + 150 * data[rIdx + 1] + 29 * data[rIdx + 2]) >> 8;
        }

        // 2. Compute local gradients using 3x3 Sobel operator on interior pixels
        const gradients = new Float32Array(totalPixels);
        for (let y = 1; y < height - 1; y++) {
          const rowOffset = y * width;
          const prevRow = (y - 1) * width;
          const nextRow = (y + 1) * width;
          for (let x = 1; x < width - 1; x++) {
            const idx = rowOffset + x;
            const gx =
              -gray[prevRow + x - 1] + gray[prevRow + x + 1] -
              2 * gray[rowOffset + x - 1] + 2 * gray[rowOffset + x + 1] -
              gray[nextRow + x - 1] + gray[nextRow + x + 1];
            const gy =
              -gray[prevRow + x - 1] - 2 * gray[prevRow + x] - gray[prevRow + x + 1] +
              gray[nextRow + x - 1] + 2 * gray[nextRow + x] + gray[nextRow + x + 1];
            gradients[idx] = Math.hypot(gx, gy);
          }
        }

        // BFS queue using typed array instead of dynamic array push
        const visited = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let qHead = 0;
        let qTail = 0;

        const pushSeedPixel = (x: number, y: number) => {
          const idx = y * width + x;
          if (visited[idx]) return;
          const rIdx = idx * 4;
          if (data[rIdx] >= threshold && data[rIdx + 1] >= threshold && data[rIdx + 2] >= threshold) {
            visited[idx] = 1;
            queue[qTail++] = idx;
          }
        };

        const pushPixel = (x: number, y: number) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return;
          const idx = y * width + x;
          if (visited[idx]) return;
          const rIdx = idx * 4;
          if (
            data[rIdx] >= threshold &&
            data[rIdx + 1] >= threshold &&
            data[rIdx + 2] >= threshold &&
            gradients[idx] < 8
          ) {
            visited[idx] = 1;
            queue[qTail++] = idx;
          }
        };

        for (let x = 0; x < width; x++) {
          pushSeedPixel(x, 0);
          pushSeedPixel(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          pushSeedPixel(0, y);
          pushSeedPixel(width - 1, y);
        }

        while (qHead < qTail) {
          const idx = queue[qHead++];
          const x = idx % width;
          const y = (idx / width) | 0;

          data[idx * 4 + 3] = 0;

          pushPixel(x + 1, y);
          pushPixel(x - 1, y);
          pushPixel(x, y + 1);
          pushPixel(x, y - 1);
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        cache.set(src, dataUrl);
        resolve(dataUrl);
      } catch (err) {
        cache.set(src, src);
        resolve(src);
      }
    };

    img.onerror = () => {
      cache.set(src, PLACEHOLDER_IMAGE);
      resolve(PLACEHOLDER_IMAGE);
    };
  }).finally(() => {
    inFlightPromises.delete(src);
  });

  inFlightPromises.set(src, promise);
  return promise;
};

interface TransparentImageProps {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export const TransparentImage: React.FC<TransparentImageProps> = ({
  src,
  alt,
  className = '',
  threshold = 230,
  referrerPolicy
}) => {
  const [processedSrc, setProcessedSrc] = useState<string>(() => cache.get(src) || '');
  const [loading, setLoading] = useState<boolean>(() => !cache.has(src));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setHasError(false);
    if (!src) {
      setProcessedSrc(PLACEHOLDER_IMAGE);
      setLoading(false);
      return;
    }

    if (src.startsWith('data:image/svg') || src.includes('placeholder.com')) {
      setProcessedSrc(src);
      setLoading(false);
      return;
    }

    if (cache.has(src)) {
      setProcessedSrc(cache.get(src)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    processAndCacheImage(src, threshold, referrerPolicy as string)
      .then((dataUrl) => {
        if (!cancelled) {
          setProcessedSrc(dataUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src, threshold, referrerPolicy]);

  if (hasError) {
    return (
      <img
        src={PLACEHOLDER_IMAGE}
        alt="Sin Imagen"
        className={`${className} opacity-100`}
      />
    );
  }

  return (
    <>
      {loading || !processedSrc ? (
        <div className={`animate-pulse bg-gray-200 ${className}`} />
      ) : (
        <img
          src={processedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className} opacity-100 transition-opacity duration-300`}
          referrerPolicy={referrerPolicy}
          onError={() => setHasError(true)}
        />
      )}
    </>
  );
};

export default TransparentImage;
