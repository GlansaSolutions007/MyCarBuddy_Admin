import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";
import * as XLSX from "xlsx";

const EXPORT_COLUMNS = [
  { key: "EmpId", label: "Employee ID" },
  { key: "EmployeeName", label: "Employee Name" },
  { key: "TotalAssigned", label: "Total Leads" },
  { key: "NoFollowUpYet", label: "No Follow Up" },
  { key: "ConvertedCustomer", label: "Converted" },
  { key: "Interested", label: "Interested" },
  { key: "NotConverted", label: "Not Converted" },
  { key: "NeedMoreInfo", label: "Need More Info" },
  { key: "NotHavingCar", label: "Not Having Car" },
  { key: "NotConnected", label: "Not Connected" },
  { key: "NotInterested", label: "Not Interested" },
  { key: "NumberDoesNotExist", label: "Number Doesn’t Exist" },
];

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
  const [selectedExportColumns, setSelectedExportColumns] = useState(
    EXPORT_COLUMNS.map((c) => c.key),
  );
  const token = localStorage.getItem("token");

  const employeeDataRaw = localStorage.getItem("employeeData");
  let employeeData = null;
  try {
    employeeData = employeeDataRaw ? JSON.parse(employeeDataRaw) : null;
  } catch (err) {
    console.warn("Invalid employeeData in localStorage", err);
  }
  console.log("Employee Data:", employeeData?.RoleName);


  useEffect(() => {
    fetchLeads();
  }, [fromDate, toDate]);

  useEffect(() => {
    // Filter leads based on search term
    const filtered = leads.filter(
      (lead) =>
        lead.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(lead.EmployeeId).includes(searchTerm),
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

  const exportToExcel = () => {
    if (!filteredLeads.length) return;

    const exportData = filteredLeads.map((item) => {
      const row = {};

      EXPORT_COLUMNS.forEach((col) => {
        if (!selectedExportColumns.includes(col.key)) return;

        if (col.key === "NotConnected") {
          row[col.label] =
            item.RingingButNotResponded +
            item.Busy +
            item.NotReachable +
            item.SwitchedOff +
            item.TemporaryOutofService +
            item.DND;
        } else {
          row[col.label] = item[col.key] ?? 0;
        }
      });

      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, "Lead Reports");
    XLSX.writeFile(
      wb,
      `lead_reports_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
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
      width: "150px",
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
      width: "150px",
      sortable: true,
    },
    {
      name: "Doesn't Exist",
      selector: (row) => row.NumberDoesNotExist,
      width: "150px",
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
                <div className="d-flex align-items-center gap-2">
                  <label className="text-sm fw-semibold">From:</label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-control"
                    placeholder="DD-MM-YYYY"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="text-sm fw-semibold">To:</label>
                  <input
                    type="date"
                    id="toDate"
                    className="form-control"
                    placeholder="DD-MM-YYYY"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
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
                    title="Export to Excel"
                    onClick={exportToExcel}
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
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
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
