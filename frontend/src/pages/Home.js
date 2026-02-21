import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, IconButton } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const CAROUSEL_SLIDES = [
  {
    title: 'Shop from Hundreds of Vendors',
    subtitle: 'One marketplace, countless choices. Discover unique products from trusted sellers all in one place.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    cta: 'Start Shopping',
    link: '/products',
  },
  {
    title: 'Secure Checkout & Fast Delivery',
    subtitle: 'Shop with confidence. Secure payments and reliable shipping to your doorstep.',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&q=80',
    cta: 'Browse Products',
    link: '/products',
  },
  {
    title: 'Best Deals Every Day',
    subtitle: 'Exclusive offers, flash sales, and unbeatable prices. Save more on what you love.',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&q=80',
    cta: 'View Deals',
    link: '/products',
  },
  {
    title: 'Sell with Us',
    subtitle: 'Join our growing community of vendors. Reach thousands of customers and grow your business.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
    cta: 'Register as Vendor',
    link: '/vendor/register',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.get('/products/')
      .then((r) => {
        const data = r.data.results ?? r.data;
        setProducts(Array.isArray(data) ? data.slice(0, 8) : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const slide = CAROUSEL_SLIDES[slideIndex];

  return (
    <Box>
      {/* Hero Carousel */}
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, mb: 4 }}>
        <Box
          sx={{
            height: { xs: 280, sm: 360, md: 420 },
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            px: { xs: 2, sm: 4 },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
            <Typography variant="h4" fontWeight="bold" color="white" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {slide.title}
            </Typography>
            <Typography color="rgba(255,255,255,0.9)" sx={{ mb: 2, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {slide.subtitle}
            </Typography>
            {!user && (
              <Button component={Link} to={slide.link} variant="contained" size="large" sx={{ bgcolor: '#ff9900', '&:hover': { bgcolor: '#e68a00' } }}>
                {slide.cta}
              </Button>
            )}
          </Box>
        </Box>
        <IconButton
          onClick={() => setSlideIndex((i) => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, zIndex: 2 }}
        >
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton
          onClick={() => setSlideIndex((i) => (i + 1) % CAROUSEL_SLIDES.length)}
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, zIndex: 2 }}
        >
          <NavigateNextIcon />
        </IconButton>
        <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1, zIndex: 2 }}>
          {CAROUSEL_SLIDES.map((_, i) => (
            <Box
              key={i}
              onClick={() => setSlideIndex(i)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: i === slideIndex ? '#ff9900' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: i === slideIndex ? '#ff9900' : 'rgba(255,255,255,0.9)' },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Featured products - flex grid */}
      <Box sx={{ mt: { xs: 4, sm: 6 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Featured Products</Typography>
          <Button component={Link} to="/products" size="small">View all</Button>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {products.map((p) => (
              <Box key={p.id} sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)' }, minWidth: 0 }}>
                <ProductCard product={p} compact />
              </Box>
            ))}
          </Box>
        )}
        {!loading && products.length === 0 && (
          <Typography color="text.secondary">No products yet.</Typography>
        )}
      </Box>
    </Box>
  );
}
