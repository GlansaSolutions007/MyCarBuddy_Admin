import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeLeadsReportLayer = ({
  employeeId,
  initialFromDate = "",
  initialToDate = "",
}) => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, [fromDate, toDate]);

  useEffect(() => {
    const filtered = leads.filter(
      (lead) =>
        (lead.LeadId &&
          lead.LeadId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.Notes &&
          lead.Notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      let url = API_BASE + `Leads/FollowUpLeads?EmployeeId=${employeeId}`;
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
        setLeads(res.data);
        setFilteredLeads(res.data);
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

  const columns = [
    {
      name: "Customer Name",
      selector: (row) => row.FullName || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Created At",
      selector: (row) => formatDate(row.Leadcreateddate) || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => row.Status || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Notes",
      selector: (row) => row.Notes || "-",
      sortable: false,
      wrap: true,
    },
    {
      name: "Updated At",
      selector: (row) => formatDate(row.Created_At) || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Next Action",
      selector: (row) => row.NextAction || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Next Follow Up ",
      title: "Next Follow Up ",
      selector: (row) => formatDate(row.NextFollowUp_Date) || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Action",
      cell: (row) => (
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
              <div className="d-flex gap-3 flex-wrap">
                <div>
                  <label htmlFor="fromDate" className="form-label">
                    From Date
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="toDate" className="form-label">
                    To Date
                  </label>
                  <input
                    type="date"
                    id="toDate"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {error ? (
            <div className="alert m-3 align-items-center fw-bold d-flex justify-content-center">
              No leads available for selected date
            </div>
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
                loading
                  ? "Loading employee leads..."
                  : "No employee leads available"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeadsReportLayer;
