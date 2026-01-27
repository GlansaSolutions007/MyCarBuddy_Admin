import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
const API_BASE = import.meta.env.VITE_APIURL;
import { usePermissions } from "../context/PermissionContext";
import * as XLSX from "xlsx";

const EXPORT_COLUMNS = [
  { key: "Id", label: "Lead ID" },
  { key: "FullName", label: "Customer Name" },
  { key: "PhoneNumber", label: "Phone" },
  { key: "LeadStatus", label: "Status" },
  { key: "Description", label: "Description" },
  { key: "CreatedDate", label: "Created Date", format: "date" },
];

const EmployeeLeadsReportLayer = ({
  employeeId,
  initialFromDate = "",
  initialToDate = "",
}) => {
  const { hasPermission } = usePermissions();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [selectedExportColumns, setSelectedExportColumns] = useState(
    EXPORT_COLUMNS.map((c) => c.key),
  );

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, [fromDate, toDate]);

  useEffect(() => {
    const filtered = leads.filter(
      (lead) =>
        (lead.Id && lead.Id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.Notes &&
          lead.Notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.LeadStatus &&
          lead.LeadStatus.toLowerCase().includes(searchTerm.toLowerCase())),
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      // let url = API_BASE + `Leads/FollowUpLeads?EmployeeId=${employeeId}`;
      let url = API_BASE + `Leads/AssignedLeads?Emp_Assign=${employeeId}`;

      if (fromDate) {
        url += `&FromDate=${fromDate}`;
      }
      if (toDate) {
        url += `&ToDate=${toDate}`;
      }

      const res = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data)) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.Leadcreateddate) - new Date(a.Leadcreateddate),
        );
        setLeads(sorted);
        setFilteredLeads(sorted);
      } else {
        setLeads([]);
        setFilteredLeads([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!selectedExportColumns.length) return;

    const exportData = filteredLeads.map((item) => {
      const row = {};
      EXPORT_COLUMNS.forEach((col) => {
        if (!selectedExportColumns.includes(col.key)) return;

        let value = item[col.key];

        if (col.format === "date" && value) {
          value = new Date(value).toLocaleDateString("en-GB");
        }

        row[col.label] = value ?? "-";
      });
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Employee Leads");

    XLSX.writeFile(
      wb,
      `employee_leads_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const columns = [
    {
      name: "Lead ID",
      selector: (row) => row.Id || "-",
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.FullName || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber || "-",
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row) => formatDate(row.CreatedDate) || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => row.LeadStatus || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Description",
      selector: (row) => row.Description || "-",
      sortable: true,
      wrap: true,
    },
    // {
    //   name: "Updated At",
    //   selector: (row) => formatDate(row.Created_At) || "-",
    //   sortable: true,
    //   wrap: true,
    // },
    // {
    //   name: "Count",
    //   selector: (row) => row.FollowUpCount || "-",
    //   sortable: true,
    //   wrap: true,
    // },
    // {
    //   name: "Next Action",
    //   selector: (row) => row.NextAction || "-",
    //   sortable: true,
    //   wrap: true,
    // },
    // {
    //   name: "Next Follow Up ",
    //   title: "Next Follow Up ",
    //   selector: (row) => formatDate(row.NextFollowUp_Date) || "-",
    //   sortable: true,
    //   wrap: true,
    // },
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

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-3">
              <form
                className="navbar-search"
                style={{ flexGrow: 1, minWidth: "250px" }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by LeadId or Notes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <label className="text-sm fw-semibold">From:</label>
                <input
                  type="date"
                  id="fromDate"
                  className="form-control w-auto"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />

                <label className="text-sm fw-semibold">To:</label>
                <input
                  type="date"
                  id="toDate"
                  className="form-control w-auto"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                <div className="d-flex align-items-center gap-2">
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle p-1"
                      data-bs-toggle="dropdown"
                    >
                      Columns
                    </button>
                    <div
                      className="dropdown-menu p-3"
                      style={{ minWidth: "220px" }}
                    >
                      {EXPORT_COLUMNS.map((col) => (
                        <div className="form-check" key={col.key}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() =>
                              setSelectedExportColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter((k) => k !== col.key)
                                  : [...prev, col.key],
                              )
                            }
                          />
                          <label className="form-check-label ms-2">
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    onClick={exportToExcel}
                    title="Export to Excel"
                  >
                    <Icon icon="mdi:microsoft-excel" width="22" height="22" />
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              loading
                ? "Loading employee lead Reports..."
                : "No employee lead Reports available"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeadsReportLayer;
