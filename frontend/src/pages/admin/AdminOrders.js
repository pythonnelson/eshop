import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import api from '../../api/axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders/').then((r) => {
      setOrders(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>All Orders</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
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
                <TableCell><Chip label={o.payment_status} size="small" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
