import { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import Select from "react-select";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import axios from "axios";

const EXPORT_COLUMNS = [
  { key: "dealerName", label: "Dealer Name" },
  { key: "bookingId", label: "Booking ID" },
  { key: "serviceType", label: "Service Type" },
  { key: "serviceName", label: "Service Name" },
  { key: "bookingDate", label: "Booking Date" },
  { key: "serviceCompletionDate", label: "Service Completion Date" },
  { key: "serviceTotalAmount", label: "Service Total Amount" },
  { key: "dealerTotalAmount", label: "Dealer Total Amount" },
  { key: "ourPercentAmount", label: "Our % Amount" },
  { key: "dealerPaymentStatus", label: "Payment Status" },
  { key: "paidAmount", label: "Paid Amount" },
  { key: "paymentDate", label: "Payment Date" },
];

const DealerPaymentsLayer = () => {
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedExportColumns, setSelectedExportColumns] = useState(
    EXPORT_COLUMNS.map((c) => c.key),
  );

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Fetch payments data from API
  useEffect(() => {
    fetchDealerPayments();
  }, []);

  const fetchDealerPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}Dealer/GetDealerExpenditures`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data && Array.isArray(response.data)) {
        const mappedPayments = response.data.map((item) => {
          // Convert Documents string to array format
          let documents = [];
          if (item.Documents) {
            // Construct full URL for document
            const baseUrl = API_BASE.replace("/api", "");
            const docUrl = item.Documents.startsWith("/")
              ? `${baseUrl}${item.Documents}`
              : item.Documents.startsWith("http")
                ? item.Documents
                : `${baseUrl}${item.Documents}`;
            const fileName = item.Documents.split("/").pop() || "document";
            documents = [
              {
                name: fileName,
                url: docUrl,
              },
            ];
          }

          // Map Status: "Unpaid" -> "Pending", "Paid" -> "Paid"
          const paymentStatus = item.Status === "Paid" ? "Paid" : "Pending";

          return {
            id: item.AddOnID,
            dealerId: item.DealerID,
            dealerName: item.DealerName,
            bookingId: item.BookingID?.toString() || "",
            bookingTrackID: item.BookingTrackID || "",
            serviceType: item.Type || "",
            serviceName: item.ServiceName || "",
            bookingDate: item.ServiceDate || "",
            serviceCompletionDate: item.ServiceCompletedDate || "",
            serviceTotalAmount: Number(item.ServiceAmount || 0),
            dealerTotalAmount: Number(item.DealerAmount || 0),
            ourPercentAmount: Number(item.OurAmount || 0),
            dealerPaymentStatus: paymentStatus,
            paidAmount: Number(item.PaidAmount || 0),
            paymentDate: item.PaymentDate || null,
            documents: documents,
          };
        });

        setPayments(mappedPayments);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      Swal.fire("Error", "Failed to load payments data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Get unique dealer names for dropdown
  const dealerOptions = useMemo(() => {
    const dealers = [...new Set(payments.map((p) => p.dealerName))];
    return dealers.map((dealer) => ({
      value: dealer,
      label: dealer,
    }));
  }, [payments]);

  // Payment status options
  const paymentStatusOptions = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Paid", label: "Paid" },
  ];

  // Payment mode options
  const paymentModeOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
    { value: "Cheque", label: "Cheque" },
    { value: "Online Payment", label: "Online Payment" },
  ];
  const normalizeAmount = (value) => Number(Number(value).toFixed(2));

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN");
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        searchText === "" ||
        payment.dealerName.toLowerCase().includes(searchText.toLowerCase()) ||
        payment.bookingId.toLowerCase().includes(searchText.toLowerCase()) ||
        payment.serviceName.toLowerCase().includes(searchText.toLowerCase());

      const matchesDealer =
        !selectedDealer || payment.dealerName === selectedDealer.value;

      const matchesStatus =
        !selectedPaymentStatus ||
        selectedPaymentStatus.value === "all" ||
        payment.dealerPaymentStatus === selectedPaymentStatus.value;

      const matchesDateRange =
        (!startDate || payment.serviceCompletionDate >= startDate) &&
        (!endDate || payment.serviceCompletionDate <= endDate);

      return (
        matchesSearch && matchesDealer && matchesStatus && matchesDateRange
      );
    });
  }, [
    payments,
    searchText,
    selectedDealer,
    selectedPaymentStatus,
    startDate,
    endDate,
  ]);

  // Handle Pay Now button click
  const handlePayNow = (payment) => {
    setSelectedPayment(payment);
    setPaymentMode(null);
    setPaymentAmount(
      (payment.dealerTotalAmount - payment.ourPercentAmount).toString(),
    );

    setExpenseDate(new Date().toISOString().split("T")[0]);
    setSelectedFiles([]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPaymentModalOpen(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Remove file from selection
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Reset file input to update the count
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return newFiles;
    });
  };

  // Get file preview URL
  const getFilePreview = (file) => {
    if (file.url) return file.url; // Already uploaded document
    return URL.createObjectURL(file); // New file
  };

  // Check if file is image
  const isImageFile = (file) => {
    if (file.url) {
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
    }
    return file.type?.startsWith("image/");
  };

  // Check if file is PDF
  const isPdfFile = (file) => {
    if (file.url) {
      return /\.pdf$/i.test(file.url);
    }
    return file.type === "application/pdf";
  };

  // Check if file is Excel
  const isExcelFile = (file) => {
    if (file.url) {
      return /\.(xls|xlsx)$/i.test(file.url);
    }
    return (
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  };

  // Check if file is Word
  const isWordFile = (file) => {
    if (file.url) {
      return /\.(doc|docx)$/i.test(file.url);
    }
    return (
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!filteredPayments.length) {
      Swal.fire("Info", "No data to export", "info");
      return;
    }

    if (!selectedExportColumns.length) {
      Swal.fire(
        "Error",
        "Please select at least one column to export",
        "error",
      );
      return;
    }

    const exportData = filteredPayments.map((item) => {
      const row = {};

      EXPORT_COLUMNS.forEach((col) => {
        if (!selectedExportColumns.includes(col.key)) return;

        let value = item[col.key];

        // Format dates
        if (
          (col.key === "bookingDate" ||
            col.key === "serviceCompletionDate" ||
            col.key === "paymentDate") &&
          value
        ) {
          value = formatDate(value);
        }

        // Format currency
        if (col.key.includes("Amount")) {
          value = formatCurrency(value || 0);
        }

        row[col.label] = value ?? "-";
      });

      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, "Dealer Payments");
    XLSX.writeFile(
      wb,
      `dealer_payments_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!paymentMode) {
      Swal.fire("Error", "Please select payment mode", "error");
      return;
    }

    if (!expenseDate) {
      Swal.fire("Error", "Please select expense date", "error");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Swal.fire("Error", "Please enter a valid payment amount", "error");
      return;
    }

    const remainingAmount =
      selectedPayment.dealerTotalAmount - selectedPayment.ourPercentAmount;
    if (Math.abs(Number(amount) - Number(remainingAmount)) > 0.0001) {
      Swal.fire(
        "Error",
        `Payment amount must be exactly ${formatCurrency(remainingAmount)} (full payment only)`,
        "error",
      );
      return;
    }

    try {
      const formData = new FormData();

      formData.append("expenseDate", new Date(expenseDate).toISOString());
      formData.append("expenseCategoryID", 1);
      formData.append("amount", amount);
      formData.append("paymentMode", paymentMode.value || paymentMode);
      formData.append("dealerID", selectedPayment.dealerId || 0);
      formData.append("technicianID", 0);
      formData.append("bookingID", Number(selectedPayment.bookingId));
      formData.append("referenceNo", selectedPayment.bookingTrackID || "");
      formData.append("notes", "");
      formData.append("status", "Paid");
      formData.append("createdBy", Number(userId) || 0);
      formData.append("isActive", true);
      formData.append("addOnId", selectedPayment.id || 0);

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("billPath", file);
        });
      }

      const response = await axios.post(
        `${API_BASE}Expenditure/Expenditure`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: `Payment of ${formatCurrency(amount)} has been recorded.`,
        });

        // Refresh payments data
        await fetchDealerPayments();

        setPaymentModalOpen(false);
        setSelectedPayment(null);
        setPaymentMode(null);
        setPaymentAmount("");
        setExpenseDate("");
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Failed to submit payment. Please try again.",
        "error",
      );
    }
  };

  // Table columns
  const columns = [
    {
      name: "Dealer Name",
      selector: (row) => row.dealerName,
      sortable: true,
      wrap: true,
      width: "150px",
    },
    {
      name: "Booking ID",
      selector: (row) => row.bookingTrackID,
      sortable: true,
      width: "150px",
    },
    {
      name: "Type",
      selector: (row) => row.serviceType,
      sortable: true,
      width: "130px",
    },
    {
      name: "Service Name",
      selector: (row) => row.serviceName,
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Booking Date",
      selector: (row) => formatDate(row.bookingDate),
      sortable: true,
      width: "140px",
    },
    {
      name: "Service Date",
      selector: (row) => formatDate(row.serviceCompletionDate),
      sortable: true,
      width: "140px",
    },
    {
      name: "Service Amount",
      selector: (row) => formatCurrency(row.serviceTotalAmount),
      sortable: true,
      right: true,
      width: "155px",
    },
    {
      name: "Dealer Amount",
      selector: (row) => formatCurrency(row.dealerTotalAmount),
      sortable: true,
      right: true,
      width: "150px",
    },
    {
      name: "Our Amount",
      selector: (row) => formatCurrency(row.ourPercentAmount),
      sortable: true,
      right: true,
      width: "140px",
    },
    {
      name: "Paid Amount",
      selector: (row) => formatCurrency(row.paidAmount),
      sortable: true,
      right: true,
      width: "140px",
    },
    {
      name: "Payment Date",
      selector: (row) => formatDate(row.paymentDate),
      sortable: true,
      width: "140px",
    },
    {
      name: "Documents",
      cell: (row) => {
        const documents = row.documents || [];
        if (documents.length === 0) {
          return <span className="text-muted">—</span>;
        }

        const getFileIconAndColor = (fileName) => {
          const ext = fileName.split(".").pop()?.toLowerCase();
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            return { icon: "mdi:file-image", color: "#6f42c1" }; // Purple for images
          } else if (ext === "pdf") {
            return { icon: "mdi:file-pdf-box", color: "#dc3545" }; // Red for PDF
          } else if (["doc", "docx"].includes(ext)) {
            return { icon: "mdi:file-word-box", color: "#0078d4" }; // Blue for Word
          } else if (["xls", "xlsx"].includes(ext)) {
            return { icon: "mdi:file-excel-box", color: "#28a745" }; // Green for Excel
          }
          return { icon: "mdi:file-document", color: "#6c757d" }; // Gray for others
        };

        return (
          <div className="d-flex flex-wrap gap-2">
            {documents.map((doc, index) => {
              const { icon, color } = getFileIconAndColor(doc.name);
              return (
                <button
                  key={index}
                  className="w-32-px h-32-px rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(doc.url, "_blank");
                  }}
                  title={doc.name}
                  style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    border: "none",
                  }}
                >
                  <Icon icon={icon} style={{ fontSize: "18px" }} />
                </button>
              );
            })}
          </div>
        );
      },
      sortable: false,
      width: "160px",
      wrap: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.dealerPaymentStatus;

        // Color map for status
        const colorMap = {
          Pending: "#F57C00", // Orange
          Paid: "#28A745", // Green
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
      width: "130px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          onClick={() => handlePayNow(row)}
          disabled={row.dealerPaymentStatus === "Paid"}
          title="Edit"
        >
          Pay
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      width: "120px",
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            {/* Filters - First Row */}
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by booking ID, or service name..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Select
                  isClearable
                  placeholder="Select Dealer"
                  options={dealerOptions}
                  value={selectedDealer}
                  onChange={(option) => setSelectedDealer(option)}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="col-md-3">
                <Select
                  isClearable
                  placeholder="Payment Status"
                  options={paymentStatusOptions}
                  value={selectedPaymentStatus}
                  onChange={(option) => setSelectedPaymentStatus(option)}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="d-flex align-items-center gap-2 w-100">
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

            <div className="row g-3 mb-3 align-items-center">
              <div className="col-md-3 d-flex align-items-center">
                <label
                  className="form-label mb-0 me-2"
                  style={{ minWidth: "100px" }}
                >
                  Service From:
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="col-md-3 d-flex align-items-center">
                <label
                  className="form-label mb-0 me-2"
                  style={{ minWidth: "80px" }}
                >
                  Service To:
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredPayments}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              responsive
              striped
              persistTableHead
              progressPending={loading}
              noDataComponent="No payments found"
            />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedPayment && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000080" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "650px", width: "90%" }}
          >
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-center">
                <h6 className="modal-title">Make Dealer Payment</h6>
              </div>

              <div className="modal-body">
                {/* Booking Info */}
                <div className="mb-3 p-3 border rounded bg-light">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Booking ID:</span>
                    <span>{selectedPayment.bookingId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Dealer:</span>
                    <span>{selectedPayment.dealerName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Service:</span>
                    <span>{selectedPayment.serviceName}</span>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span className="fw-semibold">Dealer Total Amount:</span>
                    <span className="fw-bold">
                      {formatCurrency(selectedPayment.dealerTotalAmount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span className="fw-semibold">Our % Amount:</span>
                    <span className="fw-bold">
                      {formatCurrency(selectedPayment.ourPercentAmount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <span className="fw-semibold">Amount to Pay:</span>
                    <span className="text-primary-600 fw-bold">
                      {formatCurrency(
                        selectedPayment.dealerTotalAmount -
                          selectedPayment.ourPercentAmount,
                      )}
                    </span>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Select Expense Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Select Payment Mode <span className="text-danger">*</span>
                    </label>
                    <Select
                      options={paymentModeOptions}
                      value={paymentMode}
                      onChange={(option) => setPaymentMode(option)}
                      placeholder="Select Payment Mode"
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Enter Payment Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    max={
                      selectedPayment.dealerTotalAmount -
                      selectedPayment.ourPercentAmount
                    }
                  />
                  <small className="text-muted">
                    Full payment required:{" "}
                    {formatCurrency(
                      selectedPayment.dealerTotalAmount -
                        selectedPayment.ourPercentAmount,
                    )}
                  </small>
                </div>

                {/* Document Upload */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Upload Documents (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">
                    Accepted formats: Images, PDF, Word, Excel
                  </small>
                </div>

                {/* Document Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Selected Documents Preview
                    </label>
                    <div
                      className="border rounded p-2"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      <div className="row g-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="col-md-6">
                            <div className="border rounded p-2 position-relative">
                              {/* Remove button - top right corner */}
                              <button
                                type="button"
                                className="position-absolute"
                                onClick={() => handleRemoveFile(index)}
                                style={{
                                  top: "8px",
                                  right: "8px",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: "rgba(220, 53, 69, 0.9)",
                                  border: "none",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  zIndex: 10,
                                }}
                                title="Remove"
                              >
                                <Icon
                                  icon="mdi:close"
                                  style={{ fontSize: "16px" }}
                                />
                              </button>
                              {isImageFile(file) ? (
                                <img
                                  src={getFilePreview(file)}
                                  alt={file.name}
                                  style={{
                                    width: "100%",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              ) : isPdfFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-pdf-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#dc3545",
                                    }}
                                  />
                                </div>
                              ) : isExcelFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-excel-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#28a745",
                                    }}
                                  />
                                </div>
                              ) : isWordFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-word-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#0078d4",
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-document"
                                    style={{
                                      fontSize: "32px",
                                      color: "#6c757d",
                                    }}
                                  />
                                </div>
                              )}
                              <div className="mt-1">
                                <small
                                  className="text-truncate d-block"
                                  style={{ maxWidth: "100%" }}
                                  title={file.name}
                                >
                                  {file.name.length > 20
                                    ? `${file.name.substring(0, 20)}...`
                                    : file.name}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer d-flex justify-content-center">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedPayment(null);
                    setPaymentMode(null);
                    setPaymentAmount("");
                    setExpenseDate("");
                    setSelectedFiles([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary-600"
                  onClick={handlePaymentSubmit}
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerPaymentsLayer;
