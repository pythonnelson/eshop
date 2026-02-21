import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api, { getMediaUrl } from '../../api/axios';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', image: null, tax_percent: '', discount_percent: '', shipping_fee: '' });

  const fetchProducts = () => api.get('/products/vendor/products/').then((r) => setProducts(r.data.results || r.data));
  const fetchCategories = () => api.get('/products/categories/').then((r) => setCategories(r.data.results || r.data));

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleOpen = (p = null) => {
    if (p) {
      setEditing(p.id);
      setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category || '', image: null, tax_percent: p.tax_percent ?? '', discount_percent: p.discount_percent ?? '', shipping_fee: p.shipping_fee ?? '' });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', price: '', stock: '', category: '', image: null, tax_percent: '', discount_percent: '', shipping_fee: '' });
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleChange = (e) => {
    if (e.target.name === 'image') setForm((f) => ({ ...f, image: e.target.files[0] }));
    else setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    ['name', 'description', 'price', 'stock', 'tax_percent', 'discount_percent', 'shipping_fee'].forEach((k) => form[k] !== undefined && form[k] !== '' && data.append(k, form[k]));
    if (form.category) data.append('category', form.category);
    if (form.image) data.append('image', form.image);
    if (editing) {
      api.patch(`/products/vendor/products/${editing}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(fetchProducts).catch(() => {});
    } else {
      api.post('/products/vendor/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(fetchProducts).catch(() => {});
    }
    handleClose();
  };

  const handleDelete = (id) => { if (window.confirm('Delete this product?')) api.delete(`/products/vendor/products/${id}/`).then(fetchProducts); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My Products</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpen()}>Add Product</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
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
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(p)}><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
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
            <TextField fullWidth name="image" type="file" inputProps={{ accept: 'image/*' }} onChange={handleChange} margin="dense" sx={{ mt: 1 }} />
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
