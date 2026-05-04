import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const InspectionDetailsAccordion = ({ inspectionTracking, formatCurrency, formatDateTime }) => {
  
  // NEW: Hide entirely if no data
  if (!inspectionTracking || inspectionTracking.length === 0) {
    return null;
  }

  return (
    <Accordion className="mb-3" defaultActiveKey="">
      <Accordion.Item eventKey="inspectionDetails">
        <Accordion.Header>
          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
            <Icon icon="mdi:file-document-multiple" width={20} height={20} />
            Inspection Details
          </h6>
        </Accordion.Header>
        <Accordion.Body>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Service Name</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Lead ID</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Inspection Amount</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>GST Amount</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>GST %</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Price</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Payment Status</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {inspectionTracking
                  .slice()
                  .reverse()
                  .map((inspection, idx) => (
                    <tr key={inspection.Id ?? idx}>
                      <td className="py-2 px-3 fw-semibold">{inspection.ServiceName ?? "-"}</td>
                      <td className="py-2 px-3">{inspection.LeadId ?? "-"}</td>
                      <td className="py-2 px-3">{formatCurrency(inspection.LabourCharges ?? 0)}</td>
                      <td className="py-2 px-3">{formatCurrency(inspection.GSTAmount ?? 0)}</td>
                      <td className="py-2 px-3">{inspection.GSTPercent}%</td>
                      <td className="py-2 px-3 fw-bold">{formatCurrency(inspection.TotalPrice)}</td>
                      <td className="py-2 px-3">
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor:
                              inspection.InspctionPaymentStatus === "Success"
                                ? "rgba(34,197,94,0.15)"
                                : "rgba(148,163,184,0.2)",
                            color:
                              inspection.InspctionPaymentStatus === "Success"
                                ? "#16a34a"
                                : "#64748b",
                          }}
                        >
                          {inspection.InspctionPaymentStatus === "Success" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="py-2 px-3">{formatDateTime(inspection.CreatedDate)}</td>
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

export default InspectionDetailsAccordion;