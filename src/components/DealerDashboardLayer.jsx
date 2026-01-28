import { Icon } from "@iconify/react";

const DealerDashboardLayer = () => {
  // Dummy data - will be replaced with real API data later
  const dashboardData = {
    totalBookings: 245,
    acceptedBookings: 180,
    rejectedBookings: 25,
    ongoingBookings: 40,
    todaysVehiclesHandover: 8,
    totalAmount: 1250000,
    receivedPayment: 950000,
    balancePayment: 300000,
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4">
                 <div className='card radius-8 col-md-4 bg-none'>
          <div className="card-body dashboard-first-section radius-8">
            <div className="position-absolute">
              <div className=" text-2xl font-semibold text-primary-foreground">
                Welcome {localStorage.getItem("name")}!
              </div>
              <div className="card col-md-6">
                <div className=" py-2 px-3 ">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-primary-foreground/80">Today's Task</div>
                    <div className="text-lg font-semibold text-primary-foreground">
                       8
                        </div>
                  </div>
                </div>
              </div>
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
              {/* Total Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
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
                          icon="solar:calendar-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-success-main">
                        <Icon icon="bxs:up-arrow" className="text-xs" /> +15
                      </span>
                      This month
                    </p>
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
                          Accepted Bookings
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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-success-main">
                        <Icon icon="bxs:up-arrow" className="text-xs" /> +12
                      </span>
                      This month
                    </p>
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
                          Rejected Bookings
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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-danger-main">
                        <Icon icon="bxs:down-arrow" className="text-xs" /> -3
                      </span>
                      This month
                    </p>
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
                          Ongoing Bookings
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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-success-main">
                        <Icon icon="bxs:up-arrow" className="text-xs" /> +5
                      </span>
                      Active now
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's Vehicles to be Handed Over */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-5 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Today's Vehicles to be Handed Over
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.todaysVehiclesHandover}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:car-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-primary-600">
                        <Icon icon="solar:calendar-mark-bold" className="text-xs" />
                      </span>
                      Scheduled for today
                    </p>
                  </div>
                </div>
              </div>

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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-success-main">
                        <Icon icon="bxs:up-arrow" className="text-xs" />{" "}
                        {formatCurrency(150000)}
                      </span>
                      This month
                    </p>
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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-success-main">
                        <Icon icon="bxs:up-arrow" className="text-xs" />{" "}
                        {formatCurrency(120000)}
                      </span>
                      This month
                    </p>
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
                    <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1 text-warning">
                        <Icon icon="solar:clock-circle-bold" className="text-xs" />
                      </span>
                      Pending payment
                    </p>
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
