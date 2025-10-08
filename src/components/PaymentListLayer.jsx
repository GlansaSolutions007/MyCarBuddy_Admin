import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const PaymentsListLayer = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refundStatus, setRefundStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

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
    const { value: refundAmount } = await Swal.fire({
      title: 'Enter Refund Amount',
      input: 'number',
      inputLabel: `Refund Amount (Max: ₹${row.AmountPaid})`,
      inputValue: row.AmountPaid,
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return 'Please enter a valid amount!';
        }
        if (parseFloat(value) > row.AmountPaid) {
          return 'Refund amount cannot exceed the paid amount!';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Refund',
      cancelButtonText: 'Cancel'
    });

    if (!refundAmount) return;

    try {
      const res = await axios.post(`${API_BASE}Refund/Refund`, {
        paymentId: row.TransactionID,
        amount: parseFloat(refundAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const updatedPayments = payments.map((p) =>
          p.PaymentID === row.PaymentID ? { ...p, IsRefunded: true } : p
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
    { name: "S.No", selector: (_, index) => index + 1, width: "70px" },
    { name: "Booking ID", selector: (row) => (
      <Link to={`/view-booking/${row.BookingID}`} className="text-primary">
        {row.BookingTrackID}
      </Link>
    ) },
    { name: "Invoice No", selector: (row) => row.InvoiceNumber },
    { name: "Amount Paid", selector: (row) => `₹${row.AmountPaid}` },
    { name: "Transaction ID", selector: (row) => row.TransactionID },
    {
      name: "Payment Date",
      selector: (row) => {
        if (!row.PaymentDate) return "";
        const date = new Date(row.PaymentDate);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
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
              href={row.FolderPath}
              target="_blank"
              rel="noopener noreferrer"
              className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="Invoice"
            >
              <Icon icon="tabler:invoice" />
            </a>
          )}

          {/* Refund */}
          {row.IsRefunded && (
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
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary radius-8 px-14 py-6 text-sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon icon="tabler:filter" /> Filters
                </button>
                <button className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center" onClick={exportToExcel}>
                  <Icon icon="mdi:microsoft-excel" />
                </button>
              </div>
            </div>
            {showFilters && (
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min Amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max Amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="date"
                  className="form-control"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="date"
                  className="form-control"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '160px' }}
                />
                <select
                  className="form-select"
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="all">All Refunds</option>
                  <option value="refunded">Refunded</option>
                  <option value="not_refunded">Not Refunded</option>
                </select>
                <button
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  onClick={() => {
                    setMinAmount("");
                    setMaxAmount("");
                    setStartDate("");
                    setEndDate("");
                    setRefundStatus("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
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
                    <a href={selectedPayment.FolderPath} target="_blank" rel="noopener noreferrer">
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
