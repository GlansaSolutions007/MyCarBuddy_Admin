import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";

const SupervisorAssignBookingLayer = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Get role from localStorage
  const userId = localStorage.getItem("userId"); // Get userId from localStorage
  const userDetails = JSON.parse(localStorage.getItem("employeeData")); // Get userDetails

  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]); // Not used in the assign booking section but kept for existing assign tech modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null); // Not used in the assign booking section but kept for existing assign tech modal
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // Not used in the assign booking section but kept for existing assign tech modal
  const [employees, setEmployees] = useState([]); // For department head to assign to employees
  const [formData, setFormData] = useState({
    selectedDepartment: null, // For Admin
    selectedHead: null, // For Admin
    employees: [], // { id, name, count } for Department Head to assign
  });
  const [bookingCount, setBookingCount] = useState("");

  const API_BASE = import.meta.env.VITE_APIURL;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);

  // Refined states for Departments and Department Heads
  const [departments, setDepartments] = useState([]); // Will store { value: DeptId, label: DepartmentName }
  const [departmentHeads, setDepartmentHeads] = useState([]); // Will store { value: EmpId, label: EmpName }

  // For Assign Supervisor Modal
  const [assignSupervisorModalOpen, setAssignSupervisorModalOpen] = useState(false);
  // const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [assignType, setAssignType] = useState("technician"); // 'technician' | 'supervisor'
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);




  // ========================== INITIAL LOAD ==========================
  useEffect(() => {
    fetchTechnicians();
    fetchBookings();
    fetchSupervisors(); // 👈 add this line
    if (role === "Admin") {
      fetchDepartments();
    } else if (userDetails?.Is_Head === 1) {
      fetchAllEmployees();
    }
  }, [role, userDetails?.Is_Head]);

  useEffect(() => {
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  // ===== FILTER BOOKINGS BY DATE =====
  useEffect(() => {
    let currentBookings = [...bookings];

    if (!fromDate && !toDate) {
      setFilteredBookings(currentBookings);
      return;
    }

    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    const filtered = currentBookings.filter((b) => {
      const bookingDate = new Date(b.CreatedDate);

      if (from && to) return bookingDate >= from && bookingDate <= to;
      if (from) return bookingDate >= from;
      if (to) return bookingDate <= to;
      return true;
    });

    setFilteredBookings(filtered);
    setSelectedBookings([]); // Reset selected bookings when filters change
  }, [fromDate, toDate, bookings]);

  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);

    const slots = booking.TimeSlot?.split(",").map((s) => s.trim()) || [];
    if (slots.length === 1) {
      setSelectedTimeSlot({ value: slots[0], label: slots[0] });
    } else {
      setSelectedTimeSlot(null);
    }

    setAssignModalOpen(true);
  };


  // ========================== FETCH FUNCTIONS ==========================
  const fetchBookings = async () => {
    try {
      let res;
      res = await axios.get(`${API_BASE}Bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allBookings = res.data?.data || res.data || [];

      // Ensure array
      if (!Array.isArray(allBookings)) allBookings = [];

      // Sort newest first
      allBookings.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

      // ✅ Admin or Department Head both can see all bookings
      if (role === "Admin" || userDetails?.Is_Head === 1) {
        setBookings(allBookings);
      }
      // ✅ Regular employee → only their assigned ones
      else {
        const assigned = allBookings.filter(
          (item) => Number(item.assignedToEmp) === Number(userDetails?.Id)
        );
        setBookings(assigned);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
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

      // ✅ Filter supervisors based on DepartmentName
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

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const deptArray = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.jsonResult || [];

      setDepartments(
        deptArray.map((dept) => ({
          value: dept.DeptId || dept.DepartmentId,
          label: dept.DepartmentName,
        }))
      );
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  };

  const fetchDepartmentHeads = async (departmentId) => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        const heads = res.data
          .filter(
            (emp) =>
              Number(emp.DeptId) === Number(departmentId) &&
              (emp.Is_Head === 1 || emp.Is_Head === true)
          )
          .map((emp) => ({
            value: emp.Id,
            label: emp.Name,
          }));
        setDepartmentHeads(heads);
      } else {
        setDepartmentHeads([]);
      }
    } catch (error) {
      console.error("Failed to fetch department heads:", error);
      setDepartmentHeads([]);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      // Filter for employees that are NOT heads AND are in the current head's department
      const empList = empArray
        .filter(
          (emp) => emp.Is_Head !== 1 && Number(emp.DeptId) === Number(userDetails?.DeptId)
        )
        .map((emp) => ({
          value: emp.Id,
          label: emp.Name,
        }));

      setEmployees(empList);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };


  // ========================== HANDLERS ==========================

  // For Admin: Department selection
  const handleAdminDepartmentChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      selectedDepartment: selected,
      selectedHead: null, // Clear head when department changes
    }));
    if (selected) {
      fetchDepartmentHeads(selected.value);
    } else {
      setDepartmentHeads([]); // Clear heads if department is unselected
    }
  };

  // For Admin: Department Head selection
  const handleAdminHeadChange = (selected) => {
    setFormData((prev) => ({ ...prev, selectedHead: selected }));
  };

  // For Department Head: Employee multi-select
  const handleEmployeeSelect = (selectedOptions) => {
    const newEmployees = selectedOptions
      ? selectedOptions.map((opt) => ({
        id: opt.value,
        name: opt.label,
        count: bookingCount ? Number(bookingCount) : 1, // Default to 1 if count not set
      }))
      : [];
    setFormData((prev) => ({
      ...prev,
      employees: newEmployees,
    }));
  };

  const handleBookingSelect = (bookingId, checked) => {
    setSelectedBookings((prev) =>
      checked ? [...prev, bookingId] : prev.filter((id) => id !== bookingId)
    );
  };

  // Auto-select first N bookings when bookingCount changes
  useEffect(() => {
    if (bookingCount > 0 && filteredBookings.length > 0) {
      const autoSelected = filteredBookings
        .slice(0, bookingCount)
        .map((b) => b.BookingID);
      setSelectedBookings(autoSelected);
    } else {
      setSelectedBookings([]);
    }
  }, [bookingCount, filteredBookings]);

  // ========================== ASSIGN BOOKINGS ==========================
  const handleAssignBookingsToAgents = async () => {
    let payload = [];
    let bookingsToAssign = [];

    // Determine which bookings to assign
    if (selectedBookings.length > 0) {
      bookingsToAssign = selectedBookings;
    } else if (bookingCount > 0) {
      bookingsToAssign = filteredBookings.slice(0, bookingCount).map(b => b.BookingID);
    }

    if (bookingsToAssign.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Bookings Selected",
        text: "Please select bookings or enter a valid booking count.",
      });
      return;
    }

    if (role === "Admin") {
      if (!formData.selectedDepartment || !formData.selectedHead) {
        Swal.fire({
          icon: "warning",
          title: "Selection Missing",
          text: "Please select a Department and a Department Head.",
        });
        return;
      }
      payload = [
        {
          assignedBy: Number(userId),
          assignedToHead: formData.selectedHead.value,
          assignedToEmp: null,
          bookingIds: bookingsToAssign, // Use bookingIds for clarity
        },
      ];
    } else if (userDetails?.Is_Head === 1) {
      if (formData.employees.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No Employee Selected",
          text: "Please select at least one employee to assign.",
        });
        return;
      }

      const empList = formData.employees;
      const totalBookings = bookingsToAssign.length;
      const empCount = empList.length;
      const base = Math.floor(totalBookings / empCount);
      const extra = totalBookings % empCount;

      let bookingIndex = 0;
      payload = empList.map((emp, index) => {
        const bookingsForThisEmp = index < extra ? base + 1 : base;
        const assignedBookingsChunk = bookingsToAssign.slice(
          bookingIndex,
          bookingIndex + bookingsForThisEmp
        );
        bookingIndex += bookingsForThisEmp;

        return {
          assignedBy: Number(userId),
          assignedToHead: Number(userDetails.Id),
          assignedToEmp: Number(emp.id),
          bookingIds: assignedBookingsChunk,
        };
      }).filter(item => item.bookingIds.length > 0); // Only include employees actually getting bookings

      if (payload.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Bookings Assigned",
          text: "No bookings could be assigned based on the selected counts.",
        });
        return;
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "You are not authorized to assign bookings.",
      });
      return;
    }

    try {
      // Assuming a single endpoint for both Admin and Head assignments
      const res = await axios.post(`${API_BASE}Booking_Assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Bookings assigned successfully!",
        });
        fetchBookings(); // Refresh bookings to reflect assignments
        setSelectedBookings([]);
        setBookingCount("");
        setFormData({ // Reset form data
          selectedDepartment: null,
          selectedHead: null,
          employees: [],
        });
        setDepartmentHeads([]); // Clear heads list
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.message || "Failed to assign bookings." });
      }
    } catch (error) {
      console.error("Assignment API Error:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: error.response?.data?.message || "Error while assigning bookings. Check console for details.",
      });
    }
  };

  // ========================== TABLE COLUMNS ==========================
  const columns = [
    ...(role === "Admin" || userDetails?.Is_Head === 1
      ? [
        {
          name: "Select",
          cell: (row) => (
            <input
              type="checkbox"
              className="form-check-input"
              style={{ width: "15px", height: "15px", cursor: "pointer" }}
              checked={selectedBookings.includes(row.BookingID)}
              onChange={(e) => handleBookingSelect(row.BookingID, e.target.checked)}
            />
          ),
          width: "80px",
          ignoreRowClick: true,
          allowOverflow: true,
          button: true,
        },
      ]
      : []),
    {
      name: "Booking ID",
      selector: (row) => row.BookingID,
      width: "100px",
      sortable: true,
    },
    {
      name: "Booking date",
      selector: (row) =>
        row.BookingDate ? new Date(row.BookingDate).toLocaleDateString("en-GB") : "",
      width: "120px",
      sortable: true,
    },
    { name: "Time slot", selector: (row) => row.TimeSlot, width: "160px", sortable: true, },
    {
      name: "Booking price",
      selector: (row) =>
        `₹${(row.TotalPrice + row.GSTAmount - row.CouponAmount).toFixed(2)}`,
      width: "120px",
      sortable: true,
    },
    {
      name: "Customer name",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustFullName}</span>
          <br />
          {row.CustPhoneNumber || ""}
        </>
      ),
      width: "150px",
      sortable: true,
    },
    {
      name: "Technician",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.TechFullName || "Not Assigned"}</span>
          <br />
          {row.TechPhoneNumber || ""}
        </>
      ),
      sortable: true,
      width: "150px",
    },
    {
      name: "Booking Status",
      selector: (row) => (
        <span
          className={`badge ${row.BookingStatus.toLowerCase() === "pending"
            ? "bg-warning"
            : row.BookingStatus.toLowerCase() === "confirmed"
              ? "bg-success"
              : "bg-danger"
            }`}
        >
          {row.BookingStatus}
        </span>
      ),
      width: "120px",
      sortable: true,
    },
    {
      name: "Payment Status",
      selector: (row) => {
        const status = row.PaymentStatus?.toLowerCase() || "pending";
        return (
          <span
            className={`badge ${status === "success" ? "bg-success" : status === "pending" ? "bg-warning" : "bg-danger"
              }`}
          >
            {status === "success" ? "Paid" : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
      width: "120px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
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
            {isFutureOrToday && row.BookingStatus.toLowerCase() === "pending" && (
              <Link
                onClick={() => handleAssignClick(row)}
                className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
                title="Assign"
              >
                <Icon icon="mdi:account-cog-outline" />
              </Link>
            )}
          </div>
        );
      },
      width: "100px",
    },
  ];

  // ========================== Assign Technician Modal (Existing) ==========================
  const singleSlotStyle = {
    control: (base) => ({ ...base, backgroundColor: "#f5f5f5", cursor: "not-allowed" }),
    singleValue: (base) => ({ ...base, color: "#495057" }),
  };

  const getTimeSlotOptions = () => {
    if (!selectedBooking || !selectedBooking.TimeSlot) return [];
    return selectedBooking.TimeSlot.split(",").map((slot) => ({
      value: slot.trim(),
      label: slot.trim(),
    }));
  };

  // ========================== ASSIGN TECHNICIAN & Supervisor CONFIRM ==========================
  const handleAssignConfirm = async (type = "technician") => {
    // ... (existing checks)

    let payload;
    let apiUrl;

    if (type === "technician") {
      if (!selectedTechnician) {
        Swal.fire({
          icon: "warning",
          title: "Missing Technician",
          text: "Please select a technician before assigning.",
        });
        return;
      }
      // MODIFIED PAYLOAD AND API URL FOR TECHNICIAN
      payload = {
        TechID: selectedTechnician.value, // Changed from TechnicianID
        BookingID: selectedBooking.BookingID,
        AssingedTimeSlot: selectedTimeSlot.value, // Changed from TimeSlot
        // Remove AssignedBy if the old endpoint doesn't expect it
        // You might need to check your backend for this
      };
      apiUrl = `${API_BASE}Bookings/assign-technician`; // Changed to original endpoint
      // Use PUT method for this endpoint as in BookingLayer
      try {
        const res = await axios.put(apiUrl, payload, { // <--- Changed to axios.put
          headers: { Authorization: `Bearer ${token}` },
        });
        // ... (rest of the success/error handling)
      } catch (error) {
        // ... (error handling)
      }

    } else { // type === "supervisor"
      // ... (Supervisor specific logic, keep as is for now)
      if (!selectedSupervisor) {
        Swal.fire({
          icon: "warning",
          title: "Missing Supervisor",
          text: "Please select a supervisor before assigning.",
        });
        return;
      }
      payload = {
        BookingID: selectedBooking.BookingID,
        SupervisorID: selectedSupervisor.value,
        TimeSlot: selectedTimeSlot.value,
        AssignedBy: userId,
      };
      apiUrl = `${API_BASE}AssignSupervisor`; // Your new supervisor endpoint
      // Use POST method for this endpoint
      try {
        const res = await axios.post(apiUrl, payload, { // <--- Keep axios.post for supervisor
          headers: { Authorization: `Bearer ${token}` },
        });
        // ... (rest of the success/error handling)
      } catch (error) {
        // ... (error handling)
      }
    }
  };

  // ========================== UI ==========================
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3 shadow-sm border-0">

          {/* ---------- Filter + Counts Row ---------- */}
          <div className="col-12 d-flex flex-wrap align-items-end justify-content-between gap-3 mt-4">

            <div className="d-flex align-items-center gap-4 flex-wrap">
              <div>
                <label className="form-label fw-semibold mb-0">
                  Total {role === "Employee" ? "Assigned" : "Available"} Bookings :
                </label>
                <span className="fw-bold text-primary fs-5 ms-2">
                  {filteredBookings.length}
                </span>
              </div>

              {(role === "Admin" || userDetails?.Is_Head === 1) && (
                <div>
                  <label className="form-label fw-semibold mb-0">
                    Selected Bookings :
                  </label>
                  <span className="fw-bold text-primary fs-5 ms-2">
                    {selectedBookings.length}
                  </span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <label className="text-sm fw-semibold mb-0">From:</label>
              <input
                type="date"
                className="form-control radius-8 px-14 py-6 text-sm w-auto"
                style={{ minWidth: "150px" }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <label className="text-sm fw-semibold mb-0 ms-2">To:</label>
              <input
                type="date"
                className="form-control radius-8 px-14 py-6 text-sm w-auto"
                style={{ minWidth: "150px" }}
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {/* ---------- Assignment Section (Conditional Rendering) ---------- */}
          {(role === "Admin" || userDetails?.Is_Head === 1) && ( // Only show if Admin or Head
            <div className="row align-items-end mb-3">

              {role === "Admin" && (
                <>
                  {/* Department Selection (Admin) */}
                  <div className="col-sm-4 mt-2">
                    <label className="form-label mb-1">
                      Department <span className="text-danger">*</span>
                    </label>
                    <Select
                      options={departments}
                      value={formData.selectedDepartment}
                      onChange={handleAdminDepartmentChange}
                      placeholder="Select Department"
                      isClearable
                      classNamePrefix="react-select"
                    />
                  </div>

                  {/* Department Head Selection (Admin) */}
                  <div className="col-sm-4 mt-2">
                    <label className="form-label mb-1">
                      Department Head <span className="text-danger">*</span>
                    </label>
                    <Select
                      options={departmentHeads}
                      value={formData.selectedHead}
                      onChange={handleAdminHeadChange}
                      placeholder={
                        formData.selectedDepartment
                          ? "Select Department Head"
                          : "Select a department first"
                      }
                      isDisabled={!formData.selectedDepartment || departmentHeads.length === 0}
                      isClearable
                      classNamePrefix="react-select"
                    />
                  </div>
                </>
              )}

              {userDetails?.Is_Head === 1 && role !== "Admin" && (
                <>
                  {/* Employee Name Single-Select (Department Head) */}
                  <div className="col-sm-8 mt-2">
                    <label className="form-label fw-semibold">
                      Employee Name <span className="text-danger">*</span>{" "}
                    </label>
                    <Select
                      name="EmployeeID"
                      options={employees.filter(
                        (emp) => !formData.employees?.some((e) => e.id === emp.value)
                      )}
                      value={
                        formData.selectedEmployee
                          ? { value: formData.selectedEmployee.id, label: formData.selectedEmployee.name }
                          : null
                      }
                      onChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          selectedEmployee: selected ? { id: selected.value, name: selected.label } : null,
                        }));
                      }}
                      isClearable
                      placeholder="Select Employee"
                      classNamePrefix="react-select"
                    />
                  </div>
                </>
              )}


              {/* Booking Count (Common for Admin and Head) */}
              <div className="col-sm-2 mt-2">
                <label className="form-label mb-1">
                  Booking Count
                </label>
                <input
                  type="number"
                  className={`form-control ${bookingCount > filteredBookings.length ? "border-danger" : ""}`}
                  placeholder="Enter Count"
                  value={bookingCount}
                  min={0}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setBookingCount(value);

                    // If Head is assigning to multiple employees, update employee counts
                    if (userDetails?.Is_Head === 1 && formData.employees.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        employees: prev.employees.map((emp) => ({ ...emp, count: value })),
                      }));
                    }
                  }}
                />
                {bookingCount > filteredBookings.length && (
                  <small
                    className="text-danger position-absolute"
                    style={{ bottom: "-18px", fontSize: "12px" }}
                  >
                    Entered count exceeds total available bookings
                  </small>
                )}
              </div>

              {/* Assign Bookings Button (Common for Admin and Head) */}
              <div className="col-md-2 d-flex justify-content-end">
                <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm w-100" onClick={handleAssignBookingsToAgents}>
                  Assign Bookings
                </button>
              </div>
            </div>
          )}

          {/* ---------- Bookings Table ---------- */}
          <div className="mt-3">
            <DataTable
              columns={columns}
              data={filteredBookings}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={fromDate || toDate ? "No bookings found for the selected date range" : `No ${role === "Employee" ? "assigned" : "unassigned"} bookings available`}
            />
          </div>
        </div>
      </div>

      {/* ---------- Assign Technician Modal (Existing) ---------- */}
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
                {/* ---------- Assignment Type ---------- */}
                <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                  <div className="form-check d-flex align-items-center gap-2 m-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="assignTech"
                      checked={assignType === "technician"}
                      onChange={() => setAssignType("technician")}
                      style={{ width: "18px", height: "18px", margin: 0 }}
                    />
                    <label htmlFor="assignTech" className="form-check-label mb-0">
                      Technician
                    </label>
                  </div>

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
                </div>


                {/* ---------- Time Slot ---------- */}
                {selectedBooking?.TimeSlot && (
                  <div className="mb-3">
                    {selectedBooking.TimeSlot.split(",").length === 1 ? (
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
                )}

                {/* ---------- Technician / Supervisor Selection ---------- */}
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
                  onClick={() => handleAssignConfirm(assignType)}
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

export default SupervisorAssignBookingLayer;