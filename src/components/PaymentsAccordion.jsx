import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const PaymentsAccordion = ({ payments, refunds, apiImageBase }) => (
  <Accordion className="mb-3" defaultActiveKey="">
    <Accordion.Item eventKey="payments">
      <Accordion.Header>
        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
          <Icon icon="mdi:credit-card-multiple" width={20} height={20} />
          Payments
        </h6>
      </Accordion.Header>
      <Accordion.Body>
        <div className="d-flex flex-column gap-4">
          {(payments ?? []).length > 0 ? (
            <div className="table-responsive">
              <table
                className="table table-bordered table-hover align-middle mb-0"
                style={{ fontSize: "0.875rem", textAlign: "center" }}
              >
                <thead
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <tr>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>S.No</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Amount Paid</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Payment Mode</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Transaction ID</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Payment Date</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Status</th>
                    <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Proof Img.</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments ?? [])
                    .slice()
                    .reverse()
                    .map((pay, idx) => (
                      <tr key={pay.PaymentID ?? idx}>
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3 fw-semibold">
                          ₹{(pay.AmountPaid ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2 px-3">{pay.PaymentMode ?? "—"}</td>
                        <td className="py-2 px-3 text-nowrap" style={{ maxWidth: "180px" }} title={pay.TransactionID}>
                          {pay.TransactionID ?? "—"}
                        </td>
                        <td className="py-2 px-3">
                          {pay.PaymentDate
                            ? new Date(pay.PaymentDate).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{
                              fontSize: "0.7rem",
                              backgroundColor:
                                (pay.PaymentStatus || "").toLowerCase() === "success"
                                  ? "rgba(34,197,94,0.15)"
                                  : "rgba(234,179,8,0.15)",
                              color:
                                (pay.PaymentStatus || "").toLowerCase() === "success"
                                  ? "#16a34a"
                                  : "#ca8a04",
                            }}
                          >
                            {pay.PaymentStatus ?? "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {pay.ProofAttachment ? (
                            <img
                              src={`${apiImageBase}${pay.ProofAttachment}`}
                              alt="Payment Proof"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                              onClick={() =>
                                window.open(`${apiImageBase}${pay.ProofAttachment}`, "_blank")
                              }
                            />
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
            <p className="text-muted mb-0 text-center py-2">
              No payments recorded for this booking.
            </p>
          )}

          {(refunds ?? []).length > 0 && (
            <div>
              <h6 className="mb-2 fw-bold text-danger d-flex align-items-center gap-2">
                <Icon icon="mdi:cash-refund" width={18} height={18} />
                Refund Details
              </h6>
              <div className="table-responsive">
                <table
                  className="table table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: "0.875rem", textAlign: "center" }}
                >
                  <thead
                    style={{
                      backgroundColor: "#fff5f5",
                      borderBottom: "1px solid #fecaca",
                    }}
                  >
                    <tr>
                      <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>S.No</th>
                      {/* <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Refund ID</th> */}
                      <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Amount</th>
                      <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Method</th>
                      <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Transaction Ref</th>
                      <th className="text-nowrap py-2 px-3 fw-bold text-center" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Refunded At</th>
                      <th className="text-nowrap py-2 px-3 fw-bold text-center text-capitalize" style={{ fontSize: "0.75rem", color: "#7f1d1d" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(refunds ?? [])
                      .slice()
                      .reverse()
                      .map((ref, idx) => (
                        <tr key={ref.RefundID ?? idx}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          {/* <td className="py-2 px-3 fw-semibold">{ref.RefundID ?? "—"}</td> */}
                          <td className="py-2 px-3 fw-semibold">₹{Number(ref.Amount ?? 0).toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3">{ref.RefundMethod ?? "—"}</td>
                          <td className="py-2 px-3 text-nowrap" style={{ maxWidth: "180px" }} title={ref.TransactionRef}>
                            {ref.TransactionRef ?? "—"}
                          </td>
                          <td className="py-2 px-3">
                            {ref.RefundedAt
                              ? new Date(ref.RefundedAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-2 px-3">
                            <span className="badge rounded-pill px-2 py-1 bg-danger-subtle text-danger text-capitalize">
                              {ref.Status ?? "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>
);

export default PaymentsAccordion;