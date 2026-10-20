import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Plus, Minus, ShoppingBag, Check, ZoomIn, Rocket } from 'lucide-react';
import { Product } from '../types';
import { PLACEHOLDER_IMAGE } from '../data/products';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getProxiedUrl, preloadImages } from './mediaHelper';
import { getProductSizes } from '../utils/sizeCurveHelper';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1) translateZ(0)',
  });

  const mediaItems = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string }[] = [];
    if (product?.images && product.images.length > 0) {
      product.images.forEach(url => {
        const lowerUrl = url.toLowerCase();
        if (!lowerUrl.endsWith('.mp4') && !lowerUrl.endsWith('.mov')) {
          items.push({ type: 'image', url: getProxiedUrl(url) });
        }
      });
    }
    if (items.length === 0) {
      items.push({ type: 'image', url: 'https://via.placeholder.com/400x400?text=Sin+Imagen' });
    }
    return items;
  }, [product?.images]);

  useEffect(() => {
    setCurrentMediaIndex(0);
    setIsZoomActive(false);
  }, [product?.id]);

  const isFav = product ? isFavorite(product.id) : false;
  const cartItem = product
    ? cartItems.find(item => item.id === product.id || (product.sku && item.sku === product.sku))
    : undefined;
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2) translateZ(0)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1) translateZ(0)',
    });
  };

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => (prev + 1) % mediaItems.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center my-auto"
        >
          <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative border border-gray-100">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-20 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors cursor-pointer shadow-sm"
              aria-label="Cerrar producto"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Image Preview with Zoom */}
            <div className="w-full md:w-3/5 p-4 sm:p-6 flex flex-col items-center justify-center bg-stone-50/50">
              <div className="relative flex items-center justify-center w-full aspect-square bg-white rounded-xl overflow-hidden border border-gray-200/80 shadow-xs">
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className="absolute top-3 left-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors z-10 cursor-pointer"
                  title="Favorito"
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>

                {/* Zoom Hint */}
                <div className="absolute bottom-2 right-2 z-10 bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 flex items-center gap-1 pointer-events-none shadow-xs border border-gray-200/50">
                  <ZoomIn className="w-3 h-3 text-[#CF0A2C]" />
                  <span>Pasa el cursor para zoom</span>
                </div>

                <div 
                  className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={failedUrls.includes(mediaItems[currentMediaIndex].url) ? PLACEHOLDER_IMAGE : mediaItems[currentMediaIndex].url}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-100 ease-out p-3"
                    style={zoomStyle}
                    onError={() => {
                      const bad = mediaItems[currentMediaIndex].url;
                      if (!failedUrls.includes(bad)) setFailedUrls(prev => [...prev, bad]);
                    }}
                  />
                </div>

                {mediaItems.length > 1 && (
                  <>
                    <button 
                      onClick={prevMedia} 
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-[#CF0A2C] bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md border border-gray-200 transition-transform cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={nextMedia} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-800 hover:text-[#CF0A2C] bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md border border-gray-200 transition-transform cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

                {/* Thumbnails */}
                {mediaItems.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto w-full pb-1 px-1 hide-scrollbar">
                    {mediaItems.map((item, idx) => {
                      if (failedUrls.includes(item.url)) return null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentMediaIndex(idx)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-white cursor-pointer ${
                            currentMediaIndex === idx ? 'border-[#CF0A2C] shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={item.url} 
                            alt=""
                            className="w-full h-full object-contain mix-blend-multiply" 
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Right Column: Product Specs & Actions */}
            <div className="w-full md:w-2/5 p-5 sm:p-7 flex flex-col justify-between text-left bg-white border-t md:border-t-0 md:border-l border-gray-100">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    {product.category || 'LIFESTYLE'}
                  </span>
                  {product.driver && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                      {product.driver}
                    </span>
                  )}
                  {product.gender && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-50 text-[#CF0A2C] border border-red-200 px-2 py-0.5 rounded">
                      {product.gender}
                    </span>
                  )}
                  {product.division && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                      {product.division}
                    </span>
                  )}
                  {product.marketingLaunch && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#CF0A2C] to-red-700 text-white border border-red-800 px-2 py-0.5 rounded inline-flex items-center shadow-2xs" title="Lanzamiento">
                      <Rocket className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-950 leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku}</p>
                </div>

                <div className="space-y-2.5 text-xs border-y border-gray-100 py-3">
                  {product.colorDescription && (product.division || '').toUpperCase().trim() !== 'CALZADO' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Color:</span>
                      <span className="font-bold text-gray-900">{product.colorDescription}{product.colorCode ? ` (${product.colorCode})` : ''}</span>
                    </div>
                  )}
                  {product.sizeRange && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Rango de Talles:</span>
                      <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{product.sizeRange}</span>
                    </div>
                  )}
                  {product.curve && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Curva de Distribución:</span>
                      <span className="font-mono font-bold text-gray-900">{product.curve}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 font-medium shrink-0">Entregas Habilitadas:</span>
                    <span className="font-semibold text-gray-700 text-xs text-right">
                      {product.allowedPeriods?.join(' / ') || 'Julio / Agosto / Septiembre / Octubre / Noviembre / Diciembre'}
                    </span>
                  </div>
                  {product.origin && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Origen:</span>
                      <span className="font-bold text-gray-900">{product.origin}</span>
                    </div>
                  )}
                  {((product.division || '').toUpperCase() === 'INDUMENTARIA' || product.composition || product.technologies) && (
                    <>
                      {product.composition && (
                        <div className="flex flex-col gap-0.5 pt-2 border-t border-gray-100">
                          <span className="text-gray-400 font-medium">Composición:</span>
                          <span className="font-semibold text-gray-900 leading-snug">{product.composition}</span>
                        </div>
                      )}
                      {product.technologies && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-gray-400 font-medium">Tecnologías:</span>
                          <span className="font-bold text-[#CF0A2C] bg-red-50 border border-red-100 px-2 py-0.5 rounded">{product.technologies}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Pricing Block */}
                <div className="bg-stone-50 p-3 rounded-xl border border-gray-200/80">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Precio Público Sugerido (PVP)</div>
                  <div className="text-2xl font-black text-gray-950">
                    ${(product.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </div>
                  {product.wholesalePrice > 0 && (
                    <div className="mt-1 text-xs text-[#CF0A2C] font-bold">
                      Wholesale (Mayorista): ${(product.wholesalePrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
              </div>

              {/* Cart CTA */}
              <div className="mt-5 pt-3 border-t border-gray-100">
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{quantityInCart} en el pedido</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantityInCart - 1)}
                        className="p-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg hover:bg-emerald-100 cursor-pointer font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-sm text-emerald-950">
                        {quantityInCart}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(product, 1)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="w-full py-3 bg-[#CF0A2C] hover:bg-[#B00824] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al Pedido</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
