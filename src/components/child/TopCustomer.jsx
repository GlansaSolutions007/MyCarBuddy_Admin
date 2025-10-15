import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const CollectionSummary = () => {
  const [collections, setCollections] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    setError("");

    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const formatDate = (date) => date.toISOString().split("T")[0];

      // 🔹 API requests for Today, Week, Month, and Total
      const requests = [
        axios.get(
          `${API_BASE}Reports/GetCollectionAmount?fromDate=${formatDate(
            today
          )}&toDate=${formatDate(today)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE}Reports/GetCollectionAmount?fromDate=${formatDate(
            startOfWeek
          )}&toDate=${formatDate(today)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE}Reports/GetCollectionAmount?fromDate=${formatDate(
            startOfMonth
          )}&toDate=${formatDate(today)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        // ✅ Total Collection (no date filter)
        axios.get(`${API_BASE}Reports/GetCollectionAmount`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];

      const [todayRes, weekRes, monthRes, totalRes] = await Promise.all(requests);

      setCollections({
        today: todayRes.data.totalAmountCollected || 0,
        week: weekRes.data.totalAmountCollected || 0,
        month: monthRes.data.totalAmountCollected || 0,
        total: totalRes.data.totalAmountCollected || 0,
      });
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError("Failed to load collections data.");
    } finally {
      setLoading(false);
    }
  };

  const collectionData = [
    {
      title: "Today’s Collection",
      amount: `₹${collections.today.toLocaleString()}`,
      icon: "ri-calendar-2-line",
      gradientClass: "gradient-deep-1",
      lineBgClass: "line-bg-primary",
      iconBg: "bg-primary-100",
      iconText: "text-primary-600",
    },
    {
      title: "Weekly Collection",
      amount: `₹${collections.week.toLocaleString()}`,
      icon: "ri-calendar-line",
      gradientClass: "gradient-deep-2",
      lineBgClass: "line-bg-lilac",
      iconBg: "bg-lilac-200",
      iconText: "text-lilac-600",
    },
    {
      title: "Monthly Collection",
      amount: `₹${collections.month.toLocaleString()}`,
      icon: "ri-calendar-event-line",
      gradientClass: "gradient-deep-3",
      lineBgClass: "line-bg-success",
      iconBg: "bg-success-200",
      iconText: "text-success-600",
    },
    {
      title: "Total Collection",
      amount: `₹${collections.total.toLocaleString()}`,
      icon: "ri-bank-line",
      gradientClass: "gradient-deep-4",
      lineBgClass: "line-bg-warning",
      iconBg: "bg-warning-focus",
      iconText: "text-warning-600",
    },
  ];

  return (
    <div className="col-6">
      <div className="card radius-12 h-100">
        {/* Header */}
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
            <h6 className="mb-2 fw-bold text-lg mb-0">Collections</h6>
            {/* <Link
              to="/collections"
              className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
            >
              View Details
              <iconify-icon
                icon="solar:alt-arrow-right-linear"
                className="icon"
              />
            </Link> */}
          </div>
        </div>

        {/* Body */}
        <div className="card-body p-16">
          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : error ? (
            <div className="text-center text-danger py-4">{error}</div>
          ) : (
            <div className="row gy-4">
              {collectionData.map((item, index) => (
                <div key={index} className="col-12">
                  <div
                    className={`px-20 py-16 shadow-sm radius-8 h-100 ${item.gradientClass} left-line ${item.lineBgClass} position-relative overflow-hidden`}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-1">
                      <div>
                        <span className="fw-medium text-secondary-light text-md">
                          {item.title}
                        </span>
                        <h6 className="fw-semibold mb-0 mt-1">
                          {item.amount}
                        </h6>
                      </div>
                      <span
                        className={`w-44-px h-44-px radius-8 d-inline-flex justify-content-center align-items-center text-2xl ${item.iconBg} ${item.iconText}`}
                      >
                        <i className={item.icon} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionSummary;
