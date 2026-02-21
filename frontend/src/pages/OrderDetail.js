import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Rating } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import api from '../api/axios';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [ratings, setRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/orders/${id}/`).then((r) => {
      setOrder(r.data);
      const initial = {};
      (r.data?.items || []).forEach((it) => { if (it.rating != null) initial[it.id] = it.rating; });
      setRatings(initial);
    }).catch(() => setOrder(null));
  }, [id]);

  const handleRateSubmit = () => {
    const items = Object.entries(ratings)
      .filter(([, r]) => r >= 1 && r <= 5)
      .map(([orderItemId, rating]) => ({ order_item_id: parseInt(orderItemId, 10), rating }));
    if (items.length === 0) return;
    setSubmitting(true);
    api.post(`/orders/orders/${id}/rate/`, { items }).then((r) => {
      setOrder(r.data);
      const next = {};
      (r.data?.items || []).forEach((it) => { if (it.rating != null) next[it.id] = it.rating; });
      setRatings(next);
    }).finally(() => setSubmitting(false));
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Order Receipt - ${order?.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #666; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f5f5f5; }
          .total { font-size: 18px; font-weight: bold; margin-top: 16px; }
          .footer { margin-top: 32px; color: #888; font-size: 12px; }
        </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!order) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Order {order.order_number}</Typography>
        {order.status === 'DELIVERED' && (
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Receipt
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Date</Typography>
            <Typography>{new Date(order.created_at).toLocaleString()}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Status</Typography>
            <Typography>{order.status}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Shipping Address</Typography>
            <Typography>{order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}, {order.shipping_country}</Typography>
          </Paper>
          {order.status === 'DELIVERED' && (order.items || []).some((it) => it.rating == null) && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Rate your products to help others decide</Typography>
          )}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  {order.status === 'DELIVERED' && <TableCell>Rate</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(order.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell align="right">${Number(item.subtotal || 0).toFixed(2)}</TableCell>
                    {order.status === 'DELIVERED' && (
                      <TableCell>
                        {item.rating != null ? (
                          <Typography variant="body2" color="text.secondary">Rated {item.rating}/5</Typography>
                        ) : (
                          <Rating value={ratings[item.id] ?? 0} onChange={(_, v) => setRatings((prev) => ({ ...prev, [item.id]: v ?? 0 }))} max={5} size="small" />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {order.status === 'DELIVERED' && (order.items || []).some((it) => ((ratings[it.id] ?? 0) > 0) && it.rating !== ratings[it.id]) && (
            <Button variant="contained" onClick={handleRateSubmit} disabled={submitting} sx={{ mt: 2 }}>
              {submitting ? 'Saving...' : 'Submit ratings'}
            </Button>
          )}
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography>Subtotal: ${Number(order.subtotal).toFixed(2)}</Typography>
            <Typography>Tax: ${Number(order.tax || 0).toFixed(2)}</Typography>
            <Typography>Shipping: ${Number(order.shipping_fee || 0).toFixed(2)}</Typography>
            <Typography variant="h6" fontWeight="bold">Total: ${Number(order.total_amount).toFixed(2)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Printable receipt (hidden, used for print) */}
      <div ref={printRef} style={{ display: 'none' }}>
        <h1>Order Receipt - {order.order_number}</h1>
        <div className="meta">
          <p>Date: {new Date(order.created_at).toLocaleString()}</p>
          <p>Status: {order.status}</p>
          <p>Shipping: {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}, {order.shipping_country}</p>
        </div>
        <table>
          <thead>
            <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>${Number(item.price).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>${Number(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="total">
          Subtotal: ${Number(order.subtotal).toFixed(2)} | Tax: ${Number(order.tax || 0).toFixed(2)} | Shipping: ${Number(order.shipping_fee || 0).toFixed(2)}<br />
          <strong>Total: ${Number(order.total_amount).toFixed(2)}</strong>
        </div>
        <div className="footer">Thank you for your order.</div>
      </div>

      <Button component={Link} to="/my-orders" sx={{ mt: 3 }}>Back to My Orders</Button>
    </Box>
  );
}
