import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

const LeadsLayer = () => {
  const [leads, setLeads] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch Leads (Dummy Data)
  const fetchLeads = () => {
    setLoading(true);
    setError("");

    // Dummy leads data
    const dummyLeads = [
      {
        id: 1,
        date: "2023-10-01",
        customerName: "John Doe",
        customerPhone: "123-456-7890",
        customerEmail: "john.doe@example.com",
        customerAddress: "123 Main St, City, State",
        description: "Interested in car service",
        currentStatus: "New",
      },
      {
        id: 2,
        date: "2023-10-02",
        customerName: "Jane Smith",
        customerPhone: "987-654-3210",
        customerEmail: "jane.smith@example.com",
        customerAddress: "456 Elm St, City, State",
        description: "Needs oil change",
        currentStatus: "Contacted",
      },
      {
        id: 3,
        date: "2023-10-03",
        customerName: "Bob Johnson",
        customerPhone: "555-123-4567",
        customerEmail: "bob.johnson@example.com",
        customerAddress: "789 Oak St, City, State",
        description: "Tire replacement",
        currentStatus: "Qualified",
      },
      {
        id: 4,
        date: "2023-10-04",
        customerName: "Alice Brown",
        customerPhone: "444-567-8901",
        customerEmail: "alice.brown@example.com",
        customerAddress: "321 Pine St, City, State",
        description: "General maintenance",
        currentStatus: "New",
      },
      {
        id: 5,
        date: "2023-10-05",
        customerName: "Charlie Wilson",
        customerPhone: "222-333-4444",
        customerEmail: "charlie.wilson@example.com",
        customerAddress: "654 Maple St, City, State",
        description: "Brake inspection",
        currentStatus: "Closed",
      },
    ];

    setTimeout(() => {
      setLeads(dummyLeads);
      setLoading(false);
    }, 500); // Simulate loading delay
  };

  // DataTable Columns
  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Customer Name",
      selector: (row) => row.customerName || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Phone Number",
      selector: (row) => row.customerPhone || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Date",
      selector: (row) => {
        if (!row.date) return "-";
        const date = new Date(row.date);
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
      selector: (row) => row.customerEmail || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Address",
      selector: (row) => row.customerAddress || "-",
      wrap: true,
    },
    {
      name: "Description",
      selector: (row) => row.description || "-",
      wrap: true,
    },
    {
      name: "Current Status",
      cell: (row) => {
        const status = row.currentStatus || "-";
        const colorMap = {
          New: "text-primary fw-semibold",
          Contacted: "text-info fw-semibold",
          Qualified: "text-success fw-semibold",
          Closed: "text-dark fw-semibold",
        };
        const textClass = colorMap[status] || "text-muted";
        return (
          <span className={textClass}>
            <span
              className="rounded-circle"
              style={{
                width: "8px",
                height: "8px",
                marginRight: "4px",
                backgroundColor: "currentColor",
              }}
            ></span>
            {status}
          </span>
        );
      },
      sortable: true,
      wrap: true,
    },
  ];

  // Filter
  const filteredLeads = leads.filter((lead) => {
    const text = searchText.toLowerCase();
    const statusMatch =
      selectedStatus === "All" ||
      lead.currentStatus?.toLowerCase() === selectedStatus.toLowerCase();

    // Date filtering
    const leadDate = lead.date ? new Date(lead.date) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const dateMatch =
      (!from || (leadDate && leadDate >= from)) &&
      (!to || (leadDate && leadDate <= to));

    return (
      statusMatch &&
      dateMatch &&
      (lead.customerName?.toLowerCase().includes(text) ||
        lead.customerPhone?.toLowerCase().includes(text) ||
        lead.customerEmail?.toLowerCase().includes(text) ||
        lead.customerAddress?.toLowerCase().includes(text) ||
        lead.description?.toLowerCase().includes(text) ||
        lead.currentStatus?.toLowerCase().includes(text))
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
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Closed">Closed</option>
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
