import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const employeeId = employeeData?.Id;
const roleName = employeeData?.RoleName;

function ServicesRatingLayer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
        if (roleName === "Admin") {
          const res = await axios.get(`${API_BASE}Feedback`);
          setData(res.data);
        } else {
          const res = await axios.get(`${API_BASE}Feedback?EmployeeId=${employeeId}&RoleName=${encodeURIComponent(roleName)}`);
          setData(res.data);
        }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // 🔁 Update approval status
  const handleApproval = async (row, status) => {
    try {
      await axios.put(`${API_BASE}/Feedback/update-feedback-approval`, {
        feedbackId: row.FeedbackID,
        is_Approve: status,
      });

      // ✅ Update UI instantly
      setData((prev) =>
        prev.map((item) =>
          item.FeedbackID === row.FeedbackID
            ? { ...item, Is_Approve: status }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating approval:", error);
    }
  };

  const columns = [
  {
    name: "Booking ID",
    selector: (row) => row.BookingTrackID,
    sortable: true,
    width: "160px",
  },
  {
    name: "Customer Name",
    selector: (row) => row.CustomerName,
    sortable: true,
    width: "180px",
  },
  {
    name: "Phone",
    selector: (row) => row.CustomerPhone,
    width: "140px",
  },
  {
    name: "Email",
    selector: (row) => row.CustomerEmail,
    width: "220px",
  },
  {
    name: "Review",
    selector: (row) => row.ServiceReview,
    wrap: true,
    width: "260px",
    center: true,
  },
  {
    name: "Stars",
    cell: (row) => (
      <span className="badge bg-success">{row.ServiceRating}</span>
    ),
    sortable: true,
    width: "100px",
  },
  {
    name: "Date",
    selector: (row) =>
      new Date(row.FeedbackCreatedAt).toLocaleString(),
    sortable: true,
    width: "180px",
  },
  {
    name: "Status",
    cell: (row) => (
      <span
        className={`badge ${
          row.Is_Approve ? "bg-success" : "bg-secondary"
        }`}
      >
        {row.Is_Approve ? "Approved" : "Unapproved"}
      </span>
    ),
    width: "140px",
  },
  {
    name: "Actions",
    cell: (row) =>
      row.Is_Approve ? (
        <button
          className="btn btn-sm btn-warning-600"
          onClick={() => handleApproval(row, false)}
        >
          Unapprove
        </button>
      ) : (
        <button
          className="btn btn-sm btn-primary-600"
          onClick={() => handleApproval(row, true)}
        >
          Approve
        </button>
      ),
    width: "150px",
  },
];

  return (
    <div className="mt-6">

      <DataTable
        columns={columns}
        data={data}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        noDataComponent="No feedback available"
      />
    </div>
  );
}

export default ServicesRatingLayer;