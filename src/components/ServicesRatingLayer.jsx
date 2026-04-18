import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;
const employeeData = JSON.parse(localStorage.getItem("employeeData"));
const employeeId = employeeData?.Id;
const roleName = employeeData?.RoleName;

function ServicesRatingLayer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchFeedbacks = async () => {
    try {
      if (roleName === "Admin") {
        const res = await axios.get(`${API_BASE}Feedback`);
        setData(res.data);
      } else {
        const res = await axios.get(
          `${API_BASE}Feedback?EmployeeId=${employeeId}&RoleName=${encodeURIComponent(roleName)}`,
        );
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
      await axios.put(`${API_BASE}Feedback/update-feedback-approval`, {
        feedbackId: row.FeedbackID,
        is_Approve: status,
      });

      // ✅ Update UI instantly
      setData((prev) =>
        prev.map((item) =>
          item.FeedbackID === row.FeedbackID
            ? { ...item, Is_Approve: status }
            : item,
        ),
      );
    } catch (error) {
      console.error("Error updating approval:", error);
    }
  };

  const filteredData = data.filter((item) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      item.CustomerName?.toLowerCase().includes(search) ||
      item.CustomerPhone?.toLowerCase().includes(search) ||
      item.CustomerEmail?.toLowerCase().includes(search) ||
      item.BookingTrackID?.toLowerCase().includes(search) ||
      item.ServiceReview?.toLowerCase().includes(search);

    const matchesRating =
      (!minRating || item.ServiceRating >= parseFloat(minRating)) &&
      (!maxRating || item.ServiceRating <= parseFloat(maxRating));

    const feedbackDate = new Date(item.FeedbackCreatedAt);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end) {
      end.setHours(23, 59, 59, 999); // include full day
    }

    const matchesDate =
      (!start || feedbackDate >= start) && (!end || feedbackDate <= end);

    return matchesSearch && matchesRating && matchesDate;
  });

  const columns = [
    {
      name: "Booking ID",
      selector: (row) => (
        <Link to={`/booking-view/${row.BookingID}`} className="text-primary">
          {" "}
          {row.BookingTrackID}
        </Link>
      ),
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
      name: "Rating",
      // cell: (row) => (
      //   <span className="badge bg-success">{row.ServiceRating}</span>
      // ),
      selector: (row) => row.ServiceRating,
      wrap: true,
      sortable: true,
      width: "100px",
    },
    {
      name: "Review",
      selector: (row) => row.ServiceReview,
      wrap: true,
      width: "260px",
      center: true,
    },
    {
      name: "Date & Time",
      selector: (row) => new Date(row.FeedbackCreatedAt).toLocaleString(),
      sortable: true,
      width: "180px",
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${row.Is_Approve ? "bg-success" : "bg-secondary"}`}
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
      <div className="card p-3 mb-3">
        <div
          className="d-flex align-items-center gap-2"
          style={{ overflowX: "auto", whiteSpace: "nowrap" }}
        >
          {/* 🔍 Search */}
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "350px", flexShrink: 0 }}
          />

          {/* 📅 Date */}
          <label htmlFor="startDate" className="form-label">
            From Date
          </label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: "170px", flexShrink: 0 }}
          />
          <label htmlFor="endDate" className="form-label">
            To Date
          </label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "170px", flexShrink: 0 }}
          />

          {/* ⭐ Rating */}
          <input
            type="number"
            className="form-control"
            placeholder="Min Rating"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{ width: "150px", flexShrink: 0 }}
          />
          <input
            type="number"
            className="form-control"
            placeholder="Max Rating"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            style={{ width: "150px", flexShrink: 0 }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
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
