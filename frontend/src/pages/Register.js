import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', phone: '', password: '', password_confirm: '', user_type: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || '',
        password: form.password,
        password_confirm: form.password_confirm,
      });
      navigate('/');
    } catch (err) {
      const d = err.response?.data;
      const msg = d?.email?.[0] || d?.password?.[0] || d?.password_confirm?.[0] || (typeof d === 'object' && d?.detail) || (typeof d === 'string' ? d : 'Registration failed');
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Register (Customer)</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth name="email" label="Email" type="email" value={form.email} onChange={handleChange} margin="normal" required disabled={loading} />
          <TextField fullWidth name="first_name" label="First name" value={form.first_name} onChange={handleChange} margin="normal" required disabled={loading} />
          <TextField fullWidth name="last_name" label="Last name" value={form.last_name} onChange={handleChange} margin="normal" required disabled={loading} />
          <TextField fullWidth name="phone" label="Phone" value={form.phone} onChange={handleChange} margin="normal" disabled={loading} />
          <TextField fullWidth name="password" label="Password" type="password" value={form.password} onChange={handleChange} margin="normal" required disabled={loading} />
          <TextField fullWidth name="password_confirm" label="Confirm password" type="password" value={form.password_confirm} onChange={handleChange} margin="normal" required disabled={loading} />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <Typography sx={{ mt: 2 }}>Already have an account? <Link to="/login">Login</Link></Typography>
      </Paper>
    </Box>
  );
}
