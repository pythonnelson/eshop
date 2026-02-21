import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import api from '../../api/axios';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/vendors/').then((r) => {
      setVendors(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setStatus = (vendorId, status) => {
    api.patch(`/admin/vendors/${vendorId}/`, { status }).then(() => {
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, status } : v)));
    });
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Vendors</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Store</TableCell>
              <TableCell>Business</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.store_name}</TableCell>
                <TableCell>{v.business_name}</TableCell>
                <TableCell><Chip label={v.status} size="small" color={v.status === 'APPROVED' ? 'success' : v.status === 'SUSPENDED' ? 'error' : 'default'} /></TableCell>
                <TableCell>{v.total_products ?? 0}</TableCell>
                <TableCell>
                  {v.status !== 'APPROVED' && <Button size="small" onClick={() => setStatus(v.id, 'APPROVED')}>Approve</Button>}
                  {v.status !== 'SUSPENDED' && <Button size="small" color="error" onClick={() => setStatus(v.id, 'SUSPENDED')}>Suspend</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
