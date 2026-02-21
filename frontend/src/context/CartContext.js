import React, { createContext, useContext, useState, useEffect } from 'react';

const GUEST_CART_KEY = 'eshop_guest_cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [guestCart, setGuestCart] = useState(() => {
    try {
      const s = localStorage.getItem(GUEST_CART_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
  }, [guestCart]);

  const addToGuestCart = (product, quantity = 1) => {
    setGuestCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateGuestCartItem = (productId, quantity) => {
    if (quantity < 1) {
      removeFromGuestCart(productId);
      return;
    }
    setGuestCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const removeFromGuestCart = (productId) => {
    setGuestCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearGuestCart = () => {
    setGuestCart([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const guestCartTotal = guestCart.reduce((sum, i) => sum + Number(i.product.price || 0) * i.quantity, 0);
  const guestCartCount = guestCart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        guestCart,
        addToGuestCart,
        updateGuestCartItem,
        removeFromGuestCart,
        clearGuestCart,
        guestCartTotal,
        guestCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
