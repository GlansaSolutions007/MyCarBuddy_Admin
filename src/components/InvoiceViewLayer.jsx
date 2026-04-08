import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const VALID_INVOICE_TYPES = ["Estimation", "Dealer", "Final"];

const InvoiceViewLayer = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dealerList, setDealerList] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(null); // "whatsapp-estimation" | "email-estimation" | "whatsapp-final" | "email-final" | "dealer"
  const [isInvoiceGenerated, setIsInvoiceGenerated] = useState(false);
  const token = localStorage.getItem("token");

  const typeFromUrl = searchParams.get("type");
  const dealerIdFromUrl = searchParams.get("dealerId"); 
  const urlInvoiceType =
    typeFromUrl && VALID_INVOICE_TYPES.includes(typeFromUrl)
      ? typeFromUrl
      : null;

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    const currentUserId = localStorage.getItem("userId");   
    const currentRoleId = localStorage.getItem("roleId");  
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

      const data = Array.isArray(res.data) ? res.data[0] : res.data;
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
      ).filter((dealer) => {
         if (currentRoleId === "3" && String(dealer.dealerId) === String(currentUserId)) {
          return false;
         }
          return true;  
      });

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

      await fetchBookingData(); 
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
      await fetchBookingData();
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

  // Resolve active invoice: use ?type=Estimation|Dealer|Final from URL when present, else first active
