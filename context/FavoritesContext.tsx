import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeGetJSON, safeSetJSON, safeRemoveItem } from '../utils/storage';

interface FavoritesContextType {
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>(() => {
    return safeGetJSON<number[]>('fila_favorites', []);
  });

  useEffect(() => {
    safeSetJSON('fila_favorites', favorites);
  }, [favorites]);

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    safeRemoveItem('fila_favorites');
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
