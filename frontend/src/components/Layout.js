import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Store';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { useCart } from '../context/CartContext';
import Footer from './Footer';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { guestCartCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [serverCartCount, setServerCartCount] = useState(0);

  useEffect(() => {
    if (user?.user_type === 'CUSTOMER') {
      api.get('/orders/cart/').then((r) => {
        const items = r.data?.items || [];
        setServerCartCount(items.reduce((s, i) => s + (i.quantity || 0), 0));
      }).catch(() => setServerCartCount(0));
    } else {
      setServerCartCount(0);
    }
  }, [user?.user_type, user?.id]);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/');
  };

  const cartCount = user?.user_type === 'CUSTOMER' ? serverCartCount : (!user ? guestCartCount : 0);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#232f3e' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ flexWrap: 'wrap', gap: 1, py: 1 }}>
            <StoreIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 0.5 }} />
            <Typography variant="h6" noWrap component={Link} to="/" sx={{ display: { xs: 'none', md: 'flex' }, fontWeight: 700, color: 'inherit', textDecoration: 'none', mr: 2 }}>
              EShop
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton size="large" onClick={handleOpenNavMenu} color="inherit"><MenuIcon /></IconButton>
              <Menu anchorEl={anchorElNav} open={Boolean(anchorElNav)} onClose={handleCloseNavMenu} sx={{ display: { xs: 'block', md: 'none' } }}>
                {!user && (
                  <>
                    <MenuItem onClick={() => { navigate('/'); handleCloseNavMenu(); }}><Typography>Home</Typography></MenuItem>
                    <MenuItem onClick={() => { navigate('/products'); handleCloseNavMenu(); }}><Typography>Products</Typography></MenuItem>
                    <MenuItem onClick={() => { navigate('/cart'); handleCloseNavMenu(); }}>Cart {cartCount > 0 && `(${cartCount})`}</MenuItem>
                  </>
                )}
                {user?.user_type === 'CUSTOMER' && (
                  <>
                    <MenuItem onClick={() => { navigate('/'); handleCloseNavMenu(); }}>Home</MenuItem>
                    <MenuItem onClick={() => { navigate('/products'); handleCloseNavMenu(); }}>Products</MenuItem>
                    <MenuItem onClick={() => { navigate('/cart'); handleCloseNavMenu(); }}>Cart {cartCount > 0 && `(${cartCount})`}</MenuItem>
                    <MenuItem onClick={() => { navigate('/customer'); handleCloseNavMenu(); }}>My Account</MenuItem>
                    <MenuItem onClick={() => { navigate('/my-orders'); handleCloseNavMenu(); }}>My Orders</MenuItem>
                  </>
                )}
                {user?.user_type === 'VENDOR' && (
                  <MenuItem onClick={() => { navigate('/vendor'); handleCloseNavMenu(); }}>Dashboard</MenuItem>
                )}
                {user?.user_type === 'ADMIN' && (
                  <MenuItem onClick={() => { navigate('/admin'); handleCloseNavMenu(); }}>Dashboard</MenuItem>
                )}
              </Menu>
            </Box>
            <StoreIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 0.5 }} />
            <Typography variant="h6" noWrap component={Link} to="/" sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>EShop</Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, maxWidth: 600, minWidth: 120, display: 'flex' }}>
              <TextField
                size="small"
                placeholder="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, bgcolor: 'white', borderRadius: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                InputProps={{ endAdornment: <InputAdornment position="end"><IconButton type="submit" sx={{ color: '#232f3e' }}><SearchIcon /></IconButton></InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationBell />
                {user ? (
                  <>
                    <IconButton onClick={handleOpenUserMenu} sx={{ color: 'white' }}>
                      <PersonIcon />
                    </IconButton>
                    <Menu anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}>
                      {user?.user_type === 'VENDOR' && (
                        <MenuItem onClick={() => { navigate('/vendor'); handleCloseUserMenu(); }}>Dashboard</MenuItem>
                      )}
                      {user?.user_type === 'ADMIN' && (
                        <MenuItem onClick={() => { navigate('/admin'); handleCloseUserMenu(); }}>Dashboard</MenuItem>
                      )}
                      <MenuItem onClick={() => { navigate(user.user_type === 'VENDOR' ? '/vendor/profile' : '/profile'); handleCloseUserMenu(); }}>Profile</MenuItem>
                      {user?.user_type === 'CUSTOMER' && (
                        <MenuItem onClick={() => { navigate('/cart'); handleCloseUserMenu(); }}>Cart {cartCount > 0 && `(${cartCount})`}</MenuItem>
                      )}
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button component={Link} to="/login" sx={{ color: 'white' }}>Sign in</Button>
                    <Button component={Link} to="/register" sx={{ color: 'white' }}>Register</Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 }, minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
        <Container maxWidth="xl" sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>{children}</Container>
      </Box>
      <Footer />
    </>
  );
}

export default Layout;
