import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import api, { getMediaUrl } from '../../api/axios';

export default function VendorProducts({ vendorStatus }) {
  const isApproved = vendorStatus === 'APPROVED';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', image: null, tax_percent: '', discount_percent: '', shipping_fee: '', brand: '', about_this_item: '', technical_specs_raw: '', compare_at_price: '', color: '', size: '', dimension: '', weight: '' });
  const [additionalImages, setAdditionalImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const fetchProducts = () => api.get('/products/vendor/products/').then((r) => setProducts(r.data.results || r.data));
  const fetchCategories = () => api.get('/products/categories/').then((r) => setCategories(r.data.results || r.data));

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleOpen = (p = null) => {
    if (p) {
      setEditing(p.id);
      const techRaw = p.technical_specs && typeof p.technical_specs === 'object' ? Object.entries(p.technical_specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
      setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category || '', image: null, tax_percent: p.tax_percent ?? '', discount_percent: p.discount_percent ?? '', shipping_fee: p.shipping_fee ?? '', brand: p.brand ?? '', about_this_item: p.about_this_item ?? '', technical_specs_raw: techRaw, compare_at_price: p.compare_at_price ?? '', color: p.color ?? '', size: p.size ?? '', dimension: p.dimension ?? '', weight: p.weight ?? '' });
      setAdditionalImages([]);
      setImagesToDelete([]);
    } else {
      setEditing(null);
      setForm({ name: '', description: '', price: '', stock: '', category: '', image: null, tax_percent: '', discount_percent: '', shipping_fee: '', brand: '', about_this_item: '', technical_specs_raw: '', compare_at_price: '', color: '', size: '', dimension: '', weight: '' });
      setAdditionalImages([]);
      setImagesToDelete([]);
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleChange = (e) => {
    if (e.target.name === 'image') setForm((f) => ({ ...f, image: e.target.files[0] }));
    else if (e.target.name === 'additional_images') setAdditionalImages(Array.from(e.target.files || []));
    else setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const removeExistingImage = (id) => setImagesToDelete((prev) => [...prev, id]);
  const removeNewImage = (idx) => setAdditionalImages((prev) => prev.filter((_, i) => i !== idx));

  const uploadAdditionalImages = async (productId, files) => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('image', f));
    await api.post(`/products/vendor/products/${productId}/images/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    ['name', 'description', 'price', 'stock', 'tax_percent', 'discount_percent', 'shipping_fee', 'brand', 'about_this_item', 'compare_at_price', 'color', 'size', 'dimension', 'weight'].forEach((k) => form[k] !== undefined && form[k] !== '' && data.append(k, form[k]));
    if (form.technical_specs_raw) {
      const specs = {};
      form.technical_specs_raw.split('\n').forEach((line) => {
        const i = line.indexOf(':');
        if (i > 0) { const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim(); if (k && v) specs[k] = v; }
      });
      if (Object.keys(specs).length > 0) data.append('technical_specs', JSON.stringify(specs));
    }
    if (form.category) data.append('category', form.category);
    if (form.image) data.append('image', form.image);
    try {
      let productId = editing;
      if (editing) {
        await api.patch(`/products/vendor/products/${editing}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        for (const id of imagesToDelete) {
          await api.delete(`/products/vendor/products/${editing}/images/${id}/`);
        }
        await uploadAdditionalImages(editing, additionalImages);
      } else {
        const res = await api.post('/products/vendor/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        productId = res.data?.id;
        if (productId) await uploadAdditionalImages(productId, additionalImages);
      }
      fetchProducts();
      handleClose();
    } catch (err) {
      setApiError(err.response?.data?.detail || err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product? This cannot be undone.')) {
      api.delete(`/products/vendor/products/${id}/`).then(fetchProducts).catch((err) => setApiError(err.response?.data?.detail || 'Failed to delete'));
    }
  };
  const handleStopSelling = (id, isActive) => {
    api.patch(`/products/vendor/products/${id}/`, { is_active: isActive }).then(fetchProducts);
  };

  return (
    <Box>
      {apiError && <Alert severity="error" onClose={() => setApiError('')} sx={{ mb: 2 }}>{apiError}</Alert>}
      {!isApproved && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your vendor account is pending approval. You cannot add, edit, or delete products until an admin approves your account.
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My Products</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpen()} disabled={!isApproved}>Add Product</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Status</TableCell>
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
                <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>
                  <Chip label={p.is_active ? 'Selling' : 'Stopped'} size="small" color={p.is_active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleStopSelling(p.id, !p.is_active)} disabled={!isApproved} sx={{ mr: 0.5 }}>
                    {p.is_active ? 'Stop selling' : 'Resume'}
                  </Button>
                  <IconButton size="small" onClick={() => handleOpen(p)} disabled={!isApproved}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)} disabled={!isApproved}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField fullWidth name="name" label="Name" value={form.name} onChange={handleChange} required margin="dense" />
            <TextField fullWidth name="description" label="Description" multiline rows={3} value={form.description} onChange={handleChange} margin="dense" />
            <TextField fullWidth name="price" label="Price" type="number" step="0.01" value={form.price} onChange={handleChange} required margin="dense" />
            <TextField fullWidth name="compare_at_price" label="Compare at price (original, for discount display)" type="number" step="0.01" value={form.compare_at_price} onChange={handleChange} margin="dense" placeholder="Optional" />
            <TextField fullWidth name="stock" label="Stock" type="number" value={form.stock} onChange={handleChange} required margin="dense" />
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select name="category" label="Category" value={form.category} onChange={handleChange}>
                <MenuItem value="">--</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <TextField name="tax_percent" label="Tax %" type="number" size="small" inputProps={{ min: 0, max: 100, step: 0.5 }} value={form.tax_percent} onChange={handleChange} sx={{ minWidth: 100 }} placeholder="Vendor default" />
              <TextField name="discount_percent" label="Discount %" type="number" size="small" inputProps={{ min: 0, max: 100, step: 0.5 }} value={form.discount_percent} onChange={handleChange} sx={{ minWidth: 100 }} placeholder="0" />
              <TextField name="shipping_fee" label="Shipping ($)" type="number" size="small" inputProps={{ min: 0, step: 0.01 }} value={form.shipping_fee} onChange={handleChange} sx={{ minWidth: 100 }} placeholder="Vendor default" />
            </Box>
            <TextField fullWidth name="brand" label="Brand" value={form.brand} onChange={handleChange} margin="dense" placeholder="e.g. Amazon Basics" />
            <TextField fullWidth name="about_this_item" label="About this item (one bullet per line)" multiline rows={4} value={form.about_this_item} onChange={handleChange} margin="dense" placeholder={"Full HD monitor with 1920x1080 resolution\nIPS panel technology\nIncludes HDMI cable and stand"} />
            <TextField fullWidth name="technical_specs_raw" label="Technical specs (one per line: Label: Value)" multiline rows={3} value={form.technical_specs_raw} onChange={handleChange} margin="dense" placeholder={"Size: 24 Inch\nResolution: 1080p\nBrand: Amazon Basics"} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <TextField fullWidth name="color" label="Color" value={form.color} onChange={handleChange} margin="dense" placeholder="e.g. Black" />
              <TextField fullWidth name="size" label="Size(s)" value={form.size} onChange={handleChange} margin="dense" placeholder="S, M, L or 10, 12" />
              <TextField fullWidth name="dimension" label="Dimension" value={form.dimension} onChange={handleChange} margin="dense" placeholder="24 x 18 x 6 inches" />
              <TextField fullWidth name="weight" label="Weight" value={form.weight} onChange={handleChange} margin="dense" placeholder="2.5 kg" />
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Main image</Typography>
            {editing && products.find((x) => x.id === editing)?.image && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Current:</Typography>
                <Box component="img" src={getMediaUrl(products.find((x) => x.id === editing).image)} alt="" sx={{ display: 'block', width: 120, height: 120, objectFit: 'contain', border: 1, borderColor: 'divider', borderRadius: 0.5, mt: 0.5 }} />
              </Box>
            )}
            <TextField fullWidth name="image" type="file" inputProps={{ accept: 'image/*' }} onChange={handleChange} margin="dense" helperText={editing ? 'Leave empty to keep current image' : ''} />
            {editing && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Additional images (click X to remove)</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                  {products.find((x) => x.id === editing)?.additional_images?.filter((img) => !imagesToDelete.includes(img.id)).map((img) => (
                    <Box key={img.id} sx={{ position: 'relative' }}>
                      <Box component="img" src={getMediaUrl(img.image)} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 0.5, border: 1, borderColor: 'divider' }} />
                      <IconButton size="small" onClick={() => removeExistingImage(img.id)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'grey.200' } }}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Box>
              </>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Add more images</Typography>
            <TextField fullWidth name="additional_images" type="file" inputProps={{ accept: 'image/*', multiple: true }} onChange={handleChange} margin="dense" />
            {additionalImages.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {additionalImages.map((f, i) => (
                  <Chip key={i} label={f.name} size="small" onDelete={() => removeNewImage(i)} />
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
