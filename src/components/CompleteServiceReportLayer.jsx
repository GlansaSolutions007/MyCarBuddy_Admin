import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

const STATUS_BADGE_CLASS = {
  Confirmed: "bg-info bg-opacity-15 text-info",
  "In Progress": "bg-primary bg-opacity-15 text-primary",
  Completed: "bg-success bg-opacity-15 text-success",
  Pending: "bg-warning bg-opacity-15 text-warning",
};
const getStatusBadgeClass = (status) => STATUS_BADGE_CLASS[status] || "bg-secondary bg-opacity-15 text-secondary";

// Parse DD/MM/YYYY to Date
const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split("/").map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
};

// Generate static list data (simulates 1000+ bookings – use API later)
const buildStaticList = () => {
  const customers = ["Aditya Soni", "Rahul Verma", "Priya Sharma", "Vikram Singh", "Anita Patel", "Suresh Kumar", "Kavita Nair", "Rajesh Mehta", "Pooja Reddy", "Amit Joshi", "Neha Gupta", "Sanjay Rao", "Divya Iyer", "Kiran Desai", "Meera Nair"];
  const phones = ["8233341955", "9705577208", "9876543210", "9123456789", "9988776655", "9876501234", "9123409876", "9765432109", "9654321098", "9543210987", "9432109876", "9321098765", "9210987654", "9109876543", "9098765432"];
  const sources = ["Website", "App", "Digital Marketing"];
  const serviceTypes = ["Service at Garage", "Service at Doorstep"];
  const statuses = ["Confirmed", "In Progress", "Completed", "Pending"];
  const list = [];
  for (let i = 1; i <= 48; i++) {
    const date = new Date(2026, 1, 15 + (i % 14));
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    list.push({
      id: i,
      leadId: `MCBI${String(66000 + i).padStart(5, "0")}`,
      bookingId: `MYCAR${String(2026022000 + i).toString(36).toUpperCase().slice(-6)}`,
      customerName: customers[(i - 1) % customers.length],
      phone: phones[(i - 1) % phones.length],
      source: sources[(i - 1) % sources.length],
      serviceType: serviceTypes[i % 2],
      bookingStatus: statuses[i % 4],
      createdAt: `${day}/${month}/${year}`,
      dateForFilter: `${year}-${month}-${day}`,
      amount: [0, 599, 1710, 5000, 16088, 25000][i % 6],
    });
  }
  return list;
};

const STATIC_LIST = buildStaticList();

// One full flow template (detail for any selected row – replace with API by id later)
const getFlowDetailFor = (row) => ({
  lead: {
    id: row?.leadId ?? "MCBI06634",
    source: row?.source ?? "Website",
    alternateSource: "App / Digital Marketing",
    createdAt: row?.createdAt ?? "21/02/2026",
    customerName: row?.customerName ?? "Aditya Soni",
    phone: "8233341955",
    vehicle: "Swift Dzire • Petrol",
    status: "Converted to Customer",
  },
  telecaller: {
    adminAssignDate: "21/02/2026",
    headName: "Telecaller Head (Ramesh)",
    headAssignTo: "22/02/2026",
    telecallerName: "Telecaller (Priya)",
    assignedDate: "22/02/2026",
    followUps: [
      { date: "22/02/2026", outcome: "Interested", nextAction: "Ok for Service" },
      { date: "22/02/2026", outcome: "Follow-up", nextAction: "Schedule Booking" },
    ],
    bookingCreatedBy: "Priya (Telecaller)",
    bookingCreatedDate: "22/02/2026",
  },
  booking: {
    bookingId: row?.bookingId ?? "MYCAR022026D70",
    confirmedDate: "22/02/2026",
    status: row?.bookingStatus ?? "Confirmed",
    paymentStatus: "Pending",
    totalAmount: "₹ 1,710",
  },
  supervisor: {
    headName: "Madhukar (Supervisor Head)",
    assignedDate: "22/02/2026",
    inspectionDone: "22/02/2026",
    dealerAssigned: "Glansa Dealer",
    technicianAssigned: "Naveen Nagam (Tech)",
    serviceType: row?.serviceType ?? "Service at Garage",
    alternateType: "Service at Doorstep",
  },
  garageFlow: {
    pickupType: "Customer to Dealer",
    pickupDriver: "Driver – Rajesh",
    pickupDate: "23/02/2026",
    pickupTime: "09:30",
    fromLocation: `Customer Location (${row?.customerName ?? "Aditya Soni"})`,
    toLocation: "Glansa Dealer",
    serviceTechnician: "Naveen Nagam",
    dealerToDealer: "Car passed to dealer for service",
    serviceDoneAtDealer: "23/02/2026",
    estimationInvoice: "Generated – ₹ 1,710",
    finalInvoice: "Generated – Full payment",
    dealerInvoice: "Glansa Dealer invoice raised",
    fieldAdvisor: "Mahendra Reddy",
    fieldAdvisorCheckDate: "23/02/2026",
    serviceStatusVerified: "Done",
    deliveryDriver: "Driver – Rajesh",
    deliveryTo: "Customer Location",
    deliveryDate: "23/02/2026",
    deliveryTime: "18:00",
  },
  doorstepFlow: {
    technician: "Naveen Nagam",
    serviceDate: "23/02/2026",
    serviceAt: "Customer doorstep",
    status: "Service completed at location",
  },
});

