import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const PaymentsListLayer = () => {
   const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");


  useEffect(() => {
    fetchPayments();
  }, []);
const fetchPayments = () => {
  const dummyData = [
    {
      PaymentID: 1,
      BookingID: "BK1001",
      AmountPaid: 1499.0,
      PaymentMode: "UPI",
      TransactionID: "TXN123456",
      PaymentDate: "2025-07-17T10:30:00",
      IsRefunded: false,
    },
    {
      PaymentID: 2,
      BookingID: "BK1002",
      AmountPaid: 999.0,
      PaymentMode: "Cash",
      TransactionID: "TXN987654",
      PaymentDate: "2025-07-16T14:15:00",
      IsRefunded: true,
    },
    {
      PaymentID: 3,
      BookingID: "BK1003",
      AmountPaid: 1200.0,
      PaymentMode: "Card",
      TransactionID: "TXN135790",
      PaymentDate: "2025-07-15T09:00:00",
      IsRefunded: false,
    },
  ];

  setPayments(dummyData);
};

//   const fetchPayments = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}Payments`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setPayments(res.data.jsonResult); // assuming your API returns data in jsonResult
//     } catch (error) {
//       console.error("Error fetching payments", error);
//     }
//   };

const columns = [
    { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "Booking ID", selector: (row) => row.BookingID },
    { name: "Amount Paid", selector: (row) => `₹${row.AmountPaid}` },
    { name: "Payment Mode", selector: (row) => row.PaymentMode },
    { name: "Transaction ID", selector: (row) => row.TransactionID },
    {
      name: "Payment Date",
      selector: (row) => new Date(row.PaymentDate).toLocaleString(),
    },
    {
      name: "Refunded",
      selector: (row) =>
        row.IsRefunded ? (
          <span className="badge bg-danger">Yes</span>
        ) : (
          <span className="badge bg-success">No</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
            <Link 
            to={`/edit-payment/${row.PaymentID}`}
            className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="Edit"
          >
            <Icon icon="lucide:edit" />
          </Link>
          {/* view */}
          <Link
            to={`/view-payment/${row.PaymentID}`}   
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View"
          >
            <Icon icon="lucide:eye" />
          </Link>
          {/* invoice */}
          <Link
            to={`/invoice-preview/${row.PaymentID}`}
            className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="Invoice"
          >
            <Icon icon="tabler:invoice" />
          </Link>
          {/* refund */}
           {!row.IsRefunded && (
          <Link 
            // to={`/refund/${row.PaymentID}`}
             onClick={() => handleRefund(row.PaymentID)}
            className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="Refund"
          > 
            <Icon icon="tabler:currency-rupee" />
          </Link>
 )}
          {/* <button
            className="btn btn-sm btn-info"
            title="View JSON"
            onClick={() => handleView(row)}
          >
            <Icon icon="mdi:eye-outline" />
          </button> */}
         
            {/* <button
              className="btn btn-sm btn-warning"
              title="Refund"
             
            >
              <Icon icon="tabler:currency-rupee" />
            </button>
          */}
        </div>
      ),
    },
  ];


  const handleView = (payment) => {
  setSelectedPayment(payment);
  setViewModalOpen(true);
};

const handleRefund = (paymentId) => {
  const confirmed = window.confirm("Are you sure you want to refund this payment?");
  if (!confirmed) return;

  const updatedPayments = payments.map((p) =>
    p.PaymentID === paymentId ? { ...p, IsRefunded: true } : p
  );
  setPayments(updatedPayments);

  // optionally trigger an API call here
  // axios.post(`${API_BASE}/refund/${paymentId}`)
};


  const [searchText, setSearchText] = useState("");
const filteredPayments = payments.filter((payment) => {
  const search = searchText.toLowerCase();
  return (
    payment.PaymentID.toString().toLowerCase().includes(search) ||
    payment.BookingID.toLowerCase().includes(search) ||
    payment.PaymentMode.toLowerCase().includes(search) ||
    payment.TransactionID.toLowerCase().includes(search)
  );
});
  return (
   <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <form className="navbar-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </form>
          </div>
          <DataTable
            columns={columns}
            data={filteredPayments}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Payments available"
          />
        </div>
      </div>

      {viewModalOpen && selectedPayment && (
  <div className="modal fade show d-block" style={{ background: "#00000080" }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Payment Details</h5>
          <button
            className="btn-close"
            onClick={() => setViewModalOpen(false)}
          />
        </div>
        <div className="modal-body">
          <p><strong>Payment ID:</strong> {selectedPayment.PaymentID}</p>
          <p><strong>Booking ID:</strong> {selectedPayment.BookingID}</p>
          <p><strong>Amount:</strong> ₹{selectedPayment.AmountPaid}</p>
          <p><strong>Mode:</strong> {selectedPayment.PaymentMode}</p>
          <p><strong>Transaction:</strong> {selectedPayment.TransactionID}</p>
          <p><strong>Date:</strong> {new Date(selectedPayment.PaymentDate).toLocaleString()}</p>
          <p><strong>Refunded:</strong> {selectedPayment.IsRefunded ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  </div>
)}

      </div>
  );
};

export default PaymentsListLayer;
