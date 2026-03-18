import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const ServiceTimelineBoard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}Bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let all = res.data?.data || res.data || [];
        if (!Array.isArray(all)) all = [];

        // Exclude only clearly closed ones (Cancelled / Refunded).
        // Completed bookings are still needed for "Payment & Booking Pending".
        const filtered = all.filter(
          (b) =>
            !["Cancelled", "Refunded"].includes(
              (b.BookingStatus || "").toString(),
            ),
        );

        setBookings(filtered);
      } catch (err) {
        console.error("ServiceTimelineBoard fetch error:", err);
        setError(
          err?.response?.data?.message || "Failed to load bookings for board.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = useMemo(() => {
    const buckets = {
      bookingsNotConfirmed: [],
      customerConfirmation: [],
      serviceInProgress: [],
      paymentBookingPending: [],
    };

    bookings.forEach((b) => {
      const bookingStatus = (b.BookingStatus || "").toString();
      const paymentStatus = (b.PaymentStatus || "").toString();

      const addOns = [
        ...(b.BookingAddOns || []),
        ...(b.BookingsTempAddons || []),
      ];
      const supervisorBookings = b.SupervisorBookings || [];
      const allServices = [...addOns, ...supervisorBookings];

      const hasAnyConfirmed = allServices.some(
        (s) => (s.IsSupervisor_Confirm ?? s.isSupervisor_Confirm) === 1,
      );
      const allCompleted =
        allServices.length > 0 &&
        allServices.every(
          (s) => (s.IsSupervisor_Confirm ?? s.isSupervisor_Confirm) === 1,
        );
      const hasTechAssigned = supervisorBookings.some(
        (s) => s.TechID || s.TechnicinaName,
      );

      const isPaymentPending =
        paymentStatus !== "Success" && paymentStatus !== "Partialpaid";

      // Decide stage (priority order)
      if (bookingStatus === "Completed" && allCompleted && isPaymentPending) {
        // Booking completed, all services confirmed, but payment not fully done
        buckets.paymentBookingPending.push(b);
      } else if (hasTechAssigned) {
        buckets.serviceInProgress.push(b);
      } else if (hasAnyConfirmed) {
        buckets.customerConfirmation.push(b);
      } else {
        buckets.bookingsNotConfirmed.push(b);
      }
    });

    return buckets;
  }, [bookings]);

  const renderCard = (b) => {
    const bookingId = b.BookingID ?? b.Id;
    const customerName = b.CustomerName || b.Name || "N/A";
    const carInfo =
      b.CarRegistrationNumber ||
      b.VehicleNumber ||
      [b.BrandName, b.ModelName].filter(Boolean).join(" ") ||
      "";

    const created = b.CreatedDate
      ? new Date(b.CreatedDate).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const addOns = [
      ...(b.BookingAddOns || []),
      ...(b.BookingsTempAddons || []),
    ];
    const supervisorBookings = b.SupervisorBookings || [];
    const allServices = [...addOns, ...supervisorBookings];

    const confirmedCount = b.BookingAddOns?.length ?? 0;

    return (
      <div
        key={bookingId}
        className="card mb-3 border-0 booking-kanban-card"
        style={{
          borderRadius: 14,
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.06), transparent 55%), #ffffff",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <div className="card-body p-3 pb-2">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <div>
              <div className="fw-semibold small text-slate-800">
                BID #{b.BookingTrackID ?? bookingId}
              </div>
              <div className="text-muted small">{customerName}</div>
            </div>
            <span className="badge bg-primary-subtle text-primary small">
              {b.BookingStatus || "Pending"}
            </span>
          </div>
          {carInfo && (
            <div className="small text-muted mb-1">
              <Icon
                icon="mdi:car-side"
                width={14}
                height={14}
                className="me-1 text-primary"
              />
              {carInfo}
            </div>
          )}
          {created && (
            <div className="small text-muted mb-2">
              <Icon
                icon="mdi:calendar-clock"
                width={14}
                height={14}
                className="me-1 text-emerald-600"
              />
              {created}
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between mt-2">
            <div className="small text-muted d-flex align-items-center gap-1">
              <Icon
                icon="mdi:format-list-bulleted"
                width={14}
                height={14}
                className="me-1 text-indigo-500"
              />
              <span>
                {allServices.length} services
                {confirmedCount > 0 && ` • ${confirmedCount} confirmed`}
              </span>
            </div>
            <div className="d-flex gap-1">
              {b.BookingID && (
                <Link
                  to={`/booking-view/${b.BookingID}`}
                  className="btn btn-xs btn-light border-0 text-primary d-inline-flex align-items-center gap-1"
                >
                  <Icon icon="mdi:eye-outline" width={14} height={14} />
                  View
                </Link>
              )}
              {b.LeadId && b.BookingID && b.BookingTrackID && (
                <Link
                  to={`/book-service/${b.LeadId}/${b.BookingID}/${b.BookingTrackID}`}
                  className="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1"
                >
                  <Icon icon="mdi:pencil-outline" width={14} height={14} />
                  Services
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="mt-2 small text-muted">Loading service timeline board…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-3 small" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div
      className="service-timeline-board-wrapper"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <div
        className="d-flex align-items-start gap-3 flex-nowrap p-3 rounded-4"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 55%), radial-gradient(circle at bottom right, rgba(16,185,129,0.08), transparent 60%), #f3f4f6",
          boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
        }}
      >
        {/* Bookings (not confirmed) */}
        <div style={{ minWidth: 280 }} className="flex-shrink-0">
          <div
            className="px-3 py-2 rounded-top"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.45))",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold small text-white d-flex align-items-center gap-1">
                <Icon icon="mdi:clipboard-text-clock-outline" width={16} height={16} />
                Bookings (Not Confirmed)
              </span>
              <span className="badge bg-white text-primary small shadow-sm">
                {columns.bookingsNotConfirmed.length}
              </span>
            </div>
          </div>
          <div
            className="p-2 pb-3"
            style={{
              backgroundColor: "#f9fafb",
              minHeight: 160,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              border: "1px solid rgba(148,163,184,0.25)",
              borderTop: "none",
            }}
          >
            {columns.bookingsNotConfirmed.map(renderCard)}
            {columns.bookingsNotConfirmed.length === 0 && (
              <div className="text-muted small text-center py-3">
                No bookings in this stage.
              </div>
            )}
          </div>
        </div>

        {/* Customer Confirmation */}
        <div style={{ minWidth: 280 }} className="flex-shrink-0">
          <div
            className="px-3 py-2 rounded-top"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.45))",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold small text-slate-900 d-flex align-items-center gap-1">
                <Icon icon="mdi:account-check-outline" width={16} height={16} />
                Customer Confirmation
              </span>
              <span className="badge bg-white text-amber-600 small shadow-sm text-primary">
                {columns.customerConfirmation.length}
              </span>
            </div>
          </div>
          <div
            className="p-2 pb-3"
            style={{
              backgroundColor: "#fffbeb",
              minHeight: 160,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              border: "1px solid rgba(251,191,36,0.25)",
              borderTop: "none",
            }}
          >
            {columns.customerConfirmation.map(renderCard)}
            {columns.customerConfirmation.length === 0 && (
              <div className="text-muted small text-center py-3">
                No bookings in this stage.
              </div>
            )}
          </div>
        </div>

        {/* Service In Progress */}
        <div style={{ minWidth: 280 }} className="flex-shrink-0">
          <div
            className="px-3 py-2 rounded-top"
            style={{
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.45))",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold small text-slate-900 d-flex align-items-center gap-1">
                <Icon icon="mdi:account-wrench-outline" width={16} height={16} />
                Service In Progress
              </span>
              <span className="badge bg-white text-emerald-600 small shadow-sm text-primary">
                {columns.serviceInProgress.length}
              </span>
            </div>
          </div>
          <div
            className="p-2 pb-3"
            style={{
              backgroundColor: "#ecfdf3",
              minHeight: 160,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              border: "1px solid rgba(34,197,94,0.25)",
              borderTop: "none",
            }}
          >
            {columns.serviceInProgress.map(renderCard)}
            {columns.serviceInProgress.length === 0 && (
              <div className="text-muted small text-center py-3">
                No bookings in this stage.
              </div>
            )}
          </div>
        </div>

        {/* Payment & Booking Pending */}
        <div style={{ minWidth: 280 }} className="flex-shrink-0">
          <div
            className="px-3 py-2 rounded-top"
            style={{
              background:
                "linear-gradient(135deg, rgba(148,163,184,0.25), rgba(148,163,184,0.6))",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-semibold small text-slate-900 d-flex align-items-center gap-1">
                <Icon icon="mdi:cash-clock" width={16} height={16} />
                Payment & Booking Pending
              </span>
              <span className="badge bg-white text-slate-700 small shadow-sm text-primary">
                {columns.paymentBookingPending.length}
              </span>
            </div>
          </div>
          <div
            className="p-2 pb-3"
            style={{
              backgroundColor: "#f9fafb",
              minHeight: 160,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              border: "1px solid rgba(148,163,184,0.35)",
              borderTop: "none",
            }}
          >
            {columns.paymentBookingPending.map(renderCard)}
            {columns.paymentBookingPending.length === 0 && (
              <div className="text-muted small text-center py-3">
                No bookings in this stage.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTimelineBoard;

