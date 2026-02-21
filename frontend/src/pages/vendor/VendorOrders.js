import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Select, MenuItem } from '@mui/material';
import api from '../../api/axios';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/vendor/orders/').then((r) => {
      setOrders(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateStatus = (orderId, status) => {
    api.patch(`/orders/orders/${orderId}/status/`, { status }).then(() => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    });
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Orders (Sales)</Typography>
      {orders.length === 0 ? (
        <Typography color="text.secondary">No orders containing your products yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Update</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.order_number}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(o.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Chip label={o.status} size="small" /></TableCell>
                  <TableCell>
                    {o.status === 'DELIVERED' ? (
                      <Chip label="Delivered" size="small" color="success" />
                    ) : (
                      <Select size="small" value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} sx={{ minWidth: 120 }}>
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
