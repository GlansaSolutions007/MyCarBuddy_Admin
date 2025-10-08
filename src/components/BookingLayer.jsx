import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const BookingLayer = () => {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTechnicians();
    fetchBookings();
  }, []);

  // 15 sec call to fetch bookings
  useEffect(() => {
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}Bookings`, {
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

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnicians(
        res.data.jsonResult.map((t) => ({
          value: t.TechID,
          label: `${t.TechnicianName} (${t.PhoneNumber})`,
        }))
      );
    } catch (error) {
      console.error("Failed to load technicians", error);
    }
  };

  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    try {
      const res = await axios.put(
        `${API_BASE}Bookings/assign-technician`,
        {
          TechID: selectedTechnician.value,
          BookingID: selectedBooking,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Technician assigned successfully",
        });
        fetchBookings();
        setAssignModalOpen(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to assign technician",
        });
      }
    } catch (error) {
      console.error("Failed to assign technician", error);
      if (error.response) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.message || "Failed to assign technician",
        });
      }
    }
  };

  const columns = [
    { name: "S.No", selector: (row) => row.BookingID },
    {
      name: "BookingID",
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
      name: "BookingPrice",
      selector: (row) =>
        `₹${row.TotalPrice + row.GSTAmount - row.CouponAmount}`,
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
    // { name: "Address", selector: (row) => row.FullAddress },
    {
      name: "Technician",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {row.TechFullName ? row.TechFullName : "Not Assigned"}
          </span>
          <br />
          {row.TechPhoneNumber || ""}
        </>
      ),
    },
    {
      name: "Status",
      selector: (row) => (
        <span
          className={`badge ${
            row.BookingStatus.toLowerCase() === "pending"
              ? "bg-warning"
              : row.BookingStatus.toLowerCase() === "confirmed"
              ? "bg-success"
              : "bg-danger"
          }`}
        >
          {row.BookingStatus}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => {
        if (!row.BookingDate) return null;
        const bookingDate = new Date(row.BookingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFutureOrToday = bookingDate >= today;

        return (
          <div className="d-flex gap-2 align-items-center">
            <Link
              to={`/view-booking/${row.BookingID}`}
              className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="View"
            >
              <Icon icon="lucide:eye" />
            </Link>
            {isFutureOrToday &&
              row.BookingStatus.toLowerCase() == "pending" && (
                <Link
                  onClick={() => handleAssignClick(row.BookingID)}
                  className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  title="Assign"
                >
                  <Icon icon="mdi:account-cog-outline" />
                </Link>
              )}
          </div>
        );
      },
    },
  ];

  // Filter by search + date range + other filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.CustFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.CustPhoneNumber?.toLowerCase().includes(
        searchText.toLowerCase()
      ) ||
      booking.TechFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.TechPhoneNumber?.toLowerCase().includes(
        searchText.toLowerCase()
      ) ||
      booking.BookingTrackID?.toLowerCase().includes(searchText.toLowerCase());

    const bookingDate = new Date(booking.BookingDate);
    const matchesDate =
      (!startDate || bookingDate >= new Date(startDate)) &&
      (!endDate || bookingDate <= new Date(endDate));

    const price = booking.TotalPrice + booking.GSTAmount - booking.CouponAmount;
    const matchesPrice = (!minPrice || price >= parseFloat(minPrice)) &&
                         (!maxPrice || price <= parseFloat(maxPrice));

    const matchesStatus = status === 'all' || booking.BookingStatus.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesDate && matchesPrice && matchesStatus;
  });

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, "Bookings_Report.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Bookings Report", 14, 10);
    const tableColumn = [
      "BookingID",
      "Booking Date",
      "Customer Name",
      "Phone",
      "Price",
      "Status",
    ];
    const tableRows = filteredBookings.map((row) => [
      row.BookingTrackID,
      new Date(row.BookingDate).toLocaleDateString(),
      row.CustFullName,
      row.CustPhoneNumber,
      `₹${row.TotalPrice + row.GSTAmount - row.CouponAmount}`,
      row.BookingStatus,
    ]);
    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("Bookings_Report.pdf");
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary radius-8 px-14 py-6 text-sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon icon="tabler:filter" /> Filters
                </button>
                <button
                  className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={exportToExcel}
                >
                  <Icon icon="mdi:microsoft-excel" width="20" height="20" />
                </button>
              </div>
            </div>
            {showFilters && (
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <input
                  type="date"
                  className="form-control"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="date"
                  className="form-control"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ width: '160px' }}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ width: '160px' }}
                />
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setMinPrice("");
                    setMaxPrice("");
                    setStatus("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          <DataTable
            columns={columns}
            data={filteredBookings}
            pagination
            paginationPerPage={10} // default rows per page
            paginationRowsPerPageOptions={[
              10,
              25,
              50,
              100,
              filteredBookings.length,
            ]} // last option shows all
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Bookings available"
          />
        </div>
      </div>

      {/* Assign Technician Modal */}
      {assignModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000080" }}
        >
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Assign Technician</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAssignModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <Select
                  options={technicians}
                  value={selectedTechnician}
                  onChange={(val) => setSelectedTechnician(val)}
                  placeholder="Select Technician"
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignConfirm}
                  disabled={!selectedTechnician}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingLayer;
