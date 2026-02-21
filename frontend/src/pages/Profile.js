import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
  }, [user]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    api.patch('/auth/profile/', form).then((r) => {
      updateUser(r.data);
      setSaved(true);
    });
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      <Typography color="text.secondary">{user.email}</Typography>
      {saved && <Typography color="success.main">Saved.</Typography>}
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth name="first_name" label="First name" value={form.first_name} onChange={handleChange} margin="normal" />
          <TextField fullWidth name="last_name" label="Last name" value={form.last_name} onChange={handleChange} margin="normal" />
          <TextField fullWidth name="phone" label="Phone" value={form.phone} onChange={handleChange} margin="normal" />
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>Save</Button>
        </form>
      </Paper>
    </Box>
  );
}
