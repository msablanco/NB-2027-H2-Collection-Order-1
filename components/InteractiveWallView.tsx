import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { products } from '../data/products';
import { Product } from '../types';
import wallBgImage from '../src/assets/images/concrete_shelves_6x5_1779114492381.png';
import TransparentImage from './TransparentImage';
import { getProxiedUrl } from './mediaHelper';

// Define a type for a product instance that can be placed on the wall
type WallItem = Product & { uniqueInstanceId: string };

import { AppView } from '../types';

const InteractiveWallView: React.FC<{ 
  hidePeriodFilter?: boolean; 
  isFavoritesWall?: boolean;
  setView?: (view: AppView) => void;
}> = ({ hidePeriodFilter = false, isFavoritesWall = false, setView }) => {
  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const [wallGrid, setWallGrid] = useState<Array<Array<WallItem | null>>>(() => 
    Array(5).fill(null).map(() => Array(6).fill(null))
  );

  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<WallItem | null>(null);
  const wallRef = useRef<HTMLElement | null>(null);
  const [wallHeight, setWallHeight] = useState<number>(600);

  useEffect(() => {
    const updateSize = () => {
      if (wallRef.current) {
        const h = wallRef.current.offsetHeight;
        if (h > 0) setWallHeight(h);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    const observer = new ResizeObserver(updateSize);
    if (wallRef.current) observer.observe(wallRef.current);

    return () => {
      window.removeEventListener('resize', updateSize);
      observer.disconnect();
    };
  }, []);

  // Combine cart items or favorites based on wall type - EXCLUSIVELY CALZADO
  const combinedItems = useMemo(() => {
    const isCalzado = (item: any) => !item.division || item.division.toUpperCase() === 'CALZADO';
    if (isFavoritesWall) {
      return products
        .filter(p => favorites.includes(p.id) && isCalzado(p))
        .map(p => ({
          ...p,
          quantity: 0,
          price: p.price,
          sizeBreakdown: {},
          wholesalePrice: p.wholesalePrice
        })) as any;
    }
    return cartItems.filter(p => isCalzado(p));
  }, [cartItems, favorites, isFavoritesWall]);

  const availableGenders = useMemo(() => Array.from(new Set(combinedItems.map(item => item.gender))), [combinedItems]);
  const availableCategories = useMemo(() => Array.from(new Set(combinedItems.map(item => item.category))), [combinedItems]);
  const availablePeriods = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev => prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]);
  };
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev => prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]);
  };

  // 1. Create a flat list of all individual, placeable instances from the combined items
  const allInstances = useMemo(() => {
    const instances: WallItem[] = [];
    combinedItems.forEach((item, index) => {
      // Use index to ensure unique ID for every instance
      instances.push({ ...item, uniqueInstanceId: `${item.id}-${index}` });
    });
    return instances;
  }, [combinedItems]);

  // 2. Get the IDs of instances that are currently on the wall
  const placedInstanceIds = useMemo(() => {
    const ids = new Set<string>();
    wallGrid.flat().forEach(item => {
      if (item) {
        ids.add(item.uniqueInstanceId);
      }
    });
    return ids;
  }, [wallGrid]);

  // 3. Determine which instances are available to be dragged
  const availableItemsToDrag = useMemo(() => {
    return allInstances.filter(inst => !placedInstanceIds.has(inst.uniqueInstanceId));
  }, [allInstances, placedInstanceIds]);

  const sidebarItems = useMemo(() => {
    return availableItemsToDrag
            .filter(item => {
          const genderMatch = selectedGenders.length === 0 || selectedGenders.includes(item.gender);
          const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
          
          const periodMatch = hidePeriodFilter || selectedPeriods.length === 0 || 
            (item as any).deliveryPlan?.some((p: any) => selectedPeriods.includes(p.period)) ||
            (isFavoritesWall && (item as any).allowedPeriods?.some((p: any) => selectedPeriods.includes(p)));
          return genderMatch && categoryMatch && periodMatch;
      })
      .sort((a, b) => {
          if (selectedGenders.length === 0 && selectedCategories.length === 0 && selectedPeriods.length === 0) {
              return a.generalOrder - b.generalOrder;
          }
          return a.displayOrder - b.displayOrder;
      });
  }, [availableItemsToDrag, selectedGenders, selectedCategories, selectedPeriods]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, product: WallItem) => {
    e.stopPropagation(); // Stop propagation
    setSelectedMobileProduct(null); // Clear selection on drag
    e.dataTransfer.setData('instanceId', product.uniqueInstanceId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Auto-scroll logic when dragging near the top or bottom of the viewport
    const scrollThreshold = 150;
    const scrollSpeed = 15;
    
    if (e.clientY > window.innerHeight - scrollThreshold) {
      window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
    } else if (e.clientY < scrollThreshold) {
      window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
    }
  };

  const handleMobileProductClick = (product: WallItem) => {
    setSelectedMobileProduct(product);
  };

  const isRowBlocked = (rowIndex: number) => false; // No rows blocked in the new 7-row layout initially

  const handleMobileCellClick = (rowIndex: number, colIndex: number) => {
    if (isRowBlocked(rowIndex)) return;
    
    if (selectedMobileProduct && !wallGrid[rowIndex][colIndex]) {
        const newGrid = wallGrid.map(row => [...row]);
        newGrid[rowIndex][colIndex] = selectedMobileProduct;
        setWallGrid(newGrid);
        setSelectedMobileProduct(null);
    }
  };

  const handleDragStartFromWall = (e: React.DragEvent, rowIndex: number, colIndex: number) => {
    setSelectedMobileProduct(null); // Clear selection on drag
    const item = wallGrid[rowIndex][colIndex];
    if (item) {
      e.dataTransfer.setData('sourceRow', rowIndex.toString());
      e.dataTransfer.setData('sourceCol', colIndex.toString());
      e.dataTransfer.setData('instanceId', item.uniqueInstanceId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    if (isRowBlocked(rowIndex)) return;

    const instanceId = e.dataTransfer.getData('instanceId');
    const sourceRowStr = e.dataTransfer.getData('sourceRow');
    const sourceColStr = e.dataTransfer.getData('sourceCol');

    // Case 1: Moving/Swapping from within the wall
    if (sourceRowStr !== '' && sourceColStr !== '') {
      const sRow = parseInt(sourceRowStr);
      const sCol = parseInt(sourceColStr);
      
      const newGrid = wallGrid.map(row => [...row]);
      const sourceItem = newGrid[sRow][sCol];
      const targetItem = newGrid[rowIndex][colIndex];

      // Swap positions
      newGrid[rowIndex][colIndex] = sourceItem;
      newGrid[sRow][sCol] = targetItem;
      
      setWallGrid(newGrid);
      return;
    }

    // Case 2: Dragging new item from sidebar
    const itemToPlace = allInstances.find(inst => inst.uniqueInstanceId === instanceId);

    if (itemToPlace) {
      const newGrid = wallGrid.map(row => [...row]);
      newGrid[rowIndex][colIndex] = itemToPlace;
      setWallGrid(newGrid);
    }
  };

  const autoCompleteWall = () => {
    // Filter all available instances by selected filters first, then sort by category
    const filteredSortedInstances = allInstances
      .filter(item => {
          const genderMatch = selectedGenders.length === 0 || selectedGenders.includes(item.gender);
          const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
          return genderMatch && categoryMatch;
      })
      .sort((a, b) => (a.category || '').localeCompare(b.category || ''));

    const newGrid = Array(5).fill(null).map(() => Array(6).fill(null));
    let instanceIndex = 0;

    for (let r = 0; r < 5; r++) {
      if (isRowBlocked(r)) continue;
      for (let c = 0; c < 6; c++) {
        if (instanceIndex < filteredSortedInstances.length) {
          newGrid[r][c] = filteredSortedInstances[instanceIndex];
          instanceIndex++;
        }
      }
    }
    setWallGrid(newGrid);
  };

  const removeItemFromWall = (rowIndex: number, colIndex: number) => {
    const newGrid = wallGrid.map(row => [...row]);
    newGrid[rowIndex][colIndex] = null;
    setWallGrid(newGrid);
  };
    
  const clearWall = () => {
    setWallGrid(Array(5).fill(null).map(() => Array(6).fill(null)));
  };





  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 bg-white/95 backdrop-blur-sm -mx-6 px-6 pt-4 -mt-4">
        <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-800">Pared Interactiva</h1>
            <p className="text-gray-600">Arrastra productos de tu carrito para visualizar tu exhibición.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
            <button onClick={autoCompleteWall} className="bg-[#CF0A2C] text-white font-bold py-2 px-3.5 sm:px-4 rounded-lg hover:bg-[#B00824] transition-colors shadow-sm whitespace-nowrap text-xs sm:text-sm cursor-pointer">
                Autocompletar
            </button>
            <button onClick={clearWall} className="bg-red-500 text-white font-bold py-2 px-3.5 sm:px-4 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap text-xs sm:text-sm cursor-pointer">
                Limpiar Pared
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Cart Items Panel */}
        <aside className="w-full md:w-1/4 lg:w-1/5 bg-gray-50/90 backdrop-blur-sm p-4 rounded-xl border border-gray-200 h-[80vh] flex flex-col shadow-sm sticky top-6 self-start overflow-hidden">
          {/* Header & Filters (Fixed top area, never overlaps) */}
          <div className="shrink-0 mb-3 border-b border-gray-200 pb-3">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Tu Exhibición</h2>
            
            {(availableGenders.length > 0 || availableCategories.length > 0) && (
              <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por</h3>
                  {(selectedGenders.length > 0 || selectedCategories.length > 0 || selectedPeriods.length > 0) && (
                    <button 
                      onClick={() => { setSelectedGenders([]); setSelectedCategories([]); setSelectedPeriods([]); }}
                      className="text-[10px] text-[#CF0A2C] font-semibold hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                
                {availableGenders.length > 0 && (
                  <div className="mb-2.5">
                    <span className="block text-[11px] font-medium text-gray-500 mb-1">Género</span>
                    <div className="flex flex-wrap gap-1">
                      {availableGenders.map(gender => (
                        <button
                          key={gender}
                          onClick={() => toggleGender(gender)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors cursor-pointer ${
                            selectedGenders.includes(gender)
                              ? 'bg-[#CF0A2C] border-[#CF0A2C] text-white shadow-2xs'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableCategories.length > 0 && (
                  <div className="mb-2">
                    <span className="block text-[11px] font-medium text-gray-500 mb-1">Disciplina</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                      {availableCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors cursor-pointer ${
                            selectedCategories.includes(cat)
                              ? 'bg-[#CF0A2C] border-[#CF0A2C] text-white shadow-2xs'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!hidePeriodFilter && cartItems.length > 0 && !isFavoritesWall && (
                  <div>
                    <span className="block text-[11px] font-medium text-gray-500 mb-1">Período</span>
                    <div className="flex flex-wrap gap-1">
                      {availablePeriods.map(period => (
                        <button
                          key={period}
                          onClick={() => togglePeriod(period)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors cursor-pointer ${
                            selectedPeriods.includes(period)
                              ? 'bg-[#CF0A2C] border-[#CF0A2C] text-white shadow-2xs'
                              : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Draggable items list in separate scrollable container */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {sidebarItems.length > 0 ? sidebarItems.map((product) => {
              return (
              <div
                key={product.uniqueInstanceId}
                draggable
                onDragStart={(e) => handleDragStart(e, product)}
                onClick={() => handleMobileProductClick(product)}
                className={`p-2 border rounded-md bg-white cursor-grab active:cursor-grabbing flex items-center gap-3 relative transition-all shadow-2xs hover:shadow-xs ${selectedMobileProduct?.uniqueInstanceId === product.uniqueInstanceId ? 'ring-2 ring-[#CF0A2C]' : ''}`}
              >
                <TransparentImage src={product.images[0] ? getProxiedUrl(product.images[0]) : ""} alt={product.name} className="w-12 h-12 object-contain rounded shrink-0" referrerPolicy="no-referrer" threshold={238} />
                <div className="text-xs flex-grow min-w-0">
                    <p className="font-semibold truncate">{product.name}</p>
                    <p className="text-gray-500 text-[11px] truncate">{product.colorDescription}</p>
                </div>
              </div>
            )}) : (
                <p className="text-sm text-gray-500 text-center py-10">
                    {cartItems.length > 0 ? "Todos los productos han sido colocados." : "Agrega productos al carrito para empezar."}
                </p>
            )}
          </div>
        </aside>

        {/* Interactive Wall Grid */}
        <main 
            className="w-full md:w-3/4 lg:w-4/5 p-1 rounded-xl relative shadow-2xl border border-gray-200 aspect-[1408/768] flex flex-col overflow-hidden"
            style={{ 
                backgroundImage: `url(${wallBgImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                containerType: 'size'
            }}
        >
            {/* Subtle Overlay for contrast */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
            <div className="grid grid-cols-6 grid-rows-5 gap-x-4 h-full relative p-2 pt-[8cqh] pb-[5.33cqh]">
            {wallGrid.map((row, rowIndex) => {
                const blocked = isRowBlocked(rowIndex);
                
                // Matriz de Desplazamiento Proporcional (Row Offsets en % del contenedor mediante cqh)
                // Se escala automáticamente con el zoom y resolución sin desalinearse jamás
                const rowOffsets: Record<number, number> = {
                    0: 14.2,  // Fila 1: Asentada (+14.2% de la altura de la pared)
                    1: 6.7,   // Fila 2: Asentada (+6.7%)
                    2: 0,     // Fila 3: Centrada (0%)
                    3: -7.5,  // Fila 4: Asentada (-7.5%)
                    4: -14.2, // Fila 5: Asentada (-14.2%)
                };
                const visualOffset = `translateY(${rowOffsets[rowIndex] || 0}cqh)`;

                return row.map((item, colIndex) => (
                <div
                    key={`${rowIndex}-${colIndex}`}
                    draggable={!!item && !blocked}
                    onDragStart={(e) => handleDragStartFromWall(e, rowIndex, colIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onClick={() => handleMobileCellClick(rowIndex, colIndex)}
                    // Dropzone Wrapper (No Transform applied here!)
                    className={`w-full h-full flex flex-col items-center justify-end relative group transition-all duration-300 pb-2 ${item ? 'cursor-grab active:cursor-grabbing' : (!blocked ? 'hover:scale-105 active:scale-100' : '')} ${selectedMobileProduct && !blocked ? 'cursor-pointer' : ''}`}
                >
                    {/* Footprint Shadow - Move shadow visually with the item */}
                    {item && !blocked && (
                        <div 
                            className={`absolute bottom-2 w-[70%] h-[8px] bg-black/20 blur-[5px] rounded-full transition-all duration-500`}
                            style={{ transform: visualOffset }}
                        ></div>
                    )}

                    {item && !blocked ? (
                    <div 
                        className="w-full flex-1 relative flex flex-col items-center justify-center p-2"
                        // Apply transform ONLY to the visual representation of the product
                        style={{ transform: visualOffset }}
                    >
                        <TransparentImage 
                            src={item.images[0] ? getProxiedUrl(item.images[0]) : ""} 
                            alt={item.name} 
                            className="w-[70%] h-[70%] object-contain transform transition-transform duration-300 group-hover:scale-110 relative z-10" 
                            referrerPolicy="no-referrer" 
                            threshold={238}
                        />
                        {item.status && (
                          <div className={`absolute bottom-2 right-2 z-10 px-1 py-0.5 text-[8px] font-bold tracking-wider rounded shadow-sm border
                            ${item.status.toUpperCase() === 'NEW' ? 'bg-green-100 text-green-800 border-green-200' : 
                              item.status.toUpperCase() === 'C/O' ? 'bg-red-50 text-[#CF0A2C] border-red-200' : 
                              'bg-gray-100 text-gray-800 border-gray-200'}`}
                          >
                             {item.status.toUpperCase()}
                          </div>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); removeItemFromWall(rowIndex, colIndex); }}
                            className="absolute -top-4 -right-2 bg-white/90 backdrop-blur-md text-gray-800 rounded-full h-6 w-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-red-500 hover:text-white shadow-lg border border-gray-100"
                            aria-label="Quitar producto de la pared"
                        >
                            &times;
                        </button>
                    </div>
                    ) : (
                        <div className={`w-full h-full rounded-lg flex items-center justify-center transition-colors ${selectedMobileProduct && !blocked ? 'bg-[#CF0A2C]/5' : ''}`}>
                             {!blocked && <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-10"></div>}
                        </div>
                    )}
                </div>
                ));
            })}
            </div>
        </main>
      </div>
    </div>
  );
};

export default InteractiveWallView;