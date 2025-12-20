import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const BookingReportsLayer = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchMetrics();
    }, [endDate]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);

            // Form final API URL
            let url = `${API_BASE}Supervisor/BookingMetrics`;

            if (startDate && endDate) {
                url += `?FromDate=${startDate}&ToDate=${endDate}`;
            }

            const res = await axios.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            setMetrics(res.data);
            setError("");
        } catch (error) {
            console.error("Error loading metrics:", error);
            setError("Failed to load Booking Metrics.");
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        "Total Bookings": { color: "info", icon: "mdi:book", gradientClass: "gradient-deep-2", lineClass: "line-bg-info" },
        "Completed Services": { color: "primary", icon: "mdi:check-circle", gradientClass: "gradient-deep-1", lineClass: "line-bg-primary" },
        "Pending": { color: "danger", icon: "mdi:clock-outline", gradientClass: "gradient-deep-4", lineClass: "line-bg-danger" },
        "Journey Started": { color: "success", icon: "mdi:road-variant", gradientClass: "gradient-deep-3", lineClass: "line-bg-success" },
        "Reached": { color: "warning", icon: "mdi:map-marker-check", gradientClass: "gradient-deep-4", lineClass: "line-bg-warning" },
        "Service Started": { color: "info", icon: "mdi:play-circle", gradientClass: "gradient-deep-1", lineClass: "line-bg-secondary" },
        "Service Ended": { color: "success", icon: "mdi:stop-circle", gradientClass: "gradient-deep-3", lineClass: "line-bg-dark" },
        "Cancelled": { color: "danger", icon: "mdi:close-circle", gradientClass: "gradient-deep-2", lineClass: "line-bg-danger" },
        "Confirmed": { color: "success", icon: "mdi:checkbox-marked-circle", gradientClass: "gradient-deep-1", lineClass: "line-bg-success" },
        "Failed": {
            color: "warning", icon: "mdi:alert-circle", gradientClass: "gradient-deep-3", lineClass: "line-bg-warning"
        }
    };

    const cardDesign = Object.entries(statusConfig).map(([title, config]) => {
        let apiStatus =
            title === "Total Bookings" ? "" :
                title === "Completed Services" ? "Completed" :
                    title === "Service Started" ? "ServiceStarted" :
                        title === "Service Ended" ? "ServiceEnded" :
                            title === "Pending" ? "pending" :
                                title === "Reached" ? "Reached" :
                                    title === "Journey Started" ? "JourneyStarted" :
                                        title === "Cancelled" ? "Cancelled" :
                                            title === "Confirmed" ? "Confirmed" :
                                                "Failed";

        return {
            title,
            key:
                title === "Total Bookings" ? "TotalBookings" :
                    title === "Completed Services" ? "CompletedServices" :
                        title === "Pending" ? "Pending" :
                            title === "Journey Started" ? "StartJourneyCount" :
                                title === "Reached" ? "ReachedCount" :
                                    title === "Service Started" ? "ServiceStartedCount" :
                                        title === "Service Ended" ? "ServiceEndedCount" :
                                            title === "Cancelled" ? "CancelledCount" :
                                                title === "Confirmed" ? "ConfirmedCount" :
                                                    "FailedCount",
            apiStatus,
            ...config
        };
    });



    return (
        <div className="row gy-3">
            <div className="col-12">
                <div className="card p-3">

                    {/* 🔹 Date Filter Bar */}
                    <div
                        className="d-flex flex-wrap align-items-center gap-2 mb-3 p-2 ps-5"
                        style={{
                            background: "#f8f9fa",
                            borderRadius: "8px",
                        }}
                    >   From
                        <input
                            type="date"
                            className="form-control m-1"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ minWidth: "120px", maxWidth: "150px" }}
                        />
                        To
                        <input
                            type="date"
                            className="form-control m-1"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ minWidth: "120px", maxWidth: "150px" }}
                        />

                        {/* Search Button */}
                        {/* <button
                            className="btn btn-sm m-1"
                            onClick={fetchMetrics}
                            style={{
                                background: "#0a6264",
                                color: "#fff",
                                padding: "6px 14px",
                                fontSize: "12px",
                                borderRadius: "5px",
                                height: "32px",
                                cursor: "pointer",
                                border: "none",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                transition: "all 0.2s ease",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
                            }}
                            onMouseDown={(e) => {
                                e.target.style.transform = "scale(0.97)";
                            }}
                            onMouseUp={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                            }}
                        >
                            Search
                        </button> */}

                        {/* Clear Button */}
                        <button
                            className="btn btn-sm m-1"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }}
                            style={{
                                background: "#b14343",
                                color: "#fff",
                                padding: "6px 14px",
                                fontSize: "12px",
                                borderRadius: "5px",
                                height: "32px",
                                cursor: "pointer",
                                border: "none",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                transition: "all 0.2s ease",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
                            }}
                            onMouseDown={(e) => {
                                e.target.style.transform = "scale(0.97)";
                            }}
                            onMouseUp={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                            }}
                        >
                            Clear
                        </button>
                    </div>


                    {loading ? (
                        <div className="text-center py-4">Loading metrics...</div>
                    ) : error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : (
                        <div className="row g-2">

                            {cardDesign.map((item) => (
                                <div
                                    key={item.key}
                                    className="col-xxl-3 col-xl-3 col-lg-3 col-md-4 col-sm-6"
                                >
                                    <div
                                        className={`
                                        px-20 py-16 shadow-none radius-8 h-100 
                                        ${item.gradientClass} left-line ${item.lineClass} 
                                        position-relative overflow-hidden
                                    `}
                                        style={{
                                            // Added transition for smooth hover effects
                                            transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // Subtle initial shadow
                                            cursor: "pointer", // Indicate interactivity
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-5px)"; // Lift on hover
                                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)"; // Deeper shadow on hover
                                            // You might want to adjust the gradient or add a subtle background color change here
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)"; // Return to normal
                                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; // Original shadow
                                        }}
                                    >

                                        <div className='d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8'>
                                            <Link   to={`/booking-sorting-page?status=${item.apiStatus}&from=${startDate}&to=${endDate}`}>
                                                <div>
                                                    <span className='mb-2 fw-medium text-secondary-light text-md'>
                                                        {item.title}
                                                    </span>
                                                    <h6 className='fw-semibold mb-1'>
                                                        {metrics ? metrics[item.key] : 0}
                                                    </h6>
                                                </div>
                                            </Link>
                                            <span
                                                className={`
                                                w-44-px h-44-px radius-8 d-inline-flex 
                                                justify-content-center align-items-center text-2xl mb-12 
                                                bg-${item.color}-200 text-${item.color}-600
                                            `}
                                                style={{
                                                    transition: "transform 0.3s ease-in-out", // Smooth icon movement
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "scale(1.1)"; // Scale icon up slightly
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "scale(1)"; // Return icon to normal size
                                                }}
                                            >
                                                <Icon icon={item.icon} width="22" />
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

export default BookingReportsLayer;