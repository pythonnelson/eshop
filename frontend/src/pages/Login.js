import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || location.search?.replace(/^\?returnTo=/, '') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const path = from && from !== '/' ? from : (
        data?.user?.user_type === 'ADMIN' ? '/admin' :
        data?.user?.user_type === 'VENDOR' ? '/vendor' :
        data?.user?.user_type === 'CUSTOMER' ? '/' : from || '/'
      );
      navigate(path, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required disabled={loading} />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required disabled={loading} />
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <Typography sx={{ mt: 2 }}>Don&apos;t have an account? <Link to="/register">Register</Link></Typography>
        <Typography><Link to="/vendor/register">Register as Vendor</Link></Typography>
      </Paper>
    </Box>
  );
}
