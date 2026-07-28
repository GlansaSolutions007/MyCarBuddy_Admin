import React, { useState } from "react";
function ServiceAtGarageLayer() {
  const [timeline, setTimeline] = useState({
    technicianStartedDateTime: "",
    technicianReachedDateTime: "",
    carPickedFromCustomerDateTime: "",
    carDroppedAtDealerDateTime: "",
    carPickedFromDealerDateTime: "",
    carDroppedToCustomerDateTime: "",
  });
  const [dealerServices] = useState({
    dealerName: "ABC Motors Service Centre",
    services: [
      {
        id: 1,
        category: "Periodic Maintenance",
        serviceName: "Engine Oil Change",
        technician: "Rajesh Kumar",
        serviceStatus: "Completed",
        amount: "₹1,200",
      },
      {
        id: 2,
        category: "Brakes",
        serviceName: "Brake Pad Inspection",
        technician: "Rajesh Kumar",
        serviceStatus: "In Progress",
        amount: "₹800",
      },
      {
        id: 3,
        category: "AC Service",
        serviceName: "AC Gas Check",
        technician: "Rajesh Kumar",
        serviceStatus: "Pending",
        amount: "₹1,500",
      },
    ],
  });
  const handleTimelineChange = (e) => {
    const { name, value } = e.target;
    setTimeline((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceData = { timeline, dealerServices };
    console.log("Service At Garage Data:", serviceData);
  };
  return (
    <div className="container-fluid py-3">
      {" "}
      <form onSubmit={handleSubmit}>
        {" "}
        {/* SERVICE TIMELINE */}{" "}
        <div className="card shadow-sm border-0 mb-3">
          {" "}
          <div className="card-header bg-white">
            {" "}
            <h6 className="mb-0"> Service Timeline </h6>{" "}
          </div>{" "}
          <div className="card-body">
            {" "}
            {/* Technician Started */}{" "}
            <div className="row align-items-center mb-3">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Technician Started Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="technicianStartedDateTime"
                  value={timeline.technicianStartedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Technician Reached */}{" "}
            <div className="row align-items-center mb-3">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Technician Reached Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="technicianReachedDateTime"
                  value={timeline.technicianReachedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Car Picked From Customer */}{" "}
            <div className="row align-items-center mb-3">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Car Pick From Customer Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="carPickedFromCustomerDateTime"
                  value={timeline.carPickedFromCustomerDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Car Dropped At Dealer */}{" "}
            <div className="row align-items-center">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Car Drop At Dealer Location Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="carDroppedAtDealerDateTime"
                  value={timeline.carDroppedAtDealerDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* SERVICE DETAILS */}{" "}
        <div className="card shadow-sm border-0 mb-3">
          {" "}
          <div className="card-header bg-white">
            {" "}
            <h6 className="mb-0"> Service Details </h6>{" "}
          </div>{" "}
          <div className="card-body">
            {" "}
            <div className="table-responsive">
              {" "}
              <table className="table table-bordered table-hover align-middle mb-0">
                {" "}
                <thead className="table-light">
                  {" "}
                  <tr>
                    {" "}
                    <th>#</th> <th>Category</th> <th>Service Name</th>{" "}
                    <th>Technician</th> <th>Service Status</th>{" "}
                    <th>Dealer Name</th> <th>Amount</th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {dealerServices.services.map((service, index) => (
                    <tr key={service.id}>
                      {" "}
                      <td> {index + 1} </td> <td> {service.category} </td>{" "}
                      <td> {service.serviceName} </td>{" "}
                      <td> {service.technician} </td>{" "}
                      <td>
                        {" "}
                        <span
                          className={`badge ${service.serviceStatus === "Completed" ? "bg-success" : service.serviceStatus === "In Progress" ? "bg-warning text-dark" : "bg-secondary"}`}
                        >
                          {" "}
                          {service.serviceStatus}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td> {dealerServices.dealerName} </td>{" "}
                      <td> {service.amount} </td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* FINAL DELIVERY */}{" "}
        <div className="card shadow-sm border-0 mb-3">
          {" "}
          <div className="card-header bg-white">
            {" "}
            <h6 className="mb-0"> Final Vehicle Delivery </h6>{" "}
          </div>{" "}
          <div className="card-body">
            {" "}
            {/* Car Picked From Dealer */}{" "}
            <div className="row align-items-center mb-3">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Car Pick From Dealer Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="carPickedFromDealerDateTime"
                  value={timeline.carPickedFromDealerDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Car Dropped To Customer */}{" "}
            <div className="row align-items-center">
              {" "}
              <div className="col-md-4">
                {" "}
                <label className="form-label fw-semibold mb-0">
                  {" "}
                  Car Drop To Customer Location Date & Time{" "}
                </label>{" "}
              </div>{" "}
              <div className="col-md-8">
                {" "}
                <input
                  type="datetime-local"
                  name="carDroppedToCustomerDateTime"
                  value={timeline.carDroppedToCustomerDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* SUBMIT */}{" "}
        <div className="text-end mb-3">
          {" "}
          <button type="submit" className="btn btn-primary-600 px-4">
            {" "}
            Submit Service{" "}
          </button>{" "}
        </div>{" "}
      </form>{" "}
    </div>
  );
}
export default ServiceAtGarageLayer;
