import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
const API_BASE = import.meta.env.VITE_APIURL;

const DealerDashboardLayer = () => {
 const [dashboardData, setDashboardData] = useState({
  totalServices: 0,
  acceptedBookings: 0,
  rejectedBookings: 0,
  ongoingBookings: 0,
  todaysVehiclesHandover: 0,
  totalAmount: 0,
  receivedPayment: 0,
  balancePayment: 0,
  comletedBookings: 0,
});
const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("userId")
  
  // Format currency
  const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

  // 🔹 API integration
  useEffect(() => {
  if (userId) {
    fetchDashboardData();
  }
}, [userId]);

  const fetchDashboardData = async () => {

    try {
       setLoading(true);
      const res = await axios.get(
        `${API_BASE}Dealer/GetDealerDashboardSummary?DealerID=${userId}`,
      );
      const data = res.data;
      setDashboardData({
        totalServices: data.TotalServices,
        acceptedBookings: data.AcceptedBookings,
        rejectedBookings: data.RejectedBookings,
        ongoingBookings: data.OngoingBookings,
        todaysVehiclesHandover: data.TodaysVehiclesHandover,
        totalAmount: data.TotalPrice, // Total Amount
        receivedPayment: data.PaidAmount, // Received Payment
        balancePayment: data.BalanceAmount, // Balance Payment
        comletedBookings: data.CompletedBookings,
      });

    } 
    catch (error) {
      console.error("Dashboard API error:", error);
    } finally {
    setLoading(false);
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
                    <div className=" text-2xl font-semibold text-primary-foreground">
                      Welcome {localStorage.getItem("name")}!
                    </div>
                    {/* <div className="card col-md-6">
                      <div className=" py-2 px-3 ">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-primary-foreground/80">
                            Todays Pending
                          </div>
                          <div className="text-lg font-semibold text-primary-foreground">
                            {dashboardData.todaysVehiclesHandover}
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Character Image */}
                  <div className="position-relative text-end">
                    <img
                      alt="user"
                      loading="lazy"
                      width="80"
                      height="201"
                      decoding="async"
                      className="w-full h-full object-cover"
                      src="/assets/images/admin.webp"
                      style={{ color: "transparent" }}
                    />
                  </div>
                </div>
              </div>
            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4 mt-2">
             
              {/* Total Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Services
                        </p>
                        <h6 className="mb-0">{dashboardData.totalServices}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:calendar-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accepted Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Accepted Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.acceptedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejected Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Rejected Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.rejectedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-danger-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:close-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Completed Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Completed Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.comletedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ongoing Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Ongoing Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.ongoingBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:clock-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Vehicles to be Handed Over */}
              {/* <div className="col">
                <div className="card shadow-none border bg-gradient-start-5 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Vehicles to be Handed Over Today
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.todaysVehiclesHandover}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                           icon="solar:car-bold"
                          className="text-dark text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Total Amount */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Amount
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.totalAmount)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:wallet-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Received Payment */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Received Payment
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.receivedPayment)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:card-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Payment */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Balance Payment
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.balancePayment)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:bill-list-bold"
                          className="text-white text-2xl mb-0"
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

export default DealerDashboardLayer;
