import React, { useState } from "react";
import { Icon } from "@iconify/react";

const STATUS_BADGE_CLASS = {
  Confirmed: "bg-info bg-opacity-25 text-info",
  "In Progress": "bg-primary bg-opacity-25 text-primary",
  InProgress: "bg-primary bg-opacity-25 text-primary",
  ServiceCompleted: "bg-success bg-opacity-25 text-success",
  Completed: "bg-success bg-opacity-25 text-success",
  Pending: "bg-warning bg-opacity-25 text-warning",
  Approved: "bg-success bg-opacity-25 text-success",
  Rejected: "bg-danger bg-opacity-25 text-danger",
  Assigned: "bg-info bg-opacity-25 text-info",
  Success: "bg-success bg-opacity-25 text-success",
  Cancelled: "bg-danger bg-opacity-25 text-danger",
  "Not Assigned": "bg-secondary bg-opacity-25 text-secondary",
  Paid: "bg-success bg-opacity-25 text-success",
  Failed: "bg-danger bg-opacity-25 text-danger",
  Refunded: "bg-info bg-opacity-25 text-info",
  "Not Paid": "bg-secondary bg-opacity-25 text-secondary",
  completed: "bg-success bg-opacity-25 text-success",
  pickup_started: "bg-primary bg-opacity-25 text-primary",
  pickup_reached: "bg-info bg-opacity-25 text-info",
  car_picked: "bg-info bg-opacity-25 text-info",
  in_transit: "bg-warning bg-opacity-25 text-warning",
  drop_reached: "bg-info bg-opacity-25 text-info",
  BuddyStarted: "bg-primary bg-opacity-25 text-primary",
  BuddyReached: "bg-info bg-opacity-25 text-info",
  CarPicked: "bg-info bg-opacity-25 text-info",
  ServiceInProgress: "bg-warning bg-opacity-25 text-warning",
  OutForDelivery: "bg-info bg-opacity-25 text-info",
};

const getStatusBadgeClass = (status) =>
  status ? (STATUS_BADGE_CLASS[status] || "bg-secondary bg-opacity-25 text-secondary") : "bg-secondary bg-opacity-25 text-secondary";

