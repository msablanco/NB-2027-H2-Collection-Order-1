import React, { useState } from 'react';
import { 
  Shirt, 
  Layers, 
  Sparkles, 
  Check, 
  Plus, 
  ShoppingBag, 
  Info, 
  Camera, 
  Eye, 
  Tag 
} from 'lucide-react';
import { PresetLook } from './lookPresetsHelper';
import { Product } from '../types';
import { getProxiedUrl } from './mediaHelper';
import { useCart } from '../context/CartContext';

interface RealProductMannequinAssemblyProps {
  look: PresetLook;
  showLayer: boolean;
  onToggleLayer?: (show: boolean) => void;
  className?: string;
  variant?: 'card' | 'modal' | 'curator';
  onOpenModal?: (look: PresetLook) => void;
}

export const RealProductMannequinAssembly: React.FC<RealProductMannequinAssemblyProps> = ({
  look,
  showLayer,
  onToggleLayer,
  className = '',
  variant = 'card',
  onOpenModal,
}) => {
  const { cartItems, addToCart } = useCart();
  const [activeHotspot, setActiveHotspot] = useState<'layer' | 'top' | 'bottom' | 'footwear' | null>(null);
  const [viewMode, setViewMode] = useState<'real_garments' | 'editorial_photo'>('real_garments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFemale = (look.gender || '').toUpperCase() === 'FEMENINO';
  const hasLayer = Boolean(look.layer);
  const activeUpperProduct = (hasLayer && showLayer) ? look.layer! : look.top;
  const isCard = variant === 'card';

  const isProductInCart = (product?: Product) => {
    if (!product) return false;
    return Boolean(
      (cartItems || []).some(i => i && ((product.id && i.id === product.id) || (product.sku && i.sku === product.sku)) && i.quantity > 0)
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => curr === msg ? null : curr);
    }, 2400);
  };

  const handleQuickAdd = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    showToast(`"${product.name || product.sku}" agregado`);
  };

  const upperImage = activeUpperProduct?.images?.[0] ? getProxiedUrl(activeUpperProduct.images[0]) : '';
  const bottomImage = look.bottom?.images?.[0] ? getProxiedUrl(look.bottom.images[0]) : '';
  const footwearImage = look.footwear?.images?.[0] ? getProxiedUrl(look.footwear.images[0]) : '';
  const editorialPhoto = (showLayer || !look.photoSoloRemera) ? (look.photoWithLayer || look.photoSoloRemera || '') : (look.photoSoloRemera || look.photoWithLayer || '');

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-between select-none overflow-hidden ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Controls: Mode Switcher & Layer Toggle */}
      <div className="w-full flex items-center justify-between gap-1.5 px-3 pt-2 z-20">
        {/* Gender & Authenticity Tag */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${
            isFemale 
              ? 'bg-pink-100 text-pink-800 border border-pink-200' 
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {isFemale ? '♀ Maniquí Mujer' : '♂ Maniquí Hombre'}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold bg-white/90 text-stone-700 px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Prendas Reales 1:1</span>
          </span>
        </div>

        {/* View Switcher: Real Garment Mount vs Campaign Photo */}
        {editorialPhoto && (
          <div className="flex items-center bg-white/95 p-0.5 rounded-lg border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('real_garments');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'real_garments'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Ver maniquí ensamblado con las fotos reales de cada producto del catálogo"
            >
              <span>👗 Maniquí Real</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('editorial_photo');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'editorial_photo'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Ver foto de producción editorial de campaña"
            >
              <span>📸 Foto</span>
            </button>
          </div>
        )}
      </div>

      {/* Layer Toggle Banner (Con Campera / Solo Remera) when layered look */}
      {hasLayer && (
        <div className="z-20 my-1 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-stone-200/90 shadow-2xs flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayer?.(true);
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showLayer 
                ? 'bg-[#CF0A2C] text-white shadow-xs' 
                : 'text-stone-600 hover:text-stone-900 bg-stone-100/80'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Con Campera / Abrigo</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayer?.(false);
            }}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              !showLayer 
                ? 'bg-stone-900 text-white shadow-xs' 
                : 'text-stone-600 hover:text-stone-900 bg-stone-100/80'
            }`}
          >
            <Shirt className="w-3 h-3" />
            <span>Solo Remera / Top</span>
          </button>
        </div>
      )}

      {/* MAIN MANNEQUIN STAGE */}
      <div 
        onClick={() => onOpenModal?.(look)}
        className="relative flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-3 overflow-hidden group cursor-pointer"
        style={{ minHeight: isCard ? '330px' : '420px' }}
      >
        {/* Subtle Ambient Color Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-80 rounded-full pointer-events-none opacity-15 filter blur-3xl transition-colors duration-500"
          style={{ backgroundColor: look.colorInfo?.hex || '#CF0A2C' }}
        />

        {/* MODE A: REAL GARMENTS ANATOMICALLY ASSEMBLED ON MANNEQUIN */}
        {viewMode === 'real_garments' ? (
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] h-[320px] sm:h-[390px] flex flex-col items-center justify-between">
            {/* Mannequin Head & Neck Marker */}
            <div className="relative z-0 flex flex-col items-center -mb-2">
              <div className="w-6 h-8 rounded-full border border-stone-300 bg-gradient-to-b from-stone-200 to-stone-300/80 shadow-2xs" />
              <div className="w-2.5 h-3 bg-stone-300/80 -mt-1" />
            </div>

            {/* UPPER GARMENT: Jacket or T-Shirt mounted on upper torso */}
            <div 
              onMouseEnter={() => setActiveHotspot(showLayer && hasLayer ? 'layer' : 'top')}
              onMouseLeave={() => setActiveHotspot(null)}
              className="relative z-10 w-full flex flex-col items-center -my-2 group/upper transition-transform duration-300 hover:scale-102"
              style={{ height: '44%' }}
            >
              {upperImage ? (
                <img 
                  src={upperImage} 
                  alt={activeUpperProduct?.name || 'Prenda superior'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply"
                />
              ) : (
                <div className="w-24 h-24 bg-stone-200/50 rounded-lg flex items-center justify-center text-xs text-stone-500">
                  Top Base
                </div>
              )}

              {/* Garment Tag Badge */}
              <div className={`absolute top-0 right-1 transition-opacity duration-200 ${
                activeHotspot === (showLayer && hasLayer ? 'layer' : 'top') ? 'opacity-100 z-30' : 'opacity-0 sm:group-hover/upper:opacity-100'
              }`}>
                <div className="bg-white/95 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-200 shadow-sm flex items-center gap-1">
                  <span>{showLayer && hasLayer ? '🧥 Campera' : '👕 Remera'}:</span>
                  <span className="font-mono text-stone-600">{activeUpperProduct?.sku || activeUpperProduct?.name}</span>
                  {activeUpperProduct && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(activeUpperProduct, e)}
                      className="ml-1 p-0.5 bg-[#CF0A2C] text-white rounded hover:bg-red-700 cursor-pointer"
                      title="Agregar al carrito"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LOWER GARMENT: Short, Legging, or Cargo Pant mounted on waist/legs */}
            <div 
              onMouseEnter={() => setActiveHotspot('bottom')}
              onMouseLeave={() => setActiveHotspot(null)}
              className="relative z-10 w-full flex flex-col items-center -my-3 group/bottom transition-transform duration-300 hover:scale-102"
              style={{ height: '36%' }}
            >
              {bottomImage ? (
                <img 
                  src={bottomImage} 
                  alt={look.bottom?.name || 'Prenda inferior'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply"
                />
              ) : (
                <div className="w-20 h-20 bg-stone-200/50 rounded-lg flex items-center justify-center text-xs text-stone-500">
                  Short / Calza
                </div>
              )}

              {/* Garment Tag Badge */}
              <div className={`absolute top-1 left-1 transition-opacity duration-200 ${
                activeHotspot === 'bottom' ? 'opacity-100 z-30' : 'opacity-0 sm:group-hover/bottom:opacity-100'
              }`}>
                <div className="bg-white/95 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-200 shadow-sm flex items-center gap-1">
                  <span>🩳 Inferior:</span>
                  <span className="font-mono text-stone-600">{look.bottom?.sku || look.bottom?.name}</span>
                  {look.bottom && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(look.bottom, e)}
                      className="ml-1 p-0.5 bg-[#CF0A2C] text-white rounded hover:bg-red-700 cursor-pointer"
                      title="Agregar al carrito"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTWEAR & ILLUMINATED PEDESTAL */}
            <div 
              onMouseEnter={() => setActiveHotspot('footwear')}
              onMouseLeave={() => setActiveHotspot(null)}
              className="relative z-10 w-full flex flex-col items-center group/footwear transition-transform duration-300 hover:scale-102 pt-1"
              style={{ height: '24%' }}
            >
              {footwearImage ? (
                <img 
                  src={footwearImage} 
                  alt={look.footwear?.name || 'Calzado New Balance'} 
                  referrerPolicy="no-referrer"
                  className="w-auto h-full max-h-[80px] sm:max-h-[92px] object-contain filter drop-shadow-md mix-blend-multiply"
                />
              ) : (
                <div className="w-16 h-8 bg-stone-200/50 rounded flex items-center justify-center text-[10px] text-stone-500">
                  Calzado NB
                </div>
              )}

              {/* Garment Tag Badge */}
              <div className={`absolute bottom-2 right-1 transition-opacity duration-200 ${
                activeHotspot === 'footwear' ? 'opacity-100 z-30' : 'opacity-0 sm:group-hover/footwear:opacity-100'
              }`}>
                <div className="bg-white/95 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-200 shadow-sm flex items-center gap-1">
                  <span>👟 Calzado:</span>
                  <span className="font-mono text-stone-600 truncate max-w-[110px]">{look.footwear?.name || look.footwear?.sku}</span>
                  {look.footwear && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(look.footwear, e)}
                      className="ml-1 p-0.5 bg-[#CF0A2C] text-white rounded hover:bg-red-700 cursor-pointer"
                      title="Agregar al carrito"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Architectonic Studio Pedestal Line */}
            <div className="w-36 h-2 bg-gradient-to-r from-transparent via-stone-300/80 to-transparent rounded-full -mt-1 shadow-xs" />
          </div>
        ) : (
          /* MODE B: EDITORIAL CAMPAIGN PHOTO */
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={editorialPhoto} 
              alt={look.title}
              referrerPolicy="no-referrer"
              className="max-h-[340px] sm:max-h-[400px] w-auto object-contain rounded-xl drop-shadow-md group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        )}

        {/* Click to expand hover hint */}
        <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-200 shadow-xs flex items-center gap-1">
          <span>Click para ampliar</span>
          <Eye className="w-3 h-3 text-stone-600" />
        </div>
      </div>

      {/* Bottom Status & Summary Bar */}
      <div className="w-full px-3 pb-2 flex items-center justify-between text-[10px] font-medium text-stone-500 border-t border-stone-200/60 pt-1.5 z-10">
        <span className="truncate max-w-[160px]">
          {look.driver} • {look.colorCode}
        </span>
        <span className="text-[#CF0A2C] font-bold">
          {viewMode === 'real_garments' ? 'Prendas Reales Catálogo' : 'Foto Editorial'}
        </span>
      </div>
    </div>
  );
};

export default RealProductMannequinAssembly;
