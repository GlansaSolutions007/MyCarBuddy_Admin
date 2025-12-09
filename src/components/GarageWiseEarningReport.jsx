import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

// const API_BASE = import.meta.env.VITE_APIURL;

function GarageWiseEarningReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(false);
  }, []);

  const garageWiseEarnings = [
    {
      garageName: "Prime Auto Care",
      totalServices: 48,
      totalRevenue: 125000,
      totalGST: 22500,
      totalOurEarnings: 15000,
    },
    {
      garageName: "SpeedX Garage",
      totalServices: 32,
      totalRevenue: 82000,
      totalGST: 14760,
      totalOurEarnings: 9600,
    },
    {
      garageName: "Metro Motors",
      totalServices: 56,
      totalRevenue: 143500,
      totalGST: 25830,
      totalOurEarnings: 17200,
    },
    {
      garageName: "AutoFix Workshop",
      totalServices: 27,
      totalRevenue: 67500,
      totalGST: 12150,
      totalOurEarnings: 7800,
    },
    {
      garageName: "City Car Care",
      totalServices: 41,
      totalRevenue: 113000,
      totalGST: 20340,
      totalOurEarnings: 13600,
    },
    {
      garageName: "WheelMasters Garage",
      totalServices: 22,
      totalRevenue: 54000,
      totalGST: 9720,
      totalOurEarnings: 6600,
    },
    {
      garageName: "ProMechanics",
      totalServices: 35,
      totalRevenue: 89000,
      totalGST: 16020,
      totalOurEarnings: 10600,
    },
  ];
  const filters = [
    (item) => item.garageName.toLowerCase().includes(searchTerm.toLowerCase()),
    (item) => !fromDate || item.date >= fromDate,
    (item) => !toDate || item.date <= toDate,
  ];
  const filteredData = garageWiseEarnings.filter((item) =>
    filters.every((fn) => fn(item))
  );

  const columns = [
    {
      name: "Garage Name",
      selector: (row) => row.garageName,
      sortable: true,
    },
    {
      name: "Total Services",
      selector: (row) => row.totalServices,
      sortable: true,
    },
    {
      name: "Total Revenue",
      selector: (row) => row.totalRevenue,
      sortable: true,
    },
    {
      name: "Total GST",
      selector: (row) => row.totalGST,
      sortable: true,
    },
    {
      name: "Total Our Earnings",
      selector: (row) => row.totalOurEarnings,
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
                  <label htmlFor="fromDate" className="form-label mb-0">
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
                  <label htmlFor="toDate" className="form-label mb-0">
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
                ? "Loading Garage Wise Earning Report..."
                : "No Garage Wise Earning Report available"
            }
          />
        </div>
      </div>
    </div>
  );
}
export default GarageWiseEarningReport;
