import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const DealerAddLayer = ({ setPageTitle }) => {
  const { DealerID } = useParams();
  const isEditing = Boolean(DealerID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    DealerID: "",
    DistributorID: "",
    FullName: "",
    PhoneNumber: "",
    Email: "",
    PasswordHash: "",
    ConfirmPassword: "",
    Address: "",
    StateID: "",
    CityID: "",
    IsActive: true,
    GSTNumber: "",
    CreatedDate: new Date().toISOString(),
    Longitude: 0,
    Latitude: 0,
    BankAccountNumber: "",
    BranchName: "",
    IFSCCode: "",
    BankName: "",
    CategoryIDs: "",
    Rating: 0,
  });

  const [data, setData] = useState({
    type: "",
    value: "",
  });

  const typeOptions = [
    { value: "percentage", label: "Percentage" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  useEffect(() => {
    setPageTitle(isEditing ? "Edit - Dealer" : "Add - Dealer");
    fetchStates();
    fetchCities();
    fetchCategories();
    fetchDistributors();
    if (isEditing) fetchDealer();
  }, []);

  const fetchDealer = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}Dealer/dealerid?dealerid=${DealerID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const dealer = Array.isArray(res.data) ? res.data[0] : res.data;
      setFormData((prev) => ({
        ...prev,
        ...dealer,
        ConfirmPassword: dealer.PasswordHash || "",
      }));
    } catch (err) {
      console.error("Failed to fetch dealer", err);
    }
  };

  const fetchStates = async () => {
    const res = await axios.get(`${API_BASE}State`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStates(res.data);
  };

  const fetchDistributors = async () => {
    const res = await axios.get(`${API_BASE}Distributors`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (role === "Admin") {
      setDistributors(res.data);
    } else {
      const filtered = res.data.filter(
        (d) => d.DistributorID === Number(userId)
      );
      setDistributors(filtered);
    }
  };

  const fetchCities = async () => {
    const res = await axios.get(`${API_BASE}City`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCities(res.data);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}Category`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const handleInput = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleDropdown = (selected) => {
    setData({
      ...data,
      type: selected?.value || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "IsActive" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, [
      "DealerID",
      "IsActive",
      "ConfirmPassword",
    ]);

    if (formData.PasswordHash !== formData.ConfirmPassword) {
      validationErrors.ConfirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const { ConfirmPassword, ...payload } = formData;
        if (role === "Distributor") {
          payload.DistributorID = Number(userId);
        }
        await axios.put(`${API_BASE}Dealer`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        const { ConfirmPassword, DealerID, ...payload } = formData;
        if (role === "Distributor") {
          payload.DistributorID = Number(userId);
        }
        await axios.post(`${API_BASE}Dealer`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      Swal.fire({
        title: "Success",
        text: `Dealer ${isEditing ? "updated" : "added"} successfully!`,
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/dealers");
        }
      });
    } catch (err) {
      console.error("Submit failed", err);
      Swal.fire("Error", "Failed to save Dealer", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="row g-3"
        >
          {/* Full Name */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Full Name <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="FullName"
              className="form-control radius-8"
              value={formData.FullName}
              onChange={handleChange}
              placeholder="Enter Full Name"
            />
            <FormError error={errors.FullName} />
          </div>

          {/* Email */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Email <span className="text-danger-600">*</span>
            </label>
            <input
              type="email"
              name="Email"
              className="form-control radius-8"
              value={formData.Email}
              onChange={handleChange}
              placeholder="Enter Email"
            />
            <FormError error={errors.Email} />
          </div>

          {/* Phone */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Phone Number <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="PhoneNumber"
              className="form-control radius-8"
              value={formData.PhoneNumber}
              onChange={handleChange}
              placeholder="Enter Phone Number"
            />
            <FormError error={errors.PhoneNumber} />
          </div>

          {/* Distributor */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Distributor <span className="text-danger-600">*</span>
            </label>
            <Select
              name="DistributorID"
              options={distributors.map((d) => ({
                value: d.DistributorID,
                label: `${d.FullName} (${d.IsActive ? "Active" : "Inactive"})`,
              }))}
              value={
                formData.DistributorID
                  ? {
                      value: formData.DistributorID,
                      label: distributors.find(
                        (s) => s.DistributorID === formData.DistributorID
                      )?.FullName,
                    }
                  : null
              }
              onChange={(selected) =>
                handleChange({
                  target: { name: "DistributorID", value: selected?.value || "" },
                })
              }
              classNamePrefix="react-select"
            />
            <FormError error={errors.DistributorID} />
          </div>

          {/* Password */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Password <span className="text-danger-600">*</span>
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                name="PasswordHash"
                className="form-control radius-8"
                value={formData.PasswordHash}
                onChange={handleChange}
                placeholder="Enter Password"
              />
              <Icon
                icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </div>
            <FormError error={errors.PasswordHash} />
          </div>

          {/* Confirm Password */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Confirm Password <span className="text-danger-600">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="ConfirmPassword"
              className="form-control radius-8"
              value={formData.ConfirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
            />
            <FormError error={errors.ConfirmPassword} />
          </div>

          {/* State */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              State <span className="text-danger-600">*</span>
            </label>
            <Select
              name="StateID"
              options={states.map((s) => ({
                value: s.StateID,
                label: s.StateName,
              }))}
              value={
                formData.StateID
                  ? {
                      value: formData.StateID,
                      label: states.find((s) => s.StateID === formData.StateID)
                        ?.StateName,
                    }
                  : null
              }
              onChange={(selected) =>
                handleChange({
                  target: { name: "StateID", value: selected?.value || "" },
                })
              }
              classNamePrefix="react-select"
            />
            <FormError error={errors.StateID} />
          </div>

          {/* City */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              City <span className="text-danger-600">*</span>
            </label>
            <Select
              name="CityID"
              options={cities
                .filter((c) => c.StateID === formData.StateID)
                .map((c) => ({ value: c.CityID, label: c.CityName }))}
              value={
                formData.CityID
                  ? {
                      value: formData.CityID,
                      label: cities.find((c) => c.CityID === formData.CityID)
                        ?.CityName,
                    }
                  : null
              }
              onChange={(selected) =>
                handleChange({
                  target: { name: "CityID", value: selected?.value || "" },
                })
              }
              classNamePrefix="react-select"
            />
            <FormError error={errors.CityID} />
          </div>

          {/* Categories */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Category Name <span className="text-danger-600">*</span>
            </label>
            <Select
              name="CategoryIDs"
              options={categories.map((c) => ({
                value: c.CategoryID,
                label: c.CategoryName,
              }))}
              value={categories
                .filter((c) => {
                  const ids = formData.CategoryIDs
                    ? formData.CategoryIDs.split(",").map((id) => Number(id))
                    : [];
                  return ids.includes(c.CategoryID);
                })
                .map((c) => ({
                  value: c.CategoryID,
                  label: c.CategoryName,
                }))}
              onChange={(selectedOptions) => {
                const ids = selectedOptions
                  ? selectedOptions.map((opt) => opt.value)
                  : [];
                const names = selectedOptions
                  ? selectedOptions.map((opt) => opt.label)
                  : [];
                setFormData((prev) => ({
                  ...prev,
                  CategoryIDs: ids.join(","),
                  CategoryNames: names,
                }));
                clearAllErrors();
              }}
              isMulti
              closeMenuOnSelect={false}
              placeholder="Select Categories"
              classNamePrefix="react-select"
            />
            <FormError error={errors.CategoryIDs} />
          </div>

          {/* GST */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              GST Number <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="GSTNumber"
              className="form-control radius-8"
              value={formData.GSTNumber}
              onChange={handleChange}
              placeholder="Enter GST Number"
            />
            <FormError error={errors.GSTNumber} />
          </div>

          {/* Status */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Status
            </label>
            <select
              name="IsActive"
              className="form-select radius-8"
              value={formData.IsActive ? "true" : "false"}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Commission Type */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Commission Type <span className="text-danger-600">*</span>
            </label>
            <Select
              name="type"
              options={typeOptions}
              value={
                data.type
                  ? typeOptions.find((opt) => opt.value === data.type)
                  : null
              }
              onChange={handleDropdown}
              classNamePrefix="react-select"
            />
          </div>

          {/* Commission Value */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Amount <span className="text-danger-600">*</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                name="value"
                className="form-control radius-8"
                value={data.value}
                onChange={handleInput}
                placeholder="Enter Amount"
              />
              <span className="input-group-text" style={{ height: "33px" }}>
                {data.type === "percentage"
                  ? "%"
                  : data.type === "fixed"
                  ? "₹"
                  : ""}
              </span>
            </div>
          </div>

          {/* Bank Name */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Bank Name <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="BankName"
              className="form-control radius-8"
              value={formData.BankName}
              onChange={handleChange}
              placeholder="Enter Bank Name"
            />
            <FormError error={errors.BankName} />
          </div>

          {/* Account Number */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Account Number <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="BankAccountNumber"
              className="form-control radius-8"
              value={formData.BankAccountNumber}
              onChange={handleChange}
              placeholder="Enter Account Number"
            />
            <FormError error={errors.BankAccountNumber} />
          </div>

          {/* IFSC Code */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              IFSC Code <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              name="IFSCCode"
              className="form-control radius-8"
              value={formData.IFSCCode}
              onChange={handleChange}
              placeholder="Enter IFSC Code"
            />
            <FormError error={errors.IFSCCode} />
          </div>
            {/* Branch */}
            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Branch Name <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                name="BranchName"
                className="form-control radius-8"
                value={formData.BranchName}
                onChange={handleChange}
                placeholder="Enter Branch Name"
              />
              <FormError error={errors.BranchName} />
            </div>
            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Rating <span className="text-danger-600">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  name="Rating"
                  className="form-control radius-8"
                  // value={formState.Rating}
                  // onChange={updateField}
                  value={formData.Rating}
                  onChange={handleChange}
                  placeholder="Enter Rating"
                />
              </div>
              <FormError error={errors.Rating} />
            </div>

            <div className="col-sm-12 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Address
              </label>
              <textarea
                rows="2"
                name="Address"
                className="form-control radius-8"
                value={formData.Address}
                onChange={handleChange}
                placeholder="Enter Address "
              />
            </div>

            <div className="d-flex justify-content-center gap-3 mt-24">
              <Link
                to="/dealers"
                className="btn btn-secondary radius-8 px-14 py-6 text-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                {/* {isEditing ? "Update" : "Save"} Dealer */}
                {isSubmitting
                  ? "Submitting..."
                  : isEditing
                  ? "Update Dealer"
                  : "Save Dealer"}
              </button>
            </div>
          {/* </div> */}
        </form>
      </div>
    </div>
  );
};
export default DealerAddLayer;
