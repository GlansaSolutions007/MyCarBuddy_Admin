import { Icon } from "@iconify/react";
import { useState } from "react";
import Accordion from 'react-bootstrap/Accordion';
import axios from 'axios';
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import Select from "react-select";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const BookingViewLayer = () => {
  const [imagePreview, setImagePreview] = useState(
    "/assets/images/user-grid/user-grid-img13.png"
  );
  const [bookingData , setBookingData] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
   const [selectedTechnician, setSelectedTechnician] = useState(null);
     const [technicians, setTechnicians] = useState([]);
  const token = localStorage.getItem("token");

  const { bookingId } = useParams();


      const fetchBookingData = async () => {

    try {
      const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookingData(res.data[0]);
      console.log(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnicians(
        res.data.jsonResult.map((t) => ({
          value: t.TechID,
          label: `${t.TechnicianName} (${t.PhoneNumber})`,
        }))
      );
    } catch (error) {
      console.error("Failed to load technicians", error);
    }
  };

  useEffect(() => {
  fetchTechnicians();
    fetchBookingData();
  }, [bookingId]);




  const payments = [
    { id: 1, amount: "₹1500", method: "UPI", date: "2025-07-01" },
    { id: 2, amount: "₹2500", method: "Credit Card", date: "2025-06-10" },
  ];

   // Reschedule API
 const handleReschedule = async () => {
    if (!newDate) return alert("Please select a new date.");
    const confirmed = window.confirm(`Are you sure you want to reschedule to ${newDate}?`);
    if (!confirmed) return;

    try {
      await axios.post(`${API_BASE}Bookings/Reschedule`, {
       BookingID: bookingId,
        Reason: reason,
        OldDate: bookingData.BookingDate,
        NewDate: newDate,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Booking rescheduled successfully!");
      setShowReschedule(false);
    } catch (error) {
      alert("Failed to reschedule booking.");
      console.error(error);
    }
  };

    // Reassign Technician
  const handleAssignClick = (booking) => {
    setAssignModalOpen(true);
  };

    const handleAssignConfirm = async () => {
      console.log(selectedTechnician);
      try {
        const res = await axios.put(
          `${API_BASE}Bookings/assign-technician`,
          {
            TechID: selectedTechnician.value,
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
            text: res.data.message || "Technician assigned successfully",
          });
          setSelectedTechnician(null);
          setAssignModalOpen(false);
          fetchBookingData();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to assign technician",
          });
        }
      } catch (error) {
        console.error("Failed to assign technician", error);
        if (error.response) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response.data.message || "Failed to assign technician",
          });
        }
      }
    };

  // Cancel API
  const handleCancel = async () => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    try {
      await axios.post(`${API_BASE}Bookings/Cancel`, {
        BookingID: bookingId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Booking cancelled successfully!");
    } catch (error) {
      alert("Failed to cancel booking.");
      console.error(error);
    }
  };


  return (
    <div className='row gy-4 mt-3'>
      {/* Left Profile Card */}
      <div className='col-lg-4'>
        <div className='user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100'>
          {/* <img
            src='/assets/images/user-grid/user-grid-bg1.png'
            alt='Main Background'
            className='w-100 object-fit-cover'
          /> */}
            {bookingData ? (
          <div className='pb-24 ms-16 mb-24 me-16  '>
            <div className='text-center border border-top-0 border-start-0 border-end-0'>
              {bookingData.ProfileImage ? (
                <img
                  src={`${API_IMAGE}${bookingData.ProfileImage}`}
                  alt='WowDash React Vite'
                  className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
                />
              ): (
                <img
                  src='/assets/images/user-grid/user-grid-img14.png'
                  alt='WowDash React Vite'
                  className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
                />
              )}
              {/* <img
                src='/assets/images/user-grid/user-grid-img14.png'
                alt='WowDash React Vite'
                className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
              /> */}
              <h6 className='mb-0 mt-16'> {bookingData.CustomerName || "N/A"}</h6>

            </div>
            <div className='mt-24'>
              <h6 className='text-xl mb-16'>Personal Info</h6>
              <ul>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    Full Name
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {bookingData.CustomerName || "N/A"}
                  </span>
                </li>
                {/* <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Email
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {bookingData.CustomerEmail}
                  </span>
                </li> */}
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Phone Number
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {bookingData.PhoneNumber}
                  </span>
                </li>
              
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Vehicle
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {bookingData.VehicleNumber}
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                     Price
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : ₹{Number(bookingData.TotalPrice).toFixed(2)}
                  </span>
                </li>
                 <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                     GST
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : ₹{Number(bookingData.CouponAmount).toFixed(2)}
                  </span>
                </li>
                {bookingData.CouponAmount ? (
                    <li className='d-flex align-items-center gap-1 mb-12'>
                      <span className='w-30 text-md fw-semibold text-primary-light'>
                        Coupon
                      </span>
                      <span className='w-70 text-secondary-light fw-medium'>
                        : ₹{Number(bookingData.CouponAmount).toFixed(2)}
                      </span>
                    </li>
                  ) : null}

                   <li className='d-flex align-items-center gap-1 mb-12'>
                      <span className='w-30 text-md fw-semibold text-primary-light'>
                        Total Amount
                      </span>
                      <span className='w-70 text-secondary-light fw-medium'>
                        : ₹{Number(bookingData.TotalPrice + bookingData.GSTAmount - bookingData.CouponAmount).toFixed(2)}
                      </span>
                    </li>

                {bookingData.TechID ? (
                 <>
                  <li className='d-flex align-items-center gap-1 mb-12'>
                    <span className='w-30 text-md fw-semibold text-primary-light'>
                      {" "}
                      Technician
                    </span>
                    <span className='w-70 text-secondary-light fw-medium'>
                      : {bookingData.TechID}
                    </span>
                  </li>
                  <li className='d-flex align-items-center gap-1 mb-12'>
                    <span className='w-30 text-md fw-semibold text-primary-light'>
                      {" "}
                      Technician Name
                    </span>
                    <span className='w-70 text-secondary-light fw-medium'>
                      : {bookingData.TechFullName}
                    </span>
                  </li>
                  <li className='d-flex align-items-center gap-1 mb-12'>
                    <span className='w-30 text-md fw-semibold text-primary-light'>
                      {" "}
                      Technician Number
                    </span>
                    <span className='w-70 text-secondary-light fw-medium'>
                      : {bookingData.TechPhoneNumber}
                    </span>
                  </li> 
                 </>
                ) : (
                  <li className='d-flex align-items-center gap-1 mb-12'>
                    <span className='w-30 text-md fw-semibold text-primary-light'>
                      {" "}
                      Technician
                    </span>
                    <span className='w-70 text-secondary-light fw-medium'>
                      : N/A
                    </span>
                  </li>
                )}

              </ul>

               {/* Reschedule & Cancel Buttons */}
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setShowReschedule(!showReschedule)}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleAssignClick(bookingId)}
                  >
                    Reassign
                  </button>
                  {/* <button
                    className="btn btn-danger btn-sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button> */}
                </div>

                {/* Reschedule Date Picker */}
                {showReschedule && (
                  <div className="mt-3">
                    <label className="form-label mt-2">Reschedule Date :</label>
                    <input
                      type="date"
                      className="form-control mb-2"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                    <label className="form-label mt-2">RescheduleReason</label>
                    <textarea
                      className="form-control"
                      placeholder="Reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                    <button
                      className="btn btn-primary btn-sm mt-3"
                      onClick={handleReschedule}
                    >
                      Submit
                    </button>
                  </div>
                )}


            </div>
          </div>
        ) : (
          <div className='pb-24 ms-16 mb-24 me-16  '>
            <div className='text-center border border-top-0 border-start-0 border-end-0'>
              <img
                src='/assets/images/user-grid/user-grid-img14.png'
                alt='WowDash React Vite'
                className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
              />
              <h6 className='mb-0 mt-16'> N/A</h6>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Right Tabs Content */}
      <div className='col-lg-8'>
        <div className='card h-100'>
          <div className='card-body p-24'>
            <ul className='nav border-gradient-tab nav-pills mb-20'>
              <li className='nav-item'><button className='nav-link active' data-bs-toggle='pill' data-bs-target='#booking'>Bookings</button></li>
              {/* <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#payment'>Technicians Details</button></li> */}
              {/* <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#vehicle'>Documents</button></li> */}
            </ul>

            <div className='tab-content'>
              {/* Bookings Tab */}
              <div className='tab-pane fade show active' id='booking'>
                 <Accordion defaultActiveKey="0"   className="styled-booking-accordion"> {/*//defaultActiveKey="0" */}
           {bookingData ? (
                  <Accordion defaultActiveKey="0" className="styled-booking-accordion">
                    <Accordion.Item eventKey="0" key={bookingData.BookingID} className="mb-3 shadow-sm rounded-3 border border-light">
                      <Accordion.Header>
                        <div className="d-flex flex-column w-100">
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="d-flex align-items-center gap-3">
                              <Icon icon="mdi:calendar-check" className="text-primary fs-4" />
                              <div>
                                <h6 className="mb-0 text-dark fw-bold">
                                  Booking #{bookingData.BookingTrackID}
                                </h6>
                                <small className="text-muted">
                                  Scheduled: {bookingData.BookingDate} ({bookingData.TimeSlot})
                                </small>
                              </div>
                            </div>
                            <span className={`badge px-3 py-1 rounded-pill ${
                              bookingData.BookingStatus === "Completed"
                                ? "bg-success"
                                : bookingData.BookingStatus === "Confirmed"
                                ? "bg-primary"
                                : "bg-warning text-dark"
                            }`}>
                              {bookingData.BookingStatus}
                            </span>
                          </div>
                        </div>
                      </Accordion.Header>

                      <Accordion.Body className="bg-white">
                        {/* Booking Details */}
                      

                        {/* Packages */}
                        <div className="mb-4">
                          <h6 className="text-success fw-bold mb-3">📦 Packages</h6>
                          <div className="row">
                                  {bookingData?.Packages?.map((pkg) => (
                                    <div key={pkg.PackageID} className="col-md-6 mb-3">
                                      <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                          <div className="fw-semibold">{pkg.PackageName}</div>
                                          <div className="text-muted small">{pkg.EstimatedDurationMinutes} mins</div>
                                          <div className="text-muted small">
                                            {pkg.Category?.SubCategories?.[0]?.Includes?.map((inc) => (
                                              <li key={inc.IncludeID}>{inc.IncludeName}</li>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                        </div>

                        {/* Static Location Map */}
                        <div>
                          <h6 className="text-info fw-bold mb-3">🗺️ Location</h6>
                          <div className="rounded overflow-hidden border" style={{ height: "250px" }}>
                            <iframe
                              title={`map-${bookingData.BookingID}`}
                              width="100%"
                              height="100%"
                              frameBorder="0"
                               src={`https://maps.google.com/maps?q=${bookingData.Latitude},${bookingData.Longitude}&z=15&output=embed`}
                              allowFullScreen
                              loading="lazy"
                            ></iframe>
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                ) : (
                  <p>Loading booking details...</p>
                )}
            </Accordion>
              </div>

              {/* Payments Tab */}
              <div className='tab-pane fade' id='payment'>
                <Accordion>
                  {payments.map((pay, idx) => (
                    <Accordion.Item eventKey={idx.toString()} key={pay.id}>
                      <Accordion.Header>Payment - {pay.date}</Accordion.Header>
                      <Accordion.Body>
                        <p><strong>Amount:</strong> {pay.amount}</p>
                        <p><strong>Method:</strong> {pay.method}</p>
                        <p><strong>Date:</strong> {pay.date}</p>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            </div>

          </div>
        </div>
      </div>
       {assignModalOpen && (
              <div
                className="modal fade show d-block"
                style={{ background: "#00000080" }}
              >
                <div className="modal-dialog modal-sm modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h6 className="modal-title">Assign Technician</h6>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setAssignModalOpen(false)}
                      />
                    </div>
                    <div className="modal-body">
                      <Select
                        options={technicians}
                        value={selectedTechnician}
                        onChange={(val) => setSelectedTechnician(val)}
                        placeholder="Select Technician"
                      />
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setAssignModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleAssignConfirm}
                        disabled={!selectedTechnician}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
};

export default BookingViewLayer;
