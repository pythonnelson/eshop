import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { getMediaUrl } from '../api/axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ cart, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [form, setForm] = useState({
    shipping_address: '', shipping_city: '', shipping_state: '', shipping_country: '', shipping_postal_code: '',
    customer_notes: '', payment_method: 'simulated',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const shipping = {
      shipping_address: form.shipping_address,
      shipping_city: form.shipping_city,
      shipping_state: form.shipping_state,
      shipping_country: form.shipping_country,
      shipping_postal_code: form.shipping_postal_code,
      customer_notes: form.customer_notes,
    };
    try {
      if (form.payment_method === 'simulated') {
        await api.post('/orders/orders/create/', { ...shipping, payment_method: 'Simulated' });
        onSuccess();
        return;
      }
      const { data } = await api.post('/orders/stripe/create-intent/', shipping);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }
      await api.post('/orders/stripe/confirm/', {
        payment_intent_id: paymentIntent?.id,
        order_id: data.order_id,
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Checkout failed';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    }
    setLoading(false);
  };

  const items = cart?.items || [];
  const subtotal = Number(cart?.total_price || 0);
  const tax = Number(cart?.tax_amount || 0);
  const shipping = Number(cart?.shipping_fee || 0);
  const total = Number(cart?.total_amount ?? (subtotal + tax + shipping));

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Shipping Address</Typography>
            <TextField fullWidth name="shipping_address" label="Street address" value={form.shipping_address} onChange={handleChange} required margin="normal" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth name="shipping_city" label="City" value={form.shipping_city} onChange={handleChange} required /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth name="shipping_state" label="State (optional)" value={form.shipping_state} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth name="shipping_country" label="Country" value={form.shipping_country} onChange={handleChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth name="shipping_postal_code" label="Postal code (optional)" value={form.shipping_postal_code} onChange={handleChange} /></Grid>
            </Grid>
            <TextField fullWidth name="customer_notes" label="Order notes" multiline rows={2} value={form.customer_notes} onChange={handleChange} margin="normal" />
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel>Payment Method</FormLabel>
              <RadioGroup row name="payment_method" value={form.payment_method} onChange={handleChange}>
                <FormControlLabel value="simulated" control={<Radio />} label="Simulated (Demo)" />
                <FormControlLabel value="stripe" control={<Radio />} label="Pay with Card (Stripe)" />
              </RadioGroup>
              {form.payment_method === 'stripe' && (
                <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <CardElement options={{ style: { base: { fontSize: '16px' } }, hidePostalCode: true }} />
                </Box>
              )}
            </FormControl>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Table size="small">
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.product?.image && <Box component="img" src={getMediaUrl(item.product.image)} alt="" sx={{ width: 40, height: 40, objectFit: 'cover' }} />}
                        {item.product?.name} × {item.quantity}
                      </Box>
                    </TableCell>
                    <TableCell align="right">${Number(item.subtotal || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
              <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
              <Typography>Tax: ${tax.toFixed(2)}</Typography>
              <Typography>Shipping: ${shipping.toFixed(2)}</Typography>
              <Typography variant="h6" fontWeight="bold">Total: ${total.toFixed(2)}</Typography>
            </Box>
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading || !stripe} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
              {loading ? 'Processing...' : 'Place Order'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    api.get('/orders/cart/').then((r) => setCart(r.data)).catch(() => setCart(null));
  }, []);

  const handleSuccess = () => navigate('/my-orders');

  if (!cart) return <Typography>Loading...</Typography>;

  const items = cart.items || [];
  if (items.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography gutterBottom>Your cart is empty.</Typography>
        <Button component={Link} to="/products" variant="contained">Browse Products</Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Checkout</Typography>
      <Elements stripe={stripePromise}>
        <CheckoutForm cart={cart} onSuccess={handleSuccess} />
      </Elements>
    </Box>
  );
}
