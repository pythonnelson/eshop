import { useState, useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Alert,
  Rating,
  Chip,
  Select,
  FormControl,
  MenuItem,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Popover,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { getMediaUrl } from '../api/axios';
import ProductCard from '../components/ProductCard';
import ProductImageZoom from '../components/ProductImageZoom';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToGuestCart } = useCart();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [ratingAnchor, setRatingAnchor] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}/`)
      .then((r) => {
        setProduct(r.data);
        setSelectedImage(0);
        const p = r.data;
        const colors = (p?.color || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
        const sizes = (p?.size || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
        setSelectedColor(colors[0] || '');
        setSelectedSize(sizes[0] || '');
        const catId = p?.category;
        if (catId) {
          api.get('/products/', { params: { category: catId } }).then((res) => {
            const data = res.data.results ?? res.data;
            const list = Array.isArray(data) ? data.filter((p) => p.id !== +id) : [];
            setSimilarProducts(list.slice(0, 4));
          });
        }
        api.get(`/products/${id}/reviews-summary/`).then((rs) => setReviewsSummary(rs.data)).catch(() => setReviewsSummary(null));
      })
      .catch(() => setProduct(null));
  }, [id]);

  const addToCart = () => {
    if (user?.user_type === 'CUSTOMER') {
      api.post('/orders/cart/add/', {
        product_id: id,
        quantity: qty,
        selected_color: selectedColor || '',
        selected_size: selectedSize || '',
      })
        .then(() => setMessage('Added to cart!'))
        .catch((e) => setMessage(e.response?.data?.error || e.response?.data?.detail || 'Failed to add to cart'));
    } else {
      addToGuestCart(product, qty, selectedColor, selectedSize);
      setMessage('Added to cart! Sign in at checkout to complete your order.');
    }
  };

  if (!product) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

  const canAddToCart = product.is_in_stock && (user?.user_type === 'CUSTOMER' || !user);
  const brandDisplay = product.brand || product.vendor_name;
  const getImgSrc = (v) => { if (!v) return null; if (typeof v === 'string') return v; return v?.image ?? v?.url ?? null; };
  const images = [
    getImgSrc(product.image),
    ...(product.additional_images || []).map((img) => getImgSrc(typeof img === 'object' ? (img.image ?? img.url) : img)),
  ].filter(Boolean);
  const displayImages = images.length > 0 ? images : [getImgSrc(product.image)].filter(Boolean);
  const aboutBullets = (product.about_this_item || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const techSpecs = product.technical_specs && typeof product.technical_specs === 'object'
    ? Object.entries(product.technical_specs)
    : [];
  const extras = [
    product.color && ['Color', product.color],
    product.size && ['Size', product.size],
    product.dimension && ['Dimension', product.dimension],
    product.weight && ['Weight', product.weight],
  ].filter(Boolean);
  const allSpecs = [...extras, ...techSpecs];
  const discountPct = product.discount_percentage ?? (product.compare_at_price && Number(product.compare_at_price) > Number(product.price) ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0);
  const effectivePrice = Number(product.effective_price ?? product.price);
  const colors = (product.color || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  const sizes = (product.size || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', overflow: 'hidden' }}>
      {/* Main content row */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 3, lg: 5 }, mb: 4, alignItems: 'flex-start' }}>
        {/* Left: Image gallery */}
        <Box sx={{ flex: { lg: '0 0 420px' }, width: '100%', display: 'flex', gap: 2, pr: { lg: 2 } }}>
          {/* Thumbnails - vertical on desktop, horizontal on mobile */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            gap: 1,
            minWidth: { sm: 64 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            order: { xs: 2, sm: 0 },
          }}>
            {displayImages.map((img, i) => (
              <Box
                key={i}
                onClick={() => setSelectedImage(i)}
                component="img"
                src={getMediaUrl(img) || 'https://via.placeholder.com/64x64?text=No+Image'}
                alt=""
                sx={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  border: 2,
                  borderColor: selectedImage === i ? 'primary.main' : 'divider',
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { borderColor: 'primary.light' },
                }}
              />
            ))}
          </Box>
          <Box sx={{ order: { xs: 1, sm: 1 }, flex: 1, minWidth: 0 }}>
          <ProductImageZoom
            src={getMediaUrl(displayImages[selectedImage] ?? product.image) || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={product.name}
          />
        </Box>
        </Box>

        {/* Middle: Product info + specs */}
        <Box sx={{ flex: 1, minWidth: 0, px: { lg: 2 } }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.35rem' }, mb: 0.5 }}>
            {product.name}
          </Typography>
          <RouterLink to={product.vendor ? `/products?vendor=${product.vendor}` : '/products'} style={{ textDecoration: 'none', color: '#007185' }}>
            <Typography variant="body2" sx={{ mb: 1, '&:hover': { textDecoration: 'underline' } }}>
              Visit the {brandDisplay} Store
            </Typography>
          </RouterLink>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Box
              component="span"
              sx={{ cursor: (reviewsSummary?.total ?? 0) > 0 ? 'pointer' : 'default' }}
              onMouseEnter={(e) => (reviewsSummary?.total ?? 0) > 0 && setRatingAnchor(e.currentTarget)}
              onMouseLeave={() => setRatingAnchor(null)}
            >
              <Rating value={Number(product.average_rating) || 0} precision={0.1} readOnly size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {product.average_rating ? Number(product.average_rating).toFixed(1) : '—'} ({(reviewsSummary?.total ?? 0)} ratings)
            </Typography>
            {product.is_featured && (
              <Chip label="Featured" size="small" color="primary" variant="outlined" />
            )}
            <Popover
              open={Boolean(ratingAnchor)}
              anchorEl={ratingAnchor}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              onClose={() => setRatingAnchor(null)}
              disableRestoreFocus
              slotProps={{ paper: { sx: { pointerEvents: ratingAnchor ? 'auto' : 'none', minWidth: 260, p: 2 } } }}
            >
              {(reviewsSummary?.total ?? 0) > 0 ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {reviewsSummary.average} out of 5
                  </Typography>
                  <Rating value={reviewsSummary.average} precision={0.1} readOnly size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {reviewsSummary.total} global ratings
                  </Typography>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ minWidth: 48 }}>{star} star</Typography>
                      <Box sx={{ flex: 1, height: 8, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: `${reviewsSummary.percentages?.[star] ?? 0}%`, height: '100%', bgcolor: '#ffa41c' }} />
                      </Box>
                      <Typography variant="body2">{reviewsSummary.percentages?.[star] ?? 0}%</Typography>
                    </Box>
                  ))}
                  <RouterLink to={`/products/${id}/reviews`} style={{ display: 'block', marginTop: 8, color: '#007185', textDecoration: 'none' }}>
                    <Box component="span" sx={{ '&:hover': { textDecoration: 'underline' } }}>See customer reviews &gt;</Box>
                  </RouterLink>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No ratings yet</Typography>
              )}
            </Popover>
          </Box>

          {/* Technical specs & extras */}
          {allSpecs.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Product details
              </Typography>
              <Box component="dl" sx={{ m: 0, display: 'grid', gap: 0.5 }}>
                {allSpecs.map(([key, val]) => (
                  <Box key={key} component="div" sx={{ display: 'flex', gap: 1 }}>
                    <Typography component="dt" variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                      {key}:
                    </Typography>
                    <Typography component="dd" variant="body2" fontWeight={500} sx={{ m: 0 }}>
                      {String(val)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* About this item */}
          {aboutBullets.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1.1rem' }}>
                About this item
              </Typography>
              <List dense disablePadding sx={{ listStyle: 'disc', pl: 2 }}>
                {aboutBullets.map((bullet, i) => (
                  <ListItem key={i} disablePadding sx={{ display: 'list-item', listStyleType: 'disc', py: 0.25 }}>
                    <ListItemText
                      primary={bullet}
                      primaryTypographyProps={{ variant: 'body2', component: 'span' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Fallback description if no about bullets */}
          {aboutBullets.length === 0 && product.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, fontSize: '1.1rem' }}>
                About this item
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{product.description}</Typography>
            </Box>
          )}
        </Box>

        {/* Right: Purchase box */}
        <Box sx={{ flex: { lg: '0 0 300px' }, width: '100%', position: { lg: 'sticky' }, top: { lg: 24 }, pl: { lg: 2 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="h4" sx={{ color: '#B12704', fontWeight: 700 }}>
                ${effectivePrice.toFixed(2)}
              </Typography>
              {(product.discount_percent > 0 || (product.compare_at_price && Number(product.compare_at_price) > Number(product.price))) && (
                <>
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    ${Number(product.price).toFixed(2)}
                  </Typography>
                  {(discountPct > 0 || product.discount_percent > 0) && (
                    <Chip label={`Save ${Math.round(product.discount_percent || discountPct)}%`} size="small" color="error" sx={{ ml: 0.5 }} />
                  )}
                </>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Sales tax may apply at checkout
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {product.stock > 0 ? (
                <Typography component="span" color="success.main" fontWeight={500}>
                  In Stock
                </Typography>
              ) : (
                <Typography component="span" color="error.main">
                  Out of Stock
                </Typography>
              )}
            </Typography>
            {(product.stock ?? 0) === 0 && (
              <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>This item cannot be ordered because it's low on stock.</Alert>
            )}
            {canAddToCart && (
              <>
                {colors.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 120, mb: 2, display: 'block' }}>
                    <InputLabel>Color</InputLabel>
                    <Select value={selectedColor} label="Color" onChange={(e) => setSelectedColor(e.target.value)}>
                      {colors.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
                {sizes.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 120, mb: 2, display: 'block' }}>
                    <InputLabel>Size</InputLabel>
                    <Select value={selectedSize} label="Size" onChange={(e) => setSelectedSize(e.target.value)}>
                      {sizes.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
                <FormControl size="small" sx={{ minWidth: 80, mb: 2, display: 'block' }}>
                  <InputLabel>Qty</InputLabel>
                  <Select
                    value={qty}
                    label="Qty"
                    onChange={(e) => setQty(Math.max(1, Math.min(product.stock, +e.target.value)))}
                  >
                    {Array.from({ length: Math.min(product.stock || 1, 10) }, (_, i) => (
                      <MenuItem key={i} value={i + 1}>{i + 1}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<AddShoppingCartIcon />}
                  onClick={addToCart}
                  sx={{ mb: 1, bgcolor: '#FFD814', color: '#000', '&:hover': { bgcolor: '#F7CA00' } }}
                >
                  Add to Cart
                </Button>
                <Button component={RouterLink} to="/cart" variant="outlined" fullWidth>
                  View Cart
                </Button>
              </>
            )}
            {user && user.user_type !== 'CUSTOMER' && (
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Only customers can add to cart.
              </Typography>
            )}
            {message && (
              <Typography color={message.includes('Added') ? 'success.main' : 'error.main'} variant="body2" sx={{ mt: 1 }}>
                {message}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Consider a similar item
          </Typography>
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
