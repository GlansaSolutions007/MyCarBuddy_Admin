import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { usePermissions } from "../context/PermissionContext"

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PaymentsListLayer = () => {
  const { hasPermission } = usePermissions();
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refundStatus, setRefundStatus] = useState("all");
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const INVOICE_URL = "https://api.mycarsbuddy.com";

  // Helper function to get invoice URL from FolderPath
  const getInvoiceUrl = (folderPath) => {
    if (!folderPath) return null;
    let invoicePath;
    if (folderPath.startsWith('http://') || folderPath.startsWith('https://')) {
      const url = new URL(folderPath);
      invoicePath = url.pathname;
    } else {
      invoicePath = folderPath.startsWith('/') ? folderPath : '/' + folderPath;
    }
    return `${INVOICE_URL}${invoicePath}`;
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data); // your API returns array directly
    } catch (error) {
      console.error("Error fetching payments", error);
    }
  };

  const handleRefund = async (row) => {
    const refundedAmount = parseFloat(row.RefundAmount) || 0;
    const remaining = parseFloat(row.AmountPaid) - refundedAmount;

    if (remaining <= 0) {
      Swal.fire('Notification', 'Your full amount is refunded.', 'info');
      return;
    }

    const { value: refundAmount } = await Swal.fire({
      title: 'Enter Refund Amount',
      input: 'number',
      inputLabel: `Refund Amount (Max: ₹${remaining})`,
      inputValue: remaining,
      inputAttributes: {
        min: 0,
        max: remaining,
      },
      inputValidator: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a valid positive amount!';
        }
        if (num > remaining) {
          return 'Refund amount cannot exceed the remaining amount!';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Refund',
      cancelButtonText: 'Cancel'
    });

    if (!refundAmount) return;

    try {
      const res = await axios.post(`${API_BASE}Refund/Refund`, {
        bookingId: row.BookingID,
        paymentId: row.TransactionID,
        amount: parseFloat(refundAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const newRefundAmount = refundedAmount + parseFloat(refundAmount);
        const isFullyRefunded = newRefundAmount >= row.AmountPaid;
        const updatedPayments = payments.map((p) =>
          p.PaymentID === row.PaymentID ? { ...p, RefundAmount: newRefundAmount, IsRefunded: isFullyRefunded } : p
        );
        setPayments(updatedPayments);
        Swal.fire('Success', 'Refund processed successfully!', 'success');
      } else {
        Swal.fire('Error', res.data.message || 'Failed to process refund.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to process refund.', 'error');
      console.error('Refund error:', error);
    }
  };

  const columns = [
    { name: "S.No", selector: (_, index) => index + 1, width: "60px", sortable: true,},
    {
      name: "Booking ID", selector: (row) => (
        <Link to={`/booking-view/${row.BookingID}`} className="text-primary">
          {row.BookingTrackID}
        </Link>
      ), width: "150px", sortable: true,
    },
    { name: "Invoice No", selector: (row) => (row.InvoiceNumber), width: "150px", sortable: true, },
    { name: "Total Amount", selector: (row) => `₹${row.AmountPaid}`, sortable: true, },
    {
      name: "Payment Status",
      cell: (row) => {
        // Convert success → Paid, otherwise Pending
        const status =
          row.PaymentStatus?.toLowerCase() === "success"
            ? "Paid"
            : "Pending";

        // Color mapping
        const colorMap = {
          Paid: "#28A745",     // Green
          Pending: "#F57C00",  // Orange
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
      // width: "150px",
    },
    { name: "Payment Mode", selector: (row) => row.PaymentMode , sortable: true,},
    { name: "Transaction ID", selector: (row) => (row.TransactionID), width: "180px", sortable: true, },
    {
      name: "Payment Date",
      selector: (row) => {
        if (!row.PaymentDate) return "";
        const date = new Date(row.PaymentDate);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
      sortable: true,
    },
    { name: "Refund Amount", selector: (row) => row.RefundAmount ? `₹${row.RefundAmount}` : 0, sortable: true, },
    {
      name: "Refund Initialization",
      cell: (row) => {
        const status = row.IsRefunded ? "Raised" : "Not Raised";

        // Color mapping
        const colorMap = {
          Raised: "#E34242",       // Red
          "Not Raised": "#28A745", // Green
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
      // width: "170px",
    },
    // {
    //   name: "Refunded",
    //   selector: (row) =>
    //     row.IsRefunded ? (
    //       <span className="badge bg-danger">Yes</span>
    //     ) : (
    //       <span className="badge bg-success">No</span>
    //     ),
    // },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">

          {/* Invoice - open PDF */}
          {row.FolderPath && (
            <a
              href={getInvoiceUrl(row.FolderPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="Invoice"
            >
              <Icon icon="tabler:invoice" />
            </a>
          )}

          {/* Refund */}
          {row.IsRefunded && hasPermission("refunds_edit") &&(
            <button
              onClick={() => handleRefund(row)}
              className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="Refund"
            >
              <Icon icon="tabler:currency-rupee" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // const filteredPayments = payments.filter((payment) => {
  //   const search = searchText.toLowerCase();
  //   return (
  //     payment.BookingTrackID.toLowerCase().includes(search) ||
  //     payment.InvoiceNumber.toLowerCase().includes(search) ||
  //     payment.AmountPaid.toString().includes(search) ||
  //     payment.PaymentMode.toLowerCase().includes(search) ||
  //     payment.TransactionID.toLowerCase().includes(search) ||
  //     payment.PaymentDate.toLowerCase().includes(search) ||
  //     payment.IsRefunded.toString().includes(search)
  //   );
  // });


  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.PaymentMode?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.InvoiceNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.BookingTrackID?.toLowerCase().includes(searchText.toLowerCase());

    const matchesAmount = (!minAmount || parseFloat(payment.AmountPaid) >= parseFloat(minAmount)) &&
      (!maxAmount || parseFloat(payment.AmountPaid) <= parseFloat(maxAmount));

    const paymentDate = new Date(payment.PaymentDate);
    const matchesDate = (!startDate || paymentDate >= new Date(startDate)) &&
      (!endDate || paymentDate <= new Date(endDate));

    const matchesRefund = refundStatus === 'all' ||
      (refundStatus === 'refunded' && payment.IsRefunded) ||
      (refundStatus === 'not_refunded' && !payment.IsRefunded);

    return matchesSearch && matchesAmount && matchesDate && matchesRefund;
  });

  // Export to Excel
  const exportToExcel = () => {
    if (!payments.length) return;
    const worksheet = XLSX.utils.json_to_sheet(payments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "Payments_Report.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!payments.length) return;
    const doc = new jsPDF();
    doc.text("Payments Report", 14, 10);

    // Prepare columns and rows
    const tableColumn = [
      "Payment ID",
      "Booking ID",
      "Invoice No",
      "Amount Paid",
      "Payment Mode",
      "Transaction ID",
      "Payment Date",
      "Refunded",
    ];

    const tableRows = payments.map((p) => [
      p.PaymentID,
      p.BookingTrackID || p.BookingID,
      p.InvoiceNumber,
      `₹${p.AmountPaid}`,
      p.PaymentMode,
      p.TransactionID,
      new Date(p.PaymentDate).toLocaleString(),
      p.IsRefunded ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save("Payments_Report.pdf");
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* 🔍 Search */}
              <form
                className="navbar-search flex-grow-1 flex-shrink-1 position-relative"
                style={{ minWidth: "180px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ minWidth: "200px", width: "100%" }}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* 📅 Date Range */}
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />

              {/* 💰 Amount Range */}
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Min Amount"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                style={{ minWidth: "120px", flex: "1 1 120px" }}
              />
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Max Amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                style={{ minWidth: "120px", flex: "1 1 120px" }}
              />

              {/* 🔁 Refund Status */}
              <select
                className="form-select flex-shrink-0"
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
                style={{ minWidth: "150px", flex: "1 1 150px" }}
              >
                <option value="all">All Refunds</option>
                <option value="refunded">Refunded</option>
                <option value="not_refunded">Not Refunded</option>
              </select>

              {/* 📊 Export Excel */}
              <button
                className="d-inline-flex align-items-center justify-content-center rounded-circle border-0"
                onClick={exportToExcel}
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#e8f5e9",
                  color: "#2e7d32",
                  flex: "0 0 auto",
                }}
              >
                <Icon icon="mdi:microsoft-excel" width="20" height="20" />
              </button>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredPayments}
            pagination
            paginationPerPage={10} // default rows per page
            paginationRowsPerPageOptions={[10, 25, 50, 100, filteredPayments.length]} // last option shows all
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Payments available"
          />
        </div>
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedPayment && (
        <div className="modal fade show d-block" style={{ background: "#00000080" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payment Details</h5>
                <button className="btn-close" onClick={() => setViewModalOpen(false)} />
              </div>
              <div className="modal-body">
                <p><strong>Payment ID:</strong> {selectedPayment.PaymentID}</p>
                <p><strong>Booking ID:</strong> {selectedPayment.BookingID}</p>
                <p><strong>Invoice No:</strong> {selectedPayment.InvoiceNumber}</p>
                <p><strong>Amount:</strong> ₹{selectedPayment.AmountPaid}</p>
                <p><strong>Mode:</strong> {selectedPayment.PaymentMode}</p>
                <p><strong>Transaction:</strong> {selectedPayment.TransactionID}</p>
                <p><strong>Date:</strong> {new Date(selectedPayment.PaymentDate).toLocaleString()}</p>
                <p><strong>Refunded:</strong> {selectedPayment.IsRefunded ? "Yes" : "No"}</p>
                {selectedPayment.FolderPath && (
                  <p>
                    <a href={getInvoiceUrl(selectedPayment.FolderPath)} target="_blank" rel="noopener noreferrer">
                      View Invoice PDF
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsListLayer;
