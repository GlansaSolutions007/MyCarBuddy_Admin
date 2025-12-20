import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const RevenueReports = () => {
  const token = localStorage.getItem("token");

  // ---------------- COMMON STATES ----------------
  const [reportType, setReportType] = useState("garage");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // ---------------- SERVICE ONLY ----------------
  const [serviceType, setServiceType] = useState("");

  // ---------------- FETCH DATA ----------------
  const fetchReportData = async () => {
    try {
      setLoading(true);

      let endpoint = "";
      if (reportType === "garage") {
        endpoint = "Supervisor/GarageEarningsReport";
      } else {
        endpoint = "Supervisor/ServiceWiseReport";
      }

      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data || []);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setServiceType("");
    fetchReportData();
  }, [reportType]);

  // ---------------- FILTER DATA ----------------
  const filteredData = data.filter((item) => {
    if (reportType === "garage") {
      return (
        (!searchTerm ||
          item.GarageName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!fromDate || item.date >= fromDate) &&
        (!toDate || item.date <= toDate)
      );
    }

    // SERVICE WISE
    return (
      (!searchTerm ||
        item.ServiceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.GarageName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!serviceType || item.ServiceType === serviceType) &&
      (!fromDate || item.CreatedDate >= fromDate) &&
      (!toDate ||
        new Date(item.CreatedDate) <=
          new Date(new Date(toDate).setHours(23, 59, 59, 999)))
    );
  });

  // ---------------- COLUMNS ----------------
  const garageColumns = [
    { name: "Garage Name", selector: (r) => r.GarageName, sortable: true },
    { name: "Total Services", selector: (r) => r.TotalServices, sortable: true },
    { name: "Total Revenue", selector: (r) => r.TotalRevenue, sortable: true },
    { name: "Total GST", selector: (r) => r.TotalGST, sortable: true },
    { name: "Our Earnings", selector: (r) => r.OurEarnings },
  ];

  const serviceColumns = [
    {
      name: "Date",
      selector: (r) =>
        new Date(r.CreatedDate).toLocaleDateString("en-GB"),
      sortable: true,
    },
    { name: "Service Type", selector: (r) => r.ServiceType, sortable: true },
    { name: "Service Name", selector: (r) => r.ServiceName, sortable: true },
    { name: "Garage Name", selector: (r) => r.GarageName, sortable: true },
    { name: "Price", selector: (r) => r.Price, sortable: true },
    { name: "GST", selector: (r) => r.GST },
    { name: "Our %", selector: (r) => r.OurPercentage },
    { name: "Our Earnings", selector: (r) => r.OurEarnings },
  ];

  const columns =
    reportType === "garage" ? garageColumns : serviceColumns;

  // ---------------- UI ----------------
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

              {/* REPORT TYPE */}
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 fw-semibold">
                  Report:
                </label>
                <select
                  className="form-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="garage">Garage Wise</option>
                  <option value="service">Service Wise</option>
                </select>
              </div>

              {/* SEARCH */}
              <div className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </div>

              {/* SERVICE TYPE FILTER */}
              {reportType === "service" && (
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0">Type:</label>
                  <select
                    className="form-control"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Service">Service</option>
                    <option value="Spare">Spare</option>
                    <option value="Package">Package</option>
                  </select>
                </div>
              )}

              {/* DATE FILTERS */}
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0">From:</label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0">To:</label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={loading}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent={
              loading ? "Loading report..." : "No data available"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueReports;
