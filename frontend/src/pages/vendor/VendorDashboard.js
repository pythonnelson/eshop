import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../../api/axios';
import VendorProducts from './VendorProducts';
import VendorOrders from './VendorOrders';
import VendorProfile from './VendorProfile';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const CHART_TYPES = [
  { value: 'line', label: 'Line', icon: <ShowChartIcon /> },
  { value: 'bar', label: 'Bar', icon: <BarChartIcon /> },
  { value: 'pie', label: 'Pie', icon: <PieChartIcon /> },
  { value: 'doughnut', label: 'Doughnut', icon: <BarChartIcon /> },
];

const quickActions = [
  { key: 'overview', label: 'Overview', icon: <TrendingUpIcon /> },
  { key: 'products', label: 'Products', icon: <InventoryIcon /> },
  { key: 'orders', label: 'Orders', icon: <ShoppingBagIcon /> },
  { key: 'profile', label: 'Profile', icon: <StorefrontIcon /> },
];

export default function VendorDashboard() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [dataSelection, setDataSelection] = useState('products');
  const [chartType, setChartType] = useState('line');

  const fetchData = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      api.get('/vendors/profile/').then((r) => r.data),
      api.get('/orders/vendor/orders/').then((r) => r.data.results || r.data),
      api.get('/vendors/stats/?days=30').then((r) => r.data).catch(() => null),
    ])
      .then(([p, o, s]) => {
        setProfile(p);
        setOrders(Array.isArray(o) ? o : []);
        setStats(s || {});
      })
      .catch(() => {})
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (stats?.orders_series?.length > 0 && dataSelection === 'products' && (!stats?.products_series?.length)) {
      setDataSelection('revenue');
    }
  }, [stats, dataSelection]);

  if (loading || !profile) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  const statusColor = profile.status === 'APPROVED' ? 'success' : profile.status === 'SUSPENDED' ? 'error' : 'warning';
  const recentOrders = orders.slice(0, 10);
  const itemSales = stats?.item_sales ?? 0;
  const revenue = stats?.revenue ?? 0;
  const itemsInStock = stats?.items_in_stock ?? 0;
  const categories = stats?.categories ?? [];
  const stockRunningLow = stats?.stock_running_low ?? [];
  const productsSeries = stats?.products_series ?? [];
  const ordersSeries = stats?.orders_series ?? [];

  const statCards = [
    {
      key: 'products',
      label: 'Total Products',
      count: profile.total_products ?? 0,
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
    },
    {
      key: 'item_sales',
      label: 'Items Sold',
      count: itemSales,
      icon: <ShoppingBagIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      count: `$${Number(revenue).toFixed(2)}`,
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #e68a00 0%, #ff9900 100%)',
    },
    {
      key: 'stock',
      label: 'Items in Stock',
      count: itemsInStock,
      icon: <StorefrontIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #232f3e 0%, #131921 100%)',
    },
  ];

  const isTimeSeries = ['line', 'bar'].includes(chartType);
  const baseOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' } } };

  let chartData = null;
  if (isTimeSeries && dataSelection === 'products' && productsSeries.length > 0) {
    chartData = {
      labels: productsSeries.map((d) => d.date),
      datasets: [
        {
          label: 'Products',
          data: productsSeries.map((d) => d.count),
          borderColor: '#1976d2',
          backgroundColor: '#1976d240',
          fill: chartType === 'line',
          tension: 0.3,
        },
      ],
    };
  } else if (isTimeSeries && dataSelection === 'revenue' && ordersSeries.length > 0) {
    chartData = {
      labels: ordersSeries.map((d) => d.date),
      datasets: [
        {
          label: 'Revenue ($)',
          data: ordersSeries.map((d) => d.revenue),
          borderColor: '#ff9900',
          backgroundColor: '#ff990040',
          fill: chartType === 'line',
          tension: 0.3,
        },
      ],
    };
  } else if (isTimeSeries && dataSelection === 'sales' && ordersSeries.length > 0) {
    chartData = {
      labels: ordersSeries.map((d) => d.date),
      datasets: [
        {
          label: 'Items Sold',
          data: ordersSeries.map((d) => d.items),
          borderColor: '#2e7d32',
          backgroundColor: '#2e7d3240',
          fill: chartType === 'line',
          tension: 0.3,
        },
      ],
    };
  } else if ((chartType === 'pie' || chartType === 'doughnut') && categories.length > 0) {
    const colors = ['#1976d2', '#ff9900', '#2e7d32', '#232f3e', '#9c27b0'];
    chartData = {
      labels: categories.map((c) => c.name),
      datasets: [
        {
          data: categories.map((c) => c.count),
          backgroundColor: categories.map((_, i) => colors[i % colors.length] + 'cc'),
          borderColor: categories.map((_, i) => colors[i % colors.length]),
          borderWidth: 1,
        },
      ],
    };
  }

  const renderChart = () => {
    if (!chartData) return <Typography color="text.secondary">No chart data available</Typography>;
    if (chartType === 'pie') return <Pie data={chartData} options={baseOptions} />;
    if (chartType === 'doughnut') return <Doughnut data={chartData} options={baseOptions} />;
    if (chartType === 'bar') return <Bar data={chartData} options={{ ...baseOptions, scales: { y: { beginAtZero: true } } }} />;
    return <Line data={chartData} options={{ ...baseOptions, scales: { y: { beginAtZero: true } } }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Vendor Dashboard</Typography>
          <Typography color="text.secondary">{profile.store_name}</Typography>
          <Chip label={profile.status} color={statusColor} size="small" sx={{ mt: 1 }} />
        </Box>
      </Box>

      {stockRunningLow.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          {stockRunningLow.length} product(s) running low on stock: {stockRunningLow.map((p) => `${p.name} (${p.stock})`).join(', ')}
        </Alert>
      )}

      {/* Stat cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Card key={s.key} sx={{ background: s.gradient, color: 'white', minHeight: 120, flex: '1 1 180px' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">{s.count}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{s.label}</Typography>
              </Box>
              <Box sx={{ opacity: 0.8 }}>{s.icon}</Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Main content + Quick Actions row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <Paper sx={{ flex: '1 1 600px', minWidth: 0, p: 2, overflow: 'auto' }}>
          {activeView === 'overview' && (
            <>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>Analytics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Data</InputLabel>
                    <Select value={dataSelection} label="Data" onChange={(e) => setDataSelection(e.target.value)}>
                      <MenuItem value="products">Products</MenuItem>
                      <MenuItem value="revenue">Revenue</MenuItem>
                      <MenuItem value="sales">Items Sold</MenuItem>
                    </Select>
                  </FormControl>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Chart Type</Typography>
                    <ToggleButtonGroup value={chartType} exclusive onChange={(_, v) => v && setChartType(v)} size="small">
                      {CHART_TYPES.map((t) => (
                        <ToggleButton key={t.value} value={t.value} aria-label={t.label}>{t.icon}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                </Box>
                <Box sx={{ height: 320 }}>{renderChart()}</Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>Recent Orders</Typography>
              {recentOrders.length === 0 ? (
                <Typography color="text.secondary">No orders yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.order_number}</TableCell>
                        <TableCell>{o.customer_name}</TableCell>
                        <TableCell>${Number(o.total_amount).toFixed(2)}</TableCell>
                        <TableCell><Chip label={o.status} size="small" /></TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              </Paper>
            </>
          )}
          {activeView === 'products' && <VendorProducts vendorStatus={profile?.status} />}
          {activeView === 'orders' && <VendorOrders />}
          {activeView === 'profile' && <VendorProfile />}
        </Paper>

        <Paper sx={{ p: 2, flexShrink: 0, width: 'fit-content', minWidth: 220 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon /> Quick Actions
          </Typography>
          {categories.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Categories: {categories.map((c) => `${c.name} (${c.count})`).join(', ')}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {quickActions.map(({ key, label, icon }) => (
              <Box
                key={key}
                component="button"
                onClick={() => setActiveView(key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1.5,
                  px: 2,
                  width: '100%',
                  border: '1px solid',
                  borderColor: activeView === key ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: activeView === key ? 'primary.main' : 'transparent',
                  color: activeView === key ? 'white' : 'text.primary',
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  '&:hover': { bgcolor: activeView === key ? 'primary.dark' : 'action.hover' },
                }}
              >
                {icon}
                {label}
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
