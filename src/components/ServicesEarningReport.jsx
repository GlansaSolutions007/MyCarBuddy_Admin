import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
const API_BASE = import.meta.env.VITE_APIURL;

const ServicesEarningReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceData, setServiceData] = useState([]);

  const token = localStorage.getItem("token");

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}Supervisor/ServiceWiseReport`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("API Response:", response.data);
      setServiceData(response.data);
    } catch (error) {
      console.error("Failed to fetch service earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  const filters = [
    (item) =>
      item.ServiceName.includes(searchTerm) ||
      item.GarageName.includes(searchTerm),
    (item) => !serviceType || item.ServiceType === serviceType,
    (item) => !fromDate || item.CreatedDate >= fromDate,
    (item) =>
      !toDate ||
      new Date(item.CreatedDate) <=
        new Date(new Date(toDate).setHours(23, 59, 59, 999)),
  ];
  const filteredData = serviceData.filter((item) =>
    filters.every((fn) => fn(item))
  );

  const columns = [
    {
      name: "Date",
      selector: (row) =>
        new Date(row.CreatedDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      sortable: true,
    },
    {
      name: "Service Type",
      selector: (row) => row.ServiceType,
      sortable: true,
    },
    {
      name: "Service Name",
      selector: (row) => row.ServiceName,
      sortable: true,
    },
    {
      name: "Garage Name",
      selector: (row) => row.GarageName,
      sortable: true,
    },
    {
      name: "Price",
      selector: (row) => row.Price,
      sortable: true,
    },
    {
      name: "GST",
      selector: (row) => row.GST,
    },
    {
      name: "Our Percentage",
      selector: (row) => row.OurPercentage,
    },
    {
      name: "Our Earnings",
      selector: (row) => row.OurEarnings,
    },

    // {
    //   name: "Actions",
    //   cell: (row) => (
    //     <div>
    //       <Link
    //         // to={`/emp-leads-report/${row.EmpId}`}
    //         className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
    //       >
    //         <Icon icon="lucide:eye" />
    //       </Link>
    //     </div>
    //   ),
    // },
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
                    <option value="Package">Package</option>
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
