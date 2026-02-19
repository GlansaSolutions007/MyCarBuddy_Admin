import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;

const EXPORT_COLUMNS = [
  { key: "BookingTrackID", label: "Booking Track ID" },
  { key: "ServiceType", label: "Service Type" },
  { key: "ServiceName", label: "Service Name" },
  { key: "CreatedDate", label: "Date", format: "date" },
  { key: "GarageName", label: "Garage Name" },
  { key: "DealerBasePrice", label: "Base Price" },
  { key: "Quantity", label: "Quantity" },
  { key: "DealerSparePrice", label: "Spare Price" },
  { key: "DealerPrice", label: "Price" },
  { key: "DealerGSTPercent", label: "GST %" },
  { key: "DealerGSTAmount", label: "GST Amount" },
  { key: "OurPercentage", label: "Company %" },
  { key: "OurEarningsStored", label: "Company Earnings" },
  { key: "DealerPaymentDate", label: "Payment Date", format: "date" },
  { key: "DealerPaidAmount", label: "Payment Amount" },
  { key: "DealerPaymentMode", label: "Payment Mode" },
  { key: "DealerPaymentStatus", label: "Payment Status" },
];

const DealerReportLayer = () => {
  const token = localStorage.getItem("token");
  const dealerId = localStorage.getItem("userId");

  // -------- STATES --------
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedExportColumns, setSelectedExportColumns] = useState([]);

  // -------- FETCH DATA --------
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}Supervisor/ServiceWiseReport?dealerId=${dealerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    setSelectedExportColumns(EXPORT_COLUMNS.map(c => c.key));
  }, []);

  // -------- FILTER DATA --------
  const filteredData = data.filter(item => {
    return (
      (!searchTerm ||
        item.ServiceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.GarageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.BookingTrackID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.LeadId?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!serviceType || item.ServiceType === serviceType) &&
      (!fromDate || item.CreatedDate >= fromDate) &&
      (!toDate ||
        new Date(item.CreatedDate) <=
          new Date(new Date(toDate).setHours(23, 59, 59, 999)))
    );
  });

  // -------- EXPORT --------
  const exportToExcel = () => {
    if (!filteredData.length || !selectedExportColumns.length) return;

    const exportData = filteredData.map(item => {
      const row = {};
      EXPORT_COLUMNS.forEach(col => {
        if (!selectedExportColumns.includes(col.key)) return;
        let value = item[col.key];
        if (col.format === "date" && value) {
          value = new Date(value).toLocaleString("en-GB");
        }
        row[col.label] = value ?? "-";
      });
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Service Report");

    XLSX.writeFile(
      wb,
      `service_report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const columns = [
    {
      name: "Booking ID",
      selector: (r) => r.BookingTrackID || "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "Type",
      selector: (r) => r.ServiceType || "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Service Name",
      selector: (r) => r.ServiceName || "-",
      sortable: true,
      width: "200px",
      wrap: true,
    },
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
              hour12: true,
            })
          : "-",
      sortable: true,
      width: "150px",
      wrap: true,
    },
    {
      name: "Part Price",
      selector: (r) => r.DealerBasePrice ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Quantity",
      selector: (r) => r.Quantity || 0,
      sortable: true,
      width: "120px",
    },
    {
      name: "Part Total",
      selector: (r) => r.DealerSparePrice ?? "-",
      sortable: true,
      width: "140px",
    },
    {
      name: "Service Chg.",
      selector: (r) => r.DealerPrice ?? "-",
      sortable: true,
      width: "140px",
    },
    {
      name: "GST %",
      selector: (r) => r.DealerGSTPercent ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "GST Amt.",
      selector: (r) => r.DealerGSTAmount ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Company %",
      selector: (r) => r.OurPercentage ?? "-",
      sortable: true,
      width: "130px",
    },
    {
      name: "Company Amt.",
      selector: (r) => r.OurEarningsStored ?? "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "Pay. Date",
      selector: (r) =>
        r.DealerPaymentDate
          ? new Date(r.DealerPaymentDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              // hour: "2-digit",
              // minute: "2-digit",
              // second: "2-digit",
              // hour12: true,
            })
          : "-",
      sortable: true,
      width: "140px",
    },
     {
      name: "Payment Amt.",
      selector: (r) => r.DealerPaidAmount ?? "-",
      sortable: true,
      width: "140px",
    },
    {
      name: "Pay. Mode",
      selector: (r) => r.DealerPaymentMode ?? "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Pay. Status",
      cell: (row) => {
        const status = row.DealerPaymentStatus?.trim() || "Pending";

        const colorMap = {
          Pending: "#F57C00",   // Orange
          Paid: "#28A745",      // Green
          Unpaid: "#E34242",    // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      sortable: true,
      width: "140px",
    },
  ];
  // ---------------- UI ----------------
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden py-3">
          <div className="card-header">
            <div className="row align-items-center g-1">
              {/* LEFT: REPORT + SEARCH (col-4) */}
              <div className="col-12 col-md-5">
                <div className="d-flex align-items-center gap-1 flex-wrap">
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
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label mb-0">Type:</label>
                      <select
                        className="form-control"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="Service">Service</option>
                        <option value="Spare Part">Spare Part</option>
                        <option value="Package">Package</option>
                        <option value="Service Group">Service Group</option>
                      </select>
                    </div>
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
                      {EXPORT_COLUMNS.map((col) => (
                        <div className="form-check" key={col.key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() =>
                              setSelectedExportColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter((k) => k !== col.key)
                                  : [...prev, col.key],
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
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
            noDataComponent={
              loading ? "Loading report..." : "No data available"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DealerReportLayer;
