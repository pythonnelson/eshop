import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import api from '../../api/axios';
import { getMediaUrl } from '../../api/axios';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewProduct, setViewProduct] = useState(null);

  useEffect(() => {
    api.get('/admin/products/').then((r) => {
      const data = r.data.results ?? r.data;
      setProducts(Array.isArray(data) ? data : []);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  const updateProduct = (productId, updates) => {
    api.patch(`/admin/products/${productId}/approve/`, updates).then(() => {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
      if (viewProduct?.id === productId) setViewProduct((p) => (p ? { ...p, ...updates } : p));
    });
  };

  const setApproved = (productId, isApproved) => {
    updateProduct(productId, { is_approved: isApproved });
  };

  const handleView = (productId) => {
    api.get(`/admin/products/${productId}/`).then((r) => setViewProduct(r.data)).catch(() => setViewProduct(null));
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
                  <Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => handleView(p.id)} sx={{ mr: 0.5 }}>
                    View
                  </Button>
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

      <Dialog open={!!viewProduct} onClose={() => setViewProduct(null)} maxWidth="md" fullWidth>
        <DialogTitle>{viewProduct?.name}</DialogTitle>
        <DialogContent>
          {viewProduct && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box component="img" src={getMediaUrl(viewProduct.image)} alt="" sx={{ width: 160, height: 160, objectFit: 'contain', border: 1, borderColor: 'divider' }} />
                {(viewProduct.additional_images || []).map((img) => (
                  <Box key={img.id} component="img" src={getMediaUrl(img.image)} alt="" sx={{ width: 64, height: 64, objectFit: 'cover', border: 1, borderColor: 'divider' }} />
                ))}
              </Box>
              <Typography variant="body2"><strong>Vendor:</strong> {viewProduct.vendor_name}</Typography>
              <Typography variant="body2"><strong>Price:</strong> ${Number(viewProduct.price).toFixed(2)} {viewProduct.compare_at_price && <Typography component="span" color="text.secondary" sx={{ textDecoration: 'line-through', ml: 1 }}>${Number(viewProduct.compare_at_price).toFixed(2)}</Typography>}</Typography>
              <Typography variant="body2"><strong>Stock:</strong> {viewProduct.stock}</Typography>
              <Typography variant="body2"><strong>Description:</strong></Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{viewProduct.description}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewProduct?.is_approved && (
            <>
              <Button size="small" onClick={() => updateProduct(viewProduct.id, { is_active: !viewProduct.is_active })} startIcon={viewProduct.is_active ? <VisibilityOffIcon /> : <VisibilityIcon />}>
                {viewProduct.is_active ? 'Hide' : 'Show'}
              </Button>
              <Button size="small" onClick={() => updateProduct(viewProduct.id, { is_featured: !viewProduct.is_featured })} startIcon={viewProduct.is_featured ? <StarBorderIcon /> : <StarIcon />}>
                {viewProduct.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
            </>
          )}
          {viewProduct?.is_approved ? (
            <Button color="error" startIcon={<CancelIcon />} onClick={() => { setApproved(viewProduct.id, false); setViewProduct(null); }}>Reject</Button>
          ) : (
            <Button color="success" startIcon={<CheckCircleIcon />} onClick={() => { setApproved(viewProduct.id, true); setViewProduct(null); }}>Approve</Button>
          )}
          <Button onClick={() => setViewProduct(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
