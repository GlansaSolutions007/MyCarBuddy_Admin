import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

const LeadsLayer = () => {
  const [leads, setLeads] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_BASE = import.meta.env.VITE_APIURL;
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  

  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch Leads from API
  const fetchLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}ServiceLeads/FacebookLeads`,);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError("Failed to fetch leads. Please try again.");
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  // DataTable Columns
  const columns = [
    {
      name: "Customer Name",
      selector: (row) => row.FullName || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Phone Number",
      selector: (row) => row.PhoneNumber || "-",
      sortable: true,
      wrap: true,
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
    },
    {
      name: "Email",
      selector: (row) => row.Email || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "City",
      selector: (row) => row.City || "-",
      wrap: true,
    },
    {
      name: "Lead Status",
      selector: (row) => row.LeadStatus || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <Link
           to={`/lead-view/${row.Id}`}
          //  to={`/view-lead?id=${row.Id}`}
          className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
          title="View"
        >
        <Icon icon="lucide:eye" />
        </Link>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    }
  ];

  // Filter
  const filteredLeads = leads.filter((lead) => {
    const text = searchText.toLowerCase();
    const statusMatch =
      selectedStatus === "All" ||
      lead.LeadStatus?.toLowerCase() === selectedStatus.toLowerCase();

    // Date filtering
    const leadDate = lead.CreatedDate ? new Date(lead.CreatedDate) : null;
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;
    const dateMatch =
      (!from || (leadDate && leadDate >= from)) &&
      (!to || (leadDate && leadDate <= to));

    return (
      statusMatch &&
      dateMatch &&
      (lead.FullName?.toLowerCase().includes(text) ||
        lead.PhoneNumber?.toLowerCase().includes(text) ||
        lead.Email?.toLowerCase().includes(text) ||
        lead.City?.toLowerCase().includes(text) ||
        lead.LeadStatus?.toLowerCase().includes(text))
    );
  });

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3"></div>
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
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
                  className="form-control radius-8 px-14 py-6 text-sm w-auto"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <label className="text-sm fw-semibold">To:</label>
                <input
                  type="date"
                  className="form-control radius-8 px-14 py-6 text-sm w-auto"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                <select
                  className="form-select radius-8 px-14 py-6 text-sm w-auto min-w-150"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="CREATED">CREATED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <Link
                  to="/add-lead"
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                >
                  <Icon
                    icon="ic:baseline-plus"
                    className="icon text-xl line-height-1"
                  />
                  Add Leads
                </Link>
              </div>
            </div>
          </div>
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

export default LeadsLayer;
