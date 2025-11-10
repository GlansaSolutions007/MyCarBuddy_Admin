import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AddLeadLayer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    description: "",
    currentStatus: "",
  });

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission (dummy data, no API call)
    setTimeout(() => {
      Swal.fire("Success", "Lead added successfully", "success").then(() =>
        navigate("/leads")
      );
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <form className="row g-3" onSubmit={handleSubmit}>
          {/* 🔹 Date */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Date <span className="text-danger-600">*</span>
            </label>
            <input
              type="date"
              name="date"
              className="form-control"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔹 Customer Name */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Name <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="customerName"
              className="form-control"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔹 Customer Phone Number */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Phone Number <span className="text-danger-600">*</span>
            </label>
            <input
              type="tel"
              name="customerPhone"
              className="form-control"
              placeholder="Enter phone number"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔹 Customer Email */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Email <span className="text-danger-600">*</span>
            </label>
            <input
              type="email"
              name="customerEmail"
              className="form-control"
              placeholder="Enter email address"
              value={formData.customerEmail}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔹 Customer Address */}
          <div className="col-12 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Address <span className="text-danger-600">*</span>
            </label>
            <textarea
              name="customerAddress"
              className="form-control"
              placeholder="Enter address"
              rows="3"
              value={formData.customerAddress}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* 🔹 Description */}
          <div className="col-12 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Description <span className="text-danger-600">*</span>
            </label>
            <textarea
              name="description"
              className="form-control"
              placeholder="Enter description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* 🔹 Current Status */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Current Status <span className="text-danger-600">*</span>
            </label>
            <select
              name="currentStatus"
              className="form-select"
              value={formData.currentStatus}
              onChange={handleChange}
              required
            >
              <option value="">Select Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* 🔹 Buttons */}
          <div className="d-flex justify-content-center gap-3 my-80">
            <Link
              to="/leads"
              className="btn btn-secondary radius-8 px-14 py-6 text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadLayer;
