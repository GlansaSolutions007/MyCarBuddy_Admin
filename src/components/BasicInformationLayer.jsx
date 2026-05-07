import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const BasicInformationLayer = () => {
  const { hasPermission } = usePermissions();
  const { bookingId } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialStage = params.get("stage") || "profile";

  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const roleName = employeeData?.RoleName;
  const token = localStorage.getItem("token");

  const [bookingData, setBookingData] = useState(null);
  const [lead, setLead] = useState(null);
  const [activeStage, setActiveStage] = useState(initialStage);

  // profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // car details
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [carBrand, setCarBrand] = useState(null);
  const [carModel, setCarModel] = useState(null);
  const [carFuelType, setCarFuelType] = useState(null);
  const [filteredModels, setFilteredModels] = useState([]);
  const [carRegistrationNumber, setCarRegistrationNumber] = useState("");
  const [carKmDriven, setCarKmDriven] = useState("");
  const [carYearOfPurchase, setCarYearOfPurchase] = useState("");

  // supervisor / FA
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [supervisorHeads, setSupervisorHeads] = useState([]);
  const [selectedSupervisorHead, setSelectedSupervisorHead] = useState(null);
  const [fieldAdvisors, setFieldAdvisors] = useState([]);
  const [selectedFieldAdvisor, setSelectedFieldAdvisor] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [accountDetails, setAccountDetails] = useState({
    id: 0,
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 25 }, (_, i) => {
    const year = currentYear - i;
    return { value: String(year), label: String(year) };
  });
  const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const allStages = [
    { id: "profile", label: "Profile Information" },
    { id: "car", label: "Car Details" },
    { id: "assign-supervisor", label: "Assign Supervisor" },
    { id: "assign-fa", label: "Field Advisor" },
    { id: "account", label: "Account Details" },
  ];

  const visibleStages = useMemo(() => {
    if (roleName === "Supervisor Head") {
      return allStages.filter((s) => s.id !== "assign-supervisor");
    }
    if (roleName === "Field Advisor") {
      return allStages.filter((s) => s.id === "profile" || s.id === "car");
    }
    return allStages;
  }, [roleName]);
  

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${bookingId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = res.data?.[0];
        setBookingData(data);
        setFullName(data?.CustomerName || data?.CustFullName || "");
        setPhone(data?.PhoneNumber || "");
        setEmail(data?.CustEmail || "");
        setAddress(data?.FullAddress || "");
      } catch (e) {
        console.error("Failed to load booking", e);
      }
    };
    loadBooking();
  }, [bookingId, token]);

  // Fetch lead details for this booking (for car details & any other lead info)
  useEffect(() => {
    if (!bookingData?.LeadId) return;
    const fetchLead = async () => {
      try {
        const response = await fetch(
          `${API_BASE}Leads/GetLeadsByIds?LeadIds=${bookingData.LeadId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch lead data");
        }
        const data = await response.json();
        if (data && data.length > 0) {
          const leadObj = data[0];
          setLead(leadObj);
          // Prefill car details from lead, same as LeadViewLayer (280–300)
          if (
            leadObj.VehiclesDetails &&
            leadObj.VehiclesDetails.length > 0
          ) {
            const vehicle = leadObj.VehiclesDetails[0];
            setCarRegistrationNumber(vehicle.RegistrationNumber || "");
            setCarBrand(
              vehicle.BrandID && vehicle.BrandName
                ? { value: vehicle.BrandID, label: vehicle.BrandName }
                : null,
            );
            setCarModel(
              vehicle.ModelID && vehicle.ModelName
                ? { value: vehicle.ModelID, label: vehicle.ModelName }
                : null,
            );
            setCarFuelType(
              vehicle.FuelTypeID && vehicle.FuelTypeName
                ? {
                    value: vehicle.FuelTypeID,
                    label: vehicle.FuelTypeName,
                  }
                : null,
            );
            setCarKmDriven(
              vehicle.KmDriven !== null && vehicle.KmDriven !== undefined
                ? String(vehicle.KmDriven)
                : "",
            );
            setCarYearOfPurchase(
              vehicle.YearOfPurchase
                ? String(vehicle.YearOfPurchase)
                : "",
            );
          }
        }
      } catch (err) {
        console.error("Failed to load lead for car details", err);
      }
    };
    fetchLead();
  }, [bookingData?.LeadId]);

   const fetchBankDetails = async (customerId) => {
  try {
    const headers = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const res = await axios.get(
      `${API_BASE}Customer/get-customer-bank-details?customerId=${customerId}`,
      headers
    );

    const data = Array.isArray(res.data) ? res.data[0] : res.data;

    if (data) {
      setAccountDetails({
        id: data.Id || 0, 
        accountHolderName: data.AccountHolderName || "",
        accountNumber: data.AccountNumber || "",
        confirmAccountNumber: data.AccountNumber || "",
        ifscCode: data.IFSCCode || "",
        bankName: data.BankName || "",
        branch: data.Branch || "",
      });
    } else {
      setAccountDetails((prev) => ({
        ...prev,
        id: 0,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch bank details", err);
  }
};
 useEffect(() => {
  if (bookingData?.CustID) {
    fetchBankDetails(bookingData.CustID);
  }
}, [bookingData?.CustID]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [brandRes, modelRes, fuelRes, areaRes, empRes, slotRes] =
          await Promise.all([
            axios.get(`${API_BASE}VehicleBrands/GetVehicleBrands`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}VehicleModels/GetListVehicleModel`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}FuelTypes/GetFuelTypes`, { headers: { Authorization: `Bearer ${token}` } }),
            // Areas (same as LeadViewLayer fetchAreas)
            axios.get(`${API_BASE}Area/GetArea`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: [] } })),
            // Employees (used for both supervisors and field advisors)
            axios.get(`${API_BASE}Employee`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
            axios.get(`${API_BASE}TimeSlot`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          ]);
        setBrands(brandRes.data?.data || []);
        setModels(modelRes.data?.data || []);
        setFuelTypes(fuelRes.data?.data || []);
        // Areas mapping just like LeadViewLayer (516–533)
        const areasData = areaRes.data?.data || [];
        const areaList = areasData.map((area) => ({
          value: area.AreaId,
          label: `${area.AreaName} (${area.CityName}, ${area.StateName})`,
        }));
        setAreas(areaList);

        // Supervisors mapping just like LeadViewLayer (481–513)
        const employees = Array.isArray(empRes.data)
          ? empRes.data
          : empRes.data?.data || [];
        const supervisorList = employees
          .filter(
            (emp) =>
              emp.DepartmentName === "supervisor" ||
              emp.RoleName === "Supervisor Head",
          )
          .map((emp) => ({
            value: emp.Id,
            label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
            areaId: emp.AreaId,
            areaName: emp.AreaName,
          }));
        setAllSupervisors(supervisorList);
        setSupervisorHeads(supervisorList);
        // Field advisors mapping same as BookingLayer (194–220)
        const fieldAdvisorList = employees
          .filter(
            (emp) =>
              emp.DepartmentName?.toLowerCase() === "field advisor" ||
              emp.RoleName?.toLowerCase() === "field advisor",
          )
          .map((emp) => ({
            value: emp.Id,
            label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
          }));
        setFieldAdvisors(fieldAdvisorList);
        const sortedSlots = (slotRes.data || []).sort((a, b) =>
          String(a.StartTime).localeCompare(String(b.StartTime)),
        );
        setTimeSlots(sortedSlots);
      } catch (e) {
        console.error("Failed to load basic lookups", e);
      }
    };
    if (token) fetchLookups();
  }, [token]);

  useEffect(() => {
    if (!models || models.length === 0) {
      setFilteredModels([]);
      return;
    }
    if (!carBrand) {
      setFilteredModels(models);
      setCarModel(null);
      return;
    }
    const brandId = Number(carBrand.value);
    const list = models.filter((m) => Number(m.BrandID) === brandId);
    setFilteredModels(list);
    if (carModel) {
      const modelId = Number(carModel.value);
      const belongs = list.some((m) => Number(m.ModelID) === modelId);
      if (!belongs) setCarModel(null);
    }
  }, [models, carBrand, carModel]);

  useEffect(() => {
    if (!selectedArea) {
      setSupervisorHeads(allSupervisors);
      return;
    }
    const filtered = allSupervisors.filter(
      (s) => s.areaId === selectedArea.value,
    );
    setSupervisorHeads(filtered);
    setSelectedSupervisorHead(null);
  }, [selectedArea, allSupervisors]);

  if (!bookingData) {
    return <div className="p-4">Loading...</div>;
  }

  const handleAssignConfirm = async () => {
  if (!selectedFieldAdvisor) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Please select a field advisor before assigning.",
    });
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}Supervisor/AssignToFieldAdvisor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingIds: [bookingData.BookingID],
          supervisorHeadId: parseInt(localStorage.getItem("userId")),
          fieldAdvisorId: selectedFieldAdvisor.value,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to assign field advisor");
    }

    Swal.fire({
      icon: "success",
      title: bookingData.FieldAdvisorName ? "Reassigned" : "Assigned",
      text: "Field Advisor assigned successfully",
    });

  } catch (error) {
    console.error("Field Advisor assignment failed:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to assign Field Advisor. Please try again.",
    });
  }
};

  const capitalizeWords = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "ifscCode") {
      updatedValue = value.replace(/\s/g, "").toUpperCase();
    }

    // ✅ Capitalize for specific fields
    if (
      name === "accountHolderName" ||
      name === "bankName" ||
      name === "branch"
    ) {
      updatedValue = capitalizeWords(value);
    }

    setAccountDetails((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

const validateAccountDetails = () => {
  const {
    accountHolderName,
    accountNumber,
    confirmAccountNumber,
    ifscCode,
    bankName,
    branch,
  } = accountDetails;

  if (!accountHolderName.trim()) return "Account holder name is required";
  if (!bankName.trim()) return "Bank name is required";
  if (!accountNumber) return "Account number is required";
  if (!branch.trim()) return "Branch name is required";
  if (accountNumber.length < 8) return "Invalid account number";
  if (accountNumber !== confirmAccountNumber)
    return "Account numbers do not match";
  const ifsc = ifscCode?.replace(/\s/g, "").toUpperCase();
  console.log("IFSC:", accountDetails.ifscCode, accountDetails.ifscCode.length);
  if (!ifsc) return "IFSC code is required";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
    return "Invalid IFSC code";

  return null;
};

const handleSubmitAccountDetails = async () => {
  const errorMsg = validateAccountDetails();

  if (errorMsg) {
    Swal.fire({
      icon: "warning",
      title: "Validation Error",
      text: errorMsg,
    });
    return;
  }
  setIsSubmitting(true);
  try {
    const payload = {
      id: accountDetails.id || 0,
      customerId: bookingData?.CustID || 0,
      accountHolderName: accountDetails.accountHolderName,
      bankName: accountDetails.bankName,
      accountNumber: accountDetails.accountNumber,
      ifscCode: accountDetails.ifscCode,
      branch: accountDetails.branch,
      upiId: "",
      userId: parseInt(localStorage.getItem("userId") || "0"),
    };

    console.log("Account Payload:", payload);

    const response = await axios.post(
      `${API_BASE}Customer/upsert-customer-bank-details`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Account details submitted successfully",
      });
    } else {
      throw new Error("Unexpected response");
    }

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to submit account details",
    });
  }
  setIsSubmitting(false);
};

  return (
    <div className="container-fluid py-3 card">
      <div className="d-flex flex-wrap gap-2 mb-4">
        {visibleStages.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            className={
              s.id === activeStage
                ? "btn btn-primary-600 btn-sm"
                : "btn btn-outline-secondary btn-sm"
            }
            onClick={() => setActiveStage(s.id)}
          >
            {idx + 1}. {s.label}
          </button>
        ))}
      </div>

      {activeStage === "profile" && (
        <div className="card mb-3">
          <div className="card-header">
            <h6 className="mb-0">Profile Information</h6>
          </div>
          <div className="card-body row g-3">
            <div className="col-md-4">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Select Booking Date</label>
              <input
                type="date"
                className="form-control"
                min={today}
                value={bookingData.BookingDate?.split("T")[0] || ""}
                onChange={(e) => {
                  setBookingData((prev) => ({
                    ...prev,
                    BookingDate: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Select Time Slot</label>
              <Select
                options={timeSlots
                  .filter((slot) => {
                    // Hide past slots when selected date is today
                    const selectedDate = bookingData.BookingDate?.split("T")[0];
                    if (!selectedDate) return true;
                    if (selectedDate !== today) return true;
                    const now = new Date();
                    now.setHours(now.getHours() + 2);
                    const [h, m] = String(slot.StartTime).split(":").map(Number);
                    const slotTime = new Date();
                    slotTime.setHours(h, m || 0, 0, 0);
                    return slotTime > now;
                  })
                  .map((slot) => {
                    const label = `${slot.StartTime} - ${slot.EndTime}`;
                    return { value: label, label };
                  })}
                value={
                  bookingData.TimeSlot
                    ? {
                        value: bookingData.TimeSlot,
                        label: bookingData.TimeSlot,
                      }
                    : null
                }
                onChange={(opt) => {
                  setBookingData((prev) => ({
                    ...prev,
                    TimeSlot: opt?.value || "",
                  }));
                }}
                isClearable
                placeholder="Select time slot"
              />
            </div>
            <div className="col-12 d-flex justify-content-center mt-5">
              <button
                type="button"
                className="btn btn-primary-600 btn-sm"
                onClick={async () => {
                  // ✅ Email validation
                  if (!email || email.trim() === "") {
                    Swal.fire("Error", "Email is required", "error");
                    return;
                  }

                  if (!isValidEmail(email)) {
                    Swal.fire("Error", "Please enter a valid email address", "error");
                    return;
                  }
                  try {
                    // Save profile (Lead API)
                    if (bookingData.LeadId) {
                      await axios.post(
                        `${API_BASE}Leads/InsertOrUpdateFacebookLead`,
                        {
                          Id: bookingData.LeadId,
                          bookingID: bookingData?.BookingID || 0,
                          FullName: fullName,
                          PhoneNumber: phone,
                          Email: email,
                          // GSTNumber: "",
                          // GSTName: "",
                          City: address,
                          Latitude: bookingData.Latitude ?? null,
                          Longitude: bookingData.Longitude ?? null,
                           AddressId: lead?.AddressId || 0,
                          custID: lead.CustID || null,
                        },
                      );
                    }

                    // Save booking date & timeslot (BookServicesLayer 1650–1664)
                    if (!address || !bookingData.BookingDate || !bookingData.TimeSlot) {
                      Swal.fire(
                        "Error",
                        "Address, Booking Date and Time Slot are required.",
                        "error",
                      );
                      return;
                    }
                    if (bookingData.BookingID && bookingData.BookingDate && bookingData.TimeSlot) {
                      await axios.put(
                        `${API_BASE}Supervisor/Booking`,
                        {
                          bookingID: bookingData.BookingID,
                          bookingDate: bookingData.BookingDate,
                          TimeSlot: bookingData.TimeSlot,
                        },
                        {
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      );
                    }
                    Swal.fire(
                      "Saved",
                      "Profile & booking details saved successfully.",
                      "success",
                    );
                    setActiveStage("car");
                  } catch (e) {
                    console.error("Save basic profile failed", e);
                    Swal.fire(
                      "Error",
                      "Failed to save. Please try again.",
                      "error",
                    );
                  }
                }}
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStage === "car" && (
        <div className="card mb-3">
          <div className="card-header">
            <h6 className="mb-0">Car Details</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Registration Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., ABC-1234"
                  value={carRegistrationNumber}
                  onChange={(e) =>
                    setCarRegistrationNumber(e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Km Driven
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., 5000"
                  value={carKmDriven}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setCarKmDriven(value);
                  }}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Brand <span className="text-danger-600">*</span>
                </label>
                <Select
                  options={brands.map((brand) => ({
                    value: brand.BrandID,
                    label: brand.BrandName,
                  }))}
                  value={carBrand}
                  onChange={setCarBrand}
                  placeholder="Select Brand"
                  className="react-select-container text-sm"
                  isSearchable
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Model <span className="text-danger-600">*</span>
                </label>
                <Select
                  options={filteredModels.map((model) => ({
                    value: model.ModelID,
                    label: model.ModelName,
                  }))}
                  value={carModel}
                  onChange={setCarModel}
                  placeholder="Select Model"
                  className="react-select-container text-sm"
                  isSearchable
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Fuel Type <span className="text-danger-600">*</span>
                </label>
                <Select
                  options={fuelTypes.map((fuelType) => ({
                    value: fuelType.FuelTypeID,
                    label: fuelType.FuelTypeName,
                  }))}
                  value={carFuelType}
                  onChange={setCarFuelType}
                  placeholder="Select Fuel Type"
                  className="react-select-container text-sm"
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base) => ({
                      ...base,
                      fontSize: "0.675rem",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontSize: "0.675rem",
                    }),
                  }}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-primary-light">
                  Year of Purchase
                </label>
                <Select
                  options={yearOptions}
                  value={
                    carYearOfPurchase
                      ? {
                          value: carYearOfPurchase,
                          label: carYearOfPurchase.toString(),
                        }
                      : null
                  }
                  onChange={(selected) => {
                    setCarYearOfPurchase(selected?.value || "");
                  }}
                  placeholder="Select Year"
                  className="react-select-container text-sm"
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base) => ({
                      ...base,
                      fontSize: "0.675rem",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontSize: "0.675rem",
                    }),
                    menuList: (base) => ({ ...base, maxHeight: 140 }),
                  }}
                />
              </div>
            </div>
           <div className="d-flex justify-content-center mt-5 gap-2">
              <button
                type="button"
                className="btn btn-primary-600 px-20 btn-sm"
                onClick={async () => {
                  if (!bookingData?.LeadId) {
                    Swal.fire(
                      "Error",
                      "Lead information not available for this booking.",
                      "error",
                    );
                    return;
                  }
                  // Validation like LeadViewLayer handleSubmitCarDetails
                  if (!carBrand) {
                    return Swal.fire(
                      "Error",
                      "Please select Car Brand",
                      "error",
                    );
                  }
                  if (!carModel) {
                    return Swal.fire(
                      "Error",
                      "Please select Car Model",
                      "error",
                    );
                  }
                  if (!carFuelType) {
                    return Swal.fire(
                      "Error",
                      "Please select Fuel Type",
                      "error",
                    );
                  }
                  const payload = {
                    Id: bookingData.LeadId,
                    RegistrationNumber: carRegistrationNumber,
                    BrandID: carBrand?.value ?? null,
                    ModelID: carModel?.value ?? null,
                    FuelTypeID: carFuelType?.value ?? null,
                    KmDriven: carKmDriven || null,
                    YearOfPurchase: carYearOfPurchase
                      ? String(carYearOfPurchase)
                      : null,
                       VehicleId: lead?.VehiclesDetails?.[0]?.VehicleID || 0,
                              custID: lead.CustID || null,
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
                      },
                    );
                    if (!response.ok) {
                      throw new Error("Failed to update car details");
                    }
                    Swal.fire({
                      icon: "success",
                      title: "Saved",
                      text: "Car details have been successfully saved.",
                    });
                  } catch (err) {
                    console.error("Car details save failed", err);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text:
                        "Failed to save car details. Please try again.",
                    });
                  }
                }}
              >
                Save Car Details
              </button>
            </div>
          </div>
        </div>
      )}

      {activeStage === "assign-supervisor" &&
        visibleStages.some((s) => s.id === "assign-supervisor") && (
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">
                {bookingData.SupervisorHeadName
                  ? "Reassign Supervisor"
                  : "Assign Supervisor"}
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold text-primary-light mb-1">
                  Current Supervisor
                </label>
                <div className="small text-secondary-light fw-medium">
                  {bookingData.SupervisorHeadName || bookingData.SupervisorHeadPhoneNumber
                    ? `${bookingData.SupervisorHeadName || ""}${
                        bookingData.SupervisorHeadPhoneNumber
                          ? ` (${bookingData.SupervisorHeadPhoneNumber})`
                          : ""
                      }`
                    : "N/A"}
                </div>
              </div>
              <div className="mb-3 pb-3 border-bottom">
                <label className="form-label fw-semibold text-primary-light mb-2">
                  Customer Address
                </label>
                <div className="p-2 bg-light rounded">
                  <p className="mb-0 text-secondary-light fw-medium">
                    {address || "No address available"}
                  </p>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Area</label>
                <Select
                  options={areas}
                  value={selectedArea}
                  onChange={setSelectedArea}
                  className="react-select-container"
                  isSearchable
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Supervisor</label>
                <Select
                  options={supervisorHeads}
                  isDisabled={!selectedArea}
                  value={selectedSupervisorHead}
                  onChange={setSelectedSupervisorHead}
                  className="react-select-container"
                  isSearchable
                />
              </div>
              <div className="d-flex justify-content-center mt-5">
                <button
                  type="button"
                  className="btn btn-primary-600 btn-sm"
                  onClick={async () => {
                    if (!selectedArea) {
                      Swal.fire(
                        "Select Area",
                        "Please select an area before assigning a supervisor.",
                        "warning",
                      );
                      return;
                    }
                    if (!selectedSupervisorHead) {
                      Swal.fire(
                        "Select Supervisor",
                        "Please select a supervisor to assign.",
                        "warning",
                      );
                      return;
                    }
                    try {
                      const response = await fetch(
                        `${API_BASE}Supervisor/AssignToSupervisorHead`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            bookingIds: [bookingData.BookingID],
                            supervisorHeadId: selectedSupervisorHead.value,
                            areaId: selectedArea.value,
                            assignedDate: new Date().toISOString().split("T")[0],
                            assignStatus: "Assign",
                            createdBy: parseInt(
                              localStorage.getItem("userId") || "0",
                              10,
                            ),
                          }),
                        },
                      );
                      if (!response.ok) {
                        throw new Error("Failed to assign supervisor");
                      }
                      Swal.fire({
                        icon: "success",
                        title: bookingData.SupervisorHeadName
                          ? "Reassigned"
                          : "Assigned",
                        text: "Booking has been successfully assigned to the supervisor.",
                      });
                    } catch (err) {
                      console.error("Assign supervisor failed", err);
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Failed to assign supervisor. Please try again.",
                      });
                    }
                  }}
                >
                  {bookingData.SupervisorHeadName ? "Reassign" : "Assign"}
                </button>
              </div>
            </div>
          </div>
        )}

      {activeStage === "assign-fa" &&
        visibleStages.some((s) => s.id === "assign-fa") && (
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">
                {bookingData.FieldAdvisorName
                  ? "Reassign Field Advisor"
                  : "Assign Field Advisor"}
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold text-primary-light mb-1">
                  Current Field Advisor
                </label>
                <div className="small text-secondary-light fw-medium mb-2">
                  {bookingData.FieldAdvisorName || bookingData.FieldAdvisorPhoneNumber
                    ? `${bookingData.FieldAdvisorName || ""}${
                        bookingData.FieldAdvisorPhoneNumber
                          ? ` (${bookingData.FieldAdvisorPhoneNumber})`
                          : ""
                      }`
                    : "N/A"}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Field Advisor</label>
                <Select
                  options={fieldAdvisors}
                  value={selectedFieldAdvisor}
                  onChange={setSelectedFieldAdvisor}
                  className="react-select-container"
                  isSearchable
                />
              </div>
              <div className="d-flex justify-content-center mt-5">
                <button
                  type="button"
                  onClick={handleAssignConfirm}
                  className="btn btn-primary-600 btn-sm"
                >
                  {bookingData.FieldAdvisorName ? "Reassign" : "Assign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeStage === "account" &&
          visibleStages.some((s) => s.id === "account") && (
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">Account Details</h6>
              </div>

              <div className="card-body">
                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label">Account Holder Name</label>
                    <input
                      type="text"
                      name="accountHolderName"
                      className="form-control"
                      value={accountDetails.accountHolderName}
                      onChange={handleAccountChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      className="form-control"
                      value={accountDetails.bankName}
                      onChange={handleAccountChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      inputMode="numeric"
                      className="form-control"
                      value={accountDetails.accountNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setAccountDetails((prev) => ({
                          ...prev,
                          accountNumber: value,
                        }));
                      }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Confirm Account Number</label>
                    <input
                      type="text"
                      name="confirmAccountNumber"
                      inputMode="numeric"
                      className="form-control"
                      value={accountDetails.confirmAccountNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setAccountDetails((prev) => ({
                          ...prev,
                          confirmAccountNumber: value,
                        }));
                      }}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      className="form-control text-uppercase"
                      maxLength={11}
                      value={accountDetails.ifscCode}
                      onChange={handleAccountChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Branch Name</label>
                    <input
                      type="text"
                      name="branch"
                      className="form-control"
                      value={accountDetails.branch}
                      onChange={handleAccountChange}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-center mt-5">
                  <button
                    className="btn btn-primary-600 btn-sm"
                    onClick={handleSubmitAccountDetails}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Details"}
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default BasicInformationLayer;