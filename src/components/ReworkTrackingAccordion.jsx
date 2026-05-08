import React from "react";
import Accordion from "react-bootstrap/Accordion";
import { Icon } from "@iconify/react";

const ReworkTrackingAccordion = ({ addonsTracking }) => {
  // Only render if data exists
  if (!addonsTracking || addonsTracking.length === 0) return null;

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

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "servicecompleted" || s === "completed") {
      return <span className="badge bg-success-subtle text-success border border-success">Service Completed</span>;
    }
    if (s === "rework") {
      return <span className="badge bg-danger-subtle text-danger border border-danger">Rework Initiated</span>;
    }
    return <span className="badge bg-secondary-subtle text-secondary">{status}</span>;
  };

  return (
    <Accordion className="mt-3 mb-3">
      <Accordion.Item eventKey="rework-tracking">
        <Accordion.Header>
          <div className="d-flex align-items-center gap-2">
             <Icon icon="mdi:restart" width={22} className="text-primary" />
            <h6 className="mb-0 fw-bold text-primary">Rework History</h6>
          </div>
        </Accordion.Header>
        <Accordion.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: "80px" }}>S.No</th>
                  <th>Service Name</th>
                  <th>Date & Time</th>
                  <th>Reason / Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {addonsTracking.map((item, index) => (
                  <tr key={item.Id || index}>
                    <td className="text-center">{index + 1}</td>
                    <td className="fw-semibold">{item.AddOnName}</td>
                    <td>{formatDate(item.CreatedDate)}</td>
                    <td className="text-muted">
                        {item.Reason ? (
                            <div className="d-flex align-items-center gap-1">
                                <Icon icon="mdi:comment-text-outline" />
                                {item.Reason}
                            </div>
                        ) : "—"}
                    </td>
                    <td>{getStatusBadge(item.Status)}</td>
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

export default ReworkTrackingAccordion;