
import { useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";

function TicketsViewLayer() {
  const [searchText, setSearchText] = useState("");

  // Sample data for the table
  const tickets = [
    {
      id: 1,
      ticketId: 'TKT001',
      customerName: 'John Doe',
      bookingId: 'BK001',
      description: 'Issue with booking confirmation',
      status: 'Pending'
    },
    {
      id: 2,
      ticketId: 'TKT002',
      customerName: 'Jane Smith',
      bookingId: 'BK002',
      description: 'Refund request',
      status: 'Resolved'
    },
    {
      id: 3,
      ticketId: 'TKT003',
      customerName: 'Bob Johnson',
      bookingId: 'BK003',
      description: 'Service delay',
      status: 'Under Review'
    },
    {
      id: 4,
      ticketId: 'TKT004',
      customerName: 'Alice Brown',
      bookingId: 'BK004',
      description: 'Payment not processed',
      status: 'Pending'
    }
  ];

  const columns = [
    { name: "S. No", selector: (row) => row.id, sortable: true, width: "100px" },
    { name: "Ticket ID", selector: (row) => row.ticketId, sortable: true },
    { name: "Customer Name", selector: (row) => row.customerName, sortable: true },
    { name: "Booking ID", selector: (row) => row.bookingId, sortable: true },
    { name: "Description", selector: (row) => row.description, width: "250px" },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <button className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center" title="View">
            <Icon icon="lucide:eye" />
          </button>
          <button className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center" title="Edit">
            <Icon icon="lucide:edit" />
          </button>
        </div>
      ),
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${
            row.status.toLowerCase() === "resolved"
              ? "bg-success"
              : row.status.toLowerCase() === "under review"
              ? "bg-info"
              : row.status.toLowerCase() === "pending"
              ? "bg-warning"
              : "bg-primary"
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
  ];

  // Filter by search
  const filteredTickets = tickets.filter((ticket) =>
    ticket.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
    ticket.ticketId?.toLowerCase().includes(searchText.toLowerCase()) ||
    ticket.bookingId?.toLowerCase().includes(searchText.toLowerCase()) ||
    ticket.description?.toLowerCase().includes(searchText.toLowerCase())
  );

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
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredTickets}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, filteredTickets.length]}
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Tickets available"
          />
        </div>
      </div>
    </div>
  );
}

export default TicketsViewLayer;
