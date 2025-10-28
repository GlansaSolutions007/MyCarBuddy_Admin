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

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

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
    } catch (error) {
      console.error("Failed to load tickets", error);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Removed status update logic for simplified listing

  // DataTable Columns
  const columns = [
    {
      name: "Ticket id",
      selector: (row) => (
        <Link to={`/tickets/${(row.TicketID ?? row.TicketId ?? row.Id)}`} className="text-primary">
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
          {row.PhoneNumber || ""}
        </>
      ),
    },
    {
      name: "Booking id",
      selector: (row) => row.BookingTrackID || "-",
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
            to={`/tickets/${(row.TicketID ?? row.TicketId ?? row.Id)}`}
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
    return (
      ticket.CustomerName?.toLowerCase().includes(text) ||
      ticket.TicketTrackId?.toLowerCase().includes(text) ||
      ticket.BookingTrackID?.toLowerCase().includes(text) ||
      ticket.Description?.toLowerCase().includes(text)
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="card overflow-hidden p-3">
          <div className="card-header">
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
              <div className="d-flex gap-2">
                <Link
                  to="/add-tickets"
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                >
                  <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                  Add Ticket
                </Link>
              </div>
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
