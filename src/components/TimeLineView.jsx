import { Icon } from "@iconify/react";
import { useEffect } from "react";

const TIMELINE_STYLES = `
  .service-timeline {
    padding: 0.75rem 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .timeline-container {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
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
    content: "";
    position: absolute;
    top: 3.1rem;
    right: -1rem;
    width: 1.5rem;
    height: 3px;
    background: linear-gradient(
      to right,
      var(--step-line, #e5e7eb) 0%,
      var(--step-line, #e5e7eb) 100%
    );
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1;
    position: relative;
    border: 3px solid white;
  }
  .timeline-step.is-live .step-circle {
    animation: stageBlink 1.1s ease-in-out infinite;
  }
  @keyframes stageBlink {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.55);
    }
    50% {
      transform: scale(1.08);
      box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
    }
  }
  .step-content {
    margin-top: 0.55rem;
    width: 100%;
  }
  .timeline-step-card {
    width: 100%;
    border-radius: 18px;
    padding: 0.75rem 0.85rem;
    border: 1px solid #e2e8f0;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    text-align: left;
  }
  .timeline-step-card.is-latest-completed {
    border-color: rgba(13, 110, 253, 0.28);
    box-shadow: 0 14px 32px rgba(13, 110, 253, 0.12);
  }
  .timeline-step-card.is-live {
    border-color: rgba(245, 158, 11, 0.35);
    box-shadow: 0 14px 30px rgba(245, 158, 11, 0.12);
  }
  .timeline-step-card.is-completed {
    border-color: rgba(34, 197, 94, 0.22);
  }
  .timeline-step-card.is-failed {
    border-color: rgba(220, 38, 38, 0.24);
  }
  .timeline-step-card.is-pending {
    border-style: dashed;
  }
  .step-title {
    font-weight: 600;
    font-size: 0.84rem;
    margin-bottom: 0.25rem;
    line-height: 1.2;
    color: #0f172a;
  }
  .step-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
  }
  .step-status-badge {
    font-size: 0.72rem;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-weight: 700;
  }
  .step-index {
    font-size: 0.74rem;
    font-weight: 700;
    color: #64748b;
  }
  .step-date {
    font-size: 0.78rem;
    color: #64748b;
    line-height: 1.45;
  }
  .step-details {
    margin-top: 0.45rem;
    font-size: 0.76rem;
    color: #334155;
    line-height: 1.45;
  }
  @media (max-width: 768px) {
    .timeline-container {
      flex-direction: column;
    }
    .timeline-step:not(:last-child)::after {
      display: none;
    }
    .timeline-step {
      flex-direction: row;
      align-items: flex-start;
      min-width: auto;
      width: 100%;
    }
    .timeline-step::before {
      content: "";
      position: absolute;
      left: 1.25rem;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #e5e7eb;
    }
    .step-content {
      margin-top: 0;
      margin-left: 0.9rem;
    }
  }
`;

