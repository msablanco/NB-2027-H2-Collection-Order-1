import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Search, 
  SlidersHorizontal, 
  ChevronRight, 
  Layers, 
  Filter, 
  ArrowRight,
  Eye,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Tag,
  Palette,
  ExternalLink,
  Info,
  RotateCcw,
  Store,
  Shirt,
  ChevronLeft,
  Maximize2,
  Camera
} from 'lucide-react';
import { Product, AppView } from '../types';
import { useCart } from '../context/CartContext';
import { getProxiedUrl } from './mediaHelper';
import { 
  buildAllPresetLooks, 
  PresetLook, 
  DRIVER_METADATA, 
  COLOR_MAP,
  getColorDisplayName,
  getColorFormattedLabel 
} from './lookPresetsHelper';
import { RealisticLookMannequinMount } from './RealisticLookMannequinMount';
import { getSingleMannequinImageForLook } from './mannequinSimulationHelper';
import { ProductDetailModal } from './ProductDetailModal';

interface PresetLooksCuratorProps {
  products: Product[];
  setView: (view: AppView) => void;
  onOpenQuickView?: (product: Product) => void;
}

export const PresetLooksCurator: React.FC<PresetLooksCuratorProps> = ({ 
  products, 
  setView,
  onOpenQuickView,
}) => {
  const { cartItems, addToCart } = useCart();

  // All preset looks built from the catalog with exact color matching
  const allLooks = useMemo(() => {
    return buildAllPresetLooks(products);
  }, [products]);

  // Product Detail Quick View modal state
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  const handleOpenProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenQuickView) {
      onOpenQuickView(product);
    } else {
      setSelectedDetailProduct(product);
    }
  };

  // Filters state
  const [selectedDriver, setSelectedDriver] = useState<string>('TODOS');
  const [selectedColorCode, setSelectedColorCode] = useState<string>('TODOS');
  const [selectedGender, setSelectedGender] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedFormat, setSelectedFormat] = useState<'TODOS' | 'LAYERING' | 'STANDARD'>('TODOS');
  const [selectedOrigin, setSelectedOrigin] = useState<'TODOS' | 'CAMPANA' | 'SUGERIDOS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Realistic Collection Photo & Layer Toggling State
  const [selectedMannequinLook, setSelectedMannequinLook] = useState<PresetLook | null>(null);
  // Layer switcher per card: true = con campera (default), false = solo remera
  const [cardLayerState, setCardLayerState] = useState<Record<string, boolean>>({});

  const isBoneLook = (look: PresetLook) => {
    const code = (look.colorCode || '').toUpperCase();
    const name = (look.colorInfo?.name || '').toLowerCase();
    const spanish = (look.colorInfo?.spanishName || '').toLowerCase();
    return code === 'BG0' || code === 'WM' || code === 'LIN' || code === 'LMR' || 
           name.includes('hueso') || name.includes('bone') || name.includes('crema') || name.includes('oyster') ||
           spanish.includes('hueso') || spanish.includes('crema');
  };

  const isBlueLook = (look: PresetLook) => {
    const code = (look.colorCode || '').toUpperCase();
    const name = (look.colorInfo?.name || '').toLowerCase();
    const spanish = (look.colorInfo?.spanishName || '').toLowerCase();
    return ['CB6', 'TNV', 'BB0', 'AAX', 'DNT', 'TN2', 'DIN', 'GLE', 'DGD'].includes(code) ||
           name.includes('azul') || name.includes('blue') || name.includes('navy') || name.includes('cobalto') ||
           spanish.includes('azul') || spanish.includes('marino') || spanish.includes('cobalto');
  };

  // Quick quantities for adding individual items or looks
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(curr => curr === msg ? null : curr);
    }, 3200);
  };

  // Drivers list with counts
  const driverCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLooks.forEach(look => {
      counts[look.driver] = (counts[look.driver] || 0) + 1;
    });
    return counts;
  }, [allLooks]);

  // Database Disciplines (categories from INDUMENTARIA products + looks) with counts
  const { availableDisciplines, disciplineCounts } = useMemo(() => {
    const dbIndCategories = products
      .filter(p => (p.division || '').toUpperCase().trim() === 'INDUMENTARIA')
      .map(p => (p.category || '').toUpperCase().trim())
      .filter(Boolean);

    const lookCats = allLooks.flatMap(l => l.categories || [l.category]).map(c => (c || '').toUpperCase().trim()).filter(Boolean);
    const uniqueCats = Array.from(new Set([...dbIndCategories, ...lookCats]));

    const categoryPriority: Record<string, number> = {
      'LIFESTYLE': 1,
      'RUNNING': 2,
      'PERFORMANCE': 3,
      'BODYWEAR': 4,
      'TRAINING': 5,
      'FIELD': 6,
      'NUMERIC': 7,
      'TENNIS': 8,
      'KIDS': 9,
    };

    uniqueCats.sort((a, b) => (categoryPriority[a] || 999) - (categoryPriority[b] || 999));

    const counts: Record<string, number> = {};
    uniqueCats.forEach(cat => {
      counts[cat] = allLooks.filter(look =>
        look.category.toUpperCase().trim() === cat ||
        (look.categories && look.categories.some(c => c.toUpperCase().trim() === cat))
      ).length;
    });

    return { availableDisciplines: uniqueCats, disciplineCounts: counts };
  }, [products, allLooks]);

  // Color codes list with counts
  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allLooks.forEach(look => {
      counts[look.colorCode] = (counts[look.colorCode] || 0) + 1;
    });
    return counts;
  }, [allLooks]);

  // Top color codes sorted by popularity
  const topColors = useMemo(() => {
    return Object.entries(colorCounts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([code]) => code);
  }, [colorCounts]);

  // Format & Campaign counts
  const formatCounts = useMemo(() => {
    let layering = 0;
    let standard = 0;
    let campaign = 0;
    let suggested = 0;
    allLooks.forEach(look => {
      if (look.isLayered) layering++;
      else standard++;
      if (look.isCampaignLook) campaign++;
      else suggested++;
    });
    return { layering, standard, campaign, suggested, total: allLooks.length };
  }, [allLooks]);

  // Filtered looks
  const filteredLooks = useMemo(() => {
    return allLooks.filter(look => {
      // Campaign vs Suggested filter
      if (selectedOrigin === 'CAMPANA' && !look.isCampaignLook) {
        return false;
      }
      if (selectedOrigin === 'SUGERIDOS' && look.isCampaignLook) {
        return false;
      }
      // Format filter (Layering 2-pieces on top vs Standard)
      if (selectedFormat === 'LAYERING' && !look.isLayered) {
        return false;
      }
      if (selectedFormat === 'STANDARD' && look.isLayered) {
        return false;
      }
      // Driver filter
      if (selectedDriver !== 'TODOS' && look.driver !== selectedDriver) {
        return false;
      }
      // Color Code / Family filter
      if (selectedColorCode !== 'TODOS') {
        if (selectedColorCode.startsWith('FAMILY_')) {
          const fam = selectedColorCode.replace('FAMILY_', '');
          if (fam === 'navy') {
            if (look.colorInfo.family !== 'navy' && look.colorInfo.family !== 'blue') return false;
          } else if (look.colorInfo.family !== fam) {
            return false;
          }
        } else {
          if (look.colorCode !== selectedColorCode) return false;
        }
      }
      // Gender filter
      if (selectedGender !== 'TODOS' && look.gender.toUpperCase() !== selectedGender.toUpperCase()) {
        return false;
      }
      // Category / Discipline filter (matches primary category or any garment category from DB)
      if (selectedCategory !== 'TODOS') {
        const targetCat = selectedCategory.toUpperCase().trim();
        const matchesCat =
          look.category.toUpperCase().trim() === targetCat ||
          (look.categories && look.categories.some(c => c.toUpperCase().trim() === targetCat));
        if (!matchesCat) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = look.title.toLowerCase().includes(query);
        const matchesDriver = look.driver.toLowerCase().includes(query);
        const matchesColor = look.colorCode.toLowerCase().includes(query) || look.colorInfo.name.toLowerCase().includes(query);
        const matchesTop = look.top.name.toLowerCase().includes(query) || look.top.sku.toLowerCase().includes(query);
        const matchesLayer = look.layer ? (look.layer.name.toLowerCase().includes(query) || look.layer.sku.toLowerCase().includes(query)) : false;
        const matchesBottom = look.bottom.name.toLowerCase().includes(query) || look.bottom.sku.toLowerCase().includes(query);
        const matchesShoes = look.footwear.name.toLowerCase().includes(query) || look.footwear.sku.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDriver && !matchesColor && !matchesTop && !matchesLayer && !matchesBottom && !matchesShoes) {
          return false;
        }
      }
      return true;
    });
  }, [allLooks, selectedDriver, selectedColorCode, selectedGender, selectedCategory, selectedFormat, selectedOrigin, searchQuery]);

  const currentMannequinIndex = useMemo(() => {
    if (!selectedMannequinLook) return -1;
    return filteredLooks.findIndex(l => l.id === selectedMannequinLook.id);
  }, [selectedMannequinLook, filteredLooks]);

  const handlePrevMannequinLook = () => {
    if (filteredLooks.length === 0) return;
    if (currentMannequinIndex <= 0) {
      setSelectedMannequinLook(filteredLooks[filteredLooks.length - 1]);
    } else {
      setSelectedMannequinLook(filteredLooks[currentMannequinIndex - 1]);
    }
  };

  const handleNextMannequinLook = () => {
    if (filteredLooks.length === 0) return;
    if (currentMannequinIndex >= filteredLooks.length - 1) {
      setSelectedMannequinLook(filteredLooks[0]);
    } else {
      setSelectedMannequinLook(filteredLooks[currentMannequinIndex + 1]);
    }
  };

  // Helper to check if a product is in cart and get quantity
  const getProductCartInfo = (product: Product) => {
    const item = cartItems.find(ci => ci.id === product.id || ci.sku === product.sku);
    return {
      inCart: !!item,
      quantity: item?.quantity || 0,
    };
  };

  // Add individual product to cart
  const handleAddProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const qty = itemQuantities[product.sku] || 1;
    addToCart(product, qty);
    showToast(`✓ Se agregó "${product.name}" al carrito (${qty} u.)`);
  };

  // Add entire look to cart (all pieces or 3 pieces if layer disabled)
  const handleAddFullLook = (look: PresetLook, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLayerOn = look.layer ? (cardLayerState[look.id] !== false) : false;
    
    // Add top
    addToCart(look.top, 1);
    // Add bottom
    addToCart(look.bottom, 1);
    // Add footwear
    addToCart(look.footwear, 1);
    // Add layer if present and active
    if (look.layer && isLayerOn) {
      addToCart(look.layer, 1);
    }

    const count = (look.layer && isLayerOn) ? 4 : 3;
    showToast(`🎉 ¡Look agregado! (${count} prendas del Driver ${look.driver} - ${look.colorInfo.spanishName || look.colorInfo.name} (${look.colorCode}))`);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedDriver('TODOS');
    setSelectedColorCode('TODOS');
    setSelectedGender('TODOS');
    setSelectedCategory('TODOS');
    setSelectedFormat('TODOS');
    setSelectedOrigin('TODOS');
    setSearchQuery('');
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900/95 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-red-500/40 animate-fade-in backdrop-blur-md">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{notification}</p>
            <p className="text-xs text-gray-400">Podés revisar tu pedido en cualquier momento en el Carrito.</p>
          </div>
          <button 
            onClick={() => setView(AppView.CART)}
            className="ml-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            Ver Carrito <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Control Panel: Filters, Drivers & Colors */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
        {/* Look Priority & Campaign Filter (Marketing Looks) */}
        <div className="pb-3 border-b border-gray-150 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-red-50/70 p-1 rounded-xl border border-red-200/80">
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#CF0A2C] text-white shadow-xs flex items-center gap-1.5">
              <span>🔥 Looks de Campaña Marketing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-white/25 text-white">
                {allLooks.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setSelectedFormat('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFormat === 'TODOS'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos los Formatos
            </button>
            <button
              onClick={() => setSelectedFormat('LAYERING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFormat === 'LAYERING'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span>✨ 2 Arriba (Con Abrigo)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedFormat === 'LAYERING' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                {formatCounts.layering}
              </span>
            </button>
            <button
              onClick={() => setSelectedFormat('STANDARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFormat === 'STANDARD'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Clásicos 3 Piezas ({formatCounts.standard})
            </button>
          </div>
        </div>

        {/* Driver Selector Pills */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-red-600" />
              Filtrar por Driver New Balance:
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Mostrando {filteredLooks.length} de {allLooks.length} looks
            </span>
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDriver('TODOS')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedDriver === 'TODOS'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>Todos los Drivers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDriver === 'TODOS' ? 'bg-white/20' : 'bg-gray-200'}`}>
                {allLooks.length}
              </span>
            </button>
            {Object.entries(driverCounts).map(([driver, count]) => {
              const meta = DRIVER_METADATA[driver];
              const isSelected = selectedDriver === driver;
              return (
                <button
                  key={driver}
                  onClick={() => setSelectedDriver(driver)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span>{meta?.name || driver}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Code Selector Swatches with Friendly Color Name + Code */}
        <div className="pt-3 border-t border-gray-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-600" />
                Filtrar por Color:
              </span>
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                (Nombre de color y código oficial NB)
              </span>
            </div>
            {selectedColorCode !== 'TODOS' && (
              <button 
                onClick={() => setSelectedColorCode('TODOS')} 
                className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>✕ Limpiar color ({getColorDisplayName(selectedColorCode)})</span>
              </button>
            )}
          </div>
           {/* Color Family Quick Filters */}
           <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2.5 border-b border-gray-150">
             <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Familias:</span>
             {[
               { id: 'FAMILY_navy', label: '💙 Azules & Navy', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
               { id: 'FAMILY_earth', label: '🤎 Hueso & Crema', bg: 'bg-amber-50 text-amber-900 border-amber-200' },
               { id: 'FAMILY_black', label: '🖤 Negros', bg: 'bg-stone-100 text-stone-900 border-stone-300' },
               { id: 'FAMILY_grey', label: '🩶 Grises', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
               { id: 'FAMILY_green', label: '💚 Verdes', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
             ].map(fam => {
               const isSelected = selectedColorCode === fam.id;
               return (
                 <button
                   key={fam.id}
                   onClick={() => setSelectedColorCode(fam.id)}
                   className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                     isSelected ? 'ring-2 ring-red-600 font-black ' + fam.bg : fam.bg + ' opacity-85 hover:opacity-100'
                   }`}
                 >
                   {fam.label}
                 </button>
               );
             })}
           </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedColorCode('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedColorCode === 'TODOS'
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Todos los Colores ({allLooks.length})
            </button>
            {topColors.map(code => {
              const info = COLOR_MAP[code];
              const isSelected = selectedColorCode === code;
              const count = colorCounts[code] || 0;
              const hex = info?.hex || '#374151';
              const colorName = info?.spanishName || info?.name || 'Color';
              return (
                <button
                  key={code}
                  onClick={() => setSelectedColorCode(code)}
                  title={`${colorName} (${code}) - ${count} looks disponibles`}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'ring-2 ring-red-600 ring-offset-1 bg-red-50 text-red-900 border-red-300 shadow-xs font-extrabold'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20 shadow-xs" 
                    style={{ backgroundColor: hex }}
                  />
                  <span>
                    {colorName} <span className="font-mono text-[11px] text-gray-500 font-semibold">({code})</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-red-200 text-red-900' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedColorCode !== 'TODOS' && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-fit">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_MAP[selectedColorCode]?.hex || '#333' }}></span>
              <span>Filtrando looks por color: <strong className="text-gray-900 font-black">{getColorFormattedLabel(selectedColorCode)}</strong></span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-gray-600">{filteredLooks.length} conjuntos encontrados</span>
            </div>
          )}
        </div>

        {/* Secondary Filters & Search Bar */}
        <div className="pt-3 border-t border-gray-150 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gender Filter */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
              {['TODOS', 'MASCULINO', 'FEMENINO', 'UNISEX'].map(gen => (
                <button
                  key={gen}
                  onClick={() => setSelectedGender(gen)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    selectedGender === gen
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {gen === 'TODOS' ? 'Todos Géneros' : gen === 'MASCULINO' ? 'Hombre' : gen === 'FEMENINO' ? 'Mujer' : 'Unisex'}
                </button>
              ))}
            </div>

            {/* Category / Discipline Filter from Database */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                Disciplina:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todas las Disciplinas ({allLooks.length})</option>
                {availableDisciplines.map(cat => (
                  <option key={cat} value={cat}>
                    {cat} ({disciplineCounts[cat] || 0})
                  </option>
                ))}
              </select>
            </div>

            {(selectedDriver !== 'TODOS' || selectedColorCode !== 'TODOS' || selectedGender !== 'TODOS' || selectedCategory !== 'TODOS' || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reiniciar filtros
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar SKU, buzo, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 placeholder-gray-400"
              />
            </div>

          </div>
        </div>
      </div>

      {/* No results empty state */}
      {filteredLooks.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron looks con estos filtros</h3>
          <p className="text-sm text-gray-500 mb-6">
            Probá seleccionar "Todos los Drivers" o "Todos los Colores" para ver las combinaciones disponibles.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Ver todos los {allLooks.length} Looks
          </button>
        </div>
      )}

      {/* Main Looks Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredLooks.map((look) => {
            const driverMeta = DRIVER_METADATA[look.driver] || {
              name: look.driver,
              badge: 'COLLECTION',
              badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
              themeColor: '#CF0A2C'
            };

            const topCart = getProductCartInfo(look.top);
            const bottomCart = getProductCartInfo(look.bottom);
            const shoesCart = getProductCartInfo(look.footwear);
            const layerCart = look.layer ? getProductCartInfo(look.layer) : { inCart: false, quantity: 0 };

            const isLayerActive = look.layer ? (cardLayerState[look.id] !== false) : false;
            const currentTotalItemsCount = (look.layer && isLayerActive) ? 4 : 3;
            const currentTotalPublicPrice = (look.layer && !isLayerActive)
              ? Math.max(0, look.totalPublicPrice - (look.layer.price || 0))
              : look.totalPublicPrice;

            const itemsInCartCount = (topCart.inCart ? 1 : 0) + (bottomCart.inCart ? 1 : 0) + (shoesCart.inCart ? 1 : 0) + ((look.layer && isLayerActive && layerCart.inCart) ? 1 : 0);
            const isFullyInCart = itemsInCartCount === currentTotalItemsCount;

            const activePhoto = (look.layer && !isLayerActive)
              ? (look.photoSoloRemera || getSingleMannequinImageForLook(look, false).image)
              : (look.photoWithLayer || getSingleMannequinImageForLook(look, true).image);

            return (
              <div 
                key={look.id}
                className="@container bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Look Card Header - Fixed height on desktop for exact horizontal alignment */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col justify-between gap-2.5 xl:h-[154px]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-h-[24px]">
                        {look.isCampaignLook && (
                          <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#CF0A2C] text-white shadow-xs">
                            🔥 {look.marketingBadge || `CAMPAÑA · ${look.campaignCode}`}
                          </span>
                        )}
                        <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-red-50 text-[#CF0A2C] border border-red-200">
                          {look.category}
                        </span>
                        <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${driverMeta.badgeBg}`}>
                          {look.driver}
                        </span>
                        {look.isLayered && (
                          <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                            {isLayerActive ? '✨ 2 Arriba (Con Abrigo)' : '👕 Solo Remera'}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          look.gender === 'FEMENINO' 
                            ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {look.gender === 'FEMENINO' ? '♀ Maniquí Mujer' : '♂ Maniquí Hombre'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-gray-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-1" title={look.title}>
                        {look.title}
                      </h3>
                    </div>

                    {/* Actions & Color Swatch Badge */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white rounded-md border border-gray-200 shadow-2xs">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs shrink-0" 
                          style={{ backgroundColor: look.colorInfo.hex }} 
                        />
                        <span className="text-xs font-black text-gray-900">
                          {look.colorInfo.spanishName || look.colorInfo.name}
                        </span>
                        <span className="font-mono text-gray-500 font-semibold text-[11px]">
                          ({look.colorCode})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descripción con altura fija uniforme para alinear la línea divisoria inferior */}
                  <div className="h-[52px] flex items-center bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/70">
                    <p className="text-xs text-gray-600 leading-snug line-clamp-2" title={look.description}>
                      {look.description}
                    </p>
                  </div>
                </div>

                {/* 1. Foto de Colección Oficial en Maniquí - Altura fija idéntica en todas las tarjetas */}
                <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-100/80 border-b border-gray-200 flex flex-col items-center justify-between p-4 select-none overflow-hidden h-[488px]">
                  {/* Barra Superior de Control (h-10 fija en todos los looks para alinear el recuadro del maniquí) */}
                  <div className="h-10 w-full flex items-center justify-center shrink-0 z-20">
                    {look.layer ? (
                      <div className="flex items-center bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs gap-2">
                        <span className="text-[11px] font-bold text-gray-600">
                          Prenda exterior:
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardLayerState(prev => ({ ...prev, [look.id]: true }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isLayerActive
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span>🧥 Con Campera / Abrigo</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardLayerState(prev => ({ ...prev, [look.id]: false }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            !isLayerActive
                              ? 'bg-[#CF0A2C] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span>👕 Solo Remera / Top</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs gap-2">
                        <span className="text-[11px] font-bold text-gray-600">
                          Configuración:
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-900 text-white shadow-xs flex items-center gap-1">
                          <span>👕 Look Oficial 3 Piezas (Sin Abrigo)</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Photographic Mannequin Display (Recuadro h-[416px] alineado al píxel) */}
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center h-[416px] shrink-0 shadow-2xs">
                    <img 
                      key={activePhoto}
                      src={activePhoto} 
                      alt={look.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transition-opacity duration-300 animate-in fade-in"
                      loading="lazy"
                    />
                    
                    {/* Gender Badge Overlay */}
                    <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-800 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{look.gender === 'FEMENINO' ? '♀ Maniquí Mujer' : '♂ Maniquí Hombre'}</span>
                      {look.layer && (
                        <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold border border-gray-200">
                          {isLayerActive ? 'Con Abrigo' : 'Solo Remera'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Desglose de Prendas del Look (Foto Producto -> Maniquí) - Alturas fijas para alineación perfecta */}
                <div className="p-3 sm:p-4 bg-gray-50/70 border-b border-gray-200 flex-1 flex flex-col justify-between">
                  <div className="mb-2.5 h-6 flex items-center justify-between gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      Prendas Seleccionadas en el Maniquí ({currentTotalItemsCount} piezas)
                    </span>
                    {look.layer && !isLayerActive && (
                      <button
                        type="button"
                        onClick={() => setCardLayerState(prev => ({ ...prev, [look.id]: true }))}
                        className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"
                      >
                        <span>+ Volver a poner {look.layer.model || 'Abrigo'} en maniquí</span>
                      </button>
                    )}
                  </div>

                  <div className={`grid ${
                    (look.layer && isLayerActive)
                      ? 'grid-cols-2 @[620px]:grid-cols-4' 
                      : 'grid-cols-1 @[420px]:grid-cols-3'
                  } gap-2.5 sm:gap-3`}>
                    {/* 1. Abrigo (Layer Piece: Buzo / Campera / Hoodie) */}
                    {look.layer && isLayerActive && (
                      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-purple-200/90 shadow-2xs flex flex-col justify-between hover:border-purple-400 transition-colors relative group/item min-w-0">
                        <div className="h-6 flex items-center justify-between gap-1 mb-1 shrink-0">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-700 text-white px-1.5 py-0.5 rounded shadow-2xs truncate">
                            {/sin capucha/i.test(`${look.layer.name} ${look.layer.model || ''}`) ? 'SIN CAPUCHA' : /capucha|hoodie/i.test(`${look.layer.name} ${look.layer.model || ''}`) ? 'CON CAPUCHA' : 'ABRIGO / CAMPERA'}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {layerCart.inCart && (
                              <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs" title={`En el carrito (${layerCart.quantity} u.)`}>
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>{layerCart.quantity}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCardLayerState(prev => ({ ...prev, [look.id]: false }))}
                              className="text-[9px] font-bold text-gray-400 hover:text-red-600 cursor-pointer px-1 py-0.5 rounded hover:bg-gray-100"
                              title="Sacar abrigo del look"
                            >
                              ✕ Sacar
                            </button>
                          </div>
                        </div>

                        <div 
                          onClick={(e) => handleOpenProduct(look.layer!, e)}
                          className="h-36 sm:h-40 w-full relative flex items-center justify-center overflow-hidden my-1 bg-white rounded-lg cursor-pointer group-hover/item:border-purple-300 shrink-0"
                          title="Click para ver ficha completa del producto"
                        >
                          <img 
                            src={getProxiedUrl(look.layer.images[0])} 
                            alt={look.layer.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0 mt-1">
                          <div className="min-w-0">
                            <p 
                              onClick={(e) => handleOpenProduct(look.layer!, e)}
                              className="text-[11px] sm:text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-[2.4rem] overflow-hidden break-words cursor-pointer hover:text-purple-700 transition-colors" 
                              title={look.layer.name}
                            >
                              {look.layer.name}
                            </p>
                            <div className="h-6 flex items-center justify-between gap-1 pt-1 border-t border-gray-100/60 mt-1 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                              <span className="text-gray-600 font-semibold truncate">{look.layer.sku}</span>
                              {look.layer.curve && (
                                <span className="bg-gray-100 text-gray-600 px-1 rounded text-[8px] font-bold font-sans shrink-0">
                                  C.{look.layer.curve}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price & Action Button */}
                          <div className="mt-2 pt-2 border-t border-gray-150 flex flex-col gap-1.5">
                            <div className="h-3.5 flex items-baseline justify-between gap-1">
                              <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-gray-400 leading-none">
                                PVP Sugerido
                              </span>
                              {look.layer.sizeRange && (
                                <span className="text-[9px] text-gray-400 font-mono">
                                  {look.layer.sizeRange}
                                </span>
                              )}
                            </div>
                            <div className="h-5 flex items-center text-xs sm:text-[13px] md:text-sm font-black text-gray-900 tracking-tight leading-none">
                              ${(look.layer.price || 0).toLocaleString('es-AR')}
                            </div>
                            <button
                              onClick={(e) => handleAddProduct(look.layer!, e)}
                              className={`h-8 w-full mt-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                                layerCart.inCart 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                  : 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200'
                              }`}
                              title={layerCart.inCart ? `En carrito (${layerCart.quantity} u.). Clic para sumar otra.` : 'Agregar Abrigo al carrito'}
                            >
                              <Plus className="w-3 h-3 shrink-0" />
                              <span className="truncate">{layerCart.inCart ? `En Carrito (${layerCart.quantity})` : 'Agregar'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Top Base Piece (Remera / Top / Musculosa) */}
                    <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/90 shadow-2xs flex flex-col justify-between hover:border-red-300 transition-colors relative group/item min-w-0">
                      <div className="h-6 flex items-center justify-between gap-1 mb-1 shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded shadow-2xs truncate">
                          {look.layer ? 'REMERA BASE' : 'TOP / CHOMBA'}
                        </span>
                        {topCart.inCart && (
                          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs shrink-0" title={`En el carrito (${topCart.quantity} u.)`}>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{topCart.quantity}</span>
                          </span>
                        )}
                      </div>

                      <div 
                        onClick={(e) => handleOpenProduct(look.top, e)}
                        className="h-36 sm:h-40 w-full relative flex items-center justify-center overflow-hidden my-1 bg-white rounded-lg cursor-pointer group-hover/item:border-red-300 shrink-0"
                        title="Click para ver ficha completa del producto"
                      >
                        <img 
                          src={getProxiedUrl(look.top.images[0])} 
                          alt={look.top.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0 mt-1">
                        <div className="min-w-0">
                          <p 
                            onClick={(e) => handleOpenProduct(look.top, e)}
                            className="text-[11px] sm:text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-[2.4rem] overflow-hidden break-words cursor-pointer hover:text-[#CF0A2C] transition-colors" 
                            title={look.top.name}
                          >
                            {look.top.name}
                          </p>
                          <div className="h-6 flex items-center justify-between gap-1 pt-1 border-t border-gray-100/60 mt-1 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                            <span className="text-gray-600 font-semibold truncate">{look.top.sku}</span>
                            {look.top.curve && (
                              <span className="bg-gray-100 text-gray-600 px-1 rounded text-[8px] font-bold font-sans shrink-0">
                                C.{look.top.curve}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="mt-2 pt-2 border-t border-gray-150 flex flex-col gap-1.5">
                          <div className="h-3.5 flex items-baseline justify-between gap-1">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-gray-400 leading-none">
                              PVP Sugerido
                            </span>
                            {look.top.sizeRange && (
                              <span className="text-[9px] text-gray-400 font-mono">
                                {look.top.sizeRange}
                              </span>
                            )}
                          </div>
                          <div className="h-5 flex items-center text-xs sm:text-[13px] md:text-sm font-black text-gray-900 tracking-tight leading-none">
                            ${(look.top.price || 0).toLocaleString('es-AR')}
                          </div>
                          <button
                            onClick={(e) => handleAddProduct(look.top, e)}
                            className={`h-8 w-full mt-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                              topCart.inCart 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200'
                            }`}
                            title={topCart.inCart ? `En carrito (${topCart.quantity} u.). Clic para sumar otra.` : 'Agregar Top al carrito'}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            <span className="truncate">{topCart.inCart ? `En Carrito (${topCart.quantity})` : 'Agregar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Bottom Piece */}
                    <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/90 shadow-2xs flex flex-col justify-between hover:border-red-300 transition-colors relative group/item min-w-0">
                      <div className="h-6 flex items-center justify-between gap-1 mb-1 shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded shadow-2xs truncate">
                          PANTALÓN / SHORT
                        </span>
                        {bottomCart.inCart && (
                          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs shrink-0" title={`En el carrito (${bottomCart.quantity} u.)`}>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{bottomCart.quantity}</span>
                          </span>
                        )}
                      </div>

                      <div 
                        onClick={(e) => handleOpenProduct(look.bottom, e)}
                        className="h-36 sm:h-40 w-full relative flex items-center justify-center overflow-hidden my-1 bg-white rounded-lg cursor-pointer group-hover/item:border-red-300 shrink-0"
                        title="Click para ver ficha completa del producto"
                      >
                        <img 
                          src={getProxiedUrl(look.bottom.images[0])} 
                          alt={look.bottom.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0 mt-1">
                        <div className="min-w-0">
                          <p 
                            onClick={(e) => handleOpenProduct(look.bottom, e)}
                            className="text-[11px] sm:text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-[2.4rem] overflow-hidden break-words cursor-pointer hover:text-[#CF0A2C] transition-colors" 
                            title={look.bottom.name}
                          >
                            {look.bottom.name}
                          </p>
                          <div className="h-6 flex items-center justify-between gap-1 pt-1 border-t border-gray-100/60 mt-1 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                            <span className="text-gray-600 font-semibold truncate">{look.bottom.sku}</span>
                            {look.bottom.curve && (
                              <span className="bg-gray-100 text-gray-600 px-1 rounded text-[8px] font-bold font-sans shrink-0">
                                C.{look.bottom.curve}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="mt-2 pt-2 border-t border-gray-150 flex flex-col gap-1.5">
                          <div className="h-3.5 flex items-baseline justify-between gap-1">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-gray-400 leading-none">
                              PVP Sugerido
                            </span>
                            {look.bottom.sizeRange && (
                              <span className="text-[9px] text-gray-400 font-mono">
                                {look.bottom.sizeRange}
                              </span>
                            )}
                          </div>
                          <div className="h-5 flex items-center text-xs sm:text-[13px] md:text-sm font-black text-gray-900 tracking-tight leading-none">
                            ${(look.bottom.price || 0).toLocaleString('es-AR')}
                          </div>
                          <button
                            onClick={(e) => handleAddProduct(look.bottom, e)}
                            className={`h-8 w-full mt-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                              bottomCart.inCart 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200'
                            }`}
                            title={bottomCart.inCart ? `En carrito (${bottomCart.quantity} u.). Clic para sumar otra.` : 'Agregar Bottom al carrito'}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            <span className="truncate">{bottomCart.inCart ? `En Carrito (${bottomCart.quantity})` : 'Agregar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Footwear Piece */}
                    <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/90 shadow-2xs flex flex-col justify-between hover:border-red-300 transition-colors relative group/item min-w-0">
                      <div className="h-6 flex items-center justify-between gap-1 mb-1 shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded shadow-2xs truncate">
                          ZAPATILLAS
                        </span>
                        {shoesCart.inCart && (
                          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs shrink-0" title={`En el carrito (${shoesCart.quantity} u.)`}>
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{shoesCart.quantity}</span>
                          </span>
                        )}
                      </div>

                      <div 
                        onClick={(e) => handleOpenProduct(look.footwear, e)}
                        className="h-36 sm:h-40 w-full relative flex items-center justify-center overflow-hidden my-1 bg-white rounded-lg cursor-pointer group-hover/item:border-red-300 shrink-0"
                        title="Click para ver ficha completa del producto"
                      >
                        <img 
                          src={getProxiedUrl(look.footwear.images[0])} 
                          alt={look.footwear.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain group-hover/item:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0 mt-1">
                        <div className="min-w-0">
                          <p 
                            onClick={(e) => handleOpenProduct(look.footwear, e)}
                            className="text-[11px] sm:text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-[2.4rem] overflow-hidden break-words cursor-pointer hover:text-[#CF0A2C] transition-colors" 
                            title={look.footwear.name}
                          >
                            {look.footwear.name}
                          </p>
                          <div className="h-6 flex items-center justify-between gap-1 pt-1 border-t border-gray-100/60 mt-1 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                            <span className="text-gray-600 font-semibold truncate">{look.footwear.sku}</span>
                            {look.footwear.category && (
                              <span className="bg-gray-100 text-gray-600 px-1 rounded text-[8px] font-bold font-sans truncate max-w-[70px] shrink-0">
                                {look.footwear.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div className="mt-2 pt-2 border-t border-gray-150 flex flex-col gap-1.5">
                          <div className="h-3.5 flex items-baseline justify-between gap-1">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-gray-400 leading-none">
                              PVP Sugerido
                            </span>
                            {look.footwear.sizeRange && (
                              <span className="text-[9px] text-gray-400 font-mono">
                                {look.footwear.sizeRange}
                              </span>
                            )}
                          </div>
                          <div className="h-5 flex items-center text-xs sm:text-[13px] md:text-sm font-black text-gray-900 tracking-tight leading-none">
                            {look.footwear.price && look.footwear.price > 0 ? (
                              `$${look.footwear.price.toLocaleString('es-AR')}`
                            ) : (
                              <span className="text-[11px] font-bold text-slate-500">A sugerir</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleAddProduct(look.footwear, e)}
                            className={`h-8 w-full mt-1 py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${
                              shoesCart.inCart 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                                : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200'
                            }`}
                            title={shoesCart.inCart ? `En carrito (${shoesCart.quantity} u.). Clic para sumar otra.` : 'Agregar Calzado al carrito'}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            <span className="truncate">{shoesCart.inCart ? `En Carrito (${shoesCart.quantity})` : 'Agregar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Look Actions & Total Public Price Bar */}
                <div className="p-4 bg-white flex flex-col space-y-3 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">
                        Total Look ({currentTotalItemsCount} prendas) • Precio Público
                      </span>
                      <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                        ${currentTotalPublicPrice.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                        Estado en Pedido
                      </span>
                      {itemsInCartCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-green-600 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {itemsInCartCount} de {currentTotalItemsCount} en Carrito
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          No añadido aún
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons: Agregar Look Completo */}
                  <div className="pt-3 border-t border-gray-150">
                    <button
                      type="button"
                      onClick={(e) => handleAddFullLook(look, e)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:scale-[1.01] active:scale-98 ${
                        isFullyInCart
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-[#CF0A2C] hover:bg-red-700 text-white'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {isFullyInCart 
                          ? `Sumar otra unidad (${currentTotalItemsCount} prendas)` 
                          : `Agregar Look Completo (${currentTotalItemsCount} prendas)`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Full-Screen Realistic Mannequin Studio Modal */}
      {selectedMannequinLook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col my-auto">
            {/* Top Navigation Bar */}
            <div className="mb-2 flex items-center justify-between px-2 text-white text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMannequinLook}
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Look anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <span className="font-mono text-stone-300 bg-stone-900/80 px-2.5 py-1 rounded-md border border-stone-800 text-[11px]">
                  Look {currentMannequinIndex + 1} de {filteredLooks.length}
                </span>
                <button
                  onClick={handleNextMannequinLook}
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Siguiente look"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setSelectedMannequinLook(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg cursor-pointer font-bold text-xs transition-colors shadow-sm"
              >
                Cerrar ✕
              </button>
            </div>

            {/* Mannequin Component */}
            <RealisticLookMannequinMount
              look={selectedMannequinLook}
              height={580}
              showDetailsSidebar={true}
              initialShowLayer={cardLayerState[selectedMannequinLook.id] !== false}
              onToggleLayer={(show) => setCardLayerState(prev => ({ ...prev, [selectedMannequinLook.id]: show }))}
              onClose={() => setSelectedMannequinLook(null)}
            />
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedDetailProduct}
        isOpen={Boolean(selectedDetailProduct)}
        onClose={() => setSelectedDetailProduct(null)}
      />
    </div>
  );
};
