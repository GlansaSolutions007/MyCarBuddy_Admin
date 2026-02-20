import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Accordion } from "react-bootstrap";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const LeadViewOnlyLayer = () => {
  const token = localStorage.getItem("token");
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [previousBookings, setPreviousBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  useEffect(() => {
    if (lead?.PhoneNumber) {
      setBookingsLoading(true);
      fetchBookings();
    } else {
      setCurrentBookings([]);
      setBookingsLoading(false);
    }
  }, [lead]);

  const fetchLead = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}Leads/GetLeadsByIds?LeadIds=${leadId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch lead data");
      }
      const data = await response.json();
      if (data && data.length > 0) {
        setLead(data[0]);
      } else {
        setError("Lead not found.");
      }
    } catch (err) {
      console.error("Failed to load lead", err);
      setError("Failed to load lead. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      if (!lead || !lead.PhoneNumber) {
        setBookingsLoading(false);
        return;
      }

      const res = await axios.get(
        `${API_BASE}Supervisor/ExistingBookings?PhoneNumber=${lead.PhoneNumber}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (Array.isArray(res.data) && res.data.length > 0) {
        const customer = res.data[0];
        const bookingsList = customer.Bookings || [];
        const current = bookingsList
          .filter((b) => b.LeadId === leadId)
          .sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

        const previous = bookingsList
          .filter((b) => b.LeadId !== leadId)
          .sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

        setBookings(bookingsList);
        setCurrentBookings(current);
        setPreviousBookings(previous);
      } else {
        setBookings([]);
        setCurrentBookings([]);
        setPreviousBookings([]);
      }
    } catch (err) {
      console.error("bookings fetch error:", err);
      setBookings([]);
      setCurrentBookings([]);
      setPreviousBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const vehicle = lead?.VehiclesDetails?.[0];
  const isCustomerConverted = lead?.CustID !== null;

  return (
    <>
      <div className="row gy-4 mt-3">
        {/* ------------------ Left: Customer Info ------------------ */}
        <div className="col-lg-4">
          <div className="user-grid-card pt-3 border radius-16 overflow-hidden bg-base h-100">
            <div className="pb-24 ms-16 mb-24 me-16">
              <h6 className="text-xl mb-16 border-bottom pb-2">
                Customer Info
              </h6>

              <div className="text-center border-bottom pb-16">
                <img
                  src="/assets/images/user-grid/user-grid-img13.png"
                  alt="customer"
                  className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
                />
                <h6 className="mb-0 mt-16">{lead?.FullName || "N/A"}</h6>
                <span className="text-secondary-light">
                  {lead?.PhoneNumber || "-"}
                </span>
              </div>

              <div className="mt-24">
                <ul>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Lead ID
                    </span>
                    <span className="w-70 text-secondary-light fw-medium text-break">
                      : {lead?.Id || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Email
                    </span>
                    <span className="w-70 text-secondary-light fw-medium text-break">
                      : {lead?.Email || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Address
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.City || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Description
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.Description || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Created Date
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      :{" "}
                      {lead?.CreatedDate
                        ? new Date(lead.CreatedDate).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Car Reg. Number
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      :{" "}
                      {lead?.VehiclesDetails?.[0]?.RegistrationNumber || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Brand Name
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.VehiclesDetails?.[0]?.BrandName || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Model
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.VehiclesDetails?.[0]?.ModelName || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Fuel Type
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.VehiclesDetails?.[0]?.FuelTypeName || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Payment Status
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.PaymentStatus || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Payment Amount
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.PaymentAmount || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Lead Status
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.LeadStatus || "N/A"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">
                      Next Action
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.NextAction || "N/A"}
                    </span>
                  </li>
                </ul>
                <div className="d-flex gap-2 mt-3 align-items-center flex-wrap">
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(-1);
                    }}
                    className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                  >
                    <Icon icon="mdi:arrow-left" className="fs-5" />
                    Back
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------ Middle: Lead Details ------------------ */}
        <div className="col-lg-5">
          <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
            <div className="pb-24 ms-16 mb-24 me-16">
              {loading ? (
                <p>Loading lead...</p>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : lead ? (
                <>
                  <h6 className="text-xl mb-16 border-bottom pb-2">
                    Lead Information
                  </h6>

                  {/* Personal Information - Read Only */}
                  <Accordion defaultActiveKey="0" className="mt-3">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Personal Information</Accordion.Header>
                      <Accordion.Body>
                        <div className="p-3 border radius-16 bg-light">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Full Name
                              </label>
                              <div className="form-control bg-white">
                                {lead?.FullName || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Mobile No
                              </label>
                              <div className="form-control bg-white">
                                {lead?.PhoneNumber || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-12">
                              <label className="form-label fw-semibold text-primary-light">
                                Email Address
                              </label>
                              <div className="form-control bg-white">
                                {lead?.Email || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Organisation Name
                              </label>
                              <div className="form-control bg-white">
                                {lead?.GSTName || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                GST Number
                              </label>
                              <div className="form-control bg-white">
                                {lead?.GSTNumber || "N/A"}
                              </div>
                            </div>
                            <div className="col-12">
                              <label className="form-label fw-semibold text-primary-light">
                                Full Address
                              </label>
                              <div className="form-control bg-white" style={{ minHeight: "80px" }}>
                                {lead?.City || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                      <Accordion.Header>Car Details</Accordion.Header>
                      <Accordion.Body>
                        <div className="p-3 border radius-16 bg-light">
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Registration Number
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.RegistrationNumber || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Km Driven
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.KmDriven || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Brand
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.BrandName || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Model
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.ModelName || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Fuel Type
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.FuelTypeName || "N/A"}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-semibold text-primary-light">
                                Year of Purchase
                              </label>
                              <div className="form-control bg-white">
                                {vehicle?.YearOfPurchase || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Follow-ups */}
                    {lead?.FollowUps && lead.FollowUps.length > 0 && (
                      <Accordion.Item eventKey="2">
                        <Accordion.Header>
                          Follow-ups ({lead.FollowUps.length})
                        </Accordion.Header>
                        <Accordion.Body>
                          <div className="p-3">
                            {lead.FollowUps.map((followUp, idx) => (
                              <div
                                key={idx}
                                className="mb-3 p-3 border rounded bg-light"
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <strong className="text-primary">
                                    {followUp.Status || "N/A"}
                                  </strong>
                                  <span className="text-muted text-sm">
                                    {followUp.Created_At
                                      ? new Date(
                                          followUp.Created_At,
                                        ).toLocaleString("en-IN")
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <strong>Notes:</strong> {followUp.Notes || "N/A"}
                                </div>
                                {followUp.NextAction && (
                                  <div className="mb-2">
                                    <strong>Next Action:</strong>{" "}
                                    {followUp.NextAction}
                                  </div>
                                )}
                                {followUp.NextFollowUp_Date && (
                                  <div>
                                    <strong>Next Follow-up Date:</strong>{" "}
                                    {new Date(
                                      followUp.NextFollowUp_Date,
                                    ).toLocaleDateString("en-IN")}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}

                    {/* Bookings */}
                    {isCustomerConverted && (
                      <>
                        <Accordion.Item eventKey="current">
                          <Accordion.Header>
                            Current Bookings ({currentBookings.length})
                          </Accordion.Header>
                          <Accordion.Body>
                            {currentBookings.length === 0 ? (
                              <p className="text-muted">
                                No current bookings found.
                              </p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-bordered table-striped p-2 radius-16">
                                  <thead className="form-label fw-semibold text-primary-light">
                                    <tr>
                                      <th>Booking TrackID</th>
                                      <th>Booking Date</th>
                                      <th className="text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentBookings.map((b) => (
                                      <tr key={b.BookingID}>
                                        <td>
                                          <Link
                                            to={`/booking-view/${b.BookingID}`}
                                            className="text-primary"
                                          >
                                            {b.BookingTrackID}
                                          </Link>
                                        </td>
                                        <td>
                                          {b.CreatedDate
                                            ? new Date(
                                                b.CreatedDate,
                                              ).toLocaleDateString("en-IN")
                                            : "N/A"}
                                        </td>
                                        <td className="text-center">
                                          <Link
                                            to={`/booking-view/${b.BookingID}`}
                                            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            title="View"
                                          >
                                            <Icon icon="lucide:eye" />
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </Accordion.Body>
                        </Accordion.Item>

                        <Accordion.Item eventKey="previous">
                          <Accordion.Header>
                            Previous Bookings ({previousBookings.length})
                          </Accordion.Header>
                          <Accordion.Body>
                            {previousBookings.length === 0 ? (
                              <p className="text-muted">
                                No previous bookings found.
                              </p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-bordered table-striped p-2 radius-16">
                                  <thead className="form-label fw-semibold text-primary-light">
                                    <tr>
                                      <th>Lead ID</th>
                                      <th>Booking TrackID</th>
                                      <th>Booking Date</th>
                                      <th className="text-center">View</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {previousBookings.map((b) => (
                                      <tr key={b.BookingID}>
                                        <td>{b.LeadId}</td>
                                        <td>
                                          <Link
                                            to={`/booking-view/${b.BookingID}`}
                                            className="text-primary"
                                          >
                                            {b.BookingTrackID}
                                          </Link>
                                        </td>
                                        <td>
                                          {b.CreatedDate
                                            ? new Date(
                                                b.CreatedDate,
                                              ).toLocaleDateString("en-IN")
                                            : "N/A"}
                                        </td>
                                        <td className="text-center">
                                          <Link
                                            to={`/booking-view/${b.BookingID}`}
                                            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            title="View"
                                          >
                                            <Icon icon="lucide:eye" />
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </Accordion.Body>
                        </Accordion.Item>
                      </>
                    )}
                  </Accordion>
                </>
              ) : (
                <p>No data</p>
              )}
            </div>
          </div>
        </div>

        {/* ------------------ Right: Timeline ------------------ */}
        <div className="col-lg-3">
          <div
            className="user-grid-card border pt-3 radius-16 bg-base d-flex flex-column w-100"
            style={{ height: "975px" }}
          >
            <div className="pb-24 ms-16 mb-24 me-16 flex-grow-1 d-flex flex-column">
              <h6 className="text-xl mb-16 border-bottom pb-2">Timeline</h6>
              <div
                className="flex-grow-1 overflow-auto pe-0"
                style={{ maxHeight: "925px", scrollbarWidth: "thin" }}
              >
                {lead?.TrackingHistory && lead.TrackingHistory.length > 0 ? (
                  <ul className="mb-0 list-unstyled ps-0">
                    {[...lead.TrackingHistory]
                      .sort((a, b) => {
                        const dateA = new Date(a.CreatedDate);
                        const dateB = new Date(b.CreatedDate);
                        return dateB - dateA;
                      })
                      .map((item, idx) => {
                        if (!item.StatusName) return null;
                        return (
                          <li
                            key={idx}
                            className="mb-3 pb-3 border-bottom border-dashed last:border-0"
                          >
                            <div className="d-flex align-items-start gap-3">
                              <span
                                className={`badge rounded-pill px-3 py-2 fw-semibold text-white bg-orange`}
                              >
                                {item.StatusName}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm text-secondary-light fw-medium">
                                <strong>Created Date: </strong>
                                {item.CreatedDate
                                  ? new Date(item.CreatedDate).toLocaleString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )
                                  : "-"}
                              </div>
                              <div className="text-sm text-secondary-light">
                                <strong>Description: </strong>
                                {item.Description || "-"}
                              </div>
                              <div className="text-sm text-secondary-light">
                                <strong>Updated By: </strong>
                                {item.EmployeeName || "-"}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-secondary-light mb-0">
                    No tracking history available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadViewOnlyLayer;
