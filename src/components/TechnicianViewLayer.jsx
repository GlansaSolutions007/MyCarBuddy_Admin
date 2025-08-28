import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const CustomerViewLayer = () => {
  const { TechnicianID } = useParams();
  const token = localStorage.getItem("token");

  const [technician, setTechnician] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicianDetails();
    fetchBookings();
  }, []);

  const fetchTechnicianDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails/technicianid?technicianid=${TechnicianID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnician(res.data?.data?.[0] || null);
    } catch (err) {
      console.error("Error fetching technician details:", err);
    }
  };

  const fetchBookings = async () => {
  try {
    const res = await axios.get(`${API_BASE}Bookings/GetAssignedBookings?Id=${TechnicianID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];

    setBookings(data);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    setBookings([]); // Ensure fallback to empty array
    setLoading(false);
  }
};

  return (
    <div className="row gy-4 mt-3">
      {/* Left Profile Card */}
      <div className="col-lg-4">
        <div className="user-grid-card border radius-16 overflow-hidden bg-base h-100">
          {/* <img
            src="/assets/images/user-grid/user-grid-bg1.png"
            alt="Profile Background"
            className="w-100 object-fit-cover"
          /> */}
          <div className="p-3 text-center ">
            <img
              src={
                technician?.ProfileImage
                  ? `${API_IMAGE}${technician.ProfileImage}`
                  : "/assets/images/user-grid/user-grid-img13.png"
              }
              alt={technician?.TechnicianName || "Technician"}
              className="border border-2 border-white w-150-px h-150-px rounded-circle object-fit-cover"
              style={{ width: "150px", height: "150px" }}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = "/assets/images/user-grid/user-grid-img13.png";
              }}
            />
            <h5 className="mt-3 mb-1">{technician?.TechnicianName || "N/A"}</h5>
            <span className="text-muted">{technician?.Email || "No email"}</span>
            <div className="mt-3 text-start">
              <h6 className="text-primary mb-2">Technician Info</h6>
              <ul className="list-unstyled">
                <li><strong>Phone:</strong> {technician?.PhoneNumber || "N/A"}</li>
                <li><strong>State:</strong> {technician?.StateName || "N/A"}</li>
                <li><strong>City:</strong> {technician?.CityName || "N/A"}</li>
                <li><strong>Pincode:</strong> {technician?.Pincode || "N/A"}</li>
                <li><strong>Address:</strong> {technician?.AddressLine1} {technician?.AddressLine2}</li>
                <li><strong>Status:</strong> {technician?.IsActive ? "Active" : "Inactive"}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Tabs Content */}
      <div className="col-lg-8">
        <div className="card h-100">
          <div className="card-body p-24">
            <ul className="nav nav-pills mb-20">
              <li className="nav-item">
                <button className="nav-link active" data-bs-toggle="pill" data-bs-target="#booking">
                  Bookings
                </button>
              </li>
              {/* <li className="nav-item">
                <button className="nav-link" data-bs-toggle="pill" data-bs-target="#payment">
                  Payments
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link" data-bs-toggle="pill" data-bs-target="#documents">
                  Documents
                </button>
              </li> */}
            </ul>

            <div className="tab-content">
              {/* Bookings Tab */}
              <div className="tab-pane fade show active" id="booking">
                {loading ? (
                  <p>Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-muted">No bookings assigned.</p>
                ) : (
                 <Accordion>
  {bookings.map((item, idx) => (
    <Accordion.Item
      eventKey={idx.toString()}
      key={item.BookingID}
      className="mb-3 shadow-sm rounded-3 border border-light"
    >
      <Accordion.Header>
        <div className="w-100 d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0 fw-bold">Booking #{item.BookingTrackID}</h6>
            <small className="text-muted">{item.BookingDate} • {item.TimeSlot}</small>
          </div>
          <span
            className={`badge px-3 py-1 rounded-pill ${
              item.BookingStatus === "Completed"
                ? "bg-success"
                : item.BookingStatus === "Reached"
                ? "bg-info"
                : "bg-warning text-dark"
            }`}
          >
            {item.BookingStatus}
          </span>
        </div>
      </Accordion.Header>

      <Accordion.Body className="bg-white p-4">
        {/* Customer & Vehicle Info */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h6 className="fw-bold text-primary">Customer Details</h6>
            <p><strong>Name:</strong> {item.CustomerName}</p>
            <p><strong>Phone:</strong> {item.PhoneNumber}</p>
            <p><strong>Address:</strong> {item.FullAddress}</p>
          </div>
          <div className="col-md-6">
            <h6 className="fw-bold text-primary">Vehicle Info</h6>
            <div className="d-flex align-items-center">
              <img
                src={
                  item.VehicleImage
                    ? `${API_IMAGE}${item.VehicleImage}`
                    : "/assets/images/default-car.png"
                }
                alt={item.VehicleNumber}
                className="me-3 rounded border"
                style={{ width: "80px", height: "60px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/assets/images/default-car.png";
                }}
              />
              <div>
                <p className="mb-1"><strong>{item.BrandName} {item.ModelName}</strong></p>
                <p className="mb-0">{item.VehicleNumber}</p>
                <small>{item.FuelTypeName}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Packages & Includes */}
        <div className="mb-4">
          <h6 className="fw-bold text-primary">Selected Packages</h6>
          {item.Packages?.map((pkg) => (
            <div key={pkg.PackageID} className="mb-3">
              <p className="mb-1"><strong>{pkg.PackageName}</strong> ({pkg.EstimatedDurationMinutes} min)</p>
              {pkg.Category?.SubCategories?.map((sub) => (
                <div key={sub.SubCategoryID} className="ms-3">
                  <small className="fw-semibold">{sub.SubCategoryName}</small>
                  <ul className="mb-1">
                    {sub.Includes?.map((inc) => (
                      <li key={inc.IncludeID}>{inc.IncludeName}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Payment & Notes */}
        <div className="mb-4">
          <h6 className="fw-bold text-success">Payment</h6>
          <p><strong>Total Price:</strong> ₹{item.TotalPrice}</p>
          <p><strong>Payment Status:</strong> {item.PaymentStatus}</p>
          <p><strong>Notes:</strong> {item.Notes || "No notes provided"}</p>
        </div>

        {/* Tracking Info */}
        <div className="mb-4">
          <h6 className="fw-bold text-info">Tracking Info</h6>
          <ul className="list-unstyled">
            <li>Journey Started: {item.JourneyStartedAt || "N/A"}</li>
            <li>Reached: {item.ReachedAt || "N/A"}</li>
            <li>Service Started: {item.ServiceStartedAt || "N/A"}</li>
            <li>Service Ended: {item.ServiceEndedAt || "N/A"}</li>
          </ul>
        </div>

        {/* Location Map */}
        <div className="rounded overflow-hidden border" style={{ height: "250px" }}>
          <iframe
            title={`map-${item.BookingID}`}
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://maps.google.com/maps?q=${item.latitude || 17.3850},${item.Longitude || 78.4867}&z=15&output=embed`}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  ))}
</Accordion>

                )}
              </div>

              {/* Payments Tab */}
              <div className="tab-pane fade" id="payment">
                <p>No payment history available.</p>
              </div>

              {/* Documents Tab */}
              <div className="tab-pane fade" id="documents">
                <p>No documents uploaded.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewLayer;
