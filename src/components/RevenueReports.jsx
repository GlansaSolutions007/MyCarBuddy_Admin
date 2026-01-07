import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;

const EXPORT_COLUMNS = {
  garage: [
    { key: "GarageName", label: "Garage Name" },
    { key: "TotalServices", label: "Total Services" },
    { key: "TotalRevenue", label: "Total Revenue" },
    { key: "TotalGST", label: "Total GST" },
    { key: "OurEarnings", label: "Our Earnings" },
  ],
  service: [
    { key: "CreatedDate", label: "Date", format: "date" },
    { key: "ServiceType", label: "Service Type" },
    { key: "ServiceName", label: "Service Name" },
    { key: "GarageName", label: "Garage Name" },
    { key: "Price", label: "Price" },
    { key: "GST", label: "GST" },
    { key: "OurPercentage", label: "Our %" },
    { key: "OurEarnings", label: "Our Earnings" },
  ],
  booking: [
    { key: "BookingTrackID", label: "Booking ID" },
    { key: "LeadId", label: "Lead ID" },
    { key: "BookingDate", label: "Booking Date", format: "date" },
    { key: "CustFullName", label: "Customer Name" },
    { key: "CustPhoneNumber", label: "Phone" },
    { key: "CustEmail", label: "Email" },
    { key: "TotalServices", label: "Total Services" },
    { key: "TotalRevenue", label: "Total Revenue" },
    { key: "TotalGST", label: "GST" },
    { key: "OurEarnings", label: "Our Earnings" },
  ],
};

