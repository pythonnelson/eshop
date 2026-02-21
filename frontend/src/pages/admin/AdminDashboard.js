import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import StoreIcon from "@mui/icons-material/Store";
import CategoryIcon from "@mui/icons-material/Category";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import api from "../../api/axios";
import { useState, useEffect, useCallback } from "react";
import AdminUsers from "./AdminUsers";
import AdminVendors from "./AdminVendors";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut, Scatter } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const DATASETS = [
  { key: "users", label: "Users", color: "#232f3e" },
  { key: "vendors", label: "Vendors", color: "#ff9900" },
  { key: "categories", label: "Categories", color: "#1976d2" },
  { key: "products", label: "Products", color: "#2e7d32" },
];

const CHART_TYPES = [
  { value: "line", label: "Line", icon: <ShowChartIcon /> },
  { value: "bar", label: "Bar", icon: <BarChartIcon /> },
  { value: "pie", label: "Pie", icon: <PieChartIcon /> },
  { value: "doughnut", label: "Doughnut", icon: <DonutLargeIcon /> },
  { value: "scatter", label: "Scatter", icon: <ScatterPlotIcon /> },
  { value: "financial", label: "Financial", icon: <BarChartIcon /> },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    users: 0,
    vendors: 0,
    categories: 0,
    products: 0,
  });
  const [growth, setGrowth] = useState({
    users: [],
    vendors: [],
    categories: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [dataSelection, setDataSelection] = useState("users");
  const [chartType, setChartType] = useState("line");
  const [activeView, setActiveView] = useState("charts");

  const fetchData = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      api.get("/admin/users/").then((r) => r.data.results ?? r.data ?? []),
      api.get("/admin/vendors/").then((r) => r.data.results ?? r.data ?? []),
      api.get("/admin/categories/").then((r) => r.data.results ?? r.data ?? []),
      api.get("/admin/products/").then((r) => r.data.results ?? r.data ?? []),
      api.get("/admin/stats/?days=30").then((r) => r.data),
    ])
      .then(([u, v, c, p, stats]) => {
        setCounts({
          users: Array.isArray(u) ? u.length : 0,
          vendors: Array.isArray(v) ? v.length : 0,
          categories: Array.isArray(c) ? c.length : 0,
          products: Array.isArray(p) ? p.length : 0,
        });
        setGrowth(
          stats || { users: [], vendors: [], categories: [], products: [] },
        );
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

  const quickActions = [
    { key: "charts", label: "Analytics", icon: <ShowChartIcon /> },
    { key: "users", label: "Users", icon: <PeopleIcon /> },
    { key: "vendors", label: "Vendors", icon: <StoreIcon /> },
    { key: "products", label: "Approve Products", icon: <InventoryIcon /> },
    { key: "categories", label: "Categories", icon: <CategoryIcon /> },
  ];

  const statCards = [
    {
      key: "users",
      label: "Users",
      count: counts.users,
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      gradient: "linear-gradient(135deg, #232f3e 0%, #131921 100%)",
    },
    {
      key: "vendors",
      label: "Vendors",
      count: counts.vendors,
      icon: <StoreIcon sx={{ fontSize: 48 }} />,
      gradient: "linear-gradient(135deg, #e68a00 0%, #ff9900 100%)",
    },
    {
      key: "categories",
      label: "Categories",
      count: counts.categories,
      icon: <CategoryIcon sx={{ fontSize: 48 }} />,
      gradient: "linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)",
    },
    {
      key: "products",
      label: "Products",
      count: counts.products,
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      gradient: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
    },
  ];

  const isTimeSeries = ["line", "bar", "scatter", "financial"].includes(
    chartType,
  );
  const showAll = dataSelection === "all";
  const effectiveData = showAll ? "users" : dataSelection;

  let chartData = null;
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: "top" } },
  };

  if (isTimeSeries) {
    const allDates = [
      ...new Set(
        [
          ...(growth.users || []),
          ...(growth.vendors || []),
          ...(growth.categories || []),
          ...(growth.products || []),
        ].map((d) => d.date),
      ),
    ].sort();

    const labels = showAll
      ? allDates
      : (growth[effectiveData] || []).map((d) => d.date);

    if (chartType === "financial") {
      const series = growth[effectiveData] || [];
      const prev = (i) => (i > 0 ? (series[i - 1]?.count ?? 0) : 0);
      chartData = {
        labels: series.map((d) => d.date),
        datasets: [
          {
            label:
              DATASETS.find((d) => d.key === effectiveData)?.label ||
              effectiveData,
            data: series.map((d) => d.count),
            backgroundColor: series.map((d, i) =>
              d.count >= prev(i) ? "#22c55e" : "#ef4444",
            ),
          },
        ],
      };
    } else if (chartType === "scatter") {
      chartData = showAll
        ? {
            datasets: DATASETS.map((ds) => ({
              label: ds.label,
              data: (growth[ds.key] || []).map((d, i) => ({
                x: i,
                y: d.count,
              })),
              backgroundColor: ds.color,
              borderColor: ds.color,
            })),
          }
        : {
            datasets: [
              {
                label: DATASETS.find((d) => d.key === effectiveData)?.label,
                data: (growth[effectiveData] || []).map((d, i) => ({
                  x: i,
                  y: d.count,
                })),
                backgroundColor: DATASETS.find((d) => d.key === effectiveData)
                  ?.color,
                borderColor: DATASETS.find((d) => d.key === effectiveData)
                  ?.color,
              },
            ],
          };
    } else {
      const datasets = showAll
        ? DATASETS.map((ds) => ({
            label: ds.label,
            data: labels.map((date) => {
              const found = (growth[ds.key] || []).find((d) => d.date === date);
              return found ? found.count : 0;
            }),
            borderColor: ds.color,
            backgroundColor: ds.color + "40",
            fill: chartType === "line",
            tension: 0.3,
          }))
        : [
            {
              label: DATASETS.find((d) => d.key === effectiveData)?.label,
              data: (growth[effectiveData] || []).map((d) => d.count),
              borderColor:
                DATASETS.find((d) => d.key === effectiveData)?.color || "#666",
              backgroundColor:
                (DATASETS.find((d) => d.key === effectiveData)?.color ||
                  "#666") + "40",
              fill: chartType === "line",
              tension: 0.3,
            },
          ];
      chartData = { labels, datasets };
    }
  } else {
    chartData = {
      labels: DATASETS.map((d) => d.label),
      datasets: [
        {
          data: [
            counts.users,
            counts.vendors,
            counts.categories,
            counts.products,
          ],
          backgroundColor: [
            DATASETS[0].color + "cc",
            DATASETS[1].color + "cc",
            DATASETS[2].color + "cc",
            DATASETS[3].color + "cc",
          ],
          borderColor: DATASETS.map((d) => d.color),
          borderWidth: 1,
        },
      ],
    };
  }

  const renderChart = () => {
    if (!chartData)
      return (
        <Typography color="text.secondary">
          Select data and chart type
        </Typography>
      );

    if (chartType === "pie")
      return <Pie data={chartData} options={{ ...baseOptions }} />;
    if (chartType === "doughnut")
      return <Doughnut data={chartData} options={{ ...baseOptions }} />;
    if (chartType === "scatter") {
      return (
        <Scatter
          data={chartData}
          options={{
            ...baseOptions,
            scales: {
              x: {
                beginAtZero: true,
                title: { display: true, text: "Period" },
              },
              y: { beginAtZero: true },
            },
          }}
        />
      );
    }
    if (chartType === "financial") {
      return (
        <Bar
          data={chartData}
          options={{ ...baseOptions, scales: { y: { beginAtZero: true } } }}
        />
      );
    }
    if (chartType === "bar")
      return (
        <Bar
          data={chartData}
          options={{ ...baseOptions, scales: { y: { beginAtZero: true } } }}
        />
      );
    return (
      <Line
        data={chartData}
        options={{ ...baseOptions, scales: { y: { beginAtZero: true } } }}
      />
    );
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage platform users, vendors, categories and product approvals
      </Typography>

      {/* Stat cards - full width first row */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Card
            key={s.key}
            sx={{
              background: s.gradient,
              color: "white",
              minHeight: 140,
              flex: "1 1 200px",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                height: "100%",
              }}
            >
              <Box>
                <Typography variant="h3" fontWeight="bold">
                  {s.count}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {s.label}
                </Typography>
              </Box>
              <Box sx={{ opacity: 0.8 }}>{s.icon}</Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Chart + Quick Actions row */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        {/* Main content area - Chart or Quick Action content */}
        <Paper sx={{ flex: "1 1 600px", minWidth: 0, p: 2, overflow: "auto" }}>
          {activeView === "charts" && (
            <>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Growth Analytics
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
              alignItems: "center",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Data</InputLabel>
              <Select
                value={dataSelection}
                label="Data"
                onChange={(e) => setDataSelection(e.target.value)}
              >
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="vendors">Vendors</MenuItem>
                <MenuItem value="categories">Categories</MenuItem>
                <MenuItem value="products">Products</MenuItem>
                <MenuItem value="all">All (combined)</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Chart Type
              </Typography>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, v) => v && setChartType(v)}
                size="small"
              >
                {CHART_TYPES.map((t) => (
                  <ToggleButton
                    key={t.value}
                    value={t.value}
                    aria-label={t.label}
                  >
                    {t.icon}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
          <Box sx={{ height: 380 }}>{renderChart()}</Box>
          <Box sx={{ display: "flex", gap: 2, mt: 2, flexWrap: "wrap" }}>
            {DATASETS.map((d) => (
              <Box
                key={d.key}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    bgcolor: d.color,
                  }}
                />
                <Typography variant="body2">
                  {d.label}: {counts[d.key]}
                </Typography>
              </Box>
            ))}
          </Box>
            </>
          )}
          {activeView === "users" && <AdminUsers />}
          {activeView === "vendors" && <AdminVendors />}
          {activeView === "products" && <AdminProducts />}
          {activeView === "categories" && <AdminCategories />}
        </Paper>

        {/* Quick Actions - sized to content */}
        <Paper
          sx={{ p: 2, flexShrink: 0, width: "fit-content", minWidth: 220 }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <AssessmentIcon /> Quick Actions
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {quickActions.map(({ key, label, icon }) => (
              <Button
                key={key}
                variant={activeView === key ? "contained" : "outlined"}
                fullWidth
                startIcon={icon}
                onClick={() => setActiveView(key)}
                sx={{ justifyContent: "flex-start", py: 1.5 }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
