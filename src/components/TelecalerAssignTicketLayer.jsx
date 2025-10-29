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
  const [tickets, setTickets] = useState([]);
  const [ticketCount, setTicketCount] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    selectedDepartment: null,
    selectedHead: null,
  });

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (role === "Admin") {
      fetchDepartments();
    }
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
    } catch (error) {
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

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}Tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Filter only unassigned tickets
      if (Array.isArray(res.data)) {
        const unassignedTickets = res.data.filter(
          (t) => t.IsAssigned_head === false
        );
        setTickets(unassignedTickets);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  // ===== UTIL =====
  const getTicketId = (ticket) =>
    ticket.TicketTrackId || ticket.TicketID || ticket.TicketId || ticket.Id;

  // ===== HANDLERS =====
  const handleDepartmentChange = (selected) => {
    setFormData({
      ...formData,
      selectedDepartment: selected,
      selectedHead: null,
    });
    if (selected) fetchDepartmentHeads(selected.value);
  };

  const handleAssign = async () => {
    if (!formData.selectedDepartment)
      return Swal.fire("Warning", "Please select a department", "warning");

    if (!formData.selectedHead)
      return Swal.fire("Warning", "Please select a department head", "warning");

    if (!ticketCount || ticketCount <= 0)
      return Swal.fire("Warning", "Please enter a valid ticket count", "warning");

    if (tickets.length === 0)
      return Swal.fire("Info", "No unassigned tickets available", "info");

    // Sort tickets and pick top N
    const availableTickets = [...tickets].sort(
      (a, b) => getTicketId(a) - getTicketId(b)
    );
    const selectedTicketIds = availableTickets
      .slice(0, ticketCount)
      .map((t) => getTicketId(t));

    const payload = [
      {
        assignedBy: Number(userId),
        assignedToHead: formData.selectedHead.value,
        assignedToEmp: null,
        ticketIds: selectedTicketIds,
      },
    ];

    try {
      setLoading(true);
      await axios.post(`${API_BASE}Ticket_Assignments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success", "Tickets assigned successfully!", "success").then(() =>
        navigate("/telecaler-tickets")
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
        {/* ===== INLINE INPUTS ===== */}
        <div className="row g-3 align-items-end">
          {role === "Admin" && (
            <>
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-1">
                  Department
                </label>
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
                <label className="form-label fw-semibold mb-1">
                  Department Head
                </label>
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
          )}

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Ticket Count</label>
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

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Total Tickets</label>
            <div className="fw-bold text-primary fs-5">{tickets.length}</div>
          </div>
        </div>

        {/* ===== TICKET TABLE ===== */}
        <div className="col-12 mt-4">
          <label className="form-label fw-semibold">Available Tickets</label>
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

        {/* ===== ACTION BUTTONS ===== */}
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
  );
};

export default TelecalerAssignTicketLayer;
