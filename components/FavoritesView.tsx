import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { products } from '../data/products';
import ProductCard from './ProductCard';
import { AppView } from '../types';

interface FavoritesViewProps {
  setView: (view: AppView) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ setView }) => {
  const { favorites } = useFavorites();
  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">Mis Favoritos</h1>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes productos guardados en favoritos.</p>
          <button 
            onClick={() => setView(AppView.PRODUCTS)}
            className="bg-[#CF0A2C] text-white px-6 py-2 rounded font-bold hover:bg-[#B00824]"
          >
            Volver a Productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favoriteProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesView;
