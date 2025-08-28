import React , { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const UnitCountSeven = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}Dashboard`)
      .then((res) => setData(res.data[0]))
      .catch((err) => console.log(err));
  }, []);
  return (
    <div className='col-12'>
      {/* Welcome and Today's Task */}
        <div className='row gy-4'>
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
                      <div className="text-lg font-semibold text-primary-foreground">{data.TodayBookings || 0}</div>
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

      <div className='card radius-12 col-md-8'>
        <div className='card-body p-16'>
          <div className='row gy-4'>
          
            
            {/* <div className='col-xxl-3 col-xl-4 col-sm-6'>
              <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-1 left-line line-bg-primary position-relative overflow-hidden'>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                  <div>
                    <span className='mb-2 fw-medium text-secondary-light text-md'>
                      Gross Sales
                    </span>
                    <h6 className='fw-semibold mb-1'>$40,000</h6>
                  </div>
                  <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-primary-100 text-primary-600'>
                    <i className='ri-shopping-cart-fill' />
                  </span>
                </div>
                <p className='text-sm mb-0'>
                  <span className='bg-success-focus px-1 rounded-2 fw-medium text-success-main text-sm'>
                    <i className='ri-arrow-right-up-line' /> 80%
                  </span>{" "}
                  From last month{" "}
                </p>
              </div>
            </div> */}
            <div className='col-xxl-4 col-xl-4 col-sm-6'>
              <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-2 left-line line-bg-lilac position-relative overflow-hidden'>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                  <div>
                    <span className='mb-2 fw-medium text-secondary-light text-md'>
                      Total Booking
                    </span>
                    <h6 className='fw-semibold mb-1'>{data.TotalBookings || 0}</h6>
                  </div>
                  <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-lilac-200 text-lilac-600'>
                    <i className='ri-handbag-fill' />
                  </span>
                </div>
                {/* <p className='text-sm mb-0'>
                  <span className='bg-success-focus px-1 rounded-2 fw-medium text-success-main text-sm'>
                    <i className='ri-arrow-right-up-line' /> 95%
                  </span>{" "}
                  From last month{" "}
                </p> */}
              </div>
            </div>
            <div className='col-xxl-4 col-xl-4 col-sm-6'>
              <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-3 left-line line-bg-success position-relative overflow-hidden'>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                  <div>
                    <span className='mb-2 fw-medium text-secondary-light text-md'>
                      Upcoming Booking
                    </span>
                    <h6 className='fw-semibold mb-1'>{data.UpcomingBookings || 0}</h6>
                  </div>
                  <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-success-200 text-success-600'>
                    <i className='ri-shopping-cart-fill' />
                  </span>
                </div>
                {/* <p className='text-sm mb-0'>
                  <span className='bg-danger-focus px-1 rounded-2 fw-medium text-danger-main text-sm'>
                    <i className='ri-arrow-right-down-line' /> 30%
                  </span>{" "}
                  From last month{" "}
                </p> */}
              </div>
            </div>
            <div className='col-xxl-4 col-xl-4 col-sm-6'>
              <div className='px-20 py-16 shadow-none radius-8 h-100 gradient-deep-4 left-line line-bg-warning position-relative overflow-hidden'>
                <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                  <div>
                    <span className='mb-2 fw-medium text-secondary-light text-md'>
                      Active Booking
                    </span>
                    <h6 className='fw-semibold mb-1'>{data.ActiveBookings || 0}</h6>
                  </div>
                  <span className='w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl mb-12 bg-warning-focus text-warning-600'>
                    <i className='ri-shopping-cart-fill' />
                  </span>
                </div>
                {/* <p className='text-sm mb-0'>
                  <span className='bg-success-focus px-1 rounded-2 fw-medium text-success-main text-sm'>
                    <i className='ri-arrow-right-up-line' /> 60%
                  </span>{" "}
                  From last month{" "}
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default UnitCountSeven;
