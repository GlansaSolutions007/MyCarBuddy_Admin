import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const RefundLayer = () => {
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
        <Link to={`/view-booking/${row.BookingID}`} className="text-primary">
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
      selector: (row) => {
        const paymentStatus = row.PaymentStatus || "Pending";
        let displayText = paymentStatus;
        if (paymentStatus.toLowerCase() === "success") displayText = "Paid";

        return (
          <span
            className={`badge ${displayText.toLowerCase() === "paid"
              ? "bg-success"
              : displayText.toLowerCase() === "pending"
                ? "bg-warning"
                : "bg-danger"
              }`}
          >
            {displayText}
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <Link
          to={`/view-booking/${row.BookingID}`}
          className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
          title="View"
        >
          <Icon icon="lucide:eye" />
        </Link>
      ),
    },
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
          <div className="card-header">
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "170px" }}
              />
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "170px" }}
              />
              <input
                type="number"
                className="form-control"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ width: "170px" }}
              />
              <input
                type="number"
                className="form-control"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: "170px" }}
              />
              <button
                className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                onClick={exportToExcel}
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
