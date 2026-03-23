import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const TodayLeadsLayer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [allLeads, setAllLeads] = useState([]); // This will act as our master cache

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [callOutcome, setCallOutcome] = useState("");

  const fetchChunk = async (pageNumber, search = "") => {
    try {
      setLoading(true);

      let url = `${API_BASE}Leads/TodayAssignedFollowUpLeads?EmpId=${userId}&PageNumber=${pageNumber}&PageSize=100`;

      // ✅ Only append searchText if search is not empty
      if (search && search.trim() !== "") {
        const encodedSearch = encodeURIComponent(search.trim());
        url += `&SearchText=${encodedSearch}`;
      }
      if (callOutcome && callOutcome !== "") {
        url += `&Status=${callOutcome}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data.data)) {
        const count = res.data.totalCount;
        setTotalRows(count);

        setAllLeads(() => {
          let updated = new Array(count).fill(null);
          const startAt = (pageNumber - 1) * 100;

          res.data.data.forEach((item, index) => {
            updated[startAt + index] = item;
          });

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine which records to show in the table
  const displayLeads = useMemo(() => {
    let data = allLeads;

    // SLICE logic for pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = allLeads.slice(start, end);

    // If we are on a page that isn't loaded yet, return empty objects 
    // This prevents "No records to display" and shows the loader instead
    return slice.map(item => item || {});
  }, [allLeads, page, pageSize, searchTerm]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columns = [
    {
      name: "Assign Date",
      selector: (row) => row.AssignedDate ? new Date(row.AssignedDate).toLocaleString("en-GB") : "-",
      sortable: true,
      sortField: "CreatedDate",
      width: "160px",
    },
    {
      name: "Lead ID",
      cell: (row) =>
        row.LeadId ? (
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
              to={`/lead-view/${row.LeadId}`}
              className="text-primary fw-semibold d-flex align-items-center"
              style={{ textDecoration: "none" }}
            >
              {row.LeadId}
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
        ) : (
          "-"
        ),
      sortable: true,
      width: "130px",
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
      width: "150px",
    },
    {
      name: "Email",
      selector: (row) => row.Email || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: "Lead Status",
      width: "150px",
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {row.Status || "No FollowUp Yet"} 
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
      selector: (row) => row.LeadCreatedDate ? new Date(row.LeadCreatedDate).toLocaleString("en-GB") : "-",
      sortable: true,
      sortField: "CreatedDate",
      width: "160px",
    },
    {
      name: "City",
      selector: (row) => row.City || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: "Action",
      cell: (row) => row.LeadId && (
        <Link
          to={`/lead-view/${row.LeadId}`}
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
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm, callOutcome);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    setAllLeads([]);
    fetchChunk(1, debouncedSearch);
  }, [debouncedSearch, callOutcome]);

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card p-3">
          <div className="card-header d-flex justify-content-between align-items-center mb-3">
            <form className="navbar-search" style={{ width: "300px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search leads ID, Name, Phone, Email, Status"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
            </form>
            <div className="d-flex align-items-center gap-2">
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
                <option value="Next Follow Up">Next Follow-up</option>
                <option value="Need More Info">Need More Info</option>
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
            </div>
          </div>

          <DataTable
            columns={columns}
            data={displayLeads}
            progressPending={loading && displayLeads.every(item => !item.LeadId)}
            paginationServer
            pagination
            paginationPerPage={pageSize}
            paginationTotalRows={searchTerm ? displayLeads.length : totalRows}
            paginationRowsPerPageOptions={[10, 25, 50]}
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
            onChangePage={(newPage) => {
              setPage(newPage);

              // Calculate if the data for the new page exists in our master array
              const startIndex = (newPage - 1) * pageSize;
              if (!allLeads[startIndex]) {
                const requiredServerPage = Math.ceil((newPage * pageSize) / 100);
                fetchChunk(requiredServerPage, searchTerm);
              }
            }}
            onChangeRowsPerPage={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            persistTableHead
          />
        </div>
      </div>
    </div>
  );
};

export default TodayLeadsLayer;