const buildServiceStages = (bookingData) => {
  if (!bookingData) return [];

  const addOns = bookingData.BookingAddOns || [];
  const supervisorAddOns = bookingData.SupervisorBookings || [];
  const carPickUpDelivery = bookingData.CarPickUpDelivery || [];
  const payments = bookingData.Payments || [];

  const confirmedAddOns = addOns.filter((a) => a.IsSupervisor_Confirm === 1);
  const pendingAddOns = (bookingData.BookingsTempAddons || []).filter(
    (a) => a.IsSupervisor_Confirm !== 1,
  );
  const confirmedLength = confirmedAddOns.length;
  const pendingLength = supervisorAddOns.length;

  const totalServices = addOns.length;
  const completedServices = addOns.filter((a) => a.Is_Completed).length;
  const normalizeTimelineValue = (value) =>
    (value || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  const normalizedBookingWorkflowStatus = normalizeTimelineValue(
    bookingData?.BookingStatus,
  );
  const normalizedServiceStatuses = addOns.map((item) =>
    normalizeTimelineValue(
      item?.StatusName ??
      item?.statusName ??
      item?.AddOnStatus ??
      item?.addOnStatus,
    ),
  );
  const normalizedPaymentStatuses = payments.map((payment) =>
    normalizeTimelineValue(payment?.PaymentStatus),
  );
  const hasServiceInProgressSignal =
    normalizedBookingWorkflowStatus.includes("serviceinprogress") ||
    normalizedServiceStatuses.some(
      (status) =>
        status.includes("inprogress") || status.includes("serviceinprogress"),
    );
  const hasServiceStartedSignal =
    normalizedBookingWorkflowStatus.includes("servicestart") ||
    normalizedServiceStatuses.some((status) => status.includes("started"));
  const hasAnyServiceProgress =
    hasServiceInProgressSignal ||
    hasServiceStartedSignal ||
    completedServices > 0;
  const hasCompletedPayment = normalizedPaymentStatuses.some(
    (status) => status === "success" || status === "paid",
  );
  const hasPartialPayment =
    !hasCompletedPayment &&
    (normalizedPaymentStatuses.some((status) => status === "partialpaid") ||
      payments.some((payment) => Number(payment?.AmountPaid || 0) > 0));

  const leadStage = {
    id: "lead-created",
    title: "Lead created",
    date: bookingData.LeadCreatedDate,
    status: "completed",
    details: `Lead ID: ${bookingData.LeadId ?? "—"}`,
  };

  const bookingStage = {
    id: "booking-created",
    title: "Booking created",
    date: bookingData.BookingDate,
    status: "completed",
    details: `Booking ID: ${bookingData.BookingTrackID ?? "—"}`,
  };

  const supervisorStage = {
    id: "supervisor-assigned",
    title: bookingData.SupervisorHeadName
      ? "Supervisor assigned"
      : "Supervisor assignment pending",
    date: bookingData.SupervisorHeadAssignDate,
    status: bookingData.SupervisorHeadName ? "completed" : "pending",
    details: bookingData.SupervisorHeadName || "—",
  };

  const fieldAdvisorStage = {
    id: "field-advisor-assigned",
    title: bookingData.FieldAdvisorName
      ? "Field advisor assigned"
      : "Field advisor assignment",
    date: bookingData.FieldAdvisorAssignDate,
    status: bookingData.FieldAdvisorName ? "completed" : "pending",
    details: bookingData.FieldAdvisorName || "—",
  };

  const allDealerItems = [
    ...(bookingData?.BookingAddOns || []),
    ...(bookingData?.SupervisorBookings || []),
  ];
  const assignedDealerEntries = allDealerItems.filter(
    (item) =>
      (item?.DealerID != null && item?.DealerID !== "") || item?.DealerName,
  );
  const assignedDealerCount = new Set(
    assignedDealerEntries.map(
      (item) => `${item?.DealerID ?? "no-id"}-${item?.DealerName ?? "no-name"}`,
    ),
  ).size;
  const dealerApprovalCount = allDealerItems.filter(
    (item) => item.IsDealer_Confirm === "Approved",
  ).length;

  const dealerAssignmentStage = {
    id: "dealer-assignment",
    title:
      assignedDealerCount > 0 ? "Dealer(s) assigned" : "Dealer(s) assignment",
    date:
      assignedDealerEntries[0]?.UpdatedDate ||
      assignedDealerEntries[0]?.CreatedDate,
    status: assignedDealerCount > 0 ? "completed" : "pending",
    details:
      assignedDealerCount > 0
        ? `${assignedDealerCount} dealer(s) assigned`
        : "No dealers assigned",
  };

  const dealerApprovalStage = {
    id: "dealer-confirmation",
    title:
      assignedDealerCount === 0
        ? "Dealer(s) approval"
        : allDealerItems.length === 0
          ? "Dealer(s) approval"
          : allDealerItems.every((item) => item.IsDealer_Confirm === "Approved")
            ? "Dealer(s) approval"
            : allDealerItems.some((item) => item.IsDealer_Confirm === "Rejected")
              ? "Dealer(s) approval failed"
              : "Dealer(s) approval",
    date: allDealerItems.find((item) => item.IsDealer_Confirm)?.UpdatedDate,
    status:
      assignedDealerCount === 0
        ? "pending"
        : allDealerItems.length === 0
          ? "pending"
          : allDealerItems.every((item) => item.IsDealer_Confirm === "Approved")
            ? "completed"
            : allDealerItems.some((item) => item.IsDealer_Confirm === "Rejected")
              ? "failed"
              : "in-progress",
    details:
      assignedDealerCount === 0
        ? "Awaiting dealer assignment"
        : allDealerItems.length === 0
          ? "No dealers"
          : `${dealerApprovalCount} / ${allDealerItems.length} Service(s) Approved`,
  };

  const customerStage = {
    id: "customer-confirmation",
    title:
      confirmedLength === 0 && pendingLength === 0
        ? "Customer confirmation pending"
        : confirmedLength > 0
          ? pendingLength === 0
            ? "Customer confirmed"
            : "Customer confirmation in progress"
          : "Customer confirmation pending",
    date: addOns.find((item) => item.ConfirmRole)?.ConfirmDate,
    status:
      confirmedLength === 0 && pendingLength === 0
        ? "pending"
        : confirmedLength > 0
          ? pendingLength === 0
            ? "completed"
            : "in-progress"
          : "pending",
    details: `${confirmedLength} Service(s) Confirmed / ${pendingLength} pending`,
  };

  const technicianStage = {
    id: "technician-assigned",
    title:
      carPickUpDelivery.length > 0
        ? "Technician assigned"
        : "Technician assignment",
    date: carPickUpDelivery[0]?.AssignDate,
    status: carPickUpDelivery.length > 0 ? "completed" : "pending",
    details:
      carPickUpDelivery
        .map((item) => item.TechnicinaName)
        .filter(Boolean)
        .join(", ") || "—",
  };

  const serviceCompletedStage = {
    id: "service-completed",
    title:
      totalServices === 0
        ? "Service pending"
        : completedServices === totalServices
          ? "Services completed"
          : hasAnyServiceProgress
            ? "Service in progress"
            : "Service pending",
    date: addOns.find((item) => item.Is_Completed)?.CompletedDate,
    status:
      totalServices === 0
        ? "pending"
        : completedServices === totalServices
          ? "completed"
          : hasAnyServiceProgress
            ? "in-progress"
            : "pending",
    details:
      totalServices === 0
        ? "No services"
        : `${completedServices}/${totalServices} services`,
  };

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.AmountPaid || 0),
    0,
  );
  const paymentStage = {
    id: "payment-done",
    title: hasCompletedPayment
      ? "Payment completed"
      : hasPartialPayment
        ? "Payment in progress"
        : "Payment pending",
    date: payments[payments.length - 1]?.PaymentDate,
    status: hasCompletedPayment
      ? "completed"
      : hasPartialPayment
        ? "in-progress"
        : "pending",
    details:
      totalPaid > 0
        ? `Paid ₹${totalPaid.toFixed(2)}`
        : "Awaiting payment",
  };

  const bookingDoneStage = {
    id: "booking-done",
    title:
      bookingData.BookingStatus === "Completed"
        ? "Booking completed"
        : "Booking completion pending",
    date: bookingData.BookingCompletedDate,
    status: bookingData.BookingStatus === "Completed" ? "completed" : "pending",
    details: bookingData.BookingStatus || "—",
  };

  let stages = [
    leadStage,
    bookingStage,
    supervisorStage,
    fieldAdvisorStage,
    dealerAssignmentStage,
    dealerApprovalStage,
    customerStage,
    technicianStage,
    serviceCompletedStage,
    paymentStage,
    bookingDoneStage,
  ];

  stages = stages.map((stage, idx) => {
    if (stage.status !== "pending") return stage;
    const hasLaterCompleted = stages
      .slice(idx + 1)
      .some((item) => item.status === "completed");
    if (hasLaterCompleted) {
      return { ...stage, status: "failed" };
    }
    return stage;
  });

  const paymentStageIndex = stages.findIndex(
    (stage) => stage.id === "payment-done",
  );
  if (
    paymentStageIndex >= 0 &&
    ["completed", "in-progress"].includes(stages[paymentStageIndex].status)
  ) {
    const lastProgressedNonPaymentStageIndex = stages.reduce(
      (lastIndex, stage, index) => {
        if (stage.id === "payment-done") return lastIndex;
        return ["completed", "in-progress"].includes(stage.status)
          ? index
          : lastIndex;
      },
      -1,
    );

    const desiredPaymentIndex = Math.min(
      lastProgressedNonPaymentStageIndex + 1,
      stages.length - 1,
    );

    if (desiredPaymentIndex !== paymentStageIndex) {
      const [paymentStageItem] = stages.splice(paymentStageIndex, 1);
      const adjustedInsertIndex =
        paymentStageIndex < desiredPaymentIndex
          ? desiredPaymentIndex - 1
          : desiredPaymentIndex;
      stages.splice(adjustedInsertIndex, 0, paymentStageItem);
    }
  }

  return stages;
};

