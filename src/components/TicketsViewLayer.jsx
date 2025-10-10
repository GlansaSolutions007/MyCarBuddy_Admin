import React, { useEffect, useState } from "react";
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

  // Status Options
  const statusOptions = [
    { value: 0, label: "Pending", color: "#ffc107", text: "#000" },
    { value: 1, label: "Under Review", color: "#0dcaf0", text: "#fff" },
    { value: 2, label: "Resolved", color: "#198754", text: "#fff" },
    { value: 3, label: "Cancelled", color: "#6c757d", text: "#fff" },
  ];

  // Handle Status Change (PUT API call)
  const handleStatusChange = async (ticketTrackId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}Tickets`,
        {
          ticketTrackId,
          status: newStatus,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: "Ticket status updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchTickets();
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update ticket status.",
      });
    }
  };

  // DataTable Columns
  const columns = [
    {
      name: "S.No",
      selector: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
      width: "80px",
    },
    {
      name: "Ticket Track ID",
      selector: (row) => row.TicketTrackId || "-",
      sortable: true,
    },
    {
      name: "Customer Name",
      selector: (row) => row.CustomerName || "N/A",
      sortable: true,
    },
    {
      name: "Booking Track ID",
      selector: (row) => row.BookingTrackID || "-",
      sortable: true,
    },
    { name: "Description", selector: (row) => row.Description || "-" },

    // Stylish dropdown for Status
    {
      name: "Status",
      cell: (row) => {
        const currentStatus =
          statusOptions.find(
            (s) =>
              s.label.toLowerCase() === row.StatusName?.toLowerCase()
          ) || statusOptions[0];

        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <select
              value={currentStatus.value}
              onChange={(e) =>
                handleStatusChange(row.TicketTrackId, Number(e.target.value))
              }
              style={{
                borderRadius: "20px",
                padding: "4px 22px 4px 10px",
                fontSize: "13px",
                fontWeight: "500",
                border: "none",
                backgroundColor: currentStatus.color,
                color: currentStatus.text,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                cursor: "pointer",
                minWidth: "110px",
                textAlign: "center",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='white' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "14px",
              }}
            >
              {statusOptions.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                  style={{
                    backgroundColor: "#fff",
                    color: "#000",
                  }}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        );
      },
      sortable: true,
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
        <div className="chat-main card overflow-hidden p-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <form className="navbar-search">
              <input
                type="text"
                className="bg-base w-auto form-control"
                name="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search Tickets"
              />
              <Icon icon="ion:search-outline" className="icon" />
            </form>

            <Link
              to="/add-tickets"
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
            >
              <Icon
                icon="ic:baseline-plus"
                className="icon text-xl line-height-1"
              />
              Add Ticket
            </Link>
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
