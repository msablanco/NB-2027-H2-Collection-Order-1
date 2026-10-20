import React, { useMemo } from 'react';
import { products } from '../data/products';

interface FilterCardProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterCardProps> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1 rounded-full font-medium text-xs transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-[#CF0A2C] text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 ring-1 ring-gray-200'}`}
    >
        {label}
    </button>
);


interface SurfaceFilterCardsProps {
    activeFilter: string | null;
    setFilter: (filter: string | null) => void;
    divisionFilter?: string | null;
}

const SurfaceFilterCards: React.FC<SurfaceFilterCardsProps> = ({ activeFilter, setFilter, divisionFilter = null }) => {
    
    // Extract unique categories (LINEA / Disciplina) from products matching the active division
    const filters = useMemo(() => {
        const divisionProducts = divisionFilter
            ? products.filter(p => (p.division || 'CALZADO').toUpperCase().trim() === divisionFilter.toUpperCase().trim())
            : products;

        const seen = new Set<string>();
        const uniqueCategories: string[] = [];
        for (const p of divisionProducts) {
            const cat = (p.category || '').trim();
            if (!cat) continue;
            const upper = cat.toUpperCase();
            if (!seen.has(upper)) {
                seen.add(upper);
                uniqueCategories.push(cat);
            }
        }

        return uniqueCategories.map(cat => ({ label: cat }));
    }, [divisionFilter]);

    React.useEffect(() => {
        if (activeFilter && !filters.some(f => f.label.toUpperCase().trim() === activeFilter.toUpperCase().trim())) {
            setFilter(null);
        }
    }, [divisionFilter, filters, activeFilter, setFilter]);

    const handleFilterClick = (label: string) => {
        if (activeFilter === label) {
            setFilter(null); // Deselect if clicked again
        } else {
            setFilter(label);
        }
    };

    return (
        <div className="mb-1 sm:mb-2">
            <div className="flex overflow-x-auto px-4 sm:px-0 py-1.5 sm:py-1 hide-scrollbar gap-2 sm:gap-3 items-center">
                <span className="text-sm font-bold text-gray-700 whitespace-nowrap sr-only sm:not-sr-only sm:mr-2">Disciplina:</span>
                {filters.map(filter => (
                    <FilterPill 
                        key={filter.label}
                        label={filter.label}
                        isActive={activeFilter === filter.label}
                        onClick={() => handleFilterClick(filter.label)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SurfaceFilterCards;
