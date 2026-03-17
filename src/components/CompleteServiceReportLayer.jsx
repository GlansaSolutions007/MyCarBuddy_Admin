import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

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
  // Car pickup/delivery & driver tracking
  completed: "bg-success bg-opacity-25 text-success",
  pickup_started: "bg-primary bg-opacity-25 text-primary",
  pickup_reached: "bg-info bg-opacity-25 text-info",
  car_picked: "bg-info bg-opacity-25 text-info",
  in_transit: "bg-warning bg-opacity-25 text-warning",
  drop_reached: "bg-info bg-opacity-25 text-info",
  // Booking status tracking
  BuddyStarted: "bg-primary bg-opacity-25 text-primary",
  BuddyReached: "bg-info bg-opacity-25 text-info",
  CarPicked: "bg-info bg-opacity-25 text-info",
  ServiceInProgress: "bg-warning bg-opacity-25 text-warning",
  OutForDelivery: "bg-info bg-opacity-25 text-info",
};
const getStatusBadgeClass = (status) =>
  status ? (STATUS_BADGE_CLASS[status] || "bg-secondary bg-opacity-25 text-secondary") : "bg-secondary bg-opacity-25 text-secondary";

const formatCurrency = (n) => {
  if (n == null || n === "" || isNaN(Number(n))) return "—";
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const formatDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Report card wrapper; borderVariant = "success" for completed
const ReportCard = ({ title, icon, children, className = "", borderVariant }) => {
  const borderColor = borderVariant === "success" ? "var(--bs-success)" : "var(--bs-primary)";
  return (
    <div className={`card border-0 shadow-sm rounded-3 overflow-hidden border-start border-3 ${className}`} style={{ borderLeftColor: borderColor }}>
      <div className="card-header bg-light border-0 py-3 px-4 d-flex align-items-center gap-2">
        {icon && <Icon icon={icon} width={22} height={22} className="text-primary" />}
        <span className="fw-semibold text-dark">{title}</span>
      </div>
      <div className="card-body py-3 px-4">{children}</div>
    </div>
  );
};

function DetailRow({ label, value }) {
  return (
    <div className="d-flex align-items-start gap-2 py-2 border-bottom border-light border-opacity-50 last-border-0">
      <span className="text-muted small text-nowrap" style={{ minWidth: "120px" }}>{label}</span>
      <span className="small fw-medium text-dark flex-grow-1">{value}</span>
    </div>
  );
}

const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE || "";

// Complete Service Report view using API response
function CompleteServiceReportView({ data, onBack }) {
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);

  // Timeline data extraction
  const getTimelineData = () => {
    const addOns = data.BookingAddOns || [];
    const carPickUpDelivery = data.CarPickUpDelivery || [];
    const dealerApprovals = data.DealerAddOnApproval || [];
    const payments = data.Payments || [];
    const bookingStatusTracking = data.BookingStatusTracking || [];

    // Determine service location from latest CarPickUpDelivery or default home
    const latestPickup = carPickUpDelivery[carPickUpDelivery.length - 1];
    const isGarageService = latestPickup?.ServiceType === 'ServiceAtGarage';
    const isHomeService = latestPickup?.ServiceType === 'ServiceAtHome';
    
    // Separate confirmed vs pending services
    const confirmedAddOns = addOns.filter(a => a.IsSupervisor_Confirm === 1);
    const pendingAddOns = (data.BookingsTempAddons || []).filter(a => a.IsSupervisor_Confirm !== 1);
    const confirmedLength = confirmedAddOns.length;
    const pendingLength = pendingAddOns.length;
    
    const baseStages = [
      {
        id: 'lead-created',
        title: 'Lead Created',
        icon: 'mdi:lead-pencil',
        date: data.CreatedDate || data.LeadCreatedDate,
        status: 'completed',
        details: `Lead ID: ${data.LeadId}`
      },
      {
        id: 'booking-created',
        title: 'Booking Created',
        icon: 'mdi:calendar-plus',
        date: data.BookingDate,
        status: 'completed',
        details: `Booking ID: ${data.BookingID}`
      },
      {
        id: 'assign-stage',
        title: 'Supervisor/Field Advisor Assigned',
        icon: 'mdi:account-group',
        date: data.SupervisorHeadAssignDate || data.FieldAdvisorAssignDate,
        status: (data.SupervisorHeadName || data.FieldAdvisorName) ? 'completed' : 'pending',
        details: `${data.SupervisorHeadName || '—'} / ${data.FieldAdvisorName || '—'}`
      },
      {
        id: 'dealer-confirmation',
        title: 'Dealer Confirmation',
        icon: 'mdi:handshake',
        date: dealerApprovals[0]?.CreatedDate,
        status: dealerApprovals.length === 0 ? 'pending' : 
                dealerApprovals.every(d => d.IsDealer_Confirm === 'Approved') ? 'completed' : 
                dealerApprovals.some(d => d.IsDealer_Confirm === 'Rejected') ? 'failed' : 'in-progress',
        details: dealerApprovals.length === 0 ? 'No dealers' : `${dealerApprovals.filter(d => d.IsDealer_Confirm === 'Approved').length} dealers confirmed services`
      },
      {
        id: 'customer-confirmation',
        title: 'Customer Confirmation',
        icon: 'mdi:account-check',
        date: addOns.find(a => a.ConfirmRole)?.ConfirmDate,
        status: (confirmedLength === 0 && pendingLength === 0) ? 'pending' : 
                confirmedLength > 0 ? (pendingLength === 0 ? 'completed' : 'in-progress') : 'pending',
        details: `${confirmedLength} confirmed / ${pendingLength} pending`
      },
      {
        id: 'technician-assigned',
        title: 'Technician Assigned',
        icon: 'mdi:engineer',
        date: carPickUpDelivery[0]?.AssignDate,
        status: carPickUpDelivery.length > 0 ? 'completed' : 'pending',
        details: carPickUpDelivery.map(p => p.TechnicinaName).filter(Boolean).join(', ') || '—'
      }
    ];

    // Conditional garage vs home flow
    let conditionalStages = [];
    if (isGarageService && carPickUpDelivery.length > 0) {
      // Garage flow stages
      conditionalStages = [
        {
          id: 'garage-customer-to-dealer',
          title: 'Customer to Dealer',
          icon: 'mdi:car-pickup',
          date: carPickUpDelivery.find(p => p.RouteType === 'CustomerToDealer')?.PickupDate,
          status: 'completed',
          details: 'Car picked from customer → delivered to dealer'
        },
        {
          id: 'garage-dealer-service',
          title: 'Service at Dealer',
          icon: 'mdi:car-wrench',
          date: addOns.find(a => a.StatusName === 'ServiceCompleted')?.UpdatedDate,
          status: addOns.every(a => a.StatusName === 'ServiceCompleted') ? 'completed' : 'in-progress',
          details: `${addOns.filter(a => a.StatusName === 'ServiceCompleted').length} services done`
        },
        ...(carPickUpDelivery.some(p => p.RouteType === 'DealerToDealer') ? [{
          id: 'garage-dealer-to-dealer',
          title: 'Dealer to Dealer (Multi-dealer)',
          icon: 'mdi:cars',
          date: carPickUpDelivery.find(p => p.RouteType === 'DealerToDealer')?.PickupDate,
          status: 'completed',
          details: 'Car transferred between dealers'
        }] : []),
        {
          id: 'garage-dealer-to-customer',
          title: 'Dealer to Customer',
          icon: 'mdi:car-deliver',
          date: carPickUpDelivery.find(p => p.RouteType === 'DealerToCustomer')?.DeliveryDate,
          status: carPickUpDelivery.some(p => p.RouteType === 'DealerToCustomer' && p.Status === 'completed') ? 'completed' : 'pending',
          details: 'Car delivered back to customer'
        }
      ];
    } else {
      // Home service flow
      conditionalStages = bookingStatusTracking.map((track, idx) => ({
        id: `home-service-${idx}`,
        title: track.Status === 'BuddyStarted' && track.Status !='completed' ? 'Buddy Started' : track.Status === 'BuddyReached' && track.Role === 'Buddy' ? 'Buddy Reached' : track.Status === 'ServiceStarted' && track.Role === 'Technician' ? 'Service Started' :  'Service In progress',
        icon: 'mdi:home-wrench',
        date: track.Created_At,
        status: track.Status === 'ServiceCompleted' ? 'completed' : 'in-progress',
        details: `${track.Role || '—'} - 'Service At Home'}`
      }));
    }

    const finalStages = [
      {
        id: 'service-completed',
        title: 'Service Completed',
        icon: 'mdi:car-check',
        date: addOns.filter(a => a.Is_Completed)[0]?.CompletedDate,
        status: addOns.length === 0 ? 'pending' : addOns.every(a => a.Is_Completed) ? 'completed' : addOns.some(a => a.Is_Completed) ? 'in-progress' : 'pending',
        details: addOns.length === 0 ? 'No services' : `${addOns.filter(a => a.Is_Completed).length}/${addOns.length} services`
      },
      {
        id: 'payment-done',
        title: 'Payment Done',
        icon: 'mdi:credit-card-check',
        date: payments[0]?.PaymentDate,
        status: payments.some(p => p.PaymentStatus === 'Success') ? 'completed' : 'pending',
        details: `₹${formatCurrency(payments.reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0))}`
      },
      {
        id: 'booking-done',
        title: 'Booking Done',
        icon: 'mdi:check-circle',
        date: data.BookingStatusUpdatedDate,
        status: data.BookingStatus === 'Completed' ? 'completed' : 'pending',
        details: data.BookingStatus
      }
    ];

    return [...baseStages, ...conditionalStages, ...finalStages];
  };

  const TimelineSection = () => {
    const stages = getTimelineData();
    const getStatusColor = (status) => {
      switch(status) {
        case 'completed': return '#10b981';
        case 'in-progress': return '#10b981';
        case 'pending': return '#6b7280';
        case 'failed': return '#ef4444';
        default: return '#6b7280';
      }
    };

    return (
      <div className="service-timeline position-relative">
        <style jsx>{`
          .service-timeline { 
            padding: 1.5rem 0; 
            overflow-x: auto;
            scrollbar-width: thin;
          }
          .timeline-container {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            min-width: max-content;
            position: relative;
          }
          .timeline-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            min-width: 180px;
            flex: 0 0 auto;
          }
          .timeline-step:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 2.5rem;
            right: -1rem;
            width: 2rem;
            height: 3px;
            background: linear-gradient(to right, var(--step-bg, #e5e7eb) 0%, var(--step-bg, #e5e7eb) 100%);
          }
          .step-circle {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.875rem;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 2;
            position: relative;
            border: 3px solid white;
          }
          .step-content {
            margin-top: 0.75rem;
            text-align: center;
            max-width: 160px;
          }
          .step-title {
            font-weight: 600;
            font-size: 0.85rem;
            margin-bottom: 0.25rem;
            line-height: 1.2;
          }
          .step-date, .step-details {
            font-size: 0.75rem;
            opacity: 0.8;
            line-height: 1.3;
          }
          .step-badge {
            position: absolute;
            top: -0.25rem;
            right: -0.25rem;
            padding: 0.125rem 0.375rem;
            font-size: 0.65rem;
            border-radius: 0.375rem;
            font-weight: 600;
          }
          @media (max-width: 768px) {
            .timeline-container { flex-direction: column; }
            .timeline-step:not(:last-child)::after { display: none; }
            .timeline-step { flex-direction: row; align-items: center; min-width: auto; }
            .timeline-step::before {
              content: '';
              position: absolute;
              left: 1.25rem;
              top: 0;
              bottom: 0;
              width: 3px;
              background: #e5e7eb;
            }
          }
        `}</style>
        <div className="timeline-container">
          {stages.map((step, index) => {
            const color = getStatusColor(step.status);
            return (
              <div key={step.id} className="timeline-step">
                <div 
                  className="step-circle" 
                  style={{ 
                    '--step-bg': color,
                    backgroundColor: color 
                  }}
                >
                  <Icon icon={step.icon} width="16" height="16" />
                  {index + 1}
                </div>
                <div className="step-content">
                  <div className="step-title" title={step.title}>{step.title}</div>
                  {step.date && (
                    <div className="step-date">
                      {formatDate(step.date)}
                    </div>
                  )}
                  {step.details && (
                    <div className="step-details" title={step.details}>
                      {step.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  if (!data) return null;
  const addOns = data.BookingAddOns || [];
  const vehicles = data.VehicleDetails || [];
  const payments = data.Payments || [];
  const invoices = data.Invoices || [];
  const carPickUpDelivery = data.CarPickUpDelivery || [];
  const followUps = data.Lead_FollowUps || [];
  const dealerApprovals = data.DealerAddOnApproval || [];
  const bookingStatusTracking = data.BookingStatusTracking || [];
  const bookingImages = data.ServiceImages  || [];

  const totalBookingAmount =
    (data.TotalPrice || 0) + (data.GSTAmount || 0) + (data.LabourCharges || 0) - (data.CouponAmount || 0);
  const totalPaid = payments
    .filter((p) => p.PaymentStatus && p.PaymentStatus.toLowerCase() !== "failed")
    .reduce((sum, p) => sum + Number(p.AmountPaid || 0), 0);
  const pendingAmount = Math.max(totalBookingAmount - totalPaid, 0);

  const confirmedAddOns = addOns.filter((a) => a.IsSupervisor_Confirm === 1);
  const pendingAddOns = (data.BookingsTempAddons || []).filter((a) => a.IsSupervisor_Confirm !== 1);

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 overflow-hidden">
        <div className="card-body py-4 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light bg-opacity-50">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3"
            onClick={onBack}
          >
            <Icon icon="mdi:arrow-left" width={18} /> Back
          </button>
          <div className="d-flex flex-wrap align-items-center gap-3 small">
            <span className="d-inline-flex align-items-center gap-1">
              <strong>Lead ID:</strong> {data.LeadId ?? "N/A"}
            </span>
            <span className="text-muted">|</span>
            <span className="d-inline-flex align-items-center gap-1">
              <strong>Booking Track ID:</strong> {data.BookingTrackID ?? "N/A"}
            </span>
            <span className="text-muted">|</span>
            <span className="d-inline-flex align-items-center gap-1">
              <strong>Customer Name:</strong> {data.CustomerName ?? data.CustFullName ?? "N/A"}
            </span>
            <span className="text-muted">|</span>
            <span className="d-inline-flex align-items-center gap-1">
              <strong>Booking Status:</strong> <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(data.BookingStatus)}`}>{data.BookingStatus ?? "N/A"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* NEW SERVICE TIMELINE - TOP OF PAGE */}
      <div className="mb-4">

        <ReportCard title="Service Timeline" icon="mdi:timeline-clock-outline">
          <TimelineSection data={data} />
        </ReportCard>
      </div>

      {/* Lead stage cards */}
      <div className="mb-4">
        <h6 className="text-uppercase text-muted small mb-3 d-flex align-items-center gap-2 mt-5">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 12 }}>1</span>
          Lead stage
        </h6>
        <div className="row g-4">
        <div className="col-lg-4">
          <ReportCard title="Lead Created" icon="mdi:lead-pencil">
            <div className="small">
              <DetailRow label="Lead ID" value={data.LeadId ?? "—"} />
              <DetailRow label="Created date" value={formatDate(data.LeadCreatedDate || data.CreatedDate)} />
              <DetailRow label="Customer" value={data.CustomerName ?? data.CustFullName ?? "—"} />
              <DetailRow label="Phone" value={data.PhoneNumber ?? "—"} />
              <DetailRow label="Service type" value={data.ServiceType ?? "—"} />
            </div>
          </ReportCard>
        </div>

        {followUps.length > 0 && (
          <div className="col-lg-8">
            <ReportCard title="Lead follow-ups" icon="mdi:phone-log-outline">
              <div className="accordion" id={`leadFollowupsAccordion-${data.BookingID}`}>
                <div className="accordion-item border-0">
                  <h2 className="accordion-header" id={`lead-followup-heading-${data.BookingID}`}>
                    <button
                      className="accordion-button px-3 py-2 bg-light"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#lead-followup-collapse-${data.BookingID}`}
                      aria-expanded="true"
                      aria-controls={`lead-followup-collapse-${data.BookingID}`}
                    >
                      <span className="small fw-semibold">
                        Lead follow-ups ({followUps.length})
                      </span>
                    </button>
                  </h2>
                  <div
                    id={`lead-followup-collapse-${data.BookingID}`}
                    className="accordion-collapse collapse show"
                    aria-labelledby={`lead-followup-heading-${data.BookingID}`}
                    data-bs-parent={`#leadFollowupsAccordion-${data.BookingID}`}
                  >
                    <div className="accordion-body small p-0 pt-3">
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Call Type</th>
                              <th>Call Discussion</th>
                              <th>Next action</th>
                              <th>Next Follow-Up Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {followUps.slice(0, 10).map((f) => (
                              <tr key={f.Id}>
                                <td>{formatDateTime(f.Updated_At ?? f.Created_At ?? "N/A")}</td>
                                <td>
                                  <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(f.Status)}`}>
                                    {f.Status ?? "N/A"}
                                  </span>
                                </td>
                                <td>{f.Type ?? "N/A"}</td>
                                <td className="text-break">{f.Notes ?? "N/A"}</td>
                                <td>{f.NextAction ?? "N/A"}</td>
                                <td>{formatDateTime(f.NextFollowUp_Date ?? "N/A")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ReportCard>
          </div>
        )}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-uppercase text-muted small mb-3 d-flex align-items-center gap-2 mt-5">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 12 }}>2</span>
          Booking & customer
        </h6>
        <div className="row g-4">
        {/* Booking overview (Booking Created stage) */}
        <div className="col-lg-4">
          <ReportCard title="Booking Created / Overview" icon="mdi:clipboard-text-outline">
            <div className="small">
              <DetailRow label="Booking ID" value={data.BookingID} />
              <DetailRow label="Booking date" value={formatDate(data.BookingDate)} />
              <DetailRow label="Time slot" value={data.TimeSlot ?? "—"} />
              <DetailRow label="Status" value={<span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(data.BookingStatus)}`}>{data.BookingStatus ?? "—"}</span>} />
              {/* <DetailRow label="Total price" value={formatCurrency(data.TotalPrice)} />
              <DetailRow label="GST amount" value={formatCurrency(data.GSTAmount)} />
              <DetailRow label="Coupon amount" value={formatCurrency(data.CouponAmount)} />
              <DetailRow label="Labour charges" value={formatCurrency(data.LabourCharges)} /> */}
              {data.Notes && <DetailRow label="Notes" value={data.Notes} />}
            </div>
          </ReportCard>
        </div>

        {/* Customer & address */}
        <div className="col-lg-4">
          <ReportCard title="Customer & address" icon="mdi:account-map-outline">
            <div className="small">
              <DetailRow label="Name" value={data.CustomerName ?? data.CustFullName ?? "—"} />
              <DetailRow label="Email" value={data.CustEmail ?? "—"} />
              <DetailRow label="Phone" value={data.PhoneNumber ?? "—"} />
              <DetailRow label="Address" value={(data.FullAddress ?? "—").replace(/\n/g, ", ")} />
              {(data.CityName || data.StateName) && (
                <DetailRow label="Location" value={[data.CityName, data.StateName].filter(Boolean).join(", ")} />
              )}
            </div>
          </ReportCard>
        </div>

        {/* Supervisor/Field Advisor Assigned - Assignment & team */}
        <div className="col-lg-4">
          <ReportCard title="Supervisor/Field Advisor Details" icon="mdi:account-group-outline">
            <div className="small">
              <DetailRow label="Supervisor Name" value={data.SupervisorHeadName ?? "N/A"} />
              <DetailRow label="Supervisor Number" value={data.SupervisorHeadPhoneNumber ?? "N/A"} />
              <DetailRow label="Field Advisor Name" value={data.FieldAdvisorName ?? "N/A"} />
              <DetailRow label="Field Advisor Number" value={data.FieldAdvisorPhoneNumber ?? "N/A"} />
            </div>
          </ReportCard>
        </div>

          {/* Services (BookingAddOns) - Customer Confirmation Stage detail */}
          <div className="col-12">
          <h6 className="d-flex align-items-center gap-2 mb-3">
            <Icon icon="mdi:car-wrench" className="text-primary" />
            Services ({addOns.length})
          </h6>
          <div className="row g-4">
            {addOns.map((svc, idx) => (
              <div key={svc.AddOnID ?? idx} className="col-12">
                <ReportCard
                  title={svc.ServiceName ?? `Service #${idx + 1}`}
                  icon="mdi:package-variant-closed"
                  borderVariant={svc.Is_Completed ? "success" : undefined}
                >
                  <div className="row g-3">
                    <div className="col-md-4 col-lg-4">
                      <div className="small text-muted mb-2 fw-semibold">Pricing</div>
                      <DetailRow label="Service price" value={formatCurrency(svc.ServicePrice)} />
                      <DetailRow label="Labour Charges" value={formatCurrency(svc.LabourCharges)} />
                      <DetailRow label="GST (18%)" value={formatCurrency(svc.GSTPrice)} />
                      <DetailRow label="Total Price" value={formatCurrency(svc.TotalPrice)} />
                     
                      {/* <DetailRow label="Subtotal" value={formatCurrency(svc.DealerGSTAmount + svc.ServicePrice + svc.LabourCharges + svc.GSTPrice + svc.TotalPrice + svc.DealerPrice)} /> */}
                    </div>
                    <div className="col-md-4 col-lg-4">
                      <div className="small text-muted mb-2 fw-semibold">Dealer</div>
                      <DetailRow label="Dealer Name" value={svc.DealerName ?? "N/A"} />
                      <DetailRow label="Dealer confirm" value={<span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(svc.IsDealer_Confirm)}`}>{svc.IsDealer_Confirm ?? "N/A"}</span>} />
                       <DetailRow label="Dealer price" value={formatCurrency(svc.DealerPrice)} />
                      <DetailRow label="Dealer GST Amount" value={formatCurrency(svc.DealerGSTAmount)} />
                    </div>
                    <div className="col-md-4 col-lg-4">
                      <div className="small text-muted mb-2 fw-semibold">Status</div>
                      <DetailRow label="Service Status" value={<span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(svc.StatusName)}`}>{svc.StatusName ?? "N/A"}</span>} />
                      
                      <DetailRow label="Completed" value={svc.Is_Completed ? "Yes" : "No"} />
                      {svc.CompletedRole && <DetailRow label="Completed by" value={`${svc.CompletedRole}`} />}
                    </div>
                    {Array.isArray(svc.Includes) && svc.Includes.length > 0 && (
                      <div className="col-12 col-lg-4">
                        <div className="small text-muted mb-2 fw-semibold">Includes</div>

                        <ul className="list-unstyled small mb-0">
                          {svc.Includes.map((inc, i) => (
                            <li
                              key={inc?.IncludeID ?? i}
                              className="d-flex align-items-center gap-2 py-1"
                            >
                              <Icon
                                icon="mdi:check-circle-outline"
                                className="text-success flex-shrink-0"
                                width={16}
                              />
                              {inc?.IncludeName ?? "—"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ReportCard>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle details */}
        {vehicles.length > 0 && (
          <div className="col-12">
            <ReportCard title="Vehicle details" icon="mdi:car-side">
              <div className="row g-3">
                {vehicles.map((v, i) => (
                  <div key={i} className="col-md-6 col-lg-4">
                    <div className="p-3 rounded-3 bg-light bg-opacity-50 small">
                      <DetailRow label="Registration No." value={v.RegistrationNumber ?? "N/A"} />
                      <DetailRow label="Brand / Model" value={[v.BrandName, v.ModelName].filter(Boolean).join(" · ") || "N/A"} />
                      <DetailRow label="Fuel Type" value={v.FuelTypeName ?? "N/A"} />
                      {v.KmDriven != null && <DetailRow label="KM Driven" value={v.KmDriven} />}
                      {v.YearOfPurchase != null && <DetailRow label="Year Of Purchase" value={v.YearOfPurchase} />}
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
        )}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-uppercase text-muted small mb-3 d-flex align-items-center gap-2 mt-5">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 12 }}>3</span>
          Dealer & customer confirmation
        </h6>
        <div className="row g-4">
        {/* Dealer Confirmation Stage - Approval History */}
        {dealerApprovals.length > 0 && (
          <div className="col-12">
            <ReportCard title="Dealer Approval History" icon="mdi:handshake-outline">
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service</th>
                      <th>Dealer</th>
                      <th>Status</th>
                      <th>Reason for Rejection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealerApprovals.slice(0, 15).map((a) => (
                      <tr key={a.Id}>
                        <td>{formatDateTime(a.CreatedDate)}</td>
                        <td>{a.ServiceName ?? "N/A"}</td>
                        <td>{a.DealerName ?? "N/A"}</td>
                        <td>
                          <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(a.IsDealer_Confirm)}`}>
                            {a.IsDealer_Confirm ?? "N/A"}
                          </span>
                        </td>
                        <td>{a.Reason ?? "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportCard>
          </div>
        )}

        {/* Customer Confirmation Stage */}
        {/* {(confirmedAddOns.length > 0 || pendingAddOns.length > 0) && (
          <div className="col-12 col-lg-4">
            <ReportCard title="Customer Confirmation" icon="mdi:account-check">
              <div className="small">
                <DetailRow
                  label="Confirmed / Pending services"
                  value={`${confirmedAddOns.length} confirmed / ${pendingAddOns.length} pending`}
                />
                <DetailRow
                  label="First confirmed by"
                  value={
                    confirmedAddOns[0]?.ConfirmRole
                      ? `${confirmedAddOns[0].ConfirmRole}`
                      : "—"
                  }
                />
              </div>
            </ReportCard>
          </div>
        )} */}

      
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-uppercase text-muted small mb-3 d-flex align-items-center gap-2 mt-5">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 12 }}>4</span>
          Technician Tracking
        </h6>
        <div className="row g-4">
        {/* Technician Assigned (summary) */}
        {carPickUpDelivery.length > 0 && (
          <div className="col-12 col-lg-4">
            <ReportCard title="Technician Assigned" icon="mdi:engineer">
              <div className="small">
                <DetailRow
                  label="Technician(s)"
                  value={
                    carPickUpDelivery
                      .map((p) => p.TechnicinaName)
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <DetailRow
                  label="Assigned date"
                  value={formatDateTime(carPickUpDelivery[0]?.AssignDate)}
                />
              </div>
            </ReportCard>
          </div>
        )}

        {/* Car Pickup & Delivery */}
        {carPickUpDelivery.length > 0 && (
          <div className="col-12">
            <ReportCard title="Technician Tracking" icon="mdi:car-side">
              <div className="row g-4">
                {carPickUpDelivery.map((pick, idx) => (
                  <div key={pick.Id ?? idx} className="col-12">
                    <div className="card border border-light rounded-3 overflow-hidden">
                      <div className="card-header bg-light d-flex flex-wrap align-items-center gap-2 py-2 px-3">
                        <span className={`badge rounded-pill px-3 py-2 ${pick.PickType === "CarDrop" ? "bg-info bg-opacity-25 text-info" : "bg-primary bg-opacity-25 text-primary"}`}>
                           {pick.ServiceType && (
                          <span className="small">{pick.ServiceType == 'ServiceAtHome' ? "Service At Home" : "Service At Garage"}</span>
                        )}
                        </span>
                        <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(pick.Status)}`}>
                          {pick.Status ?? "—"}
                        </span>
                       

                        
                      </div>
                      <div className="card-body py-3 px-4 small">
                        <div className="row g-3">
                          {pick.ServiceType == 'ServiceAtGarage' ? (
                            <>
                             <div className="col-md-6">
                            <div className="fw-semibold text-muted mb-2">From</div>
                            <DetailRow label="Name" value={pick.PickFromName ?? "—"} />
                            <DetailRow label="Phone" value={pick.PickFromPhone ?? "—"} />
                            <DetailRow label="Address" value={(pick.PickFromAddress ?? "—").replace(/\n/g, ", ")} />
                          </div>
                          <div className="col-md-6">
                            <div className="fw-semibold text-muted mb-2">To</div>
                            <DetailRow label="Name" value={pick.PickToName ?? "—"} />
                            <DetailRow label="Phone" value={pick.PickToPhone ?? "—"} />
                            <DetailRow label="Address" value={(pick.PickToAddress ?? "—").replace(/\n/g, ", ")} />
                          </div> 
                          </>
                          ) : (<></>)}
                           
                          
                          <div className="col-12">
                            <div className="fw-semibold text-muted mb-2">Technician & timing</div>
                            <DetailRow label="Technician" value={pick.TechnicinaName ?? "—"} />
                            <DetailRow label="Phone" value={pick.TechnicianPhoneNumber ?? "—"} />
                            <DetailRow label="Assign date" value={formatDateTime(pick.AssignDate)} />
                            {(pick.PickupDate || pick.PickupTime) && (
                              <DetailRow label="Pickup" value={`${formatDate(pick.PickupDate)} ${pick.PickupTime ?? ""}`.trim()} />
                            )}
                            {(pick.DeliveryDate || pick.DeliveryTime) && (
                              <DetailRow label="Delivery" value={`${formatDate(pick.DeliveryDate)} ${pick.DeliveryTime ?? ""}`.trim()} />
                            )}

                            <DetailRow label="Modified" value={formatDateTime(pick.ModifiedDate)} />
                          </div>
                          {Array.isArray(pick.DriverTracking) && pick.DriverTracking.length > 0 && (
                            <div className="col-12 mt-3">
                              <div className="fw-semibold text-muted mb-3">Technician / Driver Timeline</div>
                              <div className="position-relative">
                                <style jsx>{`
                                  .driver-timeline {
                                    display: flex;
                                    align-items: center;
                                    gap: 1rem;
                                    overflow-x: auto;
                                    padding: 1rem 0;
                                  }
                                  .driver-step {
                                    position: relative;
                                    flex-shrink: 0;
                                    text-align: center;
                                    min-width: 100px;
                                  }
                                  .driver-step:not(:first-child)::before {
                                    content: '';
                                    position: absolute;
                                    left: -0.75rem;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    width: 1.5rem;
                                    height: 3px;
                                    background: #e5e7eb;
                                    z-index: 1;
                                  }
                                  .driver-circle {
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    margin: 0 auto 0.5rem;
                                    font-weight: 600;
                                    font-size: 12px;
                                    color: white;
                                    position: relative;
                                    z-index: 2;
                                    border: 3px solid white;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                  }
                                  .driver-status {
                                    font-size: 11px;
                                    font-weight: 600;
                                    margin-bottom: 0.25rem;
                                    line-height: 1.2;
                                  }
                                  .driver-date {
                                    font-size: 10px;
                                    opacity: 0.7;
                                  }
                                  .car-icon {
                                    position: absolute;
                                    top: -25px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    font-size: 24px;
                                    z-index: 3;
                                    transition: left 0.3s ease;
                                  }
                                `}</style>
                                <div className="driver-timeline">
                                  {pick.DriverTracking.map((t, i) => {
                                    let displayStatus = t.Status;
                                    // Enhanced status-based colors from STATUS_BADGE_CLASS
                                    const status = t.Status?.toLowerCase() || 'pending';
                                    const isCompleted = status === 'completed';
                                    const getDriverColor = (s) => {
                                      if (s === 'completed') return '#116d6e'; // green
                                      if (s === 'pickup_started' || s === 'serviceinprogress') return '#116d6e'; // blue
                                      if (s === 'pickup_reached' || s === 'car_picked' || s === 'drop_reached') return '#116d6e'; // cyan
                                      if (s === 'in_transit' || s === 'outfordelivery') return '#116d6e'; // yellow
                                      return '#116d6e'; // gray
                                    };
                                    const color = getDriverColor(status);
                                    return (
                                      <div key={t.Id ?? i} className="driver-step">
                                        <div 
                                          className="driver-circle" 
                                          style={{ 
                                            backgroundColor: color
                                          }}
                                        >
                                          {i + 1}
                                        </div>
                                        <div className="driver-status">{displayStatus}</div>
                                        <div className="driver-date">{formatDateTime(t.CreatedDate)}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>
          </div>
        )}

        {/* Timeline replaces old Technician/Driver tracking & status table ✓ */}
        </div>
      </div>

      <div className="mb-4">
        <h6 className="text-uppercase text-muted small mb-3 d-flex align-items-center gap-2 mt-5">
          <span className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 12 }}>5</span>
          Billing & Payments
        </h6>
        <div className="row g-4">
        {/* Payment Done · payment history · Invoice */}
        {(payments.length > 0 || invoices.length > 0) && (
          <div className="col-12">
            <div className="row g-4">
              {payments.length > 0 && (
                <div className="col-lg-4">
                  <ReportCard title="Payment Done" icon="mdi:credit-card-check">
                    <div className="small">
                      <DetailRow label="Total booking amount" value={formatCurrency(totalBookingAmount)} />
                      <DetailRow label="Total paid" value={formatCurrency(totalPaid)} />
                      <DetailRow label="Pending amount" value={formatCurrency(pendingAmount)} />
                      <DetailRow
                        label="Last payment date"
                        value={formatDateTime(payments[0]?.PaymentDate)}
                      />
                    </div>
                  </ReportCard>
                </div>
              )}

              {payments.length > 0 && (
                <div className="col-12">
                  <ReportCard title="Payment history" icon="mdi:credit-card-outline">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover mb-0">
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
                              <td>{p.PaymentMode ?? "—"}</td>
                              <td className="text-break">{p.TransactionID ?? "—"}</td>
                              <td>
                                <span
                                  className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                    p.PaymentStatus === "Success" ? "Paid" : p.PaymentStatus
                                  )}`}
                                >
                                  {p.PaymentStatus === "Success" ? "Paid" : p.PaymentStatus ?? "—"}
                                </span>
                              </td>
                              <td>{p.IsRefunded ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ReportCard>
                </div>
              )}

              {invoices.length > 0 && (
                <div className="col-12">
                  <ReportCard title="Invoice" icon="mdi:file-document-outline">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Invoice #</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Tax</th>
                            <th>Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((inv) => (
                            <tr key={inv.InvoiceID}>
                              <td className="text-break">{inv.InvoiceNumber ?? "—"}</td>
                              <td>{inv.InvoiceType ?? "—"}</td>
                              <td>
                                <span
                                  className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                    inv.InvoiceStatus
                                  )}`}
                                >
                                  {inv.InvoiceStatus ?? "—"}
                                </span>
                              </td>
                              <td>{formatCurrency(inv.TotalAmount)}</td>
                              <td>{formatCurrency(inv.TaxAmount)}</td>
                              <td>{formatCurrency(inv.NetAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ReportCard>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
        {/* Booking images */}
        {bookingImages.length > 0 && (
          <div className="col-12">
            <ReportCard title="Booking images" icon="mdi:image-multiple-outline">
              <div className="row g-2">
                {bookingImages.map((img) => {
                  const imgSrc = img.ImageURL ? `${API_IMAGE}/${img.ImageURL}` : null;
                  return (
                    <div key={img.ImageID} className="col-12 col-md-6 col-lg-3">
                      <div className="card border rounded-3 overflow-hidden h-100">
                        <div className="card-body p-1 d-flex align-items-center gap-2">
                          <div className="flex-grow-1 small">
                            <div className="fw-semibold text-dark">{img.ImageUploadType ?? "—"} {img.ImagesType && <span className="text-muted">({img.ImagesType})</span>}</div>
                            <div className="text-muted mt-1">{formatDateTime(img.UploadedAt)}</div>
                            {/* {imgSrc && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 mt-1 text-primary text-decoration-none"
                                onClick={() => setFullscreenImageUrl(imgSrc)}
                              >
                                View full screen
                              </button>
                            )} */}
                          </div>
                          {imgSrc && (
                            <button
                              type="button"
                              className="flex-shrink-0 border-0 bg-light rounded-2 p-1 d-block overflow-hidden"
                              style={{ width: 60, height: 60 }}
                              onClick={() => setFullscreenImageUrl(imgSrc)}
                              aria-label="View image"
                            >
                              <img
                                src={imgSrc}
                                alt={img.ImageUploadType || "Booking"}
                                className="w-100 h-100 object-fit-cover rounded-1"
                                style={{ objectFit: "cover" }}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReportCard>
          </div>
        )}

        {/* Fullscreen image overlay */}
        {fullscreenImageUrl ? (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.9)" }}
            onClick={() => setFullscreenImageUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image fullscreen"
          >
            <button
              type="button"
              className="position-absolute top-0 end-0 m-3 btn btn-light btn-lg rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{ width: 48, height: 48 }}
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImageUrl(null);
              }}
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
        ) : null}

        {/* Lead follow-ups table is now inside Lead stage accordion */}
      </div>
    // </div>
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "reached", label: "Reached" },
  { value: "serviceStarted", label: "Service Started" },
  { value: "completed", label: "Completed" },
];

const CompleteServiceReportLayer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const roleId = localStorage.getItem("roleId");
  const userId = localStorage.getItem("userId");

  const [bookings, setBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("all");

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      let url = "";
      if (roleId === "8") {
        url = `${API_BASE}Supervisor/AssingedBookings?SupervisorID=${userId}`;
      } else if (roleId === "3") {
        url = `${API_BASE}Bookings?type=${role}&dealerid=${userId}`;
      } else if (roleId === "9") {
        url = `${API_BASE}Bookings?employeeId=${userId}`;
      } else {
        url = `${API_BASE}Bookings`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.CreatedDate || 0) - new Date(a.CreatedDate || 0)
      );
      setBookings(sorted);
    } catch (err) {
      console.error("Error fetching bookings", err);
      setBookings([]);
    }
  }, [token, roleId, role, userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Open report when navigating with ?bookingId= (e.g. from LeadViewLayer)
  const bookingIdFromUrl = searchParams.get("bookingId");
  useEffect(() => {
    if (!bookingIdFromUrl || !token) return;
    setError(null);
    setReportLoading(true);
    setReportData(null);
    axios
      .get(`${API_BASE}Bookings/BookingId?Id=${bookingIdFromUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const json = res.data;
        const data = Array.isArray(json) ? json[0] : json;
        if (!data) throw new Error("No booking data returned");
        setReportData(data);
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? "Booking not found" : err.message || "Failed to load report");
      })
      .finally(() => setReportLoading(false));
  }, [bookingIdFromUrl, token]);

  const openReport = useCallback((row) => {
    setError(null);
    setReportLoading(true);
    setReportData(null);
    const id = row?.BookingID ?? row?.id;
    if (!id) {
      setError("Invalid booking");
      setReportLoading(false);
      return;
    }
    axios
      .get(`${API_BASE}Bookings/BookingId?Id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const json = res.data;
        const data = Array.isArray(json) ? json[0] : json;
        if (!data) throw new Error("No booking data returned");
        setReportData(data);
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? "Booking not found" : err.message || "Failed to load report");
      })
      .finally(() => setReportLoading(false));
  }, [token]);

  const filteredBookings = bookings.filter((b) => {
    const q = searchText.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (b.CustFullName || b.CustomerName || "").toLowerCase().includes(q) ||
      (b.CustPhoneNumber || b.PhoneNumber || "").toLowerCase().includes(q) ||
      (b.BookingTrackID || "").toLowerCase().includes(q) ||
      (b.LeadId || "").toLowerCase().includes(q);
    const bookingDate = new Date(b.BookingDate || b.CreatedDate || 0);
    const matchesDate =
      (!startDate || bookingDate >= new Date(startDate)) &&
      (!endDate || bookingDate <= new Date(endDate));
    const price = (b.TotalPrice || 0) + (b.GSTAmount || 0) + (b.LabourCharges || 0) - (b.CouponAmount || 0);
    const matchesPrice =
      (!minPrice || price >= parseFloat(minPrice)) &&
      (!maxPrice || price <= parseFloat(maxPrice));
    const matchesStatus =
      status === "all" ||
      (b.BookingStatus || "").toLowerCase() === status.toLowerCase();
    return matchesSearch && matchesDate && matchesPrice && matchesStatus;
  });

  // Service Date format DD/MM/YYYY like BookingLayer
  const formatServiceDate = (rawDate) => {
    if (!rawDate) return "-";
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const allColumns = [
    {
      name: "Booking id",
      cell: (row) => (
        <button
          type="button"
          className="btn btn-link p-0 text-primary text-decoration-none fw-bold "
          style={{ fontSize: "13px" }}
          onClick={() => openReport(row)}
          disabled={reportLoading}
        >
          {row.BookingTrackID || "-"}
        </button>
      ),
      width: "170px",
      sortable: true,
    },
    {
      name: "Service Date",
      selector: (row) => formatServiceDate(row.BookingDate || row.CreatedDate),
      sortField: "CreatedDate",
      width: "150px",
      sortable: true,
    },
    // {
    //   name: "Time slot",
    //   selector: (row) => row.TimeSlot || row.AssignedTimeSlot || "-",
    //   width: "220px",
    //   sortable: true,
    //   wrap: true,
    // },
    {
      name: "Amount",
      selector: (row) =>
        `₹${((row.TotalPrice || 0) + (row.GSTAmount || 0) + (row.LabourCharges || 0) - (row.CouponAmount || 0)).toFixed(2)}`,
      width: "120px",
      sortable: true,
    },
    {
      name: "Cust. Name",
      selector: (row) => (
        <>
          <span className="fw-bold"> {row.CustFullName || row.CustomerName || "-"}</span>
          <br />
          {row.CustPhoneNumber || row.PhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
    },
    {
      name: "Supervisor",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {row.SupervisorName || row.SupervisorHeadName || "Not Assigned"}
          </span>
          <br />
          {row.SupervisorPhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
    },
    {
      name: "Field Advisor",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {row.FieldAdvisorName ? row.FieldAdvisorName : "Not Assigned"}
          </span>
          <br />
          {row.FieldAdvisorPhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
    },
    // {
    //   name: "Services",
    //   cell: (row) => {
    //     const addOns = row.BookingAddOns || [];
    //     const count = addOns.length;
    //     if (count === 0) return <span className="text-muted">—</span>;
    //     const names = addOns.slice(0, 3).map((a) => a.ServiceName || "Service").filter(Boolean);
    //     return (
    //       <span className="small">
    //         <span className="fw-semibold">{count} service{count !== 1 ? "s" : ""}</span>
    //         {names.length > 0 && (
    //           <>
    //             <br />
    //             <span className="text-muted">{names.join(", ")}{count > 3 ? "…" : ""}</span>
    //           </>
    //         )}
    //       </span>
    //     );
    //   },
    //   width: "180px",
    //   wrap: true,
    // },
    // {
    //   name: "Car Brand/Model",
    //   selector: (row) => (
    //     <>
    //       <span className="fw-bold">
    //         {row.VehicleDetails?.[0]?.BrandName || "Not Available"} <br />
    //         ({row.VehicleDetails?.[0]?.ModelName || ""})
    //       </span>
    //     </>
    //   ),
    //   width: "150px",
    //   sortable: true,
    // },
    // {
    //   name: "Car YOP",
    //   selector: (row) => (
    //     <>
    //       <span className="fw-bold">
    //         {row.VehicleDetails?.[0]?.YearOfPurchase || "Not Available"}
    //       </span>
    //     </>
    //   ),
    //   width: "150px",
    //   sortable: true,
    // },
    // {
    //   name: "Fuel Type",
    //   selector: (row) => (
    //     <>
    //       <span className="fw-bold">
    //         {row.VehicleDetails?.[0]?.FuelTypeName || "Not Available"}
    //       </span>
    //     </>
    //   ),
    //   width: "150px",
    //   sortable: true,
    // },
    {
      name: "Booking Status",
      cell: (row) => {
        let statusVal = row?.BookingStatus ?? "-";
        if (!statusVal || statusVal === "-") statusVal = "Not Assigned";
        return (
          <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(statusVal)}`}>
            {statusVal}
          </span>
        );
      },
      wrap: true,
      width: "160px",
      sortable: true,
    },
    {
      name: "Payment Status",
      cell: (row) => {
        let paymentStatus = row?.PaymentStatus ?? "Pending";
        let displayText = paymentStatus;
        if (paymentStatus.toLowerCase() === "success") displayText = "Paid";
        return (
          <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(displayText)}`}>
            {displayText}
          </span>
        );
      },
      wrap: true,
      width: "160px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View complete service report"
            onClick={() => openReport(row)}
            disabled={reportLoading}
          >
            <Icon icon="lucide:eye" />
          </button>
        </div>
      ),
      width: "100px",
    },
  ];

  // Filter columns for Dealer: hide Amount, Cust. Name, Booking Status, Payment Status (same as BookingLayer)
  const columns = allColumns.filter((col) => {
    if (role === "Dealer") {
      return !["Amount", "Cust. Name", "Booking Status", "Payment Status"].includes(col.name);
    }
    return true;
  });

  return (
    <div className="row gy-4">
      <div className="col-12">
        {reportData ? (
          <CompleteServiceReportView
            data={reportData}
            onBack={() => { setReportData(null); setError(null); setSearchParams({}); }}
          />
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5></h5>
            </div>
            <div className="card overflow-hidden p-3">
              <div className="card-header">
                <div
                  className="d-flex align-items-center flex-wrap gap-2"
                  style={{ overflowX: "auto", whiteSpace: "nowrap" }}
                >
                  <form className="navbar-search flex-grow-1 flex-shrink-1" style={{ minWidth: "180px" }}>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ minWidth: "200px", width: "100%" }}
                      />
                      <Icon
                        icon="ion:search-outline"
                        className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                        width="20"
                        height="20"
                      />
                    </div>
                  </form>
                  <input
                    type="date"
                    className="form-control flex-shrink-0"
                    placeholder="DD-MM-YYYY"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ minWidth: "120px", flex: "1 1 130px" }}
                  />
                  <input
                    type="date"
                    className="form-control flex-shrink-0"
                    placeholder="DD-MM-YYYY"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ minWidth: "120px", flex: "1 1 130px" }}
                  />
                  {role !== "Dealer" && (
                    <>
                      <input
                        type="number"
                        className="form-control flex-shrink-0"
                        placeholder="Min Amt"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        style={{ minWidth: "100px", flex: "1 1 100px" }}
                      />
                      <input
                        type="number"
                        className="form-control flex-shrink-0"
                        placeholder="Max Amt"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        style={{ minWidth: "100px", flex: "1 1 100px" }}
                      />
                    </>
                  )}
                  {role !== "Dealer" && (
                    <select
                      className="form-select flex-shrink-0"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{ minWidth: "120px", flex: "1 1 120px" }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    title="Complete service report"
                  >
                    <Icon icon="mdi:microsoft-excel" width="20" height="20" />
                  </button>
                </div>
              </div>
              {reportLoading && (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Loading report…
                </div>
              )}
              {error && (
                <div className="alert alert-danger mx-3 mt-3 mb-0 d-flex align-items-center gap-2">
                  <Icon icon="mdi:alert-circle-outline" width={20} />
                  {error}
                </div>
              )}
              <DataTable
                columns={columns}
                data={filteredBookings}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100, filteredBookings.length]}
                highlightOnHover
                responsive
                striped
                persistTableHead
                defaultSortField="CreatedDate"
                defaultSortAsc={false}
                noDataComponent="No Bookings available"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompleteServiceReportLayer;
