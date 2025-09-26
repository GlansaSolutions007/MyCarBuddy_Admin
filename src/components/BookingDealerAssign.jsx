import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Icon } from "@iconify/react";
import Select from "react-select";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;
const token = localStorage.getItem("token");

function BookingDealerAssign() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [selectedDealers, setSelectedDealers] = useState({}); // For each package

  const fetchBookingData = async () => {
    try {
      const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookingData(res.data[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDealers = async () => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    const url =
      role === "Admin"
        ? `${API_BASE}Dealer`
        : `${API_BASE}Dealer?role=${role}&DistributorID=${userId}`;

    try {
      const res = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const dealerOptions = res.data.map((d) => ({
        value: d.DealerID,
        label: `${d.FullName || d.DealerName} (${d.PhoneNumber})`,
      }));

      setDealers(dealerOptions);
    } catch (error) {
      console.error("Failed to load dealers", error);
    }
  };

  useEffect(() => {
    fetchBookingData();
    fetchDealers();
  }, [bookingId]);

  const handleDealerChange = (packageId, dealer) => {
    setSelectedDealers((prev) => ({
      ...prev,
      [packageId]: dealer,
    }));
  };

  const handleAssignConfirm = async () => {
    try {
      const payload = Object.entries(selectedDealers).map(([pkgId, dealer]) => ({
        DealerID: dealer.value,
        BookingID: bookingId,
        PackageID: pkgId,
      }));

      const res = await axios.put(`${API_BASE}Bookings/assign-dealer`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Dealers assigned successfully",
        });
        setSelectedDealers({});
        fetchBookingData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to assign dealers",
        });
      }
    } catch (error) {
      console.error("Failed to assign dealers", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to assign dealers",
      });
    }
  };

  return (
    <div className='row gy-4 mt-3'>
      <div className='col-lg-12'>
        <div className='card h-100'>
          <div className='card-body p-24'>
            {/* Booking Info */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <Icon icon="mdi:calendar-check" className="text-primary fs-4" />
                <div>
                  <h6 className="mb-0 text-dark fw-bold">
                    Booking #{bookingData?.BookingTrackID || "—"}
                  </h6>
                  <small className="text-muted">
                    Scheduled: {bookingData?.BookingDate || "—"} ({bookingData?.TimeSlot || "—"})
                  </small>
                </div>
                <span
                  className={`badge px-3 py-1 rounded-pill ${
                    bookingData?.BookingStatus === "Completed"
                      ? "bg-success"
                      : bookingData?.BookingStatus === "Confirmed"
                      ? "bg-primary"
                      : "bg-warning text-dark"
                  }`}
                >
                  {bookingData?.BookingStatus || "Pending"}
                </span>
              </div>

              {/* Packages and Dealer Dropdown */}
              <div className="mb-4">
                <h6 className="text-success fw-bold mb-3">📦 Packages</h6>
                <div className="row">
                  {bookingData?.Packages?.length > 0 ? (
                    bookingData.Packages.map((pkg) => (
                      <div key={pkg.PackageID} className="col-md-6 mb-3">
                        <div className="d-flex flex-column">
                          {/* Top row: Package name + Dropdown */}
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="fw-semibold">{pkg.PackageName}</div>
                            <div style={{ minWidth: '200px' }}>
                              <Select
                                options={dealers}
                                value={selectedDealers[pkg.PackageID] || null}
                                onChange={(val) => handleDealerChange(pkg.PackageID, val)}
                                placeholder="Select Dealer"
                              />
                            </div>
                          </div>
                          {/* Bottom row: duration and includes */}
                          <div className="text-muted small ps-2">
                            <div>{pkg.EstimatedDurationMinutes} mins</div>
                            <ul className="mb-0 ps-3">
                              {pkg.Category?.SubCategories?.[0]?.Includes?.map((inc) => (
                                <li key={inc.IncludeID}>{inc.IncludeName}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No packages found</p>
                  )}
                </div>
              </div>

              {/* Buttons at bottom */}
              <div className="d-flex justify-content-center gap-20 mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignConfirm}
                  disabled={Object.keys(selectedDealers).length === 0}
                >
                  Assign
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDealerAssign;
