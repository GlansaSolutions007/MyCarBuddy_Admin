import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const InvoicesAccordion = ({ invoices, apiBase }) => (
  <Accordion className="mb-3" defaultActiveKey="">
    <Accordion.Item eventKey="invoices">
      <Accordion.Header>
        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
          <Icon icon="mdi:file-document-multiple" width={20} height={20} />
          Invoices (Estimation & Final)
        </h6>
      </Accordion.Header>
      <Accordion.Body>
        {(invoices ?? []).length > 0 ? (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>S.No</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Invoice No</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Type</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Total</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Tax</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Discount</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Net Amount</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Status</th>
                  <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>View</th>
                </tr>
              </thead>
              <tbody>
                {(invoices ?? [])
                  .slice()
                  .reverse()
                  .map((inv, idx) => (
                    <tr key={inv.InvoiceID ?? idx}>
                      <td className="py-2 px-3">{idx + 1}</td>
                      <td className="py-2 px-3 fw-semibold">{inv.InvoiceNumber ?? "—"}</td>
                      <td className="py-2 px-3">
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor:
                              (inv.InvoiceType || "").toLowerCase() === "final"
                                ? "rgba(13,148,136,0.15)"
                                : "rgba(59,130,246,0.15)",
                            color:
                              (inv.InvoiceType || "").toLowerCase() === "final"
                                ? "#0d9488"
                                : "#2563eb",
                          }}
                        >
                          {inv.InvoiceType ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3">₹{(inv.TotalAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3">₹{(inv.TaxAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3">₹{(inv.DiscountAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3 fw-bold">₹{(inv.NetAmount ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 px-3">
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor:
                              (inv.InvoiceStatus || "").toLowerCase() === "generated"
                                ? "rgba(34,197,94,0.15)"
                                : "rgba(148,163,184,0.2)",
                            color:
                              (inv.InvoiceStatus || "").toLowerCase() === "generated"
                                ? "#16a34a"
                                : "#64748b",
                          }}
                        >
                          {inv.InvoiceStatus ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {inv.FolderPath ? (
                          <a
                            href={`${apiBase.replace(/api\/?$/, "")}${inv.FolderPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary py-1 px-2"
                          >
                            <Icon icon="mdi:file-pdf-box" width={20} height={20} />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0 text-center py-4">
            No invoices recorded for this booking.
          </p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>
);

export default InvoicesAccordion;
