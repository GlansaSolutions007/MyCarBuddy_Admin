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
    totalAssigned: 0,
    noFollowUpYet: 0,
    ringingButNotResponded: 0,
    busy: 0,
    notReachable: 0,
    switchedOff: 0,
    temporaryOutofService: 0,
    numberDoesNotExist: 0,
    dnd: 0,
    interested: 0,
    notInterested: 0,
    needMoreInfo: 0,
    convertedCustomer: 0,
    notConverted: 0,
    notHavingCar: 0,
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
      let url =
        employeeData.Is_Head === 1
          ? `${API_BASE}Leads/telecaller-headcount?headAssignId=${employeeData.Id}`
          : `${API_BASE}Leads/telecaller-headcount?empId=${employeeData.Id}`;

      const res = await axios.get(url);

      if (res.data && res.data.length > 0) {
        const data = res.data[0];
        setDashboardData({
          totalAssigned: data.TotalAssigned || 0,
          noFollowUpYet: data.NoFollowUpYet || 0,
          ringingButNotResponded: data.RingingButNotResponded || 0,
          busy: data.Busy || 0,
          notReachable: data.NotReachable || 0,
          switchedOff: data.SwitchedOff || 0,
          temporaryOutofService: data.TemporaryOutofService || 0,
          numberDoesNotExist: data.NumberDoesNotExist || 0,
          dnd: data.DND || 0,
          interested: data.Interested || 0,
          notInterested: data.NotInterested || 0,
          needMoreInfo: data.NeedMoreInfo || 0,
          convertedCustomer: data.ConvertedCustomer || 0,
          notConverted: data.NotConverted || 0,
          notHavingCar: data.NotHavingCar || 0,
        });
      }
    } catch (error) {
      console.error("Dashboard API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (statusName) => {
    const encodedStatus = encodeURIComponent(statusName);
    navigate(`/edit-bookings/${encodedStatus}`);
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
                  onClick={() => handleCardClick("Total Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.totalAssigned}</h6>
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
                  onClick={() => handleCardClick("Pending Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Pending Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.interested}</h6>
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

              {/* Card 2.1 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-3 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("Conformed Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Conformed Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.notInterested}</h6>
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

              {/* Card 3 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-3 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("Reached Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Reached Bookings
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.ringingButNotResponded}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:map-marker-check-outline"
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
                  className="card shadow-none border bg-gradient-start-4 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("Service Started Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Service Started Bookings
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.convertedCustomer}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="mdi:tools"
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5 */}
              <div className="col">
                <div
                  className="card shadow-none border bg-gradient-start-5 h-100"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleCardClick("Completed Bookings")}
                >
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Completed Bookings
                        </p>
                        <h6 className="mb-0">{dashboardData.noFollowUpYet}</h6>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorHeadDashboardLayer;
