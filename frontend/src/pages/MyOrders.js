import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import api from '../api/axios';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/orders/').then((r) => {
      setOrders(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Orders</Typography>
      {orders.length === 0 ? (
        <Typography color="text.secondary">No orders yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link to={`/my-orders/${o.id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                      {o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(o.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Chip label={o.status} size="small" color={o.status === 'DELIVERED' ? 'success' : 'default'} /></TableCell>
                  <TableCell><Chip label={o.payment_status} size="small" /></TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/my-orders/${o.id}`} size="small">View</Button>
                    {o.status === 'DELIVERED' && (
                      <Button component={Link} to={`/my-orders/${o.id}`} size="small" startIcon={<PrintIcon />}>
                        Receipt
                      </Button>
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
