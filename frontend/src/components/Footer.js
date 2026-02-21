import { Link } from 'react-router-dom';
import { Box, Container, Typography, Link as MuiLink, Divider } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useAuth } from '../context/AuthContext';

function Footer() {
  const { user } = useAuth();
  const footerLinks = [
    { to: '/products', label: 'Products' },
    ...(!user ? [{ to: '/register', label: 'Create Account' }] : []),
    { to: '/vendor/register', label: 'Sell with Us' },
  ];
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 5,
        px: 2,
        backgroundColor: 'primary.main',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StorefrontIcon sx={{ fontSize: 32 }} />
              <Typography variant="h6" fontWeight="bold">EShop</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 280 }}>
              Your trusted multi-vendor marketplace. Browse, compare, and buy from hundreds of sellers in one place.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>Quick Links</Typography>
            {footerLinks.map(({ to, label }) => (
              <Box key={to} sx={{ mb: 0.75 }}>
                <MuiLink component={Link} to={to} color="inherit" underline="hover" sx={{ opacity: 0.9 }}>
                  {label}
                </MuiLink>
              </Box>
            ))}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>Follow Us</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <MuiLink href="#" color="inherit" sx={{ opacity: 0.9 }}><FacebookIcon /></MuiLink>
              <MuiLink href="#" color="inherit" sx={{ opacity: 0.9 }}><TwitterIcon /></MuiLink>
              <MuiLink href="#" color="inherit" sx={{ opacity: 0.9 }}><InstagramIcon /></MuiLink>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', my: 3 }} />
        <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} EShop. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
