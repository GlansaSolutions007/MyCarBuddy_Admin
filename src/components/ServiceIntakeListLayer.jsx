import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const ServiceIntakeListLayer = () => {
  const token = localStorage.getItem("token");
  const [inspectionRows, setInspectionRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQrImage, setSelectedQrImage] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    const fetchInspections = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}Inspection`, { headers });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setInspectionRows(data);
      } catch (error) {
        console.error("Failed to load inspection list", error);
        setInspectionRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspections();
  }, [headers]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadPdf = async (inspectionId, trackId) => {
    if (!inspectionId) return;

    setDownloadingId(inspectionId);
    try {
      const response = await axios.get(
        `${API_BASE}Inspection/checklist-pdf/${inspectionId}`,
        { headers, responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: response.data?.type || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inspection_checklist_${trackId || inspectionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download inspection checklist PDF", error);
      alert("Unable to download inspection checklist PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return inspectionRows.filter((row) => {
      const rowDate = row.CreatedDate ? new Date(row.CreatedDate) : null;
      const car = [row.Brand, row.Model, row.Fuel].filter(Boolean).join(" ");
      const textMatch =
        !q ||
        [
          row.TrackId,
          row.CustName,
          row.PhoneNumber,
          row.Email,
          row.VehicleNumber,
          car,
          row.AmountStatus,
          row.Location,
          row.Area,
          row.TechnicianName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      const statusMatch = status === "All" || row.AmountStatus === status;
      const dateMatch =
        (!from || (rowDate && rowDate >= from)) &&
        (!to || (rowDate && rowDate <= to));

      return textMatch && statusMatch && dateMatch;
    });
  }, [inspectionRows, searchText, status, fromDate, toDate]);

  const groupedChecklist = useMemo(
    () =>
      selectedChecklist.reduce((acc, item) => {
        if (!acc[item.Category]) acc[item.Category] = [];
        acc[item.Category].push(item);
        return acc;
      }, {}),
    [selectedChecklist]
  );

  const columns = [
    { name: "Track ID", selector: (row) => row.TrackId || "-", sortable: true },
    { name: "Customer", selector: (row) => row.CustName || "-", sortable: true },
    { name: "Phone", selector: (row) => row.PhoneNumber || "-" },
    {
      name: "Car",
      selector: (row) =>
        [row.Brand, row.Model].filter(Boolean).join(" ") || "-",
      sortable: true,
    },
    {
      name: "Vehicle No.",
      selector: (row) => row.VehicleNumber || "-",
      sortable: true,
    },
    {
      name: "Inspection Date",
      selector: (row) => formatDateTime(row.InspectionDate),
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row) =>
        row.InspectionAmount !== null && row.InspectionAmount !== undefined
          ? row.InspectionAmount
          : "-",
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.AmountStatus || "-",
      sortable: true,
      cell: (row) => (
        <span
          className={
            row.AmountStatus === "Success" || row.AmountStatus === "Completed"
              ? "badge bg-success-100 text-success-600"
              : "badge bg-warning-100 text-warning-600"
          }
        >
          {row.AmountStatus || "-"}
        </span>
      ),
    },
    {
      name: "PDF",
      button: true,
      cell: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
          onClick={() => handleDownloadPdf(row.Id, row.TrackId)}
          disabled={downloadingId === row.Id}
          title="Download checklist PDF"
        >
          <Icon icon="mdi:download" width="15" height="15" />
          {downloadingId === row.Id ? "..." : "PDF"}
        </button>
      ),
    },
    {
      name: "Checklist",
      button: true,
      cell: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
          onClick={() => {
            setSelectedChecklist(row.CheckList || []);
            setShowChecklistModal(true);
          }}
          title="View Checklist"
        >
          <Icon icon="mdi:eye" width="15" height="15" />
          View
        </button>
      ),
    },
    {
      name: "Payment",
      button: true,
      cell: (row) =>
        row.AmountStatus === "Pending" && row.QrImage ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
            onClick={() => {
              setSelectedQrImage(row.QrImage);
              setSelectedTrackId(row.TrackId);
              setShowPaymentModal(true);
            }}
            title="View Payment QR"
          >
            <Icon icon="mdi:credit-card" width="15" height="15" />
            Pay
          </button>
        ) : null,
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{ overflowX: "auto", whiteSpace: "nowrap" }}
            >
              <form
                className="navbar-search flex-grow-1 flex-shrink-1"
                style={{ minWidth: "180px" }}
              >
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search records…"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    style={{ minWidth: "200px", width: "100%" }}
                  />
                  <Icon
                    icon="ion:search-outline"
                    className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                    width="20"
                    height="20"
                  />
                </div>
              </form>

              <input
                type="date"
                className="form-control flex-shrink-0"
                placeholder="DD-MM-YYYY"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                className="form-control flex-shrink-0"
                placeholder="DD-MM-YYYY"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />

              <select
                className="form-select flex-shrink-0"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                style={{ minWidth: "140px", flex: "1 1 140px" }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>

              <Link
                to="/service-intake-form"
                className="btn btn-primary-600 d-inline-flex align-items-center flex-shrink-0"
                style={{ height: "34px" }}
              >
                <Icon icon="ic:baseline-plus" width="18" height="18" />
                <span className="ms-1">Add</span>
              </Link>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRows}
            progressPending={isLoading}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No intake records found"
          />
        </div>
      </div>

      {/* Checklist Modal */}
      {showChecklistModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
          onClick={() => setShowChecklistModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="d-flex align-items-center justify-content-between"
              style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", flexShrink: 0 }}
            >
              <div className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center bg-info-100 text-info-600"
                  style={{ width: 32, height: 32, borderRadius: "8px" }}
                >
                  <Icon icon="mdi:clipboard-check-outline" width="17" height="17" />
                </span>
                <h5 className="mb-0 fw-semibold" style={{ fontSize: "15px" }}>
                  Inspection Checklist
                </h5>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                style={{ width: 30, height: 30, padding: 0, borderRadius: "6px" }}
                onClick={() => setShowChecklistModal(false)}
                aria-label="Close"
              >
                <Icon icon="mdi:close" width="15" height="15" />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
              {selectedChecklist.length === 0 ? (
                <div
                  className="d-flex flex-column align-items-center justify-content-center text-muted"
                  style={{ padding: "36px 0" }}
                >
                  <Icon icon="mdi:clipboard-off-outline" width="38" height="38" style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p className="mb-0" style={{ fontSize: "13px" }}>No checklist available.</p>
                </div>
              ) : (
                Object.entries(groupedChecklist).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: "18px" }}>
                    <span
                      className="badge bg-light text-secondary"
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        border: "1px solid #dee2e6",
                        marginBottom: "10px",
                        display: "inline-block",
                      }}
                    >
                      {category}
                    </span>

                    <div className="d-flex flex-column gap-2">
                      {items.map((item) => (
                        <div
                          key={item.CheckListId}
                          className="d-flex align-items-start gap-2"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid",
                            borderColor: item.Status ? "#d1fae5" : "#fee2e2",
                            background: item.Status ? "#f0fdf4" : "#fff8f8",
                          }}
                        >
                          <span
                            className={`badge d-inline-flex align-items-center justify-content-center ${item.Status ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"}`}
                            style={{ width: 22, height: 22, borderRadius: "50%", fontSize: "12px", flexShrink: 0, marginTop: "1px" }}
                          >
                            {item.Status ? "✓" : "✗"}
                          </span>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#212529", lineHeight: 1.4 }}>
                              {item.CheckListName}
                            </div>
                            {item.Remarks && (
                              <div style={{ fontSize: "11.5px", color: "#6b7280", marginTop: "2px" }}>
                                {item.Remarks}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e9ecef", flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={() => setShowChecklistModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal — unchanged */}
      {showPaymentModal && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1040,
            }}
            onClick={() => setShowPaymentModal(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1050,
              background: "#fff",
              borderRadius: 16,
              padding: "36px 28px 28px",
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#9ca3af",
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>

            <h5 style={{ fontWeight: 700, marginBottom: 6 }}>
              Payment QR Code
            </h5>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Track ID: <strong>{selectedTrackId}</strong>
            </p>

            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "20px 16px 16px",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 220,
                  margin: "0 auto 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={selectedQrImage}
                  alt="Payment QR Code"
                  style={{
                    width: "170%",
                    height: "160%",
                    marginTop: "-28%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                Scan or share the payment link
              </p>
              <a
                href={selectedQrImage}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm w-100"
                style={{ fontSize: 13 }}
              >
                Download QR ↗
              </a>
            </div>

            <button
              type="button"
              className="btn btn-primary-600 w-100"
              onClick={() => setShowPaymentModal(false)}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceIntakeListLayer;