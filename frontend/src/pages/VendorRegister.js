import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Grid,
  CircularProgress,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import api from '../api/axios';

export default function VendorRegister() {
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '', phone: '',
    store_name: '', business_name: '', business_email: '', business_phone: '',
    address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '',
    business_description: '', tax_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/vendors/register/', form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ maxWidth: 440, mx: 'auto', mt: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success">Vendor registered. Awaiting admin approval. Redirecting to login...</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2, mb: 5 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom align="center" color="primary">
        Vendor Registration
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        Join our marketplace and start selling to thousands of customers.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6" color="primary">Account details</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="email" label="Email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="password" label="Password" type="password" value={form.password} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="first_name" label="First name" value={form.first_name} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="last_name" label="Last name" value={form.last_name} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="phone" label="Phone" value={form.phone} onChange={handleChange} disabled={loading} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" color="primary">Store & business</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="store_name" label="Store name" value={form.store_name} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="business_name" label="Business name" value={form.business_name} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="business_email" label="Business email" type="email" value={form.business_email} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="business_phone" label="Business phone" value={form.business_phone} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="business_description" label="Business description" multiline rows={2} value={form.business_description} onChange={handleChange} disabled={loading} placeholder="Short description of your business" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="tax_id" label="Tax ID (optional)" value={form.tax_id} onChange={handleChange} disabled={loading} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOnIcon color="primary" />
            <Typography variant="h6" color="primary">Address</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth name="address_line1" label="Address line 1" value={form.address_line1} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="address_line2" label="Address line 2 (optional)" value={form.address_line2} onChange={handleChange} disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="city" label="City" value={form.city} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="state" label="State / Region" value={form.state} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="country" label="Country" value={form.country} onChange={handleChange} required disabled={loading} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth name="postal_code" label="Postal code" value={form.postal_code} onChange={handleChange} required disabled={loading} />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 4, py: 1.5 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={22} color="inherit" /> : null}
          >
            {loading ? 'Registering...' : 'Register as Vendor'}
          </Button>
        </form>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'inherit' }}>Back to Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
