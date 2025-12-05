import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import Select from "react-select";
const API_BASE = import.meta.env.VITE_APIURL;

const AddLeadLayer = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local states for brand, model, fuel type selections
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [carBrand, setCarBrand] = useState(null);
  const [carModel, setCarModel] = useState(null);
  const [carFuelType, setCarFuelType] = useState(null);
  const [registrationNumber, setRegistrationNumber] = useState("");

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    platform: "Organic",
  });

  // Fetch brands, models, fuel types on mount
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchBrands = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}VehicleBrands/GetVehicleBrands`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.data?.status) {
          setBrands(res.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load brands", error);
      }
    };

    const fetchModels = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}VehicleModels/GetListVehicleModel`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setModels(res.data.data || []);
      } catch (error) {
        console.error("Failed to load models", error);
      }
    };

    const fetchFuelTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE}FuelTypes/GetFuelTypes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFuelTypes(res.data.data || []);
      } catch (error) {
        console.error("Failed to load fuel types", error);
      }
    };

    fetchBrands();
    fetchModels();
    fetchFuelTypes();
  }, []);

  // Filter models by selected brand
  const filteredModels = carBrand
    ? models.filter((model) => model.BrandID === carBrand.value)
    : models;

  // Reset carModel if it doesn't belong to selected brand
  useEffect(() => {
    if (carModel && carBrand) {
      const modelBelongsToBrand = models.some(
        (model) =>
          model.ModelID === carModel.value && model.BrandID === carBrand.value
      );
      if (!modelBelongsToBrand) {
        setCarModel(null);
      }
    } else if (!carBrand) {
      setCarModel(null);
    }
  }, [carBrand, carModel, models]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isAdmin = role === "admin";

    const payload = {
      FullName: formData.customerName,
      PhoneNumber: formData.customerPhone,
      Email: formData.customerEmail,
      City: formData.customerAddress,
      CreatedDate: formData.date,
      Platform: "Organic",
      RegistrationNumber: registrationNumber,
      BrandID: carBrand?.value ?? null,
      ModelID: carModel?.value ?? null,
      FuelTypeID: carFuelType?.value ?? null,
      ...(role === "Admin"
        ? {}
        : {
            role: employeeData?.Is_Head === 1 ? "Head" : "Employee",
            employeeId: employeeData?.Id,
          }),
    };

    try {
      const response = await fetch(
        `${API_BASE}Leads/InsertOrUpdateFacebookLead`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit lead");
      }

      Swal.fire("Success", "Lead added successfully", "success").then(() =>
        navigate("/organic-leads")
      );
    } catch (error) {
      Swal.fire("Error", error.message || "Something went wrong", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      {" "}
      <div className="card-body p-20">
        {" "}
        <form className="row g-3" onSubmit={handleSubmit}>
          {/* Date */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Date
            </label>{" "}
            <input
              type="date"
              name="date"
              className="form-control"
              value={formData.date}
              onChange={handleChange}
              disabled
              required
            />{" "}
          </div>
          {/* Lead Type */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Lead Type
            </label>
            <input
              type="text"
              name="platform"
              className="form-control"
              value={formData.platform}
              disabled
            />
          </div>

          {/* Customer Name */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Name
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

          {/* Phone */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Phone Number
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

          {/* Email */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Email
            </label>
            <input
              type="email"
              name="customerEmail"
              className="form-control"
              placeholder="Enter email address"
              value={formData.customerEmail}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className="col-12 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Address
            </label>
            <textarea
              name="customerAddress"
              className="form-control"
              placeholder="Enter address"
              rows="3"
              value={formData.customerAddress}
              onChange={handleChange}
            ></textarea>
          </div>
          {/* Brand */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Car Brand
            </label>
            <Select
              options={brands.map((brand) => ({
                value: brand.BrandID,
                label: brand.BrandName,
              }))}
              value={carBrand}
              onChange={setCarBrand}
              placeholder="Select Brand"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>

          {/* Model */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Car Model
            </label>
            <Select
              options={filteredModels.map((model) => ({
                value: model.ModelID,
                label: model.ModelName,
              }))}
              value={carModel}
              onChange={setCarModel}
              placeholder="Select Model"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>
          {/* Registration Number */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Car Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              className="form-control"
              placeholder="Enter registration number"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>
          {/* Fuel Type */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Car Fuel Type
            </label>
            <Select
              options={fuelTypes.map((fuelType) => ({
                value: fuelType.FuelTypeID,
                label: fuelType.FuelTypeName,
              }))}
              value={carFuelType}
              onChange={setCarFuelType}
              placeholder="Select Fuel Type"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>
          {/* Buttons */}
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
