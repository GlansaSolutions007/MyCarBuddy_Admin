import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const TechnicianLeaveEdit = () => {
  const { LeaveID } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [leave, setLeave] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Uncomment below line for actual API
    fetchLeave();

    // Dummy fallback data

    const dummyBookings = [
      {
        BookingID: "B101",
        ScheduledDate: "2025-07-21",
        Status: "Assigned",
      },
      {
        BookingID: "B102",
        ScheduledDate: "2025-07-22",
        Status: "Scheduled",
      },
    ];

    setBookings(dummyBookings);
  }, []);

  const fetchLeave = async () => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}LeaveRequest/leaveid?leaveid=${LeaveID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data[0];
    setLeave(data);
    // fetchIncomingBookings(data.TechnicianID, data.LeaveFrom, data.LeaveTo);
  };

  const fetchIncomingBookings = async (techId, fromDate, toDate) => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}Booking/ByTechnician/${techId}?from=${fromDate}&to=${toDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBookings(res.data.data);
  };

  const handleUpdateStatus = async (status) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    showDenyButton: false,
    showCancelButton: true,
    confirmButtonText: "Yes",
  });

  if (result.isConfirmed) {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_APIURL}LeaveRequest?leaveId=${LeaveID}&status=${status}`,
        {}, // empty body
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await Swal.fire({
        title: res.data.message || "Leave updated successfully",
        confirmButtonText: "OK",
      });

      navigate("/leave-list");

    } catch (error) {
      console.error("Error updating leave status:", error);
      Swal.fire("Error", "Something went wrong while updating leave status.", "error");
    }
  }
};


  if (!leave) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container mt-4">

      <div className="card p-3 mb-3">
        <p><strong>Technician:</strong> {leave.TechnicianName}</p>
        <p><strong>From:</strong> {leave.FromDate}</p>
        <p><strong>To:</strong> {leave.ToDate}</p>
        <p><strong>Reason:</strong> {leave.LeaveReason}</p>
        <p><strong>Status:</strong> {leave.Status == 0 || leave.Status == null ? "Pending" : (
          leave.Status == 1 ? "Approved" : "Rejected"
        )}</p>

        <div className="mt-3">
          {/* {leave.Status === "Pending" && ( */}
            <>
              <button className="btn btn-success px-3 py-2 me-3" onClick={() => handleUpdateStatus("1")}>Approve</button>
              <button className="btn btn-danger px-3 py-2" onClick={() => handleUpdateStatus("2")}>Reject</button>
            </>
 
        </div>
      </div>

      <h6 className="fw-semibold mb-0">Incoming Bookings During Leave</h6>
      {bookings.length === 0 ? (
        <p>No bookings during this period</p>
      ) : (
        <ul className="list-group">
          {bookings.map(b => (
            <li key={b.BookingID} className="list-group-item">
              <strong>Booking #{b.BookingID}</strong> – {b.ScheduledDate} <span className="badge bg-info">{b.Status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TechnicianLeaveEdit;
