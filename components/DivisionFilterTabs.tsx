import React from 'react';
import { Shirt, ShoppingBag } from 'lucide-react';

interface DivisionCounts {
  TOTAL: number;
  CALZADO: number;
  INDUMENTARIA: number;
  ACCESORIOS: number;
  [key: string]: number;
}

interface DivisionFilterTabsProps {
  activeDivision: string | null;
  setDivision: (division: string | null) => void;
  counts: DivisionCounts;
}

// Custom Sneaker SVG icon for New Balance Calzado
const SneakerIcon: React.FC<{ size?: number | string; className?: string; strokeWidth?: number | string }> = ({ 
  size = 17, 
  className = '',
  strokeWidth = 2
}) => (
  <svg 
    viewBox="1 5 21 16" 
    width={size} 
    height={size} 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`shrink-0 ${className}`}
  >
    <path d="M3.5 15.5l1.5-4 4.5-.5 3 2 4.5-.5 3.5 2.5v2.5a1 1 0 01-1 1H4.5a1 1 0 01-1-1v-2z" />
    <path d="M5 11.5l1-3.5 3-1 2 2.5" />
    <path d="M12 11l2-2" />
  </svg>
);

export const DivisionFilterTabs: React.FC<DivisionFilterTabsProps> = ({
  activeDivision,
  setDivision,
  counts
}) => {
  const tabs = [
    {
      id: 'CALZADO',
      label: 'Calzado',
      count: counts.CALZADO,
      icon: SneakerIcon,
      isAvailable: counts.CALZADO > 0
    },
    {
      id: 'INDUMENTARIA',
      label: 'Indumentaria',
      count: counts.INDUMENTARIA,
      icon: Shirt,
      isAvailable: counts.INDUMENTARIA > 0
    },
    {
      id: 'ACCESORIOS',
      label: 'Accesorios',
      count: counts.ACCESORIOS,
      icon: ShoppingBag,
      isAvailable: counts.ACCESORIOS > 0
    }
  ];

  const handleTabClick = (tabId: string) => {
    // Si ya está marcado, se destilda (vuelve a null)
    if (activeDivision === tabId) {
      setDivision(null);
    } else {
      setDivision(tabId);
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 pb-1.5 border-b border-gray-150/70 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeDivision === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.label}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap border shadow-2xs ${
              isActive
                ? 'bg-[#CF0A2C] text-white border-[#CF0A2C] shadow-xs scale-[1.02]'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <IconComponent size={17} className="w-[17px] h-[17px] shrink-0" strokeWidth={2} />
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DivisionFilterTabs;
