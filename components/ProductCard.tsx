import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Rocket, MessageSquare, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { PLACEHOLDER_IMAGE } from '../data/products';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import ReviewDialog from './ReviewDialog';
import { getProxiedUrl, preloadImages } from './mediaHelper';
import { getProductSizes } from '../utils/sizeCurveHelper';
import { PresetLook } from './lookPresetsHelper';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'compact';
  campaignLook?: PresetLook;
  onOpenMannequinModal?: (look: PresetLook) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = 'grid',
  campaignLook,
  onOpenMannequinModal
}) => {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(product.id);
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isInCart = quantityInCart > 0;
  
  

  const [isZoomed, setIsZoomed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1) translateZ(0)',
    willChange: 'transform',
    WebkitTransform: 'scale(1) translateZ(0)',
    imageRendering: '-webkit-optimize-contrast' as any,
  });

  React.useEffect(() => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1) translateZ(0)',
      willChange: 'transform',
      WebkitTransform: 'scale(1) translateZ(0)',
      imageRendering: '-webkit-optimize-contrast' as any,
    });
  }, [currentMediaIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.0) translateZ(0)',
      WebkitTransform: 'scale(2.0) translateZ(0)',
      willChange: 'transform',
      imageRendering: '-webkit-optimize-contrast' as any,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1) translateZ(0)',
      WebkitTransform: 'scale(1) translateZ(0)',
      willChange: 'transform',
      imageRendering: '-webkit-optimize-contrast' as any,
    });
  };

  const mediaItems = React.useMemo(() => {
     const items: { type: 'image' | 'video', url: string }[] = [];
     if (product.images && product.images.length > 0) {
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
  }, [product.images]);

  // Parse sizes and curve
  const sizes = React.useMemo(() => {
    return getProductSizes(product);
  }, [product.sizeRange, product.sizes, product.division]);

  const defaultCurve = React.useMemo(() => {
    if (!product.curve || typeof product.curve !== 'string' || product.curve === 'Libre' || !product.curve.includes('-')) {
      return [];
    }
    return product.curve.split('-').map(Number).filter(n => !isNaN(n));
  }, [product.curve]);

  const unitsInCurve = React.useMemo(() => {
    if (defaultCurve.length === 0) return 0;
    return defaultCurve.reduce((a: number, b: any) => a + Number(b), 0);
  }, [defaultCurve]);

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const hasVideo = React.useMemo(() => mediaItems.some(i => i.type === 'video'), [mediaItems]);

  // Automatic hover transition disabled to optimize page-wide image preloading performance and keep CPU idle

  React.useEffect(() => {
    if (!isHovered && !isZoomed) {
      setCurrentMediaIndex(0);
      return;
    }
    const urlsToPreload = mediaItems
      .slice(1)
      .filter(item => item.type === 'image')
      .map(item => item.url);
    if (urlsToPreload.length > 0) {
      preloadImages(urlsToPreload);
    }
  }, [isHovered, isZoomed, mediaItems]);

  return (
    <div className="flex flex-col w-full h-full">
      <div 
        className={`flex flex-col group relative bg-white border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-gray-300 transition-all duration-300 ease-out h-full cursor-pointer ${viewMode === 'compact' ? 'rounded-xl p-2' : 'rounded-2xl p-3 sm:p-3.5'}`}
        onClick={() => setIsZoomed(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div 
          className={`relative overflow-hidden bg-white flex items-center justify-center p-0 cursor-zoom-in ${viewMode === 'compact' ? 'rounded-lg mb-2 aspect-square' : 'rounded-xl mb-2.5 aspect-square'}`}
        >
          {product.marketingLaunch && (
            <motion.div 
              className={`absolute top-2 ${product.northStar ? 'left-9' : 'left-2'} text-xl z-10 drop-shadow-md origin-bottom`} 
              title="Lanzamiento"
              animate={isHovered ? { y: [0, -4, 0], rotate: [0, 8, -8, 0] } : { y: 0, rotate: 0 }}
              transition={{ repeat: isHovered ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
            >
                🚀
            </motion.div>
          )}
          {product.northStar && (
            <div 
              className={`absolute top-2 ${product.marketingLaunch ? 'left-9' : 'left-2'} text-xl z-10 drop-shadow-md`}
              title="North Star"
            >
              🌟
            </div>
          )}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2">
            {mediaItems[currentMediaIndex].type === 'video' ? (
                <video 
                   src={mediaItems[currentMediaIndex].url}
                   className="w-full h-full object-contain mix-blend-multiply pointer-events-none"
                   autoPlay
                   muted
                   loop={true}
                   playsInline
                />
            ) : (
                <img
                    src={failedUrls.includes(mediaItems[currentMediaIndex].url) ? PLACEHOLDER_IMAGE : mediaItems[currentMediaIndex].url}
                    alt={`${product.name} - ${product.colorDescription}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out mix-blend-multiply"
                    onError={() => {
                      const badUrl = mediaItems[currentMediaIndex].url;
                      if (!failedUrls.includes(badUrl)) {
                        setFailedUrls(prev => [...prev, badUrl]);
                      }
                    }}
                />
            )}
          </div>
          {campaignLook && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMannequinModal?.(campaignLook);
              }}
              className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight bg-slate-900/90 hover:bg-black text-amber-300 border border-amber-400/40 shadow-md backdrop-blur-xs transition-all hover:scale-105 cursor-pointer"
              title={`Ver look completo en Maniquí: ${campaignLook.campaignCode || 'Look de Campaña'}`}
            >
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{campaignLook.campaignCode || 'Look'}</span>
            </button>
          )}

          <button 
           onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
           className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors z-10"
           aria-label="Agregar a favoritos"
          >
            <motion.div
               initial={false}
               animate={{ scale: isFav ? [1, 1.3, 1] : 1 }}
               transition={{ duration: 0.3 }}
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </motion.div>
          </button>
          
          {/* Rocket at top-left is the clean, official launch indicator */}

          {product.status && (
            <div className={`absolute bottom-2 right-2 z-10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded-sm shadow-xs border
              ${product.status.toUpperCase() === 'NEW' ? 'bg-green-50 text-green-700 border-green-200' : 
                product.status.toUpperCase() === 'C/O' ? 'bg-red-50 text-[#CF0A2C] border-red-200' : 
                product.status.toUpperCase() === 'CUD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-gray-100 text-gray-800 border-gray-200'}`}
            >
               {product.status.toUpperCase()}
            </div>
          )}
        {mediaItems.length > 1 && (
            <>
                <button onClick={prevMedia} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#CF0A2C] hover:scale-110 transition-transform duration-300 focus:outline-none bg-white/80 rounded-full p-1 border border-gray-200/60 shadow-xs z-10" aria-label="Imagen anterior">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={nextMedia} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#CF0A2C] hover:scale-110 transition-transform duration-300 focus:outline-none bg-white/80 rounded-full p-1 border border-gray-200/60 shadow-xs z-10" aria-label="Siguiente imagen">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none">
                  <span className="text-[9px] font-mono text-white font-bold leading-none tracking-tight">
                    {currentMediaIndex + 1}/{mediaItems.length}
                  </span>
                </div>
            </>
        )}
      </div>

      <div className="flex flex-col text-left flex-grow">
        {/* Name - Fixed height for 2 lines */}
        <div className={`mb-1 ${viewMode === 'compact' ? 'h-[1.75rem]' : 'h-[2.1rem]'}`}>
          <h3 className={`font-sans font-semibold text-gray-900 leading-snug line-clamp-2 ${viewMode === 'compact' ? 'text-[11px]' : 'text-[13px] tracking-tight'}`} title={product.name}>
              {product.name}
          </h3>
        </div>

        {/* Disciplina, Driver y Género en una sola línea refinada estilo New Balance */}
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium leading-none flex-wrap">
          <span className="text-[#CF0A2C] font-semibold tracking-wide uppercase text-[10px]">{product.category}</span>
          {product.driver && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-gray-600 font-medium text-[10px] uppercase tracking-tight" title={`Driver: ${product.driver}`}>
                {product.driver}
              </span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-gray-500 text-[10px] uppercase">{product.gender}</span>
        </div>

        {/* SKU y Código de color */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 leading-none">
          <span>SKU: <span className="font-mono text-gray-700 font-medium">{product.sku}</span></span>
          {product.colorCode && (product.division || '').toUpperCase().trim() !== 'CALZADO' && <span className="font-mono text-gray-400">[{product.colorCode}]</span>}
        </div>

        {/* Color Description - Fixed height (hidden for Calzado) */}
        {(!viewMode || viewMode === 'grid') && (product.division || '').toUpperCase().trim() !== 'CALZADO' && (
            <div className="h-[1.6rem] mb-1.5">
              <p className="text-gray-500 text-[11px] leading-tight line-clamp-2">
                <span className="font-semibold text-gray-400 text-[9px] uppercase mr-1">Color:</span>{product.colorDescription}
              </p>
            </div>
        )}
        
        {/* Price Section */}
        <div className={`flex flex-col ${viewMode === 'compact' ? 'mb-1 mt-0.5' : 'mb-2 mt-0.5'}`}>
          <div className="flex items-baseline justify-between gap-1">
            <div>
              <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider block leading-none mb-0.5">Sugerido</span>
              <p className={`font-sans font-bold text-gray-900 leading-none ${viewMode === 'compact' ? 'text-sm' : 'text-[15px]'}`}>
                ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            {(!viewMode || viewMode === 'grid') && (
              <div className="text-right">
                <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider block leading-none mb-0.5">Wholesale</span>
                <span className="text-[10px] font-semibold text-[#CF0A2C] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded leading-none inline-block">
                  ${product.wholesalePrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className={`mt-auto border-t border-gray-150/70 ${viewMode === 'compact' ? 'pt-1' : 'pt-1.5'}`}>
            {(!viewMode || viewMode === 'grid') && (
              <>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-600 font-mono mb-1.5">
                    <div>
                        <span className="block text-gray-400 uppercase text-[8px] font-sans font-bold tracking-wider mb-0.5">Talles</span>
                        <span className="font-medium text-gray-800">{product.sizeRange}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-gray-400 uppercase text-[8px] font-sans font-bold tracking-wider mb-0.5">Curva</span>
                        <span className="font-medium text-gray-800 break-words" title={product.curve}>{product.curve}</span>
                    </div>
                </div>
                {product.allowedPeriods && product.allowedPeriods.length > 0 && (
                  <div className="flex items-start justify-between gap-2 text-[9px] mb-1.5 px-0.5">
                    <span className="text-gray-400 uppercase text-[8px] font-sans font-bold tracking-wider shrink-0 mt-0.5">Entregas:</span>
                    <span className="text-gray-600 font-medium text-right leading-tight">{product.allowedPeriods.join(' / ')}</span>
                  </div>
                )}
              </>
            )}
            
            {/* Botones de acción directos */}
            <div className={`flex items-center justify-center gap-1.5 ${viewMode === 'compact' ? 'flex-col sm:flex-row' : ''}`}>
                {isInCart ? (
                    <div className={`flex-grow flex items-center justify-center bg-gray-100 text-[#CF0A2C] font-semibold rounded-full border border-gray-200 shadow-none uppercase tracking-wide ${viewMode === 'compact' ? 'h-[26px] px-2 text-[9px] w-full' : 'h-[32px] px-4 text-[11px]'}`}>
                        EN CARRITO ({quantityInCart})
                    </div>
                ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                      className={`flex-grow flex items-center justify-center bg-[#CF0A2C] hover:bg-[#B00824] text-white font-medium rounded-full transition-colors duration-200 focus:outline-none tracking-wide shadow-xs uppercase ${viewMode === 'compact' ? 'h-[26px] px-2 text-[9px] w-full' : 'h-[32px] px-4 text-[11px]'}`}
                      type="button"
                    >
                      COMPRAR
                    </button>
                )}
                
                <button
                  onClick={(e) => { e.stopPropagation(); setIsReviewOpen(true); }}
                  className={`bg-gray-100 hover:bg-gray-200 text-gray-600 p-0 rounded-full transition-colors shadow-none shrink-0 flex items-center justify-center border border-gray-200/60 ${viewMode === 'compact' ? 'h-[26px] w-[26px]' : 'h-[32px] w-[32px]'}`}
                  title="Comentarios y Valoración"
                  aria-label="Dejar comentario"
                  type="button"
                >
                  <MessageSquare className={viewMode === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                </button>
            </div>
        </div>
      </div>
    </div>
      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-full flex flex-col items-center"
            >
              <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row relative">
                <button
                  onClick={() => setIsZoomed(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Cerrar zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-full md:w-3/5 p-4 md:p-6 flex flex-col items-center justify-center bg-white">
                  <div className="relative flex items-center justify-center w-full aspect-square md:aspect-auto md:h-[800px] bg-white rounded-xl overflow-hidden transition-all duration-300 hover:md:scale-105">
                    {mediaItems[currentMediaIndex].type === 'video' ? (
                      <video
                        src={mediaItems[currentMediaIndex].url}
                        className="max-w-full max-h-full object-contain"
                        autoPlay
                        loop={true}
                        muted
                        playsInline
                      />
                    ) : (
                    <div 
                      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in rounded-xl"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={failedUrls.includes(mediaItems[currentMediaIndex].url) ? 'https://via.placeholder.com/400x400?text=Sin+Imagen' : mediaItems[currentMediaIndex].url}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-150 ease-out"
                        style={zoomStyle}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          const badUrl = mediaItems[currentMediaIndex].url;
                          if (!failedUrls.includes(badUrl)) {
                            setFailedUrls(prev => [...prev, badUrl]);
                          }
                        }}
                      />
                    </div>
                    )}
                    {mediaItems.length > 1 && (
                        <>
                            <button onClick={prevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#CF0A2C] hover:scale-110 transition-transform duration-300 focus:outline-none bg-white/80 rounded-full p-2 border border-transparent hover:border-gray-300 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={nextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#CF0A2C] hover:scale-110 transition-transform duration-300 focus:outline-none bg-white/80 rounded-full p-2 border border-transparent hover:border-gray-300 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}
                  </div>
                  {/* Thumbnails */}
                  {mediaItems.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto w-full pb-2 px-2 hide-scrollbar">
                      {mediaItems.map((item, idx) => {
                        const isFailed = failedUrls.includes(item.url);
                        if (isFailed) return null; // Ocultar miniaturas rotas
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentMediaIndex(idx)}
                            className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all block ${currentMediaIndex === idx ? 'border-[#CF0A2C] opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          >
                            {item.type === 'video' ? (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 <video src={item.url} className="w-full h-full object-cover" autoPlay loop={true} muted playsInline />
                              </div>
                            ) : (
                              <img 
                                src={item.url} 
                                loading="lazy" 
                                referrerPolicy="no-referrer" 
                                className="w-full h-full object-cover" 
                                onError={() => {
                                  if (!failedUrls.includes(item.url)) {
                                    setFailedUrls(prev => [...prev, item.url]);
                                  }
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Right Side: Info */}
                <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col items-start text-left bg-white border-l border-gray-100">
                  <div className="flex flex-wrap items-center gap-2 mb-3 mt-4 md:mt-0">
                    <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {product.category}
                    </span>
                    {product.driver && (
                      <span className="text-xs font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-1 rounded">
                        {product.driver}
                      </span>
                    )}
                    {product.gender && (
                        <span className="text-xs font-bold uppercase tracking-wider bg-red-50 text-[#CF0A2C] px-2 py-1 rounded">
                          {product.gender}
                        </span>
                    )}
                    {product.marketingLaunch && (
                      <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#CF0A2C] to-red-700 text-white px-2 py-1 rounded inline-flex items-center shadow-2xs" title="Lanzamiento">
                        <Rocket className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  
                  {campaignLook && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoomed(false);
                        onOpenMannequinModal?.(campaignLook);
                      }}
                      className="w-full flex items-center justify-between p-2.5 mb-3 rounded-lg bg-amber-50/90 hover:bg-amber-100 border border-amber-200/90 transition-all text-left shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-amber-950 uppercase tracking-tight leading-tight">
                            {campaignLook.campaignCode || 'Look Oficial de Campaña'}
                          </p>
                          <p className="text-[10px] text-amber-800 leading-tight">
                            Parte del outfit oficial H2-2027
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-900 group-hover:translate-x-0.5 transition-transform">
                        Ver en Maniquí →
                      </span>
                    </button>
                  )}

                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight mb-4">
                    {product.name}
                  </h2>
                  
                  <div className="space-y-3 w-full flex-grow">
                      <div className="border-b border-gray-100 pb-2.5">
                          <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">SKU</p>
                          <p className="text-base font-mono text-gray-900">{product.sku}</p>
                      </div>
                      
                      {(product.division || '').toUpperCase().trim() !== 'CALZADO' && product.colorDescription && (
                        <div className="border-b border-gray-100 pb-2.5">
                            <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Color</p>
                            <p className="text-sm text-gray-900">{product.colorDescription}</p>
                        </div>
                      )}

                      <div className="flex gap-6 border-b border-gray-100 pb-2.5">
                          <div>
                              <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Talles</p>
                              <p className="text-sm font-mono text-gray-900">{product.sizeRange}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Curva</p>
                              <p className="text-sm font-mono text-gray-900">{product.curve}</p>
                          </div>
                      </div>

                      <div className="border-b border-gray-100 pb-2.5">
                          <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Entregas Habilitadas</p>
                          <p className="text-xs font-semibold text-gray-800">{product.allowedPeriods?.join(' / ') || 'Julio / Agosto / Septiembre / Octubre / Noviembre / Diciembre'}</p>
                      </div>

                      {((product.division || '').toUpperCase() === 'INDUMENTARIA' || product.composition || product.technologies) && (
                        <>
                          {product.composition && (
                            <div className="border-b border-gray-100 pb-2.5">
                              <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Composición</p>
                              <p className="text-sm text-gray-900 leading-relaxed">{product.composition}</p>
                            </div>
                          )}
                          {product.technologies && (
                            <div className="border-b border-gray-100 pb-2.5">
                              <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Tecnologías</p>
                              <p className="text-xs font-bold text-[#CF0A2C] bg-red-50 border border-red-100 px-2.5 py-1 rounded inline-block">{product.technologies}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="pt-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Precio Sugerido</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          <div className="inline-block mt-0.5 text-xs text-[#CF0A2C] font-semibold bg-red-50 border border-red-100 px-2.5 py-1 rounded">
                              Wholesale: ${product.wholesalePrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReviewDialog
        productId={product.id}
        productName={product.name}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />
    </div>
  );
};

export default ProductCard;
