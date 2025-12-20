import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const OrganicLeadsLayer = () => {
  const { hasPermission } = usePermissions();
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const role = localStorage.getItem("role");
  const [leads, setLeads] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError("");

    try {
      let url;
      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/FacebookLeads`;
      } else {
        url = `${API_BASE}ServiceLeads/FacebookLeads?EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const organicOnly = Array.isArray(data)
        ? data.filter(
            (lead) =>
              (lead.Platform === "Organic" ||
                lead.Platform === "Web" ||
                lead.Platform === "App") &&
              lead.NextAction !== "Lead Closed"
          )
        : [];

      setLeads(organicOnly);
    } catch (err) {
      setError("Failed to fetch leads. Please try again.");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}Leads/UploadExcel`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (p) => {
          const percent = Math.round((p.loaded / p.total) * 100);
          setUploadProgress(percent);
        },
      });

      if (res.status === 200) {
        Swal.fire("Success", "Bulk Upload Completed", "success");
        setUploading(false);
        setUploadProgress(0);
        fetchLeads();
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Bulk Upload Failed", "error");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // DataTable Columns
  const columns = [
    {
      name: "Lead ID",
      selector: (row) => (
        <Link to={`/lead-view/${row.Id}`} className="text-primary">
          {row.Id}
        </Link>
      ),
      sortable: true,
      wrap: true,
      width: "120px",
    },
    {
      name: "Customer Name",
      selector: (row) => row.FullName || "-",
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Phone Number",
      selector: (row) => row.PhoneNumber || "-",
      sortable: true,
      wrap: true,
      width: "150px",
    },
    {
      name: "Email",
      selector: (row) => row.Email || "-",
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Created Date",
      selector: (row) => {
        if (!row.CreatedDate) return "-";
        const date = new Date(row.CreatedDate);
        return date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
      sortable: true,
      wrap: true,
      width: "150px",
    },
    {
      name: "City",
      selector: (row) => row.City || "-",
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Platform",
      selector: (row) => row.Platform || "-",
      sortable: true,
      wrap: true,
      width: "120px",
    },
    {
      name: "Updated Date",
      selector: (row) => {
        if (!row.Updated_At) return "-";
        const date = new Date(row.Updated_At);
        return date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
      sortable: true,
      wrap: true,
      width: "150px",
    },
    {
      name: "Lead Status",
      selector: (row) => row.FollowUpStatus || "No FollowUp Yet",
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Next FollowUp",
      selector: (row) => row.NextFollowUp_Date || "-",
      sortable: true,
      wrap: true,
      width: "150px",
    },
    {
      name: "Next Action",
      selector: (row) => row.NextAction || "-",
      sortable: true,
      wrap: true,
      width: "150px",
    },
    ...(hasPermission("leadview_view")
      ? [
          {
            name: "Action",
            cell: (row) => (
              <Link
                to={`/lead-view/${row.Id}`}
                className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                title="View"
              >
                <Icon icon="lucide:eye" />
              </Link>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
          },
        ]
      : []),
  ];

  let filteredLeads = leads
    .filter((lead) => {
      const text = searchText.toLowerCase();

      const leadDate = lead.CreatedDate ? new Date(lead.CreatedDate) : null;
      const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;

      const dateMatch =
        (!from || (leadDate && leadDate >= from)) &&
        (!to || (leadDate && leadDate <= to));

      const platformMatch =
        platformFilter === "All" || lead.Platform === platformFilter;

      return (
        dateMatch &&
        platformMatch &&
        (lead.Id?.toString().toLowerCase().includes(text) ||
          lead.FullName?.toLowerCase().includes(text) ||
          lead.PhoneNumber?.toLowerCase().includes(text) ||
          lead.Email?.toLowerCase().includes(text) ||
          lead.City?.toLowerCase().includes(text) ||
          lead.LeadStatus?.toLowerCase().includes(text))
      );
    })
    .sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3"></div>
        <div className="card overflow-hidden py-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search ">
                <input
                  type="text"
                  className="form-control w-auto"
                  placeholder="Search Leads"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <div className="d-flex gap-2 align-items-center">
                <label className="text-sm fw-semibold">From:</label>
                <input
                  type="date"
                  placeholder="DD-MM-YYYY"
                  className="custom-date form-control radius-8 px-14 py-6 text-sm w-auto"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <label className="text-sm fw-semibold">To:</label>
                <input
                  type="date"
                  placeholder="DD-MM-YYYY"
                  className="custom-date form-control radius-8 px-14 py-6 text-sm w-auto"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                {/* <select
                  className="form-control radius-8 px-14 py-6 text-sm w-auto"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Organic">Organic</option>
                  <option value="Web">Web</option>
                  <option value="App">App</option>
                </select> */}

                <div className="position-relative d-inline-block">
                  <select
                    className="form-control radius-8 px-14 py-6 text-sm w-auto"
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    style={{
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      paddingRight: "30px", // space for arrow
                    }}
                  >
                    <option value="All">All</option>
                    <option value="Organic">Organic</option>
                    <option value="Web">Web</option>
                    <option value="App">App</option>
                  </select>
                  <i
                    className="bi bi-chevron-down"
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  ></i>
                </div>

                <input
                  type="file"
                  accept=".xlsx, .xls"
                  id="organicUpload"
                  style={{ display: "none" }}
                  onChange={handleBulkUpload}
                />
                {/* Bulk Upload button */}
                {role === "Admin" && (
                  <button
                    type="button"
                    className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                    onClick={() =>
                      document.getElementById("organicUpload").click()
                    }
                    disabled={uploading}
                  >
                    <Icon
                      icon="mdi:upload"
                      className="icon text-xl line-height-1"
                    />
                    Bulk Upload
                  </button>
                )}
                {hasPermission("createlead_add") && (
                  <Link
                    to="/create-lead"
                    className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  >
                    <Icon
                      icon="ic:baseline-plus"
                      className="icon text-xl line-height-1"
                    />
                    Add Lead
                  </Link>
                )}
              </div>
            </div>
          </div>
          {uploading && (
            <div className="m-3">Uploading {uploadProgress}%...</div>
          )}
          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLeads}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={
                loading ? "Loading leads..." : "No leads available"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganicLeadsLayer;
