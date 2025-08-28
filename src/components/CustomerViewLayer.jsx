import { Icon } from "@iconify/react";
import { useState , useEffect  } from "react";
import Accordion from 'react-bootstrap/Accordion';
import axios from "axios";
import { Link , useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const CustomerViewLayer = () => {
  const [profile, setProfile] = useState({});
  const { CustomerID } = useParams();
  const [addresses , setAddresses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const [imagePreview, setImagePreview] = useState(
    "/assets/images/user-grid/user-grid-img13.png"
  );

  useEffect(() => {
    fetchAddresses();
    fetchProfile();
    fetchBookings();
    fetchMYCars();
  }, []);



  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}Customer/Id?Id=${CustomerID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(res.data[0] || {});
      console.log("Profile data:", res.data[0]);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }
  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${API_BASE}CustomerAddresses/custid?custid=${CustomerID || ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAddresses(res.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  
   const fetchBookings = async () => {
  // try {
  //   const res = await axios.get(`${API_BASE}Bookings/${CustomerID}`,{
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   const data = res.data;
  //   setBookings(data);
  // } catch (err) {
  //   console.error("Error fetching bookings:", err);
  // }

  try {
      axios
        .get(`${API_BASE}Bookings/${CustomerID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
       .then((res) => {
          let raw = res.data;
          setBookings(raw);
        })
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
};

    const fetchMYCars = async () => {
    try {
        const response = await axios.get(`${API_BASE}CustomerVehicles/CustId?CustId=${CustomerID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }); 
          setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching cars:", error);
        // alert("Failed to load cars. Please try again later.");
    }
    };




  const payments = [
    { id: 1, amount: "₹1500", method: "UPI", date: "2025-07-01" },
    { id: 2, amount: "₹2500", method: "Credit Card", date: "2025-06-10" },
  ];

  

 

  return (
    <div className='row gy-4 mt-3'>
      {/* Left Profile Card */}
      <div className='col-lg-4'>
        <div className='user-grid-card  border radius-16 overflow-hidden bg-base h-100'>
          {/* <img
            src='/assets/images/user-grid/user-grid-bg1.png'
            alt='Main Background'
            className='w-100 object-fit-cover'
          /> */}
          <div className='pb-24 ms-16 mb-24 me-16 '>
            <div className='text-center border border-top-0 border-start-0 border-end-0'>
              <img
                 src={profile.ProfileImage ? `${API_IMAGE}${profile.ProfileImage}` : '/assets/images/user-grid/user-grid-img14.png'}
                alt='Profile Image'
                className='border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover'
              />
              <h6 className='mb-0 mt-16'>{profile.FullName}</h6>
              <span className='text-secondary-light mb-16'>
                {profile.Email}
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
                    : {profile.FullName}
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Email
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {profile.Email}
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    Phone Number
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {profile.PhoneNumber || "N/A"}
                  </span>
                </li>
                <li className='d-flex align-items-center gap-1 mb-12'>
                  <span className='w-30 text-md fw-semibold text-primary-light'>
                    {" "}
                    AlternateNumber
                  </span>
                  <span className='w-70 text-secondary-light fw-medium'>
                    : {profile.AlternateNumber || "N/A"}
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
              <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#vehicle'>Vehicles</button></li>
              <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#address'>Address</button></li>
            </ul>

            <div className='tab-content'>
              {/* Bookings Tab */}
              <div className='tab-pane fade show active' id='booking'>
                 <Accordion  className="styled-booking-accordion"> {/*//defaultActiveKey="0" */}
                  {bookings.map((item, idx) => (
  <Accordion.Item
    eventKey={idx.toString()}
    key={item.BookingID}
    className="mb-3 shadow-sm rounded-3 border border-light"
  >
    <Accordion.Header>
      <div className="d-flex flex-column w-100">
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="d-flex align-items-center gap-3">
            <Icon icon="mdi:calendar-check" className="text-primary fs-4" />
            <div>
              <h6 className="mb-0 text-dark fw-bold">
                Booking #{item.BookingTrackID}
              </h6>
              <small className="text-muted">
                Scheduled: {new Date(item.BookingDate).toLocaleDateString()} ({item.TimeSlot})
              </small>
            </div>
          </div>
          <span
            className={`badge px-3 py-1 rounded-pill ${
              item.BookingStatus === "Completed"
                ? "bg-success"
                : item.BookingStatus === "Confirmed"
                ? "bg-primary"
                : "bg-warning text-dark"
            }`}
          >
            {item.BookingStatus}
          </span>
        </div>
      </div>
    </Accordion.Header>

    <Accordion.Body className="bg-white">
      {/* Booking Details */}
      <div className="mb-4">
        <h6 className="text-primary fw-bold mb-3">📋 Booking Details</h6>
        <div className="row g-3">
          <div className="col-md-6"><strong>Customer Name:</strong> {item.CustomerName}</div>
          <div className="col-md-6"><strong>Phone Number:</strong> {item.PhoneNumber}</div>
          <div className="col-md-6"><strong>Vehicle No:</strong> {item.VehicleNumber}</div>
          <div className="col-md-6"><strong>Brand:</strong> {item.BrandName}</div>
          <div className="col-md-6"><strong>Model:</strong> {item.ModelName}</div>
          <div className="col-md-6"><strong>Fuel Type:</strong> {item.FuelTypeName}</div>
          <div className="col-md-6"><strong>Total Price:</strong> ₹{item.TotalPrice}</div>
        </div>
      </div>

      {/* Packages Section */}
      <div className="mb-4">
        <h6 className="text-warning fw-bold mb-3">📦 Packages</h6>
        {item.Packages.map((pkg) => (
          <div key={pkg.PackageID} className="mb-3 p-3 border rounded">
            <strong>{pkg.PackageName}</strong> <span className="text-muted">({pkg.EstimatedDurationMinutes} mins)</span>
            <div className="mt-2">
              {/* <strong>Category:</strong> {pkg.Category.CategoryName} */}
              {pkg.Category.SubCategories.map((sub) => (
                <div key={sub.SubCategoryID} className="ms-3 mt-2">
                  {/* <strong>SubCategory:</strong> {sub.SubCategoryName} */}
                  <ul className="mb-0">
                    {sub.Includes.map((inc) => (
                      <li key={inc.IncludeID}>{inc.IncludeName}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Map Section */}
      <div>
        <h6 className="text-info fw-bold mb-3">🗺️ Location</h6>
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
                {vehicles.map((car) => {
                  return (
                            <div className="col-md-4 mb-3" key={car.VehicleID}>
                              <div className="border rounded shadow-sm h-100 p-3 d-flex flex-column">
                                <div className="row">
                                    <div className="col-md-6 text-center mb-3"> 
                                        <img src={`${API_IMAGE}${car.VehicleImage}`} alt={car.modelName} className="mb-3 rounded w-100"  />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="text-muted small mb-2"><b>Model : </b>{car.ModelName}</div>
                                        <div className="text-muted small mb-2"><b>FuelType : </b>{car.FuelTypeName}</div>
                                     <div className="text-end">
                                            <button
                                              className="btn btn-sm btn-outline-primary"
                                              onClick={() => {
                                                setSelectedVehicle(car);
                                                setShowModal(true);
                                              }}
                                            >
                                              <i className="bi bi-eye"></i> View
                                            </button>
                                          </div>
                                    </div>
                                </div>
                              </div>
                            </div>
                          );
                })}
                </div>
              </div>

              {/* addess Tab */}
              <div className='tab-pane fade' id='address'>
                <div className='row'>
                  {addresses.map((address) => (
                    <div className='col-md-6 mb-3' key={address.AddressID}>
                      <div className='card'>
                        <div className='card-body'>
                          <p className='card-text'><strong>State:</strong>{address.StateName}</p>
                          <p className='card-text'><strong>City:</strong> {address.CityName}</p>
                          <p className='card-text'><strong>Address:</strong> {address.AddressLine1}</p>
                           <div className="text-end">
                            <button
                                              className="btn btn-sm btn-outline-primary"
                                              onClick={() => {
                                                setSelectedAddress(address);
                                                setShowModal(true);
                                              }}
                                            >
                                              <i className="bi bi-eye"></i> View
                                            </button>
                            </div>
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

      {showModal && selectedVehicle && (
  <div className="modal show fade d-block" tabIndex="-1">
    <div className="modal-dialog modal-lg" style={{zIndex: 9999}}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Vehicle Details</h5>
          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
        </div>
        <div className="modal-body row">
          <div className="col-md-4 text-center">
            <img
              src={`${API_IMAGE}${selectedVehicle.VehicleImage}`}
              alt="Vehicle"
              className="img-fluid rounded mb-3"
            />
            <div><strong>Brand:</strong> {selectedVehicle.BrandName}</div>
            <div><strong>Model:</strong> {selectedVehicle.ModelName}</div>
            <div><strong>Fuel:</strong> {selectedVehicle.FuelTypeName}</div>
            <div><strong>Transmission:</strong> {selectedVehicle.TransmissionType}</div>
          </div>
          <div className="col-md-8">
            <ul className="list-group">
              <li className="list-group-item"><strong>Vehicle Number:</strong> {selectedVehicle.VehicleNumber}</li>
              <li className="list-group-item"><strong>Year Of Purchase:</strong> {selectedVehicle.YearOfPurchase}</li>
              <li className="list-group-item"><strong>Engine Type:</strong> {selectedVehicle.EngineType}</li>
              <li className="list-group-item"><strong>Kilometers Driven:</strong> {selectedVehicle.KilometersDriven}</li>
              <li className="list-group-item"><strong>Created Date:</strong> {new Date(selectedVehicle.CreatedDate).toLocaleString()}</li>
              <li className="list-group-item"><strong>Status:</strong> {selectedVehicle.IsActive ? "Active" : "Inactive"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div className="modal-backdrop fade show"></div>
  </div>
)}
    </div>
  );
};

export default CustomerViewLayer;
