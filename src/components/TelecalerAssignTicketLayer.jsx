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
    selectedEmployee: null, // single employee now
  });

  // ===== INITIAL LOAD =====
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

  // ===== FETCH FUNCTIONS =====
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
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      Swal.fire("Error", "Unable to load departments", "error");
    }
  };
  


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
      if (Array.isArray(res.data)) {
        const empList = res.data.map((emp) => ({
          value: emp.Id,
          label: emp.Name,
        }));
        setEmployees(empList);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

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

  // ===== UTILITY =====
  const getTicketId = (ticket) =>
    ticket.TicketTrackId || ticket.TicketID || ticket.TicketId || ticket.Id;

  // ===== HANDLERS =====
  const handleDepartmentChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      selectedDepartment: selected,
      selectedHead: null,
      selectedEmployee: null,
    }));
    if (selected) fetchDepartmentHeads(selected.value);
    else setDepartmentHeads([]);
  };

  const handleTicketSelection = (ticket) => {
    const isSelected = selectedTickets.some(
      (t) => getTicketId(t) === getTicketId(ticket)
    );
    if (isSelected) {
      setSelectedTickets((prev) =>
        prev.filter((t) => getTicketId(t) !== getTicketId(ticket))
      );
    } else {
      setSelectedTickets((prev) => [...prev, ticket]);
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) setSelectedTickets(tickets);
    else setSelectedTickets([]);
  };

  // Indeterminate select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedTickets.length > 0 && selectedTickets.length < tickets.length;
  }, [selectedTickets, tickets]);

  // ===== ASSIGN HANDLER =====
  const handleAssign = async () => {
    if (selectedTickets.length === 0)
      return Swal.fire("Warning", "Please select at least one ticket", "warning");

    if (!formData.selectedDepartment)
      return Swal.fire("Warning", "Please select a department", "warning");

    if (role === "Admin" && !formData.selectedHead)
      return Swal.fire("Warning", "Please select a department head", "warning");

    // Build payload
    const payload = [
      {
        assignedBy: Number(userId),
        assignedToHead: formData.selectedHead?.value || null,
        assignedToEmp: formData.selectedEmployee?.value || null, // ✅ single employee only
        ticketIds: selectedTickets.map((t) => getTicketId(t)),
      },
    ];

    try {
      setLoading(true);
      console.log("Assign Payload:", payload);

      await axios.post(`${API_BASE}Ticket_Assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Tickets assigned successfully!", "success").then(() =>
        navigate("/telecaler-tickets")
      );
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      Swal.fire("Error", "Failed to assign ticket", "error");
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
          checked={selectedTickets.some(
            (t) => getTicketId(t) === getTicketId(row)
          )}
          onChange={() => handleTicketSelection(row)}
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

  // ===== UI =====
  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <div className="row g-3">
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

          <div className="col-12">
            <label className="form-label fw-semibold">
              Assign to Employee
            </label>
            <Select
              options={employees}
              value={formData.selectedEmployee}
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  selectedEmployee: selected || null,
                }))
              }
              placeholder="Choose employee..."
              isSearchable
              isMulti={false} // ✅ single employee only
              classNamePrefix="react-select"
            />
          </div>

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
              {loading ? "Assigning..." : "Assign Ticket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelecalerAssignTicketLayer;
