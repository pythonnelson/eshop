import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, CircularProgress, Paper, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { getMediaUrl } from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToGuestCart } = useCart();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/products/${id}/`)
      .then((r) => {
        setProduct(r.data);
        const catId = r.data?.category;
        if (catId) {
          api.get('/products/', { params: { category: catId } }).then((res) => {
            const data = res.data.results ?? res.data;
            const list = Array.isArray(data) ? data.filter((p) => p.id !== +id) : [];
            setSimilarProducts(list.slice(0, 4));
          });
        }
      })
      .catch(() => setProduct(null));
  }, [id]);

  const addToCart = () => {
    if (user?.user_type === 'CUSTOMER') {
      api.post('/orders/cart/add/', { product_id: id, quantity: qty })
        .then(() => setMessage('Added to cart!'))
        .catch((e) => setMessage(e.response?.data?.detail || 'Failed to add to cart'));
    } else {
      addToGuestCart(product, qty);
      setMessage('Added to cart! Sign in at checkout to complete your order.');
    }
  };

  if (!product) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

  const canAddToCart = product.is_in_stock && (user?.user_type === 'CUSTOMER' || !user);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', gap: 3, mb: { xs: 4, sm: 6 }, alignItems: 'flex-start' }}>
        <Box sx={{ flex: { md: '1 1 400px' }, minWidth: 0, width: '100%' }}>
          <Box
            component="img"
            src={getMediaUrl(product.image) || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={product.name}
            sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 400 }}
          />
          <Typography variant="h6" fontWeight="bold" sx={{ mt: 3 }}>Description</Typography>
          <Typography sx={{ mt: 1 }}>{product.description}</Typography>
        </Box>
        <Box sx={{ flex: { md: '0 0 340px' }, width: '100%', position: { xs: 'static', md: 'sticky' }, top: { md: 24 } }}>
          <Box
            component={Paper}
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'white',
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>{product.name}</Typography>
            <Typography color="text.secondary" gutterBottom>by {product.vendor_name}</Typography>
            <Typography variant="h4" sx={{ color: '#B12704', fontWeight: 700, my: 2 }}>${Number(product.price).toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>In stock: {product.stock}</Typography>
            {(product.stock ?? 0) === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>This item cannot be ordered because it's low on stock.</Alert>
            )}
            {canAddToCart && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  type="number"
                  size="small"
                  label="Quantity"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(product.stock, +e.target.value)))}
                  inputProps={{ min: 1, max: product.stock }}
                  sx={{ maxWidth: 120 }}
                />
                <Button variant="contained" size="large" onClick={addToCart} fullWidth>
                  Add to Cart
                </Button>
                <Button component={Link} to="/cart" variant="outlined" fullWidth>View Cart</Button>
              </Box>
            )}
            {user && user.user_type !== 'CUSTOMER' && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>Only customers can add to cart.</Typography>
            )}
            {message && (
              <Typography color={message.includes('Added') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>{message}</Typography>
            )}
          </Box>
        </Box>
      </Box>

      {similarProducts.length > 0 && (
        <Box sx={{ mt: { xs: 4, sm: 6 } }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>You might also like</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {similarProducts.map((p) => (
              <Box key={p.id} sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)' }, minWidth: 0 }}>
                <ProductCard product={p} compact />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
