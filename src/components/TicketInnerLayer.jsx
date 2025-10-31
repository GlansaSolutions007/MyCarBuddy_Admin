import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const TicketInnerLayer = () => {
  const { ticketId } = useParams();
  const normalizedTicketId = String(ticketId ?? "").trim();
  const token = localStorage.getItem("token");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");

  // 🔹 Fetch ticket details
  const fetchTicket = async () => {
    setLoading(true);
    setError("");
    try {
      if (!normalizedTicketId) {
        setError("Invalid ticket id");
        setTicket(null);
        setLoading(false);
        return;
      }

      const url = `${API_BASE}Tickets/ticketid?TicketId=${encodeURIComponent(
        normalizedTicketId
      )}`;
      const headers = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      let res;
      try {
        res = await axios.get(url, headers);
      } catch {
        res = await axios.get(url);
      }

      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!data) {
        setError("Ticket not found.");
      } else {
        setTicket(data);
        if (typeof data.Status === "number") setSelectedStatus(String(data.Status));
      }
    } catch (err) {
      console.error("Failed to load ticket", err);
      setError("Failed to load ticket. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // 🔹 Handle Submit Status (with Description)
  const handleSubmitStatus = async () => {
    if (!ticket) return;
    if (selectedStatus === "") {
      Swal.fire({
        icon: "warning",
        title: "Select status",
        text: "Please choose a status.",
      });
      return;
    }

    try {
      const headers = token
        ? {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
        : { headers: { "Content-Type": "application/json" } };

      const payload = {
        ticketTrackId:
          ticket.TicketTrackId || ticket.TicketId || ticket.TicketID,
        status: Number(selectedStatus),
        description: statusDescription,
      };

      await axios.put(`${API_BASE}Tickets`, payload, headers);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Ticket status updated successfully.",
      });

      fetchTicket();
      setStatusDescription("");
    } catch (err) {
      console.error("Status update failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
      });
    }
  };

  return (
    <div className="row gy-4 mt-3">
      {/* ------------------ Left: Customer Info ------------------ */}
      <div className="col-lg-4">
        <div className="user-grid-card pt-3 border radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            <h6 className="text-xl mb-16 border-bottom pb-2">Customer Info</h6>

            <div className="text-center border-bottom pb-16">
              <img
                src={
                  ticket?.BookingDetails?.ProfileImage
                    ? `${import.meta.env.VITE_APIURL_IMAGE}${ticket.BookingDetails.ProfileImage
                    }`
                    : "/assets/images/user-grid/user-grid-img14.png"
                }
                alt="customer"
                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
              />
              <h6 className="mb-0 mt-16">{ticket?.CustomerName || "N/A"}</h6>
              <span className="text-secondary-light">
                {ticket?.CustomerPhone || "-"}
              </span>
            </div>

            <div className="mt-24">
              <ul>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Email
                  </span>
                  <span className="w-70 text-secondary-light fw-medium text-break">
                    : {ticket?.CustomerEmail || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Ticket ID
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {ticket?.TicketTrackId || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Created
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {ticket?.TicketCreatedDate || "N/A"}
                  </span>
                </li>
              </ul>

              <div className="d-flex gap-2 mt-3">
                <Link
                  to="/tickets"
                  className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                >
                  <Icon icon="mdi:arrow-left" className="fs-5" />
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ Middle: Booking Details ------------------ */}
      <div className="col-lg-5">
        <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            {loading ? (
              <p>Loading ticket...</p>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : ticket ? (
              <>
                {/* Update Status */}
                <h6 className="text-xl mb-16 border-bottom pb-2">Update Status</h6>
                <div className="p-3 border radius-16 bg-light">
                  <div className="row g-3 align-items-start">
                    <div className="col-md-8">
                      <label className="form-label fw-semibold text-primary-light">
                        Description
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Add a description"
                        value={statusDescription}
                        onChange={(e) => setStatusDescription(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-primary-light">
                        Status
                      </label>
                      <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">Select status</option>
                        <option value="0">Pending</option>
                        <option value="1">Under Review</option>
                        <option value="2">Resolved</option>
                        <option value="3">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3">
                    <button
                      className="btn btn-primary-600 px-20 btn-sm"
                      onClick={handleSubmitStatus}
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/* --- Accordion Sections --- */}
                <Accordion defaultActiveKey="0" className="mt-3">
                  {/* Booking Details */}
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Booking Details</Accordion.Header>
                    <Accordion.Body>
                      <div className="row mb-3 text-md">
                        <div className="col-sm-6 mb-10">
                          <strong>Booking ID:</strong>{" "}
                          {ticket.BookingDetails?.BookingTrackID || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Date:</strong>{" "}
                          {ticket.BookingDetails?.BookingDate || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Time Slot:</strong>{" "}
                          {ticket.BookingDetails?.TimeSlot || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Status:</strong>{" "}
                          {ticket.BookingDetails?.BookingStatus || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Technician:</strong>{" "}
                          {ticket.BookingDetails?.TechFullName || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Tech Phone:</strong>{" "}
                          {ticket.BookingDetails?.TechPhoneNumber || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Vehicle Number:</strong>{" "}
                          {ticket.BookingDetails?.VehicleNumber || "-"}
                        </div>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Technician Tracking */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Technician Tracking</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.TechnicianTracking?.length > 0 ? (
                        <ul className="list-unstyled mb-0 text-md">
                          {ticket.BookingDetails.TechnicianTracking.map((track, idx) => {
                            // Helper to format date and time clearly
                            const formatDate = (dateStr) => {
                              if (!dateStr) return "-";
                              const date = new Date(dateStr);
                              return date.toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                            };

                            return (
                              <li key={idx} className="mb-3 p-3 border rounded-3 bg-light">
                                <div>
                                  <strong>🚗 Journey Started:</strong>{" "}
                                  <span className="text-secondary-light">{formatDate(track.JourneyStartedAt)}</span>
                                </div>
                                <div>
                                  <strong>📍 Reached At:</strong>{" "}
                                  <span className="text-secondary-light">{formatDate(track.ReachedAt)}</span>
                                </div>
                                <div>
                                  <strong>🧰 Service Started:</strong>{" "}
                                  <span className="text-secondary-light">{formatDate(track.ServiceStartedAt)}</span>
                                </div>
                                <div>
                                  <strong>✅ Service Ended:</strong>{" "}
                                  <span className="text-secondary-light">{formatDate(track.ServiceEndedAt)}</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-secondary-light mb-0">No tracking data available.</p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Payments */}
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>Payments</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.Payments?.length > 0 ? (
                        <ul className="list-unstyled mb-0 text-md">
                          {ticket.BookingDetails.Payments.map((p, idx) => (
                            <li key={idx} className="mb-2">
                              <div>
                                <strong>Transaction ID:</strong> {p.TransactionID}
                              </div>
                              <div>
                                <strong>Amount Paid:</strong> ₹{p.AmountPaid}
                              </div>
                              <div>
                                <strong>Status:</strong> {p.PaymentStatus}
                              </div>
                              <div>
                                <strong>Invoice:</strong>{" "}
                                <a href={p.FolderPath} target="_blank" rel="noreferrer">
                                  View PDF
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-secondary-light mb-0">
                          No payments available.
                        </p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Packages */}
                  <Accordion.Item eventKey="3">
                    <Accordion.Header>Packages</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.Packages?.length > 0 ? (
                        ticket.BookingDetails.Packages.map((pkg, idx) => (
                          <div key={idx} className="mb-3">
                            <h6 className="fw-semibold mb-2">{pkg.PackageName}</h6>
                            <div className="text-md mb-2">
                              <strong>Category:</strong>{" "}
                              {pkg.Category?.CategoryName || "-"}
                            </div>
                            <ul className="ms-3 text-md">
                              {pkg.Category?.SubCategories?.map((sub) => (
                                <li key={sub.SubCategoryID}>
                                  <strong>{sub.SubCategoryName}</strong>
                                  <ul>
                                    {sub.Includes?.map((inc) => (
                                      <li key={inc.IncludeID}>{inc.IncludeName}</li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p className="text-secondary-light mb-0">
                          No package data available.
                        </p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                {/* Ticket Description */}
                <h6 className="text-md fw-semibold text-primary-light mt-3 mb-2">
                  Ticket Description
                </h6>
                <p className="text-secondary-light mb-0 text-md">
                  {ticket.TicketDescription || "-"}
                </p>
              </>
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------ Right: Timeline ------------------ */}
      <div className="col-lg-3">
        <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            <h6 className="text-xl mb-16 border-bottom pb-2">Timeline</h6>
            {ticket?.TrackingHistory && ticket.TrackingHistory.length > 0 ? (
              <ul className="mb-0 list-unstyled ps-0">
                {ticket.TrackingHistory.map((item, idx) => (
                  <li
                    key={idx}
                    className="mb-3 pb-3 border-bottom border-dashed last:border-0"
                  >
                    <div className="d-flex align-items-start gap-3">
                      <span
                        className={`badge rounded-pill px-3 py-2 fw-semibold ${item.Status === 2
                          ? "bg-success text-white"
                          : item.Status === 1
                            ? "bg-info text-white"
                            : item.Status === 3
                              ? "bg-secondary text-white"
                              : "bg-warning text-dark"
                          }`}
                      >
                        {item.StatusName}
                      </span>
                      <div>
                        <div className="text-sm text-secondary-light fw-medium">
                          {item.StatusDate}
                        </div>
                        <div className="text-sm text-secondary-light">
                          {item.StatusDescription || "-"}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary-light mb-0">
                No timeline available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketInnerLayer;
