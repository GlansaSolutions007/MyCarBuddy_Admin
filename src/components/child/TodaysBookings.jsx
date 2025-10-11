import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const BaseURL = import.meta.env.VITE_APIURL;
const token = localStorage.getItem("token");

const TodaysBookings = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    try {
      const res = await axios.get(
        `${BaseURL}Reports?fromDate=${today}&toDate=${today}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // 👇 Use the correct key
      setData(res.data.bookings || []);
    } catch (err) {
      console.error("Error fetching todays bookings:", err);
    }
  };

  return (
    <div className="col-xxl-4 col-md-4">
      <div className="card h-100">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg mb-0">Todays Booking</h6>
            <Link
              to="/today-booking"
              className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
            >
              View All
              <iconify-icon icon="solar:alt-arrow-right-linear" className="icon" />
            </Link>
          </div>
        </div>
        <div className="card-body p-24">
          <div className="table-responsive scroll-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">Tech ID</th>
                  <th scope="col">Tech Name</th>
                  <th scope="col">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.filter(item => item.techID !== 0).length > 0 ? (
                  data.filter(item => item.techID !== 0).map((item, index) => (
                    <tr key={item.techID || index}>
                      <td>
                        <Link to={`/view-technician/${item.techID}`}>
                          <span className="text-primary-500">{item.techID}</span>
                        </Link>
                      </td>
                      <td>
                        <span className="text-secondary-light">{item.techFullName}</span>
                      </td>
                      <td>
                        <span className="text-secondary-light">{item.bookingCount}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No todays bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysBookings;
