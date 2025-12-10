import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Accordion, Modal, Button } from "react-bootstrap";
import { usePermissions } from "../context/PermissionContext";
import axios from "axios";
import Select from "react-select";

const API_BASE = import.meta.env.VITE_APIURL;

const LeadViewLayer = () => {
  const { hasPermission } = usePermissions();
  const token = localStorage.getItem("token");
  const { leadId } = useParams();
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const userId = employeeData?.Id;
  const roleName = employeeData?.RoleName;
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callAnswered, setCallAnswered] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("");
  const [notAnsweredFollowUpDate, setNotAnsweredFollowUpDate] = useState("");
  const [descriptionNotes, setDescriptionNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  // Car Details States
  const [carRegistrationNumber, setCarRegistrationNumber] = useState("");
  const [carYearOfPurchase, setCarYearOfPurchase] = useState("");
  const [carBrand, setCarBrand] = useState(null);
  const [carModel, setCarModel] = useState(null);
  const [carKmDriven, setCarKmDriven] = useState("");
  const [carFuelType, setCarFuelType] = useState(null);

  // Brands, Models, and Fuel Types States
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);

  // Personal Information States
  const [personalFullName, setPersonalFullName] = useState("");
  const [personalMobileNo, setPersonalMobileNo] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalFullAddress, setPersonalFullAddress] = useState("");

  const [bookings, setBookings] = useState([]);
  // Assign Supervisor States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisors, setSupervisors] = useState([]);

  useEffect(() => {
    fetchLead();
    fetchBrands();
    fetchModels();
    fetchFuelTypes();
    fetchSupervisors();
  }, [leadId]);

  useEffect(() => {
    if (!models || models.length === 0) {
      setFilteredModels([]);
      return;
    }

    // if no brand selected -> show all models
    if (!carBrand) {
      setFilteredModels(models);
      // clear model because no brand selected
      setCarModel(null);
      return;
    }

    const brandId = Number(carBrand.value);
    const list = models.filter((m) => Number(m.BrandID) === brandId);
    setFilteredModels(list);

    // only clear carModel if it doesn't belong to the selected brand
    if (carModel) {
      const modelId = Number(carModel.value);
      const modelBelongs = list.some((m) => Number(m.ModelID) === modelId);
      if (!modelBelongs) {
        setCarModel(null);
      }
    }
  }, [models, carBrand, carModel]);

  // Prefill Personal Information and Car Details fields with data from the lead
  useEffect(() => {
    if (lead) {
      setPersonalFullName(lead.FullName || "");
      setPersonalMobileNo(lead.PhoneNumber || "");
      setPersonalEmail(lead.Email || "");
      setPersonalFullAddress(lead.City || ""); // Full address comes from City field

      // Prefill Car Details if available
      if (lead.VehiclesDetails && lead.VehiclesDetails.length > 0) {
        const vehicle = lead.VehiclesDetails[0];
        setCarRegistrationNumber(vehicle.RegistrationNumber || "");
        setCarBrand(
          vehicle.BrandID && vehicle.BrandName
            ? { value: vehicle.BrandID, label: vehicle.BrandName }
            : null
        );
        setCarModel(
          vehicle.ModelID && vehicle.ModelName
            ? { value: vehicle.ModelID, label: vehicle.ModelName }
            : null
        );
        setCarFuelType(
          vehicle.FuelTypeID && vehicle.FuelTypeName
            ? { value: vehicle.FuelTypeID, label: vehicle.FuelTypeName }
            : null
        );
      }
    }
  }, [lead]);

  useEffect(() => {
    if (lead?.PhoneNumber) {
      fetchBookings();
    }
  }, [lead]);

  // Fetch lead from API
  const fetchLead = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}Leads/GetLeadsByIds?LeadIds=${leadId}`
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

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${API_BASE}VehicleBrands/GetVehicleBrands`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.data.status) {
        throw new Error(res.data.message);
      }
      setBrands(res.data.data);
    } catch (error) {
      console.error("Failed to load brands", error);
    }
  };

  // Fetch all models
  const fetchModels = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}VehicleModels/GetListVehicleModel`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setModels(res.data.data);
    } catch (error) {
      console.error("Failed to load models", error);
    }
  };

  // Fetch fuel types
  const fetchFuelTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}FuelTypes/GetFuelTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFuelTypes(res.data.data);
    } catch (error) {
      console.error("Failed to load fuel types", error);
    }
  };

  const fetchBookings = async () => {
    try {
      if (!lead || !lead.PhoneNumber) return;

      const res = await axios.get(
        `${API_BASE}Supervisor/ExistingBookings?PhoneNumber=${lead.PhoneNumber}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("bookings fetch error:", err);
      setBookings([]);
    }
  };

  // Fetch supervisors
  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        // Assuming Employee endpoint for supervisors
        headers: { Authorization: `Bearer ${token}` },
      });

      const employees = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const supervisorList = employees
        .filter(
          (emp) =>
            emp.DepartmentName?.toLowerCase() === "supervisor" ||
            emp.RoleName?.toLowerCase() === "supervisor"
        )
        .map((emp) => ({
          value: emp.Id,
          label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
        }));

      setSupervisors(supervisorList);
    } catch (error) {
      console.error("Failed to fetch supervisors:", error);
      setSupervisors([]);
    }
  };

  const handleWhatsapp = () => {
    let phone = lead?.PhoneNumber;
    const name = lead?.FullName;
    if (!phone) {
      alert("Customer phone number not available");
      return;
    }
    // Clean the number (remove +, spaces, brackets, hyphens)
    phone = phone.toString().trim().replace(/\D/g, "");
    // Add country code if missing
    if (!phone.startsWith("91")) {
      phone = "91" + phone;
    }
    const message = `Hello ${name}!`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  // Handle Assign Supervisor
  const handleAssignSupervisor = async () => {
    if (!selectedSupervisor) {
      Swal.fire({
        icon: "warning",
        title: "Select Supervisor",
        text: "Please select a supervisor to assign.",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}Leads/AssignLeadsToSupervisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: [leadId],
          supervisor_Assign: selectedSupervisor.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign supervisor");
      }

      Swal.fire({
        icon: "success",
        title: "Supervisor Assigned",
        text: "Lead has been successfully assigned to the supervisor.",
      });

      setAssignModalOpen(false);
      setSelectedSupervisor(null);
    } catch (err) {
      console.error("Assign supervisor failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to assign supervisor. Please try again.",
      });
    }
  };

  // Handle Submit Car Details
  const handleSubmitCarDetails = async () => {
    if (!lead) return;

    const payload = {
      Id: lead.Id,
      RegistrationNumber: carRegistrationNumber,
      BrandID: carBrand?.value ?? null,
      ModelID: carModel?.value ?? null,
      FuelTypeID: carFuelType?.value ?? null,
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
        throw new Error("Failed to update car details");
      }
      Swal.fire({
        icon: "success",
        title: "Car Details Saved",
        text: "Car details have been successfully saved.",
      });

      // Reset car details form
      setCarRegistrationNumber("");
      setCarYearOfPurchase("");
      setCarBrand(null);
      setCarModel(null);
      setCarKmDriven("");
      setCarFuelType(null);
    } catch (err) {
      console.error("Car details save failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save car details. Please try again.",
      });
    }
  };

  // Handle Submit Personal Information
  const handleSubmitPersonalInfo = async () => {
    if (!lead) return;

    const payload = {
      Id: lead.Id,
      FullName: personalFullName,
      PhoneNumber: personalMobileNo,
      Email: personalEmail,
      City: personalFullAddress,
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
        throw new Error("Failed to update personal information");
      }

      // Update lead state with new personal info
      setLead((prev) => ({
        ...prev,
        FullName: personalFullName,
        PhoneNumber: personalMobileNo,
        Email: personalEmail,
        City: personalFullAddress, // Full address stored as City
      }));

      Swal.fire({
        icon: "success",
        title: "Personal Information Saved",
        text: "Personal information has been successfully saved.",
      });
    } catch (err) {
      console.error("Personal info save failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save personal information. Please try again.",
      });
    }
  };

  // Handle Submit Status
  const handleSubmitStatus = async () => {
    if (!lead) return;

    if (callAnswered === "") {
      Swal.fire({
        icon: "warning",
        title: "Select call status",
        text: "Please select whether the call was answered or not.",
      });
      return;
    }

    let statusName = "";
    let notes = "";
    let nextFollowUp_Date = null;

    // NOT ANSWERED flow
    if (callAnswered === "Not Ans") {
      if (!followUpStatus) {
        Swal.fire({
          icon: "warning",
          title: "Select follow-up status",
          text: "Please select a follow-up status.",
        });
        return;
      }

      // status should be the reason (e.g. "Not Reachable")
      statusName = followUpStatus;
      // notes prefer typed description, otherwise fallback to reason
      notes =
        descriptionNotes && descriptionNotes.trim() !== ""
          ? descriptionNotes.trim()
          : followUpStatus;
      nextFollowUp_Date = notAnsweredFollowUpDate
        ? new Date(notAnsweredFollowUpDate).toISOString()
        : null;
    }

    // ANSWERED flow
    if (callAnswered === "Ans") {
      if (!callOutcome) {
        Swal.fire({
          icon: "warning",
          title: "Select call outcome",
          text: "Please select a call outcome.",
        });
        return;
      }

      statusName = callOutcome;
      notes =
        discussionNotes && discussionNotes.trim() !== ""
          ? discussionNotes.trim()
          : callOutcome;
      nextFollowUp_Date = nextFollowUpDate
        ? new Date(nextFollowUpDate).toISOString()
        : null;
    }

    // build payload exactly as you requested:
    const payload = {
      leadId: leadId,
      status: callAnswered === "Not Ans" ? followUpStatus : callOutcome,
      notes: notes,
      nextAction: callAnswered === "Not Ans" ? null : nextAction || null,
      nextFollowUp_Date: nextFollowUp_Date,
      created_By: userId,
      type: callAnswered === "Not Ans" ? "Not Answered" : "Answered",
    };

    // optional: log to console for debugging
    // remove this line in production if you want
    console.log("InsertLeadFollowUp payload:", payload);

    try {
      const response = await fetch(`${API_BASE}Leads/InsertLeadFollowUp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // try to read error body for debugging (optional)
        let errText = "";
        try {
          const errData = await response.json();
          errText = JSON.stringify(errData);
        } catch {
          errText = await response.text().catch(() => "");
        }
        throw new Error(`Failed to insert lead follow-up ${errText}`);
      }

      // add new entry to FollowUps immediately
      const newFollowUp = {
        Id: Date.now(), // temporary ID, replace with actual from response if available
        Status: statusName,
        Notes: notes,
        NextAction: nextAction || null,
        NextFollowUp_Date: nextFollowUp_Date,
        Created_By: userId,
        Created_At: new Date().toISOString(),
        Updated_At: null,
      };

      setLead((prev) => ({
        ...prev,
        LeadStatus: statusName,
        FollowUps: Array.isArray(prev?.FollowUps)
          ? [...prev.FollowUps, newFollowUp]
          : [newFollowUp],
      }));

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Lead status updated successfully.",
      });

      // Reset only the fields relevant to this form
      setCallAnswered("");
      setFollowUpStatus("");
      setNotAnsweredFollowUpDate("");
      setDescriptionNotes("");
      setCallOutcome("");
      setDiscussionNotes("");
      setNextAction("");
      setNextFollowUpDate("");
    } catch (err) {
      console.error("Status update failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
      });
    }
  };

  // Clear opposite fields when callAnswered changes to prevent stale values
  useEffect(() => {
    if (callAnswered === "Ans") {
      setFollowUpStatus("");
      setNotAnsweredFollowUpDate("");
      setDescriptionNotes("");
    } else if (callAnswered === "Not Ans") {
      setCallOutcome("");
      setDiscussionNotes("");
      setNextAction("");
      setNextFollowUpDate("");
    }
  }, [callAnswered]);

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
                  src="/assets/images/user-grid/user-grid-img14.png"
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
                      City
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
                      Created
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
                            second: "2-digit",
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
                      Supervisor Name
                    </span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {lead?.Assignments?.[0]?.SupervisorName || "N/A"}
                    </span>
                  </li>
                </ul>
                <div className="d-flex gap-2 mt-3">
                  <Link
                    to="/leads"
                    className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                  >
                    <Icon icon="mdi:arrow-left" className="fs-5" />
                    Back
                  </Link>
                  {!["Supervisor Head", "Supervisor"].includes(roleName) && (
                    <button
                      className="btn btn-primary-600 btn-sm d-flex align-items-center justify-content-center gap-1"
                      onClick={() => setAssignModalOpen(true)}
                    >
                      <Icon icon="mdi:account-plus" className="fs-5" />
                      Assign Supervisor
                    </button>
                  )}
                  {hasPermission("bookservice_view") && (
                    <Link
                      to={`/book-service/${lead?.Id}`}
                      className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                    >
                      <Icon
                        icon="lucide:calendar-check"
                        className="text-white"
                      />{" "}
                      Book Services
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------ Middle: Update Status ------------------ */}
        <div className="col-lg-5">
          <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
            <div className="pb-24 ms-16 mb-24 me-16">
              {loading ? (
                <p>Loading lead...</p>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : lead ? (
                <>
                  {/* Update Status */}
                  {/* <h6 className="text-xl mb-16 border-bottom pb-2">
                    Update Status
                  </h6> */}
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="card-title">Update Status</h6>
                    <Icon
                      icon="ic:baseline-whatsapp"
                      fontSize={28}
                      style={{ color: "#25D366", cursor: "pointer" }}
                      onClick={handleWhatsapp}
                    />
                  </div>

                  <div className="p-3 border radius-16 bg-light">
                    {/* Call Answered Radio Buttons */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-primary-light">
                        Call Status
                      </label>
                      <div className="d-flex justify-content-around px-3 py-2">
                        <div className="form-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="callAnswered"
                            id="callAnswered"
                            value="Ans"
                            checked={callAnswered === "Ans"}
                            onChange={(e) => setCallAnswered(e.target.value)}
                          />
                          <label
                            className="form-check-label ms-1"
                            htmlFor="callAnswered"
                          >
                            Call Answered
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="callAnswered"
                            id="callNotAnswered"
                            value="Not Ans"
                            checked={callAnswered === "Not Ans"}
                            onChange={(e) => setCallAnswered(e.target.value)}
                          />
                          <label
                            className="form-check-label ms-1"
                            htmlFor="callNotAnswered"
                          >
                            Call Not Answered
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Conditional Fields based on Call Status */}
                    {callAnswered === "Not Ans" && (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Follow-up Status
                          </label>
                          <select
                            className="form-select"
                            value={followUpStatus}
                            onChange={(e) => setFollowUpStatus(e.target.value)}
                          >
                            <option value="">Select status</option>
                            <option value="Ringing But Not Responded">
                              Ringing But Not Responded
                            </option>
                            <option value="Busy">Busy</option>
                            <option value="Not Reachable">Not Reachable</option>
                            <option value="Switched Off">Switched Off</option>
                            <option value="Temporary Out of Service">
                              Temporary Out of Service
                            </option>
                            <option value="Number Does Not Exist">
                              Number Does Not Exist
                            </option>
                            <option value="DND">DND</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Next Follow-up Date
                          </label>
                          <input
                            type="date"
                            placeholder="DD-MM-YYYY"
                            className="form-control"
                            value={notAnsweredFollowUpDate}
                            onChange={(e) =>
                              setNotAnsweredFollowUpDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Description / Notes
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Add notes"
                            value={descriptionNotes}
                            maxLength={200}
                            onChange={(e) =>
                              setDescriptionNotes(e.target.value)
                            }
                          />
                          <small
                            className="text-secondary-light text-sm"
                            style={{ display: "block", textAlign: "right" }}
                          >
                            {descriptionNotes.length}/200 characters
                          </small>
                        </div>
                      </div>
                    )}

                    {callAnswered === "Ans" && (
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Discussion Result
                          </label>
                          <select
                            className="form-select"
                            value={callOutcome}
                            onChange={(e) => setCallOutcome(e.target.value)}
                          >
                            <option value="">Select outcome</option>
                            <option value="Interested">Interested</option>
                            <option value="Not Interested">
                              Not Interested
                            </option>
                            <option value="Need More Info">
                              Need More Info
                            </option>
                            <option value="Converted to Customer">
                              Converted to Customer
                            </option>
                            <option value="Not Converted">Not Converted</option>
                            <option value="Not Having Car">
                              Not Having Car
                            </option>
                            {/* <option value="Conversion">Customer Referred</option> */}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Discussion Notes
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Add discussion notes"
                            value={discussionNotes}
                            onChange={(e) => {
                              setDiscussionNotes(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height =
                                e.target.scrollHeight + "px";
                            }}
                            style={{ overflow: "hidden", resize: "none" }}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Next Action
                          </label>
                          <select
                            className="form-select"
                            value={nextAction}
                            onChange={(e) => setNextAction(e.target.value)}
                          >
                            <option value="">Select action</option>
                            <option value="Ok for Inspection">
                              Ok for Inspection
                            </option>
                            <option value="Schedule Meeting">
                              Schedule Meeting
                            </option>
                            <option value="Price Issue">Price Issue</option>
                            <option value="Follow-up Needed">
                              Follow-up Needed
                            </option>
                            <option value="Send Details">Send Details</option>
                            <option value="Lead Closed">Lead Closed</option>
                          </select>
                        </div>
                        {nextAction && (
                          <div className="col-12">
                            <label className="form-label fw-semibold text-primary-light">
                              Next Follow-up Date
                            </label>
                            <input
                              type="date"
                              placeholder="DD-MM-YYYY"
                              className="form-control"
                              value={nextFollowUpDate}
                              onChange={(e) =>
                                setNextFollowUpDate(e.target.value)
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="d-flex justify-content-end mt-3 gap-10">
                      {hasPermission("createlead_add") && (
                        <Link
                          to="/create-lead"
                          className="btn btn-secondary px-20 btn-sm"
                        >
                          Add Lead
                        </Link>
                      )}
                      <button
                        className="btn btn-primary-600 px-20 btn-sm"
                        onClick={handleSubmitStatus}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p>No data</p>
              )}

              {/* ------------------ Accordions ------------------ */}
              <Accordion className="mt-3">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Personal Information</Accordion.Header>
                  <Accordion.Body>
                    <div className="p-3 border radius-16 bg-light">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Full Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., John Doe"
                            value={personalFullName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.length <= 30) {
                                setPersonalFullName(val);
                              }
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Mobile No
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Enter phone number"
                            value={personalMobileNo}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (!/^\d*$/.test(val)) return;
                              if (val.length > 10) return;
                              if (val.length === 1 && !/[6-9]/.test(val))
                                return;
                              setPersonalMobileNo(val);
                            }}
                          />
                        </div>
                        <div className="col-md-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="e.g., john.doe@example.com"
                            value={personalEmail}
                            onChange={(e) => {
                              const val = e.target.value;
                              const emailRegex =
                                /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,10}$/;
                              if (val !== "" && !emailRegex.test(val)) {
                                if (!/^[A-Za-z0-9@._-]*$/.test(val)) return;
                              }
                              setPersonalEmail(val);
                            }}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Full Address
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Enter full address"
                            value={personalFullAddress}
                            onChange={(e) =>
                              setPersonalFullAddress(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-end mt-3 gap-10">
                        <button
                          className="btn btn-primary-600 px-20 btn-sm"
                          onClick={handleSubmitPersonalInfo}
                        >
                          Save Information
                        </button>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Enter Car Details</Accordion.Header>
                  <Accordion.Body>
                    <div className="p-3 border radius-16 bg-light">
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
                              setCarRegistrationNumber(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Fuel Type
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
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Brand
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
                            Model
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
                            Km Driven
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 50000"
                            value={carKmDriven}
                            onChange={(e) => setCarKmDriven(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-primary-light">
                            Year of Purchase
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g., 2020"
                            value={carYearOfPurchase}
                            onChange={(e) =>
                              setCarYearOfPurchase(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-end mt-3 gap-10">
                        <button
                          className="btn btn-primary-600 px-20 btn-sm"
                          onClick={handleSubmitCarDetails}
                        >
                          Save Car Details
                        </button>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              <Accordion className="mt-3">
                <Accordion.Item eventKey="existing">
                  <Accordion.Header>Existing Bookings</Accordion.Header>
                  <Accordion.Body>
                    {bookings.length === 0 ? (
                      <p className="text-muted">No previous bookings found.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped p-2 radius-16">
                          <thead className="form-label fw-semibold text-primary-light">
                            <tr>
                              <th>ID</th>
                              <th>Booking TrackID</th>
                              <th>Booking Date</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((b) => (
                              <tr key={b.BookingID}>
                                <td>{b.BookingID}</td>
                                <td>
                                  <Link
                                    to={`/view-booking/${b.BookingTrackID}`}
                                    className="text-primary"
                                  >
                                    {b.BookingTrackID}
                                  </Link>
                                </td>
                                <td>
                                  {b.CreatedDate
                                    ? new Date(
                                        b.CreatedDate
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
                                  <Link
                                    to={`/book-service?bookingId=${b.BookingID}`}
                                    className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                    title="Edit"
                                  >
                                    <Icon icon="lucide:edit" />
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
              </Accordion>
            </div>
          </div>
        </div>

        {/* ------------------ Right: Timeline ------------------ */}
        <div className="col-lg-3">
          <div
            className="user-grid-card border pt-3 radius-16 bg-base d-flex flex-column w-100"
            style={{ height: "810px" }}
          >
            <div className="pb-24 ms-16 mb-24 me-16 flex-grow-1 d-flex flex-column">
              <h6 className="text-xl mb-16 border-bottom pb-2">Timeline</h6>
              <div
                className="flex-grow-1 overflow-auto pe-0"
                style={{ maxHeight: "725px", scrollbarWidth: "thin" }}
              >
                {lead?.FollowUps && lead.FollowUps.length > 0 ? (
                  <ul className="mb-0 list-unstyled ps-0">
                    {[...lead.FollowUps]
                      .sort((a, b) => {
                        const dateA = a.Updated_At
                          ? new Date(a.Updated_At)
                          : new Date(a.Created_At);
                        const dateB = b.Updated_At
                          ? new Date(b.Updated_At)
                          : new Date(b.Created_At);
                        return dateB - dateA;
                      })
                      .map((item, idx) => (
                        <li
                          key={idx}
                          className="mb-3 pb-3 border-bottom border-dashed last:border-0"
                        >
                          <div className="d-flex align-items-start gap-3">
                            <span
                              className={`badge rounded-pill px-3 py-2 fw-semibold text-white bg-orange`}
                            >
                              {item.Status}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm text-secondary-light fw-medium">
                              <strong>Updation Date: </strong>
                              {item.Updated_At
                                ? new Date(item.Updated_At).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )
                                : "-"}
                            </div>
                            <div className="text-sm text-secondary-light">
                              <strong>Discussion Notes: </strong>
                              {item.Notes || "-"}
                            </div>
                            {item.NextAction && (
                              <div className="text-sm text-secondary-light">
                                <strong>Next Action: </strong>
                                {item.NextAction}
                              </div>
                            )}
                            <div className="text-sm text-secondary-light">
                              <strong>Next Follow-up Date: </strong>{" "}
                              {item.NextFollowUp_Date
                                ? new Date(
                                    item.NextFollowUp_Date
                                  ).toLocaleDateString()
                                : "-"}
                            </div>
                            <div className="text-sm text-secondary-light">
                              <strong>Updated By: </strong>
                              {item.EmployeeName || "-"}
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-secondary-light mb-0">
                    No follow-ups available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={assignModalOpen}
        onHide={() => setAssignModalOpen(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">Assign Supervisor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Select
            options={supervisors}
            value={selectedSupervisor}
            onChange={setSelectedSupervisor}
            placeholder="Select Supervisor"
            className="react-select-container"
            isSearchable
          />
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignSupervisor}>
            Assign
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LeadViewLayer;
