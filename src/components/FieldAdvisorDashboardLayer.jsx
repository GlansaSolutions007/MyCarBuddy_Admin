import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const FieldAdvisorDashboardLayer = () => {
  const [approvingBookingId, setApprovingBookingId] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    todaysAssignedBookings: 0,
    ongoingBookings: 0,
    completedBookings: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const [confirmedByCache, setConfirmedByCache] = useState({}); // bookingId -> confirmerName (optimistic after approve)
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [notConfirmedServices, setNotConfirmedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const navigate = useNavigate();

  const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    if (userId) {
      fetchFieldAdvisorData();
      fetchNotConfirmedServices();
    }
  }, [userId]);

  const fetchFieldAdvisorData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setBookingsLoading(true);
      const res = await axios.get(
        `${API_BASE}Bookings?employeeId=${userId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setBookings(list);
      setDisplayCount(10);

      const today = new Date().toISOString().split("T")[0];
      const isToday = (d) => {
        if (!d) return false;
        const dt = new Date(d);
        return dt.toISOString().split("T")[0] === today;
      };
      const isOngoing = (b) => {
        const s = (b?.BookingStatus ?? "").toString().toLowerCase();
        return ["confirmed", "reached", "service started", "in progress", "pending"].includes(s);
      };
      const isCompleted = (b) =>
        (b?.BookingStatus ?? "").toString().toLowerCase() === "completed";

      setDashboardData({
        totalBookings: list.length,
        todaysAssignedBookings: list.filter((b) => isToday(b.BookingDate || b.CreatedDate)).length,
        ongoingBookings: list.filter(isOngoing).length,
        completedBookings: list.filter(isCompleted).length,
      });
    } catch (error) {
      console.error("Field Advisor dashboard error:", error);
      setBookings([]);
      setDashboardData({ totalBookings: 0, todaysAssignedBookings: 0, ongoingBookings: 0, completedBookings: 0 });
    } finally {
      setLoading(false);
      setBookingsLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getCarDetails = (b) => {
    const reg = b?.VehicleDetails?.[0]?.RegistrationNumber?.trim();
    return reg || "—";
  };

  const getCustomerName = (b) =>
    b?.CustFullName ?? b?.CustomerName ?? b?.CustName ?? "—";

  // F.A. Confirm status: same logic as BookingViewLayer (addon-level IsCompleted_Confirmation + EmployeeName)
  const getBookingConfirmationStatus = (booking) => {
    const addons = [
      ...(booking?.BookingAddOns || []),
      ...(booking?.BookingsTempAddons || []),
    ];
    if (addons.length === 0) return { allConfirmed: false, confirmerName: null };
    const allConfirmed = addons.every(
      (a) => (a.IsCompleted_Confirmation ?? a.isCompleted_Confirmation) === 1
    );
    const firstConfirmed = addons.find(
      (a) => (a.IsCompleted_Confirmation ?? a.isCompleted_Confirmation) === 1
    );
    const confirmerName = firstConfirmed?.EmployeeName ?? firstConfirmed?.employeeName ?? null;
    return { allConfirmed, confirmerName };
  };

  const visibleBookings = bookings.slice(0, displayCount);
  const hasMore = displayCount < bookings.length;

  const handleScroll = useCallback(
    (e) => {
      const el = e.target;
      const bottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 80;
      if (bottom && hasMore && !bookingsLoading) {
        setDisplayCount((c) => Math.min(c + 10, bookings.length));
      }
    },
    [hasMore, bookingsLoading, bookings.length]
  );

  const handleFieldAdvisorConfirm = async (booking) => {
    const bookingId = booking?.BookingID ?? booking?.BookingId;
    if (!bookingId) {
      Swal.fire({ icon: "warning", title: "Invalid data", text: "Booking ID missing." });
      return;
    }
    // employeeId from Bookings API response (EmployeeId) or fallback to logged-in user
    const employeeId = Number(booking?.EmployeeId ?? userId ?? (localStorage.getItem("userId") || 0));
    if (!employeeId) {
      Swal.fire({ icon: "warning", title: "Invalid data", text: "Employee ID missing." });
      return;
    }
    const addons = [
      ...(booking?.BookingAddOns || []),
      ...(booking?.BookingsTempAddons || []),
    ].filter((a) => (a.IsCompleted_Confirmation ?? a.isCompleted_Confirmation) !== 1);
    if (addons.length === 0) {
      Swal.fire({ icon: "info", title: "Done", text: "No addons pending confirmation." });
      return;
    }
    setApprovingBookingId(bookingId);
    try {
      let confirmed = 0;
      for (const addon of addons) {
        // addOnId from AddOnID (BookingAddOns) or Id (BookingsTempAddons)
        const addOnId = addon?.AddOnID ?? addon?.AddOnId ?? addon?.Id ?? addon?.id;
        if (!addOnId) continue;
        await axios.post(
          `${API_BASE}Supervisor/confirm`,
          { addOnId, employeeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        confirmed++;
      }
      Swal.fire({ icon: "success", title: "Confirmed", text: `${confirmed} service(s) confirmed successfully.` });
      const confirmerName = localStorage.getItem("name") || "Field Advisor";
      setConfirmedByCache((prev) => ({ ...prev, [bookingId]: confirmerName }));
      fetchFieldAdvisorData();
    } catch (err) {
      console.error("Supervisor/confirm error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "Failed to confirm.",
      });
    } finally {
      setApprovingBookingId(null);
    }
  };

  const fetchNotConfirmedServices = async () => {
    try {
      setServicesLoading(true);

      const employeeId = localStorage.getItem("userId");

      const res = await axios.get(
        `${API_BASE}Bookings/GetBookingServicesByRole?role=FieldAdvisor&employeeId=${employeeId}&type=notconfirm`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        setNotConfirmedServices(res.data.data || []);
      } else {
        setNotConfirmedServices([]);
      }
    } catch (error) {
      console.error("Not confirmed services error:", error);
      setNotConfirmedServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="card radius-8 col-md-12 bg-none">
              <div className="card-body dashboard-first-section radius-8">
                <div className="position-absolute">
                  <div className="text-2xl font-semibold text-primary-foreground">
                    Welcome {localStorage.getItem("name")}!
                  </div>
                </div>
                <div className="position-relative text-end">
                  <img
                    alt="user"
                    loading="lazy"
                    width="50"
                    // height="201"
                    decoding="async"
                    className="w-full h-full object-cover"
                    src="/assets/images/admin.webp"
                    style={{ color: "transparent" }}
                  />
                </div>
              </div>
            </div>

            {/* My Assigned Bookings – Field Advisor only */}
            {/* <div className="col-12 mt-4">
              <style>{`
                @keyframes dealer-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .dealer-pending-card { border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); }
                .dealer-pending-card .card-header-trend { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-bottom: 1px solid #dcfce7; color: #166534; }
                .dealer-table-trend { border-collapse: separate; border-spacing: 0; }
                .dealer-table-trend thead th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
                .dealer-table-trend tbody tr { background: #fff; transition: background 0.15s ease; }
                .dealer-table-trend tbody tr:hover { background: #f8fafc; }
                .dealer-table-trend tbody tr:nth-child(even) { background: #fafafa; }
                .dealer-table-trend tbody tr:nth-child(even):hover { background: #f1f5f9; }
                .dealer-table-trend tbody td { padding: 14px 16px; color: #334155; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; }
                .dealer-dot-pending { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; animation: dealer-blink 1.8s ease-in-out infinite; }
              `}</style>
              <div className="card dealer-pending-card border-0">
                <div className="card-header card-header-trend d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 px-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="dealer-dot-pending flex-shrink-0" />
                    <h6 className="mb-0 fw-bold">My Assigned Bookings</h6>
                    {bookings.length > 0 && (
                      <span className="badge bg-success bg-opacity-25 text-success ms-2">{bookings.length}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={fetchFieldAdvisorData}
                    disabled={bookingsLoading}
                  >
                    <Icon icon="solar:refresh-bold" className="me-1" />
                    Refresh
                  </button>
                </div>
                <div className="card-body p-0 bg-white">
                  {bookingsLoading ? (
                    <div className="text-center py-5 text-secondary">
                      <Icon icon="solar:loading-bold" className="fs-2" style={{ animation: "spin 1s linear infinite" }} />
                      <p className="mb-0 mt-2">Loading...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <Icon icon="solar:check-circle-bold" className="fs-1 text-success" />
                      <p className="mb-0 mt-2">No bookings assigned</p>
                    </div>
                  ) : (
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "420px", overflowY: "auto" }}
                      onScroll={handleScroll}
                    >
                      <table className="table dealer-table-trend align-middle mb-0">
                        <thead className="sticky-top" style={{ zIndex: 1, background: "#f8fafc" }}>
                          <tr>
                            <th className="text-nowrap text-center">Booking ID</th>
                            <th className="text-nowrap text-center">Date</th>
                            <th className="text-nowrap text-center">Customer</th>
                            <th className="text-nowrap text-center">Vehicle</th>
                            <th className="text-nowrap text-center">Status</th>
                            <th className="text-nowrap text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleBookings.map((row) => (
                            <tr key={row.BookingID}>
                              <td className="text-center">
                                <Link
                                  to={`/booking-view/${row.BookingID}`}
                                  className="text-primary text-decoration-none fw-semibold"
                                >
                                  {row.BookingTrackID || row.BookingID}
                                </Link>
                              </td>
                              <td className="text-center">{formatDate(row.BookingDate || row.CreatedDate)}</td>
                              <td className="text-center">{getCustomerName(row)}</td>
                              <td className="text-center">{getCarDetails(row)}</td>
                              <td className="text-center">
                                <span className="badge bg-warning bg-opacity-25 text-warning">
                                  {row.BookingStatus || "—"}
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="d-flex gap-2 justify-content-center align-items-center">
                                  {(() => {
                                    const bid = row.BookingID ?? row.BookingId;
                                    const fromCache = confirmedByCache[bid];
                                    const confirmation = getBookingConfirmationStatus(row);
                                    const allConfirmed = fromCache ? true : confirmation.allConfirmed;
                                    const confirmerName = fromCache ? fromCache : confirmation.confirmerName;

                                    // If there's a cached confirmer or all addons are confirmed, show confirmer badge
                                    if (allConfirmed) {
                                      return (
                                        <span className="badge bg-success px-3 py-1 rounded-pill">
                                          {confirmerName ?? "—"}
                                        </span>
                                      );
                                    }
                                    return (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleFieldAdvisorConfirm(row)}
                                        disabled={approvingBookingId === bid}
                                      >
                                        {approvingBookingId === bid ? (
                                          <Icon icon="solar:loading-bold" className="fs-6" style={{ animation: "spin 1s linear infinite" }} />
                                        ) : (
                                          <>
                                            <Icon icon="solar:check-circle-bold" className="me-1" />
                                            Approve
                                          </>
                                        )}
                                      </button>
                                    );
                                  })()}
                                  <Link
                                    to={`/booking-view/${row.BookingID}`}
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <Icon icon="solar:eye-bold" className="me-1" />
                                    View
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {hasMore && (
                        <div className="text-center py-3 border-top bg-light">
                          <span className="text-muted small">
                            Showing {visibleBookings.length} of {bookings.length} — scroll for more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div> */}

            {/* Stat cards – same layout as DealerDashboardLayer */}
            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4 mt-2">
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">Total Bookings</p>
                        <h6 className="mb-0">{dashboardData.totalBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:calendar-bold" className="text-white text-2xl mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">Today&apos;s Assigned</p>
                        <h6 className="mb-0">{dashboardData.todaysAssignedBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:check-circle-bold" className="text-white text-2xl mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">Ongoing Bookings</p>
                        <h6 className="mb-0">{dashboardData.ongoingBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:clock-circle-bold" className="text-white text-2xl mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">Completed Bookings</p>
                        <h6 className="mb-0">{dashboardData.completedBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:check-circle-bold" className="text-white text-2xl mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Customer Not Confirmed Services */}
      <div className="col-12 mt-4">
        <div className="card border radius-8">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold">Customer Not Confirmed Services</h5>

            <button
              className="btn btn-sm btn-outline-primary"
              onClick={fetchNotConfirmedServices}
            >
              <Icon icon="solar:refresh-bold" className="me-1" />
              Refresh
            </button>
          </div>

          <div className="card-body p-0">

            {servicesLoading ? (
              <div className="text-center py-4">
                <Icon icon="solar:loading-bold" className="fs-2"
                  style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : notConfirmedServices.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No pending services
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Service</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {notConfirmedServices.map((booking) =>
                      booking.CustomerNotConfirmedServices?.map((svc) => (
                        <tr key={svc.Id}>
                          <td>{booking.BookingTrackID}</td>

                          <td>{booking.CustFullName}</td>

                          <td>{booking.CustPhoneNumber}</td>

                          <td>{svc.ServiceName}</td>

                          <td>
                            <button
                              className="view-btn btn btn-sm d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                              onClick={() => navigate(`/booking-view/${booking.BookingID}`)}
                            >
                              <Icon icon="solar:eye-bold" width={14} />
                              View
                            </button>

                            <style>
                              {`
                              .view-btn {
                                background: #eef2ff;
                                color: #4f46e5;
                                border: 1px solid #c7d2fe;
                                font-size: 0.75rem;
                                font-weight: 500;
                                transition: all 0.25s ease;
                              }

                              .view-btn:hover {
                                background: #4f46e5;
                                color: #ffffff;
                                border-color: #4f46e5;
                                transform: translateY(-1px);
                                box-shadow: 0 3px 8px rgba(79,70,229,0.25);
                              }
                            `}
                            </style>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldAdvisorDashboardLayer;
