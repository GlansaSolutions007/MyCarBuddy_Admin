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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeads();
  }, [fromDate, toDate]);

  useEffect(() => {
    // Filter leads based on search term
    const filtered = leads.filter(
      (lead) =>
        lead.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(lead.EmployeeId).includes(searchTerm)
    );
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      // let url = `${API_BASE}Leads/UniqueLeadCounts`;
      let url = `${API_BASE}Leads/EmployeeFollowupStatus`;
      const params = [];
      if (fromDate) {
        params.push(`FromDate=${fromDate}`);
      }
      if (toDate) {
        params.push(`ToDate=${toDate}`);
      }
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const res = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data)) {
        const leadsData = res.data.map((lead) => ({
          EmpId: lead.EmpId,
          EmployeeName: lead.EmployeeName,
          TotalAssigned: lead.TotalAssigned,
          NoFollowUpYet: lead.NoFollowUpYet,

          RingingButNotResponded: lead.RingingButNotResponded,
          Busy: lead.Busy,
          NotReachable: lead.NotReachable,
          SwitchedOff: lead.SwitchedOff,
          TemporaryOutofService: lead.TemporaryOutofService,
          DND: lead.DND,

          NumberDoesNotExist: lead.NumberDoesNotExist,
          Interested: lead.Interested,
          NotInterested: lead.NotInterested,
          NeedMoreInfo: lead.NeedMoreInfo,
          ConvertedCustomer: lead.ConvertedCustomer,
          NotConverted: lead.NotConverted,
          NotHavingCar: lead.NotHavingCar,
        }));

        setLeads(leadsData);
        setFilteredLeads(leadsData);

        if (leadsData.length === 0) {
          setError("No leads available for selected dates.");
        }
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
      name: "Emp ID",
      selector: (row) => row.EmpId,
      sortable: true,
      width: "100px",
    },
    {
      name: "Emp Name",
      selector: (row) => (
        <Link
          to={`/emp-leads-report/${row.EmpId}?fromDate=${fromDate}&toDate=${toDate}`}
          className="text-primary"
        >
          {row.EmployeeName}
        </Link>
      ),
      sortable: true,
      width: "150px",
    },
    {
      name: "Total Leads",
      selector: (row) => row.TotalAssigned,
      sortable: true,
      width: "140px",
    },
    {
      name: "No FollowUp",
      selector: (row) => row.NoFollowUpYet,
      sortable: true,
      width: "140px",
    },
    {
      name: "Converted",
      selector: (row) => row.ConvertedCustomer,
      width: "120px",
      sortable: true,
    },
    {
      name: "Interested",
      selector: (row) => row.Interested,
      width: "120px",
      sortable: true,
    },
    {
      name: "Not Converted",
      selector: (row) => row.NotConverted,
      width: "140px",
      sortable: true,
    },
    {
      name: "Need Info",
      selector: (row) => row.NeedMoreInfo,
      width: "120px",
      sortable: true,
    },
    {
      name: "No Car",
      selector: (row) => row.NotHavingCar,
      width: "120px",
      sortable: true,
    },
    {
      name: "Not Connected",
      selector: (row) =>
        row.RingingButNotResponded +
        row.Busy +
        row.NotReachable +
        row.SwitchedOff +
        row.TemporaryOutofService +
        row.DND,
      sortable: true,
      width: "150px",
    },
    {
      name: "Not Interested",
      selector: (row) => row.NotInterested,
      width: "140px",
      sortable: true,
    },
    {
      name: "Doesn't Exist",
      selector: (row) => row.NumberDoesNotExist,
      width: "120px",
      sortable: true,
    },
    ...(hasPermission("empleadsreport_view")
      ? [
          {
            name: "Actions",
            cell: (row) => (
              <div>
                <Link
                  to={`/emp-leads-report/${row.EmpId}?fromDate=${fromDate}&toDate=${toDate}`}
                  className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                >
                  <Icon icon="lucide:eye" />
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
                  <label htmlFor="fromDate" className="form-label">
                    From Date
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-control"
                    placeholder="DD-MM-YYYY"
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
                    placeholder="DD-MM-YYYY"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
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
                ? "Loading leads..."
                : "No leads reports available for selected date"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default LeadReportsLayer;
