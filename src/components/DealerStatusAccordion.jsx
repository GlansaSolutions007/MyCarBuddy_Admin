import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const DealerStatusAccordion = ({ dealerAddOnApproval }) => (
  <Accordion className="mb-3" defaultActiveKey="">
    <Accordion.Item eventKey="dealerStatus">
      <Accordion.Header>
        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
          <Icon icon="mdi:store-check" width={20} height={20} />
          Dealer Status
        </h6>
      </Accordion.Header>
      <Accordion.Body>
        {(dealerAddOnApproval ?? []).length > 0 ? (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>S.No</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Dealer Name</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Service Name</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Status</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Reason</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Status Date</th>
                </tr>
              </thead>
              <tbody>
                {(dealerAddOnApproval ?? [])
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <tr key={item.Id ?? idx}>
                      <td className="py-2 px-3">{idx + 1}</td>
                      <td className="py-2 px-3">{item.DealerName ?? "—"}</td>
                      <td className="py-2 px-3 fw-semibold">{item.ServiceName ?? "—"}</td>
                      <td className="py-2 px-3">
                        {(() => {
                          const status = (item.IsDealer_Confirm || "").toLowerCase();
                          const backgroundColor =
                            status === "approved"
                              ? "rgba(34,197,94,0.15)"
                              : status === "rejected"
                                ? "rgba(239,68,68,0.15)"
                                : status === "assigned"
                                  ? "rgba(250,204,21,0.20)"
                                  : "rgba(107,114,128,0.15)";
                          const color =
                            status === "approved"
                              ? "#16a34a"
                              : status === "rejected"
                                ? "#dc2626"
                                : status === "assigned"
                                  ? "#ca8a04"
                                  : "#6b7280";
                          return (
                            <span className="badge rounded-pill px-2 py-1" style={{ fontSize: "0.7rem", backgroundColor, color }}>
                              {item.IsDealer_Confirm ?? "—"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-3">{item.Reason ?? "—"}</td>
                      <td className="py-2 px-3">
                        {item.CreatedDate
                          ? new Date(item.CreatedDate).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0 text-center py-4">
            No dealer add-on approvals for this booking.
          </p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>
);

export default DealerStatusAccordion;
