import React from 'react';
import { 
  Store, 
  Heart, 
  ShoppingBag, 
  Layers, 
  Grid3X3,
  Sparkles
} from 'lucide-react';
import { AppView } from '../types';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

interface MobileBottomNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, setView }) => {
  const { cartCount } = useCart();
  const { favorites } = useFavorites();

  const navItems = [
    {
      id: AppView.PRODUCTS,
      label: 'Catálogo',
      icon: Grid3X3,
      badge: null,
      isActive: currentView === AppView.PRODUCTS,
    },
    {
      id: AppView.APPAREL_EXHIBITION,
      label: 'Looks',
      icon: Store,
      badge: 'NUEVO',
      badgeColor: 'bg-[#CF0A2C] text-white',
      isHighlight: true,
      isActive: currentView === AppView.APPAREL_EXHIBITION,
    },
    {
      id: AppView.INTERACTIVE_WALL,
      label: 'Pared 3D',
      icon: Layers,
      badge: null,
      isActive: currentView === AppView.INTERACTIVE_WALL || currentView === AppView.FAVORITES_WALL,
    },
    {
      id: AppView.FAVORITES,
      label: 'Favoritos',
      icon: Heart,
      badge: favorites.length > 0 ? String(favorites.length) : null,
      badgeColor: 'bg-rose-500 text-white',
      isActive: currentView === AppView.FAVORITES,
    },
    {
      id: AppView.CART,
      label: 'Carrito',
      icon: ShoppingBag,
      badge: cartCount > 0 ? String(cartCount) : null,
      badgeColor: 'bg-[#CF0A2C] text-white',
      isActive: currentView === AppView.CART || currentView === AppView.CHECKOUT,
    },
  ];

  return (
    <nav 
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 px-1 transition-all"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                item.isActive 
                  ? 'text-[#CF0A2C]' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <div className={`p-1 rounded-lg transition-transform ${item.isActive ? 'scale-110 bg-red-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {item.badge && (
                  <span 
                    className={`absolute -top-1 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none shadow-xs ${
                      item.badgeColor || 'bg-red-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-full font-medium ${
                item.isActive ? 'font-black text-[#CF0A2C]' : 'text-gray-600'
              }`}>
                {item.label}
              </span>

              {item.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#CF0A2C] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
