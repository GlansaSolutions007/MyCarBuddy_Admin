import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Accordion from 'react-bootstrap/Accordion';
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const TicketInnerLayer = () => {
  const { ticketId } = useParams();
  // Defensive: normalize to a valid id string
  const normalizedTicketId = String(ticketId ?? '').trim();
  const token = localStorage.getItem("token");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");

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
      const url = `${API_BASE}Tickets/ticketid?TicketId=${encodeURIComponent(normalizedTicketId)}`;
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      // Use specific API first with auth (if available), then fallback without auth
      let res;
      try {
        res = await axios.get(url, headers);
      } catch (e) {
        // retry without auth if unauthorized or header-related error
        res = await axios.get(url);
      }
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!data) {
        setTicket(null);
        setError("Ticket not found.");
      } else {
        setTicket(data);
        // preset status if present
        if (typeof data.Status === 'number') setSelectedStatus(String(data.Status));
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

  const statusBadge = (status) => {
    switch (status) {
      case 2:
        return <span className="badge bg-success">Resolved</span>;
      case 1:
        return <span className="badge bg-info">Under Review</span>;
      case 3:
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  const handleSubmitStatus = async () => {
    if (!ticket) return;
    if (selectedStatus === "") {
      Swal.fire({ icon: "warning", title: "Select status", text: "Please choose a status." });
      return;
    }
    try {
      const headers = token ? { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } } : { headers: { "Content-Type": "application/json" } };
      // Best-effort update; backend contract can be aligned later
      await axios.put(
        `${API_BASE}Tickets`,
        {
          ticketTrackId: ticket.TicketTrackId || ticket.TicketId || ticket.TicketID,
          status: Number(selectedStatus),
          statusDescription: statusDescription,
        },
        headers
      );
      Swal.fire({ icon: "success", title: "Updated", text: "Ticket status updated." });
      fetchTicket();
      setStatusDescription("");
    } catch (err) {
      console.error("Status update failed", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update status." });
    }
  };

  return (
    <div className="row gy-4 mt-3">
      {/* Extreme Left: Customer Details */}
      <div className="col-lg-3">
        <div className="user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            <div className="text-center border border-top-0 border-start-0 border-end-0">
              <img
                src={ticket?.BookingDetails?.ProfileImage ? `${import.meta.env.VITE_APIURL_IMAGE}${ticket.BookingDetails.ProfileImage}` : "/assets/images/user-grid/user-grid-img14.png"}
                alt="customer"
                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
              />
              <h6 className="mb-0 mt-16">{ticket?.CustomerName || "N/A"}</h6>
              <small className="text-secondary-light">{ticket?.CustomerPhone || ""}</small>
            </div>

            <div className="mt-24">
              <ul>
                <li className="d-flex align-items-start gap-2 mb-12">
                  <span className="text-md fw-semibold text-primary-light" style={{ minWidth: "110px" }}>Email:</span>
                  <span className="text-secondary-light fw-medium text-break" style={{ overflowWrap: "anywhere" }}>{ticket?.CustomerEmail || "-"}</span>
                </li>
                <li className="d-flex align-items-start gap-2 mb-12">
                  <span className="text-md fw-semibold text-primary-light" style={{ minWidth: "110px" }}>Ticket:</span>
                  <span className="text-secondary-light fw-medium">{ticket?.TicketTrackId || "-"}</span>
                </li>
                <li className="d-flex align-items-start gap-2 mb-12">
                  <span className="text-md fw-semibold text-primary-light" style={{ minWidth: "110px" }}>Created:</span>
                  <span className="text-secondary-light fw-medium">{ticket?.TicketCreatedDate || "-"}</span>
                </li>
              </ul>
              <div className="d-flex gap-2 mt-3">
                <Link to="/tickets" className="btn btn-secondary btn-sm">
                  <Icon icon="mdi:arrow-left" className="me-1" /> Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Booking Details + Description */}
      <div className="col-lg-6">
        <div className="card h-100">
          <div className="card-body p-24">
            {loading ? (
              <p>Loading ticket...</p>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : ticket ? (
              <div>
                {/* Status Update (always visible) */}
                <h6 className="fw-bold mb-3">Update Status</h6>
                <div className="p-3 border rounded-3 bg-base">
                  <div className="row g-3 align-items-start">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Status</label>
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
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="Add a description"
                        value={statusDescription}
                        onChange={(e) => setStatusDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button className="btn btn-primary-600 px-4" onClick={handleSubmitStatus}>Submit</button>
                  </div>
                </div>

                {/* Collapsible booking details and ticket description */}
                <Accordion className="mt-4">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Booking Details & Ticket Description</Accordion.Header>
                    <Accordion.Body>
                      <div className="row mb-3">
                        <div className="col-sm-6 mb-2"><strong>Booking ID:</strong> {ticket.BookingDetails?.BookingTrackID || "-"}</div>
                        <div className="col-sm-6 mb-2"><strong>Date:</strong> {ticket.BookingDetails?.BookingDate || "-"}</div>
                        <div className="col-sm-6 mb-2"><strong>Time Slot:</strong> {ticket.BookingDetails?.TimeSlot || "-"}</div>
                        <div className="col-sm-6 mb-2"><strong>Status:</strong> {ticket.BookingDetails?.BookingStatus || "-"}</div>
                        <div className="col-sm-6 mb-2"><strong>Technician:</strong> {ticket.BookingDetails?.TechFullName || "-"}</div>
                        <div className="col-sm-6 mb-2"><strong>Tech Phone:</strong> {ticket.BookingDetails?.TechPhoneNumber || "-"}</div>
                      </div>

                      <h6 className="fw-bold mb-2">Ticket Description</h6>
                      <p className="text-secondary-light mb-0">{ticket.TicketDescription || "-"}</p>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </div>
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Timeline */}
      <div className="col-lg-3">
        <div className="card h-100">
          <div className="card-body p-24">
            <h6 className="mb-3">Timeline</h6>
            {ticket?.TrackingHistory && ticket.TrackingHistory.length > 0 ? (
              <ul className="mb-0 list-unstyled">
                {ticket.TrackingHistory.map((item, idx) => (
                  <li key={idx} className="mb-3">
                    <div className="d-flex align-items-start gap-2">
                      <span className={`badge ${item.Status === 2 ? "bg-success" : item.Status === 1 ? "bg-info" : item.Status === 3 ? "bg-secondary" : "bg-warning text-dark"}`}>
                        {item.StatusName}
                      </span>
                      <div>
                        <div className="text-sm text-secondary">{item.StatusDate}</div>
                        <div className="text-sm">{item.StatusDescription || "-"}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary-light mb-0">No timeline available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketInnerLayer;


