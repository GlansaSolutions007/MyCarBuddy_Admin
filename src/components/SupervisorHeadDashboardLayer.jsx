import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const SupervisorHeadDashboardLayer = () => {
  const storedEmployeeData = localStorage.getItem("employeeData");
  const employeeData = storedEmployeeData ? JSON.parse(storedEmployeeData) : null;
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    todaysAssignedBookings: 0,
    ongoingBookings: 0,
    completedBookings: 0,
  });

  const [notConfirmedBookings, setNotConfirmedBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeData && employeeData.Id) {
      fetchDashboardData();
      fetchNotConfirmedBookings();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const supervisorHeadId = employeeData?.Id;
      const res = await axios.get(
        `${API_BASE}Supervisor/supervisor-booking-summary?supervisorHeadId=${supervisorHeadId}`
      );

      if (res.data && res.data.length > 0) {
        const data = res.data[0];
        setDashboardData({
          totalBookings: data.TotalBookings || 0,
          todaysAssignedBookings: data.TodaysAssignedBookings || 0,
          ongoingBookings: data.OngoingBookings || 0,
          completedBookings: data.CompletedBookings || 0,
        });
      }
    } catch (error) {
      console.error("Supervisor summary API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotConfirmedBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}Supervisor/GetNotConfirmedBookings`);
      setNotConfirmedBookings(res.data.Bookings || []);
    } catch (error) {
      console.error("Error fetching not confirmed bookings:", error);
    }
  };

  const handleConfirm = async (id) => {
    // Add your confirmation logic/API call here
    console.log("Confirming booking ID:", id);
    alert(`Confirming Booking ID: ${id}`);
  };

  const handleViewBooking = (bookingId) => {
    navigate(`/booking-view/${bookingId}`);
  };

  const handleCardClick = (statusName) => {
    const encodedStatus = encodeURIComponent(statusName);
    navigate(`/bookings/${encodedStatus}`);
  };

  const groupedBookings = Object.values(
    notConfirmedBookings.reduce((acc, booking) => {
      if (!acc[booking.BookingId]) {
        acc[booking.BookingId] = {
          ...booking,
          services: [],
        };
      }

      acc[booking.BookingId].services.push(booking.ServiceName);

      return acc;
    }, {})
  );

  return (
    <div className="row gy-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            {/* Header Section */}
            <div className="card radius-8 col-md-12 bg-none">
              <div className="card-body dashboard-first-section radius-8">
                <div className="position-absolute">
                  <div className="text-2xl font-semibold text-primary-foreground">
                    Welcome {employeeData?.Name || "User"}!
                  </div>
                </div>
                <div className="position-relative text-end">
                  <img
                    alt="user"
                    width="80"
                    height="201"
                    className="w-full h-full object-cover"
                    src="/assets/images/admin.webp"
                  />
                </div>
              </div>
            </div>

            {/* Change row-cols-lg-3 to row-cols-lg-4 for 4 cards in one line */}
            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4 mt-2">
              {/* Card 1 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-1 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.totalBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:clipboard-list-outline"
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-2 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Today’s Assigned Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.todaysAssignedBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:clock-outline"
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-3 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Ongoing Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.ongoingBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:check-circle-outline"
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Card 4 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-2 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Completed Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.completedBookings}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:clock-outline"
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Confirmation Section */}
            <div className="mt-5">

              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="mb-0 fw-bold text-primary-light">
                    Pending Confirmations
                  </h5>
                  <small className="text-muted">
                    Bookings waiting for confirmation
                  </small>
                </div>

                <span className="badge bg-danger-focus text-danger-main px-3 py-2 fs-12 fw-semibold">
                  {groupedBookings.length} Actions Required
                </span>
              </div>

              {/* Cards */}
              <div className="row gy-4">
                {notConfirmedBookings.length > 0 ? (
                  groupedBookings.map((booking) => (
                    <div className="col-xxl-4 col-lg-6 col-md-6" key={booking.Id}>

                      <div
                        className="card h-100 border-0 shadow-sm"
                        style={{
                          borderRadius: "14px",
                          transition: "all .3s ease",
                          backgroundColor: "#f0e9e9"
                        }}
                      >

                        {/* Card Header */}
                        <div className="card-header border-0 d-flex justify-content-between align-items-center px-3 py-2" style={{backgroundColor: "#cccccc"}} >
                          <span className="text-xs fw-semibold text-muted py-4 ">
                            Booking ID: {booking.BookingTrackID}
                          </span>

                          <span
                            className={`badge ${booking.ServiceType === "Package"
                              ? "bg-info-focus text-info-main"
                              : "bg-success-focus text-success-main"
                              }`}
                          >
                            {booking.ServiceType}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="card-body p-3">

                          {/* Service Name */}
                          <div className="mb-3">
                            <div className="dropdown">
                              <button
                                className="btn btn-light btn-sm w-100 d-flex justify-content-between align-items-center"
                                type="button"
                                data-bs-toggle="dropdown"
                                style={{
                                  padding: "4px 10px",   // reduces height
                                  fontSize: "13px",      // smaller text
                                  minHeight: "28px"      // optional fixed small height
                                }}
                              >
                                <span className="text-start">Services ({booking.services.length})</span>
                                <Icon icon="mdi:chevron-down" />
                              </button>

                              <ul className="dropdown-menu w-100 shadow-sm">
                                {booking.services.map((service, index) => (
                                  <li key={index}>
                                    <span
                                      className="dropdown-item text-sm text-wrap bg-light"
                                      style={{ whiteSpace: "normal", padding: "8px 16px" }}
                                    >
                                      <strong>{index + 1}.</strong> {service}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {/* Lead + Date */}
                          <div className="d-flex align-items-center gap-3 mb-3">

                            <span className="text-muted text-sm d-flex align-items-center gap-1">
                              <Icon icon="solar:user-bold" />
                              {booking.LeadId}
                            </span>

                            <span className="text-muted">•</span>

                            <span className="text-muted text-sm d-flex align-items-center gap-1">
                              <Icon icon="solar:calendar-date-bold" />
                              {new Date(booking.CreatedDate).toLocaleDateString()}
                            </span>

                          </div>

                          {/* Stats Box */}
                          {/* <div
                            className="d-flex justify-content-between bg-light rounded-3 p-1 mb-3"
                          >
                            <div className="text-center border-end flex-fill">
                              <p className="text-xs text-muted mb-1">
                                Total Services
                              </p>
                              <h6 className="fw-bold text-primary mb-0">
                                {booking.TotalServices}
                              </h6>
                            </div>

                            <div className="text-center flex-fill">
                              <p className="text-xs text-muted mb-1">
                                Assign Status
                              </p>
                              <h6 className="fw-bold text-warning mb-0">
                                {booking.AssignStatus}
                              </h6>
                            </div>
                          </div> */}

                          {/* Action Button */}
                          <button
                            className="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => handleViewBooking(booking.BookingId)}
                            style={{
                              borderRadius: "8px",
                              fontWeight: "700",
                              padding: "4px 10px",   // reduce height
                              fontSize: "13px",       // optional: smaller text
                              color: "black"
                            }}
                          >
                            <Icon icon="solar:check-circle-bold" />
                            View Booking
                          </button>

                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className="card border-0 shadow-sm text-center py-5">

                      <Icon
                        icon="solar:clipboard-check-broken"
                        className="text-6xl text-muted opacity-25"
                      />

                      <p className="mt-3 text-muted fw-medium">
                        No pending bookings to confirm
                      </p>

                    </div>
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

export default SupervisorHeadDashboardLayer;