import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, DeliveryRequirement } from '../types';
import { products } from '../data/products';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, deliveryPlan?: DeliveryRequirement[]) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  updateDeliveryPlan: (productId: number | string, deliveryPlan: DeliveryRequirement[]) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  cartCount: number;
  totalPrice: number;
}

export const VALID_PERIODS = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function normalizePeriodName(period?: string): string {
  const p = (period || '').trim();
  if (VALID_PERIODS.includes(p)) return p;
  const lower = p.toLowerCase();
  if (lower === 'julio' || lower === 'jul') return 'Julio';
  if (lower === 'agosto' || lower === 'ago') return 'Agosto';
  if (lower === 'septiembre' || lower === 'sep' || lower === 'set') return 'Septiembre';
  if (lower === 'octubre' || lower === 'oct') return 'Octubre';
  if (lower === 'noviembre' || lower === 'nov') return 'Noviembre';
  if (lower === 'diciembre' || lower === 'dic') return 'Diciembre';
  // Legacy bimonthly period migrations
  if (lower.includes('jul') || lower.includes('ago')) return 'Julio';
  if (lower.includes('sep') || lower.includes('oct')) return 'Septiembre';
  if (lower.includes('nov') || lower.includes('dic')) return 'Noviembre';
  return 'Julio';
}

function syncCartItemWithCatalog(item: CartItem): CartItem {
  const prod = products.find(
    p => (item.sku && p.sku === item.sku) || (!item.sku && p.id === item.id)
  );
  const rawPlan = Array.isArray(item.deliveryPlan) ? item.deliveryPlan : [];
  const mergedByPeriod: Record<string, Record<string, number>> = {};

  rawPlan.forEach(plan => {
    const normPeriod = normalizePeriodName(plan.period);
    if (!mergedByPeriod[normPeriod]) {
      mergedByPeriod[normPeriod] = {};
    }
    Object.entries(plan.sizeBreakdown || {}).forEach(([sz, qty]) => {
      const n = Number(qty) || 0;
      if (n > 0) {
        mergedByPeriod[normPeriod][sz] = (mergedByPeriod[normPeriod][sz] || 0) + n;
      }
    });
  });

  const normalizedPlan: DeliveryRequirement[] = Object.entries(mergedByPeriod).map(([period, sizeBreakdown]) => ({
    period,
    sizeBreakdown,
  }));

  if (!prod) {
    return {
      ...item,
      allowedPeriods: VALID_PERIODS,
      deliveryPlan: normalizedPlan,
    };
  }

  const effectiveAllowedPeriods = prod.allowedPeriods && prod.allowedPeriods.length > 0
    ? prod.allowedPeriods
    : VALID_PERIODS;

  // Reconcile deliveryPlan: ensure only allowed periods exist; migrate any disallowed periods to first allowed
  const reconciledByPeriod: Record<string, Record<string, number>> = {};
  effectiveAllowedPeriods.forEach(p => {
    reconciledByPeriod[p] = {};
  });

  normalizedPlan.forEach(plan => {
    const targetPeriod = effectiveAllowedPeriods.includes(plan.period)
      ? plan.period
      : effectiveAllowedPeriods[0];
    if (targetPeriod) {
      if (!reconciledByPeriod[targetPeriod]) reconciledByPeriod[targetPeriod] = {};
      Object.entries(plan.sizeBreakdown || {}).forEach(([sz, qty]) => {
        const n = Number(qty) || 0;
        if (n > 0) {
          reconciledByPeriod[targetPeriod][sz] = (reconciledByPeriod[targetPeriod][sz] || 0) + n;
        }
      });
    }
  });

  const reconciledPlan: DeliveryRequirement[] = Object.entries(reconciledByPeriod).map(([period, sizeBreakdown]) => ({
    period,
    sizeBreakdown,
  }));

  return {
    ...item,
    id: prod.id,
    sku: prod.sku,
    name: prod.name,
    division: prod.division,
    category: prod.category,
    gender: prod.gender,
    model: prod.model,
    price: prod.price,
    wholesalePrice: prod.wholesalePrice,
    images: prod.images,
    sizes: prod.sizes,
    sizeRange: prod.sizeRange,
    curve: prod.curve,
    unitsPerCurve: prod.unitsPerCurve,
    allowedPeriods: effectiveAllowedPeriods,
    deliveryPlan: reconciledPlan,
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fila_cart');
      const parsed: CartItem[] = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.map(syncCartItemWithCatalog) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fila_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantity = 1, size?: string, deliveryPlan?: DeliveryRequirement[]) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id || (product.sku && item.sku === product.sku));
      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + quantity;
        updated[existingIndex] = syncCartItemWithCatalog({
          ...item,
          quantity: newQty,
          deliveryPlan: deliveryPlan || item.deliveryPlan
        });
        return updated;
      } else {
        const newItem: CartItem = syncCartItemWithCatalog({
          ...product,
          quantity,
          deliveryPlan: deliveryPlan || []
        });
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (id: number | string) => {
    setCartItems(prev => prev.filter(item => item.id !== id && item.sku !== id));
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.id === id || item.sku === id) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const updateDeliveryPlan = (productId: number | string, deliveryPlan: DeliveryRequirement[]) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId || item.sku === productId) {
        const totalQty = deliveryPlan.reduce((acc, p) => acc + (Object.values(p.sizeBreakdown) as number[]).reduce((a, b) => a + Number(b), 0), 0);
        return {
          ...item,
          deliveryPlan,
          quantity: totalQty > 0 ? totalQty : item.quantity
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('fila_cart');
  };

  const restoreCart = (items: CartItem[]) => {
    setCartItems(items.map(syncCartItemWithCatalog));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.wholesalePrice || item.price || 0) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateDeliveryPlan,
      clearCart,
      restoreCart,
      cartCount,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
