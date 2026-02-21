import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Grid, Typography, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

function flattenCategories(cats) {
  if (!Array.isArray(cats)) return [];
  const out = [];
  cats.forEach((c) => {
    out.push(c);
    if (c.subcategories?.length) c.subcategories.forEach((s) => out.push(s));
  });
  return out;
}

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState(q);
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    api.get('/products/categories/').then((r) => {
      const data = r.data.results ?? r.data;
      setCategories(Array.isArray(data) ? flattenCategories(data) : []);
    }).catch(() => setCategories([]));
    api.get('/vendors/').then((r) => {
      const data = r.data.results ?? r.data;
      setVendors(Array.isArray(data) ? data : []);
    }).catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (vendor) params.vendor = vendor;
    if (minRating) params.min_rating = minRating;
    api.get('/products/', { params })
      .then((r) => {
        const data = r.data.results ?? r.data;
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || err.response?.data?.error
          || (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running?' : 'Failed to load products');
        setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [search, category, vendor, minRating]);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Products</Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { sm: 1 } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel>Store</InputLabel>
          <Select value={vendor} label="Store" onChange={(e) => setVendor(e.target.value)}>
            <MenuItem value="">All stores</MenuItem>
            {vendors.map((v) => (
              <MenuItem key={v.id} value={v.id}>{v.store_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
          <InputLabel>Min Rating</InputLabel>
          <Select value={minRating} label="Min Rating" onChange={(e) => setMinRating(e.target.value)}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="3">3+ stars</MenuItem>
            <MenuItem value="4">4+ stars</MenuItem>
            <MenuItem value="4.5">4.5+ stars</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {products.map((p) => (
            <Box key={p.id} sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 11px)', md: 'calc(25% - 12px)', lg: 'calc(20% - 14px)' }, minWidth: 0 }}>
              <ProductCard product={p} />
            </Box>
          ))}
        </Box>
      )}
      {!loading && !error && products.length === 0 && (
        <Typography color="text.secondary">No products found.</Typography>
      )}
    </Box>
  );
}
