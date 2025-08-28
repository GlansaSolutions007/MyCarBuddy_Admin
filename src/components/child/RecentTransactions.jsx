import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";

const BaseURL = import.meta.env.VITE_APIURL; 
const token = localStorage.getItem("token");

const RecentTransactions = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchRecentPayments();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const res = await axios.get(`${BaseURL}Payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sort by PaymentDate (latest first) and take last 5
      const sorted = res.data
        .sort(
          (a, b) => new Date(b.PaymentDate) - new Date(a.PaymentDate)
        )
        .slice(0, 6);

      setPayments(sorted);
    } catch (err) {
      console.error("Error fetching recent payments:", err);
    }
  };

  return (
    <div className="col-xxl-6 col-md-6">
      <div className="card h-100">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg mb-0">Recent Transactions</h6>
            <Link
              to="/payments"
              className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
            >
              View All
              <iconify-icon
                icon="solar:alt-arrow-right-linear"
                className="icon"
              />
            </Link>
          </div>
        </div>
        <div className="card-body p-24">
          <div className="table-responsive scroll-sm">
            <table className="table bordered-table mb-0">
              <thead>
                <tr>
                  <th scope="col">SL</th>
                  <th scope="col">Date</th>
                  <th scope="col">Paid Amount</th>
                  <th scope="col">BookingID</th>
                  <th scope="col">Payment Type</th>
                 
                  {/* <th scope="col">Due Amount</th> */}
                  {/* <th scope="col">Payable Amount</th> */}
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map((p, index) => (
                    <tr key={p.PaymentID}>
                      <td>
                        <span className="text-secondary-light">
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary-light">
                          {new Date(p.PaymentDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary-light">
                          ₹{p.AmountPaid?.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <Link to={`/view-booking/${p.BookingID}`}><span className="text-secondary-light">
                          {p.BookingTrackID}
                        </span>
                        </Link>
                      </td>
                      <td>
                        <span className="text-secondary-light">
                          {p.PaymentMode}
                        </span>
                      </td>
                      
                     
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No recent transactions found.
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

export default RecentTransactions;
