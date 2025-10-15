import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const TodayBookingsLayer = () => {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    let fromDate = startDate;
    let toDate = endDate;
    if (!fromDate || !toDate) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      fromDate = today;
      toDate = today;
    }
    try {
      const res = await axios.get(
        `${API_BASE}Reports?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(res.data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const columns = [
    {
      name: "S No",
      selector: (row, index) => index + 1,
      width: "80px",
    },
    {
      name: "Tech ID",
      selector: (row) => (
        <Link to={`/view-technician/${row.techID}?from=today`} className="text-primary">
          {row.techID}
        </Link>
      ),
      width: "100px",
    },
    {
      name: "Tech Name",
      selector: (row) => row.techFullName,
      width: "200px",
    },
    {
      name: "Dealer Name",
      selector: (row) => row.dealerName || "N/A",
      width: "200px",
    },
    {
      name: "Booking Count",
      selector: (row) => row.bookingCount,
      width: "150px",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          <Link
            to={`/view-technician/${row.techID}?from=today`}
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View Technician"
          >
            <Icon icon="lucide:eye" />
          </Link>
        </div>
      ),
      width: "100px",
    },
  ];

  const filteredData = data.filter((item) => {
    if (item.techID === 0) return false; // Exclude rows where techID is 0

    const matchesSearch =
      item.techFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.dealerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.techID?.toString().includes(searchText);

    return matchesSearch;
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Todays_Bookings");
    XLSX.writeFile(workbook, "Todays_Bookings_Report.xlsx");
  };

  return (
    <div className="row gy-4">
      <div className="col-12 col-xxl-4">
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Tech Name, Dealer Name, Tech ID"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary radius-8 px-14 py-6 text-sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Icon icon="tabler:filter" /> Filters
                </button>
                <button
                  className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  onClick={exportToExcel}
                >
                  <Icon icon="mdi:microsoft-excel" width="20" height="20" />
                </button>
              </div>
            </div>
            {showFilters && (
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <input
                  type="date"
                  className="form-control"
                  placeholder="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: "160px" }}
                />
                <input
                  type="date"
                  className="form-control"
                  placeholder="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: "160px" }}
                />
                <button
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, filteredData.length]}
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No today's bookings available"
          />
        </div>
      </div>
    </div>
  );
};

export default TodayBookingsLayer;
