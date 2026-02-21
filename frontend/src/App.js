import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import CheckoutGate from './components/CheckoutGate';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorRegister from './pages/VendorRegister';
import Profile from './pages/Profile';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import CustomerDashboard from './pages/customer/CustomerDashboard';

import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorProfile from './pages/vendor/VendorProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import { NotificationProvider } from './context/NotificationContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#232f3e' },
    secondary: { main: '#ff9900' },
    background: { default: '#eaeded' },
  },
  components: {
    MuiContainer: { styleOverrides: { root: { maxWidth: '100%' } } },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/vendor/register" element={<Layout><VendorRegister /></Layout>} />
            <Route path="/products" element={<Layout><ProductList /></Layout>} />
            <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />

            <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
            <Route path="/customer" element={<Layout><ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />
            <Route path="/checkout" element={<Layout><CheckoutGate><Checkout /></CheckoutGate></Layout>} />
            <Route path="/my-orders" element={<Layout><ProtectedRoute allowedRoles={['CUSTOMER']}><MyOrders /></ProtectedRoute></Layout>} />
            <Route path="/my-orders/:id" element={<Layout><ProtectedRoute allowedRoles={['CUSTOMER']}><OrderDetail /></ProtectedRoute></Layout>} />

            <Route path="/vendor" element={<Layout><ProtectedRoute allowedRoles={['VENDOR']}><VendorDashboard /></ProtectedRoute></Layout>} />
            <Route path="/vendor/products" element={<Layout><ProtectedRoute allowedRoles={['VENDOR']}><VendorProducts /></ProtectedRoute></Layout>} />
            <Route path="/vendor/orders" element={<Layout><ProtectedRoute allowedRoles={['VENDOR']}><VendorOrders /></ProtectedRoute></Layout>} />
            <Route path="/vendor/profile" element={<Layout><ProtectedRoute allowedRoles={['VENDOR']}><VendorProfile /></ProtectedRoute></Layout>} />

            <Route path="/admin" element={<Layout><ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute></Layout>} />
            <Route path="/admin/users" element={<Layout><ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute></Layout>} />
            <Route path="/admin/vendors" element={<Layout><ProtectedRoute allowedRoles={['ADMIN']}><AdminVendors /></ProtectedRoute></Layout>} />
            <Route path="/admin/categories" element={<Layout><ProtectedRoute allowedRoles={['ADMIN']}><AdminCategories /></ProtectedRoute></Layout>} />
            <Route path="/admin/products" element={<Layout><ProtectedRoute allowedRoles={['ADMIN']}><AdminProducts /></ProtectedRoute></Layout>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
