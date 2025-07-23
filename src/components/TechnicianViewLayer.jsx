import { Icon } from "@iconify/react";
import { useState } from "react";
import Accordion from 'react-bootstrap/Accordion';

const CustomerViewLayer = () => {
  const [imagePreview, setImagePreview] = useState(
    "/assets/images/user-grid/user-grid-img13.png"
  );

  // Dummy Data
  const bookings = [
  {
    id: 1,
    service: 'Interior Cleaning',
    date: '2025-07-12',
    status: 'Completed',
    price: 999,
    notes: 'Paid via UPI',
    logs: [
      { status: 'Created', time: '2025-07-10 10:00 AM' },
      { status: 'Started', time: '2025-07-12 09:00 AM' },
      { status: 'Completed', time: '2025-07-12 10:30 AM' },
    ],
    images: [
      'https://via.placeholder.com/120x80?text=Before',
      'https://via.placeholder.com/120x80?text=After',
    ],
    tracking: {
      started: '8:00 AM',
      reached: '8:30 AM',
      serviceStart: '9:00 AM',
      serviceEnd: '10:30 AM',
      lat: '17.3850',
      lng: '78.4867',
    },
  },
  {
    id: 2,
    service: 'Interior Cleaning',
    date: '2025-07-12',
    status: 'Completed',
    price: 999,
    notes: 'Paid via UPI',
    logs: [
      { status: 'Created', time: '2025-07-10 10:00 AM' },
      { status: 'Started', time: '2025-07-12 09:00 AM' },
      { status: 'Completed', time: '2025-07-12 10:30 AM' },
    ],
    images: [
      'https://via.placeholder.com/120x80?text=Before',
      'https://via.placeholder.com/120x80?text=After',
    ],
    tracking: {
      started: '8:00 AM',
      reached: '8:30 AM',
      serviceStart: '9:00 AM',
      serviceEnd: '10:30 AM',
      lat: '17.3850',
      lng: '78.4867',
    },
  },
  // More bookings here...
];



  const payments = [
    { id: 1, amount: "₹1500", method: "UPI", date: "2025-07-01" },
    { id: 2, amount: "₹2500", method: "Credit Card", date: "2025-06-10" },
  ];

  const vehicles = [
    {
      id: 1,
      model: "Hyundai i20",
      number: "TS09AB1234",
      image: "/assets/images/Desktop-1.png",
    },
    {
      id: 2,
      model: "Honda City",
      number: "TS10XY4567",
      image: "/assets/images/sign-car.png",
    },
  ];

  return (
    <div className='row gy-4 mt-3'>
      {/* Left Profile Card */}
      <div className='col-lg-4'>
        <div className='user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100'>
          <img
            src='/assets/images/user-grid/user-grid-bg1.png'
            alt='Main Background'
            className='w-100 object-fit-cover'
          />
          <div className='pb-24 ms-16 mb-24 me-16  mt--100'>
            <div className='text-center border border-top-0 border-start-0 border-end-0'>
              <img
                src='/assets/images/user-grid/user-grid-img14.png'
                alt='WowDash React Vite'
                className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
              />
              <h6 className='mb-0 mt-16'>Jacob Jones</h6>
              <span className='text-secondary-light mb-16'>
                ifrandom@gmail.com
              </span>
            </div>
            <div className='mt-24'>
              <h6 className='text-xl mb-16'>Personal Info</h6>
              <ul>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    Full Name
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : Will Jonto
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Email
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : willjontoax@gmail.com
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Phone Number
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : (1) 2536 2561 2365
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Department
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : Design
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Designation
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : UI UX Designer
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Languages
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : English
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Bio
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : Lorem Ipsum&nbsp;is simply dummy text of the printing and
                    typesetting industry.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Tabs Content */}
      <div className='col-lg-8'>
        <div className='card h-100'>
          <div className='card-body p-24'>
            <ul className='nav border-gradient-tab nav-pills mb-20'>
              <li className='nav-item'><button className='nav-link active' data-bs-toggle='pill' data-bs-target='#booking'>Bookings</button></li>
              <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#payment'>Payments</button></li>
              <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#vehicle'>Documents</button></li>
            </ul>

            <div className='tab-content'>
              {/* Bookings Tab */}
              <div className='tab-pane fade show active' id='booking'>
                 <Accordion  className="styled-booking-accordion"> {/*//defaultActiveKey="0" */}
            {bookings.map((item, idx) => (
                <Accordion.Item eventKey={idx.toString()} key={item.BookingID} className="mb-3 shadow-sm rounded-3 border border-light">
                <Accordion.Header>
                    <div className="d-flex flex-column w-100">
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center gap-3">
                        <Icon icon="mdi:calendar-check" className="text-primary fs-4" />
                        <div>
                            <h6 className="mb-0 text-dark fw-bold">{item.service}</h6>
                            <small className="text-muted">Scheduled: {item.date}</small>
                        </div>
                        </div>
                        <span className={`badge px-3 py-1 rounded-pill ${item.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {item.status}
                        </span>
                    </div>
                    </div>
                </Accordion.Header>

                <Accordion.Body className="bg-white">
                    {/* Booking Details */}
                    <div className="mb-4">
                    <h6 className="text-primary fw-bold mb-3">📋 Booking Details</h6>
                    <div className="row g-3">
                        <div className="col-md-6"><strong>Service:</strong> {item.service}</div>
                        <div className="col-md-6"><strong>Price:</strong> ₹{item.price}</div>
                        <div className="col-md-6"><strong>OTP:</strong> {item.otp}</div>
                        <div className="col-md-6"><strong>Notes:</strong> {item.notes || "No additional notes"}</div>
                    </div>
                    </div>

                    {/* Tracking Section */}
                    <div className="mb-4">
                    <h6 className="text-success fw-bold mb-3">📍 Tracking Info</h6>
                    <div className="row g-3">
                        <div className="col-md-6"><strong>Journey Started:</strong> {item.tracking?.journey || "N/A"}</div>
                        <div className="col-md-6"><strong>Reached:</strong> {item.tracking?.reached || "N/A"}</div>
                        <div className="col-md-6"><strong>Service Started:</strong> {item.tracking?.started || "N/A"}</div>
                        <div className="col-md-6"><strong>Service Ended:</strong> {item.tracking?.ended || "N/A"}</div>
                    </div>
                    </div>

                    {/* Location Map */}
                    <div>
                    <h6 className="text-info fw-bold mb-3">🗺️ Location</h6>
                    <div className="rounded overflow-hidden border" style={{ height: "250px" }}>
                        <iframe
                        title={`map-${item.BookingID}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://maps.google.com/maps?q=${item.tracking?.lat || 17.3850},${item.tracking?.lng || 78.4867}&z=15&output=embed`}
                        allowFullScreen
                        loading="lazy"
                        ></iframe>
                    </div>
                    </div>
                </Accordion.Body>
                </Accordion.Item>
            ))}
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

              {/* Vehicles Tab */}
              <div className='tab-pane fade' id='vehicle'>
                <div className='row'>
                  {vehicles.map((car) => (
                    <div className='col-md-6 mb-3' key={car.id}>
                      <div className='card'>
                        <img src={car.image} className='card-img-top' alt='vehicle' />
                        <div className='card-body'>
                          <h5 className='card-title'>{car.model}</h5>
                          <p className='card-text'><strong>Number:</strong> {car.number}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewLayer;