const TimeLineView = ({ bookingData, displayDate }) => {
  const serviceStages = buildServiceStages(bookingData);

  const latestInProgressStageIndex = serviceStages.findIndex(
    (stage) => stage.status === "in-progress",
  );
  const latestCompletedStageIndex = serviceStages.reduce(
    (lastIndex, stage, index) =>
      stage.status === "completed" ? index : lastIndex,
    -1,
  );
  const latestFailedStageIndex = serviceStages.reduce(
    (lastIndex, stage, index) =>
      stage.status === "failed" ? index : lastIndex,
    -1,
  );
  const latestTimelineStageIndex =
    latestInProgressStageIndex >= 0
      ? latestInProgressStageIndex
      : latestCompletedStageIndex >= 0
        ? latestCompletedStageIndex
        : latestFailedStageIndex >= 0
          ? latestFailedStageIndex
          : serviceStages.findIndex((stage) => stage.status === "pending");

  useEffect(() => {
    if (!bookingData || serviceStages.length === 0) return;

    const focusStage =
      serviceStages.find((stage) => stage.status === "in-progress") ||
      serviceStages[latestTimelineStageIndex];

    if (!focusStage) return;

    const el = document.querySelector(`[data-stage-id="${focusStage.id}"]`);
    if (!el) return;

    try {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    } catch {
      // ignore scroll errors
    }
  }, [bookingData, serviceStages, latestTimelineStageIndex]);

  const getTimelineStagePresentation = (stage, index) => {
    const isLatestStage = index === latestTimelineStageIndex;

    if (stage.status === "in-progress") {
      return {
        circleColor: "#f59e0b",
        connectorColor: "#fde68a",
        badgeClass: "bg-warning-subtle text-warning-emphasis",
        cardClass: "timeline-step-card is-live",
        stepClass: "timeline-step is-live",
        label: "Current stage",
      };
    }

    // if (stage.status === "completed" && isLatestStage) {
    //   return {
    //     circleColor: "#0d6efd",
    //     connectorColor: "#93c5fd",
    //     badgeClass: "bg-primary-subtle text-primary",
    //     cardClass: "timeline-step-card is-latest-completed",
    //     stepClass: "timeline-step is-latest-completed",
    //     label: "Latest done",
    //   };
    // }

    if (stage.status === "completed") {
      return {
        circleColor: "#16a34a",
        connectorColor: "#86efac",
        badgeClass: "bg-success-subtle text-success",
        cardClass: "timeline-step-card is-completed",
        stepClass: "timeline-step is-completed",
        label: "Completed",
      };
    }

    if (stage.status === "failed") {
      return {
        circleColor: "#777777ff",
        connectorColor: "#4f4f4fff",
        badgeClass: "bg-secondary-subtle text-gray",
        cardClass: "timeline-step-card is-failed",
        stepClass: "timeline-step is-failed",
        label: "Pending",
      };
    }

    return {
      circleColor: "#94a3b8",
      connectorColor: "#e2e8f0",
      badgeClass: "bg-secondary-subtle text-secondary",
      cardClass: "timeline-step-card is-pending",
      stepClass: "timeline-step is-pending",
      label: "Pending",
    };
  };

  if (!bookingData) return null;

  return (
    <div className="mb-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body py-3 px-3">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span
                className="badge rounded-pill bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center"
                style={{ width: 28, height: 28 }}
              >
                <Icon
                  icon="mdi:timeline-clock-outline"
                  width={18}
                  height={18}
                />
              </span>
              <div>
                <div className="fw-semibold small text-uppercase text-muted">
                  Service Timeline
                </div>
                <div className="small text-body-secondary">
                  <span className="me-2">
                    <strong>Booking Date:</strong>{" "}
                    {bookingData.BookingDate
                      ? displayDate(bookingData.BookingDate)
                      : "N/A"}
                  </span>
                  {bookingData.TimeSlot && (
                    <span className="me-2">
                      <strong>Time Slot:</strong> {bookingData.TimeSlot}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="ms-auto small text-muted d-flex flex-wrap gap-3">
              {bookingData.LeadCreatedDate && (
                <span>
                  <strong>Lead Created:</strong>{" "}
                  {displayDate(bookingData.LeadCreatedDate)}
                </span>
              )}
              {bookingData.ServiceScheduledDate && (
                <span>
                  <strong>Service Scheduled:</strong>{" "}
                  {displayDate(bookingData.ServiceScheduledDate)}
                </span>
              )}
              {bookingData.ServiceCompletedDate && (
                <span>
                  <strong>Service Completed:</strong>{" "}
                  {displayDate(bookingData.ServiceCompletedDate)}
                </span>
              )}
            </div>
          </div>

          {serviceStages.length > 0 && (
            <div className="mt-3 service-timeline position-relative">
              <style>{TIMELINE_STYLES}</style>
              <div className="timeline-container">
                {serviceStages.map((stage, index) => {
                  const stagePresentation = getTimelineStagePresentation(
                    stage,
                    index,
                  );

                  return (
                    <div
                      key={stage.id}
                      className={stagePresentation.stepClass}
                      data-stage-id={stage.id}
                      style={{
                        "--step-line": stagePresentation.connectorColor,
                      }}
                    >
                      <div
                        className="step-circle"
                        style={{
                          backgroundColor: stagePresentation.circleColor,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="step-content">
                        <div className={stagePresentation.cardClass}>
                          <div className="step-status-row">
                            <span
                              className={`step-status-badge ${stagePresentation.badgeClass}`}
                            >
                              {stagePresentation.label}
                            </span>
                            <span className="step-index">
                              Step {index + 1}
                            </span>
                          </div>
                          <div className="step-title">{stage.title}</div>
                          <div className="step-date">
                            {stage.date ? displayDate(stage.date) : "—"}
                          </div>
                          {stage.details && (
                            <div className="step-details">{stage.details}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeLineView;
