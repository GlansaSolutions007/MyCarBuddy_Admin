import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;

// Columns definition for Excel Export
const EXPORT_COLUMNS = [
  { key: "BookingTrackID", label: "Booking ID" },
  { key: "ActionDate", label: "Date and Time", format: "date" },
  { key: "RegistrationNumber", label: "Car Reg. No" },
  { key: "BrandName", label: "Brand" },
  { key: "ModelName", label: "Model" },
  { key: "FuelTypeName", label: "Fuel Type" },
  { key: "TypeName", label: "Status" },
];

const DealerVehicleReportLayer = () => {
  const dealerId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // -------- STATES --------
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedExportColumns, setSelectedExportColumns] = useState([]);

  // -------- FETCH DATA --------
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}ServiceImages/DealerPickupDeliveryReport?dealerId=${dealerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReports(response.data || []);
    } catch (error) {
      console.error("Error fetching dealer report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealerId) fetchReports();
    setSelectedExportColumns(EXPORT_COLUMNS.map((c) => c.key));
  }, [dealerId]);

  // -------- FILTERING LOGIC --------
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const itemDate = new Date(item.ActionDate);
      const matchesFromDate = !fromDate || itemDate >= new Date(fromDate);

      // logic to include the full day of the "To" date
      const matchesToDate =
        !toDate ||
        itemDate <= new Date(new Date(toDate).setHours(23, 59, 59, 999));

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [searchTerm, fromDate, toDate, reports]);

  // -------- EXPORT TO EXCEL --------
  const exportToExcel = () => {
    if (!filteredReports.length || !selectedExportColumns.length) return;

    const exportData = filteredReports.map((item) => {
      const row = {};
      EXPORT_COLUMNS.forEach((col) => {
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
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Report");

    XLSX.writeFile(
      wb,
      `vehicle_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // -------- TABLE COLUMNS --------
  const columns = [
    {
      name: "Booking ID",
      selector: (row) => row.BookingTrackID || "-",
      sortable: true,
    },
    {
      name: "Car Reg. No",
      selector: (row) => row.RegistrationNumber || "-",
      sortable: true,
    },
    {
      name: "Brand",
      selector: (row) => row.BrandName || "-",
      sortable: true,
    },
    {
      name: "Model",
      selector: (row) => row.ModelName || "-",
      sortable: true,
    },
    {
      name: "Fuel Type",
      selector: (row) => row.FuelTypeName || "-",
      sortable: true,
    },
    {
      name: "Date and Time",
      selector: (row) => row.ActionDate,
      sortable: true,
      width: "180px",
      format: (row) =>
        row.ActionDate
          ? new Date(row.ActionDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-",
    },
    {
      name: "Status",
      selector: (row) => row.TypeName || "-",
      sortable: true,
      cell: (row) => (
        <span className="badge bg-primary-subtle text-black bold px-3 py-2 fw-medium rounded-pill">
          {row.TypeName}
        </span>
      ),
    },
  ];

  return (
    <div className="row mt-3">
      <div className="col-12">
        <div className="card overflow-hidden py-3 shadow-sm border-0">
          <div className="card-header bg-white border-0">
            <div className="row align-items-center g-2">
              {/* SEARCH BAR */}
              <div className="col-12 col-md-4">
                <div className="navbar-search" style={{ maxWidth: "300px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Tracking ID, Reg No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon icon="ion:search-outline" className="icon" />
                </div>
              </div>

              {/* FILTERS & EXPORT */}
              <div className="col-12 col-md-8 ms-auto">
                <div className="d-flex flex-wrap align-items-center gap-2 justify-content-end">
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small fw-bold">
                      From:
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small fw-bold">To:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>

                  {/* COLUMN SELECTION DROPDOWN */}
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle px-3 d-flex align-items-center"
                      style={{ height: "32px" }}
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Columns
                    </button>

                    <div
                      className="dropdown-menu p-3 shadow"
                      style={{ minWidth: "200px" }}
                    >
                      {EXPORT_COLUMNS.map((col) => (
                        <div className="form-check mb-2" key={col.key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`col-${col.key}`}
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() =>
                              setSelectedExportColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter((k) => k !== col.key)
                                  : [...prev, col.key],
                              )
                            }
                          />

                          <label
                            className="form-check-label ms-2 small"
                            htmlFor={`col-${col.key}`}
                          >
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* EXCEL BUTTON */}
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

          <div className="card-body p-0 mt-2">
            <DataTable
              columns={columns}
              data={filteredReports}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={
                <div className="p-5 text-muted">
                  {loading
                    ? "Fetching records..."
                    : "No matching records found."}
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerVehicleReportLayer;
