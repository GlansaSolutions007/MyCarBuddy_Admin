import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const SupervisorHeadDashboardLayer = () => {
  const storedEmployeeData = localStorage.getItem("employeeData");
  const employeeData = storedEmployeeData
    ? JSON.parse(storedEmployeeData)
    : null;
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    todaysAssignedBookings: 0,
    ongoingBookings: 0,
    completedBookings: 0,
  });


  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employeeData && employeeData.Id) {
      fetchDashboardData();
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

  const handleCardClick = (statusName) => {
    const encodedStatus = encodeURIComponent(statusName);
    navigate(`/bookings/${encodedStatus}`);
  };

  return (
    <div className="row gy-3">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorHeadDashboardLayer;