// 1. Get all invoices
  const invoices = bookingData?.Invoices || [];

  // 2. Filter by type (Estimation, Dealer, or Final)
  const filteredInvoices = invoices.filter((inv) => {
    if (!urlInvoiceType) return true;
    
    // Simply check if the type matches (e.g., show all 'Dealer' invoices)
    return inv.InvoiceType === urlInvoiceType;
  });
  // 3. Sort the filtered list
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const ad = new Date(a.CreatedDate || a.InvoiceDate || 0).getTime() || 0;
    const bd = new Date(b.CreatedDate || b.InvoiceDate || 0).getTime() || 0;
    if (bd !== ad) return bd - ad;
    const aid = Number(a.InvoiceID || 0);
    const bid = Number(b.InvoiceID || 0);
    return bid - aid;
  });

  const activeInvoice = urlInvoiceType
    ? sortedInvoices.find(
        (inv) => inv.InvoiceType === urlInvoiceType && inv.IsActive === true,
      ) || sortedInvoices.find((inv) => inv.InvoiceType === urlInvoiceType)
    : sortedInvoices.find((inv) => inv.IsActive === true) || sortedInvoices[0];
  const activeInvoiceType = activeInvoice?.InvoiceType;

  // When in Dealer view and dealer list is loaded, default to first dealer so "Send Dealer Invoice" works
  // useEffect(() => {
  //   if (
  //     activeInvoiceType === "Dealer" &&
  //     dealerList.length > 0 &&
  //     !selectedDealer &&
  //     dealerList[0]?.dealerId != null
  //   ) {
  //     setSelectedDealer(String(dealerList[0].dealerId));
  //   }
  // }, [activeInvoiceType, dealerList]);
  useEffect(() => {
  if (activeInvoiceType === "Dealer" && dealerList.length > 0) {
    // If dealerId is in URL, use it; otherwise default to the first dealer in the list
    const idToSelect = dealerIdFromUrl || String(dealerList[0].dealerId);
    setSelectedDealer(idToSelect);
  }
}, [activeInvoiceType, dealerList, dealerIdFromUrl]);

  const normalizedFolderPath = activeInvoice?.FolderPath
    ? (activeInvoice.FolderPath || "").replace(/\\/g, "/")
    : "";
  const invoicePdfUrl = normalizedFolderPath
    ? `${API_BASE}../${normalizedFolderPath}`
    : null;

  const invoiceNumber = activeInvoice?.FolderPath
    ? (activeInvoice.FolderPath || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop()
        .replace(".pdf", "")
    : null;

  const invoiceNum = activeInvoice?.InvoiceNumber;

  const allServicesForConfirm = [
    ...(bookingData?.BookingAddOns || []),
    ...(bookingData?.BookingsTempAddons || []),
    ...(bookingData?.SupervisorBookings || []),
  ];
  const unconfirmedServices = allServicesForConfirm.filter(
    (s) => (s.IsSupervisor_Confirm ?? s.isSupervisor_Confirm) !== 1,
  );

const handleGenerateInvoiceForView = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }
    try {
      setSendingInvoice("generate");

      if (urlInvoiceType === "Estimation") {
        await axios.post(
          `${API_BASE}Leads/GenerateEstimationInvoice`,
          { bookingID: bookingData.BookingID },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setIsInvoiceGenerated(true);
        Swal.fire({ icon: "success", title: "Generated", text: "Estimation invoice generated successfully." });
      } 
      else if (urlInvoiceType === "Final") {
        await axios.post(
          `${API_BASE}Leads/GenerateFinalInvoice`,
          { bookingID: bookingData.BookingID },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setIsInvoiceGenerated(true);
        Swal.fire({ icon: "success", title: "Generated", text: "Final invoice generated successfully." });
      }  else if (urlInvoiceType === "Dealer") {
      const dealerIdToGenerate = selectedDealer || dealerIdFromUrl;

      if (!dealerIdToGenerate) {
        Swal.fire("Error", "Please select a dealer from the dropdown.", "error");
        return;
      }
      await axios.post(
        `${API_BASE}Dealer/GenerateDealerInvoice`,
        {
          bookingID: bookingData.BookingID,
          dealerID: dealerIdToGenerate,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Swal.fire({ icon: "success", title: "Generated", text: "Dealer invoice generated successfully." });
    }
    await fetchBookingData(); 
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to generate invoice.",
      });
    } finally {
      setSendingInvoice(null);
    }
  };

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
      const supervisorId = Number(localStorage.getItem("userId") || 0);

      // ✅ STEP 1: Confirm Service Prices
      const priceConfirm = await Swal.fire({
        icon: "question",
        title: "Confirm Service Pricing",
        text: "Please confirm that you have reviewed all service prices.",
        showCancelButton: true,
        confirmButtonText: "Yes, I confirm",
        cancelButtonText: "Cancel",
      });

      if (!priceConfirm.isConfirmed) return;

      // ✅ STEP 2: Confirm Sending Estimation
      const sendConfirm = await Swal.fire({
        icon: "warning",
        title: "Send Estimation Invoice",
        text: "Do you want to send estimation invoice to the customer?",
        showCancelButton: true,
        confirmButtonText: "Yes, Send",
        cancelButtonText: "Cancel",
      });

      if (!sendConfirm.isConfirmed) return;

      // ✅ API CALL 1: Confirm Booking
      await axios.post(
        `${API_BASE}Supervisor/confirm-by-bookingid?bookingId=${encodeURIComponent(
          bookingData.BookingID,
        )}&supervisorId=${encodeURIComponent(supervisorId)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // ✅ API CALL 2: Send WhatsApp Estimation
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
        },
      );

      // ✅ Success Message
      Swal.fire({
        icon: "success",
        title: "Invoice Sent",
        text: "Estimation invoice successfully sent on WhatsApp.",
      });
      await fetchBookingData();
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
        `${API_BASE}Leads/SendFinalInvoiceWhatsApp`,
        // `${API_BASE}Leads/SendEstimationInvoiceWhatsApp`,
        {
          bookingID: bookingData.BookingID,
          invoiceNumber: invoiceNum,
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
        text: "Final invoice successfully sent on WhatsApp.",
      }).then(() => {
        setIsInvoiceGenerated(false);
        navigate(`/booking-view/${bookingData.BookingID}`);
      });
      await fetchBookingData();
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
        text: "Final invoice successfully send on email.",
      });
      await fetchBookingData();
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
      if (unconfirmedServices.length > 0) {
        const names = unconfirmedServices
          .map(
            (s) =>
              s.ServiceName || s.Name || `Service #${s.Id ?? s.AddOnID ?? "—"}`,
          )
          .join("<br/>");
        Swal.fire({
          icon: "warning",
          title: "Services not confirmed",
          html: `These services are not confirmed by supervisor:<br/><br/>${names}`,
        });
        return;
      }
      const supervisorId = Number(localStorage.getItem("userId") || 0);
      const confirmRes = await Swal.fire({
        icon: "warning",
        title: "Confirm & send Estimation?",
        text: "Please confirm that you have reviewed all service details and want to send the estimation invoice to the customer.",
        showCancelButton: true,
        confirmButtonText: "Yes, confirm & send",
        cancelButtonText: "Cancel",
      });
      if (!confirmRes.isConfirmed) return;

      await axios.post(
        `${API_BASE}Supervisor/confirm-by-bookingid?bookingId=${encodeURIComponent(
          bookingData.BookingID,
        )}&supervisorId=${encodeURIComponent(supervisorId)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
        text: "Estimation invoice successfully send on email.",
      });
      await fetchBookingData();
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
        {(urlInvoiceType === "Estimation" || urlInvoiceType === "Final"  || urlInvoiceType === "Dealer" ) && (
          <button
            className="btn btn-primary-600 d-inline-flex align-items-center gap-2"
            onClick={handleGenerateInvoiceForView}
            disabled={sendingInvoice === "generate"}
            title="Generate latest invoice"
          >
            <Icon icon="mdi:file-plus-outline" />
            <span>
              {sendingInvoice === "generate"
                ? "Generating..."
                : "Generate Invoice"}
            </span>
          </button>
        )}
        {urlInvoiceType === "Dealer" && (
          // <div className="d-flex gap-2 align-items-center mb-3">
          //   <select
          //     className="form-select w-auto"
          //     value={selectedDealer}
          //     onChange={(e) => {
          //       const dealerId = e.target.value;
          //       setSelectedDealer(dealerId);

          //       if (dealerId) {
          //         handleGenerateDealerInvoice(dealerId);
          //       }
          //     }}
          //   >
          //     {/* <option value="">Select Dealer</option> */}
          //     {dealerList.map((dealer) => (
          //       <option key={dealer.dealerId} value={dealer.dealerId}>
          //         {dealer.dealerName}
          //       </option>
          //     ))}
          //   </select>
          // </div>
          // Inside the return JSX for the Dealer dropdown:
            <select
              className="form-select w-auto"
              value={selectedDealer}
              onChange={(e) => {
                const dealerId = e.target.value;
                setSelectedDealer(dealerId);
                
                // Update the URL search params so the preview iframe and logic stay in sync
                setSearchParams({ type: "Dealer", dealerId: dealerId });
              }}
            >
              {dealerList.map((dealer) => (
                <option key={dealer.dealerId} value={dealer.dealerId}>
                  {dealer.dealerName}
                </option>
              ))}
            </select>
        )}
      </div>

      {/* Invoice Container */}
      {/* Invoices list (latest first) */}
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <div className="fw-semibold">Invoices (latest first)</div>
          <div className="small text-muted">
            {/* {sortedInvoices.length > 0
              ? `Showing ${sortedInvoices.length}`
              : ""} */}
              {sortedInvoices.length > 0 ? `Showing ${sortedInvoices.length} ${urlInvoiceType || ''} Invoices` : ""}
          </div>
        </div>

        {sortedInvoices.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Type</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((inv, idx) =>
                  (() => {
                    const isActiveRow = inv === activeInvoice;
                    return (
                      <tr
                        key={inv.InvoiceID ?? idx}
                        style={{
                          backgroundColor:
                            inv === activeInvoice
                              ? "rgba(37,99,235,0.06)"
                              : "transparent",
                        }}
                      >
                        <td className="fw-semibold">
                          {inv.InvoiceNumber ?? "—"}
                        </td>
                        <td>{inv.InvoiceType ?? "—"}</td>
                        <td>
                          {inv.CreatedDate
                            ? new Date(inv.CreatedDate).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </td>
                        <td>{inv.InvoiceStatus ?? "—"}</td>
                        <td className="text-end">
                          {isActiveRow &&
                            urlInvoiceType === "Estimation" &&
                            activeInvoice && (
                              <div className="d-inline-flex gap-2">
                                <button
                                  className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
                                  onClick={handleWhatsappEstimatedInvoice}
                                  disabled={
                                    sendingInvoice === "whatsapp-estimation"
                                  }
                                >
                                  <Icon icon="mdi:whatsapp" />
                                  <span>
                                    {sendingInvoice === "whatsapp-estimation"
                                      ? "Sending..."
                                      : "WhatsApp"}
                                  </span>
                                </button>

                                <button
                                  className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
                                  onClick={handleEmailEstimatedInvoice}
                                  disabled={
                                    sendingInvoice === "email-estimation"
                                  }
                                >
                                  <Icon icon="mdi:email-send-outline" />
                                  <span>
                                    {sendingInvoice === "email-estimation"
                                      ? "Sending..."
                                      : "Email"}
                                  </span>
                                </button>
                              </div>
                            )}

                          {isActiveRow && urlInvoiceType === "Final" && activeInvoice && (
                            <div className="d-inline-flex gap-2">
                              <button
                                className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
                                onClick={handleWhatsappFinalInvoice}
                                disabled={sendingInvoice === "whatsapp-final"}
                              >
                                <Icon icon="mdi:whatsapp" />
                                <span>
                                  {sendingInvoice === "whatsapp-final"
                                    ? "Sending..."
                                    : "WhatsApp"}
                                </span>
                              </button>
                              <button
                                className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
                                onClick={handleSendFinalInvoice}
                                disabled={sendingInvoice === "email-final"}
                              >
                                <Icon icon="mdi:email-send-outline" />
                                <span>
                                  {sendingInvoice === "email-final"
                                    ? "Sending..."
                                    : "Email"}
                                </span>
                              </button>
                            </div>
                          )}

                          {isActiveRow && urlInvoiceType === "Dealer" && activeInvoice && (
                            <button
                              className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
                              onClick={handleSendDealerInvoice}
                              disabled={
                                !activeInvoice || sendingInvoice === "dealer"
                              }
                            >
                              <Icon icon="mdi:email-send" />
                              <span>
                                {sendingInvoice === "dealer"
                                  ? "Sending..."
                                  : "Send"}
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })(),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-light border small mb-0">
            No invoices found.
          </div>
        )}
      </div>

      {/* Supervisor confirmation status for services */}
      {urlInvoiceType === "Estimation" && (
        <div className="mb-3">
          {unconfirmedServices.length > 0 ? (
            <div className="alert alert-warning small mb-0">
              <div className="fw-semibold mb-1">Pending Confirmations</div>
              <div className="text-muted mb-2">
                Newly Added Services to be confirmed by customer. Confirm and
                send estimation to the customer.
              </div>
              <ul className="mb-0 ps-3">
                {unconfirmedServices.slice(0, 8).map((s, idx) => (
                  <li key={s.Id ?? s.AddOnID ?? idx}>
                    <b>Service Name:</b>{" "}
                    {s.ServiceName || s.Name || "Unnamed service"}
                  </li>
                ))}
                {unconfirmedServices.length > 8 && (
                  <li>+ {unconfirmedServices.length - 8} more…</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="alert alert-success small mb-0">
              All services are confirmed by supervisor.
            </div>
          )}
        </div>
      )}

      {/* Estimation HTML preview (API) */}
      {urlInvoiceType === "Estimation" && (
        <div className="mb-3">
          <div
            className="bg-white shadow-sm"
            style={{
              width: "100%",
              height: "85vh",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <iframe
              src={`${API_BASE}Leads/ViewEstimationInvoice?bookingId=${bookingId}`}
              title="Estimation Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}

      {/* Final HTML preview (API) */}
      {urlInvoiceType === "Final" && (
        <div className="mb-3">
          <div
            className="bg-white shadow-sm"
            style={{
              width: "100%",
              height: "85vh",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <iframe
              src={`${API_BASE}Leads/ViewFinalInvoice?bookingId=${bookingId}`}
              title="Final Invoice Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
     {/* Dealer HTML preview (API) */}
      {urlInvoiceType === "Dealer" && (
        <div className="mb-3">
          <div className="bg-white shadow-sm" style={{ width: "100%", height: "85vh", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
            {/* Use selectedDealer first, fallback to dealerIdFromUrl */}
            {(selectedDealer || dealerIdFromUrl) ? (
              <iframe
                src={`${API_BASE}Leads/ViewDealerInvoice?bookingId=${bookingId}&dealerId=${selectedDealer || dealerIdFromUrl}`}
                title="Dealer Invoice Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            ) : (
              <div className="p-4 text-center text-danger">
                Please select a dealer to preview the invoice.
              </div>
            )}
          </div>
        </div>
      )}
      {/* {invoicePdfUrl ? (
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
      )} */}
    </div>
  );
};

export default InvoiceViewLayer;
