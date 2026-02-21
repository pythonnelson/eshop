import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import api from '../../api/axios';

export default function AdminReports() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get('/admin/reports/sales/').then((r) => setReport(r.data)).catch(() => setReport(null));
  }, []);

  if (!report) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Sales Summary Report</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">Totals</Typography>
            <Typography variant="h4">{report.total_orders} orders</Typography>
            <Typography variant="h4">${Number(report.total_revenue).toFixed(2)} revenue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">Last 30 days</Typography>
            <Typography variant="h4">{report.last_30_days?.orders ?? 0} orders</Typography>
            <Typography variant="h4">${Number(report.last_30_days?.revenue || 0).toFixed(2)} revenue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary">Orders by status</Typography>
            <Box component="pre" sx={{ mt: 1 }}>{JSON.stringify(report.orders_by_status || {}, null, 2)}</Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
