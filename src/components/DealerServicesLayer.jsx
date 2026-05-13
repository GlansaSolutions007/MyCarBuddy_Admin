import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;

// -------- EXPORT COLUMNS --------
const EXPORT_COLUMNS = [
  { key: "BookingID", label: "Booking ID" },
  { key: "TrackId", label: "Ticket ID" },
  { key: "AssignedDate", label: "Assigned Date", format: "date" },
  { key: "ServiceDisplayName", label: "Service Name" },
  { key: "StatusDisplay", label: "Status" },
  { key: "CompletedDate", label: "Completion Date", format: "date" },
];

const DealerServicesLayer = () => {
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
        `${API_BASE}Dealer/GetDealerServicesByStatus?DealerID=${dealerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiData = response.data?.bookingAddOns || [];

      const formattedData = apiData.map((item) => ({
        ...item,

        ServiceDisplayName:
          item.ServiceName || item.SB_ServiceName || "-",

        StatusDisplay:
          item.ServiceStatus ||
          item.SB_ServiceStatus ||
          item.LatestTrackingStatus ||
          "-",
      }));

      setReports(formattedData);
    } catch (error) {
      console.error("Error fetching dealer services:", error);
    } finally {
      setLoading(false);
    }
  };

  // -------- INITIAL LOAD --------
  useEffect(() => {
    if (dealerId) {
      fetchReports();
    }

    setSelectedExportColumns(EXPORT_COLUMNS.map((c) => c.key));
  }, [dealerId]);

  // -------- FILTERING --------
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

      const itemDate = item.AssignedDate
        ? new Date(item.AssignedDate)
        : null;

      const matchesFromDate =
        !fromDate || (itemDate && itemDate >= new Date(fromDate));

      const matchesToDate =
        !toDate ||
        (itemDate &&
          itemDate <=
            new Date(new Date(toDate).setHours(23, 59, 59, 999)));

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [reports, searchTerm, fromDate, toDate]);

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

    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({
      wch: 25,
    }));

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Dealer Services Report"
    );

    XLSX.writeFile(
      wb,
      `dealer_services_report_${
        new Date().toISOString().slice(0, 10)
      }.xlsx`
    );
  };

  // -------- TABLE COLUMNS --------
  const columns = [
    {
      name: "Booking ID",
      selector: (row) => row.BookingID || "-",
      sortable: true,
      width: "130px",
    },

    {
      name: "Ticket ID",
      selector: (row) => row.TrackId || "-",
      sortable: true,
      width: "140px",
      cell: (row) => (
        <span className="fw-semibold text-primary">
          {row.TrackId || "-"}
        </span>
      ),
    },

    {
      name: "Assigned Date & Time",
      selector: (row) => row.AssignedDate,
      sortable: true,
      width: "220px",
      format: (row) =>
        row.AssignedDate
          ? new Date(row.AssignedDate).toLocaleString("en-GB", {
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
      name: "Service Name",
      selector: (row) => row.ServiceDisplayName || "-",
      sortable: true,
      grow: 2,
      cell: (row) => (
        <span className="fw-medium">
          {row.ServiceDisplayName || "-"}
        </span>
      ),
    },

    {
      name: "Status",
      selector: (row) => row.StatusDisplay || "-",
      sortable: true,
      width: "220px",
      cell: (row) => (
        <span className="badge bg-primary-subtle text-dark px-3 py-2 fw-medium rounded-pill">
          {row.StatusDisplay || "-"}
        </span>
      ),
    },

    {
      name: "Completion Date & Time",
      selector: (row) => row.CompletedDate,
      sortable: true,
      width: "220px",
      format: (row) =>
        row.CompletedDate
          ? new Date(row.CompletedDate).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "-",
    },
  ];

  return (
    <div className="row mt-3">
      <div className="col-12">
        <div className="card overflow-hidden py-3 shadow-sm border-0">
          {/* HEADER */}
          <div className="card-header bg-white border-0">
            <div className="row align-items-center g-2">
              
              {/* SEARCH */}
              <div className="col-12 col-md-4">
                <div
                  className="navbar-search"
                  style={{ maxWidth: "320px" }}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Booking ID, Ticket ID, Service..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                  />

                  <Icon
                    icon="ion:search-outline"
                    className="icon"
                  />
                </div>
              </div>

              {/* FILTERS */}
              <div className="col-12 col-md-8 ms-auto">
                <div className="d-flex flex-wrap align-items-center gap-2 justify-content-end">
                  
                  {/* FROM DATE */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small fw-bold">
                      From:
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={fromDate}
                      onChange={(e) =>
                        setFromDate(e.target.value)
                      }
                    />
                  </div>

                  {/* TO DATE */}
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small fw-bold">
                      To:
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={toDate}
                      onChange={(e) =>
                        setToDate(e.target.value)
                      }
                    />
                  </div>

                  {/* COLUMN DROPDOWN */}
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle px-3 d-flex align-items-center"
                      style={{ height: "38px" }}
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Columns
                    </button>

                    <div
                      className="dropdown-menu p-3 shadow"
                      style={{ minWidth: "220px" }}
                    >
                      {EXPORT_COLUMNS.map((col) => (
                        <div
                          className="form-check mb-2"
                          key={col.key}
                        >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`col-${col.key}`}
                            checked={selectedExportColumns.includes(
                              col.key
                            )}
                            onChange={() =>
                              setSelectedExportColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter(
                                      (k) => k !== col.key
                                    )
                                  : [...prev, col.key]
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

                  {/* EXPORT BUTTON */}
                  <button
                    className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    onClick={exportToExcel}
                    title="Export to Excel"
                  >
                    <Icon
                      icon="mdi:microsoft-excel"
                      width="22"
                      height="22"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
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

export default DealerServicesLayer;