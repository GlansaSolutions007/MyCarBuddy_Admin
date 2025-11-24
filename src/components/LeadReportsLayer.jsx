import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const LeadReportsLayer = () => {
  const { hasPermission } = usePermissions();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, [fromDate, toDate]);

  useEffect(() => {
    // Filter leads based on search term
    const filtered = leads.filter((lead) =>
      lead.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(lead.EmployeeId).includes(searchTerm)
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
  try {
    setLoading(true);
    setError("");

    const res = await axios.get(
      `${API_BASE}Leads/UniqueLeadCounts?FromDate=${fromDate}&ToDate=${toDate}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data && Array.isArray(res.data)) {
      const leadsData = res.data.map((lead) => ({
        EmployeeId: lead.EmployeeId,
        Name: lead.Name,
        LeadCount: lead.LeadCount,
      }));

      setLeads(leadsData);
      setFilteredLeads(leadsData);
    }

  } catch (err) {
    console.error(err);
    setError("Failed to load leads.");
  } finally {
    setLoading(false);
  }
};


  const columns = [
    { name: "Employee ID", selector: (row) => row.EmployeeId, sortable: true, width: "140px" },
    { name: "Name", selector: (row) => row.Name, sortable: true, width: "200px", cell: (row) => <span className="fw-bold">{row.Name}</span> },
    { name: "Lead Count", selector: (row) => row.LeadCount, sortable: true, width: "140px" },
    ...(hasPermission("leadreports_view")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link to={`/employee-leads/${row.EmployeeId}`} className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'>
            <Icon icon='lucide:eye' />
          </Link>
        </div>
      ),
    },
   ]
    : []),
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Employees"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <div className="d-flex gap-3">
                <div>
                  <label htmlFor="fromDate" className="form-label">From Date</label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="toDate" className="form-label">To Date</label>
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

export default LeadReportsLayer;