const CardSection = ({ title, icon, children, badge, step }) => (
  <div className="card border-0 shadow-sm rounded-3 mb-3 overflow-hidden border-start border-3 border-primary">
    <div className="card-header bg-light border-0 py-3 px-4 d-flex align-items-center justify-content-between">
      <span className="d-flex align-items-center gap-3">
        {step != null && (
          <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: "0.8rem" }}>
            {step}
          </span>
        )}
        <span className="d-flex align-items-center gap-2 fw-semibold text-dark">
          <Icon icon={icon} width={20} height={20} className="text-primary opacity-75" />
          {title}
        </span>
      </span>
      {badge && <span className="badge rounded-pill bg-primary-600 px-3">{badge}</span>}
    </div>
    <div className="card-body py-3 px-4">{children}</div>
  </div>
);

function DetailRow({ label, value }) {
  return (
    <div className="d-flex align-items-start gap-2 py-2 border-bottom border-light border-opacity-50">
      <span className="text-muted small text-nowrap" style={{ minWidth: "100px" }}>{label}</span>
      <span className="small fw-medium text-dark">{value}</span>
    </div>
  );
}

function FlowDetailView({ row, onBack, activePath, setActivePath }) {
  const d = useMemo(() => getFlowDetailFor(row), [row]);

  return (
    <div className="mb-4">
      <div className="card border-0 shadow-sm rounded-3 mb-4 overflow-hidden">
        <div className="card-body py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light bg-opacity-50">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3"
            onClick={onBack}
          >
            <Icon icon="mdi:arrow-left" width={18} /> Back to list
          </button>
          <div className="d-flex flex-wrap align-items-center gap-3 small">
            <span className="d-inline-flex align-items-center gap-1">
              <Icon icon="mdi:identifier" className="text-primary" />
              <strong>Lead</strong> {d.lead.id}
            </span>
            <span className="text-muted">|</span>
            <span className="d-inline-flex align-items-center gap-1">
              <Icon icon="mdi:calendar-check" className="text-primary" />
              <strong>Booking</strong> {d.booking.bookingId}
            </span>
            <span className="text-muted">|</span>
            <span className="d-inline-flex align-items-center gap-1">
              <Icon icon="mdi:account" className="text-primary" />
              {d.lead.customerName}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <CardSection step={1} title="Lead creation" icon="mdi:account-plus-outline" badge="Start">
            <div className="small">
              <DetailRow label="Lead ID" value={d.lead.id} />
              <DetailRow label="Source" value={`${d.lead.source} / ${d.lead.alternateSource}`} />
              <DetailRow label="Created" value={d.lead.createdAt} />
              <DetailRow label="Customer" value={`${d.lead.customerName} · ${d.lead.phone}`} />
              <DetailRow label="Vehicle" value={d.lead.vehicle} />
              <DetailRow label="Status" value={<span className="badge bg-success">{d.lead.status}</span>} />
            </div>
          </CardSection>
          <CardSection step={2} title="Telecaller department" icon="mdi:phone-in-talk-outline">
            <div className="small">
              <DetailRow label="Admin → Head" value={`${d.telecaller.headName} · ${d.telecaller.headAssignTo}`} />
              <DetailRow label="Head → Telecaller" value={`${d.telecaller.telecallerName} · ${d.telecaller.assignedDate}`} />
              <DetailRow label="Follow-ups" value={`${d.telecaller.followUps.length} entries`} />
              <DetailRow label="Booking created" value={`${d.telecaller.bookingCreatedBy} on ${d.telecaller.bookingCreatedDate}`} />
            </div>
          </CardSection>
          <CardSection step={3} title="Booking confirmed" icon="mdi:calendar-check">
            <div className="small">
              <DetailRow label="Booking ID" value={d.booking.bookingId} />
              <DetailRow label="Confirmed" value={d.booking.confirmedDate} />
              <DetailRow label="Status" value={<span className={`badge ${getStatusBadgeClass(d.booking.status)}`}>{d.booking.status}</span>} />
              <DetailRow label="Payment" value={`${d.booking.paymentStatus} · Total ${d.booking.totalAmount}`} />
            </div>
          </CardSection>
          <CardSection step={4} title="Supervisor Head" icon="mdi:account-supervisor">
            <div className="small">
              <DetailRow label="Assigned" value={`${d.supervisor.headName} · ${d.supervisor.assignedDate}`} />
              <DetailRow label="Dealer" value={d.supervisor.dealerAssigned} />
              <DetailRow label="Technician" value={d.supervisor.technicianAssigned} />
              <DetailRow label="Service type" value={<span className="badge bg-primary">{d.supervisor.serviceType}</span>} />
            </div>
          </CardSection>
        </div>
        <div className="col-lg-6">
          <CardSection step={5} title="Service type" icon="mdi:car-cog">
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm rounded-pill ${activePath === "garage" ? "btn-primary-600" : "btn-outline-secondary"}`}
                onClick={() => setActivePath("garage")}
              >
                <Icon icon="mdi:warehouse" className="me-1" /> Service at Garage
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill ${activePath === "doorstep" ? "btn-primary-600" : "btn-outline-secondary"}`}
                onClick={() => setActivePath("doorstep")}
              >
                <Icon icon="mdi:home" className="me-1" /> Service at Doorstep
              </button>
            </div>
          </CardSection>
          {activePath === "garage" && (
            <>
              <CardSection step={6} title="Car pickup" icon="mdi:car-side">
                <div className="small">
                  <DetailRow label="Route" value={d.garageFlow.pickupType} />
                  <DetailRow label="Driver" value={d.garageFlow.pickupDriver} />
                  <DetailRow label="Pickup" value={`${d.garageFlow.pickupDate} ${d.garageFlow.pickupTime}`} />
                  <DetailRow label="From → To" value={`${d.garageFlow.fromLocation} → ${d.garageFlow.toLocation}`} />
                </div>
              </CardSection>
              <CardSection step={7} title="Service at dealer" icon="mdi:car-wrench">
                <div className="small">
                  <DetailRow label="Technician" value={d.garageFlow.serviceTechnician} />
                  <DetailRow label="Done" value={d.garageFlow.serviceDoneAtDealer} />
                </div>
              </CardSection>
              <CardSection step={8} title="Invoices" icon="mdi:file-document-multiple">
                <div className="small">
                  <DetailRow label="Estimation" value={d.garageFlow.estimationInvoice} />
                  <DetailRow label="Final" value={d.garageFlow.finalInvoice} />
                  <DetailRow label="Dealer" value={d.garageFlow.dealerInvoice} />
                </div>
              </CardSection>
              <CardSection step={9} title="Field advisor" icon="mdi:clipboard-check">
                <div className="small">
                  <DetailRow label="Advisor" value={`${d.garageFlow.fieldAdvisor} · ${d.garageFlow.fieldAdvisorCheckDate}`} />
                  <DetailRow label="Status" value={<span className="badge bg-success">{d.garageFlow.serviceStatusVerified}</span>} />
                </div>
              </CardSection>
              <CardSection step={10} title="Delivery to customer" icon="mdi:car-arrow-right" badge="End">
                <div className="small">
                  <DetailRow label="Driver" value={d.garageFlow.deliveryDriver} />
                  <DetailRow label="To" value={d.garageFlow.deliveryTo} />
                  <DetailRow label="Date & time" value={`${d.garageFlow.deliveryDate} ${d.garageFlow.deliveryTime}`} />
                </div>
              </CardSection>
            </>
          )}
          {activePath === "doorstep" && (
            <CardSection step={6} title="Service at doorstep" icon="mdi:home-account" badge="End">
              <div className="small">
                <DetailRow label="Technician" value={d.doorstepFlow.technician} />
                <DetailRow label="Date" value={d.doorstepFlow.serviceDate} />
                <DetailRow label="Status" value={<span className="badge bg-success">{d.doorstepFlow.status}</span>} />
              </div>
            </CardSection>
          )}
        </div>
      </div>
    </div>
  );
}

