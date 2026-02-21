import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders/cart/').then((r) => r.data).catch(() => null),
      api.get('/orders/orders/').then((r) => r.data.results || r.data).catch(() => []),
    ]).then(([cartData, ordersData]) => {
      setCart(cartData);
      setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  const cartItems = cart?.items || [];
  const cartTotal = Number(cart?.total_price || 0);
  const hasCartItems = cartItems.length > 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>My Account</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Welcome back, {user?.first_name || 'Customer'}!</Typography>

      <Grid container spacing={3}>
        {/* Cart summary card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="h6">Shopping Cart</Typography>
              </Box>
              {hasCartItems ? (
                <>
                  <Typography variant="h5" color="primary">${cartTotal.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">{cartItems.length} item(s) in cart</Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button component={Link} to="/cart" variant="outlined" fullWidth>
                      View Cart
                    </Button>
                    <Button component={Link} to="/checkout" variant="contained" fullWidth startIcon={<AddShoppingCartIcon />}>
                      Proceed to Checkout
                    </Button>
                  </Box>
                </>
              ) : (
                <>
                  <Typography color="text.secondary">Your cart is empty</Typography>
                  <Button component={Link} to="/products" variant="contained" sx={{ mt: 2 }} fullWidth>
                    Start Shopping
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShoppingBagIcon color="primary" />
                <Typography variant="h6">Quick Actions</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button component={Link} to="/products" variant="outlined" fullWidth>Browse Products</Button>
                <Button component={Link} to="/my-orders" variant="outlined" fullWidth>My Orders</Button>
                <Button component={Link} to="/profile" variant="outlined" fullWidth>Edit Profile</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order count card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>Total Orders</Typography>
              <Typography variant="h3" color="primary">{orders.length > 0 ? orders.length : 0}</Typography>
              <Button component={Link} to="/my-orders" size="small" sx={{ mt: 1 }}>
                View all orders
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Orders</Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">No orders yet. <Link to="/products">Browse products</Link> and add items to cart to place your first order.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.order_number}</TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>${Number(o.total_amount).toFixed(2)}</TableCell>
                        <TableCell><Chip label={o.status} size="small" color={o.status === 'DELIVERED' ? 'success' : 'default'} /></TableCell>
                        <TableCell align="right"><Button size="small" component={Link} to="/my-orders">View</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
