import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;

const ClosedLeadsLayer = () => {
  const { hasPermission } = usePermissions();
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const role = localStorage.getItem("role");
  const [leads, setLeads] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
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
      const closedLeadsOnly = Array.isArray(data)
        ? data.filter((lead) => lead.NextAction === "Lead Closed")
        : [];
      setLeads(closedLeadsOnly);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Prepare data for export (exclude Action column)
    const exportData = filteredLeads.map((lead) => ({
      "Lead ID": lead.Id,
      "Customer Name": lead.FullName || "-",
      "Phone Number": lead.PhoneNumber || "-",
      Email: lead.Email || "-",
      "Created Date": lead.CreatedDate
        ? new Date(lead.CreatedDate).toLocaleString("en-GB")
        : "-",
      City: lead.City || "-",
      Platform: lead.Platform || "-",
      "Lead Category":
        lead.BookingAddOns?.filter((addon) => addon.IsUserClicked === true)
          .map((addon) => addon.ServiceName)
          .join(", ") || "-",
      Description: lead.Description || "-",
      "Updated Date": lead.Updated_At
        ? new Date(lead.Updated_At).toLocaleString("en-GB")
        : "-",
      "Lead Status": lead.FollowUpStatus || "No FollowUp Yet",
      "Next FollowUp": lead.NextFollowUp_Date || "-",
      "Next Action": lead.NextAction || "-",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = [
      { wch: 10 }, // Lead ID
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 25 }, // Email
      { wch: 15 }, // Created Date
      { wch: 15 }, // City
      { wch: 10 }, // Platform
      { wch: 25 }, // Lead Category
      { wch: 20 }, // Description
      { wch: 15 }, // Updated Date
      { wch: 15 }, // Lead Status
      { wch: 15 }, // Next FollowUp
      { wch: 15 }, // Next Action
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Closed Leads");

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "")
      .replace(/-/g, "")
      .replace("T", "_");
    const filename = `closed_leads_export_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
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
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
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
      name: "Lead Category",
      cell: (row) => {
        if (
          !row.BookingAddOns ||
          row.BookingAddOns.length === 0 ||
          !row.BookingAddOns.some((addon) => addon.IsUserClicked === true)
        ) {
          return <span>-</span>;
        }

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {row.BookingAddOns.filter(
              (addon) => addon.IsUserClicked === true
            ).map((addon) => (
              <span key={addon.AddOnId}>{addon.ServiceName}</span>
            ))}
          </div>
        );
      },
      sortable: true,
      wrap: true,
      minWidth: "200px",
    },
    {
      name: "Description",
      selector: (row) => row.Description || "-",
      sortable: true,
      wrap: true,
      width: "150px",
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

      return (
        dateMatch &&
        (lead.Id?.toString().toLowerCase().includes(text) ||
          lead.FullName?.toLowerCase().includes(text) ||
          lead.PhoneNumber?.toLowerCase().includes(text) ||
          lead.Email?.toLowerCase().includes(text) ||
          lead.City?.toLowerCase().includes(text) ||
          lead.Platform?.toLowerCase().includes(text) ||
          lead.FollowUpStatus?.toLowerCase().includes(text))
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
        </div>
      </div>
    </div>
  );
};

export default ClosedLeadsLayer;
