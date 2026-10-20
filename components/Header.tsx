
import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { AppView } from '../types';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { SearchIcon } from './icons/SearchIcon';
import { Heart, HelpCircle, Sparkles, BookOpen } from 'lucide-react';
import filaLogo from '../src/assets/images/NB.LOGO.Stacked.LoRes72dpi.186c.png';


interface HeaderProps {
  setView: (view: AppView) => void;
  setGenderFilter: (gender: string | null) => void;
  clearFilters: () => void;
  activeGenderFilter: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentView: AppView;
  onOpenHelp?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  setView, 
  setGenderFilter, 
  clearFilters, 
  activeGenderFilter, 
  searchQuery, 
  setSearchQuery,
  currentView,
  onOpenHelp
}) => {
  const { cartCount } = useCart();
  const { favorites } = useFavorites();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (observer) observer.disconnect();
    };
  }, [currentView]);

  const navLinkClasses = "text-gray-700 hover:text-[#CF0A2C] font-semibold transition-colors text-[13px] md:text-sm tracking-wide";
  const activeLinkClasses = "border-b-2 border-red-600 text-[#CF0A2C] font-bold";

  return (
    <header ref={headerRef} className="bg-white sticky top-0 z-50 border-b border-gray-200/80 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 py-1.5 sm:py-2">
        <div className="flex justify-between items-center mb-0.5">
          <div 
            className="flex items-center cursor-pointer"
            onClick={clearFilters}
          >
            <img src={filaLogo} alt="NB Logo" className="h-9 md:h-11 w-auto" referrerPolicy="no-referrer" />
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="relative flex items-center">
              {isSearchExpanded && (
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="absolute right-0 top-10 w-48 sm:w-64 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CF0A2C] animate-fade-in bg-white"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setIsSearchExpanded(false);
                  }}
                />
              )}
              <button 
                onClick={() => setIsSearchExpanded(!isSearchExpanded)} 
                className={`relative text-gray-700 hover:text-[#CF0A2C] transition-colors p-2 ${isSearchExpanded && !searchQuery ? 'bg-red-50 rounded-full' : ''}`} 
                aria-label="Buscar"
              >
                <SearchIcon />
              </button>
            </div>
            <button onClick={() => setView(AppView.FAVORITES)} className="relative text-gray-700 hover:text-red-500 transition-colors p-2" aria-label="Ver favoritos">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-[1.25rem] h-5 px-1 items-center justify-center text-[10px] font-bold leading-none text-white bg-red-600 rounded-full shadow-sm">
                  {favorites.length}
                </span>
              )}
            </button>
            <button onClick={() => setView(AppView.ORDERS)} className="relative text-gray-700 hover:text-[#CF0A2C] transition-colors p-2" title="Buscar Pedidos / Historial">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </button>
            <button onClick={() => setView(AppView.CART)} className="relative text-gray-700 hover:text-[#CF0A2C] transition-colors p-2" aria-label="Ver carrito de compras">
              <ShoppingCartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-[1.25rem] h-5 px-1 items-center justify-center text-[10px] font-bold leading-none text-white bg-red-600 rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown on Mobile */}
        {isSearchExpanded && (
          <div className="pt-2 pb-1 sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por modelo, SKU, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CF0A2C] bg-white shadow-sm"
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-gray-150/50 pt-1.5 mt-1 min-h-[38px]">
          {currentView === AppView.PRODUCTS ? (
            <nav className="flex items-center w-full justify-between gap-2 overflow-hidden">
              {/* Gender Filter Pills with smooth touch scroll */}
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar py-0.5 max-w-full">
                {['MASCULINO', 'FEMENINO', 'UNISEX', 'INFANTIL', 'BABY'].map(gender => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setGenderFilter(activeGenderFilter === gender ? null : gender)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeGenderFilter === gender 
                        ? 'bg-[#CF0A2C] text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Desktop links */}
              <div className="hidden md:flex space-x-3 items-center ml-auto flex-shrink-0">
                <a href="#" onClick={(e) => { e.preventDefault(); setView(AppView.INTERACTIVE_WALL); }} className={`${navLinkClasses} ${currentView === AppView.INTERACTIVE_WALL ? activeLinkClasses : ''}`}>Pared Calzado</a>
                <span className="text-gray-300">|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); setView(AppView.APPAREL_EXHIBITION); }} className={`${navLinkClasses} ${currentView === AppView.APPAREL_EXHIBITION ? activeLinkClasses : ''} flex items-center gap-1.5`}>
                  <span className="font-bold">Looks</span>
                </a>
                <span className="text-gray-300">|</span>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setView(AppView.MANUAL); }} 
                  className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs whitespace-nowrap transition-colors font-bold ${
                    currentView === AppView.MANUAL
                      ? 'bg-[#CF0A2C] text-white border-[#CF0A2C]'
                      : 'text-[#CF0A2C] hover:text-[#B00824] bg-red-50 hover:bg-red-100 border-red-200'
                  }`}
                >
                   <BookOpen className="w-3.5 h-3.5" />
                   <span>Manual de Uso</span>
                </a>
              </div>
            </nav>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setView(AppView.PRODUCTS)}
                className="px-3.5 py-1.5 flex items-center gap-2 text-xs font-black uppercase rounded-xl transition-all duration-300 text-white bg-[#CF0A2C] hover:bg-[#B00824] shadow-sm tracking-wide cursor-pointer flex-shrink-0 active:scale-98"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span>Volver al Catálogo</span>
              </button>
              
              <div className="hidden md:flex space-x-3 items-center">
                <a href="#" onClick={(e) => { e.preventDefault(); setView(AppView.INTERACTIVE_WALL); }} className={`${navLinkClasses} ${currentView === AppView.INTERACTIVE_WALL ? activeLinkClasses : ''}`}>Pared Calzado</a>
                <span className="text-gray-300">|</span>
                <a href="#" onClick={(e) => { e.preventDefault(); setView(AppView.APPAREL_EXHIBITION); }} className={`${navLinkClasses} ${currentView === AppView.APPAREL_EXHIBITION ? activeLinkClasses : ''} flex items-center gap-1.5`}>
                  <span className="font-bold">Looks</span>
                </a>
                <span className="text-gray-300">|</span>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setView(AppView.MANUAL); }} 
                  className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs whitespace-nowrap transition-colors font-bold ${
                    currentView === AppView.MANUAL
                      ? 'bg-[#CF0A2C] text-white border-[#CF0A2C]'
                      : 'text-[#CF0A2C] hover:text-[#B00824] bg-red-50 hover:bg-red-100 border-red-200'
                  }`}
                >
                   <BookOpen className="w-3.5 h-3.5" />
                   <span>Manual de Uso</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;