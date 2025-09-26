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
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [dealers, setDealers] = useState([]);

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

  const handleAssignConfirm = async () => {
    try {
      const res = await axios.put(
        `${API_BASE}Bookings/assign-dealer`,
        {
          DealerID: selectedDealer.value,
          BookingID: bookingId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Dealer assigned successfully",
        });
        setSelectedDealer(null);
        fetchBookingData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to assign dealer",
        });
      }
    } catch (error) {
      console.error("Failed to assign dealer", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to assign dealer",
      });
    }
  };

  return (
    <>
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
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-success fw-bold mb-0">📦 Packages</h6>
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label mb-0 fw-semibold">Assign Dealer:</label>
                      <Select
                        options={dealers}
                        value={selectedDealer}
                        onChange={(val) => setSelectedDealer(val)}
                        placeholder="Select Dealer"
                        styles={{
                          control: (provided) => ({
                            ...provided,
                            minWidth: '200px',
                          }),
                        }}
                      />
                    </div>
                  </div>
                  <div className="row">
                    {bookingData?.Packages?.length > 0 ? (
                      bookingData.Packages.map((pkg) => (
                        <div key={pkg.PackageID} className="col-md-6 mb-3">
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{pkg.PackageName}</div>
                              <div className="text-muted small">
                                {pkg.EstimatedDurationMinutes} mins
                              </div>
                              <div className="text-muted small ps-4 mb-0">
                                {pkg.Category?.SubCategories?.[0]?.Includes?.map((inc) => (
                                  <li className="ms-10" key={inc.IncludeID}>{inc.IncludeName}</li>
                                ))}
                              </div>
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
                    disabled={!selectedDealer}
                  >
                    Assign
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookingDealerAssign;