const RevenueReports = () => {
  const token = localStorage.getItem("token");

  // ---------------- COMMON STATES ----------------
  const [reportType, setReportType] = useState("garage");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedExportColumns, setSelectedExportColumns] = useState([]);

  // ---------------- SERVICE ONLY ----------------
  const [serviceType, setServiceType] = useState("");

  // ---------------- FETCH DATA ----------------
  const fetchReportData = async () => {
    try {
      setLoading(true);

      let endpoint = "";
      if (reportType === "garage") {
        endpoint = "Supervisor/GarageEarningsReport";
      } else if (reportType === "service") {
        endpoint = "Supervisor/ServiceWiseReport";
      } else if (reportType === "booking") {
        endpoint = "Leads/dealer-summary";
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
    setSelectedExportColumns(EXPORT_COLUMNS[reportType].map((c) => c.key));
  }, [reportType]);

  // const exportToExcel = () => {
  //   let exportData = [];
  //   let sheetName = "";
  //   let filename = "";

  //   if (reportType === "garage") {
  //     exportData = filteredData.map((item) => ({
  //       "Garage Name": item.GarageName || "-",
  //       "Total Services": item.TotalServices || 0,
  //       "Total Revenue": item.TotalRevenue || 0,
  //       "Total GST": item.TotalGST || 0,
  //       "Our Earnings": item.OurEarnings || 0,
  //     }));
  //     sheetName = "Garage Earnings";
  //     filename = `garage_earnings_export_${new Date()
  //       .toISOString()
  //       .slice(0, 19)
  //       .replace(/:/g, "")
  //       .replace(/-/g, "")
  //       .replace("T", "_")}.xlsx`;
  //   } else if (reportType === "service") {
  //     exportData = filteredData.map((item) => ({
  //       Date: item.CreatedDate
  //         ? new Date(item.CreatedDate).toLocaleDateString("en-GB")
  //         : "-",
  //       "Service Type": item.ServiceType || "-",
  //       "Service Name": item.ServiceName || "-",
  //       "Garage Name": item.GarageName || "-",
  //       Price: item.Price || 0,
  //       GST: item.GST || 0,
  //       "Our %": item.OurPercentage || 0,
  //       "Our Earnings": item.OurEarnings || 0,
  //     }));
  //     sheetName = "Service Wise Report";
  //     filename = `service_wise_export_${new Date()
  //       .toISOString()
  //       .slice(0, 19)
  //       .replace(/:/g, "")
  //       .replace(/-/g, "")
  //       .replace("T", "_")}.xlsx`;
  //   } else if (reportType === "booking") {
  //     exportData = filteredData.map((item) => ({
  //       "Booking ID": item.BookingTrackID || "-",
  //       "Lead ID": item.LeadId || "-",
  //       "Booking Date": item.BookingDate
  //         ? new Date(item.BookingDate).toLocaleDateString("en-GB")
  //         : "-",
  //       "Customer Name": item.CustFullName || "-",
  //       Phone: item.CustPhoneNumber || "-",
  //       Email: item.CustEmail || "-",
  //       "Total Services": item.TotalServices || 0,
  //       "Total Revenue": item.TotalRevenue || 0,
  //       GST: item.TotalGST || 0,
  //       "Our Earnings": item.OurEarnings || 0,
  //     }));
  //     sheetName = "Booking Reports";
  //     filename = `booking_reports_export_${new Date()
  //       .toISOString()
  //       .slice(0, 19)
  //       .replace(/:/g, "")
  //       .replace(/-/g, "")
  //       .replace("T", "_")}.xlsx`;
  //   }

  //   // Create workbook and worksheet
  //   const wb = XLSX.utils.book_new();
  //   const ws = XLSX.utils.json_to_sheet(exportData);

  //   // Auto-size columns
  //   const colWidths = Array(Object.keys(exportData[0] || {}).length).fill({
  //     wch: 15,
  //   });
  //   ws["!cols"] = colWidths;

  //   // Add worksheet to workbook
  //   XLSX.utils.book_append_sheet(wb, ws, sheetName);

  //   // Save file
  //   XLSX.writeFile(wb, filename);
  // };

  const exportToExcel = () => {
    if (!selectedExportColumns.length) return;
    const columns = EXPORT_COLUMNS[reportType];
    const exportData = filteredData.map((item) => {
      const row = {};
      columns.forEach((col) => {
        if (!selectedExportColumns.includes(col.key)) return;
        let value = item[col.key];
        if (col.format === "date" && value) {
          value = new Date(value)
            .toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
            .replace(", ", ",\n");
        }
        row[col.label] = value ?? "-";
      });
      return row;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(
      wb,
      `${reportType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

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

    if (reportType === "service") {
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
    }

    // BOOKING REPORTS
    return (
      // SEARCH
      (!searchTerm ||
        item.BookingTrackID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.LeadId?.includes(searchTerm) ||
        item.CustPhoneNumber?.includes(searchTerm)) &&
      (!fromDate ||
        new Date(item.BookingDate) >=
          new Date(new Date(fromDate).setHours(0, 0, 0, 0))) &&
      (!toDate ||
        new Date(item.BookingDate) <=
          new Date(new Date(toDate).setHours(23, 59, 59, 999)))
    );
  });

  // ---------------- COLUMNS ----------------
  const garageColumns = [
    { name: "Garage Name", selector: (r) => r.GarageName, sortable: true },
    {
      name: "Total Services",
      selector: (r) => r.TotalServices,
      sortable: true,
    },
    { name: "Total Revenue", selector: (r) => r.TotalRevenue, sortable: true },
    { name: "Total GST", selector: (r) => r.TotalGST, sortable: true },
    { name: "Our Earnings", selector: (r) => r.OurEarnings },
  ];

  const serviceColumns = [
    {
      name: "Booking Date",
      selector: (r) =>
        r.CreatedDate
          ? new Date(r.CreatedDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true, // set false for 24-hour format
            })
          : "-",
      sortable: true,
      width: "150px",
      wrap: true,
    },
    { name: "Service Type", selector: (r) => r.ServiceType, sortable: true },
    { name: "Service Name", selector: (r) => r.ServiceName, sortable: true, width: "200px", wrap: true,},
    { name: "Garage Name", selector: (r) => r.GarageName, sortable: true },
    { name: "Price", selector: (r) => r.Price, sortable: true },
    { name: "GST", selector: (r) => r.GST },
    { name: "Our %", selector: (r) => r.OurPercentage },
    { name: "Our Earnings", selector: (r) => r.OurEarnings },
  ];
  const bookingColumns = [
    {
      name: "Booking ID",
      selector: (r) => (
        <Link to={`/booking-view/${r.BookingID}`} className="text-primary">
          {r.BookingTrackID}
        </Link>
      ),
      sortable: true,
      width: "180px",
    },
    {
      name: "Lead ID",
      selector: (r) => (
        <Link to={`/lead-view/${r.LeadId}`} className="text-primary">
          {r.LeadId}
        </Link>
      ),
    },
    {
      name: "Booking Date",
      selector: (r) =>
        r.BookingDate
          ? new Date(r.BookingDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true, // set false for 24-hour format
            })
          : "-",
      sortable: true,
      width: "150px",
      wrap: true,
    },
    {
      name: "Customer Name",
      selector: (r) => r.CustFullName,
      sortable: true,
    },
    {
      name: "Phone",
      selector: (r) => r.CustPhoneNumber,
    },
    {
      name: "Email",
      selector: (r) => r.CustEmail,
      width: "150px",
      wrap: true,
    },
    {
      name: "Total Services",
      selector: (r) => r.TotalServices,
      sortable: true,
      width: "150px",
    },
    {
      name: "Total Revenue",
      selector: (r) => r.TotalRevenue,
      sortable: true,
      width: "150px",
    },
    {
      name: "GST",
      selector: (r) => r.TotalGST,
    },
    {
      name: "Our Earnings",
      selector: (r) => r.OurEarnings,
    },
  ];

  const columns =
    reportType === "garage"
      ? garageColumns
      : reportType === "service"
      ? serviceColumns
      : bookingColumns;

  // ---------------- UI ----------------
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="row align-items-center g-3">
              {/* LEFT: REPORT + SEARCH (col-4) */}
              <div className="col-12 col-md-5">
                <div className="d-flex align-items-center gap-3 flex-wrap">
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
                      <option value="booking">Booking Reports</option>
                    </select>
                  </div>

                  <div className="navbar-search" style={{ width: "250px" }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: "250px" }}
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Icon icon="ion:search-outline" className="icon" />
                  </div>
                </div>
              </div>

              {/* RIGHT: FILTERS + BUTTONS (col-6) */}
              <div className="col-12 col-md-7 ms-auto">
                <div className="d-flex flex-wrap align-items-center gap-1 justify-content-end">
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

                  <div className="dropdown">
                    <button
                       className="btn btn-outline-secondary dropdown-toggle px-3 d-flex align-items-center"
                      style={{ height: "32px" }}
                      data-bs-toggle="dropdown"
                    >
                      Columns
                    </button>
                    <div
                      className="dropdown-menu p-3"
                      style={{ minWidth: "220px" }}
                    >
                      {EXPORT_COLUMNS[reportType].map((col) => (
                        <div className="form-check" key={col.key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() =>
                              setSelectedExportColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter((k) => k !== col.key)
                                  : [...prev, col.key]
                              )
                            }
                          />
                          <label className="form-check-label ms-3">
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    onClick={exportToExcel}
                    title="Export to Excel"
                  >
                    <Icon icon="mdi:microsoft-excel" width="22" height="22" />
                  </button>
                </div>
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
