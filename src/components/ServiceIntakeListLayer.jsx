import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";

const MOCK_ROWS = [
  {
    id: 1,
    intakeId: "SIF-1001",
    customerName: "Rahul Kumar",
    phone: "9876543210",
    car: "Hyundai i20",
    status: "Pending",
    createdDate: "2026-05-01",
  },
  {
    id: 2,
    intakeId: "SIF-1002",
    customerName: "Anita Singh",
    phone: "9123456780",
    car: "Maruti Baleno",
    status: "Completed",
    createdDate: "2026-05-03",
  },
  {
    id: 3,
    intakeId: "SIF-1003",
    customerName: "Arjun Das",
    phone: "9988776655",
    car: "Tata Nexon",
    status: "In Progress",
    createdDate: "2026-05-05",
  },
];

const ServiceIntakeListLayer = () => {
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredRows = useMemo(() => {
    const q = searchText.toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return MOCK_ROWS.filter((row) => {
      const rowDate = new Date(row.createdDate);
      const textMatch =
        row.intakeId.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.car.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q);
      const statusMatch = status === "All" || row.status === status;
      const dateMatch =
        (!from || rowDate >= from) && (!to || rowDate <= to);

      return textMatch && statusMatch && dateMatch;
    });
  }, [searchText, status, fromDate, toDate]);

  const columns = [
    { name: "Intake ID", selector: (row) => row.intakeId, sortable: true },
    { name: "Customer", selector: (row) => row.customerName, sortable: true },
    { name: "Phone", selector: (row) => row.phone },
    { name: "Car", selector: (row) => row.car, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Created Date",
      selector: (row) => new Date(row.createdDate).toLocaleDateString("en-GB"),
      sortable: true,
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{ overflowX: "auto", whiteSpace: "nowrap" }}
            >
              <form
                className="navbar-search flex-grow-1 flex-shrink-1"
                style={{ minWidth: "180px" }}
              >
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search intake list"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
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
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                className="form-control flex-shrink-0"
                placeholder="DD-MM-YYYY"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                style={{ minWidth: "120px", flex: "1 1 130px" }}
              />

              <select
                className="form-select flex-shrink-0"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                style={{ minWidth: "140px", flex: "1 1 140px" }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <Link
                to="/service-intake-form"
                className="btn btn-primary-600 d-inline-flex align-items-center flex-shrink-0"
                style={{ height: "34px" }}
              >
                <Icon icon="ic:baseline-plus" width="18" height="18" />
                <span className="ms-1">Add</span>
              </Link>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRows}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No intake records found"
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceIntakeListLayer;
