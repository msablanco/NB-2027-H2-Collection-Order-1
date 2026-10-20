import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, Grid, List, Palette, Layers } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';

interface SortAndFilterControlsProps {
  count: number;
  sortOption: string;
  setSortOption: (opt: string) => void;
  clearFilters: () => void;
  minPrice?: number | '';
  setMinPrice?: (val: number | '') => void;
  maxPrice?: number | '';
  setMaxPrice?: (val: number | '') => void;
  hideFavorites?: boolean;
  setHideFavorites?: (val: boolean) => void;
  viewMode?: 'grid' | 'compact';
  setViewMode?: (mode: 'grid' | 'compact') => void;
  segmentationFilter?: string[];
  setSegmentationFilter?: (filters: string[]) => void;
  availableSegmentations?: string[];
  catalogGrouping?: 'color' | 'model';
  setCatalogGrouping?: (group: 'color' | 'model') => void;
  showCampaignLooks?: boolean;
  setShowCampaignLooks?: (show: boolean) => void;
}

export const SortAndFilterControls: React.FC<SortAndFilterControlsProps> = ({
  count,
  sortOption,
  setSortOption,
  clearFilters,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  hideFavorites,
  setHideFavorites,
  viewMode,
  setViewMode,
  segmentationFilter = [],
  setSegmentationFilter,
  availableSegmentations = [],
  catalogGrouping = 'color',
  setCatalogGrouping,
  showCampaignLooks,
  setShowCampaignLooks,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col gap-2 pt-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-300 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Limpiar filtros</span>
          </button>

          {setCatalogGrouping && (
            <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setCatalogGrouping('color')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  catalogGrouping === 'color'
                    ? 'bg-[#CF0A2C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Mostrar ordenados por color (Orden Catálogo)"
              >
                <Palette className="w-3 h-3" />
                <span>Por Color</span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogGrouping('model')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  catalogGrouping === 'model'
                    ? 'bg-[#CF0A2C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Agrupar variantes del mismo modelo juntas"
              >
                <Layers className="w-3 h-3" />
                <span>Por Modelo</span>
              </button>
            </div>
          )}

          {setShowCampaignLooks && (
            <button
              type="button"
              onClick={() => setShowCampaignLooks(!showCampaignLooks)}
              className={`inline-flex items-center px-3 py-1 font-black rounded-lg border transition-all cursor-pointer ${
                showCampaignLooks 
                  ? 'bg-[#CF0A2C] text-white border-[#CF0A2C] shadow-sm' 
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>Look Campaña</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {setSegmentationFilter && availableSegmentations.length > 0 && (
            <div className="w-44">
              <MultiSelectDropdown
                label="Segmentación"
                options={availableSegmentations.map(s => ({ label: s, value: s }))}
                selectedValues={segmentationFilter}
                onChange={setSegmentationFilter}
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-2xs">
            <span className="text-[10px] font-black uppercase text-gray-500">Ordenar:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer pr-2"
            >
              <option value="default">Recomendados / Catálogo</option>
              <option value="launch-first">🚀 Solo Lanzamientos</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre (A-Z)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              showAdvanced || minPrice || maxPrice || hideFavorites
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Filtros de precio y favoritos"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Más filtros</span>
          </button>

          {setViewMode && (
            <div className="hidden sm:flex items-center bg-gray-200 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode !== 'compact' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                title="Vista Estándar"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'compact' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                title="Vista Compacta"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-4 pt-2 pb-1 border-t border-gray-100 text-xs">
          {setMinPrice && setMaxPrice && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600">Precio Púb:</span>
              <input
                type="number"
                placeholder="Mín $"
                value={minPrice ?? ''}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-xs outline-none focus:border-[#CF0A2C]"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Máx $"
                value={maxPrice ?? ''}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-xs outline-none focus:border-[#CF0A2C]"
              />
            </div>
          )}
          {setHideFavorites && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium text-gray-700">
              <input
                type="checkbox"
                checked={!!hideFavorites}
                onChange={(e) => setHideFavorites(e.target.checked)}
                className="rounded border-gray-300 text-[#CF0A2C] focus:ring-[#CF0A2C]"
              />
              <span>Ocultar favoritos ya seleccionados</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export default SortAndFilterControls;
