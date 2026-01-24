import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { usePermissions } from "../context/PermissionContext";

// Helper function to convert various time formats into 12-hour AM/PM format
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const raw = timeStr.toString().trim();

  // If already includes AM/PM, try to normalize spacing and return as-is
  if (/\b(AM|PM)\b/i.test(raw)) {
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3].toUpperCase();
      const hh = hour % 12 || 12;
      const mm = minute.toString().padStart(2, "0");
      return `${hh}:${mm} ${period}`;
    }
    return raw.replace(/am/i, "AM").replace(/pm/i, "PM");
  }

  // Extract HH and MM from formats like HH:MM or HH:MM:SS or even just HH
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?/);
  if (!match) return raw;
  const hour24 = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return raw;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

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
  const [timeSlots, setTimeSlots] = useState([]);

  // New states for Supervisor Assignment
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [assignType, setAssignType] = useState("technician"); // 'technician' | 'supervisor' | 'fieldAdvisor'

  // States for Field Advisor Assignment
  const [fieldAdvisors, setFieldAdvisors] = useState([]);
  const [selectedFieldAdvisor, setSelectedFieldAdvisor] = useState(null);

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const roleId = localStorage.getItem("roleId");
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const roleName = employeeData?.RoleName;
  const userId = localStorage.getItem("userId"); // Assuming userId is available in localStorage

  useEffect(() => {
    fetchTechnicians();
    fetchBookings();
    fetchSupervisors(); // Fetch supervisors on component mount
    fetchFieldAdvisors(); // Fetch field advisors on component mount
    getTimeSlotOptions(); // Fetch time slots on component mount
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
      } else if (roleId === "3") {
        url = `${API_BASE}Bookings?type=${role}&dealerid=${userId}`;
       } else if (roleId === "9") {
        url = `${API_BASE}Bookings?employeeId=${userId}`; 
      } else {
        // For all other roles
        url = `${API_BASE}Bookings`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sortedBookings = res.data.sort(
        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate),
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
        })),
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
        .filter((emp) => {
          const department = emp.DepartmentName?.trim().toLowerCase();
          const role = emp.RoleName?.trim().toLowerCase();
          return (
            department === "supervisor" &&
            (role === "supervisor" || role === "supervisor head")
          );
        })
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

  const fetchFieldAdvisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employees = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const fieldAdvisorList = employees
        .filter(
          (emp) =>
            emp.DepartmentName?.toLowerCase() === "field advisor" ||
            emp.RoleName?.toLowerCase() === "field advisor",
        )
        .map((emp) => ({
          value: emp.Id,
          label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
        }));

      setFieldAdvisors(fieldAdvisorList);
    } catch (error) {
      console.error("Failed to fetch field advisors:", error);
      setFieldAdvisors([]);
    }
  };

  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);
    setSelectedSupervisor(null); // Reset supervisor selection
    setSelectedFieldAdvisor(null); // Reset field advisor selection
    setAssignType("technician"); // Default to technician when opening modal

    const slots = booking.TimeSlot?.split(",").map((s) => s.trim()) || [];
    if (slots.length === 1) {
      const slot = slots[0];
      const [start, end] = slot.split(" - ");
      setSelectedTimeSlot({
        value: slot,
        label: `${formatTime(start)} - ${formatTime(end)}`,
      });
    } else {
      setSelectedTimeSlot(null);
    }
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    // Time slot validation only for technician and supervisor
    if (assignType !== "fieldAdvisor" && !selectedTimeSlot) {
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

    // Handle Field Advisor assignment
    if (assignType === "fieldAdvisor") {
      if (!selectedFieldAdvisor) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a field advisor before assigning.",
        });
        return;
      }

      payload = {
        bookingIds: [selectedBooking.BookingID],
        supervisorHeadId: Number(userId),
        fieldAdvisorId: selectedFieldAdvisor.value,
      };
      apiUrl = `${API_BASE}Supervisor/AssignToFieldAdvisor`;
      method = "post";
    } else {
      // Common payload format for technician and supervisor
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
    }

    try {
      const res = await axios({
        method: method,
        url: apiUrl,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 201) {
        const assignTypeLabel =
          assignType === "technician"
            ? "Technician"
            : assignType === "supervisor"
              ? "Supervisor"
              : "Field Advisor";

        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || `${assignTypeLabel} assigned successfully`,
        });
        fetchBookings();
        setAssignModalOpen(false);
        setSelectedTechnician(null);
        setSelectedSupervisor(null);
        setSelectedFieldAdvisor(null);
        setAssignType("technician");
      } else {
        const assignTypeLabel =
          assignType === "technician"
            ? "technician"
            : assignType === "supervisor"
              ? "supervisor"
              : "field advisor";

        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || `Failed to assign ${assignTypeLabel}`,
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
    console.log("selected");
  };

  // const getTimeSlotOptions = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE}TimeSlot`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setTimeSlots(
  //       response.data
  //         .filter((slot) => slot.IsActive ?? slot.Status ?? slot.status) // Only active slots
  //         .sort((a, b) => {
  //           const [aHour, aMinute] = (a.StartTime || a.startTime)
  //             .split(":")
  //             .map(Number);
  //           const [bHour, bMinute] = (b.StartTime || b.startTime)
  //             .split(":")
  //             .map(Number);
  //           return aHour * 60 + aMinute - (bHour * 60 + bMinute);
  //         })
  //         .map((slot) => ({
  //           value: `${slot.StartTime || slot.startTime} - ${
  //             slot.EndTime || slot.endTime
  //           }`,
  //           label: `${formatTime(
  //             slot.StartTime || slot.startTime
  //           )} - ${formatTime(slot.EndTime || slot.endTime)}`,
  //         }))
  //     );
  //   } catch (err) {
  //     console.error("Error fetching time slots:", err);
  //   }
  // };

  const columns = [
    {
      name: "Booking id",
      selector: (row) => (
        <Link
          to={
            role === "Dealer"
              ? `/dealer-booking-view/${row.LeadId}`
              : `/booking-view/${row.BookingID}`
          }
          className="text-primary"
        >
          {row.BookingTrackID}
        </Link>
      ),
      width: "160px",
      sortable: true,
    },

    {
      name: "Date",
      selector: (row) => {
        const rawDate = row.BookingDate || row.CreatedDate;
        if (!rawDate) return "-";

        const date = new Date(rawDate);
        if (isNaN(date)) return "-";

        return `${String(date.getDate()).padStart(2, "0")}/${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}/${date.getFullYear()}`;
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "Time slot",
      selector: (row) => row.TimeSlot || row.AssignedTimeSlot || "-",
      width: "160px",
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row) =>
        `₹${(row.TotalPrice + row.GSTAmount + row.LabourCharges - row.CouponAmount).toFixed(2)}`,
      width: "120px",
      sortable: true,
    },
    {
      name: "Cust. Name",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {" "}
            {row.CustFullName || row.CustomerName || "-"}
          </span>{" "}
          <br />
          {row.CustPhoneNumber || row.PhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
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
      sortable: true,
    },
    {
      name: "Supervisor",
      selector: (row) => (
        <>
          <span className="fw-bold">
            {row.SupervisorName || row.SupervisorHeadName || "Not Assigned"}
          </span>
          <br />
          {row.SupervisorPhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
    },
    {
      name: "Booking Status",
      cell: (row) => {
        let status = row?.BookingStatus ?? "-";
        if (!status || status === "-") status = "Not Assigned";

        // Define colors similar to Ticket Status
        const colorMap = {
          Pending: "#F57C00", // Orange
          Confirmed: "#28A745", // Green
          Cancelled: "#E34242", // Red
          Completed: "#25878F", // Teal-blue
          Rejected: "#E34242", // Red
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
      sortable: true,
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
          Paid: "#28A745", // Green
          Pending: "#F7AE21", // Yellow/Orange
          Failed: "#E34242", // Red
          Refunded: "#25878F", // Teal-blue
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
      width: "160px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
        // if (!row.BookingDate) return null;
        const bookingDate = new Date(row.BookingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFutureOrToday = bookingDate >= today;

        return (
          <div className="d-flex gap-2 align-items-center">
            <Link
              to={
                role === "Dealer"
                  ? `/dealer-booking-view/${row.LeadId}`
                  : `/booking-view/${row.BookingID}`
              }
              className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
              title="View"
            >
              <Icon icon="lucide:eye" />
            </Link>
            {/* {isFutureOrToday &&
              row.BookingStatus.toLowerCase() === "pending" &&
              (row.SupervisorID === null ||
                row.SupervisorID === 0 ||
                (row.SupervisorID !== null &&
                  row.SupervisorID !== 0 &&
                  roleId === "8")) && ( */}
            {(role === "Admin" || roleName === "Supervisor Head") &&
              !(
                row.BookingStatus === "Completed" &&
                row.PaymentStatus === "Success"
              ) && (
                <Link
                  onClick={() => handleAssignClick(row)}
                  className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  title="Assign"
                >
                  <Icon icon="mdi:account-cog-outline" />
                </Link>
              )}
            {/* )} */}
          </div>
        );
      },
      width: "100px",
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.CustFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.CustPhoneNumber?.toLowerCase().includes(
        searchText.toLowerCase(),
      ) ||
      booking.TechFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.TechPhoneNumber?.toLowerCase().includes(
        searchText.toLowerCase(),
      ) ||
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
      status === "all" ||
      booking.BookingStatus.toLowerCase() === status.toLowerCase();

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
              <form
                className="navbar-search flex-grow-1 flex-shrink-1"
                style={{ minWidth: "180px" }}
              >
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
                placeholder="Min Amt"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ minWidth: "100px", flex: "1 1 100px" }}
              />
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Max Amt"
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
                <option value="reached">Reached</option>
                <option value="serviceStarted">ServiceStarted</option>
                <option value="completed">Completed</option>
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
            paginationRowsPerPageOptions={[
              10,
              25,
              50,
              100,
              filteredBookings.length,
            ]}
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
        <div
          className="modal fade show d-block"
          style={{ background: "#00000080" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "500px", width: "90%" }}
          >
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
                    setSelectedFieldAdvisor(null);
                  }}
                />
              </div>

              <div className="modal-body">
                {/* Assignment Type Checkboxes */}
                <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                  {/* Supervisor Checkbox: show only if roleId is NOT 8 */}
                  {/* {roleId !== "8" && (
                    <div className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="assignSup"
                        checked={assignType === "supervisor"}
                        onChange={() => setAssignType("supervisor")}
                        style={{ width: "18px", height: "18px", margin: 0 }}
                      />
                      <label
                        htmlFor="assignSup"
                        className="form-check-label mb-0"
                      >
                        Supervisor
                      </label>
                    </div>
                  )} */}

                  {/* Field Advisor Checkbox */}
                  <div className="form-check d-flex align-items-center gap-2 m-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="assignFieldAdvisor"
                      checked={assignType === "fieldAdvisor"}
                      onChange={() => setAssignType("fieldAdvisor")}
                      style={{ width: "18px", height: "18px", margin: 0 }}
                    />
                    <label
                      htmlFor="assignFieldAdvisor"
                      className="form-check-label mb-0"
                    >
                      Field Advisor
                    </label>
                  </div>
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
                    <label
                      htmlFor="assignTech"
                      className="form-check-label mb-0"
                    >
                      Technician
                    </label>
                  </div>
                </div>

                {/* Time Slot Selection - Hide for Field Advisor */}
                {assignType !== "fieldAdvisor" && (
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

                    {/* <Select
                      options={timeSlots}
                      value={selectedTimeSlot}
                      onChange={(val) => setSelectedTimeSlot(val)}
                      placeholder="Select TimeSlot"
                    /> */}
                  </div>
                )}

                {/* Employee Selection based on assignType */}
                {assignType === "technician" ? (
                  <Select
                    options={technicians}
                    value={selectedTechnician}
                    onChange={(val) => setSelectedTechnician(val)}
                    placeholder="Select Technician"
                  />
                ) : assignType === "supervisor" ? (
                  <Select
                    options={supervisors}
                    value={selectedSupervisor}
                    onChange={(val) => setSelectedSupervisor(val)}
                    placeholder="Select Supervisor"
                  />
                ) : (
                  <Select
                    options={fieldAdvisors}
                    value={selectedFieldAdvisor}
                    onChange={(val) => setSelectedFieldAdvisor(val)}
                    placeholder="Select Field Advisor"
                  />
                )}
              </div>
              <div className="modal-footer d-inline-flex align-items-center justify-content-center">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setAssignModalOpen(false);
                    setAssignType("technician");
                    setSelectedTechnician(null);
                    setSelectedSupervisor(null);
                    setSelectedFieldAdvisor(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                  onClick={handleAssignConfirm}
                  disabled={
                    (assignType !== "fieldAdvisor" && !selectedTimeSlot) ||
                    (assignType === "technician" && !selectedTechnician) ||
                    (assignType === "supervisor" && !selectedSupervisor) ||
                    (assignType === "fieldAdvisor" && !selectedFieldAdvisor)
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
