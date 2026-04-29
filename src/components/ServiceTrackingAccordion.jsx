import { Icon } from "@iconify/react";

const ServiceTrackingAccordion = ({
  bookingData,
  displayDate,
  formatPickType,
  handlePickupDropCancel,
  openPickupDropReassignModal,
  openPickupDropRescheduleModal,
  pickupDropActionLoading,
}) => (
  <div
    className="accordion mb-3"
    id="carPickupDropAccordion"
    style={{ scrollMarginTop: "4.5rem" }}
  >
    <div className="accordion-item border radius-16">
      <h2 className="accordion-header" id="headingPickupDrop">
        <button
          className="accordion-button collapsed fw-semibold gap-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapsePickupDrop"
          aria-expanded="false"
          aria-controls="collapsePickupDrop"
        >
          <Icon icon="mdi:car-side" width={20} height={20} className="text-primary" />
          <span className="fw-semibold text-primary">Service Tracking</span>
        </button>
      </h2>

      <div
        id="collapsePickupDrop"
        className="accordion-collapse collapse"
        aria-labelledby="headingPickupDrop"
        data-bs-parent="#carPickupDropAccordion"
      >
        <div className="mt-3">
          <div
            className="rounded-3 overflow-hidden border-0 shadow-sm position-relative"
            style={{
              backgroundColor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              zIndex: 1,
              isolation: "isolate",
            }}
          >
            <div
              className="px-3 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ backgroundColor: "#0d9488", color: "#fff", minHeight: "48px" }}
            >
              <span className="d-flex align-items-center gap-2 small fw-semibold text-white">
                <Icon icon="mdi:clipboard-check-outline" width={20} height={20} />
                BID : #{bookingData?.BookingTrackID || "—"}
              </span>
              <span className="opacity-90 fw-normal text-white ms-auto">
                Date : {displayDate(bookingData?.BookingDate)}
              </span>
            </div>

            <div className="p-4 position-relative" style={{ backgroundColor: "#fff" }}>
              {(() => {
                const list = bookingData?.CarPickUpDelivery ?? [];
                const formatTimeOnly = (t) => {
                  if (!t) return "";
                  const m = String(t)
                    .trim()
                    .match(/^(\d{1,2}):(\d{2})/);
                  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
                };
                const steps = list.map((record, idx) => {
                  const formattedPickType = formatPickType(record.PickType);
                  const routeType =
                    record.RouteType === "CustomerToDealer"
                      ? "Customer To Dealer"
                      : record.RouteType === "DealerToCustomer"
                        ? "Dealer To Customer"
                        : record.RouteType === "DealerToDealer"
                          ? "Dealer To Dealer"
                          : "—";
                  const isPick = (record.PickType || "").toLowerCase().includes("pick");
                  const assignStr = record.AssignDate
                    ? new Date(record.AssignDate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";
                  const sub =
                    record.PickupDate && record.PickupTime
                      ? `${displayDate(record.PickupDate)} ${formatTimeOnly(record.PickupTime)}`
                      : record.DeliveryDate && record.DeliveryTime
                        ? `${displayDate(record.DeliveryDate)} ${formatTimeOnly(record.DeliveryTime)}`
                        : assignStr;
                  return {
                    key: record.Id ?? idx,
                    label: [formattedPickType, routeType].filter(Boolean).join(" – ") || "Service at Doorstep",
                    sub,
                    icon: isPick ? "mdi:car-pickup" : "mdi:car-side",
                    done: !!(record.PickupDate || record.DeliveryDate),
                  };
                });
                if (steps.length === 0) {
                  return (
                    <p className="text-muted small mb-0 text-center py-3">
                      No pickup/drop records for this booking.
                    </p>
                  );
                }
                return (
                  <div className="d-flex align-items-flex-start py-20 justify-content-between position-relative">
                    {steps.map((step, idx) => (
                      <div
                        key={step.key}
                        className="d-flex flex-column align-items-center position-relative"
                        style={{ flex: "1 1 0", minWidth: 0, zIndex: 1 }}
                      >
                        {idx < steps.length - 1 && (
                          <div
                            className="position-absolute d-none d-md-block"
                            style={{
                              top: 20,
                              left: "calc(50% + 24px)",
                              width: "calc(100% - 28px)",
                              height: 3,
                              borderRadius: 2,
                              backgroundColor: "#0d9488",
                              zIndex: 0,
                            }}
                          />
                        )}
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                          style={{
                            width: 44,
                            height: 44,
                            backgroundColor: "#0d9488",
                            color: "#fff",
                            boxShadow: "0 2px 6px rgba(13,148,136,0.35)",
                          }}
                        >
                          <Icon icon={step.icon} width={20} height={20} />
                        </div>
                        <span className="small fw-bold text-center text-dark" style={{ fontSize: "12px", lineHeight: 1.25 }}>
                          {step.label}
                        </span>
                        <span className="small text-muted text-center mt-1" style={{ fontSize: "11px" }}>
                          {step.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {(bookingData?.CarPickUpDelivery ?? []).length > 0 && (
              <div className="border-top mt-4 pt-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, backgroundColor: "rgba(13,148,136,0.12)" }}
                  >
                    <Icon icon="mdi:format-list-bulleted" width={20} height={20} className="text-primary" />
                  </span>
                  <h6 className="mb-0 fw-bold text-dark">Technician Details</h6>
                </div>
                <div className="rounded-3 overflow-hidden border" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)", backgroundColor: "#fff" }}>
                  <div className="table-responsive">
                    <table className="table align-middle mb-0 table-center-all" style={{ fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th className="text-nowrap text-center ps-4 py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Tech ID</th>
                          <th className="text-nowrap text-center py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Assign Date</th>
                          <th className="text-nowrap text-center py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Route Type</th>
                          <th className="text-nowrap text-center py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Service Type</th>
                          <th className="text-nowrap text-center py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Status</th>
                          <th className="text-nowrap text-center pe-4 py-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bookingData?.CarPickUpDelivery ?? []).map((row, idx) => (
                          <tr
                            key={row.Id ?? row.BookingID ?? idx}
                            style={{
                              backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                              transition: "background 0.15s ease",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                            className="pickup-drop-row"
                          >
                            <td className="text-center ps-4 py-3 fw-semibold" style={{ color: "#334155" }}>{row.TechnicinaName ?? "—"}</td>
                            <td className="text-center py-3" style={{ color: "#475569" }}>
                              {row.AssignDate
                                ? new Date(row.AssignDate).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="text-center py-3" style={{ color: "#475569" }}>
                              {row.RouteType === "CustomerToDealer"
                                ? "Customer To Dealer"
                                : row.RouteType === "DealerToCustomer"
                                  ? "Dealer To Customer"
                                  : row.RouteType === "DealerToDealer"
                                    ? "Dealer To Dealer"
                                    : "—"}
                            </td>
                            <td className="text-center py-3" style={{ color: "#475569" }}>
                              {row.ServiceType === "ServiceAtGarage" ? "Service At Garage" : "Service At Home"}
                            </td>
                            <td className="text-center py-3">
                              <span
                                className="badge rounded-pill px-2 py-1"
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  backgroundColor:
                                    (row.Status || "").toLowerCase() === "assigned"
                                      ? "rgba(13,148,136,0.15)"
                                      : "rgba(100,116,139,0.15)",
                                  color:
                                    (row.Status || "").toLowerCase() === "assigned"
                                      ? "#0d9488"
                                      : "#64748b",
                                }}
                              >
                                {row.Status ?? "—"}
                              </span>
                            </td>
                            <td className="text-center pe-4 py-3">
                              <div className="d-flex flex-column align-items-center gap-2">
                                {row.IsCancelled === 0 && row.Status !== "completed" && (
                                  <div className="d-flex gap-2 justify-content-center flex-wrap">
                                    <button
                                      type="button"
                                      className="btn btn-press-effect btn-danger btn-sm d-inline-flex align-items-center gap-1"
                                      onClick={() => handlePickupDropCancel(row)}
                                      disabled={pickupDropActionLoading}
                                    >
                                      <Icon icon="mdi:close-circle-outline" width={18} height={18} />
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-press-effect btn-warning btn-sm d-inline-flex align-items-center gap-1 text-dark"
                                      onClick={() => openPickupDropReassignModal(row)}
                                      disabled={pickupDropActionLoading}
                                    >
                                      <Icon icon="mdi:account-switch-outline" width={18} height={18} />
                                      Reassign
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center gap-1"
                                      onClick={() => openPickupDropRescheduleModal(row)}
                                      disabled={pickupDropActionLoading}
                                    >
                                      <Icon icon="mdi:calendar-edit-outline" width={18} height={18} />
                                      Reschedule
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ServiceTrackingAccordion;
