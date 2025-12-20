import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { usePermissions } from "../context/PermissionContext";

const RefundLayer = () => {
  const { hasPermission } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");


  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}Bookings?IsRefunded=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedBookings = res.data.sort(
        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
      );
      setBookings(sortedBookings);
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

  const columns = [
    {
      name: "Booking ID",
      selector: (row) => (
        <Link to={`/booking-view/${row.BookingID}`} className="text-primary">
          {row.BookingTrackID}
        </Link>
      ),
    },
    {
      name: "Booking Date",
      selector: (row) => {
        if (!row.BookingDate) return "";
        const date = new Date(row.BookingDate);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
    },
    {
      name: "Booking Price",
      selector: (row) =>
        `₹${(row.TotalPrice + row.GSTAmount - row.CouponAmount).toFixed(2)}`,
    },
    {
      name: "Refund Amount",
      selector: (row) => `₹${(row.RefundAmount ?? 0).toFixed(2)}`,
    },
    {
      name: "Customer Name",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustFullName}</span> <br />
          {row.CustPhoneNumber || ""}
        </>
      ),
    },
    {
      name: "Refund Status",
      selector: (row) => (
        <span className="fw-bold">{row.RefundStatus ?? "N/A"}</span>
      ),
    },
    {
      name: "Payment Status",
      cell: (row) => {
        const paymentStatus = row.PaymentStatus || "Pending";

        // Convert "Success" → "Paid"
        let status =
          paymentStatus.toLowerCase() === "success"
            ? "Paid"
            : paymentStatus;

        // Color mapping like sample
        const colorMap = {
          Paid: "#28A745",      // Green
          Pending: "#F57C00",   // Orange
          Failed: "#E34242",    // Red
          Cancelled: "#E34242", // Red
        };

        const color = colorMap[status] || "#6c757d"; // default grey

        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      width: "150px",
    },
    ...(hasPermission("bookingview_view")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <Link
          to={`/booking-view/${row.BookingID}`}
          className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
          title="View"
        >
          <Icon icon="lucide:eye" />
        </Link>
      ),
    },
    ]
    : []),
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.CustFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.CustPhoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.BookingTrackID?.toLowerCase().includes(searchText.toLowerCase());

    const bookingDate = new Date(booking.BookingDate);
    const matchesDate =
      (!startDate || bookingDate >= new Date(startDate)) &&
      (!endDate || bookingDate <= new Date(endDate));

    const price = booking.TotalPrice + booking.GSTAmount - booking.CouponAmount;
    const matchesPrice =
      (!minPrice || price >= parseFloat(minPrice)) &&
      (!maxPrice || price <= parseFloat(maxPrice));

    return matchesSearch && matchesDate && matchesPrice;
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Refunds");
    XLSX.writeFile(workbook, "Refunds_Report.xlsx");
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* 🔍 Search Input */}
              <form
                className="navbar-search flex-grow-1 flex-shrink-1 position-relative"
                style={{ minWidth: "180px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    minWidth: "200px",
                    width: "100%",
                  }}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* 📅 Date Filters */}
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />

              {/* 💰 Price Range */}
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ minWidth: "100px", flex: "1 1 100px" }}
              />
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ minWidth: "100px", flex: "1 1 100px" }}
              />

              {/* 📊 Excel Export Button */}
              <button
                className="d-inline-flex align-items-center justify-content-center rounded-circle border-0"
                onClick={exportToExcel}
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#e8f5e9",
                  color: "#2e7d32",
                  flex: "0 0 auto",
                }}
              >
                <Icon icon="mdi:microsoft-excel" width="20" height="20" />
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredBookings}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, filteredBookings.length]}
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Refunds available"
          />
        </div>
      </div>
    </div>
  );
};

export default RefundLayer;
