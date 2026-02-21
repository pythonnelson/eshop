import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter ? { user_type: filter } : {};
    api.get('/admin/users/', { params }).then((r) => {
      setUsers(r.data.results || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Users</Typography>
      <FormControl size="small" sx={{ minWidth: 160, mb: 2 }}>
        <InputLabel>Role</InputLabel>
        <Select value={filter} label="Role" onChange={(e) => setFilter(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="CUSTOMER">Customer</MenuItem>
          <MenuItem value="VENDOR">Vendor</MenuItem>
          <MenuItem value="ADMIN">Admin</MenuItem>
        </Select>
      </FormControl>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.first_name} {u.last_name}</TableCell>
                <TableCell>{u.user_type}</TableCell>
                <TableCell>{u.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>{new Date(u.date_joined).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
