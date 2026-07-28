import React, { useState } from "react";

function ServiceAtHomeLayer() {
  const [formData, setFormData] = useState({
    technicianStartedDateTime: "",
    technicianReachedDateTime: "",
    serviceStartedDateTime: "",
    serviceCompletedDateTime: "",
  });

  const [services] = useState([
    {
      id: 1,
      serviceName: "Engine Oil Change",
      category: "Periodic Maintenance",
      technician: "Rajesh Kumar",
      status: "Completed",
      amount: "₹1,200",
    },
    {
      id: 2,
      serviceName: "Brake Inspection",
      category: "Inspection",
      technician: "Rajesh Kumar",
      status: "Completed",
      amount: "₹500",
    },
    {
      id: 3,
      serviceName: "AC Service",
      category: "General Service",
      technician: "Rajesh Kumar",
      status: "In Progress",
      amount: "₹800",
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Inspection Completion Data:", formData);
  };

  return (
    <div className="container-fluid py-3">

      {/* Technician & Service Timeline */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white">
          <h6 className="mb-0">Service Timeline</h6>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Technician Started Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Technician Started Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="technicianStartedDateTime"
                  value={formData.technicianStartedDateTime}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Technician Reached Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Technician Reached Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="technicianReachedDateTime"
                  value={formData.technicianReachedDateTime}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Service Start Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Service Start Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="serviceStartedDateTime"
                  value={formData.serviceStartedDateTime}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Service Completion Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Service Completion Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="serviceCompletedDateTime"
                  value={formData.serviceCompletedDateTime}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-end mt-4">
              <button
                type="submit"
                className="btn btn-primary-600 px-6"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Services Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h6 className="mb-0">Service Details</h6>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service, index) => (
                  <tr key={service.id}>
                    <td>{index + 1}</td>
                    <td>{service.serviceName}</td>
                    <td>{service.category}</td>
                    <td>{service.technician}</td>
                    <td>
                      <span
                        className={`badge ${
                          service.status === "Completed"
                            ? "bg-success"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td>{service.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceAtHomeLayer;