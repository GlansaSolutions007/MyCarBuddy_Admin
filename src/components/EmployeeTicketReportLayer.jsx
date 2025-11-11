import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import PropTypes from "prop-types";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeTicketReportLayer = ({ employeeId }) => {
  EmployeeTicketReportLayer.propTypes = {
    employeeId: PropTypes.string,
  };
  const [tickets, setTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [employeeStats, setEmployeeStats] = useState({
    name: "",
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (employeeId) {
      fetchTicketsForEmployee(employeeId);
    }
  }, [employeeId]);

  // Fetch Tickets for Employee
  const fetchTicketsForEmployee = async (empId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}Tickets/EmpId?EmpId=${empId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const ticketsData = Array.isArray(res.data) ? res.data : [];

      // Calculate stats
      const totalTickets = ticketsData.length;
      const pendingTickets = ticketsData.filter(ticket =>
        ticket.StatusName?.toLowerCase() === 'pending' ||
        ticket.StatusName?.toLowerCase() === 'underreview' ||
        ticket.StatusName?.toLowerCase() === 'reopened' ||
        ticket.StatusName?.toLowerCase() === 'awaiting'
      ).length;
      const resolvedTickets = ticketsData.filter(ticket =>
        ticket.StatusName?.toLowerCase() === 'closed' ||
        ticket.StatusName?.toLowerCase() === 'cancelled' ||
        ticket.StatusName?.toLowerCase() === 'resolved'
      ).length;

      // Get employee name from first ticket (assuming all have same employee)
      const employeeName = ticketsData.length > 0 ? ticketsData[0].EmployeeName : 'Unknown Employee';

      setEmployeeStats({
        name: employeeName,
        totalTickets,
        pendingTickets,
        resolvedTickets,
      });

      setTickets(ticketsData);
    } catch (error) {
      console.error("Failed to load tickets", error);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // DataTable Columns
  const columns = [
    {
      name: "Ticket id",
      selector: (row) => (
        <Link
          to={`/tickets/${row.TicketID ?? row.TicketId ?? row.Id}`}
          className="text-primary"
        >
          {row.TicketTrackId || "-"}
        </Link>
      ),
    },
    // {
    //   name: "Customer Name",
    //   selector: (row) => (
    //       <span className="fw-bold">{row.CustomerName || "N/A"}</span>
    //   ),
    // },
    {
      name: "Customer Name",
      selector: (row) => row.CustomerName,
      cell: (row) => {
        const formattedName = row.CustomerName
          ? row.CustomerName.replace(/\b\w/g, (char) => char.toUpperCase())
          : "N/A";
        return <span className="fw-bold">{formattedName}</span>;
      },
    },
    {
      name: "Booking id",
      selector: (row) => row.BookingTrackID || "-",
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
      wrap: true,
    },
    // {
    //   name: "Ticket Status",
    //   cell: (row) => {
    //     let status = row?.StatusName ?? "-";
    //     const colorMap = {
    //       Pending: "text-secondary fw-semibold",
    //       UnderReview: "text-info fw-semibold",
    //       Awaiting: "text-warning fw-semibold",
    //       Resolved: "text-success fw-semibold",
    //       Closed: "text-dark fw-semibold",
    //       Cancelled: "text-danger fw-semibold",
    //       Reopened: "text-primary fw-semibold",
    //       Forward: "text-purple fw-semibold",
    //       UserResponse: "text-teal fw-semibold",
    //     };
    //     const textClass = colorMap[status] || "text-muted";
    //     return (
    //       <span className={textClass}>
    //         <span
    //           className="rounded-circle"
    //           style={{
    //             width: "8px",
    //             height: "8px",
    //             marginRight: "4px",
    //             backgroundColor: "currentColor",
    //           }}
    //         ></span>
    //         {status}
    //       </span>
    //     );
    //   },
    //   wrap: true,
    // },
    {
      name: "Ticket Status",
      cell: (row) => {
        let status = row?.StatusName ?? "-";
        // Hex color map from your badge reference
        const colorMap = {
          Pending: "#F57C00",        // Orange
          UnderReview: "#F7AE21",    // Yellow
          Awaiting: "#F7AE21",       // Yellow
          Resolved: "#28A745",       // Green
          Closed: "#28A745",         // Green
          Cancelled: "#E34242",      // Red
          Reopened: "#25878F",       // Teal-blue
          Forward: "#BFBFBF",        // Grey
          UserResponse: "#BFBFBF",   // Grey
        };
        const color = colorMap[status] || "#6c757d"; // default muted grey
        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      wrap: true,
    },
    {
      name: "Description",
      selector: (row) => row.Description || "-",
      wrap: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <Link
            to={`/tickets/${row.TicketID ?? row.TicketId ?? row.Id}`}
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View"
          >
            <Icon icon="lucide:eye" />
          </Link>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Filter
  const filteredData = tickets.filter((ticket) => {
    const text = searchText.toLowerCase();
    const statusName = (ticket?.StatusName || "").toLowerCase();
    const statusMatch =
      selectedStatus === "All" ||
      (selectedStatus === "Pending, Reopened" &&
        (statusName === "pending" || statusName === "reopened")) ||
      statusName === selectedStatus.toLowerCase();

    // Date filtering
    const ticketDate = ticket.CreatedDate ? new Date(ticket.CreatedDate) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const dateMatch =
      (!from || (ticketDate && ticketDate >= from)) &&
      (!to || (ticketDate && ticketDate <= to));

    return (
      statusMatch &&
      dateMatch &&
      (ticket.CustomerName?.toLowerCase().includes(text) ||
        ticket.TicketTrackId?.toLowerCase().includes(text) ||
        ticket.BookingTrackID?.toLowerCase().includes(text) ||
        ticket.Description?.toLowerCase().includes(text) ||
        statusName.includes(text))
    );
  });



  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3"></div>
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="row mb-3">
              <div className="col-md-3">
                <div className="card bg-primary-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Employee Name</span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{employeeStats.name}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-info-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Total Tickets</span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{employeeStats.totalTickets}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-warning-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Pending Tickets</span>
                    <p className="card-text mb-0 fw-bold " style={{ fontSize: '14px' }}>{employeeStats.pendingTickets}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-success-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Resolved Tickets</span>
                    <p className="card-text mb-0 fw-bold " style={{ fontSize: '14px' }}>{employeeStats.resolvedTickets}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Tickets"
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
                  <option value="Pending, Reopened">Pending + Reopened</option>
                  <option value="Pending">Pending</option>
                  <option value="UnderReview">Under Review</option>
                  <option value="Awaiting">Awaiting</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Reopened">Reopened</option>
                </select>

              </div>
            </div>
          </div>
          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={
                loading ? "Loading tickets..." : "No tickets available"
              }

            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTicketReportLayer;
