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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDealerTypes, setSelectedDealerTypes] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dealerTypeOptions = [
    { value: "service", label: "Service Provider" },
    { value: "component", label: "Component Provider" },
  ];

  const [formData, setFormData] = useState({
    DealerID: "",
    DistributorID: "",
    FullName: "",
    PhoneNumber: "",
    Email: "",
    PasswordHash: "",
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
    Rating: "0",
    ConfirmPassword: "",
    dealerType: "",
    commissionType: "",
    amount: "",
  });

  const typeOptions = [
    { value: "percentage", label: "Percentage" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  const resetForm = () => {
    setFormData({
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
      Rating: "0",
      dealerType: "",
      commissionType: "",
      amount: "",
    });

    setSelectedCategories([]);
    setSelectedDealerTypes([]);
  };

  useEffect(() => {
    setPageTitle(isEditing ? "Edit - Dealer" : "Add - Dealer");
    fetchStates();
    fetchCities();
    fetchCategories();
    fetchDistributors();
    if (isEditing) {
      fetchDealer();
    } else {
      resetForm(); // ✅ clears email & password
    }
  }, [DealerID]);

  const fetchDealer = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}Dealer/dealerid?dealerid=${DealerID}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const dealer = Array.isArray(res.data) ? res.data[0] : res.data;
      const categoryOptions = dealer.Categories
        ? dealer.Categories.map((c) => ({
            value: c.CategoryID,
            label: c.CategoryName,
          }))
        : [];
      setSelectedCategories(categoryOptions);
      const dealerTypeArray = dealer.DealerType
        ? dealer.DealerType.split(",")
        : [];

      setSelectedDealerTypes(dealerTypeArray);

      setFormData((prev) => ({
        ...prev,
        DealerID: dealer.DealerID,
        DistributorID: dealer.DistributorID,
        FullName: dealer.FullName,
        PhoneNumber: dealer.PhoneNumber,
        Email: dealer.Email,
        Address: dealer.Address,
        StateID: dealer.StateID,
        CityID: dealer.CityID,
        IsActive: dealer.IsActive,
        GSTNumber: dealer.GSTNumber,
        BankAccountNumber: dealer.BankAccountNumber,
        BranchName: dealer.BranchName,
        IFSCCode: dealer.IFSCCode,
        BankName: dealer.BankName,
        Rating: dealer.Rating ? String(dealer.Rating) : "0",
        PasswordHash: dealer.PasswordHash || "",
        CreatedDate: dealer.CreatedDate || new Date().toISOString(),
        Longitude: dealer.Longitude || 0,
        Latitude: dealer.Latitude || 0,

        // ✅ MAP GET → camelCase
        dealerType: dealer.DealerType || "",
        commissionType: dealer.CommissionType || "",
        amount: dealer.Amount ? String(dealer.Amount) : "",

        CategoryIDs: categoryOptions.map((c) => c.value).join(","),
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
        (d) => d.DistributorID === Number(userId),
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
    const { name, value } = e.target;
    // ✅ API payload
    setFormData((prev) => ({
      ...prev,
      amount: value.toString(),
    }));

    clearAllErrors();
  };

  const handleDropdown = (selected) => {
    const value = selected?.value || "";

    // ✅ API payload
    setFormData((prev) => ({
      ...prev,
      commissionType: value,
    }));

    clearAllErrors();
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
    console.log("SUBMIT CLICKED", {
      isEditing,
      formData,
    });
    
    // Fields to ignore during validation (these are optional or handled separately)
    const ignoreFields = isEditing
      ? ["ConfirmPassword"] // For edit, ignore ConfirmPassword
      : ["DealerID", "ConfirmPassword"]; // For POST, ignore DealerID (empty) and ConfirmPassword (validated separately)

    const validationErrors = validate(formData, ignoreFields);

    if (!isEditing && formData.PasswordHash !== formData.ConfirmPassword) {
      validationErrors.ConfirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) {
      console.log("Validation errors:", validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const { ConfirmPassword, DealerID, ...rest } = formData;

        // PUT payload - all fields in camelCase as per backend API
        const payload = {
          dealerID: Number(formData.DealerID),
          distributorID:
            role === "Distributor"
              ? Number(userId)
              : Number(rest.DistributorID),
          fullName: rest.FullName,
          phoneNumber: rest.PhoneNumber,
          email: rest.Email,
          passwordHash: rest.PasswordHash,
          stateID: Number(rest.StateID),
          cityID: Number(rest.CityID),
          address: rest.Address,
          gstNumber: rest.GSTNumber,
          createdDate: rest.CreatedDate || new Date().toISOString(),
          isActive: rest.IsActive,
          longitude: Number(rest.Longitude) || 0,
          latitude: Number(rest.Latitude) || 0,
          bankAccountNumber: rest.BankAccountNumber,
          branchName: rest.BranchName,
          ifscCode: rest.IFSCCode,
          bankName: rest.BankName,
          categoryIds: rest.CategoryIDs || "",
          modifiedDate: new Date().toISOString(),
          rating: String(rest.Rating || "0"),
          commissionType: rest.commissionType,
          amount: String(rest.amount || ""),
          dealerType: rest.dealerType,
        };

        console.log("PUT Payload:", payload);
        await axios.put(`${API_BASE}Dealer`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        // Exclude DealerID and ConfirmPassword from POST payload
        const { ConfirmPassword, DealerID, ...rest } = formData;

        // Build payload matching expected API format - NO DealerID for POST
        const payload = {
          DistributorID:
            role === "Distributor"
              ? Number(userId)
              : Number(rest.DistributorID),
          FullName: rest.FullName,
          PhoneNumber: rest.PhoneNumber,
          Email: rest.Email,
          PasswordHash: rest.PasswordHash,
          Address: rest.Address,
          StateID: Number(rest.StateID),
          CityID: Number(rest.CityID),
          IsActive: rest.IsActive,
          GSTNumber: rest.GSTNumber,
          CreatedDate: rest.CreatedDate || new Date().toISOString(),
          Longitude: Number(rest.Longitude) || 0,
          Latitude: Number(rest.Latitude) || 0,
          BankAccountNumber: rest.BankAccountNumber,
          BranchName: rest.BranchName,
          IFSCCode: rest.IFSCCode,
          BankName: rest.BankName,
          CategoryIDs: rest.CategoryIDs || "",
          Rating: String(rest.Rating || "0"),
          commissionType: rest.commissionType,
          amount: String(rest.amount || ""),
          dealerType: rest.dealerType,
          CategoryNames: selectedCategories.map((cat) => cat.label),
        };

        console.log("POST Payload:", payload);
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
                        (s) => s.DistributorID === formData.DistributorID,
                      )?.FullName,
                    }
                  : null
              }
              onChange={(selected) =>
                handleChange({
                  target: {
                    name: "DistributorID",
                    value: selected?.value || "",
                  },
                })
              }
              classNamePrefix="react-select"
            />
            <FormError error={errors.DistributorID} />
          </div>
          {/* Dealer Type */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Dealer Type <span className="text-danger-600">*</span>
            </label>

            <Select
              options={dealerTypeOptions}
              value={dealerTypeOptions.filter((opt) =>
                selectedDealerTypes.includes(opt.value),
              )}
              onChange={(selected) => {
                const values = selected ? selected.map((s) => s.value) : [];

                setSelectedDealerTypes(values);

                setFormData((prev) => ({
                  ...prev,
                  dealerType: values.join(","), // ✅ backend key
                }));

                clearAllErrors();
              }}
              isMulti
              placeholder="Select Dealer Type"
              classNamePrefix="react-select"
            />

            <FormError error={errors.dealerType} />
          </div>
          {/* Categories */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Category Name <span className="text-danger-600">*</span>
            </label>
            <Select
              options={categories.map((c) => ({
                value: c.CategoryID,
                label: c.CategoryName,
              }))}
              value={selectedCategories}
              onChange={(selected) => {
                const values = selected || [];

                setSelectedCategories(values);

                setFormData((prev) => ({
                  ...prev,
                  CategoryIDs: values.map((v) => v.value).join(","),
                }));

                clearAllErrors();
              }}
              isMulti
              placeholder="Select Categories"
              classNamePrefix="react-select"
            />

            <FormError error={errors.CategoryIDs} />
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
              options={typeOptions}
              value={
                formData.commissionType
                  ? typeOptions.find(
                      (opt) => opt.value === formData.commissionType,
                    )
                  : null
              }
              onChange={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  commissionType: selected?.value || "",
                }));
                clearAllErrors();
              }}
              classNamePrefix="react-select"
            />
          </div>

          {/* Commission Value */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Commission Percentage / Amount{" "}
              <span className="text-danger-600">*</span>
            </label>
            <div className="input-group">
              <input
                type="number"
                className="form-control radius-8"
                value={formData.amount}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }));
                  clearAllErrors();
                }}
                placeholder="Enter Percentage / Amount"
              />
              <span className="input-group-text" style={{ height: "33px" }}>
                {formData.commissionType === "percentage"
                  ? "%"
                  : formData.commissionType === "fixed"
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
