import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const LeadsAssignLayer = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userDetails = JSON.parse(localStorage.getItem("employeeData"));

  const [departments, setDepartments] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [leads, setLeads] = useState([]);
  const [leadCount, setLeadCount] = useState();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [formData, setFormData] = useState({
    selectedDepartment: null,
    selectedHead: null,
    employees: [],
  });
  const [error, setError] = useState("");
  // ===== FETCH LEADS =====
  const fetchLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}Leads`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const mappedData = data.map((lead) => ({
        Id: lead.Id,
        LeadTrackId: lead.Id,
        CustomerName: lead.FullName || "",
        PhoneNumber: lead.PhoneNumber || "",
        Email: lead.Email || "",
        City: lead.City || "",
        Platform: lead.Platform || "",
        CreatedDate: lead.CreatedDate,
        StatusName: lead.LeadStatus || "Not Assigned",
        Description: lead.Description,
        TrackingHistory: [{ StatusName: lead.LeadStatus || "Not Assigned" }],
        IsAssigned_Head: lead.IsAssigned_Head,
        IsAssigned_Emp: lead.IsAssigned_Emp,
        Head_Assign: lead.Head_Assign,
        Emp_Assign: lead.Emp_Assign,
      }));

      // Filter based on role
      let filteredData = mappedData;
      if (role === "Admin") {
        // Show unassigned leads (null or 0)
        filteredData = mappedData.filter(
          (lead) =>
            (lead.IsAssigned_Head == null || lead.IsAssigned_Head == 0) &&
            (lead.IsAssigned_Emp == null || lead.IsAssigned_Emp == 0)
        );
      } else if (userDetails?.Is_Head === 1) {
        // Show leads assigned to this head and not assigned to employee
        filteredData = mappedData.filter(
          (lead) =>
            Number(lead.Head_Assign) === Number(userDetails.Id) &&
            (lead.IsAssigned_Emp == null || lead.IsAssigned_Emp == 0)
        );
      } else {
        // Employee: Show leads assigned to this employee
        filteredData = mappedData.filter(
          (lead) => lead.Emp_Assign === userDetails.Id
        );
      }
      filteredData = [...filteredData].sort(
        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
      );

      setLeads(filteredData);
    } catch (err) {
      setError("Failed to fetch leads. Please try again.");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (role === "Admin") {
      fetchDepartments();
    }
    fetchAllEmployees();
    fetchLeads();
  }, [role]);

  // ===== FILTER LEADS BY DATE AND STATUS =====
  useEffect(() => {
    let filtered = [...leads];
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(
        (lead) => lead.CreatedDate && new Date(lead.CreatedDate) >= from
      );
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (lead) => lead.CreatedDate && new Date(lead.CreatedDate) <= to
      );
    }
    if (platformFilter !== "All") {
      if (platformFilter === "Others") {
        filtered = filtered.filter(
          (lead) =>
            lead.Platform &&
            !["web", "app", "organic"].includes(lead.Platform.toLowerCase())
        );
      } else {
        filtered = filtered.filter(
          (lead) =>
            lead.Platform &&
            lead.Platform.toLowerCase() === platformFilter.toLowerCase()
        );
      }
    }
    setFilteredLeads(filtered);
    setSelectedLeads([]);
  }, [leads, fromDate, toDate, platformFilter]);

  // ===== FETCH FUNCTIONS =====
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.status && Array.isArray(res.data.data)) {
        const supportDepts = res.data.data.filter(
          (dept) => dept.DepartmentName?.trim().toLowerCase() === "support"
        );

        setDepartments(
          supportDepts.map((dept) => ({
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

  // ===== UTIL =====
  const getLeadId = (lead) => lead.Id;

  // ===== HANDLERS =====
  const handleDepartmentChange = (selected) => {
    setFormData({
      ...formData,
      selectedDepartment: selected,
      selectedHead: null,
    });
    if (selected) fetchDepartmentHeads(selected.value);
  };

  const handleEmployeeSelect = (selectedOptions) => {
    const newEmployees = selectedOptions
      ? selectedOptions.map((opt) => ({
          id: opt.value,
          name: opt.label,
          count: leadCount ? Number(leadCount) : 1,
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

    let selectedLeadIds = [];
    if (selectedLeads.length > 0) {
      selectedLeadIds = selectedLeads;
    } else {
      if (!leadCount || leadCount <= 0)
        return Swal.fire(
          "Warning",
          "Please enter a valid lead count or select leads",
          "warning"
        );
      if (filteredLeads.length === 0)
        return Swal.fire("Info", "No unassigned leads available", "info");

      // Select first leadCount leads
      selectedLeadIds = filteredLeads
        .slice(0, leadCount)
        .map((l) => getLeadId(l));
    }

    try {
      setLoading(true);

      if (role === "Admin") {
        // Assign to head
        const payload = {
          leadIds: selectedLeadIds,
          head_Assign: formData.selectedHead.value,
        };
        await axios.post(`${API_BASE}Leads/AssignLeadsToHead`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (userDetails?.Is_Head === 1) {
        const empList = formData.employees;

        if (empList.length === 0) {
          return Swal.fire(
            "Warning",
            "Please select at least one employee",
            "warning"
          );
        }
        if (empList.length > selectedLeadIds.length) {
          return Swal.fire({
            icon: "warning",
            title: "Invalid Assignment",
            text: "Number of selected employees cannot be greater than number of leads.",
          });
        }

        const totalLeads = selectedLeadIds.length;
        const totalEmployees = empList.length;

        const baseCount = Math.floor(totalLeads / totalEmployees);
        const remainder = totalLeads % totalEmployees;

        let leadIndex = 0;

        for (let i = 0; i < empList.length; i++) {
          const emp = empList[i];

          // First `remainder` employees get +1 lead
          const assignCount = i < remainder ? baseCount + 1 : baseCount;

          const leadsForEmp = selectedLeadIds.slice(
            leadIndex,
            leadIndex + assignCount
          );

          if (leadsForEmp.length === 0) break;

          const payload = {
            leadIds: leadsForEmp,
            emp_Assign: emp.id,
          };

          await axios.post(`${API_BASE}Leads/AssignLeadsToEmployee`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          leadIndex += assignCount;
        }
      }

      Swal.fire("Success", "Leads assigned successfully!", "success").then(
        () => {
          fetchLeads();
          setSelectedLeads([]);
          setLeadCount("");
          setFormData((prev) => ({ ...prev, employees: [] }));
        }
      );
    } catch (error) {
      console.error("Failed to assign leads:", error);
      Swal.fire("Error", "Failed to assign leads", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-select first N leads when leadCount changes
  useEffect(() => {
    if (leadCount > 0 && filteredLeads.length > 0) {
      const autoSelected = filteredLeads
        .slice(0, leadCount)
        .map((l) => getLeadId(l));
      setSelectedLeads(autoSelected);
    } else {
      setSelectedLeads([]);
    }
  }, [leadCount, filteredLeads]);

  // ===== TABLE COLUMNS =====
  const leadColumns = [
    ...(role === "Admin" || userDetails?.Is_Head === 1
      ? [
          {
            name: "Select",
            cell: (row) => (
              <input
                type="checkbox"
                className="form-check-input"
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                checked={selectedLeads.includes(getLeadId(row))}
                onChange={(e) => {
                  const leadId = getLeadId(row);
                  if (e.target.checked) {
                    setSelectedLeads((prev) => [...prev, leadId]);
                  } else {
                    setSelectedLeads((prev) =>
                      prev.filter((id) => id !== leadId)
                    );
                  }
                }}
              />
            ),
            width: "80px",
            ignoreRowClick: true,
          },
        ]
      : []),
    {
      name: "Lead ID",
      selector: (row) => <span>{row.LeadTrackId}</span>,
    },
    {
      name: "Customer",
      selector: (row) => <span>{row.CustomerName}</span>,
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber || "-",
    },
    {
      name: "Email",
      selector: (row) => row.Email || "-",
    },
    {
      name: "City",
      selector: (row) => row.City || "-",
    },
    {
      name: "Platform",
      selector: (row) => row.Platform || "-",
    },
    {
      name: "Created Date",
      cell: (row) => (
        <span>
          {row.CreatedDate
            ? new Date(row.CreatedDate).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-"}
        </span>
      ),
      wrap: true,
    },
    {
      name: "Description",
      selector: (row) => row.Description,
      wrap: true,
      width: "200px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <Link
            to={`/lead-view/${row.Id}`}
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
        {hasPermission("assignleads_edit") && (
          <div className="row g-3 align-items-end mb-1">
            <div className="col-md-6 d-flex gap-3">
              <div>
                <label className="form-label fw-semibold">
                  Total Unassigned Leads :{" "}
                </label>
                <span
                  className="fw-bold text-primary fs-5"
                  style={{ marginLeft: "20px" }}
                >
                  {filteredLeads.length}
                </span>
              </div>
              <div>
                <label className="form-label fw-semibold">
                  Selected Leads :{" "}
                </label>
                <span
                  className="fw-bold text-primary fs-5"
                  style={{ marginLeft: "20px" }}
                >
                  {selectedLeads.length}
                </span>
              </div>
            </div>
            <div className="col-md-6 d-flex gap-2 align-items-center mr-20 flex-wrap justify-content-end">
              <label className="text-sm fw-semibold">Platform:</label>
              <select
                className="form-select radius-8 px-10 py-1 text-sm w-auto"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                style={{ textAlign: "center", minWidth: "110px" }}
              >
                <option value="All">All</option>
                <option value="Web">Web</option>
                <option value="App">App</option>
                <option value="Organic">Organic</option>
                <option value="Others">Others</option>
              </select>
              <label className="text-sm fw-semibold">From:</label>
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control radius-8 px-14 py-6 text-sm w-auto"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <label className="text-sm fw-semibold">To:</label>
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control radius-8 px-14 py-6 text-sm w-auto"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="row g-3 align-items-end">
          {hasPermission("assignleads_edit") && role === "Admin" ? (
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
          ) : userDetails?.Is_Head === 1 &&
            hasPermission("assignleads_edit") ? (
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
          {(role === "Admin" || userDetails?.Is_Head === 1) &&
            hasPermission("assignleads_edit") && (
              <>
                <div className="col-md-2 position-relative min-h-90">
                  <label className="form-label fw-semibold mb-1">
                    Lead Count
                  </label>
                  <input
                    type="number"
                    className={`form-control ${
                      leadCount > filteredLeads.length ? "border-danger" : ""
                    }`}
                    placeholder="Enter count"
                    value={leadCount}
                    min={1}
                    max={filteredLeads.length}
                    onChange={(e) => setLeadCount(Number(e.target.value))}
                  />
                  {leadCount > filteredLeads.length && (
                    <small
                      className="text-danger position-absolute"
                      style={{ bottom: "-18px", fontSize: "12px" }}
                    >
                      Entered count exceeds total leads
                    </small>
                  )}
                </div>
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-primary-600 radius-8 px-14 py-6 text-sm w-100"
                    onClick={handleAssign}
                    // disabled={loading}
                    disabled={formData.employees.length > selectedLeads.length}
                  >
                    {loading ? "Assigning..." : "Assign Leads"}
                  </button>
                </div>
              </>
            )}
        </div>

        <div className="col-12 mt-4">
          <label className="form-label fw-semibold">
            {role === "Employee" ? "Assigned Leads" : "Available Leads"}
          </label>
          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
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
                noDataComponent={
                  loading
                    ? "Loading leads..."
                    : role === "Employee"
                    ? "No assigned leads available"
                    : "No unassigned leads available"
                }
              />
            </div>
          )}
        </div>

        {(role === "Admin" || userDetails?.Is_Head === 1) && (
          <div className="d-flex justify-content-center gap-3 mt-4 d-none">
            <button
              type="button"
              className="btn btn-secondary radius-8 px-14 py-6 text-sm"
              onClick={() => navigate("/leads")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? "Assigning..." : "Assign Leads"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsAssignLayer;