const CompleteServiceReportLayer = () => {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState(null);
  const [activePath, setActivePath] = useState("garage");

  const filteredList = useMemo(() => {
    return STATIC_LIST.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.leadId.toLowerCase().includes(q) ||
        r.bookingId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.phone && r.phone.includes(q));
      const rowDate = parseDDMMYYYY(r.createdAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const matchesDate =
        (!fromDate || (rowDate && rowDate >= fromDate)) &&
        (!toDate || (rowDate && rowDate <= toDate));
      const matchesAmount =
        (!minAmt || r.amount >= parseFloat(minAmt)) &&
        (!maxAmt || r.amount <= parseFloat(maxAmt));
      const matchesStatus =
        statusFilter === "all" || r.bookingStatus === statusFilter;
      return matchesSearch && matchesDate && matchesAmount && matchesStatus;
    });
  }, [search, dateFrom, dateTo, minAmt, maxAmt, statusFilter]);

  // Table columns – same style as BookingLayer
  const columns = [
    {
      name: "Lead ID",
      selector: (row) => row.leadId,
      sortable: true,
      width: "120px",
    },
    {
      name: "Booking id",
      cell: (row) => (
        <button
          type="button"
          className="btn btn-link p-0 text-primary text-decoration-none fw-medium"
          onClick={() => setSelectedRow(row)}
        >
          {row.bookingId}
        </button>
      ),
      sortable: true,
      width: "160px",
    },
    {
      name: "Booking Date",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "120px",
    },
    {
      name: "Amount",
      selector: (row) => `₹${(row.amount ?? 0).toFixed(2)}`,
      sortable: true,
      width: "110px",
    },
    {
      name: "Cust. Name",
      cell: (row) => (
        <>
          <span className="fw-bold">{row.customerName}</span>
          <br />
          {row.phone || ""}
        </>
      ),
      sortable: true,
      sortField: "customerName",
      width: "150px",
    },
    {
      name: "Source",
      selector: (row) => row.source ?? "",
      sortable: true,
      width: "120px",
    },
    {
      name: "Service type",
      selector: (row) => row.serviceType ?? "",
      sortable: true,
      width: "160px",
    },
    {
      name: "Booking Status",
      cell: (row) => {
        const status = row.bookingStatus ?? "-";
        const colorMap = {
          Pending: "#F57C00",
          Confirmed: "#28A745",
          Completed: "#25878F",
          "In Progress": "#0d6efd",
        };
        const color = colorMap[status] || "#6c757d";
        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{ width: "8px", height: "8px", backgroundColor: color }}
            />
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      width: "140px",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View flow"
            onClick={() => setSelectedRow(row)}
          >
            <Icon icon="lucide:eye" />
          </button>
          <button
            type="button"
            className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="Service flow"
            onClick={() => setSelectedRow(row)}
          >
            <Icon icon="mdi:account-cog-outline" />
          </button>
        </div>
      ),
      width: "100px",
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        {selectedRow ? (
          <FlowDetailView
            row={selectedRow}
            onBack={() => setSelectedRow(null)}
            activePath={activePath}
            setActivePath={setActivePath}
          />
        ) : (
          <div className="card overflow-hidden p-3">
            <div className="card-header">
              <div
                className="d-flex align-items-center flex-wrap gap-2"
                style={{ overflowX: "auto", whiteSpace: "nowrap" }}
              >
                <form className="navbar-search flex-grow-1 flex-shrink-1" style={{ minWidth: "180px" }}>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Search"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                      }}
                      style={{ minWidth: "200px", width: "100%" }}
                    />
                    <Icon
                      icon="ion:search-outline"
                      className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                      width="20"
                      height="20"
                    />
                  </div>
                </form>
                <input
                  type="date"
                  className="form-control flex-shrink-0"
                  placeholder="DD-MM-YYYY"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                  }}
                  style={{ minWidth: "120px", flex: "1 1 130px" }}
                />
                <input
                  type="date"
                  className="form-control flex-shrink-0"
                  placeholder="DD-MM-YYYY"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                  }}
                  style={{ minWidth: "120px", flex: "1 1 130px" }}
                />
                <input
                  type="number"
                  className="form-control flex-shrink-0"
                  placeholder="Min Amt"
                  value={minAmt}
                  onChange={(e) => {
                    setMinAmt(e.target.value);
                  }}
                  style={{ minWidth: "100px", flex: "1 1 100px" }}
                />
                <input
                  type="number"
                  className="form-control flex-shrink-0"
                  placeholder="Max Amt"
                  value={maxAmt}
                  onChange={(e) => {
                    setMaxAmt(e.target.value);
                  }}
                  style={{ minWidth: "100px", flex: "1 1 100px" }}
                />
                <select
                  className="form-select flex-shrink-0"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                  style={{ minWidth: "120px", flex: "1 1 120px" }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  title="View flow report"
                >
                  <Icon icon="mdi:microsoft-excel" width="20" height="20" />
                </button>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={filteredList}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100, filteredList.length]}
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No records available"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteServiceReportLayer;
