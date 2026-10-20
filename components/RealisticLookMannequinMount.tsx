import React, { useState } from 'react';
import { 
  Shirt, 
  ShoppingBag, 
  Check, 
  Layers, 
  Plus,
  Camera,
  Eye
} from 'lucide-react';
import { PresetLook } from './lookPresetsHelper';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { getProxiedUrl } from './mediaHelper';
import { getSingleMannequinImageForLook } from './mannequinSimulationHelper';
import { ProductDetailModal } from './ProductDetailModal';

interface RealisticLookMannequinMountProps {
  look: PresetLook;
  height?: number | string;
  showDetailsSidebar?: boolean;
  onClose?: () => void;
  className?: string;
  initialShowLayer?: boolean;
  onToggleLayer?: (show: boolean) => void;
}

export const RealisticLookMannequinMount: React.FC<RealisticLookMannequinMountProps> = ({
  look,
  height = 620,
  showDetailsSidebar = true,
  onClose,
  className = '',
  initialShowLayer = true,
  onToggleLayer,
}) => {
  const { cartItems, addToCart } = useCart();
  const [showLayer, setShowLayer] = useState<boolean>(initialShowLayer);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync state if look or initialShowLayer changes
  React.useEffect(() => {
    setShowLayer(initialShowLayer);
  }, [initialShowLayer, look.id]);

  const handleSetShowLayer = (show: boolean) => {
    setShowLayer(show);
    if (onToggleLayer) {
      onToggleLayer(show);
    }
  };

  const isFemale = (look.gender || '').toUpperCase() === 'FEMENINO';
  // Photo asset dynamically resolves based on look color, gender, and whether layer is on/off
  const photoAsset = getSingleMannequinImageForLook(look, showLayer);

  const getProductImage = (p?: Product) => {
    return getProxiedUrl(p?.images?.[0] || '');
  };

  const triggerToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => {
      setAddedToast(curr => curr === msg ? null : curr);
    }, 2800);
  };

  const handleAddProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1);
    triggerToast(`"${product.name}" agregado al carrito`);
  };

  const handleAddAllItems = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (look.layer && showLayer) {
      addToCart(look.layer, 1);
    }
    addToCart(look.top, 1);
    addToCart(look.bottom, 1);
    addToCart(look.footwear, 1);
    const count = (look.layer && showLayer) ? 4 : 3;
    triggerToast(`¡Look completo (${count} prendas) agregado al pedido!`);
  };

  const isProductInCart = (product?: Product) => {
    if (!product) return { inCart: false, quantity: 0 };
    const item = (cartItems || []).find(i => i && ((product.id && i.id === product.id) || (product.sku && i.sku === product.sku)));
    return {
      inCart: Boolean(item && item.quantity > 0),
      quantity: item ? item.quantity : 0
    };
  };

  const topCart = isProductInCart(look.top);
  const bottomCart = isProductInCart(look.bottom);
  const shoesCart = isProductInCart(look.footwear);
  const layerCart = isProductInCart(look.layer);

  const totalMountedItems = (look.layer && showLayer) ? 4 : 3;
  const currentTotalPublicPrice = (look.layer && !showLayer)
    ? Math.max(0, look.totalPublicPrice - (look.layer.price || 0))
    : look.totalPublicPrice;

  return (
    <div className={`relative bg-white text-stone-900 rounded-2xl overflow-hidden border border-stone-200 shadow-2xl flex flex-col ${className}`}>
      {/* Toast Notification */}
      {addedToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-red-100 text-[#CF0A2C] rounded-lg border border-red-200">
            <Camera className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                isFemale ? 'bg-pink-100 text-pink-800 border border-pink-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {isFemale ? '♀ Maniquí Mujer' : '♂ Maniquí Hombre'}
              </span>
              <span className="text-[10px] font-bold text-stone-500">
                {look.driver} • {look.colorInfo.spanishName || look.colorInfo.name} ({look.colorCode})
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-stone-950 truncate max-w-md">
              {look.title}
            </h3>
          </div>
        </div>

        {/* Header Right: Layer toggle badge & Close button */}
        <div className="flex items-center gap-2 ml-auto">
          {photoAsset.hasLayerOption && (
            <div className="flex items-center bg-stone-200/80 p-1 rounded-xl border border-stone-300 gap-1">
              <button
                onClick={() => handleSetShowLayer(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showLayer 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'text-stone-700 hover:text-stone-950'
                }`}
                title="Ver maniquí con campera / abrigo puesto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Con Abrigo</span>
              </button>
              <button
                onClick={() => handleSetShowLayer(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !showLayer 
                    ? 'bg-[#CF0A2C] text-white shadow-xs' 
                    : 'text-stone-700 hover:text-stone-950'
                }`}
                title="Ver maniquí con solo la remera / top base"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Solo Remera</span>
              </button>
            </div>
          )}

          {/* Close button if provided */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-600 hover:text-stone-950 bg-stone-200/70 hover:bg-stone-300 rounded-lg transition-colors cursor-pointer text-xs font-bold px-3"
              title="Cerrar vista maniquí"
            >
              ✕ Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Main Body: Photographic Mannequin Display on the left, Garment Breakdown on the right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-50" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
        
        {/* LEFT: Photographic Mannequin Display */}
        <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-stone-100 p-3 sm:p-5 select-none min-h-[460px]">
          
          {/* Interactive Layer Switcher Float Banner (for layered looks) */}
          {photoAsset.hasLayerOption && (
            <div className="mb-3 z-20 flex items-center bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-md gap-2">
              <span className="text-[11px] font-bold text-stone-700">
                Prenda exterior:
              </span>
              <button
                onClick={() => handleSetShowLayer(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  showLayer
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>🧥 Con Campera / Abrigo</span>
              </button>
              <button
                onClick={() => handleSetShowLayer(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  !showLayer
                    ? 'bg-[#CF0A2C] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>👕 Solo Remera / Top Base</span>
              </button>
            </div>
          )}

          {/* Photo Frame Container with Actual Mannequin Photo */}
          <div className="relative w-full h-full max-w-md flex flex-col items-center justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xl h-[440px] w-full flex items-center justify-center bg-white">
              <img 
                src={photoAsset.image} 
                alt={look.title}
                className="w-full h-full object-contain object-center hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
              />
            </div>

            {/* Bottom Merchandising Caption */}
            <div className="mt-3 w-full bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-stone-200 shadow-sm text-center">
              <p className="text-[11px] font-medium text-stone-700">
                {photoAsset.themeDescription}
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT: Garment Breakdown Sidebar */}
        {showDetailsSidebar && (
          <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-stone-200 p-4 flex flex-col justify-between overflow-y-auto max-h-[620px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                  Prendas del Look ({totalMountedItems} prendas)
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {cartItems.length > 0 ? 'Pedido en curso' : 'Listo para armar'}
                </span>
              </div>

              {/* 1. Layer Card (if present) */}
              {look.layer && (
                <div 
                  onClick={() => setSelectedProduct(look.layer!)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group hover:border-purple-500 hover:scale-[1.01] ${
                    showLayer ? 'bg-purple-50/60 border-purple-200 shadow-2xs' : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-90'
                  }`}
                  title="Click para ver ficha del producto"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span>ABRIGO / LAYER</span>
                      <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-purple-600" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetShowLayer(!showLayer);
                      }}
                      className="text-[10px] text-purple-700 hover:underline cursor-pointer font-bold"
                    >
                      {showLayer ? 'Ocultar en foto' : 'Mostrar en foto'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 bg-stone-100 rounded-lg p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform border border-stone-200">
                      <img src={getProductImage(look.layer)} alt={look.layer.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate group-hover:text-purple-700 transition-colors">{look.layer.name}</p>
                      <p className="text-[10px] font-mono text-stone-500">{look.layer.sku} • {look.layer.sizeRange}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-purple-900">${(look.layer.price || 0).toLocaleString('es-AR')}</span>
                        <button
                          type="button"
                          onClick={(e) => handleAddProduct(look.layer!, e)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            layerCart.inCart ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>{layerCart.inCart ? `En Carrito (${layerCart.quantity})` : 'Sumar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Top Base Card */}
              <div 
                onClick={() => setSelectedProduct(look.top)}
                className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-red-500 hover:scale-[1.01] transition-all cursor-pointer group shadow-2xs"
                title="Click para ver ficha del producto"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>{look.layer ? (showLayer ? 'TOP BASE (Interior)' : 'TOP BASE (Visible en foto)') : 'TOP / PARTE SUPERIOR'}</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {topCart.inCart && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> {topCart.quantity} en pedido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform border border-stone-200">
                    <img src={getProductImage(look.top)} alt={look.top.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-[#CF0A2C] transition-colors">{look.top.name}</p>
                    <p className="text-[10px] font-mono text-stone-500">{look.top.sku} • {look.top.sizeRange}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-stone-950">${(look.top.price || 0).toLocaleString('es-AR')}</span>
                      <button
                        type="button"
                        onClick={(e) => handleAddProduct(look.top, e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          topCart.inCart ? 'bg-emerald-600 text-white' : 'bg-[#CF0A2C] hover:bg-red-700 text-white'
                        }`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{topCart.inCart ? `En Carrito (${topCart.quantity})` : 'Sumar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Bottom Card */}
              <div 
                onClick={() => setSelectedProduct(look.bottom)}
                className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-red-500 hover:scale-[1.01] transition-all cursor-pointer group shadow-2xs"
                title="Click para ver ficha del producto"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>BOTTOM / PANTALÓN O SHORT</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {bottomCart.inCart && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> {bottomCart.quantity} en pedido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform border border-stone-200">
                    <img src={getProductImage(look.bottom)} alt={look.bottom.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-[#CF0A2C] transition-colors">{look.bottom.name}</p>
                    <p className="text-[10px] font-mono text-stone-500">{look.bottom.sku} • {look.bottom.sizeRange}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-stone-950">${(look.bottom.price || 0).toLocaleString('es-AR')}</span>
                      <button
                        type="button"
                        onClick={(e) => handleAddProduct(look.bottom, e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          bottomCart.inCart ? 'bg-emerald-600 text-white' : 'bg-[#CF0A2C] hover:bg-red-700 text-white'
                        }`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{bottomCart.inCart ? `En Carrito (${bottomCart.quantity})` : 'Sumar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Shoes Card */}
              <div 
                onClick={() => setSelectedProduct(look.footwear)}
                className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-red-500 hover:scale-[1.01] transition-all cursor-pointer group shadow-2xs"
                title="Click para ver ficha del producto"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>CALZADO NEW BALANCE</span>
                    <Eye className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-[#CF0A2C]" />
                  </span>
                  {shoesCart.inCart && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> {shoesCart.quantity} en pedido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform border border-stone-200">
                    <img src={getProductImage(look.footwear)} alt={look.footwear.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-[#CF0A2C] transition-colors">{look.footwear.name}</p>
                    <p className="text-[10px] font-mono text-stone-500">{look.footwear.sku} • {look.footwear.sizeRange}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-stone-950">
                        {look.footwear.price && look.footwear.price > 0 ? `$${look.footwear.price.toLocaleString('es-AR')}` : 'A consultar'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleAddProduct(look.footwear, e)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          shoesCart.inCart ? 'bg-emerald-600 text-white' : 'bg-[#CF0A2C] hover:bg-red-700 text-white'
                        }`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{shoesCart.inCart ? `En Carrito (${shoesCart.quantity})` : 'Sumar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Total & Full Look CTA */}
            <div className="mt-4 pt-3 border-t border-stone-200 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Look ({totalMountedItems} prendas):
                </span>
                <span className="text-base font-black text-stone-950">
                  ${currentTotalPublicPrice.toLocaleString('es-AR')}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddAllItems}
                className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-[#CF0A2C] hover:bg-red-700 text-white shadow-lg cursor-pointer hover:scale-[1.01] active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Agregar Look Completo ({totalMountedItems} prendas) al Pedido</span>
              </button>
            </div>
          </div>
        )}

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
