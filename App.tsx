import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ReviewsProvider } from './context/ReviewsContext';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AppView, OrderDetails } from './types';

import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import OrderConfirmationView from './components/OrderConfirmationView';
import OrderLookupView from './components/OrderLookupView';
import InteractiveWallView from './components/InteractiveWallView';
import FavoritesView from './components/FavoritesView';
import ManualView from './components/ManualView';
import ApparelExhibitionView from './components/ApparelExhibitionView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PRODUCTS);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [checkoutInitialData, setCheckoutInitialData] = useState<any>(null);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string | null>(null);
  const [segmentationFilter, setSegmentationFilter] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState('');

  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [hideFavorites, setHideFavorites] = useState(false);

  const clearFiltersAndGoHome = () => {
    setDivisionFilter(null);
    setGenderFilter(null);
    setDisciplineFilter(null);
    setSegmentationFilter([]);
    setSortOption('default');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setHideFavorites(false);
    setCurrentView(AppView.PRODUCTS);
  };

  const handleSetGenderFilter = (gender: string | null) => {
    setGenderFilter(gender);
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentView(AppView.PRODUCTS);
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.PRODUCTS:
        return <ProductGrid 
                  genderFilter={genderFilter} 
                  disciplineFilter={disciplineFilter}
                  setDisciplineFilter={setDisciplineFilter}
                  divisionFilter={divisionFilter}
                  setDivisionFilter={setDivisionFilter}
                  segmentationFilter={segmentationFilter}
                  setSegmentationFilter={setSegmentationFilter}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  clearFilters={clearFiltersAndGoHome}
                  searchQuery={searchQuery}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  hideFavorites={hideFavorites}
                  setHideFavorites={setHideFavorites}
                  setView={setCurrentView}
                  onOpenHelp={() => setCurrentView(AppView.MANUAL)}
                />;
      case AppView.CART:
        return <CartView setView={setCurrentView} />;
      case AppView.CHECKOUT:
        return <CheckoutView setView={setCurrentView} setLastOrder={setLastOrder} initialData={checkoutInitialData} />;
      case AppView.CONFIRMATION:
        return <OrderConfirmationView order={lastOrder} setView={setCurrentView} setLastOrder={setLastOrder} setCheckoutInitialData={setCheckoutInitialData} />;
      case AppView.ORDERS:
        return <OrderLookupView setView={setCurrentView} setLastOrder={setLastOrder} />;
      case AppView.INTERACTIVE_WALL:
        return <InteractiveWallView hidePeriodFilter={false} setView={setCurrentView} />;
      case AppView.FAVORITES:
        return <FavoritesView setView={setCurrentView} />;
      case AppView.FAVORITES_WALL:
        return <InteractiveWallView isFavoritesWall={true} setView={setCurrentView} />;
      case AppView.MANUAL:
        return <ManualView setView={setCurrentView} />;
      case AppView.APPAREL_EXHIBITION:
        return <ApparelExhibitionView setView={setCurrentView} />;
      default:
        return <ProductGrid 
                  genderFilter={genderFilter} 
                  disciplineFilter={disciplineFilter}
                  setDisciplineFilter={setDisciplineFilter}
                  divisionFilter={divisionFilter}
                  setDivisionFilter={setDivisionFilter}
                  segmentationFilter={segmentationFilter}
                  setSegmentationFilter={setSegmentationFilter}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  clearFilters={clearFiltersAndGoHome}
                  searchQuery={searchQuery}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  hideFavorites={hideFavorites}
                  setHideFavorites={setHideFavorites}
                  setView={setCurrentView}
                  onOpenHelp={() => setCurrentView(AppView.MANUAL)}
                />;
    }
  };

  return (
    <FavoritesProvider>
      <ReviewsProvider>
        <CartProvider>
          <div className="min-h-screen font-sans relative overflow-x-clip bg-[#F8F9FA] text-gray-900 transition-colors duration-300">
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header 
                setView={setCurrentView} 
                setGenderFilter={handleSetGenderFilter}
                clearFilters={clearFiltersAndGoHome}
                activeGenderFilter={genderFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentView={currentView}
                onOpenHelp={() => setCurrentView(AppView.MANUAL)}
              />
              <main className="flex-grow max-w-[1600px] w-full mx-auto px-2.5 sm:px-6 lg:px-12 xl:px-16 pt-2 pb-24 md:pb-12">
                {renderContent()}
              </main>
              <footer className="bg-[#18181b] text-gray-400 text-xs py-8 pb-24 md:pb-8 border-t border-gray-200">
                  <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center">
                      <p>&copy; 2027 New Balance Collection. Todos los derechos reservados.</p>
                  </div>
              </footer>
              <MobileBottomNav currentView={currentView} setView={setCurrentView} />
            </div>
          </div>
        </CartProvider>
      </ReviewsProvider>
    </FavoritesProvider>
  );
};

export default App;