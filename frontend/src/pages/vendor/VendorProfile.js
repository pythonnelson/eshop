import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PercentIcon from '@mui/icons-material/Percent';
import api from '../../api/axios';

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vendors/profile/').then((r) => {
      setProfile(r.data);
      setForm({
        store_name: r.data.store_name,
        business_name: r.data.business_name,
        business_email: r.data.business_email,
        business_phone: r.data.business_phone,
        address_line1: r.data.address_line1,
        address_line2: r.data.address_line2 || '',
        city: r.data.city,
        state: r.data.state,
        country: r.data.country,
        postal_code: r.data.postal_code,
        business_description: r.data.business_description || '',
        tax_percent: r.data.tax_percent ?? 10,
        default_discount_percent: r.data.default_discount_percent ?? 0,
        default_shipping_fee: r.data.default_shipping_fee ?? 10,
      });
    }).catch(() => setProfile(null));
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    api.patch('/vendors/profile/', form)
      .then(() => setSaved(true))
      .catch((err) => setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to save'));
  };

  if (!profile) return <Typography>Loading...</Typography>;

  const statusColor = profile.status === 'APPROVED' ? 'success' : profile.status === 'SUSPENDED' ? 'error' : 'warning';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Vendor Profile</Typography>
          <Chip label={profile.status} color={statusColor} size="small" sx={{ mt: 0.5 }} />
        </Box>
        {saved && <Alert severity="success" sx={{ py: 0 }}>Profile saved successfully.</Alert>}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        {/* Store Information */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StorefrontIcon color="primary" />
            <Typography variant="h6" fontWeight="600">Store Information</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth name="store_name" label="Store name" value={form.store_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth name="business_name" label="Business name" value={form.business_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="business_description" label="Business description" multiline rows={3} value={form.business_description} onChange={handleChange} placeholder="Tell customers about your store" />
            </Grid>
          </Grid>
        </Paper>

        {/* Contact Information */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ContactPhoneIcon color="primary" />
            <Typography variant="h6" fontWeight="600">Contact Information</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth name="business_email" label="Business email" type="email" value={form.business_email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth name="business_phone" label="Business phone" value={form.business_phone} onChange={handleChange} required />
            </Grid>
          </Grid>
        </Paper>

        {/* Address */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOnIcon color="primary" />
            <Typography variant="h6" fontWeight="600">Business Address</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth name="address_line1" label="Address line 1" value={form.address_line1} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth name="address_line2" label="Address line 2 (optional)" value={form.address_line2} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth name="city" label="City" value={form.city} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth name="state" label="State" value={form.state} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth name="country" label="Country" value={form.country} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth name="postal_code" label="Postal code" value={form.postal_code} onChange={handleChange} required />
            </Grid>
          </Grid>
        </Paper>

        {/* Tax & Shipping Settings */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PercentIcon color="primary" />
            <Typography variant="h6" fontWeight="600">Tax, Discount & Shipping</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure default rates applied to your products. These can be overridden per product.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="tax_percent" label="Tax percent" type="number" inputProps={{ min: 0, max: 100, step: 0.5 }} value={form.tax_percent} onChange={handleChange} helperText="Rate applied to products" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="default_discount_percent" label="Discount percent" type="number" inputProps={{ min: 0, max: 100, step: 0.5 }} value={form.default_discount_percent} onChange={handleChange} helperText="Default discount" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth name="default_shipping_fee" label="Shipping fee (USD)" type="number" inputProps={{ min: 0, step: 0.01 }} value={form.default_shipping_fee} onChange={handleChange} helperText="Default delivery cost" />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" size="large">
            Save Profile
          </Button>
        </Box>
      </form>
    </Box>
  );
}
