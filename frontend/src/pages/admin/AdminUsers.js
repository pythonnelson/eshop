import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = useCallback(() => {
    const params = filter ? { user_type: filter } : {};
    api.get('/admin/users/', { params }).then((r) => {
      setUsers(r.data.results || r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleMenuOpen = (event, user) => {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  const runAction = async (action, extra = {}) => {
    if (!menuUser) return;
    setActionLoading(menuUser.id);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/users/${menuUser.id}/`, { action, ...extra });
      setSuccess(`User ${action} successfully`);
      fetchUsers();
      handleMenuClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = () => runAction('ban');
  const handleUnban = () => runAction('unban');
  const handleSuspend = (days = 7) => runAction('suspend', { days });
  const handleUnsuspend = () => runAction('unsuspend');

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Users</Typography>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
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
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.first_name} {u.last_name}</TableCell>
                <TableCell>{u.user_type}</TableCell>
                <TableCell>
                  {!u.is_active ? (
                    <Chip label="Banned" size="small" color="error" />
                  ) : u.is_suspended || (u.suspended_until && new Date(u.suspended_until) > new Date()) ? (
                    <Chip label="Suspended" size="small" color="warning" />
                  ) : (
                    <Chip label="Active" size="small" color="success" />
                  )}
                </TableCell>
                <TableCell>{new Date(u.date_joined).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  {u.user_type !== 'ADMIN' ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => handleMenuOpen(e, u)}
                      disabled={actionLoading === u.id}
                      endIcon={actionLoading === u.id ? <CircularProgress size={16} /> : <MoreVertIcon />}
                    >
                      Actions
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuUser && !menuUser.is_active ? (
          <MenuItem onClick={handleUnban}>
            <ListItemIcon><LockOpenIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Unban user</ListItemText>
          </MenuItem>
        ) : menuUser ? (
          <>
            {(menuUser.is_suspended || (menuUser.suspended_until && new Date(menuUser.suspended_until) > new Date())) && (
              <MenuItem onClick={handleUnsuspend}>
                <ListItemIcon><LockOpenIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Unsuspend</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleSuspend(7); handleMenuClose(); }}>
              <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Suspend 7 days</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { handleSuspend(30); handleMenuClose(); }}>
              <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Suspend 30 days</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleBan}>
              <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Ban user</ListItemText>
            </MenuItem>
          </>
        ) : null}
      </Menu>
    </Box>
  );
}
