import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) navigate(n.link);
    handleClose();
  };

  if (!user) return null;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { maxHeight: 400, width: 360 } }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => { markAllRead(); handleClose(); }}>Mark all read</Button>
          )}
        </Box>
        {notifications.filter((n) => !n.is_read).length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.filter((n) => !n.is_read).slice(0, 10).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleClick(n)}
              sx={{ flexDirection: 'column', alignItems: 'flex-start', whiteSpace: 'normal', bgcolor: n.is_read ? 'transparent' : 'action.hover' }}
            >
              <Typography variant="subtitle2" fontWeight={n.is_read ? 400 : 600}>{n.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{n.message}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
