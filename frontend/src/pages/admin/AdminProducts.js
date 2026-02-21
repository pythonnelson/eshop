import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../../api/axios';
import { getMediaUrl } from '../../api/axios';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/products/').then((r) => {
      const data = r.data.results ?? r.data;
      setProducts(Array.isArray(data) ? data : []);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  const updateProduct = (productId, updates) => {
    api.patch(`/admin/products/${productId}/approve/`, updates).then(() => {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    });
  };

  const setApproved = (productId, isApproved) => {
    updateProduct(productId, { is_approved: isApproved });
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Products</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Approve or reject products before they appear to customers.</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image && <Box component="img" src={getMediaUrl(p.image)} alt="" sx={{ width: 50, height: 50, objectFit: 'cover' }} />}
                </TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.vendor_name}</TableCell>
                <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={p.is_approved ? 'Approved' : 'Pending'} size="small" color={p.is_approved ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>
                  {p.is_approved && (
                    <IconButton size="small" color={p.is_active ? 'primary' : 'default'} onClick={() => updateProduct(p.id, { is_active: !p.is_active })} title={p.is_active ? 'Visible on store' : 'Hidden from store'}>
                      {p.is_active ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>
                  {p.is_approved && (
                    <IconButton size="small" color={p.is_featured ? 'primary' : 'default'} onClick={() => updateProduct(p.id, { is_featured: !p.is_featured })} title={p.is_featured ? 'Featured' : 'Not featured'}>
                      {p.is_featured ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell align="right">
                  {p.is_approved ? (
                    <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => setApproved(p.id, false)}>
                      Reject
                    </Button>
                  ) : (
                    <Button size="small" color="success" startIcon={<CheckCircleIcon />} onClick={() => setApproved(p.id, true)}>
                      Approve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
