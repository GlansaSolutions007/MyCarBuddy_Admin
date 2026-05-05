import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const ServiceIntakeListLayer = () => {
  const token = localStorage.getItem("token");
  const [inspectionRows, setInspectionRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    const fetchInspections = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}Inspection`, { headers });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setInspectionRows(data);
      } catch (error) {
        console.error("Failed to load inspection list", error);
        setInspectionRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspections();
  }, [headers]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadPdf = async (inspectionId, trackId) => {
    if (!inspectionId) return;

    setDownloadingId(inspectionId);
    try {
      const response = await axios.get(
        `${API_BASE}Inspection/checklist-pdf/${inspectionId}`,
        {
          headers,
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], {
        type: response.data?.type || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inspection_checklist_${trackId || inspectionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download inspection checklist PDF", error);
      alert("Unable to download inspection checklist PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return inspectionRows.filter((row) => {
      const rowDate = row.CreatedDate ? new Date(row.CreatedDate) : null;
      const car = [row.Brand, row.Model, row.Fuel].filter(Boolean).join(" ");
      const textMatch =
        !q ||
        [
          row.TrackId,
          row.CustName,
          row.PhoneNumber,
          row.Email,
          row.VehicleNumber,
          car,
          row.AmountStatus,
          row.Location,
          row.Area,
          row.TechnicianName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      const statusMatch = status === "All" || row.AmountStatus === status;
      const dateMatch =
        (!from || (rowDate && rowDate >= from)) &&
        (!to || (rowDate && rowDate <= to));

      return textMatch && statusMatch && dateMatch;
    });
  }, [inspectionRows, searchText, status, fromDate, toDate]);

  const columns = [
    { name: "Track ID", selector: (row) => row.TrackId || "-", sortable: true },
    { name: "Customer", selector: (row) => row.CustName || "-", sortable: true },
    { name: "Phone", selector: (row) => row.PhoneNumber || "-" },
    {
      name: "Car",
      selector: (row) =>
        [row.Brand, row.Model].filter(Boolean).join(" ") || "-",
      sortable: true,
    },
    {
      name: "Vehicle No.",
      selector: (row) => row.VehicleNumber || "-",
      sortable: true,
    },
    {
      name: "Inspection Date",
      selector: (row) => formatDateTime(row.InspectionDate),
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row) =>
        row.InspectionAmount !== null && row.InspectionAmount !== undefined
          ? row.InspectionAmount
          : "-",
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.AmountStatus || "-",
      sortable: true,
      cell: (row) => (
        <span
          className={
            row.AmountStatus === "Success" || row.AmountStatus === "Completed"
              ? "badge bg-success-100 text-success-600"
              : "badge bg-warning-100 text-warning-600"
          }
        >
          {row.AmountStatus || "-"}
        </span>
      ),
    },
    // {
    //   name: "Created Date",
    //   selector: (row) => formatDate(row.CreatedDate),
    //   sortable: true,
    // },
    {
      name: "PDF",
      button: true,
      cell: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
          onClick={() => handleDownloadPdf(row.Id, row.TrackId)}
          disabled={downloadingId === row.Id}
          title="Download checklist PDF"
        >
          <Icon icon="mdi:download" width="16" height="16" />
          {downloadingId === row.Id ? "..." : "PDF"}
        </button>
      ),
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
            progressPending={isLoading}
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
