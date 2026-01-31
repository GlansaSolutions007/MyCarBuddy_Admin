import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const InvoiceViewLayer = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dealerList, setDealerList] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(null); // "whatsapp-estimation" | "email-estimation" | "whatsapp-final" | "email-final" | "dealer"

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
        },
      );

      const data = res.data[0];
      setBookingData(data);

      // 🔥 Extract unique dealer IDs
      const dealersMap = new Map();

      data?.BookingAddOns?.forEach((addon) => {
        if (addon.DealerID && addon.DealerName) {
          dealersMap.set(addon.DealerID, addon.DealerName);
        }
      });

      const dealers = Array.from(dealersMap.entries()).map(
        ([dealerId, dealerName]) => ({
          dealerId,
          dealerName,
        }),
      );
      setDealerList(dealers);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDealerInvoice = async (dealerId) => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}Dealer/GenerateDealerInvoice`,
        {
          bookingID: bookingData.BookingID,
          dealerID: dealerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Invoice Generated",
        text: "Dealer invoice generated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchBookingData(); // refresh invoice view
    } catch (error) {
      console.error("Generate Dealer Invoice Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to generate dealer invoice.",
        "error",
      );
    }
  };

  const handleSendDealerInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }

    if (!selectedDealer) {
      Swal.fire("Error", "Please select a dealer.", "error");
      return;
    }

    if (!activeInvoice) {
      Swal.fire("Error", "No active invoice found.", "error");
      return;
    }

    try {
      setSendingInvoice("dealer");
      await axios.post(
        `${API_BASE}Dealer/SendDealerInvoice`,
        {
          bookingID: bookingData.BookingID,
          dealerID: selectedDealer,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Invoice Sent",
        text: "Dealer invoice sent successfully.",
      });
    } catch (error) {
      console.error("Send Dealer Invoice Error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          error?.response?.data?.message || "Failed to send dealer invoice.",
      });
    } finally {
      setSendingInvoice(null);
    }
  };

  // const INV_STATIC = ;

  const activeInvoice = bookingData?.Invoices?.find(
    (inv) => inv.IsActive === true,
  );
  const activeInvoiceType = activeInvoice?.InvoiceType;

  const invoicePdfUrl = activeInvoice?.FolderPath
    ? `${API_BASE}../${activeInvoice.FolderPath.split("\\").pop()}`
    : null;

  const invoiceNumber = activeInvoice?.FolderPath
    ? activeInvoice.FolderPath.split("\\").pop().replace(".pdf", "")
    : null;
    
  const invoiceNum = activeInvoice?.InvoiceNumber

  const handlePrint = () => {
    if (invoicePdfUrl) {
      window.open(invoicePdfUrl, "_blank");
    } else {
      Swal.fire({
        icon: "warning",
        title: "Invoice Not Available",
        text: "Invoice PDF is not available at the moment.",
      });
    }
  };

  const handleWhatsappEstimatedInvoice = async () => {
  if (!bookingData?.BookingID || !invoiceNumber) {
    Swal.fire({
      icon: "error",
      title: "Missing Invoice Data",
      text: "Invoice information is not available.",
    });
    return;
  }

  try {
    setSendingInvoice("whatsapp-estimation");
    await axios.post(
      `${API_BASE}Leads/SendEstimationInvoiceWhatsApp`,
      {
        bookingID: bookingData.BookingID,
        invoiceNumber: invoiceNum,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Swal.fire({
      icon: "success",
      title: "Sent",
      text: "Estimation invoice sent on WhatsApp successfully.",
    });
  } catch (error) {
    console.error("WhatsApp Estimation Invoice Error:", error);
    Swal.fire({
      icon: "error",
      title: "Failed",
      text:
        error?.response?.data?.message ||
        "Failed to send estimation invoice on WhatsApp.",
    });
  } finally {
    setSendingInvoice(null);
  }
};
const handleWhatsappFinalInvoice = async () => {
  if (!bookingData?.BookingID || !invoiceNumber) {
    Swal.fire({
      icon: "error",
      title: "Missing Invoice Data",
      text: "Invoice information is not available.",
    });
    return;
  }

  try {
    setSendingInvoice("whatsapp-final");
    await axios.post(
      // `${API_BASE}Leads/SendFinalInvoiceWhatsApp`,
      `${API_BASE}Leads/SendEstimationInvoiceWhatsApp`,
      {
        bookingID: bookingData.BookingID,
        invoiceNumber: invoiceNum,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Swal.fire({
      icon: "success",
      title: "Sent",
      text: "Final invoice sent on WhatsApp successfully.",
    });
  } catch (error) {
    console.error("WhatsApp Final Invoice Error:", error);
    Swal.fire({
      icon: "error",
      title: "Failed",
      text:
        error?.response?.data?.message ||
        "Failed to send final invoice on WhatsApp.",
    });
  } finally {
    setSendingInvoice(null);
  }
};


  const handleSendFinalInvoice = async () => {
    if (!bookingData?.BookingID || !invoiceNumber) {
      Swal.fire({
        icon: "error",
        title: "Missing Invoice Data",
        text: "Invoice information is not available.",
      });
      return;
    }

    try {
      setSendingInvoice("email-final");
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
        },
      );
      Swal.fire({
        icon: "success",
        title: "Invoice Sent",
        text: "Final invoice sent successfully.",
      });
    } catch (error) {
      console.error("Send Invoice Error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to send final invoice.",
      });
    } finally {
      setSendingInvoice(null);
    }
  };
  const handleEmailEstimatedInvoice = async () => {
    if (!bookingData?.BookingID || !invoiceNumber) {
      Swal.fire({
        icon: "error",
        title: "Missing Invoice Data",
        text: "Invoice information is not available.",
      });
      return;
    }
    try {
      setSendingInvoice("email-estimation");
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
        },
      );
      Swal.fire({
        icon: "success",
        title: "Estimation Sent",
        text: "Estimation invoice sent successfully.",
      });
    } catch (error) {
      console.error("Send Estimation Invoice Error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to send estimation invoice.",
      });
    } finally {
      setSendingInvoice(null);
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
        {activeInvoiceType === "Dealer" && (
        <div className="d-flex gap-2 align-items-center mb-3">
          <select
            className="form-select w-auto"
            value={selectedDealer}
            onChange={(e) => {
              const dealerId = e.target.value;
              setSelectedDealer(dealerId);

              if (dealerId) {
                handleGenerateDealerInvoice(dealerId);
              }
            }}
          >
            {/* <option value="">Select Dealer</option> */}
            {dealerList.map((dealer) => (
              <option key={dealer.dealerId} value={dealer.dealerId}>
                {dealer.dealerName}
              </option>
            ))}
          </select>
        </div>
        )}

        <div className="d-flex gap-2">
          {activeInvoiceType === "Estimation" && (
            <>
            <button
              className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
              onClick={handleWhatsappEstimatedInvoice}
              disabled={sendingInvoice === "whatsapp-estimation"}
            >
              <Icon icon="mdi:email-send-outline" />
              <span>{sendingInvoice === "whatsapp-estimation" ? "Sending..." : "Whatsapp Estimation Invoice"}</span>
            </button>
            <button
              className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
              onClick={handleEmailEstimatedInvoice}
              disabled={sendingInvoice === "email-estimation"}
            >
              <Icon icon="mdi:email-send-outline" />
              <span>{sendingInvoice === "email-estimation" ? "Sending..." : "Email Estimation Invoice"}</span>
            </button>
            </>
          )}
          {activeInvoiceType === "Final" && (
            <>
              <button
              className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
              onClick={handleWhatsappFinalInvoice}
              disabled={sendingInvoice === "whatsapp-final"}
            >
              <Icon icon="mdi:email-send-outline" />
              <span>{sendingInvoice === "whatsapp-final" ? "Sending..." : "Whatsapp Final Invoice"}</span>
            </button>
            <button
              className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
              onClick={handleSendFinalInvoice}
              disabled={sendingInvoice === "email-final"}
            >
              <Icon icon="mdi:email-send-outline" />
              <span>{sendingInvoice === "email-final" ? "Sending..." : "Email Final Invoice"}</span>
            </button>
            </>
          )}
          {activeInvoiceType === "Dealer" && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
                onClick={handleSendDealerInvoice}
                disabled={!activeInvoice || sendingInvoice === "dealer"}
              >
                <Icon icon="mdi:email-send" />
                <span>{sendingInvoice === "dealer" ? "Sending..." : "Send Dealer Invoice"}</span>
              </button>
            </div>
          )}
          {/* <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <Icon icon="mdi:printer" />
            <span>Print Invoice</span>
          </button> */}
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
