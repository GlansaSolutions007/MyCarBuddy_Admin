import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;

const TelecalerAssignTicketLayer = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectAllRef = useRef(null);

  const [formData, setFormData] = useState({
    selectedDepartment: null,
    selectedHead: null,
    selectedEmployees: [],
  });

  useEffect(() => {
    if (role === "Admin") {
      fetchDepartments();
      fetchAllEmployees();
    } else if (role === "DepartmentHead") {
      setFormData((prev) => ({
        ...prev,
        selectedDepartment: { value: userId, label: "Your Department" },
      }));
      fetchAllEmployees();
    }
    fetchTickets();
  }, [role, userId]);

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status && Array.isArray(res.data.data)) {
        const deptList = res.data.data.map((dept) => ({
          value: dept.DeptId,
          label: dept.DepartmentName,
        }));
        setDepartments(deptList);
      } else {
        Swal.fire("Warning", "No departments found", "warning");
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      Swal.fire("Error", "Unable to load departments", "error");
    }
  };

  // Fetch Department Heads
  const fetchDepartmentHeads = async (departmentId) => {
    try {
      const res = await axios.get(`${API_BASE}Designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.status && Array.isArray(res.data.data)) {
        const headList = res.data.data
          .filter(
            (d) =>
              d.DeptId === departmentId &&
              (d.Is_Head === 1 || d.Is_Head === true)
          )
          .map((d) => ({
            value: d.Id,
            label: d.Designation_name,
          }));

        setDepartmentHeads(headList);
      } else {
        setDepartmentHeads([]);
      }
    } catch (error) {
      console.error("Failed to fetch department heads:", error);
      Swal.fire("Error", "Unable to load department heads", "error");
    }
  };

  // Fetch All Employees
  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        const empList = res.data.map((emp) => ({
          value: emp.Id,
          label: emp.Name,
        }));
        setEmployees(empList);
      } else {
        Swal.fire("Warning", "No employees found", "warning");
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      Swal.fire("Error", "Unable to load employees", "error");
    }
  };

  // Fetch Unassigned Tickets
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}Tickets?status=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  // Handle Department Change
  const handleDepartmentChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      selectedDepartment: selected,
      selectedHead: null,
      selectedEmployees: [],
    }));

    if (selected) fetchDepartmentHeads(selected.value);
    else setDepartmentHeads([]);
  };

  // ===== TICKET SELECTION HANDLERS =====
  const handleTicketSelection = (ticketId) => {
    setSelectedTickets((prev) => {
      if (prev.includes(ticketId)) {
        return prev.filter((id) => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allIds = tickets.map((t) => t.TicketID);
      setSelectedTickets(allIds);
    } else {
      setSelectedTickets([]);
    }
  };

  // Update indeterminate state for select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    const isIndeterminate =
      selectedTickets.length > 0 && selectedTickets.length < tickets.length;
    selectAllRef.current.indeterminate = isIndeterminate;
  }, [selectedTickets, tickets]);

  // ===== ASSIGN HANDLER =====
  const handleAssign = async () => {
    if (selectedTickets.length === 0) {
      Swal.fire("Warning", "Please select at least one ticket", "warning");
      return;
    }

    if (!formData.selectedDepartment) {
      Swal.fire("Warning", "Please select a department", "warning");
      return;
    }

    if (role === "Admin" && !formData.selectedHead) {
      Swal.fire("Warning", "Please select a department head", "warning");
      return;
    }

    if (formData.selectedEmployees.length === 0) {
      Swal.fire("Warning", "Please select at least one employee", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ticketIds: selectedTickets,
        departmentId: formData.selectedDepartment.value,
        headId: formData.selectedHead?.value,
        employeeIds: formData.selectedEmployees.map((emp) => emp.value),
        assignedBy: userId,
      };

      await axios.post(`${API_BASE}Tickets/assign`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Tickets assigned successfully", "success").then(
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
      name: (
        <input
          ref={selectAllRef}
          type="checkbox"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={
            tickets.length > 0 && selectedTickets.length === tickets.length
          }
          className="form-check-input cursor-pointer"
          style={{ width: 16, height: 16 }}
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedTickets.includes(row.TicketID)}
          onChange={() => handleTicketSelection(row.TicketID)}
          className="form-check-input cursor-pointer"
          style={{
            width: 16,
            height: 16,
            accentColor: "#0d6efd",
          }}
        />
      ),
      width: "60px",
      center: true,
      ignoreRowClick: true,
      allowOverflow: true,
    },
    {
      name: "Ticket Track ID",
      selector: (row) => row.TicketTrackId || "-",
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
    },
    {
      name: "Description",
      selector: (row) => row.Description || "-",
    },
  ];

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <div className="row g-3">
          {/* Department Selection */}
          {role === "Admin" && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Select Department
              </label>
              <Select
                options={departments}
                value={formData.selectedDepartment}
                onChange={handleDepartmentChange}
                placeholder="Choose department..."
                isSearchable
                classNamePrefix="react-select"
              />
            </div>
          )}

          {/* Department Head */}
          {role === "Admin" && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Assign to Department Head
              </label>
              <Select
                options={departmentHeads}
                value={formData.selectedHead}
                onChange={(selected) =>
                  setFormData((prev) => ({ ...prev, selectedHead: selected }))
                }
                placeholder="Choose department head..."
                isSearchable
                isDisabled={!formData.selectedDepartment}
                classNamePrefix="react-select"
              />
            </div>
          )}

          {/* Employees */}
          <div className="col-12">
            <label className="form-label fw-semibold">
              Assign to Employees
            </label>
            <Select
              options={employees}
              value={formData.selectedEmployees}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  selectedEmployees: selected || [],
                }))
              }
              placeholder="Choose employees..."
              isMulti
              isSearchable
              classNamePrefix="react-select"
              closeMenuOnSelect={false}
            />
          </div>

          {/* Ticket Table */}
          <div className="col-12">
            <label className="form-label fw-semibold">
              Select Tickets to Assign
            </label>
            <div className="border rounded p-3">
              <DataTable
                columns={ticketColumns}
                data={tickets}
                highlightOnHover
                responsive
                pagination
                noDataComponent="No unassigned tickets available"
              />
            </div>
          </div>

          {/* Buttons */}
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
        </div>
      </div>
    </div>
  );
};

export default TelecalerAssignTicketLayer;
