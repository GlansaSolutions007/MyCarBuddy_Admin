import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const SupportDashboardLayer = () => {
  const storedEmployeeData = localStorage.getItem("employeeData");
  const employeeData = storedEmployeeData ? JSON.parse(storedEmployeeData) : null;

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
    notHavingCar: 0
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
      let url = employeeData.Is_Head === 1 
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
          notHavingCar: data.NotHavingCar || 0
        });
      }
    } catch (error) {
      console.error("Dashboard API error:", error);
    } finally {
      setLoading(false);
    }
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
                  <img alt="user" width="80" height="201" className="w-full h-full object-cover" src="/assets/images/admin.webp" />
                </div>
              </div>
            </div>

            {/* Change row-cols-lg-3 to row-cols-lg-4 for 4 cards in one line */}
            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4 mt-2">
              
              {/* Card 1 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Total Assigned Leads</p>
                      <h6 className="mb-0">{dashboardData.totalAssigned}</h6></div>
                      <div className="w-50-px h-50-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:users-group-rounded-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Interested</p>
                      <h6 className="mb-0">{dashboardData.interested}</h6></div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:heart-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">No Response</p>
                      <h6 className="mb-0">{dashboardData.ringingButNotResponded}</h6></div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:phone-calling-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Converted</p>
                      <h6 className="mb-0">{dashboardData.convertedCustomer}</h6></div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:medal-ribbon-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-5 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">No Follow Up</p>
                      <h6 className="mb-0">{dashboardData.noFollowUpYet}</h6></div>
                      <div className="w-50-px h-50-px bg-orange rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:calendar-minimalistic-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Busy</p>
                      <h6 className="mb-0">{dashboardData.busy}</h6></div>
                      <div className="w-50-px h-50-px bg-secondary rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:minus-circle-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 7 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Need More Info</p>
                      <h6 className="mb-0">{dashboardData.needMoreInfo}</h6></div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:info-circle-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 8 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">DND</p>
                      <h6 className="mb-0">{dashboardData.dnd}</h6></div>
                      <div className="w-50-px h-50-px bg-danger-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:forbidden-circle-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 9 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Not Converted</p>
                      <h6 className="mb-0">{dashboardData.notConverted}</h6></div>
                      <div className="w-50-px h-50-px bg-neutral-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:user-cross-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 10 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-5 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Out of Service</p>
                      <h6 className="mb-0">{dashboardData.temporaryOutofService}</h6></div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:settings-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 11 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">Invalid Number</p>
                      <h6 className="mb-0">{dashboardData.numberDoesNotExist}</h6></div>
                      <div className="w-50-px h-50-px bg-danger-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:shield-cross-bold" className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 12 */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div><p className="fw-medium text-primary-light mb-1">No Car</p>
                      <h6 className="mb-0">{dashboardData.notHavingCar}</h6></div>
                      <div className="w-50-px h-50-px bg-danger rounded-circle d-flex justify-content-center align-items-center">
                        <Icon icon="solar:user-minus-bold" className="text-white text-2xl" />
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

export default SupportDashboardLayer;