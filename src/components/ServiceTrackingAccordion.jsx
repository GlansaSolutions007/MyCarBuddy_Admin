import { Icon } from "@iconify/react";

const ServiceTrackingAccordion = ({
  bookingData,
  apiImageBase,
  displayDate,
  formatPickType,
  handlePickupDropCancel,
  openPickupDropReassignModal,
  openPickupDropRescheduleModal,
  pickupDropActionLoading,
}) => {
  const rows = bookingData?.CarPickUpDelivery ?? [];

  const toDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return `${apiImageBase || ""}${imageUrl}`;
  };

  const routeLabel = (routeType) => {
    if (routeType === "CustomerToDealer") return "Customer To Dealer";
    if (routeType === "DealerToCustomer") return "Dealer To Customer";
    if (routeType === "DealerToDealer") return "Dealer To Dealer";
    return "Doorstep Service";
  };

  const statusClass = (statusRaw) => {
    const status = (statusRaw || "").toLowerCase();
    if (status === "completed") return "bg-success-subtle text-success";
    if (status === "cancelled") return "bg-danger-subtle text-danger";
    if (status === "assigned") return "bg-primary-subtle text-primary";
    return "bg-warning-subtle text-warning";
  };

  const formatStatusLabel = (rawStatus) => {
    const value = (rawStatus || "").toString().trim();
    if (!value) return "Pending";
    const lower = value.toLowerCase();
    const explicit = {
      pickup_started: "Pickup Started",
      pickup_reached: "Pickup Reached",
      car_picked: "Car Picked",
      in_transit: "In Transit",
      drop_reached: "Drop Reached",
      servicestart: "Service Start",
      service_start: "Service Start",
      completed: "Completed",
      assigned: "Assigned",
      cancelled: "Cancelled",
    };
    if (explicit[lower]) return explicit[lower];
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  return (
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
              className="rounded-3 overflow-hidden border-0 shadow-sm"
              style={{ backgroundColor: "#fff" }}
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

              <div className="p-1 p-md-4">
                {rows.length === 0 ? (
                  <p className="text-muted small mb-0 text-center py-3">
                    No pickup/drop records for this booking.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {rows.map((row, idx) => {
                      const images = row?.BookingImages || [];
                      const pickupImages = images.filter(
                        (img) =>
                          (img?.ImageUploadType || "")
                            .toString()
                            .toLowerCase() === "pickup",
                      );
                      const deliveryImages = images.filter(
                        (img) =>
                          (img?.ImageUploadType || "")
                            .toString()
                            .toLowerCase() === "delivery",
                      );
                      const tracking = row?.DriverTracking || [];
                      const canAction = row.IsCancelled === 0 && row.Status !== "completed";
                      const isDoorstepService = row.ServiceType === "ServiceAtHome";

                      const accordionId = `tracking-row-${row.Id ?? idx}`;
                      return (
                        <div
                          key={row.Id ?? `${row.BookingID}-${idx}`}
                          className="accordion-item border rounded-3 overflow-hidden"
                          style={{ background: "#fcfcfd" }}
                        >
                          <h2 className="accordion-header" id={`heading-${accordionId}`}>
                            <button
                              className="accordion-button collapsed py-2 px-3"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#collapse-${accordionId}`}
                              aria-expanded="false"
                              aria-controls={`collapse-${accordionId}`}
                            >
                              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 w-100 pe-5">
                                <div>
                                  <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                                    <Icon icon="mdi:routes" width={18} height={18} className="text-primary" />
                                    {routeLabel(row.RouteType)}
                                    <span className="badge bg-light text-dark border">
                                      {formatPickType(row.PickType) || "Service"}
                                    </span>
                                  </div>
                                  <div className="small text-muted mt-1">
                                    Assigned: {toDateTime(row.AssignDate)}
                                  </div>
                                </div>
                                <span className={`badge rounded-pill px-3 py-2 me-1 ${statusClass(row.Status)}`}>
                                  {formatStatusLabel(row.Status)}
                                </span>
                              </div>
                            </button>
                          </h2>

                          <div
                            id={`collapse-${accordionId}`}
                            className="accordion-collapse collapse"
                            aria-labelledby={`heading-${accordionId}`}
                          >
                            <div className="accordion-body p-3">

                          {!isDoorstepService && (
                            <div className="row g-3 mt-1">
                              <div className="col-lg-6">
                                <div className="border rounded-3 p-2 h-100 bg-white">
                                  <div className="small fw-semibold text-muted">Pick From</div>
                                  <div className="fw-semibold">{row.PickFromName || "Customer"}</div>
                                  <div className="small text-muted">{row.PickFromPhone || "—"}</div>
                                  <div className="small text-muted">{row.PickFromAddress || "—"}</div>
                                  <div className="small fw-semibold text-muted mt-2 mb-1">Pickup Images</div>
                                  {pickupImages.length > 0 ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {pickupImages.map((img) => (
                                        <a
                                          key={img.ImageID}
                                          href={resolveImageUrl(img.ImageURL)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="d-inline-block border rounded-3 overflow-hidden"
                                          style={{ width: 90, height: 70 }}
                                          title={`Pickup - ${toDateTime(img.UploadedAt)}`}
                                        >
                                          <img
                                            src={resolveImageUrl(img.ImageURL)}
                                            alt="Pickup"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="small text-muted">No pickup images</div>
                                  )}
                                </div>
                              </div>
                              <div className="col-lg-6">
                                <div className="border rounded-3 p-2 h-100 bg-white">
                                  <div className="small fw-semibold text-muted">Drop At</div>
                                  <div className="fw-semibold">{row.PickToName || "Customer"}</div>
                                  <div className="small text-muted">{row.PickToPhone || "—"}</div>
                                  <div className="small text-muted">{row.PickToAddress || "—"}</div>
                                  <div className="small fw-semibold text-muted mt-2 mb-1">Delivery Images</div>
                                  {deliveryImages.length > 0 ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {deliveryImages.map((img) => (
                                        <a
                                          key={img.ImageID}
                                          href={resolveImageUrl(img.ImageURL)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="d-inline-block border rounded-3 overflow-hidden"
                                          style={{ width: 90, height: 70 }}
                                          title={`Delivery - ${toDateTime(img.UploadedAt)}`}
                                        >
                                          <img
                                            src={resolveImageUrl(img.ImageURL)}
                                            alt="Delivery"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="small text-muted">No delivery images</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="row g-3 mt-1">
                            <div className="col-lg-6">
                              <div className="border rounded-3 p-2 h-100 bg-white">
                                <div className="small fw-semibold text-muted mb-2">Technician / Driver</div>
                                <div className="fw-semibold">{row.TechnicinaName || "—"}</div>
                                <div className="small text-muted">{row.TechnicianPhoneNumber || "—"}</div>
                                <div className="small text-muted">
                                  Service Type:{" "}
                                  {row.ServiceType === "ServiceAtGarage"
                                    ? "Service At Garage"
                                    : "Service At Home"}
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="border rounded-3 p-2 h-100 bg-white">
                                <div className="small fw-semibold text-muted mb-2">Driver Tracking</div>
                                {tracking.length > 0 ? (
                                  <div className="d-flex flex-column">
                                    {tracking.map((event, eventIdx) => (
                                      <div
                                        key={event.Id}
                                        className="d-flex align-items-start gap-2 position-relative pb-2"
                                      >
                                        <div className="d-flex flex-column align-items-center" style={{ width: 16 }}>
                                          <span
                                            className="rounded-circle"
                                            style={{
                                              width: 10,
                                              height: 10,
                                              marginTop: 4,
                                              backgroundColor: "#0d9488",
                                            }}
                                          />
                                          {eventIdx < tracking.length - 1 && (
                                            <span
                                              style={{
                                                width: 2,
                                                flex: 1,
                                                minHeight: 20,
                                                marginTop: 2,
                                                backgroundColor: "#d1d5db",
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div className="d-flex flex-column">
                                          <span className="fw-semibold text-dark" style={{ fontSize: "0.82rem" }}>
                                            {formatStatusLabel(event.Status)}
                                          </span>
                                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                            {toDateTime(event.CreatedDate)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="small text-muted">No tracking events</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {isDoorstepService && (
                            <div className="mt-3">
                              <div className="small fw-semibold text-muted mb-2">Booking Images</div>
                              {images.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2">
                                  {images.map((img) => (
                                    <a
                                      key={img.ImageID}
                                      href={resolveImageUrl(img.ImageURL)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="d-inline-block border rounded-3 overflow-hidden"
                                      style={{ width: 90, height: 70 }}
                                      title={`${img.ImageUploadType || "Image"} - ${toDateTime(img.UploadedAt)}`}
                                    >
                                      <img
                                        src={resolveImageUrl(img.ImageURL)}
                                        alt={img.ImageUploadType || "Booking image"}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <div className="small text-muted">No images uploaded</div>
                              )}
                            </div>
                          )}

                            {canAction && (
                              <div className="d-flex gap-2 justify-content-end flex-wrap mt-3">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTrackingAccordion;