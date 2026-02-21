import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { CircularProgress, Box } from '@mui/material';

/** Syncs server cart with guest cart (replaces, does not add to existing). */
async function mergeGuestCart(guestCart, clearGuestCart) {
  if (!guestCart?.length) return;
  try {
    const items = guestCart.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
    await api.post('/orders/cart/sync/', { items });
    clearGuestCart();
  } catch (e) {
    console.warn('Failed to merge cart', e);
  }
}

export default function CheckoutGate({ children }) {
  const { user } = useAuth();
  const { guestCart, clearGuestCart } = useCart();
  const [mergeDone, setMergeDone] = useState(false);

  useEffect(() => {
    if (user?.user_type !== 'CUSTOMER') {
      setMergeDone(true);
      return;
    }
    if (!guestCart?.length) {
      setMergeDone(true);
      return;
    }
    mergeGuestCart(guestCart, clearGuestCart).finally(() => setMergeDone(true));
  }, [user?.user_type, guestCart?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/checkout' } }} replace />;
  }
  if (user.user_type !== 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }
  if (!mergeDone) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  return children;
}
