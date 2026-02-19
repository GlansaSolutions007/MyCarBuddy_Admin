import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import Swal from "sweetalert2";
import { usePermissions } from "../context/PermissionContext";

const TelecalerAssignBookingLayer = () => {
  const { hasPermission } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    EmployeeIDs: "",
    employees: [], // { id, name, count }
  });
  const [bookingCount, setBookingCount] = useState(""); // Booking Count input

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

  // ========================== FETCH DATA ==========================
  useEffect(() => {
    fetchTechnicians();
    fetchBookings();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`);
      setEmployees(res.data);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

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

  // ========================== ASSIGN TECHNICIAN ==========================
  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);
    const slots = booking.TimeSlot?.split(",").map((s) => s.trim()) || [];
    if (slots.length === 1)
      setSelectedTimeSlot({ value: slots[0], label: slots[0] });
    else setSelectedTimeSlot(null);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedTechnician || !selectedTimeSlot) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select both technician and time slot",
      });
      return;
    }
    try {
      const res = await axios.put(
        `${API_BASE}Bookings/assign-technician`,
        {
          TechID: selectedTechnician.value,
          BookingID: selectedBooking.BookingID,
          AssingedTimeSlot: selectedTimeSlot.value,
        },
        { headers: { Authorization: `Bearer ${token}` } }
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
        Swal.fire({ icon: "error", title: "Error", text: "Failed to assign technician" });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to assign technician",
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

  // ========================== ASSIGN BOOKINGS TO EMPLOYEES ==========================
  const handleAssignBookingsToAgents = async () => {
    if (formData.employees.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Employee Selected",
        text: "Please select at least one employee to assign.",
      });
      return;
    }

    // Include ALL bookings (no filters)
    const unassignedBookings = bookings
      .sort((a, b) => a.BookingID - b.BookingID); // just sorted ascending

    if (unassignedBookings.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Bookings Found",
        text: "No bookings are available to assign.",
      });
      return;
    }

    let bookingIndex = 0;
    const payload = formData.employees
      .map((emp) => {
        const bookingIDs = [];
        for (let i = 0; i < emp.count; i++) {
          if (bookingIndex < unassignedBookings.length) {
            bookingIDs.push(unassignedBookings[bookingIndex].BookingID);
            bookingIndex++;
          } else break;
        }
        return { id: emp.id, bookingIDs, status: "Pending" };
      })
      .filter((emp) => emp.bookingIDs.length > 0);

    if (payload.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Bookings Assigned",
        text: "No bookings could be assigned based on the selected counts.",
      });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}Agents`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Bookings assigned to employees successfully!",
        });
        fetchBookings();
        setFormData({ EmployeeIDs: "", employees: [] });
        setBookingCount("");
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.message || "Failed to assign bookings." });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: error.response?.data?.message || "Error while assigning bookings.",
      });
    }
  };

  // ========================== TABLE COLUMNS ==========================
  const columns = [
    {
      name: "Booking id",
      selector: (row) => (
        <Link to={`/view-booking/${row.BookingID}`} className="text-primary">
          {row.BookingTrackID}
        </Link>
      ),
      sortable: true,
      width: "150px",
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
      width: "150px",
      sortable: true,
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

  const singleSlotStyle = {
    control: (base) => ({ ...base, backgroundColor: "#f5f5f5", cursor: "not-allowed" }),
    singleValue: (base) => ({ ...base, color: "#495057" }),
  };

  // ========================== UI ==========================
  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          {/* Filter Row */}
          {hasPermission("assigntickets_edit") && (
          <div className="row align-items-end mb-3">
            <div className="col-sm-8 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Employee Name <span className="text-danger-600">*</span>
              </label>
              <Select
                name="EmployeeIDs"
                options={employees
                  .filter((emp) => !formData.employees.some((e) => e.id === emp.Id))
                  .map((emp) => ({ value: emp.Id, label: emp.Name }))}
                value={formData.employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                onChange={(selectedOptions) => {
                  const newEmployees = selectedOptions
                    ? selectedOptions.map((opt) => ({ id: opt.value, name: opt.label, count: bookingCount ? Number(bookingCount) : 1 }))
                    : [];
                  setFormData((prev) => ({
                    ...prev,
                    EmployeeIDs: newEmployees.map((e) => e.id).join(","),
                    employees: newEmployees,
                  }));
                }}
                isMulti
                closeMenuOnSelect={false}
                placeholder="Select Employees"
                classNamePrefix="react-select"
              />
            </div>

            <div className="col-sm-2 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Booking Count
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter Booking Count"
                value={bookingCount}
                min={1}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  // Get total available bookings
                  const totalBookings = bookings.length;

                  // Get total number of selected employees
                  const employeeCount = formData.employees.length || 0;

                  // Calculate total that would be assigned if this count applied to all employees
                  const totalAssigned = value * employeeCount;

                  if (totalAssigned > totalBookings) {
                    Swal.fire({
                      icon: "warning",
                      title: "Booking Limit Exceeded",
                      text: `You have only ${totalBookings} bookings available. 
          You can assign at most ${Math.floor(totalBookings / (employeeCount || 1))} per employee.`,
                    });
                    return;
                  }

                  // ✅ Safe to update
                  setBookingCount(value);
                  setFormData((prev) => ({
                    ...prev,
                    employees: prev.employees.map((emp) => ({ ...emp, count: value })),
                  }));
                }}
              />
            </div>

            <div className="col-sm-2 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">Total Bookings</label>
              <div className="fw-bold">
                <span className="text-primary">{bookings.length}</span>
              </div>
            </div>
          </div>
          )}
          {/* Selected Employee Table */}
          {hasPermission("assigntickets_edit") && formData.employees.length > 0 && (
            <div className="table-responsive mb-3">
              <table className="table table-bordered table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>S.No</th>
                    <th>Employee Name</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.employees.map((emp, index) => (
                    <tr key={emp.id}>
                      <td>{index + 1}</td>
                      <td>{emp.name}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={emp.count}
                          min={1}
                          onChange={(e) => {
                            const newCount = Number(e.target.value);
                            const totalOtherEmployees = formData.employees
                              .filter((item) => item.id !== emp.id)
                              .reduce((sum, item) => sum + item.count, 0);
                            const maxAllowed = bookings.length - totalOtherEmployees;

                            if (newCount > maxAllowed) {
                              Swal.fire({
                                icon: "warning",
                                title: "Booking Limit Exceeded",
                                text: `You can assign a maximum of ${maxAllowed} bookings to this employee.`,
                              });
                              return;
                            }

                            setFormData((prev) => ({
                              ...prev,
                              employees: prev.employees.map((item) =>
                                item.id === emp.id ? { ...item, count: newCount } : item
                              ),
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={handleAssignBookingsToAgents}>
                  Assign Bookings
                </button>
              </div>
            </div>
          )}

          {/* Bookings Table */}
          <DataTable
            columns={columns}
            data={bookings}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, bookings.length]}
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Bookings available"
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
          />
        </div>
      </div>

      {/* Assign Technician Modal */}
      {assignModalOpen && (
        <div className="modal fade show d-block" style={{ background: "#00000080" }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Assign Technician</h6>
                <button type="button" className="btn-close" onClick={() => setAssignModalOpen(false)} />
              </div>
              <div className="modal-body">
                {selectedBooking?.TimeSlot?.split(",").length === 1 ? (
                  <Select value={selectedTimeSlot} isDisabled styles={singleSlotStyle} />
                ) : (
                  <Select
                    options={getTimeSlotOptions()}
                    value={selectedTimeSlot}
                    onChange={(val) => setSelectedTimeSlot(val)}
                    placeholder="Select TimeSlot"
                  />
                )}
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
                <button className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignConfirm}
                  disabled={!selectedTechnician || !selectedTimeSlot}
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

export default TelecalerAssignBookingLayer;
