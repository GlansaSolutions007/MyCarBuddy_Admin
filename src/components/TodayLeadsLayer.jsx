import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const TodayLeadsLayer = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assuming employee id is stored or retrieved from token or localStorage
  const userId = localStorage.getItem("userId") 
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const filtered = leads.filter((lead) => {
      // filter by searchable fields: FullName, PhoneNumber, Email, City, Leadcreateddate, AssignedDate
      const term = searchTerm.toLowerCase();
      return (
        (lead.FullName && lead.FullName.toLowerCase().includes(term)) ||
        (lead.PhoneNumber && lead.PhoneNumber.toLowerCase().includes(term)) ||
        (lead.Email && lead.Email.toLowerCase().includes(term)) ||
        (lead.City && lead.City.toLowerCase().includes(term)) ||
        (lead.AssignedDate && lead.AssignedDate.toLowerCase().includes(term)) ||
        (lead.Leadcreateddate && lead.Leadcreateddate.toLowerCase().includes(term))
      );
    });
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const url = `${API_BASE}Leads/TodayAssignedFollowUpLeads?EmpId=${userId}`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.data && Array.isArray(res.data)) {
        setLeads(res.data);
        setFilteredLeads(res.data);
      } else {
        setLeads([]);
        setFilteredLeads([]);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load leads.");
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper to show nicer dates (like DD-MM-YYYY)
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
      name: "Assigning Date",
      selector: (row) => formatDate(row.AssignedDate),
      sortable: true,
      width: "150px",
    },
    {
      name: "Full Name",
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
      selector: (row) => formatDate(row.Leadcreateddate),
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
      name: "Status",
      selector: (row) => row.Status || "-",
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
        }
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card p-3">
          <div className="card-header d-flex justify-content-between align-items-center mb-3">
            <form className="navbar-search" style={{ width: "300px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search leads"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
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
            noDataComponent={loading ? "Loading leads..." : "No leads available"}
          />
        </div>
      </div>
    </div>
  );
};

export default TodayLeadsLayer;
