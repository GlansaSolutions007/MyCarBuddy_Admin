import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const InvoiceViewLayer = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}Bookings/BookingId?Id=${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBookingData(res.data[0]);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };
  const INV_STATIC = "https://api.mycarsbuddy.com";
  

  const activeInvoice = bookingData?.Invoices?.find(
    (inv) => inv.IsActive === true
  );

  const invoicePdfUrl = activeInvoice?.FolderPath
    ? `${INV_STATIC}/Invoices/${activeInvoice.FolderPath.split("\\").pop()}`
    : null;

    const invoiceNumber = activeInvoice?.FolderPath
  ? activeInvoice.FolderPath.split("\\").pop().replace(".pdf", "")
  : null;


  const handlePrint = () => {
    if (invoicePdfUrl) {
      window.open(invoicePdfUrl, "_blank");
    } else {
      alert("Invoice PDF not available");
    }
  };

  const handleSendFinalInvoice = async () => {
    if (!bookingData?.BookingID || !invoiceNumber) {
      alert("Invoice data not available");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}Leads/SendFinalInvoiceEmail`,
        {
          bookingID: bookingData.BookingID,
          invoiceNumber: invoiceNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Invoice sent successfully");
    } catch (error) {
      console.error("Send Invoice Error:", error);
      alert("Failed to send invoice");
    }
  };
  const handleSendEstimatedInvoice = async () => {
    if (!bookingData?.BookingID || !invoiceNumber) {
      alert("Invoice data not available");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}Leads/SendEstimationInvoiceEmail`,
        {
          bookingID: bookingData.BookingID,
          invoiceNumber: invoiceNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Estimation Invoice sent successfully");
    } catch (error) {
      console.error("Send Estimation Invoice Error:", error);
      alert("Failed to send Estimation invoice");
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return <div className="alert alert-danger">Booking data not found.</div>;
  }

  return (
    <div className="container-fluid p-4">
      {/* Print Button */}
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <button
          className="btn btn-secondary d-inline-flex align-items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <Icon icon="mdi:arrow-left" />
          <span>Back</span>
        </button>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success-600 d-inline-flex align-items-center gap-2"
            onClick={handleSendEstimatedInvoice}
          >
            <Icon icon="mdi:email-send-outline" />
            <span>Send Estimation Invoice</span>
          </button>
          <button
            className="btn btn-success-600 d-inline-flex align-items-center gap-2"
            onClick={handleSendFinalInvoice}
          >
            <Icon icon="mdi:email-send-outline" />
            <span>Send Final Invoice</span>
          </button>

          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <Icon icon="mdi:printer" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Container */}
      {invoicePdfUrl ? (
        <div
          className="bg-white shadow-sm"
          style={{
            width: "100%",
            height: "85vh",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <iframe
            src={invoicePdfUrl}
            title="Invoice PDF"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </div>
      ) : (
        <div className="alert alert-warning">Active invoice PDF not found.</div>
      )}
    </div>
  );
};

export default InvoiceViewLayer;
