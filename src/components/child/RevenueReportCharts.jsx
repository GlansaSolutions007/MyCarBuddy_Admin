import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_APIURL;

function RevenueReportCharts() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("daily");
  const [selectedReport, setSelectedReport] = useState("booking");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // ----------- DEFAULT DATE HELPERS -----------

  const setMonthlyDefaults = () => {
    const now = new Date();
    const year = now.getFullYear();
    const defaultFrom = `${year}-01-01`;
    // Till last day of current month
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(defaultFrom);
    setToDate(defaultTo.toISOString().slice(0, 10));
  };

  const setWeeklyDefaults = () => {
    const now = new Date();
    const year = now.getFullYear();
    // From Jan 1st of this year
    const defaultFrom = `${year}-01-01`;
    setFromDate(defaultFrom);
    setToDate(now.toISOString().slice(0, 10));
  };

  const toLocalDate = (date) =>
    date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");

  const setDailyDefaults = () => {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(toLocalDate(defaultFrom));
    setToDate(toLocalDate(now));
  };

  const setYearlyDefaults = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const defaultFrom = `${currentYear - 11}-01-01`;
    setFromDate(defaultFrom);
    setToDate(now.toISOString().slice(0, 10));
  };

  const clearDefaults = () => {
    setFromDate("");
    setToDate("");
  };

  // ----------- BUILD API ENDPOINT BASED ON PERIOD -----------
  const buildEndpoint = () => {
    let endpoint = "";
    if (selectedReport !== "booking") {
      return null; // currently only booking wise API available
    }

    switch (chartPeriod) {
      case "yearly":
        endpoint = `Payments/Revenue?groupBy=yearly`;
        if (fromDate) endpoint += `&fromDate=${fromDate}`;
        if (toDate) endpoint += `&toDate=${toDate}`;
        break;

      case "monthly":
        endpoint = `Payments/Revenue?groupBy=monthly`;
        if (fromDate) endpoint += `&fromDate=${fromDate}`;
        if (toDate) endpoint += `&toDate=${toDate}`;
        break;

      case "weekly":
        endpoint = `Payments/Revenue?groupBy=weekly`;
        if (fromDate) endpoint += `&fromDate=${fromDate}`;
        if (toDate) endpoint += `&toDate=${toDate}`;
        break;

      case "daily":
      default:
        endpoint = `Payments/Revenue?groupBy=daily`;
        if (fromDate) endpoint += `&fromDate=${fromDate}`;
        if (toDate) endpoint += `&toDate=${toDate}`;
        break;
    }
    return endpoint;
  };

  // ----------- FETCH DATA FROM API -----------

  const fetchChartsData = async () => {
    try {
      const endpoint = buildEndpoint();
      if (!endpoint) return;
      setLoading(true);
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || []);
    } catch (err) {
      console.error("Failed to fetch revenue charts:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedReport === "booking") {
      setDailyDefaults();
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready && selectedReport === "booking") {
      fetchChartsData();
    }
  }, [chartPeriod, fromDate, toDate, selectedReport, ready]);

  // Set smart defaults when period changes
  // Set defaults automatically when chart period changes
  useEffect(() => {
    if (selectedReport !== "booking") return;

    switch (chartPeriod) {
      case "monthly":
        setMonthlyDefaults();
        break;

      case "weekly":
        setWeeklyDefaults();
        break;

      case "daily":
        setDailyDefaults();
        break;

      case "yearly":
        setYearlyDefaults();
        break;

      default:
        clearDefaults();
        break;
    }

    setReady(true);
  }, [chartPeriod]);

  // ----------- PREPARE CHART DATA FROM API RESPONSE -----------

  const chartData = data.map((item) => {
    let label = item.Label;
    // Format labels for better display
    if (chartPeriod === "daily" && label.includes("T")) {
      label = new Date(label).toLocaleDateString("en-GB");
    }
    return {
      name: label,
      value: item.AmountPaid,
    };
  });

  // ----------- BUILD CHART DATA -----------

  const barData = chartData;

  const pieData = chartData.map((i) => ({
    name: i.name,
    value: i.value,
  }));

  const lineData = chartData.map((i) => ({
    date: i.name,
    revenue: i.value,
  }));

  const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="container-fluid mt-10">
      {/* HEADER + DROPDOWNS IN ONE ROW */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0">Revenue Charts</h6>

        <div className="d-flex align-items-center gap-3">
          {/* REPORT DROPDOWN */}
          <select
            className="form-select"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            style={{ width: "180px" }}
          >
            {/* <option value="garage">Garage Wise</option> */}
            <option value="booking">Booking Wise</option>
            {/* <option value="service">Service Wise</option> */}
          </select>

          {/* PERIOD DROPDOWN */}
          <select
            className="form-select"
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* DATE FILTERS */}
          {/* {selectedReport === "booking" && chartPeriod !== "yearly" && ( */}
          <>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: "160px" }}
            />

            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: "160px" }}
            />
          </>
          {/* )} */}
        </div>
      </div>

      <div className="row gy-4">
        {/* BAR CHART */}
        <div className="col-12 col-md-7">
          <div className="card p-3">
            <h6 className="mb-2">Bar Chart</h6>

            {loading ? (
              "Loading..."
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Amount Paid" fill="#116d6e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PIE CHART */}
        <div className="col-12 col-md-5">
          <div className="card p-3">
            <h6 className="mb-2">Pie Chart</h6>

            {loading ? (
              "Loading..."
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" label>
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LINE CHART */}
        <div className="col-12">
          <div className="card p-3">
            <h6 className="mb-2">Line Chart</h6>

            {loading ? (
              "Loading..."
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="revenue" name="Revenue Trend" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {!loading && data.length === 0 && (
        <div className="alert alert-warning mt-3">
          No data available for selected report / period
        </div>
      )}
    </div>
  );
}

export default RevenueReportCharts;
