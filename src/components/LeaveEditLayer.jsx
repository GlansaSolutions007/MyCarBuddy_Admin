import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const TechnicianLeaveEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [leave, setLeave] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Uncomment below line for actual API
    // fetchLeave();

    // Dummy fallback data
    const dummyLeave = {
      LeaveID: id,
      TechnicianID: "T123",
      TechnicianName: "John Doe",
      LeaveFrom: "2025-07-20",
      LeaveTo: "2025-07-23",
      Reason: "Personal Work",
      Status: "Pending",
    };

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

    setLeave(dummyLeave);
    setBookings(dummyBookings);
  }, []);

  const fetchLeave = async () => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}TechnicianLeave/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data.data;
    setLeave(data);
    fetchIncomingBookings(data.TechnicianID, data.LeaveFrom, data.LeaveTo);
  };

  const fetchIncomingBookings = async (techId, fromDate, toDate) => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}Booking/ByTechnician/${techId}?from=${fromDate}&to=${toDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBookings(res.data.data);
  };

  const handleUpdateStatus = async (status) => {
    // Dummy alert without API
    Swal.fire("Success", `Leave ${status.toLowerCase()} successfully (dummy)`, "success");
    navigate("/technician-leave");

    // Uncomment for actual update call
    /*
    const res = await axios.put(`${import.meta.env.VITE_APIURL}TechnicianLeave/UpdateStatus`, {
      LeaveID: id,
      Status: status,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.status) {
      Swal.fire("Success", `Leave ${status.toLowerCase()} successfully`, "success");
      navigate("/technician-leave");
    } else {
      Swal.fire("Error", res.data.message || "Update failed", "error");
    }
    */
  };

  if (!leave) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container mt-4">

      <div className="card p-3 mb-3">
        <p><strong>Technician:</strong> {leave.TechnicianName}</p>
        <p><strong>From:</strong> {leave.LeaveFrom}</p>
        <p><strong>To:</strong> {leave.LeaveTo}</p>
        <p><strong>Reason:</strong> {leave.Reason}</p>
        <p><strong>Status:</strong> {leave.Status}</p>

        <div className="mt-3">
          {leave.Status === "Pending" && (
            <>
              <button className="btn btn-success me-2" onClick={() => handleUpdateStatus("Approved")}>Approve</button>
              <button className="btn btn-danger" onClick={() => handleUpdateStatus("Rejected")}>Reject</button>
            </>
          )}
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
