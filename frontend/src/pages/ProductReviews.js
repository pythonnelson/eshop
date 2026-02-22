import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Rating,
  CircularProgress,
  Button,
} from '@mui/material';
import api from '../api/axios';

export default function ProductReviews() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}/`),
      api.get(`/products/${id}/reviews-summary/`),
      api.get(`/products/${id}/reviews/`),
    ])
      .then(([pr, sm, rv]) => {
        setProduct(pr.data);
        setSummary(sm.data);
        setReviews(rv.data.reviews || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  if (!product) return <Typography>Product not found.</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3 }}>
      <Button component={Link} to={`/products/${id}`} sx={{ mb: 2 }}>← Back to product</Button>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Customer reviews
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Rating value={summary?.average ?? 0} precision={0.1} readOnly size="large" />
        <Typography variant="h6">{summary?.average ?? '—'} out of 5</Typography>
        <Typography variant="body2" color="text.secondary">
          {summary?.total ?? 0} global ratings
        </Typography>
      </Box>
      {(summary?.percentages && Object.keys(summary.percentages).length > 0) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 60 }}>{star} star</Typography>
              <Box sx={{ flex: 1, height: 12, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ width: `${summary.percentages[star] ?? 0}%`, height: '100%', bgcolor: '#ffa41c' }} />
              </Box>
              <Typography variant="body2">{summary.percentages[star] ?? 0}%</Typography>
            </Box>
          ))}
        </Paper>
      )}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Top reviews</Typography>
      {reviews.length === 0 ? (
        <Typography color="text.secondary">No reviews yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reviews.map((r) => (
            <Paper key={r.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Rating value={r.rating} readOnly size="small" />
                <Typography variant="subtitle2" fontWeight="bold">{r.customer_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(r.date).toLocaleDateString()}
                </Typography>
              </Box>
              {(r.selected_color || r.selected_size) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {[r.selected_color && `Color: ${r.selected_color}`, r.selected_size && `Size: ${r.selected_size}`].filter(Boolean).join(' | ')}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
