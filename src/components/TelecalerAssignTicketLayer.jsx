import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const TelecalerAssignTicketLayer = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const userDetails = JSON.parse(localStorage.getItem("employeeData"));

  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketCount, setTicketCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    selectedDepartment: null,
    selectedHead: null,
    employees: [],
  });

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (role === "Admin") {
      fetchDepartments();
    }
    fetchAllEmployees();
    fetchTickets();
  }, [role]);

  // ===== FETCH FUNCTIONS =====
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.status && Array.isArray(res.data.data)) {
        setDepartments(
          res.data.data.map((dept) => ({
            value: dept.DeptId,
            label: dept.DepartmentName,
          }))
        );
      }
    } catch {
      Swal.fire("Error", "Unable to load departments", "error");
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
              emp.DeptId === departmentId &&
              (emp.Is_Head === 1 || emp.Is_Head === true)
          )
          .map((emp) => ({
            value: emp.Id,
            label: emp.Name,
          }));
        setDepartmentHeads(heads);
      }
    } catch (error) {
      console.error("Failed to fetch department heads:", error);
    }
  };
  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // handle both possible data structures
      const empArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
        ? res.data.data
        : [];
      const empList = empArray
        .filter(
          (emp) => emp.Is_Head !== 1 && emp.DeptId === userDetails?.DeptId
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
  const fetchTickets = async () => {
    try {
      let res;

      if (role === "Admin") {
        // 🔹 Admin: Fetch all unassigned tickets
        res = await axios.get(`${API_BASE}Tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data)) {
          const unassignedTickets = res.data.filter(
            (t) => t.IsAssigned_head === false
          );
          setTickets(unassignedTickets);
        }
      }
      // 🔹 Department Head: Fetch tickets assigned to this head dynamically
      else if (userDetails?.Is_Head === 1) {
        res = await axios.get(`${API_BASE}Ticket_Assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data || res.data || [];

        const assigned_to_head = Array.isArray(data)
          ? data.filter(
              (item) =>
                Number(item.assigned_to_head) === Number(userDetails.Id) &&
                (item.assigned_to_emp == null || item.assigned_to_emp === "")
            )
          : [];

        console.log("Tickets assigned to this head:", assigned_to_head);
        setTickets(assigned_to_head);
      }
      // 🔹 Employee: Fetch tickets assigned to this employee
      else {
        res = await axios.get(`${API_BASE}Ticket_Assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data || res.data || [];

        const assigned_to_emp = Array.isArray(data)
          ? data.filter(
              (item) => Number(item.assigned_to_emp) === Number(userDetails.Id)
            )
          : [];

        console.log("Tickets assigned to this employee:", assigned_to_emp);
        setTickets(assigned_to_emp);
      }
    } catch {
      console.error("Failed to fetch tickets");
    }
  };

  // ===== UTIL =====
  const getTicketId = (ticket) =>
    ticket.ticket_id ||
    ticket.TicketTrackId ||
    ticket.TicketID ||
    ticket.TicketId ||
    ticket.Id;

  // ===== HANDLERS =====
  const handleDepartmentChange = (selected) => {
    setFormData({
      ...formData,
      selectedDepartment: selected,
      selectedHead: null,
    });
    if (selected) fetchDepartmentHeads(selected.value);
  };

  // ===== SELECT MULTIPLE EMPLOYEES =====
  const handleEmployeeSelect = (selectedOptions) => {
    const newEmployees = selectedOptions
      ? selectedOptions.map((opt) => ({
          id: opt.value,
          name: opt.label,
          count: ticketCount ? Number(ticketCount) : 1,
        }))
      : [];
    setFormData((prev) => ({
      ...prev,
      employees: newEmployees,
    }));
  };

  const handleAssign = async () => {
    if (role === "Admin") {
      if (!formData.selectedDepartment)
        return Swal.fire("Warning", "Please select a department", "warning");

      if (!formData.selectedHead)
        return Swal.fire(
          "Warning",
          "Please select a department head",
          "warning"
        );
    }

    if (!ticketCount || ticketCount <= 0)
      return Swal.fire(
        "Warning",
        "Please enter a valid ticket count",
        "warning"
      );

    if (tickets.length === 0)
      return Swal.fire("Info", "No unassigned tickets available", "info");

    // Sort tickets and pick top N
    const availableTickets = [...tickets].sort(
      (a, b) => getTicketId(a) - getTicketId(b)
    );
    const selectedTicketIds = availableTickets
      .slice(0, ticketCount)
      .map((t) => getTicketId(t));

    let payload = [];
    if (role === "Admin") {
      // 🔹 Admin assigning to Head
      payload = [
        {
          assignedBy: Number(userId),
          assignedToHead: formData.selectedHead.value,
          assignedToEmp: null,
          ticketIds: selectedTicketIds,
        },
      ];
    } else if (userDetails?.Is_Head === 1) {
      // 🔹 Head assigning to multiple Employees
      const empList = formData.employees;
      const totalTickets = selectedTicketIds.length;
      const empCount = empList.length;
      const base = Math.floor(totalTickets / empCount);
      const extra = totalTickets % empCount;

      // Distribute tickets evenly: first 'extra' employees get base+1, rest get base
      let ticketIndex = 0;
      payload = empList.map((emp, index) => {
        const ticketsForThisEmp = index < extra ? base + 1 : base;
        const assignedTickets = selectedTicketIds.slice(
          ticketIndex,
          ticketIndex + ticketsForThisEmp
        );
        ticketIndex += ticketsForThisEmp;

        return {
          AssignedBy: Number(userId),
          AssignedToHead: Number(userDetails.Id),
          AssignedToEmp: Number(emp.id),
          ticketIds: assignedTickets,
        };
      });
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE}Ticket_Assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success", "Tickets assigned successfully!", "success").then(
        () => navigate("/telecaler-tickets")
      );
    } catch (error) {
      console.error("Failed to assign tickets:", error);
      Swal.fire("Error", "Failed to assign tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== TABLE COLUMNS =====
  const ticketColumns = [
    {
      name: "Ticket Track ID",
      selector: (row) => (
        <span className="fw-bold">{row.TicketTrackId || row.ticket_id}</span>
        // <Link to={`/tickets/${row.TicketTrackId || row.ticket_id}`} className="text-primary">
        //   {row.TicketTrackId || row.ticket_id}
        // </Link>
      ),
    },
    {
      name: "Customer",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustomerName || row.CustID}</span>
        </>
      ),
    },
    {
      name: "Description",
      selector: (row) => row.Description || row.TicketDescription,
      wrap: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <Link
            to={`/tickets/${row.TicketID ?? row.ticket_id ?? row.Id}`}
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View"
          >
            <Icon icon="lucide:eye" />
          </Link>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // ===== UI =====
  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        {/* ===== INLINE INPUTS ===== */}
        <div className="row g-3 align-items-end">
          {role === "Admin" ? (
            <>
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-1">Department</label>
                <Select
                  options={departments}
                  value={formData.selectedDepartment}
                  onChange={handleDepartmentChange}
                  placeholder="Select department..."
                  isSearchable
                  classNamePrefix="react-select"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold mb-1">Department Head</label>
                <Select
                  options={departmentHeads}
                  value={formData.selectedHead}
                  onChange={(selected) =>
                    setFormData((prev) => ({ ...prev, selectedHead: selected }))
                  }
                  placeholder="Select head..."
                  isSearchable
                  isDisabled={!formData.selectedDepartment}
                  classNamePrefix="react-select"
                />
              </div>
            </>
          ) : userDetails?.Is_Head === 1 ? (
            <div className="col-sm-8 mt-2">
              <label className="form-label fw-semibold">
                Employee Name <span className="text-danger">*</span>{" "}
              </label>
              <Select
                name="EmployeeIDs"
                options={employees.filter(
                  (emp) => !formData.employees?.some((e) => e.id === emp.value)
                )}
                value={
                  formData.employees?.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                  })) || []
                }
                onChange={handleEmployeeSelect}
                isMulti
                closeMenuOnSelect={false}
                placeholder="Select Employees"
                classNamePrefix="react-select"
              />
            </div>
          ) : null}
          {(role === "Admin" || userDetails?.Is_Head === 1) && (
            <div className="col-md-2">
              <label className="form-label fw-semibold mb-1">
                Ticket Count
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter count"
                value={ticketCount}
                min={1}
                max={tickets.length}
                onChange={(e) => setTicketCount(Number(e.target.value))}
              />
            </div>
          )}

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Total Tickets</label>
            <div className="fw-bold text-primary fs-5">
              {Math.max(tickets.length - (ticketCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* ===== ACTION BUTTON (RIGHT ALIGNED) ===== */}
        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
            onClick={handleAssign}
            disabled={loading}
          >
            {loading ? "Assigning..." : "Assign Tickets"}
          </button>
        </div>

        {/* ===== TICKET TABLE ===== */}
        <div className="col-12 mt-4">
          <label className="form-label fw-semibold">
            {role === "Employee" ? "Assigned Tickets" : "Available Tickets"}
          </label>
          <div className="border rounded p-3">
            <DataTable
              columns={ticketColumns}
              data={tickets}
              highlightOnHover
              responsive
              pagination
              striped
              persistTableHead
              noDataComponent={
                role === "Employee"
                  ? "No assigned tickets available"
                  : "No unassigned tickets available"
              }
            />
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        {(role === "Admin" || userDetails?.Is_Head === 1) && (
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button
              type="button"
              className="btn btn-secondary radius-8 px-14 py-6 text-sm"
              onClick={() => navigate("/telecaler-tickets")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? "Assigning..." : "Assign Tickets"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelecalerAssignTicketLayer;
