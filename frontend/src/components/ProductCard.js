import { Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Alert } from '@mui/material';
import { getMediaUrl } from '../api/axios';

export default function ProductCard({ product, compact = false }) {
  return (
    <Card
      component={Link}
      to={`/products/${product.id}`}
      elevation={0}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        width: '100%',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2, borderColor: 'transparent' },
      }}
    >
      <CardMedia
        component="img"
        height={compact ? 140 : 180}
        image={getMediaUrl(product.image) || 'https://via.placeholder.com/300x180?text=No+Image'}
        alt={product.name}
        sx={{ objectFit: 'contain', p: 1 }}
      />
      <CardContent sx={{ flexGrow: 1, py: compact ? 1.5 : 2 }}>
        {(product.stock ?? 0) === 0 && (
          <Alert severity="info" sx={{ py: 0.25, px: 1, mb: 1, fontSize: '0.75rem', '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
            This item cannot be ordered because it's low on stock.
          </Alert>
        )}
        <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontSize: compact ? '0.95rem' : '1rem' }} noWrap fontWeight={500}>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{product.vendor_name}</Typography>
        <Typography variant="subtitle1" sx={{ color: '#B12704', fontWeight: 700 }}>
          ${Number(product.price).toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
}
