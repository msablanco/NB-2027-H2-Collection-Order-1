import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  Plus, 
  Layers, 
  Shirt, 
  Eye, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { PresetLook } from './lookPresetsHelper';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { getProxiedUrl } from './mediaHelper';
import { getSingleMannequinImageForLook } from './mannequinSimulationHelper';
import { RealProductMannequinAssembly } from './RealProductMannequinAssembly';
import { ProductDetailModal } from './ProductDetailModal';

interface CampaignLookEditorialCardProps {
  look: PresetLook;
  onOpenMannequinModal: (look: PresetLook) => void;
  className?: string;
}

export const CampaignLookEditorialCard: React.FC<CampaignLookEditorialCardProps> = ({
  look,
  onOpenMannequinModal,
  className = '',
}) => {
  const { cartItems, addToCart } = useCart();
  const [showLayer, setShowLayer] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const hasTwoViews = Boolean(
    look.photoSoloRemera && 
    look.photoWithLayer && 
    look.photoSoloRemera !== look.photoWithLayer
  );

  const fallbackPhoto = getSingleMannequinImageForLook(look, showLayer).image || '/src/assets/images/camp_look1_con_abrigo.jpg';
  const currentPhoto = (showLayer || !hasTwoViews) 
    ? (look.photoWithLayer || look.photoSoloRemera || fallbackPhoto) 
    : (look.photoSoloRemera || look.photoWithLayer || fallbackPhoto);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => curr === msg ? null : curr);
    }, 2800);
  };

  const handleAddProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    showToast(`"${product.name}" agregado al carrito`);
  };

  const handleAddFullLook = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (look.layer && showLayer) {
      addToCart(look.layer, 1);
    }
    addToCart(look.top, 1);
    addToCart(look.bottom, 1);
    addToCart(look.footwear, 1);
    const count = (look.layer && showLayer) ? 4 : 3;
    showToast(`¡Look ${look.campaignCode || ''} completo (${count} prendas) agregado!`);
  };

  const isProductInCart = (product?: Product) => {
    if (!product) return { inCart: false, quantity: 0 };
    const item = (cartItems || []).find(i => 
      i && ((product.id && i.id === product.id) || (product.sku && i.sku === product.sku))
    );
    return {
      inCart: Boolean(item && item.quantity > 0),
      quantity: item ? item.quantity : 0
    };
  };

  const layerCart = isProductInCart(look.layer);
  const topCart = isProductInCart(look.top);
  const bottomCart = isProductInCart(look.bottom);
  const shoesCart = isProductInCart(look.footwear);

  const isFemale = (look.gender || '').toUpperCase() === 'FEMENINO';
  const totalItemCount = (look.layer && showLayer) ? 4 : 3;
  const currentTotalPublic = (look.layer && !showLayer)
    ? Math.max(0, look.totalPublicPrice - (look.layer.price || 0))
    : look.totalPublicPrice;

  return (
    <div className={`col-span-full relative my-5 sm:my-8 bg-white text-gray-900 rounded-2xl overflow-hidden border border-gray-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.09)] transition-shadow duration-300 ${className}`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editorial Top Accent Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-gray-900">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#CF0A2C] text-white shadow-2xs">
            <Sparkles className="w-3 h-3" />
            <span>FOTO DE CAMPAÑA OFICIAL · {look.campaignCode || 'LOOK'}</span>
          </span>
          <span className="text-xs font-bold text-gray-600 hidden sm:inline">
            Colección H2-2027 · {look.driver}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasTwoViews && (
            <div className="flex items-center bg-gray-200/70 p-1 rounded-xl border border-gray-200 gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setShowLayer(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showLayer 
                    ? 'bg-white text-gray-950 shadow-xs border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-950'
                }`}
                title="Ver maniquí con campera / abrigo"
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden xs:inline">Con Abrigo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLayer(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !showLayer 
                    ? 'bg-white text-gray-950 shadow-xs border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-950'
                }`}
                title="Ver maniquí con solo la remera"
              >
                <Shirt className="w-3.5 h-3.5 text-[#CF0A2C]" />
                <span className="hidden xs:inline">Solo Remera</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Editorial Spread Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left: Mannequin Visual Column (5 cols on lg) */}
        <div 
          className="lg:col-span-5 relative bg-gradient-to-b from-stone-50/90 via-gray-100/60 to-stone-100/90 p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 min-h-[380px] sm:min-h-[460px]"
        >
          {/* Subtle Ambient Color Aura */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 rounded-full pointer-events-none opacity-10 filter blur-3xl"
            style={{ backgroundColor: look.colorInfo.hex || '#CF0A2C' }}
          />

          {/* Mannequin Photo */}
          <div className="relative z-10 w-full flex items-center justify-center max-h-[420px]">
            <img 
              src={currentPhoto}
              alt={look.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback1) {
                  target.dataset.triedFallback1 = 'true';
                  const filename = target.src.split('/').pop() || '';
                  target.src = `/images/mannequins/${filename}`;
                } else if (!target.dataset.triedFallback2 && look.top?.imageUrl) {
                  target.dataset.triedFallback2 = 'true';
                  target.src = look.top.imageUrl;
                }
              }}
              className="max-h-[360px] sm:max-h-[420px] w-auto object-contain rounded-xl drop-shadow-md group-hover:scale-102 transition-transform duration-300"
            />
          </div>

          {/* Gender & View Badge */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${
              isFemale 
                ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isFemale ? '♀ Maniquí Mujer' : '♂ Maniquí Hombre'}
            </span>
            {hasTwoViews && (
              <span className="text-[10px] font-bold bg-white/95 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                {showLayer ? 'Vista Con Abrigo' : 'Vista Solo Remera'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Look Breakdown & Merchandising Story (7 cols on lg) */}
        <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 flex flex-col justify-between space-y-5 bg-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#CF0A2C]">
                {look.driver}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs font-semibold text-gray-600">
                {look.colorInfo.spanishName || look.colorInfo.name} ({look.colorCode})
              </span>
            </div>

            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-950 leading-tight">
              {look.title}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {look.description}
            </p>
          </div>

          {/* The Coordinated Garments Row */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2.5 flex items-center justify-between">
              <span>Prendas que componen este look ({totalItemCount}):</span>
              <span className="text-gray-400 font-mono text-[10px]">100% Catálogo H2-2027</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Layer (if available) */}
              {look.layer && (
                <div 
                  onClick={() => setSelectedProduct(look.layer!)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-md ${
                    showLayer 
                      ? 'bg-purple-50/40 border-purple-200 shadow-2xs hover:border-purple-300' 
                      : 'bg-gray-50/60 border-gray-200 opacity-60 hover:opacity-90'
                  }`}
                  title="Click para ver ficha del producto"
                >
                  <div className="text-[9px] font-black uppercase tracking-wider text-purple-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>ABRIGO</span>
                      <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-purple-600" />
                    </span>
                    {layerCart.inCart && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                  </div>
                  <div className="w-full h-20 bg-white rounded-lg p-1 mb-1.5 flex items-center justify-center overflow-hidden border border-gray-200/70 group-hover:border-purple-300">
                    <img 
                      src={getProxiedUrl(look.layer.images[0])} 
                      alt={look.layer.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors" title={look.layer.name}>
                    {look.layer.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">{look.layer.sku}</p>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                    <span className="text-xs font-black text-gray-950">
                      ${(look.layer.price || 0).toLocaleString('es-AR')}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleAddProduct(look.layer!, e)}
                      className={`p-1 rounded-lg cursor-pointer transition-colors ${
                        layerCart.inCart 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      title="Agregar al carrito"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Top */}
              <div 
                onClick={() => setSelectedProduct(look.top)}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#CF0A2C]/60 shadow-2xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
                title="Click para ver ficha del producto"
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>TOP BASE</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {topCart.inCart && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                </div>
                <div className="w-full h-20 bg-gray-50/60 rounded-lg p-1 mb-1.5 flex items-center justify-center overflow-hidden border border-gray-200/70 group-hover:border-red-200">
                  <img 
                    src={getProxiedUrl(look.top.images[0])} 
                    alt={look.top.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-900 truncate group-hover:text-[#CF0A2C] transition-colors" title={look.top.name}>
                  {look.top.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono truncate">{look.top.sku}</p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                  <span className="text-xs font-black text-gray-950">
                    ${(look.top.price || 0).toLocaleString('es-AR')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddProduct(look.top, e)}
                    className={`p-1 rounded-lg cursor-pointer transition-colors ${
                      topCart.inCart 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#CF0A2C] hover:bg-[#B00824] text-white'
                    }`}
                    title="Agregar al carrito"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3. Bottom */}
              <div 
                onClick={() => setSelectedProduct(look.bottom)}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#CF0A2C]/60 shadow-2xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
                title="Click para ver ficha del producto"
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>PARTE INFERIOR</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {bottomCart.inCart && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                </div>
                <div className="w-full h-20 bg-gray-50/60 rounded-lg p-1 mb-1.5 flex items-center justify-center overflow-hidden border border-gray-200/70 group-hover:border-red-200">
                  <img 
                    src={getProxiedUrl(look.bottom.images[0])} 
                    alt={look.bottom.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-900 truncate group-hover:text-[#CF0A2C] transition-colors" title={look.bottom.name}>
                  {look.bottom.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono truncate">{look.bottom.sku}</p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                  <span className="text-xs font-black text-gray-950">
                    ${(look.bottom.price || 0).toLocaleString('es-AR')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddProduct(look.bottom, e)}
                    className={`p-1 rounded-lg cursor-pointer transition-colors ${
                      bottomCart.inCart 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#CF0A2C] hover:bg-[#B00824] text-white'
                    }`}
                    title="Agregar al carrito"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 4. Footwear */}
              <div 
                onClick={() => setSelectedProduct(look.footwear)}
                className="p-2.5 rounded-xl bg-red-50/30 border border-red-200/80 hover:border-red-400 shadow-2xs hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]"
                title="Click para ver ficha del producto"
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-[#CF0A2C] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>CALZADO</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {shoesCart.inCart && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                </div>
                <div className="w-full h-20 bg-white rounded-lg p-1 mb-1.5 flex items-center justify-center overflow-hidden border border-gray-200/70 group-hover:border-red-300">
                  <img 
                    src={getProxiedUrl(look.footwear.images[0])} 
                    alt={look.footwear.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-900 truncate group-hover:text-[#CF0A2C] transition-colors" title={look.footwear.name}>
                  {look.footwear.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono truncate">{look.footwear.sku}</p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-red-100">
                  <span className="text-xs font-black text-gray-950">
                    ${(look.footwear.price || 0).toLocaleString('es-AR')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddProduct(look.footwear, e)}
                    className={`p-1 rounded-lg cursor-pointer transition-colors ${
                      shoesCart.inCart 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#CF0A2C] hover:bg-[#B00824] text-white'
                    }`}
                    title="Agregar al carrito"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer: Full Look Total Price & CTAs */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-baseline gap-2 text-left w-full sm:w-auto">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Total Outfit ({totalItemCount} prendas):
              </span>
              <span className="text-lg sm:text-2xl font-black text-gray-950">
                ${currentTotalPublic.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleAddFullLook}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#CF0A2C] hover:bg-[#B00824] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98 shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar Look Completo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Product Detail Quick View Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
