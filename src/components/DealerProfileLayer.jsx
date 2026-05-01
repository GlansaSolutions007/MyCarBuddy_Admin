import { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";
const DealerID = localStorage.getItem("roleId");

const API_BASE = import.meta.env.VITE_APIURL;

const DealerProfileLayer = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addressRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const isViewMode = true;

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

  const onLoadAutocomplete = (auto) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    setFormData((prev) => {
      const next = { ...prev };
      if (place?.formatted_address) next.Address = place.formatted_address;
      if (place?.geometry?.location) {
        next.Latitude = place.geometry.location.lat();
        next.Longitude = place.geometry.location.lng();
      }
      return next;
    });
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const isApiLoaded = useMemo(
    () =>
      isLoaded &&
      typeof window !== "undefined" &&
      window.google?.maps?.places,
    [isLoaded]
  );

  useLayoutEffect(() => {
    if (!addressRef.current) return;
    const el = addressRef.current;
    requestAnimationFrame(() => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  }, [formData.Address]);

  useEffect(() => {
    fetchStates();
    fetchCities();
    fetchDealer();
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

  const fetchCities = async () => {
    const res = await axios.get(`${API_BASE}City`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCities(res.data);
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

  const ignoreFields = ["ConfirmPassword"];
  const validationErrors = validate(formData, ignoreFields);

  if (formData.PasswordHash !== formData.ConfirmPassword) {
    validationErrors.ConfirmPassword = "Passwords do not match";
  }

  if (Object.keys(validationErrors).length > 0) {
    return;
  }

  setIsSubmitting(true);

  try {
    const payload = {
      dealerID: Number(formData.DealerID) || 0,
      distributorID:
        role === "Distributor"
          ? Number(userId)
          : Number(formData.DistributorID),

      fullName: formData.FullName,
      phoneNumber: formData.PhoneNumber,
      email: formData.Email,
      passwordHash: formData.PasswordHash,

      stateID: Number(formData.StateID),
      cityID: Number(formData.CityID),
      address: formData.Address,
      gstNumber: formData.GSTNumber,

      createdDate: formData.CreatedDate || new Date().toISOString(),
      modifiedDate: new Date().toISOString(),

      isActive: formData.IsActive,
      longitude: Number(formData.Longitude) || 0,
      latitude: Number(formData.Latitude) || 0,

      bankAccountNumber: formData.BankAccountNumber,
      branchName: formData.BranchName,
      ifscCode: formData.IFSCCode,
      bankName: formData.BankName,

      categoryIds: formData.CategoryIDs || "",
      rating: String(formData.Rating || "0"),

      commissionType: formData.commissionType,
      amount: String(formData.amount || ""),
      dealerType: formData.dealerType,
    };

    console.log("PUT Payload:", payload);

    await axios.put(`${API_BASE}Dealer`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    Swal.fire({
      title: "Success",
      text: `Dealer saved successfully!`,
      icon: "success",
    }).then(() => navigate("/dealers"));

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to save Dealer", "error");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <fieldset disabled={isViewMode}>
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
              Full Name
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
              Email
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
              Phone Number
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
              GST Number
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

          {/* Bank Name */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Bank Name
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
              Account Number
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
              IFSC Code
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
              Branch Name
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
              State
            </label>
            <input
              type="text"
              className="form-control radius-8"
              value={
                states.find((s) => s.StateID === formData.StateID)?.StateName || ""
              }
              disabled
            />
            {/* <Select
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
            <FormError error={errors.StateID} /> */}
          </div>

          {/* City */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              City
            </label>
            <input
                type="text"
                className="form-control radius-8"
                value={
                  cities.find((c) => c.CityID === formData.CityID)?.CityName || ""
                }
                disabled
              />
            {/* <Select
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
            <FormError error={errors.CityID} /> */}
          </div>
          <div className="col-sm-12 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Address
            </label>
            {isApiLoaded && (
              <Autocomplete
                onLoad={onLoadAutocomplete}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  className="form-control radius-8 mb-2"
                  placeholder="Search address from Google"
                  autoComplete="off"
                />
              </Autocomplete>
            )}
            <textarea
              ref={addressRef}
              rows="2"
              name="Address"
              className="form-control radius-8"
              value={formData.Address}
              onChange={handleChange}
              placeholder={
                isApiLoaded
                  ? "Selected address appears here (or type manually)"
                  : "Loading address search…"
              }
              style={{ minHeight: "60px" }}
            />
          </div>
          {/* Password */}
          <div className="col-sm-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Password
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
              Confirm Password
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
          {/* <div className="d-flex justify-content-center gap-3 mt-24">
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
              {isSubmitting
                ? "Submitting..."
                :  "Update Profile"}
            </button>
          </div> */}
        </form>
      </div>
    </div>
    </fieldset>
  );
};
export default DealerProfileLayer;