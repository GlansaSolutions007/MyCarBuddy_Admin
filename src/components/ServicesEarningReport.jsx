import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

// const API_BASE = import.meta.env.VITE_APIURL;

const ServicesEarningReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [serviceType, setServiceType] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(false);
  }, []);

  const dummyData = [
    {
      id: 1,
      date: "2025-01-10",
      serviceName: "Engine Oil Replacement",
      garageName: "Prime Auto Garage",
      type: "Service",
      price: 1200,
      gst: 216,
      percent: 10,
      ourEarnings: 336,
    },
    {
      id: 2,
      date: "2025-01-12",
      serviceName: "Brake Pad Replacement",
      garageName: "City Motors",
      type: "Spare",
      price: 1800,
      gst: 324,
      percent: 12,
      ourEarnings: 540,
    },
    {
      id: 3,
      date: "2025-01-15",
      serviceName: "Car Wash - Premium",
      garageName: "Shine Hub",
      type: "Service",
      price: 500,
      gst: 90,
      percent: 8,
      ourEarnings: 130,
    },
    {
      id: 4,
      date: "2025-01-10",
      serviceName: "Engine Oil Replacement",
      garageName: "Prime Auto Garage",
      type: "Service",
      price: 1200,
      gst: 216,
      percent: 10,
      ourEarnings: 336,
    },
    {
      id: 5,
      date: "2025-01-12",
      serviceName: "Brake Pad Replacement",
      garageName: "City Motors",
      type: "Spare",
      price: 1800,
      gst: 324,
      percent: 12,
      ourEarnings: 540,
    },
    {
      id: 6,
      date: "2025-01-15",
      serviceName: "Car Wash - Premium",
      garageName: "Shine Hub",
      type: "Service",
      price: 500,
      gst: 90,
      percent: 8,
      ourEarnings: 130,
    },
  ];

  const filters = [
    (item) =>
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.garageName.toLowerCase().includes(searchTerm.toLowerCase()),
    (item) =>
      !serviceType || item.type.toLowerCase() === serviceType.toLowerCase(),
    (item) => !fromDate || item.date >= fromDate,
    (item) => !toDate || item.date <= toDate,
  ];
  const filteredData = dummyData.filter((item) =>
    filters.every((fn) => fn(item))
  );

  const columns = [
    {
      name: "Date",
      selector: (row) =>
        new Date(row.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      sortable: true,
    },

    {
      name: "Service Name",
      selector: (row) => row.serviceName,
      sortable: true,
    },
    {
      name: "Garage Name",
      selector: (row) => row.garageName,
      sortable: true,
    },
    {
      name: "Price",
      selector: (row) => row.price,
      sortable: true,
    },
    {
      name: "GST",
      selector: (row) => row.gst,
    },
    {
      name: "Our Percentage",
      selector: (row) => row.percent,
    },
    {
      name: "Our Earnings",
      selector: (row) => row.ourEarnings,
    },

    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link
            // to={`/emp-leads-report/${row.EmpId}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:eye" />
          </Link>
        </div>
      ),
    },
  ];

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label  mb-0">Type:</label>
                  <select
                    className="form-control"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Service">Service</option>
                    <option value="Spare">Spare</option>
                  </select>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="fromDate" className="form-label  mb-0">
                    From:
                  </label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-control"
                    placeholder="DD-MM-YYYY"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="toDate" className="form-label  mb-0">
                    To:
                  </label>
                  <input
                    type="date"
                    id="toDate"
                    className="form-control"
                    placeholder="DD-MM-YYYY"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
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
              loading
                ? "Loading Service / Spare Part Earnings Report..."
                : "No Service / Spare Part Earnings Report available"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ServicesEarningReport;
