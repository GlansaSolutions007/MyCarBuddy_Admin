import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeTicketViewLayer = () => {
  const [tickets, setTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchAssignedTickets();
  }, []);

  // Fetch assigned tickets for current employee
  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}Tickets/assigned/${userId}`, {
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
      console.error("Failed to load assigned tickets", error);
      setError("Failed to load assigned tickets. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Accept Ticket
  const handleAcceptTicket = async (ticketId) => {
    try {
      await axios.put(`${API_BASE}Tickets/${ticketId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Success", "Ticket accepted successfully", "success");
      fetchAssignedTickets(); // Refresh the list
    } catch (error) {
      console.error("Failed to accept ticket:", error);
      Swal.fire("Error", "Failed to accept ticket", "error");
    }
  };

  // Handle Reject Ticket
  const handleRejectTicket = async (ticketId) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Ticket",
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Enter the reason for rejecting this ticket...",
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc3545",
    });

    if (reason) {
      try {
        await axios.put(`${API_BASE}Tickets/${ticketId}/reject`, { reason }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.fire("Rejected", "Ticket has been rejected", "info");
        fetchAssignedTickets(); // Refresh the list
      } catch (error) {
        console.error("Failed to reject ticket:", error);
        Swal.fire("Error", "Failed to reject ticket", "error");
      }
    }
  };

  // Status Options
  const statusOptions = [
    { value: 0, label: "Pending", color: "#ffc107", text: "#000" },
    { value: 1, label: "Under Review", color: "#0dcaf0", text: "#fff" },
    { value: 2, label: "Resolved", color: "#198754", text: "#fff" },
    { value: 3, label: "Cancelled", color: "#6c757d", text: "#fff" },
    { value: 4, label: "Accepted", color: "#20c997", text: "#fff" },
    { value: 5, label: "Rejected", color: "#dc3545", text: "#fff" },
  ];

  // DataTable Columns
  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
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
    {
      name: "Status",
      cell: (row) => {
        const currentStatus =
          statusOptions.find((s) => s.value === row.Status) || statusOptions[0];
        return (
          <span
            style={{
              backgroundColor: currentStatus.color,
              color: currentStatus.text,
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            {currentStatus.label}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          {row.Status === 0 && ( // Only show for pending tickets
            <>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleAcceptTicket(row.TicketID)}
                title="Accept Ticket"
              >
                <Icon icon="mdi:check" />
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRejectTicket(row.TicketID)}
                title="Reject Ticket"
              >
                <Icon icon="mdi:close" />
              </button>
            </>
          )}
          {row.Status === 4 && (
            <span className="text-success fw-bold">Accepted</span>
          )}
          {row.Status === 5 && (
            <span className="text-danger fw-bold">Rejected</span>
          )}
        </div>
      ),
      width: "150px",
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

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <h5 className="mb-0">My Assigned Tickets</h5>
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
          </div>

          <div className="card-body p-24">
            {error ? (
              <div className="alert alert-danger">{error}</div>
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
                defaultSortField="CreatedDate"
                defaultSortAsc={false}
                noDataComponent={
                  loading ? "Loading tickets..." : "No assigned tickets available"
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTicketViewLayer;
