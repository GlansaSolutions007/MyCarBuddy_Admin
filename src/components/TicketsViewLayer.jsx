import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const TicketsViewLayer = () => {
  const [tickets, setTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState("Pending, Reopened");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const userDetails = JSON.parse(localStorage.getItem("employeeData"));

  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch Tickets
  const fetchTickets = async () => {
    const url =
      role === "Admin"
        ? `${API_BASE}Tickets`
        : `${API_BASE}Tickets?role=${role}&UserID=${userId}`;

    try {
      setLoading(true);

      if (role === "Admin") {
        // ✅ Admin: fetch all tickets (unchanged)
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data && Array.isArray(res.data)) {
          setTickets(res.data);
        } else {
          setTickets([]);
        }
      } else {
        // ✅ Head / Employee: fetch from Ticket_Assignments
        const [resAssignments, resTickets] = await Promise.all([
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
        ]);

        const assignments = Array.isArray(resAssignments.data?.data)
          ? resAssignments.data.data
          : Array.isArray(resAssignments.data)
            ? resAssignments.data
            : [];

        const allTickets = Array.isArray(resTickets.data)
          ? resTickets.data
          : [];

        let filteredAssignments = [];

        // ✅ Head: show tickets assigned to this head
        // ✅ Employee: show tickets assigned to this employee
        if (userDetails?.Is_Head === 1) {
          filteredAssignments = assignments.filter(
            (a) => Number(a.assigned_to_head) === Number(userDetails.Id)
          );
        } else {
          filteredAssignments = assignments.filter(
            (a) => Number(a.assigned_to_emp) === Number(userDetails.Id)
          );
        }

        // ✅ Merge ticket info
        const mergedTickets = filteredAssignments.map((assign) => {
          const ticketInfo = allTickets.find(
            (t) => t.TicketTrackId === assign.ticket_id
          );
          return { ...ticketInfo, ...assign };
        });

        setTickets(mergedTickets);
      }
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

    // {
    //   name: "Ticket Status",
    //   cell: (row) => {
    //     const status = row?.TrackingHistory?.[0]?.StatusName ?? "-";
    //     const colorMap = {
    //         Pending: "bg-secondary text-white",
    //         UnderReview: "bg-info text-white",
    //         Awaiting: "bg-warning text-dark",
    //         Resolved: "bg-success text-white",
    //         Closed: "bg-dark text-white",
    //         Cancelled: "bg-danger text-white",
    //         Reopened: "bg-primary text-white",
    // Forward: "bg-purple text-white",
    //       };
    //     const badgeClass = colorMap[status] || "bg-light text-dark";
    //     return (
    //       <span className={`badge rounded-pill px-3 py-1 ${badgeClass}`}>
    //         {status}
    //       </span>
    //     );
    //   },
    //   wrap: true,
    // },
    // {
    //   name: "Ticket Status",
    //   cell: (row) => {
    //     let status = row?.TrackingHistory?.[0]?.StatusName ?? "-";
    //     if (!status || status === "-") status = "Not Assigned";
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
    //       "Not Assigned": "text-muted fw-semibold",
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
        let status = row?.TrackingHistory?.[0]?.StatusName ?? "-";
        if (!status || status === "-") status = "Not Assigned";

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
          "Not Assigned": "#BFBFBF", // Grey
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
      name: "Assigned Emp",
      selector: (row) => row.EmployeeName || "-",
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
  const filteredTickets = tickets.filter((ticket) => {
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

  // Pagination
  const handlePageChange = (page) => setCurrentPage(page);
  const handleRowsPerPageChange = (newRowsPerPage, page) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(page);
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3"></div>
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* 🔍 Search Input */}
              <form
                className="navbar-search flex-grow-1 flex-shrink-1 position-relative"
                style={{ minWidth: "180px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search Tickets"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    minWidth: "200px",
                    width: "100%",
                  }}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* 📅 Date Filters */}
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <label className="text-sm fw-semibold mb-0">From:</label>
                <input
                  type="date"
                  className="form-control text-sm"
                  placeholder="DD-MM-YYYY"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ minWidth: "130px", flex: "1 1 130px" }}
                />
                <label className="text-sm fw-semibold mb-0">To:</label>
                <input
                  type="date"
                  className="form-control text-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ minWidth: "130px", flex: "1 1 130px" }}
                />
              </div>

              {/* 🔁 Status Filter */}
              <select
                className="form-select flex-shrink-0 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ minWidth: "180px", flex: "1 1 180px" }}
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

              {/* ➕ Add Ticket Button */}
              <Link
                to="/add-tickets"
                className="btn btn-primary d-flex align-items-center gap-1 text-sm flex-shrink-0"
                style={{
                  whiteSpace: "nowrap",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  flex: "0 0 auto",
                }}
              >
                <Icon icon="ic:baseline-plus" width="18" height="18" />
                Add Ticket
              </Link>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredTickets}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={
                loading ? "Loading tickets..." : "No tickets available"
              }
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handleRowsPerPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsViewLayer;