const formatCurrency = (n) => {
  if (n == null || n === "" || isNaN(Number(n))) return "N/A";
  return `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function DetailRow({ label, value }) {
  return (
    <div className="d-flex align-items-start gap-2 py-2 border-bottom border-light border-opacity-50">
      <span className="small text-nowrap" style={{ minWidth: "120px", color: "rgba(226,232,240,0.62)" }}>{label}</span>
      <span className="small fw-medium flex-grow-1">{value}</span>
    </div>
  );
}

const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE || "";

const SectionCard = ({ icon, kicker, title, children }) => (
  <div className="csr-card">
    <div className="csr-card-header">
      <div className="csr-card-icon"><Icon icon={icon} width={18} /></div>
      <div>
        <div className="csr-card-kicker">{kicker}</div>
        <h4 className="csr-card-title">{title}</h4>
      </div>
    </div>
    {children}
  </div>
);

export default function CompleteServiceReportViewModern({ data, onBack }) {
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);

  if (!data) return null;

  const addOns = data.BookingAddOns || [];
  const vehicles = data.VehicleDetails || [];
  const payments = data.Payments || [];
  const carPickUpDelivery = data.CarPickUpDelivery || [];
  const followUps = data.Lead_FollowUps || [];
  const dealerApprovals = data.DealerAddOnApproval || [];
  const bookingStatusTracking = data.BookingStatusTracking || [];
  const bookingImages = data.BookingImages || [];
  const pendingAddOns = (data.BookingsTempAddons || []).filter((a) => a.IsSupervisor_Confirm !== 1);
  const confirmedAddOns = addOns.filter((a) => a.IsSupervisor_Confirm === 1);
  const latestPickup = carPickUpDelivery[carPickUpDelivery.length - 1];
  const isGarageService = latestPickup?.ServiceType === "ServiceAtGarage";
  const serviceCompletionCount = addOns.filter((a) => a.Is_Completed).length;
  const paidAmount = payments.reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);

  const getStageTone = (status, index = 0) => {
    const accentPalette = [
      { color: "#4669fa", bg: "rgba(70, 105, 250, 0.08)", border: "rgba(70, 105, 250, 0.45)" },
      { color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)", border: "rgba(14, 165, 233, 0.45)" },
      { color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.45)" },
      { color: "#f97316", bg: "rgba(249, 115, 22, 0.08)", border: "rgba(249, 115, 22, 0.45)" },
      { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.45)" },
    ];
    const accent = accentPalette[index % accentPalette.length];
    switch (status) {
      case "completed":
        return { ...accent, bg: accent.bg, border: accent.border };
      case "in-progress":
        return { ...accent, bg: accent.bg, border: accent.border };
      case "failed":
        return { color: "#fb7185", bg: "rgba(244, 63, 94, 0.10)", border: "rgba(251, 113, 133, 0.45)" };
      default:
        return accent;
    }
  };

  const bookingOverviewCard = (title) => (
    <SectionCard icon="mdi:clipboard-text-outline" kicker="Booking foundation" title={title}>
      <div className="small">
        <DetailRow label="Booking ID" value={data.BookingID ?? "N/A"} />
        <DetailRow label="Track ID" value={data.BookingTrackID ?? "N/A"} />
        <DetailRow label="Booking date" value={formatDate(data.BookingDate)} />
        <DetailRow label="Time slot" value={data.TimeSlot ?? "N/A"} />
        <DetailRow label="Status" value={<span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(data.BookingStatus)}`}>{data.BookingStatus ?? "N/A"}</span>} />
        {data.Notes && <DetailRow label="Notes" value={data.Notes} />}
      </div>
    </SectionCard>
  );

  const assignmentCard = (
    <SectionCard icon="mdi:account-group-outline" kicker="Internal ownership" title="Assignment & team">
      <div className="small">
        <DetailRow label="Supervisor name" value={data.SupervisorHeadName ?? "N/A"} />
        <DetailRow label="Supervisor number" value={data.SupervisorHeadPhoneNumber ?? "N/A"} />
        <DetailRow label="Field advisor" value={data.FieldAdvisorName ?? "N/A"} />
        <DetailRow label="Advisor number" value={data.FieldAdvisorPhoneNumber ?? "N/A"} />
      </div>
    </SectionCard>
  );

  const customerCard = (
    <SectionCard icon="mdi:account-map-outline" kicker="Customer snapshot" title="Customer & address">
      <div className="small">
        <DetailRow label="Name" value={data.CustomerName ?? data.CustFullName ?? "N/A"} />
        <DetailRow label="Email" value={data.CustEmail ?? "N/A"} />
        <DetailRow label="Phone" value={data.PhoneNumber ?? "N/A"} />
        <DetailRow label="Address" value={(data.FullAddress ?? "N/A").replace(/\n/g, ", ")} />
        {(data.CityName || data.StateName) && <DetailRow label="Location" value={[data.CityName, data.StateName].filter(Boolean).join(", ")} />}
      </div>
    </SectionCard>
  );

  const dealerHistoryCard = (
    <SectionCard icon="mdi:handshake-outline" kicker="Dealer decisions" title="Dealer approval history">
      {dealerApprovals.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Dealer</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {dealerApprovals.slice(0, 15).map((a) => (
                <tr key={a.Id}>
                  <td>{formatDateTime(a.CreatedDate)}</td>
                  <td>{a.ServiceName ?? "N/A"}</td>
                  <td>{a.DealerName ?? "N/A"}</td>
                  <td><span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(a.IsDealer_Confirm)}`}>{a.IsDealer_Confirm ?? "N/A"}</span></td>
                  <td>{a.Reason ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="csr-empty-state">No dealer approval records available yet.</div>
      )}
    </SectionCard>
  );

  const servicesCard = (
    <SectionCard icon="mdi:car-wrench" kicker="Customer-confirmed work" title="Services">
      {addOns.length > 0 ? (
        <div className="row g-3">
          {addOns.map((svc, idx) => (
            <div key={svc.AddOnID ?? idx} className="col-12">
              <div className={`csr-subcard ${svc.Is_Completed ? "csr-subcard-success" : ""}`}>
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
                  <div>
                    <div className="fw-semibold text-white">{svc.ServiceName ?? `Service #${idx + 1}`}</div>
                    <div className="text-white-50 small">{svc.DealerName ?? "Dealer TBD"}</div>
                  </div>
                  <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(svc.StatusName)}`}>{svc.StatusName ?? "N/A"}</span>
                </div>
                <div className="row g-3 small">
                  <div className="col-md-4">
                    <div className="csr-subtitle">Pricing</div>
                    <DetailRow label="Service price" value={formatCurrency(svc.ServicePrice)} />
                    <DetailRow label="Labour" value={formatCurrency(svc.LabourCharges)} />
                    <DetailRow label="GST" value={formatCurrency(svc.GSTPrice)} />
                    <DetailRow label="Total" value={formatCurrency(svc.TotalPrice)} />
                  </div>
                  <div className="col-md-4">
                    <div className="csr-subtitle">Dealer</div>
                    <DetailRow label="Dealer confirm" value={<span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(svc.IsDealer_Confirm)}`}>{svc.IsDealer_Confirm ?? "N/A"}</span>} />
                    <DetailRow label="Dealer price" value={formatCurrency(svc.DealerPrice)} />
                    <DetailRow label="Dealer GST" value={formatCurrency(svc.DealerGSTAmount)} />
                  </div>
                  <div className="col-md-4">
                    <div className="csr-subtitle">Completion</div>
                    <DetailRow label="Completed" value={svc.Is_Completed ? "Yes" : "No"} />
                    {svc.CompletedRole && <DetailRow label="Completed by" value={svc.CompletedRole} />}
                    {Array.isArray(svc.Includes) && svc.Includes.length > 0 && (
                      <div className="pt-2 small">
                        {svc.Includes.map((inc, i) => (
                          <div key={inc?.IncludeID ?? i} className="d-flex align-items-center gap-2 py-1">
                            <Icon icon="mdi:check-circle-outline" className="text-success flex-shrink-0" width={15} />
                            <span>{inc?.IncludeName ?? "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="csr-empty-state">No services have been attached to this booking.</div>
      )}
    </SectionCard>
  );

  const pickupCard = (
    <SectionCard icon="mdi:car-side" kicker="Movement & logistics" title="Car pickup & delivery">
      {carPickUpDelivery.length > 0 ? (
        <div className="row g-3">
          {carPickUpDelivery.map((pick, idx) => (
            <div key={pick.Id ?? idx} className="col-12">
              <div className="csr-subcard">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  {pick.ServiceType && (
                    <span className="badge rounded-pill px-3 py-2 bg-primary bg-opacity-25 text-info">
                      {pick.ServiceType === "ServiceAtHome" ? "Service At Home" : "Service At Garage"}
                    </span>
                  )}
                  <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(pick.Status)}`}>{pick.Status ?? "N/A"}</span>
                </div>
                <div className="row g-3 small">
                  {pick.ServiceType === "ServiceAtGarage" && (
                    <>
                      <div className="col-md-6">
                        <div className="csr-subtitle">From</div>
                        <DetailRow label="Name" value={pick.PickFromName ?? "N/A"} />
                        <DetailRow label="Phone" value={pick.PickFromPhone ?? "N/A"} />
                        <DetailRow label="Address" value={(pick.PickFromAddress ?? "N/A").replace(/\n/g, ", ")} />
                      </div>
                      <div className="col-md-6">
                        <div className="csr-subtitle">To</div>
                        <DetailRow label="Name" value={pick.PickToName ?? "N/A"} />
                        <DetailRow label="Phone" value={pick.PickToPhone ?? "N/A"} />
                        <DetailRow label="Address" value={(pick.PickToAddress ?? "N/A").replace(/\n/g, ", ")} />
                      </div>
                    </>
                  )}
                  <div className="col-12">
                    <div className="csr-subtitle">Technician & timing</div>
                    <DetailRow label="Technician" value={pick.TechnicinaName ?? "N/A"} />
                    <DetailRow label="Phone" value={pick.TechnicianPhoneNumber ?? "N/A"} />
                    <DetailRow label="Assign date" value={formatDateTime(pick.AssignDate)} />
                    {(pick.PickupDate || pick.PickupTime) && <DetailRow label="Pickup" value={`${formatDate(pick.PickupDate)} ${pick.PickupTime ?? ""}`.trim()} />}
                    {(pick.DeliveryDate || pick.DeliveryTime) && <DetailRow label="Delivery" value={`${formatDate(pick.DeliveryDate)} ${pick.DeliveryTime ?? ""}`.trim()} />}
                    <DetailRow label="Modified" value={formatDateTime(pick.ModifiedDate)} />
                  </div>
                  {Array.isArray(pick.DriverTracking) && pick.DriverTracking.length > 0 && (
                    <div className="col-12">
                      <div className="csr-subtitle mb-3">Technician / driver timeline</div>
                      <div className="csr-driver-grid">
                        {pick.DriverTracking.map((t, i) => {
                          const status = t.Status?.toLowerCase() || "pending";
                          const color =
                            status === "completed" ? "#10b981" :
                              status === "pickup_started" || status === "serviceinprogress" ? "#3b82f6" :
                                status === "pickup_reached" || status === "car_picked" || status === "drop_reached" ? "#06b6d4" :
                                  status === "in_transit" || status === "outfordelivery" ? "#eab308" : "#6b7280";
                          return (
                            <div key={t.Id ?? i} className="csr-driver-step">
                              <div className="csr-driver-circle" style={{ backgroundColor: color }}>{i + 1}</div>
                              <div className="fw-semibold">{t.Status ?? "N/A"}</div>
                              <div className="text-white-50 small">{formatDateTime(t.CreatedDate)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="csr-empty-state">Technician assignment and movement details are not available yet.</div>
      )}
    </SectionCard>
  );

  const vehicleCard = (
    <SectionCard icon="mdi:car-info" kicker="Vehicle context" title="Vehicle details">
      {vehicles.length > 0 ? (
        <div className="row g-3">
          {vehicles.map((v, i) => (
            <div key={i} className="col-md-6">
              <div className="csr-subcard">
                <DetailRow label="Registration No." value={v.RegistrationNumber ?? "N/A"} />
                <DetailRow label="Brand / Model" value={[v.BrandName, v.ModelName].filter(Boolean).join(" / ") || "N/A"} />
                <DetailRow label="Fuel type" value={v.FuelTypeName ?? "N/A"} />
                {v.KmDriven != null && <DetailRow label="KM driven" value={v.KmDriven} />}
                {v.YearOfPurchase != null && <DetailRow label="Year" value={v.YearOfPurchase} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="csr-empty-state">Vehicle details are not available.</div>
      )}
    </SectionCard>
  );

  const imagesCard = (
    <SectionCard icon="mdi:image-multiple-outline" kicker="Captured evidence" title="Booking images">
      {bookingImages.length > 0 ? (
        <div className="row g-3">
          {bookingImages.map((img) => {
            const imgSrc = img.ImageURL ? `${API_IMAGE}/${img.ImageURL}` : null;
            return (
              <div key={img.ImageID} className="col-sm-6 col-lg-4">
                <button type="button" className="csr-image-card w-100 text-start" onClick={() => imgSrc && setFullscreenImageUrl(imgSrc)} disabled={!imgSrc}>
                  <div className="csr-image-meta">
                    <div className="fw-semibold text-white">
                      {img.ImageUploadType ?? "N/A"} {img.ImagesType && <span className="text-white-50">({img.ImagesType})</span>}
                    </div>
                    <div className="text-white-50 small">{formatDateTime(img.UploadedAt)}</div>
                  </div>
                  {imgSrc && <img src={imgSrc} alt={img.ImageUploadType || "Booking"} className="csr-image-thumb" />}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="csr-empty-state">No booking images were uploaded.</div>
      )}
    </SectionCard>
  );

  const completionCard = (
    <SectionCard icon="mdi:car-check" kicker="Closure snapshot" title="Service completion summary">
      <div className="row g-3">
        <div className="col-md-4">
          <div className="csr-metric-card">
            <span className="csr-metric-label">Completed services</span>
            <strong>{serviceCompletionCount}/{addOns.length || 0}</strong>
          </div>
        </div>
        <div className="col-md-4">
          <div className="csr-metric-card">
            <span className="csr-metric-label">Confirmed by supervisor</span>
            <strong>{confirmedAddOns.length}</strong>
          </div>
        </div>
        <div className="col-md-4">
          <div className="csr-metric-card">
            <span className="csr-metric-label">Pending confirmations</span>
            <strong>{pendingAddOns.length}</strong>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const paymentsCard = (
    <SectionCard icon="mdi:credit-card-outline" kicker="Money trail" title="Payments">
      {payments.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Refunded</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.PaymentID}>
                  <td>{formatDateTime(p.PaymentDate)}</td>
                  <td>{formatCurrency(p.AmountPaid)}</td>
                  <td>{p.PaymentMode ?? "N/A"}</td>
                  <td className="text-break">{p.TransactionID ?? "N/A"}</td>
                  <td><span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(p.PaymentStatus === "Success" ? "Paid" : p.PaymentStatus)}`}>{p.PaymentStatus === "Success" ? "Paid" : (p.PaymentStatus ?? "N/A")}</span></td>
                  <td>{p.IsRefunded ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="csr-empty-state">No payments are recorded for this booking.</div>
      )}
    </SectionCard>
  );

  const followupsCard = (
    <SectionCard icon="mdi:phone-log-outline" kicker="Post-booking engagement" title="Lead follow-ups">
      {followUps.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Call Type</th>
                <th>Discussion</th>
                <th>Next action</th>
                <th>Next follow-up</th>
              </tr>
            </thead>
            <tbody>
              {followUps.slice(0, 10).map((f) => (
                <tr key={f.Id}>
                  <td>{formatDateTime(f.Updated_At ?? f.Created_At ?? "N/A")}</td>
                  <td><span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(f.Status)}`}>{f.Status ?? "N/A"}</span></td>
                  <td>{f.Type ?? "N/A"}</td>
                  <td className="text-break">{f.Notes ?? "N/A"}</td>
                  <td>{f.NextAction ?? "N/A"}</td>
                  <td>{formatDateTime(f.NextFollowUp_Date ?? "N/A")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="csr-empty-state">No follow-up entries exist for this lead.</div>
      )}
    </SectionCard>
  );

  const serviceFlowStages = isGarageService
    ? [
        {
          id: "service-stage-garage",
          title: "Service Stages",
          icon: "mdi:garage-variant",
          date: carPickUpDelivery.find((p) => p.RouteType === "CustomerToDealer")?.PickupDate || addOns.find((a) => a.StatusName === "ServiceCompleted")?.UpdatedDate,
          status: addOns.length > 0 && addOns.every((a) => a.StatusName === "ServiceCompleted") ? "completed" : addOns.length > 0 ? "in-progress" : "pending",
          details: [
            carPickUpDelivery.some((p) => p.RouteType === "CustomerToDealer") ? "Customer to dealer movement logged" : null,
            carPickUpDelivery.some((p) => p.RouteType === "DealerToDealer") ? "Multi-dealer hop detected" : null,
            carPickUpDelivery.some((p) => p.RouteType === "DealerToCustomer") ? "Return delivery prepared" : null,
          ].filter(Boolean).join(" | "),
          cards: [vehicleCard, imagesCard],
        },
      ]
    : (bookingStatusTracking.length > 0 ? bookingStatusTracking : [{ Status: "Home Service", Created_At: null, Role: "Technician", Service_Type: "Home Service" }]).map((track, idx) => ({
        id: `service-stage-home-${idx}`,
        title: track.Status || "Service Stage",
        icon: "mdi:home-wrench",
        date: track.Created_At,
        status: track.Status === "ServiceCompleted" ? "completed" : "in-progress",
        details: `${track.Role || "N/A"} | ${track.Service_Type || "Home Service"}`,
        cards: idx === 0 ? [vehicleCard, imagesCard] : [],
      }));

  const stages = [
    {
      id: "lead-created",
      title: "Lead Created",
      icon: "mdi:lead-pencil",
      date: data.CreatedDate || data.LeadCreatedDate,
      status: "completed",
      details: `Lead ID ${data.LeadId ?? "N/A"}`,
      cards: [bookingOverviewCard("Booking overview")],
    },
    {
      id: "booking-created",
      title: "Booking Created",
      icon: "mdi:calendar-plus",
      date: data.BookingDate,
      status: "completed",
      details: `Track ${data.BookingTrackID ?? "N/A"}`,
      cards: [bookingOverviewCard("Booking created snapshot")],
    },
    {
      id: "assigned",
      title: "Assigned",
      icon: "mdi:account-group",
      date: data.SupervisorHeadAssignDate || data.FieldAdvisorAssignDate,
      status: data.SupervisorHeadName || data.FieldAdvisorName ? "completed" : "pending",
      details: [data.SupervisorHeadName, data.FieldAdvisorName].filter(Boolean).join(" | ") || "Awaiting team assignment",
      cards: [assignmentCard, customerCard],
    },
    {
      id: "dealer-confirmation",
      title: "Dealer Confirmation",
      icon: "mdi:handshake",
      date: dealerApprovals[0]?.CreatedDate,
      status:
        dealerApprovals.length === 0
          ? "pending"
          : dealerApprovals.every((d) => d.IsDealer_Confirm === "Approved")
            ? "completed"
            : dealerApprovals.some((d) => d.IsDealer_Confirm === "Rejected")
              ? "failed"
              : "in-progress",
      details:
        dealerApprovals.length === 0
          ? "No dealer responses yet"
          : `${dealerApprovals.filter((d) => d.IsDealer_Confirm === "Approved").length}/${dealerApprovals.length} approved`,
      cards: [dealerHistoryCard],
    },
    {
      id: "customer-confirmation",
      title: "Customer Confirmation",
      icon: "mdi:account-check",
      date: addOns.find((a) => a.ConfirmRole)?.ConfirmDate,
      status:
        confirmedAddOns.length === 0 && pendingAddOns.length === 0
          ? "pending"
          : confirmedAddOns.length > 0 && pendingAddOns.length === 0
            ? "completed"
            : "in-progress",
      details: `${confirmedAddOns.length} confirmed | ${pendingAddOns.length} pending`,
      cards: [servicesCard],
    },
    {
      id: "technician-assigned",
      title: "Technician Assigned",
      icon: "mdi:engineer",
      date: carPickUpDelivery[0]?.AssignDate,
      status: carPickUpDelivery.length > 0 ? "completed" : "pending",
      details: carPickUpDelivery.map((p) => p.TechnicinaName).filter(Boolean).join(", ") || "Technician not assigned",
      cards: [pickupCard],
    },
    ...serviceFlowStages,
    {
      id: "service-completed",
      title: "Service Completed",
      icon: "mdi:car-check",
      date: addOns.find((a) => a.Is_Completed)?.CompletedDate,
      status: addOns.length === 0 ? "pending" : addOns.every((a) => a.Is_Completed) ? "completed" : addOns.some((a) => a.Is_Completed) ? "in-progress" : "pending",
      details: addOns.length === 0 ? "No services logged" : `${serviceCompletionCount}/${addOns.length} complete`,
      cards: [completionCard],
    },
    {
      id: "payment-done",
      title: "Payment Done",
      icon: "mdi:credit-card-check",
      date: payments[0]?.PaymentDate,
      status: payments.some((p) => p.PaymentStatus === "Success") ? "completed" : "pending",
      details: paidAmount > 0 ? `${formatCurrency(paidAmount)} collected` : "Payment pending",
      cards: [paymentsCard],
    },
    {
      id: "booking-done",
      title: "Booking Done",
      icon: "mdi:check-circle",
      date: data.BookingStatusUpdatedDate,
      status: data.BookingStatus === "Completed" ? "completed" : "pending",
      details: data.BookingStatus ?? "N/A",
      cards: [followupsCard],
    },
  ];

  return (
    <div className="csr-shell mb-4">
      <style>{`
        .csr-shell {
          color: #111827;
          animation: csrFadeIn 0.65s ease;
        }
        .csr-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1.6rem;
          background: linear-gradient(135deg, #f9fafb, #e5edff);
          border: 1px solid rgba(148, 163, 184, 0.45);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16);
        }
        .csr-back-btn {
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          color: #fff;
          border-radius: 999px;
          padding: 0.65rem 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .csr-back-btn:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.14);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.24);
        }
        .csr-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.72rem;
          color: rgba(226, 232, 240, 0.72);
          margin-bottom: 0.65rem;
        }
        .csr-title {
          font-size: clamp(1.25rem, 1.6vw, 1.8rem);
          font-weight: 600;
          line-height: 1.15;
          margin-bottom: 0.35rem;
        }
        .csr-subcopy {
          color: rgba(226, 232, 240, 0.76);
          max-width: 760px;
          margin-bottom: 1rem;
        }
        .csr-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .csr-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 0.95rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          color: #f8fafc;
          font-size: 0.88rem;
        }
        .csr-chip-label {
          color: rgba(226, 232, 240, 0.68);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.68rem;
        }
        .csr-timeline {
          display: grid;
          gap: 1.25rem;
        }
        .csr-stage {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 1.25rem;
          align-items: start;
        }
        .csr-stage-rail {
          position: sticky;
          top: 1rem;
          display: flex;
          gap: 1rem;
        }
        .csr-stage-line {
          position: relative;
          width: 56px;
          display: flex;
          justify-content: center;
          padding-top: 0.15rem;
          flex-shrink: 0;
        }
        .csr-stage-line::after {
          content: "";
          position: absolute;
          top: 3.75rem;
          bottom: -1.6rem;
          width: 2px;
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.85), rgba(148, 163, 184, 0.18));
        }
        .csr-stage:last-child .csr-stage-line::after {
          display: none;
        }
        .csr-node {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--tone-border);
          background: linear-gradient(180deg, var(--tone-bg), rgba(15, 23, 42, 0.9));
          color: var(--tone-color);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.28);
        }
        .csr-node-active {
          animation: csrPulse 2.1s ease-in-out infinite;
        }
        .csr-stage-copy {
          padding-top: 0.35rem;
        }
        .csr-stage-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(226, 232, 240, 0.55);
          margin-bottom: 0.45rem;
        }
        .csr-stage-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
          color: #1a7273;
        }
        .csr-stage-date,
        .csr-stage-details {
          color: rgb(71 77 85 / 72%);
          font-size: 0.88rem;
        }
        .csr-stage-panels {
          display: grid;
          gap: 1rem;
        }
        .csr-stage-panels.csr-grid-two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .csr-card,
        .csr-subcard,
        .csr-image-card,
        .csr-metric-card {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: #ffffff;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10);
        }
        .csr-card {
          padding: 1.1rem 1.25rem;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .csr-card:hover,
        .csr-image-card:hover,
        .csr-subcard:hover,
        .csr-metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
          border-color: var(--csr-card-accent, rgba(79, 70, 229, 0.6));
          background: linear-gradient(135deg, #ffffff, #f4f7ff);
        }
        .csr-card-header {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-bottom: 1rem;
        }
        .csr-card-icon {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--csr-card-icon-bg, #e0f2fe);
          color: var(--csr-card-icon-color, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.5);
        }
        .csr-card-kicker,
        .csr-subtitle,
        .csr-metric-label {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.7rem;
          color: rgba(226, 232, 240, 0.58);
        }
        .csr-card-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0.1rem 0 0;
          color: #111827;
        }
        .csr-subcard {
          padding: 1rem;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
            rgba(15, 23, 42, 0.4);
        }
        .csr-subcard-success {
          border-color: rgba(52, 211, 153, 0.34);
        }
        .csr-driver-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
        }
        .csr-driver-step {
          padding: 0.9rem;
          text-align: center;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .csr-driver-circle {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          margin: 0 auto 0.55rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
        }
        .csr-image-card {
          padding: 0.9rem;
          border: 0;
          color: inherit;
        }
        .csr-image-meta {
          margin-bottom: 0.85rem;
        }
        .csr-image-thumb {
          width: 100%;
          height: 170px;
          object-fit: cover;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .csr-metric-card {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .csr-metric-card strong {
          font-size: 1.55rem;
          color: #fff;
        }
        .csr-empty-state {
          border-radius: 18px;
          padding: 1rem;
          color: rgba(226, 232, 240, 0.74);
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.12);
        }
        .csr-shell .border-bottom {
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
        .csr-shell .table thead th {
          color: rgba(226, 232, 240, 0.72) !important;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          border-bottom-color: rgba(255,255,255,0.1);
        }
        .csr-shell .table td {
          border-bottom-color: rgba(255,255,255,0.08);
        }
        @keyframes csrFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes csrPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.18), 0 18px 32px rgba(15, 23, 42, 0.28); }
          50% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0.04), 0 18px 32px rgba(15, 23, 42, 0.34); }
        }
        @media (max-width: 991.98px) {
          .csr-stage {
            grid-template-columns: 1fr;
          }
          .csr-stage-rail {
            position: relative;
          }
          .csr-stage-panels.csr-grid-two {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767.98px) {
          .csr-hero {
            padding: 1.15rem;
            border-radius: 22px;
          }
          .csr-stage-line {
            width: 48px;
          }
          .csr-node {
            width: 48px;
            height: 48px;
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="csr-hero">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <div className="csr-eyebrow">Complete Service Report</div>
            <h2 className="csr-title">{data.CustomerName ?? data.CustFullName ?? "Customer"} service journey</h2>
            <p className="csr-subcopy">
              A stage-wise operational view of booking progress, approvals, technician flow, service execution, payment, and post-booking follow-up.
            </p>
          </div>
          <button type="button" className="csr-back-btn" onClick={onBack}>
            <Icon icon="mdi:arrow-left" width={18} />
            Back
          </button>
        </div>
        <div className="csr-chip-row mt-3">
          <span className="csr-chip"><span className="csr-chip-label">Lead</span>{data.LeadId ?? "N/A"}</span>
          <span className="csr-chip"><span className="csr-chip-label">Track ID</span>{data.BookingTrackID ?? "N/A"}</span>
          <span className="csr-chip"><span className="csr-chip-label">Status</span><span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(data.BookingStatus)}`}>{data.BookingStatus ?? "N/A"}</span></span>
          <span className="csr-chip"><span className="csr-chip-label">Service date</span>{formatDate(data.BookingDate)}</span>
        </div>
      </div>

      <div className="csr-timeline">
        {stages.map((stage, index) => {
          const tone = getStageTone(stage.status, index);
          const panelClass = stage.cards.length > 1 ? "csr-stage-panels csr-grid-two" : "csr-stage-panels";
          return (
            <section key={stage.id} className="csr-stage">
              <div className="csr-stage-rail">
                <div className="csr-stage-line">
                  <div
                    className={`csr-node ${stage.status === "in-progress" ? "csr-node-active" : ""}`}
                    style={{ "--tone-color": tone.color, "--tone-bg": tone.bg, "--tone-border": tone.border }}
                  >
                    <Icon icon={stage.icon} width={22} />
                  </div>
                </div>
                <div className="csr-stage-copy">
                  <div className="csr-stage-label">Stage {String(index + 1).padStart(2, "0")}</div>
                  <h3 className="csr-stage-title">{stage.title}</h3>
                  {stage.date && <div className="csr-stage-date">{formatDateTime(stage.date)}</div>}
                  <div className="csr-stage-details mt-1">{stage.details || "No status detail available."}</div>
                </div>
              </div>
              <div className={panelClass}>
                {stage.cards.length > 0 ? stage.cards : <div className="csr-empty-state">No stage details available.</div>}
              </div>
            </section>
          );
        })}
      </div>

      {fullscreenImageUrl && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999, backgroundColor: "rgba(2, 6, 23, 0.92)" }}
          onClick={() => setFullscreenImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image fullscreen"
        >
          <button
            type="button"
            className="position-absolute top-0 end-0 m-3 btn btn-light btn-lg rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: 48, height: 48 }}
            onClick={(e) => { e.stopPropagation(); setFullscreenImageUrl(null); }}
            aria-label="Close"
          >
            <Icon icon="mdi:close" width={28} height={28} />
          </button>
          <img
            src={fullscreenImageUrl}
            alt="Full screen"
            className="max-w-100 max-h-100 object-contain"
            style={{ maxHeight: "calc(100vh - 80px)", maxWidth: "calc(100vw - 80px)" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
