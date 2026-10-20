import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeGetJSON, safeSetJSON, safeRemoveItem } from '../utils/storage';

type Review = {
  comment: string;
  rating: number; // 0-5
}

interface ReviewsContextType {
  reviews: Record<string, Review>;
  addReview: (productId: string, comment: string, rating: number) => void;
  getReview: (productId: string) => Review | undefined;
  clearReviews: () => void;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reviews, setReviews] = useState<Record<string, Review>>(() => {
    return safeGetJSON<Record<string, Review>>('fila_reviews', {});
  });

  useEffect(() => {
    safeSetJSON('fila_reviews', reviews);
  }, [reviews]);

  const addReview = (productId: string, comment: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { comment, rating }
    }));
  };

  const getReview = (productId: string) => {
    return reviews[productId];
  };

  const clearReviews = () => {
    setReviews({});
    safeRemoveItem('fila_reviews');
  };

  return (
    <ReviewsContext.Provider value={{ reviews, addReview, getReview, clearReviews }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  return context;
};
