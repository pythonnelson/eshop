import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axios';
import { getMediaUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { user } = useAuth();
  const { guestCart, updateGuestCartItem, removeFromGuestCart, guestCartTotal } = useCart();
  const [serverCart, setServerCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = () =>
    api.get('/orders/cart/').then((r) => { setServerCart(r.data); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => {
    if (user?.user_type === 'CUSTOMER') {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const updateQty = (itemId, quantity) => {
    if (quantity < 1) return;
    api.patch(`/orders/cart/items/${itemId}/`, { quantity }).then(fetchCart);
  };

  const removeItem = (itemId) => {
    api.delete(`/orders/cart/items/${itemId}/remove/`).then(fetchCart);
  };

  const isLoggedInCustomer = user?.user_type === 'CUSTOMER';
  const items = isLoggedInCustomer ? (serverCart?.items || []) : guestCart.map((i) => ({ id: i.product.id, product: i.product, quantity: i.quantity, subtotal: i.product.price * i.quantity }));
  const total = isLoggedInCustomer ? Number(serverCart?.total_price || 0) : guestCartTotal;

  if (loading && isLoggedInCustomer) return <Typography>Loading cart...</Typography>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Shopping Cart</Typography>
      {!isLoggedInCustomer && guestCart.length > 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Sign in to checkout. Your cart will be saved.
        </Typography>
      )}
      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>Your cart is empty.</Typography>
          <Button component={Link} to="/products" variant="contained">Browse Products</Button>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={getMediaUrl(item.product?.image) || 'https://via.placeholder.com/60'}
                          alt=""
                          sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Typography>{item.product?.name || 'Product'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>${Number(item.product?.price || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {isLoggedInCustomer ? (
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.id, +e.target.value)}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => updateGuestCartItem(item.product.id, +e.target.value)}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>${Number(item.subtotal || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => (isLoggedInCustomer ? removeItem(item.id) : removeFromGuestCart(item.product.id))}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button component={Link} to="/products" variant="outlined">Continue Shopping</Button>
              {isLoggedInCustomer ? (
                <Button component={Link} to="/checkout" variant="contained" size="large">
                  Proceed to Checkout
                </Button>
              ) : (
                <Button component={Link} to="/login" state={{ from: { pathname: '/checkout' } }} variant="contained" size="large">
                  Sign in to Checkout
                </Button>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
