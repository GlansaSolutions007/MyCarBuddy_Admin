import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const ForwardLeadsLayer = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userDetails = JSON.parse(localStorage.getItem("employeeData"));

  const [leads, setLeads] = useState([]);
  const [leadCount, setLeadCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [filteredLeads, setFilteredLeads] = useState([]);
  
  // Forward Specific States
  const [fromEmployee, setFromEmployee] = useState(null);
  const [toEmployee, setToEmployee] = useState(null);
  const [reason, setReason] = useState("");
  const [roleName, setRoleName] = useState({ value: "Telecaller", label: "Telecaller" });
  const [roles, setRoles] = useState([]);
  const [isRoleLocked, setIsRoleLocked] = useState(false);

  // ===== FETCH LEADS FOR SELECTED EMPLOYEE =====
  const fetchLeads = async () => {
    if (!fromEmployee) {
        setLeads([]);
        return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}Leads`);
      const data = await response.json();
      
      // Filter leads assigned to the 'From Employee'
      const mappedData = data
        .filter((lead) => Number(lead.Emp_Assign) === Number(fromEmployee.value))
        .map((lead) => ({
            Id: lead.Id,
            LeadTrackId: lead.Id,
            CustomerName: lead.FullName || "",
            PhoneNumber: lead.PhoneNumber || "",
            Email: lead.Email || "",
            City: lead.City || "",
            Platform: lead.Platform || "",
            CreatedDate: lead.CreatedDate,
            StatusName: lead.LeadStatus || "Assigned",
            Description: lead.Description,
        }));

      setLeads(mappedData.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)));
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH ALL EMPLOYEES =====
  const fetchAllEmployees = async () => {
  try {
    const res = await axios.get(`${API_BASE}Employee`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const empArray = Array.isArray(res.data)
      ? res.data
      : res.data.data || [];

    // ✅ Employees list (with phone)
    const empList = empArray
  .filter(emp => emp.DepartmentName?.trim() === "Support") // ✅ filter here
  .map((emp) => ({
    value: emp.Id,
    label: `${emp.Name} (${emp.PhoneNumber}) - ${emp.RoleName}`,
    role: emp.RoleName,
  }));

    setEmployees(empList);

    // ✅ Extract unique roles
    const uniqueRoles = [
  ...new Map(
    empArray
      .filter(emp => emp.DepartmentName?.trim() === "Support") // ✅ same filter
      .map((emp) => [
        emp.RoleName,
        { value: emp.RoleName, label: emp.RoleName },
      ])
  ).values(),
];

    setRoles(uniqueRoles);

  } catch (error) {
    console.error("Failed to fetch employees:", error);
  }
};

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  // Re-fetch leads when the "From" person changes
  useEffect(() => {
    fetchLeads();
    setSelectedLeads([]);
    setLeadCount("");
  }, [fromEmployee]);

  // ===== FILTER LEADS (Date/Platform) =====
  useEffect(() => {
    let filtered = [...leads];
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(l => l.CreatedDate && new Date(l.CreatedDate) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(l => l.CreatedDate && new Date(l.CreatedDate) <= to);
    }
    if (platformFilter !== "All") {
      filtered = filtered.filter(l => l.Platform?.toLowerCase() === platformFilter.toLowerCase());
    }
    setFilteredLeads(filtered);
  }, [leads, fromDate, toDate, platformFilter]);

  // ===== AUTO-SELECT LEADS BY COUNT =====
  useEffect(() => {
    if (leadCount > 0 && filteredLeads.length > 0) {
      const autoSelected = filteredLeads.slice(0, leadCount).map((l) => l.Id);
      setSelectedLeads(autoSelected);
    } else if (leadCount === 0 || leadCount === "") {
        setSelectedLeads([]);
    }
  }, [leadCount, filteredLeads]);

  // ===== HANDLE FORWARD (TRANSFER) =====
  const handleForwardLeads = async () => {
    if (!fromEmployee || !toEmployee) return Swal.fire("Warning", "Select both From and To employees", "warning");
    if (selectedLeads.length === 0) return Swal.fire("Warning", "Select at least one lead", "warning");
    if (!reason.trim()) return Swal.fire("Warning", "Reason for transfer is mandatory", "warning");

    try {
      setLoading(true);
      const payload = {
        leadIds: selectedLeads.join(","), // Bulk comma separated
        fromEmployeeId: fromEmployee.value,
        toEmployeeId: toEmployee.value,
        roleName: roleName.value,
        createdBy: userDetails?.Id || 1,
        reason: reason,
      };

      await axios.post(`${API_BASE}Leads/TransferLead`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Leads forwarded successfully!", "success").then(() => {
        setReason("");
        setLeadCount("");
        fetchLeads();
      });
    } catch (error) {
      Swal.fire("Error", "Failed to forward leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const leadColumns = [
    {
      name: "Select",
      cell: (row) => (
        <input
          type="checkbox"
          className="form-check-input"
          style={{ width: "18px", height: "18px", cursor: "pointer" }}
          checked={selectedLeads.includes(row.Id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedLeads((prev) => [...prev, row.Id]);
            else setSelectedLeads((prev) => prev.filter((id) => id !== row.Id));
          }}
        />
      ),
      width: "90px",
    },
    {
      name: "Lead ID",
      selector: (row) => <Link to={`/lead-view/${row.LeadTrackId}`} className="text-primary">{row.LeadTrackId}</Link>,
      sortable: true,
      width: "150px"
    },
    { name: "Cust. Name", selector: (row) => row.CustomerName, sortable: true, width: "150px" },
    { name: "Phone", selector: (row) => row.PhoneNumber || "-", width: "150px" },
    { name: "Platform", selector: (row) => row.Platform || "-", width: "120px" },
    {
      name: "Created Date",
      cell: (row) => <span>{row.CreatedDate ? new Date(row.CreatedDate).toLocaleDateString("en-GB") : "-"}</span>,
      sortable: true,
      width: "150px"
    },
    { name: "Description", selector: (row) => row.Description, wrap: true, width: "200px" },
  ];

  useEffect(() => {
  if (!userDetails) return;

  const userRole = userDetails.RoleName?.trim();

  if (userRole === "Telecaller" || userRole === "Telecaller Head") {
    setRoleName({ value: "Telecaller", label: "Telecaller" });
    setIsRoleLocked(true); // 🔒 lock dropdown
  }
}, []);

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        
        {/* Header Stats & Filters */}
        <div className="row g-3 align-items-end mb-1">
          <div className="col-md-6 d-flex gap-3">
            <div>
              <label className="form-label fw-semibold">Employee's Total Leads:</label>
              <span className="fw-bold text-primary fs-5 ms-3">{filteredLeads.length}</span>
            </div>
            <div>
              <label className="form-label fw-semibold">Selected for Forward:</label>
              <span className="fw-bold text-success fs-5 ms-3">{selectedLeads.length}</span>
            </div>
          </div>
          <div className="col-md-6 d-flex gap-2 align-items-center flex-wrap justify-content-end">
            <label className="text-sm fw-semibold">Platform:</label>
            <select className="form-select radius-8 px-10 py-1 text-sm w-auto" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={{ textAlign: "center", minWidth: "110px" }}>
              <option value="All">All</option>
              <option value="Web">Web</option>
              <option value="App">App</option>
              <option value="Organic">Organic</option>
            </select>
            <label className="text-sm fw-semibold">From:</label>
            <input type="date" className="form-control radius-8 px-14 py-6 text-sm w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <label className="text-sm fw-semibold">To:</label>
            <input type="date" className="form-control radius-8 px-14 py-6 text-sm w-auto" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {/* Selection Logic Row 1 */}
        <div className="row g-3 align-items-end mt-2">
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">Select Role</label>
            <Select options={roles} value={roleName} placeholder="Select Role" onChange={setRoleName} isDisabled={isRoleLocked} classNamePrefix="react-select" />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">From Employee (Transfer From)</label>
            <Select
              options={employees.filter(
                (emp) => !roleName || emp.role === roleName.value
              )}
              value={fromEmployee}
              onChange={setFromEmployee}
              placeholder="Select Source Employee..."
              classNamePrefix="react-select"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">To Employee (Transfer To)</label>
            <Select options={employees.filter(e => e.value !== fromEmployee?.value)} value={toEmployee} onChange={setToEmployee} placeholder="Select Target Employee..." classNamePrefix="react-select" />
          </div>
        </div>

        {/* Selection Logic Row 2 */}
        <div className="row g-3 align-items-end mt-2">
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-1">Reason for Transfer <span className="text-danger">*</span></label>
            <input type="text" className="form-control" placeholder="Enter reason (e.g. Employee on leave)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold mb-1">Forward Count</label>
            <input type="number" className="form-control" placeholder="Count" value={leadCount} min={1} max={filteredLeads.length} onChange={(e) => setLeadCount(e.target.value)} />
          </div>
          <div className="col-md-3">
            <button type="button" className="btn btn-primary-600 radius-8 px-14 py-8 text-sm w-100" onClick={handleForwardLeads} disabled={loading}>
              {loading ? "Processing..." : "Forward Leads"}
            </button>
          </div>
        </div>

        {/* Lead Table */}
        <div className="col-12 mt-4">
          <label className="form-label fw-semibold">Leads Available for Transfer</label>
          <div className="border rounded p-3">
            <DataTable
              columns={leadColumns}
              data={filteredLeads}
              progressPending={loading}
              highlightOnHover
              responsive
              pagination
              striped
              persistTableHead
              noDataComponent={!fromEmployee ? "Please select a 'From Employee' to see leads" : "No leads found"}
            />
          </div>
        </div>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <button type="button" className="btn btn-secondary radius-8 px-14 py-6 text-sm" onClick={() => navigate("/dashboard")}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardLeadsLayer;