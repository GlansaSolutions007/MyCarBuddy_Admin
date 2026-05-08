import React from "react";
import Accordion from "react-bootstrap/Accordion";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const TicketsAccordion = ({ tickets }) => {
  // Only render if there are tickets
  if (!tickets || tickets.length === 0) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "closed" || s === "resolved") return "bg-success";
    if (s === "pending" || s === "open") return "bg-warning text-dark";
    return "bg-primary";
  };

  return (
    <Accordion className="mt-3 mb-3">
      <Accordion.Item eventKey="tickets-data">
        <Accordion.Header>
          <div className="d-flex align-items-center gap-2 w-100">
            <Icon icon="mdi:ticket-confirmation-outline" width={22} className="text-primary" />
            <h6 className="mb-0 fw-bold text-primary">Tickets</h6>
          </div>
        </Accordion.Header>
        <Accordion.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Ticket ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Supervisor Assigned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={ticket.Id || index}>
                    <td className="fw-bold">
                    <Link
                        to={`/tickets/${ticket.Id}`}
                        className="text-primary text-decoration-none"
                    >
                        {ticket.TicketTrackId}
                    </Link>
                    </td>
                    <td>{formatDate(ticket.CreatedDate)}</td>
                    <td>
                      <span className={`badge rounded-pill ${getStatusClass(ticket.StatusName)}`}>
                        {ticket.StatusName}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticket.Description}>
                      {ticket.Description || "—"}
                    </td>
                    <td >
                      {ticket.IsAssign_Supervisor ? (
                        <span className="text-bold">
                        Yes
                        </span>
                      ) : (
                        <span className="text-muted">No</span>
                      )}
                    </td>
                    <td>
                      <a 
                        href={`/tickets/${ticket.Id}`} 
                        className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                      >
                         <Icon icon="lucide:eye" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default TicketsAccordion;