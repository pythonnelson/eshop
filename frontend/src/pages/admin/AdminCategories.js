import { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_active: true });

  const fetchCategories = () => api.get('/admin/categories/').then((r) => setCategories(r.data.results || r.data));

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpen = (c = null) => {
    if (c) {
      setEditing(c.id);
      setForm({ name: c.name, description: c.description || '', is_active: c.is_active });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', is_active: true });
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) api.patch(`/admin/categories/${editing}/`, form).then(fetchCategories);
    else api.post('/admin/categories/', form).then(fetchCategories);
    handleClose();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this category?')) api.delete(`/admin/categories/${id}/`).then(fetchCategories);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Categories</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpen()}>Add Category</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.description || '-'}</TableCell>
                <TableCell>{c.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(c)}><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField fullWidth name="name" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required margin="dense" />
            <TextField fullWidth name="description" label="Description" multiline value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} margin="dense" />
            {editing && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Active</InputLabel>
                <Select label="Active" value={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}>
                  <MenuItem value>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
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
