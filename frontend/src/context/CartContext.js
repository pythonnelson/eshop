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

  const addToGuestCart = (product, quantity = 1, selectedColor = '', selectedSize = '') => {
    setGuestCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id
          && (i.selected_color || '') === (selectedColor || '')
          && (i.selected_size || '') === (selectedSize || '')
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && (i.selected_color || '') === (selectedColor || '') && (i.selected_size || '') === (selectedSize || '')
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, selected_color: selectedColor || '', selected_size: selectedSize || '' }];
    });
  };

  const updateGuestCartItem = (productId, quantity, selectedColor = '', selectedSize = '') => {
    if (quantity < 1) {
      removeFromGuestCart(productId, selectedColor, selectedSize);
      return;
    }
    setGuestCart((prev) =>
      prev.map((i) =>
        i.product.id === productId && (i.selected_color || '') === (selectedColor || '') && (i.selected_size || '') === (selectedSize || '')
          ? { ...i, quantity }
          : i
      )
    );
  };

  const removeFromGuestCart = (productId, selectedColor = '', selectedSize = '') => {
    setGuestCart((prev) =>
      prev.filter(
        (i) => !(i.product.id === productId
          && (i.selected_color || '') === (selectedColor || '')
          && (i.selected_size || '') === (selectedSize || ''))
      )
    );
  };

  const clearGuestCart = () => {
    setGuestCart([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getEffectivePrice = (p) => {
    const price = Number(p.price || 0);
    const discount = Number(p.discount_percent || 0) / 100;
    return p.effective_price != null ? Number(p.effective_price) : price * (1 - discount);
  };
  const guestCartTotal = guestCart.reduce((sum, i) => sum + getEffectivePrice(i.product) * i.quantity, 0);
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
