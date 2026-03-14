import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Search,
  Truck,
  Hash,
  Calendar,
  ArrowRightLeft,
  Download,
  RotateCcw,
  FileText
} from "lucide-react";

const DealerVehicleReportLayer = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dealerId = localStorage.getItem("userId");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://dev-api.mycarsbuddy.com/api/ServiceImages/DealerPickupDeliveryReport?dealerId=${dealerId}`
      );
      setReports(response.data || []);
    } catch (error) {
      console.error("Error fetching dealer report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealerId) fetchReports();
  }, [dealerId]);

  const filteredReports = useMemo(() => {
    return reports.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, reports]);

  const stats = {
    total: reports.length,
    pickups: reports.filter(r => r.RouteType?.toLowerCase().includes('pickup')).length,
    deliveries: reports.filter(r => r.RouteType?.toLowerCase().includes('delivery')).length,
  };

  return (
    <div className="container-fluid py-3 px-3 bg-white min-vh-100">
      {/* --- COMPACT HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-3"></div>

      {/* --- MINI STATUS BAR (Compact Stats) --- */}
      <div className="d-flex gap-3 mb-3 overflow-auto pb-1">
        <div className="bg-white border rounded px-3 py-2 d-flex align-items-center shadow-sm">
          <span className="small text-muted me-2">Total:</span>
          <span className="fw-bold">{stats.total}</span>
        </div>
        <div className="bg-white border rounded px-3 py-2 d-flex align-items-center shadow-sm border-start border-primary border-3">
          <Truck size={14} className="text-primary me-2" />
          <span className="small text-muted me-2">Pickups:</span>
          <span className="fw-bold text-primary">{stats.pickups}</span>
        </div>
        <div className="bg-white border rounded px-3 py-2 d-flex align-items-center shadow-sm border-start border-success border-3">
          <ArrowRightLeft size={14} className="text-success me-2" />
          <span className="small text-muted me-2">Deliveries:</span>
          <span className="fw-bold text-success">{stats.deliveries}</span>
        </div>
      </div>

      {/* --- SEARCH & TABLE CARD --- */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white border-bottom-0 pt-3 px-3">
          <div className="position-relative w-100 w-md-25">
            {/* <Search className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" size={14} /> */}
            <input
              type="text"
              className="form-control form-control-sm ps-4 bg-light border-0"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light border-bottom">
                <tr className="text-muted small text-uppercase" style={{ fontSize: '0.75rem' }}>
                  <th className="ps-3 py-2 text-center">#</th>
                  <th className="py-2 text-center">Track ID</th>
                  <th className="py-2 text-center">Vehicle Type</th>
                  <th className="py-2 text-center">Action Date</th>
                  <th className="py-2 text-center">Route</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.85rem' }}>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted small">Loading records...</td></tr>
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((item, index) => (
                    <tr key={index}>
                      <td className="ps-3 text-muted text-center">{index + 1}</td>
                      <td className="fw-medium text-dark text-center">{item.BookingTrackID}</td>
                      <td className="text-center">
                        <span className="text-secondary">{item.TypeName}</span>
                      </td>
                      <td className="text-center">
                        {item.ActionDate ? new Date(item.ActionDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="text-center">
                        <RouteTypeBadge type={item.RouteType} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No records available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="card-footer bg-white border-top-0 py-2 px-3">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Showing {filteredReports.length} entries</span>
            {/* <span className="text-muted small italic" style={{ fontSize: '0.7rem' }}>Dealer ID: {dealerId}</span> */}
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: rotate 1.5s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .table > :not(caption) > * > * { padding: 0.6rem 0.4rem; }
        input::placeholder { font-size: 0.8rem; }
        .btn-sm { font-size: 0.75rem; padding: 0.25rem 0.6rem; }
      `}</style>
    </div>
  );
};

const RouteTypeBadge = ({ type }) => {
  const getBadge = () => {
    switch (type?.toLowerCase()) {
      case "serviceatdoorstep":
        return { label: "Service At Doorstep", class: "bg-info text-dark" };

      case "customertodealer":
        return { label: "Customer → Dealer", class: "bg-primary text-white" };

      case "dealertodealer":
        return { label: "Dealer → Dealer", class: "bg-warning text-dark" };

      case "dealertocustomer":
        return { label: "Dealer → Customer", class: "bg-success text-white" };

      default:
        return { label: type || "-", class: "bg-secondary text-white" };
    }
  };

  const badge = getBadge();

  return (
    <span
      className={`px-2 py-1 rounded-pill fw-semibold ${badge.class}`}
      style={{ fontSize: "0.70rem" }}
    >
      {badge.label}
    </span>
  );
};

export default DealerVehicleReportLayer;