import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";
import * as XLSX from "xlsx";
import Select from "react-select";

const API_BASE = import.meta.env.VITE_APIURL;
const CHUNK_SIZE = 100; // Fetch 100 at a time as requested

const OrganicLeadsLayer = () => {
  const { hasPermission } = usePermissions();
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const roleName = employeeData?.RoleName;
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [allLeads, setAllLeads] = useState([]); // Master cache 
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateType, setDateType] = useState("created");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [callOutcome, setCallOutcome] = useState("");
  const [employees, setEmployees] = useState([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedTransferRole, setSelectedTransferRole] = useState("Telecaller");
  const [fromEmployee, setFromEmployee] = useState(null);
  const [toEmployee, setToEmployee] = useState(null);
  const [forwardReason, setForwardReason] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const { status } = useParams();
  const decodedStatus = status ? decodeURIComponent(status) : "";

  // 1. Core Fetch Logic (Handles Chunking)
  const fetchLeadsChunk = useCallback(async (targetPage) => {
    // Determine which chunk of 100 is needed based on the page clicked
    const currentItemIndex = (targetPage - 1) * pageSize;
    const chunkIndex = Math.floor(currentItemIndex / CHUNK_SIZE) + 1;

    setLoading(true);
    try {
      let url;
      const queryParams = `pageNumber=${chunkIndex}&pageSize=${CHUNK_SIZE}`;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const newData = data.data || data;

      setTotalRows(data.totalCount || 0);

      // Save chunk into the master array at correct positions
      setAllLeads((prev) => {
        const updated = [...prev];
        const startAt = (chunkIndex - 1) * CHUNK_SIZE;
        newData.forEach((item, index) => {
          updated[startAt + index] = item;
        });
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [role, employeeData?.Id, employeeData?.RoleName, pageSize]);

  // 2. Initial load and Page Change listener
  useEffect(() => {
    if (isSearching) return;
    if (totalRows === 0 && allLeads.length === 0) return;

    const startItem = (pageNumber - 1) * pageSize;
    const endItem = pageNumber * pageSize;

    const slice = allLeads.slice(startItem, endItem).filter(Boolean);

    if (slice.length === 0) {
      fetchLeadsChunk(pageNumber);
    }
  }, [pageNumber, pageSize]);


  useEffect(() => {

    const delayDebounce = setTimeout(() => {

      if (
        searchText ||
        platformFilter !== "All" ||
        fromDate ||
        toDate ||
        callOutcome
      ) {
        setPageNumber(1);
        fetchSearchLeads(searchText, 1);
      } else {
        setIsSearching(false);
        setSearchResults([]);
        fetchLeadsChunk(1);
      }

    }, 400);

    return () => clearTimeout(delayDebounce);

  }, [searchText, platformFilter, fromDate, toDate, dateType, callOutcome]);

  // Reset logic when filters change
  useEffect(() => {
    setAllLeads([]);
    setTotalRows(0);
    setPageNumber(1);
  }, []);

  const fetchAllEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const empArray = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      const supportEmployees = empArray
        .filter(
          (emp) => emp.DepartmentName?.trim() === "Support"
        )
        .map((emp) => ({
          value: emp.Id,
          label: `${emp.Name} (${emp.PhoneNumber}) - ${emp.RoleName}`,
          role: emp.RoleName?.trim(),
        }));

      setEmployees(supportEmployees);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  const handlePageChange = (page) => {
    setPageNumber(page);
    if (isSearching) {
      fetchSearchLeads(searchText, page);
    }
  };

  const handleRowsChange = (newSize) => {
    setPageSize(newSize);
    setAllLeads([]); // Reset cache to prevent indexing mismatch
    setPageNumber(1);
  };

  const filteredLeads = allLeads.filter(Boolean);

  const closeForwardModal = () => {
    setShowForwardModal(false);
    setSelectedLead(null);
    setSelectedTransferRole("Telecaller");
    setFromEmployee(null);
    setToEmployee(null);
    setForwardReason("");
  };

  const getAvailableTransferRoles = useCallback((row) => {
    if (!row) return [];

    const hasTelecaller = Boolean(
      row.EmployeeAssignName || row.EmployeeAssignId || row.Emp_Assign || row.EmployeeId
    );
    const hasTelecallerHead = Boolean(
      row.HeadAssignName || row.HeadAssignId || row.HeadEmployeeId
    );

    const roles = [];

    if (hasTelecaller) {
      roles.push("Telecaller");
    }

    if (hasTelecallerHead) {
      roles.push("Telecaller Head");
    }

    return roles;
  }, []);

  const getAutoFromEmployee = useCallback((row, roleValue) => {
    if (!row) return null;

    const assignedEmployeeId = roleValue === "Telecaller Head"
      ? row.HeadAssignId || row.HeadEmployeeId
      : row.EmployeeAssignId || row.Emp_Assign || row.EmployeeId;

    const assignedEmployeeName = roleValue === "Telecaller Head"
      ? row.HeadAssignName
      : row.EmployeeAssignName;

    return (
      employees.find(
        (emp) =>
          emp.role === roleValue &&
          Number(emp.value) === Number(assignedEmployeeId)
      ) ||
      employees.find(
        (emp) =>
          emp.role === roleValue &&
          emp.label.includes(assignedEmployeeName || "")
      ) ||
      null
    );
  }, [employees]);

  const openForwardModal = (row) => {
    const availableRoles = getAvailableTransferRoles(row);

    if (availableRoles.length === 0) {
      return;
    }

    const defaultRole = availableRoles[0];

    setSelectedLead(row);
    setSelectedTransferRole(defaultRole);
    setFromEmployee(getAutoFromEmployee(row, defaultRole));
    setToEmployee(null);
    setShowForwardModal(true);
  };

  useEffect(() => {
    if (!selectedLead || !showForwardModal) return;

    setFromEmployee(getAutoFromEmployee(selectedLead, selectedTransferRole));
    setToEmployee(null);
  }, [selectedTransferRole, selectedLead, showForwardModal, getAutoFromEmployee]);

  const handleForwardLead = async () => {
    if (!selectedLead) return;

    if (!fromEmployee || !toEmployee) {
      Swal.fire("Warning", `Select both From and To ${selectedTransferRole}`, "warning");
      return;
    }

    if (Number(fromEmployee.value) === Number(toEmployee.value)) {
      Swal.fire("Warning", "From and To telecaller cannot be the same", "warning");
      return;
    }

    if (!forwardReason.trim()) {
      Swal.fire("Warning", "Reason is required", "warning");
      return;
    }

    try {
      setIsForwarding(true);

      const payload = {
        leadIds: String(selectedLead.Id),
        fromEmployeeId: fromEmployee.value,
        toEmployeeId: toEmployee.value,
        roleName: selectedTransferRole,
        createdBy: employeeData?.Id || 1,
        reason: forwardReason.trim(),
      };

      await axios.post(`${API_BASE}Leads/TransferLead`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Lead forwarded successfully!", "success");
      closeForwardModal();
      if (isSearching) {
        fetchSearchLeads(searchText, pageNumber);
      } else {
        fetchLeadsChunk(pageNumber);
      }
    } catch (error) {
      console.error("Failed to forward lead:", error);
      Swal.fire("Error", "Failed to forward lead", "error");
    } finally {
      setIsForwarding(false);
    }
  };

  const displayLeads = useMemo(() => {

    // ✅ SERVER SIDE SEARCH / FILTER MODE
    if (isSearching) {
      return searchResults;
    }

    // ✅ NORMAL CHUNK CACHE MODE
    return allLeads
      .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
      .filter(Boolean);

  }, [isSearching, searchResults, allLeads, pageNumber, pageSize]);

  const roleBasedEmployees = useMemo(
    () =>
      employees.filter(
        (emp) =>
          emp.role === "Telecaller" || emp.role === "Telecaller Head"
      ),
    [employees]
  );

  const filteredRoleEmployees = useMemo(
    () =>
      roleBasedEmployees.filter((emp) => emp.role === selectedTransferRole),
    [roleBasedEmployees, selectedTransferRole]
  );

  const availableTransferRoles = useMemo(
    () => getAvailableTransferRoles(selectedLead),
    [selectedLead, getAvailableTransferRoles]
  );


  // Columns Configuration (Preserved your design)
  const columns = [
    {
      name: "Lead ID",
      cell: (row) => (
        <div
          className="d-flex align-items-center gap-1"
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) => {
            const arrow = e.currentTarget.querySelector(".arrow-icon");
            if (arrow) arrow.style.transform = "translateX(8px)";
          }}
          onMouseLeave={(e) => {
            const arrow = e.currentTarget.querySelector(".arrow-icon");
            if (arrow) arrow.style.transform = "translateX(0px)";
          }}
        >
          <Link
            to={`/lead-view/${row.Id}`}
            className="text-primary fw-semibold d-flex align-items-center"
            style={{ textDecoration: "none" }}
          >
            {row.Id}
          </Link>

          <Icon
            icon="mdi:arrow-right"
            width="18"
            className="text-primary arrow-icon"
            style={{
              transition: "transform 0.3s ease",
            }} 
          />
        </div>
      ),
      sortable: true,
      width: "150px",
    },
    { name: "Customer Name", selector: (row) => row.FullName || "-", sortable: true, wrap: true, width: "180px" },
    { name: "Phone Number", selector: (row) => row.PhoneNumber || "-", sortable: true, width: "150px" },
    { name: "Email", selector: (row) => row.Email || "-", sortable: true, wrap: true, width: "180px" },
    {
      name: "Lead Status",
      width: "150px",
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {row.FollowUpStatus || "No FollowUp Yet"} 
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>
            {row.NextAction || ""}
          </div>
        </div>
      ),
    },
    {
      name: "Next Follow-up",
      sortable: true,
      sortField: "NextFollowUp_Date",
      width: "180px",
      cell: (row) => {
        if (!row.NextFollowUp_Date) {
          return <span style={{ color: "#9ca3af" }}>-</span>;
        }

        const now = new Date();
        const followUpDate = new Date(row.NextFollowUp_Date);

        const diffMs = followUpDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        let status = {
          label: "Upcoming",
          color: "#22c55e",
          bg: "rgba(34,197,94,0.1)",
          // icon: "✅",
        };

        if (diffMs < 0) {
          status = {
            label: "Overdue",
            color: "#ef4444",
            bg: "rgba(239,68,68,0.1)",
            // icon: "⚠️",
          };
        } else if (diffHours <= 24) {
          status = {
            label: "Due Soon",
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.1)",
            // icon: "⏳",
          };
        }

        const getTimeText = () => {
          if (diffMs < 0) {
            return `${Math.abs(Math.floor(diffHours))}h ago`;
          }
          if (diffHours < 24) {
            return `${Math.ceil(diffHours)}h left`;
          }
          return `${Math.ceil(diffDays)}d left`;
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* Date */}
            <div style={{ fontWeight: 600, fontSize: "13px", color: "#1f2937" }}>
              {followUpDate.toLocaleString("en-GB")}
            </div>

            {/* Status Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: status.color,
                background: status.bg,
                padding: "3px 10px",
                borderRadius: "999px",
                width: "fit-content",
              }}
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
              <span style={{ opacity: 0.7 }}>• {getTimeText()}</span>
            </div>
          </div>
        );
      },
    },
    {
      name: "Created Date",
      selector: (row) => row.CreatedDate
      ? new Date(row.CreatedDate).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-",
      sortable: true,
      sortField: "CreatedDate",
      width: "160px",
    },
    // {
    //   name: "Assigned Date",
    //   selector: (row) => {
    //     if (row.AssignedDate) {
    //       return new Date(row.AssignedDate).toLocaleString("en-GB");
    //     }
    //     const headDate = row.HeadAssignDate ? new Date(row.HeadAssignDate) : null;
    //     const empDate = row.EmployeeAssignDate ? new Date(row.EmployeeAssignDate) : null;

    //     if (headDate && empDate) {
    //       return new Date(Math.min(headDate, empDate)).toLocaleString("en-GB");
    //     }
    //     if (headDate) {
    //       return new Date(headDate).toLocaleString("en-GB");
    //     }
    //     if (empDate) {
    //       return new Date(empDate).toLocaleString("en-GB");
    //     }
    //     return "-";
    //   },
    //   sortable: true,
    //   width: "150px",
    // },
    { name: "Updated Date", selector: (row) => row.Updated_At ? new Date(row.Updated_At).toLocaleString("en-GB") : "-", sortable: true, width: "160px" },
    { name: "City", selector: (row) => row.City || "-", sortable: true, width: "180px" },
    { name: "Platform", selector: (row) => row.Platform || "-", width: "120px" },
    {
        name: "Telecaller Head Assigned on",
        selector: (row) =>
        (
          <div>
            <div style={{ fontWeight: 600 }}>
              {row.HeadAssignName || "-"}
            </div>
            <div style={{ fontSize: "12px", color: "#6c757d" }}>
              {row.HeadAssignDate
                ? new Date(row.HeadAssignDate).toLocaleString("en-GB")
                : "-"}
            </div>
          </div>
        ),
        width: "170px",
      },

    ...(employeeData?.RoleName !== "Telecaller"
      ? [{
      name: "Telecaller Employee Assigned on", selector: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {row.EmployeeAssignName || "-"}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>
            {row.EmployeeAssignDate
              ? new Date(row.EmployeeAssignDate).toLocaleString("en-GB")
              : "-"}
          </div>
        </div>
      ), width: "170px"
    }]
      : []),
    // {
    //   name: "Lead Category",
    //   cell: (row) => {
    //     const clicked = row.BookingAddOns?.filter((addon) => addon.IsUserClicked === true);
    //     return clicked?.length > 0 ? (
    //       <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
    //         {clicked.map((addon) => <span key={addon.AddOnId}>{addon.ServiceName}</span>)}
    //       </div>
    //     ) : <span>-</span>;
    //   },
    //   minWidth: "200px",
    // },
    ...(hasPermission("leadview_view") ? [
      {
        name: "Action",
        cell: (row) => (
          <>
            <Link to={`/lead-view/${row.Id}`} title="View Lead" className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center">
              <Icon icon="lucide:eye" />
            </Link>
            {getAvailableTransferRoles(row).length > 0 && (
              <button
                type="button"
                className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center border-0"
                onClick={() => openForwardModal(row)}
                title="Forward Lead"
              >
                <Icon icon="flowbite:forward-outline" />
              </button>
            )}
          </>
        ),
        button: true,
      },
    ] : []),
  ];

  // Excel Export Logic (Preserved)
  const exportToExcel = async () => {
    try {
      setLoading(true);

      let queryParams = "";

      // search text
      if (searchText) {
        queryParams += `&searchText=${encodeURIComponent(searchText)}`;
      }

      // platform filter
      if (platformFilter !== "All") {
        queryParams += `&platform=${platformFilter}`;
      }

      // date filters
      if (fromDate) {
        queryParams += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        queryParams += `&toDate=${toDate}`;
      }

      if (fromDate || toDate) {
        const apiDateType =
          dateType === "ModifiedDate"
            ? "ModifiedDate"
            : "CreatedDate";

        queryParams += `&DateType=${apiDateType}`;
      }

      let url;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/ExportLeadsWithQuestions?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/ExportLeadsWithQuestions?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const response = await axios.get(url, {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `leads_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Excel export failed", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API_BASE}Leads/UploadExcel`, formData);
      Swal.fire("Success", "Bulk Upload Completed", "success");
      setAllLeads([]); // Clear cache to refresh data
      fetchLeadsChunk(1);
    } catch (err) {
      Swal.fire("Error", "Upload Failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const fetchSearchLeads = useCallback(async (text = "", page = 1) => {

    setLoading(true);
    setIsSearching(true);

    try {
      let queryParams = `pageNumber=${page}&pageSize=${CHUNK_SIZE}`;

      // ✅ search text
      if (text) {
        queryParams += `&searchText=${encodeURIComponent(text)}`;
      }

      // ✅ platform filter
      if (platformFilter !== "All") {
        queryParams += `&platform=${platformFilter}`;
      }

      if (callOutcome) {
        queryParams += `&Status=${encodeURIComponent(callOutcome)}`;
      }

      // ✅ NEW → Date Filters (SERVER SIDE)
      if (fromDate) {
        queryParams += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        queryParams += `&toDate=${toDate}`;
      }

      if (fromDate || toDate) {
        const apiDateType = dateType === "CreatedDate"
          ? "CreatedDate"
          : "ModifiedDate";

        queryParams += `&DateType=${apiDateType}`;
      }

      let url;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      setSearchResults(data.data || data);
      setTotalRows(data.totalCount || 0);

    } catch (err) {
      console.error(err);
      setError("Search failed");
    } finally {
      setLoading(false);
    }

  }, [role, employeeData, platformFilter, fromDate, toDate, dateType]);

  useEffect(() => {
    if (decodedStatus) {
      setCallOutcome(decodedStatus);   // set dropdown
      setSearchText("");               // optional reset
      setPlatformFilter("All");        // optional reset
      setFromDate("");
      setToDate("");
      setPageNumber(1);
    } else {
      setCallOutcome("");
    }
  }, [decodedStatus]);


  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden py-3">
          <div className="card-header">
            <div className="d-flex flex-column gap-2">

              {/* 🔹 First Row */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                {/* Search */}
                <form className="navbar-search">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Leads, Name, Phone, Email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <Icon icon="ion:search-outline" className="icon" />
                </form>
                 {/* ✅ RIGHT SIDE */}
                 <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  id="organicUpload"
                  style={{ display: "none" }}
                  onChange={handleBulkUpload}
                />
                  {(role === "Admin" || roleName === "Telecaller Head") && (
                    <button
                      className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                      onClick={() =>
                        document.getElementById("organicUpload").click()
                      }
                      disabled={uploading}
                    >
                      <Icon icon="mdi:upload" className="icon text-xl" /> Bulk Upload
                    </button>
                  )}

                  {hasPermission("createlead_add") && (
                    <Link
                      to="/create-lead"
                      className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                    >
                      <Icon icon="ic:baseline-plus" className="icon text-xl" /> Add Lead
                    </Link>
                  )}

                  <button
                    className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    onClick={exportToExcel}
                  >
                    <Icon icon="mdi:microsoft-excel" width="22" height="22" />
                  </button>

                </div>

               
              </div>

              {/* 🔹 Second Row */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                {/* ✅ LEFT SIDE */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="text-sm fw-semibold mb-0">
                    Date Type:
                  </label>
                  <select
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={dateType}
                    onChange={(e) => setDateType(e.target.value)}
                  >
                    <option value="CreatedDate">Created Date</option>
                    <option value="ModifiedDate">Updated Date</option>
                  </select>
                  <label className="text-sm fw-semibold mb-0">From:</label>
                  <input
                    type="date"
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />

                  <label className="text-sm fw-semibold mb-0">To:</label>
                  <input
                    type="date"
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />


                </div>

                 {/* Lead Status + Date Type */}
                 <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="text-sm fw-semibold mb-0">
                    Lead Status:
                  </label>

                  <select
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="No Follow Up">No Follow Up</option>
                    <option value="Need More Info">Need More Info</option>
                    <option value="Next Follow Up">Next Follow-up</option>
                    <option value="Converted to Customer">Converted to Customer</option>
                    <option value="Not Converted">Not Converted</option>
                    <option value="Not Having Car">Not Having Car</option>
                    <option value="Ringing But Not Responded">Ringing But Not Responded</option>
                    <option value="Busy">Busy</option>
                    <option value="Not Reachable">Not Reachable</option>
                    <option value="Switched Off">Switched Off</option>
                    <option value="Temporary Out of Service">Temporary Out of Service</option>
                    <option value="Number Does Not Exist">Number Does Not Exist</option>
                    <option value="DND">DND</option>
                  </select>

                  <label className="text-sm fw-semibold mb-0">Platform:</label>
                  <select
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Organic">Organic</option>
                    <option value="Web">Web</option>
                    <option value="App">App</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {uploading && <div className="m-3">Uploading...</div>}

          <DataTable
            columns={columns}
            data={displayLeads}
            progressPending={loading}
            pagination
            paginationServer
            paginationPerPage={pageSize}
            paginationTotalRows={totalRows}
            paginationDefaultPage={pageNumber}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsChange}
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
          />
        </div>
      </div>

      {showForwardModal && (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
          inset: 0,
          width: "100vw",
          minHeight: "100vh",
          margin: 0,
          padding: "24px 16px",
          backgroundColor: "rgba(30, 41, 59, 0.58)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: 1060,
          overflowY: "auto",
        }}
      >
        <div
          className="bg-white"
          style={{
            width: "100%",
            maxWidth: "480px",
            borderRadius: "28px",
            border: "1px solid #e2e8f0", // The "outer line" for definition
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            padding: "10px"
          }}
        >
          {/* 1. Header Section - Added more horizontal padding */}
          <div className="pt-4 px-4 pb-3 d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-start gap-2">
              <div className="mt-1">
                <Icon icon="solar:forward-bold-duotone" className="text-primary" width="28" />
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.4rem' }}>Forward Lead</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1" style={{ fontSize: '11px' }}>
                    ID: {selectedLead?.Id}
                  </span>
                  <span className="text-secondary fw-medium small">
                    {selectedLead?.FullName || "Raaz"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={closeForwardModal}
              className="btn btn-link text-muted p-0 mt-1"
              style={{ textDecoration: 'none' }}
            >
              <Icon icon="iconamoon:close-bold" width="24" />
            </button>
          </div>

          <hr className="m-0 opacity-10" />

          {/* 2. Body Section - Significant padding for "distance between content and edge" */}
          <div className="p-4 pt-4">
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2 ls-1">
                Select Role
              </label>
              <div className="d-flex gap-3 flex-wrap">
                {availableTransferRoles.map((roleOption) => (
                  <label
                    key={roleOption}
                    className="d-flex align-items-center gap-2 px-3 py-2 border rounded-pill"
                    style={{
                      cursor: availableTransferRoles.length > 1 ? "pointer" : "default",
                      backgroundColor:
                        selectedTransferRole === roleOption ? "#eef2ff" : "#fff",
                      borderColor:
                        selectedTransferRole === roleOption ? "#818cf8" : "#cbd5e1",
                    }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input m-0"
                      checked={selectedTransferRole === roleOption}
                      onChange={() => setSelectedTransferRole(roleOption)}
                      disabled={availableTransferRoles.length === 1}
                    />
                    <span className="fw-semibold text-dark">{roleOption}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Source Agent */}
            <div className="mb-1">
              <label className="form-label small fw-bold text-muted mb-2 ls-1">
                From {selectedTransferRole} (Transfer From)
              </label>
              <Select
                options={filteredRoleEmployees}
                value={fromEmployee}
                isDisabled
                placeholder={`Assigned ${selectedTransferRole.toLowerCase()} will show here`}
                styles={{
                  control: (base) => ({ 
                    ...base, 
                    borderRadius: "14px", 
                    padding: "4px", 
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0" 
                  })
                }}
              />
            </div>

            {/* Floating Arrow Icon */}
            <div className="d-flex justify-content-center my-n2 position-relative" style={{ zIndex: 10 }}>
              <div className="bg-white rounded-circle border shadow-sm p-1 d-flex align-items-center justify-content-center" 
                  style={{ width: "38px", height: "38px" }}>
                <Icon icon="solar:arrow-down-bold-duotone" className="text-primary" width="24" />
              </div>
            </div>

            {/* Target Agent */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2 ls-1">
                To {selectedTransferRole} (Transfer To)
              </label>
              <Select
                options={filteredRoleEmployees.filter(
                  (emp) => Number(emp.value) !== Number(fromEmployee?.value)
                )}
                value={toEmployee}
                onChange={setToEmployee}
                placeholder={`Search ${selectedTransferRole.toLowerCase()}...`}
                styles={{
                  control: (base) => ({ 
                    ...base, 
                    borderRadius: "14px", 
                    padding: "4px",
                    border: "1px solid #cbd5e1"
                  })
                }}
              />
            </div>

            {/* Reason Box */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted mb-2 ls-1">
                Reason for Transfer <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Add a note for the next agent..."
                style={{ 
                    borderRadius: "16px", 
                    padding: "15px", 
                    fontSize: "14px", 
                    resize: "none", 
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff"
                }}
                value={forwardReason}
                onChange={(e) => setForwardReason(e.target.value)}
              />
            </div>

            {/* 3. Footer Section - Modern Button Layout */}
            <div className="d-flex gap-3 mt-2 pb-2">
              <button
                type="button"
                className="btn btn-light w-100 fw-bold border"
                style={{ 
                    borderRadius: "16px", 
                    padding: "14px", 
                    color: "#64748b",
                    backgroundColor: "#fff"
                }}
                onClick={closeForwardModal}
                disabled={isForwarding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{ 
                    borderRadius: "16px", 
                    padding: "14px", 
                    backgroundColor: "#818cf8", // Soft Purple/Blue from your image
                    border: "none",
                    color: "white"
                }}
                onClick={handleForwardLead}
                disabled={isForwarding || !toEmployee || !forwardReason.trim()}
              >
                {isForwarding ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <Icon icon="solar:share-circle-bold-duotone" width="22" />
                    Forward
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default OrganicLeadsLayer; 
