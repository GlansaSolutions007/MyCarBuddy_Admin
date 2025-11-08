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
    } else {
      fetchEmployees(); // Fallback if no employeeId
    }
  }, [employeeId]);

  // Fetch Tickets for Employee
  const fetchTicketsForEmployee = async (empId) => {
    try {
      setLoading(true);
      // Fetch ticket assignments for this employee
      const [resAssignments, resTickets, resEmployees] = await Promise.all([
        axios.get(`${API_BASE}Ticket_Assignments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${API_BASE}Tickets`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${API_BASE}Employee`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const assignments = Array.isArray(resAssignments.data?.data)
        ? resAssignments.data.data
        : Array.isArray(resAssignments.data)
        ? resAssignments.data
        : [];

      const allTickets = Array.isArray(resTickets.data)
        ? resTickets.data
        : [];

      const employees = Array.isArray(resEmployees.data)
        ? resEmployees.data
        : [];

      // Filter assignments for this employee
      const filteredAssignments = assignments.filter(
        (a) => Number(a.assigned_to_emp) === Number(empId)
      );

      // Merge ticket info
      const mergedTickets = filteredAssignments.map((assign) => {
        const ticketInfo = allTickets.find(
          (t) => t.TicketTrackId === assign.ticket_id
        );
        return { ...ticketInfo, ...assign };
      });

      // Calculate stats
      const totalTickets = mergedTickets.length;
      const pendingTickets = mergedTickets.filter(ticket => {
        const status = ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase();
        return status === 'pending' || status === 'reopened';
      }).length;
      const resolvedTickets = mergedTickets.filter(ticket => {
        const status = ticket?.TrackingHistory?.[0]?.StatusName?.toLowerCase();
        return status === 'resolved' || status === 'closed';
      }).length;

      // Get employee name
      const employee = employees.find(emp => Number(emp.Id) === Number(empId));
      const employeeName = employee ? employee.Name : 'Unknown Employee';

      setEmployeeStats({
        name: employeeName,
        totalTickets,
        pendingTickets,
        resolvedTickets,
      });

      setTickets(mergedTickets);
    } catch (error) {
      console.error("Failed to load tickets", error);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Employees (fallback)
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data); // Temporarily use tickets state for employees
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Failed to load employees", error);
      setError("Failed to load employees. Please try again later.");
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
    {
      name: "Customer",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustomerName || "N/A"}</span>
          <br />
          {/* {row.PhoneNumber || ""} */}
        </>
      ),
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
          // hour: "2-digit",
          // minute: "2-digit",
          // hour12: true,
        });
      },
      wrap: true,
    },
    {
      name: "Ticket Status",
      cell: (row) => {
        let status = row?.TrackingHistory?.[0]?.StatusName ?? "-";
        if (!status || status === "-") status = "Not Assigned";
        const colorMap = {
          Pending: "text-secondary fw-semibold",
          UnderReview: "text-info fw-semibold",
          Awaiting: "text-warning fw-semibold",
          Resolved: "text-success fw-semibold",
          Closed: "text-dark fw-semibold",
          Cancelled: "text-danger fw-semibold",
          Reopened: "text-primary fw-semibold",
          Forward: "text-purple fw-semibold",
          UserResponse: "text-teal fw-semibold",
          "Not Assigned": "text-muted fw-semibold",
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
    const statusName = (
      ticket?.TrackingHistory?.[0]?.StatusName || ""
    ).toLowerCase();
    // const statusMatch =
    //   selectedStatus === "All" || statusName === selectedStatus.toLowerCase();
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
