import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { usePermissions } from "../context/PermissionContext";

const BookingLayer = () => {
  const { hasPermission } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("all");

  // New states for Supervisor Assignment
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [assignType, setAssignType] = useState("technician"); // 'technician' | 'supervisor'

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const roleId = localStorage.getItem("roleId");
  const userId = localStorage.getItem("userId"); // Assuming userId is available in localStorage

  useEffect(() => {
    fetchTechnicians();
    fetchBookings();
    fetchSupervisors(); // Fetch supervisors on component mount
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      let url = "";

      if (roleId === "8") {
        // If supervisor
        url = `${API_BASE}Supervisor/AssingedBookings?SupervisorID=${userId}`;
      } else {
        // For all other roles
        url = `${API_BASE}Bookings`;
      }

      const res = await axios.get(url, {
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

  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employees = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const supervisorList = employees
        .filter(
          (emp) =>
            emp.DepartmentName?.toLowerCase() === "supervisor" ||
            emp.RoleName?.toLowerCase() === "supervisor"
        )
        .map((emp) => ({
          value: emp.Id,
          label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
        }));

      setSupervisors(supervisorList);
    } catch (error) {
      console.error("Failed to fetch supervisors:", error);
      setSupervisors([]);
    }
  };

  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);
    setSelectedSupervisor(null); // Reset supervisor selection
    setAssignType("technician"); // Default to technician when opening modal

    const slots = booking.TimeSlot?.split(",").map((s) => s.trim()) || [];
    if (slots.length === 1) {
      setSelectedTimeSlot({ value: slots[0], label: slots[0] });
    } else {
      setSelectedTimeSlot(null);
    }

    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedTimeSlot) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a time slot",
      });
      return;
    }

    let payload;
    let apiUrl;
    let method;

    // Common payload format
    payload = {
      bookingID: selectedBooking.BookingID,
      techID:
        assignType === "technician"
          ? selectedTechnician?.value
          : selectedSupervisor?.value,
      assingedTimeSlot: selectedTimeSlot.value,
      role: assignType === "technician" ? "Technician" : "Supervisor",
    };

    // API URL and method differ based on assign type
    if (assignType === "technician") {
      if (!selectedTechnician) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a technician before assigning.",
        });
        return;
      }
      apiUrl = `${API_BASE}Bookings/assign-technician`;
      method = "put";
    } else {
      if (!selectedSupervisor) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a supervisor before assigning.",
        });
        return;
      }
      apiUrl = `${API_BASE}Bookings/assign-technician`;
      method = "put";
    }

    try {
      const res = await axios({
        method: method,
        url: apiUrl,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text:
            res.data.message ||
            `${assignType === "technician" ? "Technician" : "Supervisor"} assigned successfully`,
        });
        fetchBookings();
        setAssignModalOpen(false);
        setSelectedTechnician(null);
        setSelectedSupervisor(null);
        setAssignType("technician");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            res.data.message ||
            `Failed to assign ${assignType === "technician" ? "technician" : "supervisor"}`,
        });
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text:
          error.response?.data?.message ||
          `Error while assigning ${assignType}. Please check the console for details.`,
      });
    }
  };



  const getTimeSlotOptions = () => {
    if (!selectedBooking || !selectedBooking.TimeSlot) return [];
    return selectedBooking.TimeSlot.split(",").map((slot) => ({
      value: slot.trim(),
      label: slot.trim(),
    }));
  };

  const columns = [
    ...(hasPermission("bookingview_view")
    ? [
    {
      name: "Booking id",
      selector: (row) => (
        <Link to={`/booking-view/${row.BookingID}`} className="text-primary">
          {row.BookingTrackID}
        </Link>
      ),
      width: "150px",
    },
      ]
    : []),
    {
      name: "Booking date",
      selector: (row) => {
        if (!row.BookingDate) return "";
        const date = new Date(row.BookingDate);
        return `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
      width: "120px",
    },
    {
      name: "Time slot",
      selector: (row) => row.TimeSlot,
      width: "160px",
    },
    {
      name: "Booking price",
      selector: (row) =>
        `₹${(row.TotalPrice + row.GSTAmount - row.CouponAmount).toFixed(2)}`,
      width: "120px",
    },
    {
      name: "Customer name",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustFullName}</span> <br />
          {row.CustPhoneNumber || ""}
        </>
      ),
      width: "150px",
    },
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
      width: "150px",
    },
    {
      name: "Supervisor",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {row.SupervisorName ? row.SupervisorName : "Not Assigned"}
          </span>
          <br />
          {row.SupervisorPhoneNumber || ""}
        </>
      ),
      width: "150px",
    },
    {
      name: "Booking Status",
      cell: (row) => {
        let status = row?.BookingStatus ?? "-";
        if (!status || status === "-") status = "Not Assigned";

        // Define colors similar to Ticket Status
        const colorMap = {
          Pending: "#F57C00",        // Orange
          Confirmed: "#28A745",      // Green
          Cancelled: "#E34242",      // Red
          Completed: "#25878F",      // Teal-blue
          Rejected: "#E34242",       // Red
          "Not Assigned": "#BFBFBF", // Grey
        };

        const color = colorMap[status] || "#6c757d"; // Default muted grey

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
      wrap: true,
      width: "150px",
    },
    {
      name: "Payment Status",
      cell: (row) => {
        let paymentStatus = row?.PaymentStatus ?? "Pending";
        let displayText = paymentStatus;

        // Convert 'Success' to 'Paid'
        if (paymentStatus.toLowerCase() === "success") {
          displayText = "Paid";
        }

        // Color mapping (consistent with your badge logic)
        const colorMap = {
          Paid: "#28A745",       // Green
          Pending: "#F7AE21",    // Yellow/Orange
          Failed: "#E34242",     // Red
          Refunded: "#25878F",   // Teal-blue
          "Not Paid": "#BFBFBF", // Grey
        };

        const color = colorMap[displayText] || "#6c757d"; // Default muted grey

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
            <span style={{ color }}>{displayText}</span>
          </span>
        );
      },
      wrap: true,
      width: "150px",
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
              to={`/booking-view/${row.BookingID}`}
              className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="View"
            >
              <Icon icon="lucide:eye" />
            </Link>
            {isFutureOrToday &&
              row.BookingStatus.toLowerCase() === "pending" &&
              (
                row.SupervisorID === null ||
                row.SupervisorID === 0 ||
                (row.SupervisorID !== null && row.SupervisorID !== 0 && roleId === "8")
              ) && (
                <Link
                  onClick={() => handleAssignClick(row)}
                  className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  title="Assign"
                >
                  <Icon icon="mdi:account-cog-outline" />
                </Link>
              )
            }

          </div>
        );
      },
      width: "100px",
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.CustFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.CustPhoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.TechFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.TechPhoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.BookingTrackID?.toLowerCase().includes(searchText.toLowerCase());

    const bookingDate = new Date(booking.BookingDate);
    const matchesDate =
      (!startDate || bookingDate >= new Date(startDate)) &&
      (!endDate || bookingDate <= new Date(endDate));

    const price = booking.TotalPrice + booking.GSTAmount - booking.CouponAmount;
    const matchesPrice =
      (!minPrice || price >= parseFloat(minPrice)) &&
      (!maxPrice || price <= parseFloat(maxPrice));

    const matchesStatus =
      status === "all" || booking.BookingStatus.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesDate && matchesPrice && matchesStatus;
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, "Bookings_Report.xlsx");
  };

  // Custom styles for react-select to make single slot look consistent
  const singleSlotStyle = {
    control: (base) => ({
      ...base,
      backgroundColor: "#f5f5f5",
      cursor: "not-allowed",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#495057",
    }),
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* Search */}
              <form className="navbar-search flex-grow-1 flex-shrink-1" style={{ minWidth: "180px" }}>
                <div className="position-relative">
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
                </div>
              </form>

              {/* Dates */}
              <input
                type="date"
                className="form-control flex-shrink-0"
                placeholder="DD-MM-YYYY"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                className="form-control flex-shrink-0"
                placeholder="DD-MM-YYYY"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />

              {/* Price Range */}
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

              {/* Status */}
              <select
                className="form-select flex-shrink-0"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ minWidth: "120px", flex: "1 1 120px" }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
                <option value="Faild">Faild</option>
              </select>

              {/* Excel Button */}
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
            noDataComponent="No Bookings available"
          />
        </div>
      </div>

      {/* Assign Technician/Supervisor Modal */}
      {assignModalOpen && (
        <div className="modal fade show d-block" style={{ background: "#00000080" }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "500px", width: "90%" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Assign</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssignType("technician");
                    setSelectedTechnician(null);
                    setSelectedSupervisor(null);
                  }}
                />
              </div>

              <div className="modal-body">
                {/* Assignment Type Checkboxes */}
                <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                  {/* Technician Checkbox: always show */}
                  <div className="form-check d-flex align-items-center gap-2 m-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="assignTech"
                      checked={assignType === "technician"}
                      onChange={() => setAssignType("technician")}
                      style={{ width: "18px", height: "18px", margin: 0 }}
                      disabled={false} // always enabled
                    />
                    <label htmlFor="assignTech" className="form-check-label mb-0">
                      Technician
                    </label>
                  </div>

                  {/* Supervisor Checkbox: show only if roleId is NOT 8 */}
                  {roleId !== "8" && (
                    <div className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="assignSup"
                        checked={assignType === "supervisor"}
                        onChange={() => setAssignType("supervisor")}
                        style={{ width: "18px", height: "18px", margin: 0 }}
                      />
                      <label htmlFor="assignSup" className="form-check-label mb-0">
                        Supervisor
                      </label>
                    </div>
                  )}
                </div>

                {/* Time Slot Selection */}
                <div className="mb-3">
                  {selectedBooking?.TimeSlot?.split(",").length === 1 ? (
                    <Select
                      value={selectedTimeSlot}
                      isDisabled
                      styles={singleSlotStyle}
                    />
                  ) : (
                    <Select
                      options={getTimeSlotOptions()}
                      value={selectedTimeSlot}
                      onChange={(val) => setSelectedTimeSlot(val)}
                      placeholder="Select TimeSlot"
                    />
                  )}
                </div>

                {/* Technician or Supervisor Selection based on assignType */}
                {assignType === "technician" ? (
                  <Select
                    options={technicians}
                    value={selectedTechnician}
                    onChange={(val) => setSelectedTechnician(val)}
                    placeholder="Select Technician"
                  />
                ) : (
                  <Select
                    options={supervisors}
                    value={selectedSupervisor}
                    onChange={(val) => setSelectedSupervisor(val)}
                    placeholder="Select Supervisor"
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssignType("technician");
                    setSelectedTechnician(null);
                    setSelectedSupervisor(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignConfirm}
                  disabled={
                    !selectedTimeSlot ||
                    (assignType === "technician" && !selectedTechnician) ||
                    (assignType === "supervisor" && !selectedSupervisor)
                  }
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