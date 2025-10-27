import { useEffect, useState } from "react";
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

  const [formData, setFormData] = useState({
    selectedDepartment: null,
    selectedHead: null,
    selectedEmployees: [],
  });

  useEffect(() => {
    if (role === "Admin") {
      fetchDepartments();
    } else if (role === "DepartmentHead") {
      // For department head, set their department automatically
      setFormData(prev => ({ ...prev, selectedDepartment: { value: userId, label: "Your Department" } }));
      fetchEmployeesByDepartment(userId);
    }
    fetchTickets();
  }, [role, userId]);

  // Fetch Departments (Admin only)
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data)) {
        setDepartments(res.data.map(dept => ({
          value: dept.DepartmentID,
          label: dept.DepartmentName,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      Swal.fire("Error", "Unable to load departments", "error");
    }
  };

  // Fetch Department Heads when department selected
  const fetchDepartmentHeads = async (departmentId) => {
    try {
      const res = await axios.get(`${API_BASE}Employees?departmentId=${departmentId}&role=DepartmentHead`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data)) {
        setDepartmentHeads(res.data.map(emp => ({
          value: emp.EmployeeID,
          label: emp.FullName,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch department heads:", error);
    }
  };

  // Fetch Employees by Department
  const fetchEmployeesByDepartment = async (departmentId) => {
    try {
      const res = await axios.get(`${API_BASE}Employees?departmentId=${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data)) {
        setEmployees(res.data.map(emp => ({
          value: emp.EmployeeID,
          label: emp.FullName,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      Swal.fire("Error", "Unable to load employees", "error");
    }
  };

  // Fetch Unassigned Tickets
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}Tickets?status=0`, { // Assuming 0 is unassigned/pending
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  // Handle Department Change
  const handleDepartmentChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      selectedDepartment: selected,
      selectedHead: null,
      selectedEmployees: [],
    }));
    if (selected) {
      fetchDepartmentHeads(selected.value);
      fetchEmployeesByDepartment(selected.value);
    } else {
      setDepartmentHeads([]);
      setEmployees([]);
    }
  };

  // Handle Ticket Selection
  const handleTicketSelection = (ticketId, isSelected) => {
    setSelectedTickets(prev =>
      isSelected
        ? [...prev, ticketId]
        : prev.filter(id => id !== ticketId)
    );
  };

  // Handle Select All Tickets
  const handleSelectAll = (isSelected) => {
    setSelectedTickets(isSelected ? tickets.map(t => t.TicketID) : []);
  };

  // Assign Tickets
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
        employeeIds: formData.selectedEmployees.map(emp => emp.value),
        assignedBy: userId,
      };

      await axios.post(`${API_BASE}Tickets/assign`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Tickets assigned successfully", "success").then(() => {
        navigate("/telecaler-tickets");
      });
    } catch (error) {
      console.error("Failed to assign tickets:", error);
      Swal.fire("Error", "Failed to assign tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ticket Columns for DataTable
  const ticketColumns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={selectedTickets.length === tickets.length && tickets.length > 0}
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedTickets.includes(row.TicketID)}
          onChange={(e) => handleTicketSelection(row.TicketID, e.target.checked)}
        />
      ),
      width: "50px",
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
          {/* Department Selection (Admin only) */}
          {role === "Admin" && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">Select Department</label>
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

          {/* Department Head Selection (Admin only) */}
          {role === "Admin" && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">Assign to Department Head</label>
              <Select
                options={departmentHeads}
                value={formData.selectedHead}
                onChange={(selected) => setFormData(prev => ({ ...prev, selectedHead: selected }))}
                placeholder="Choose department head..."
                isSearchable
                isDisabled={!formData.selectedDepartment}
                classNamePrefix="react-select"
              />
            </div>
          )}

          {/* Employee Selection */}
          <div className="col-12">
            <label className="form-label fw-semibold">Assign to Employees</label>
            <Select
              options={employees}
              value={formData.selectedEmployees}
              onChange={(selected) => setFormData(prev => ({ ...prev, selectedEmployees: selected || [] }))}
              placeholder="Choose employees..."
              isMulti
              isSearchable
              isDisabled={!formData.selectedDepartment}
              classNamePrefix="react-select"
            />
          </div>

          {/* Tickets Selection */}
          <div className="col-12">
            <label className="form-label fw-semibold">Select Tickets to Assign</label>
            <div className="border rounded p-3">
              <DataTable
                columns={ticketColumns}
                data={tickets}
                selectableRows={false}
                highlightOnHover
                responsive
                noDataComponent="No unassigned tickets available"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={loading || selectedTickets.length === 0}
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
