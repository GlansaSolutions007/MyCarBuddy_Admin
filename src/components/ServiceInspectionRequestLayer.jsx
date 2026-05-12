import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Select from "react-select";

const STEPS = [
  "Customer Details",
  "Car Details & Address",
  "Inspection Checklist & Requested Repairs",
  "Payment Entry",
];
const API_BASE = import.meta.env.VITE_APIURL;

const getInitialChecklistState = (items) =>
  items.reduce((acc, item) => {
    const itemId = String(item.Id ?? item.id ?? item.Includes ?? item.Category ?? "");
    acc[itemId] = {
      checked: item.Is_Checked === false || item.Is_Checked === 0 ? false : true,
      reason: String(item.Remarks || item.remarks || ""),
    };
    return acc;
  }, {});

// Auto-capitalize every word (names, cities, addresses)
const capitalizeWords = (value) =>
  value.replace(/\b\w/g, (c) => c.toUpperCase());

// Auto-capitalize first letter only (summaries, notes)
const capitalizeFirst = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const initialFormData = {
  customerName: "",
  phoneNumber: "",
  email: "",
  carBrand: "",
  carModel: "",
  fuelType: "",
  registrationNumber: "",
  year: "",
  kmDriven: "",
  technicianName: "",
  inspectionDate: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  checklist: {},
  inspectionSummary: "",
  requestedRepairs: "",
  lastPaymentAmount: "",
  paymentNote: "",
  amountStatus: "Pending", // always Pending on creation
};

// Fields that capitalise every word on input
const CAPITALIZE_WORDS_FIELDS = new Set([
  "customerName",
  "technicianName",
  "city",
  "state",
  "addressLine1",
  "addressLine2",
]);

// Fields that capitalise only the first letter
const CAPITALIZE_FIRST_FIELDS = new Set([
  "inspectionSummary",
  "requestedRepairs",
  "paymentNote",
]);

const ServiceInspectionRequestLayer = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistState, setChecklistState] = useState({});
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const [carImages, setCarImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [qrData, setQrData] = useState(null); // populated after successful submit
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const progressPercent = useMemo(
    () => `${Math.round((currentStep / STEPS.length) * 100)}%`,
    [currentStep]
  );

  const checklistCategories = useMemo(() => {
    return checklistItems.reduce((acc, item) => {
      const category = String(item.Category || "General").trim();
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [checklistItems]);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!token) return;
      setChecklistLoading(true);
      setChecklistError("");

      try {
        const res = await axios.get(
          `${API_BASE}ServiceImages/GetChecklistForTechnician?planId=184`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setChecklistItems(items);
        setChecklistState(getInitialChecklistState(items));
      } catch (error) {
        console.error("Failed to load checklist", error);
        setChecklistError(
          "Could not load inspection checklist. Please refresh or try again.",
        );
      } finally {
        setChecklistLoading(false);
      }
    };

    fetchChecklist();
  }, [token]);

  // ── Field update with auto-capitalise ──────────────────────────────────────
  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    let processed = type === "checkbox" ? checked : value;

    if (type !== "checkbox") {
      if (name === "kmDriven" || name === "phoneNumber") {
        processed = value.replace(/\D/g, ""); // ✅ only digits
      } else if (CAPITALIZE_WORDS_FIELDS.has(name)) {
        processed = capitalizeWords(value);
      } else if (CAPITALIZE_FIRST_FIELDS.has(name)) {
        processed = capitalizeFirst(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processed,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const updateChecklistField = (itemId, field, value) => {
    setChecklistState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    setCarImages((prev) => [...prev, ...files]);
    setImagePreviewUrls((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setCarImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Dropdown data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [brandRes, modelRes, fuelRes] = await Promise.all([
          axios.get(`${API_BASE}VehicleBrands/GetVehicleBrands`, { headers }),
          axios.get(`${API_BASE}VehicleModels/GetListVehicleModel`, { headers }),
          axios.get(`${API_BASE}FuelTypes/GetFuelTypes`, { headers }),
        ]);
        setBrands(brandRes.data?.data || []);
        setModels(modelRes.data?.data || []);
        setFuelTypes(fuelRes.data?.data || []);
      } catch (error) {
        console.error("Failed to load dropdown data", error);
      }
    };
    fetchDropdownData();
  }, [token]);

  // ── Select options ──────────────────────────────────────────────────────────
  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.BrandID, label: b.BrandName })),
    [brands]
  );
  const selectedBrandOption =
    brandOptions.find((b) => Number(b.value) === Number(formData.carBrand)) || null;

  const filteredModels = useMemo(
    () =>
      selectedBrandOption
        ? models.filter((m) => Number(m.BrandID) === Number(selectedBrandOption.value))
        : models,
    [models, selectedBrandOption]
  );
  const modelOptions = useMemo(
    () => filteredModels.map((m) => ({ value: m.ModelID, label: m.ModelName })),
    [filteredModels]
  );
  const selectedModelOption =
    modelOptions.find((m) => Number(m.value) === Number(formData.carModel)) || null;

  const fuelOptions = useMemo(
    () => fuelTypes.map((f) => ({ value: f.FuelTypeID, label: f.FuelTypeName })),
    [fuelTypes]
  );
  const selectedFuelOption =
    fuelOptions.find((f) => Number(f.value) === Number(formData.fuelType)) || null;

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 1990; y -= 1) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
  }, []);

  const selectDropdownValue = (field, option) => {
    setFormData((prev) => ({
      ...prev,
      [field]: option?.value || "",
      ...(field === "carBrand" ? { carModel: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCurrentStep = () => {
    const stepErrors = {};

    if (currentStep === 1) {
      if (!formData.customerName.trim())
        stepErrors.customerName = "Customer Name is required";

      if (!formData.phoneNumber.trim())
        stepErrors.phoneNumber = "Phone Number is required";
      else if (!/^\d{10}$/.test(formData.phoneNumber.trim()))
        stepErrors.phoneNumber = "Enter a valid 10-digit phone number";

      if (!formData.email.trim())
        stepErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
        stepErrors.email = "Enter a valid email address (e.g. name@domain.com)";
    }

    if (currentStep === 2) {
      if (!formData.registrationNumber.trim())
        stepErrors.registrationNumber = "Registration Number is required";

      const yearValue = String(formData.year).trim();
      if (yearValue) {
        const yearNum = Number(yearValue);
        const currentYear = new Date().getFullYear();
        if (
          Number.isNaN(yearNum) ||
          yearNum < 1990 ||
          yearNum > currentYear
        ) {
          stepErrors.year = "Select a valid manufacture year";
        }
      }

      const kmValue = String(formData.kmDriven).trim();
      if (kmValue && !/^[0-9]+$/.test(kmValue)) {
        stepErrors.kmDriven = "Enter a valid numeric KM value";
      }
    }

    if (currentStep === 4) {
      if (!formData.lastPaymentAmount.toString().trim())
        stepErrors.lastPaymentAmount = "Inspection Amount is required";
      else if (
        isNaN(Number(formData.lastPaymentAmount)) ||
        Number(formData.lastPaymentAmount) <= 0
      )
        stepErrors.lastPaymentAmount = "Enter a valid amount greater than 0";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const resetForm = () => {
    setFormData(initialFormData);
    setChecklistState(getInitialChecklistState(checklistItems));
    setErrors({});
    setCurrentStep(1);
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setCarImages([]);
    setImagePreviewUrls([]);
    setSubmitError("");
    setQrData(null);
  };

  // ── Checklist → JSON string ─────────────────────────────────────────────────
  const buildChecklistItems = () => {
    const rows = checklistItems.map((item) => {
      const itemId = String(item.Id ?? item.id ?? item.Includes ?? "");
      const state = checklistState[itemId] || {};
      return {
        checkListName: String(item.Includes || item.Name || ""),
        category: String(item.Category || ""),
        status: state.checked === false ? 0 : 1,
        remarks: String(state.reason || ""),
      };
    });
    return JSON.stringify(rows);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const location = [formData.addressLine1, formData.addressLine2]
        .filter(Boolean)
        .join(", ");
      const area = [formData.city, formData.state, formData.pincode]
        .filter(Boolean)
        .join(", ");

      const payload = new FormData();
      payload.append("TrackId", "");
      payload.append("CustName", formData.customerName);
      payload.append("PhoneNumber", formData.phoneNumber);
      payload.append("Email", formData.email);
      payload.append(
        "InspectionDate",
        formData.inspectionDate
          ? new Date(formData.inspectionDate).toISOString()
          : new Date().toISOString()
      );
      payload.append("Location", location);
      payload.append("Area", area);
      payload.append("VehicleNumber", formData.registrationNumber);
      payload.append("Brand", selectedBrandOption?.label || "");
      payload.append("Model", selectedModelOption?.label || "");
      payload.append("Fuel", selectedFuelOption?.label || "");
      payload.append("YearOfPurchase", String(formData.year));
      payload.append("KmDriven", String(formData.kmDriven));
      payload.append("TechnicianName", formData.technicianName);
      payload.append("Remarks", formData.inspectionSummary);
      payload.append("RecommendedServices", formData.requestedRepairs || "");
      payload.append("InspectionAmount", String(parseFloat(formData.lastPaymentAmount) || 0));
      payload.append("AmountStatus", "Pending");
      carImages.forEach((file) => payload.append("Images", file));
      payload.append("ChecklistItems", buildChecklistItems());

      const { data } = await axios.post(`${API_BASE}Inspection/insert`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show QR modal with payment info from response
      if (data?.paymentQr?.success) {
        setQrData({
          qrImageUrl: data.paymentQr.imageUrl,   // short URL from Razorpay
          qrId: data.paymentQr.qrId,
          trackId: data.trackId,
          inspectionId: data.id,
          amount: parseFloat(formData.lastPaymentAmount),
          customerName: formData.customerName,
        });
      }

      // Reset form (keep qrData so modal stays visible)
      setFormData(initialFormData);
      setChecklistState(getInitialChecklistState(checklistItems));
      setErrors({});
      setCurrentStep(1);
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setCarImages([]);
      setImagePreviewUrls([]);
    } catch (err) {
      console.error("Submission failed", err);
      setSubmitError(
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Submission failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── QR Payment Modal ────────────────────────────────────────────────────────
  const QrModal = () => {
    if (!qrData) return null;
    const [copied, setCopied] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    // Poll payment status every 3 seconds until captured/closed
    useEffect(() => {
      if (!qrData?.qrId) return;
      let isActive = true;

      const intervalId = setInterval(async () => {
        try {
          const res = await axios.post(
            `${API_BASE}Inspection/payment-complete`,
            { qrId: qrData.qrId, inspectionId: qrData.inspectionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const status = res?.data?.qrStatus;
          if (!isActive) return;

          const normalized =
            typeof status === "string" ? status.toLowerCase() : status;

          if (normalized === "captured" || normalized === "closed") {
            clearInterval(intervalId);
            // Notify backend that payment is complete

            if (isActive) setPaymentDone(true);
          }
        } catch (e) {
          // silently ignore poll errors
        }
      }, 3000);

      return () => {
        isActive = false;
        clearInterval(intervalId);
      };
    }, [qrData?.qrId]);

    const handleCopy = () => {
      navigator.clipboard?.writeText(qrData.qrImageUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };

    const modalStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      zIndex: 1050,
      background: "#fff",
      borderRadius: 16,
      padding: "36px 28px 28px",
      width: "100%",
      maxWidth: 440,
      boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      textAlign: "center",
    };

    return (
      <>
        {/* Backdrop */}
        <div
          onClick={() => setQrData(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1040,
          }}
        />

        {/* ── Payment Success Screen ── */}
        {paymentDone ? (
          <div style={modalStyle}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: 8 }}>
              Payment Received!
            </h5>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              ₹{qrData.amount.toLocaleString("en-IN")} collected from{" "}
              <strong style={{ color: "#111827" }}>{qrData.customerName}</strong>
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>
              Track ID:{" "}
              <span style={{ fontWeight: 600, color: "#374151" }}>
                {qrData.trackId}
              </span>
            </p>
            <button
              type="button"
              className="btn btn-primary-600 w-100"
              onClick={() => setQrData(null)}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── QR Waiting Screen ── */
          <div style={modalStyle}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setQrData(null)}
              style={{
                position: "absolute",
                top: 14,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#9ca3af",
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>

            {/* Submitted badge */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h5 style={{ fontWeight: 700, marginBottom: 6 }}>
              Inspection Submitted!
            </h5>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
              Track ID:{" "}
              <span style={{ fontWeight: 600, color: "#111827" }}>
                {qrData.trackId}
              </span>
            </p>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Share the QR with{" "}
              <strong style={{ color: "#111827" }}>{qrData.customerName}</strong>{" "}
              to collect{" "}
              <strong style={{ color: "#111827" }}>
                ₹{qrData.amount.toLocaleString("en-IN")}
              </strong>
            </p>

            {/* QR code box */}
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "20px 16px 16px",
                marginBottom: 18,
              }}
            >
              {/* Polling indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    display: "inline-block",
                    animation: "qrPulse 1.4s ease-in-out infinite",
                  }}
                />
                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                  Waiting for payment…
                </p>
              </div>
              <style>{`
                @keyframes qrPulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.3; transform: scale(0.75); }
                }
              `}</style>

              {/* QR image — cropped/zoomed to the QR code area */}
              <div
                style={{
                  width: 220,
                  height: 220,
                  margin: "0 auto 14px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={qrData.qrImageUrl}
                  alt="Payment QR Code"
                  style={{
                    width: "170%",
                    height: "160%",
                    marginTop: "-28%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                Or share the payment link directly
              </p>
              <a
                href={qrData.qrImageUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm w-100"
                style={{ fontSize: 13 }}
              >
                Download QR ↗
              </a>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-light border flex-fill"
                onClick={() => setQrData(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary-600 flex-fill"
                onClick={handleCopy}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <QrModal />

      <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
        <div className="card-body p-24">

          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-12 mb-20">
            <div>
              <h6 className="mb-4">Inspection Form</h6>
              <span className="text-secondary-light text-sm">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}
              </span>
            </div>
            <span className="badge bg-primary-100 text-primary-600 px-12 py-6">
              {progressPercent} Complete
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="progress mb-20"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Number(progressPercent.replace("%", ""))}
          >
            <div className="progress-bar bg-primary-600" style={{ width: progressPercent }} />
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="alert alert-danger mb-16" role="alert">
              {submitError}
            </div>
          )}

          <form className="row g-3">

            {/* ══ Step 1: Customer Details ══════════════════════════════════ */}
            {currentStep === 1 && (
              <>
                <div className="col-md-6">
                  <label className="form-label">
                    Customer Name <span className="text-danger">*</span>
                  </label>
                  <input
                    name="customerName"
                    type="text"
                    className="form-control"
                    placeholder="Enter full name"
                    value={formData.customerName}
                    onChange={updateField}
                    required
                  />
                  {errors.customerName && (
                    <small className="text-danger">{errors.customerName}</small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    name="phoneNumber"
                    type="text"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    value={formData.phoneNumber}
                    onChange={updateField}
                    maxLength={10}
                    required
                  />
                  {errors.phoneNumber && (
                    <small className="text-danger">{errors.phoneNumber}</small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={updateField}
                    required
                  />
                  {errors.email && (
                    <small className="text-danger">{errors.email}</small>
                  )}
                </div>

                <div className="col-12 mt-28">
                  <h6>Address Details</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Address Line 1</label>
                  <input
                    name="addressLine1"
                    type="text"
                    className="form-control"
                    placeholder="House no, street"
                    value={formData.addressLine1}
                    onChange={updateField}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Address Line 2</label>
                  <input
                    name="addressLine2"
                    type="text"
                    className="form-control"
                    placeholder="Landmark"
                    value={formData.addressLine2}
                    onChange={updateField}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">City</label>
                  <input
                    name="city"
                    type="text"
                    className="form-control"
                    value={formData.city}
                    onChange={updateField}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">State</label>
                  <input
                    name="state"
                    type="text"
                    className="form-control"
                    value={formData.state}
                    onChange={updateField}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Pincode</label>
                  <input
                    name="pincode"
                    type="text"
                    className="form-control"
                    value={formData.pincode}
                    onChange={updateField}
                    maxLength={6}
                  />
                </div>
              </>
            )}

            {/* ══ Step 2: Car Details ═══════════════════════════════════════ */}
            {currentStep === 2 && (
              <>
                <div className="col-md-4">
                  <label className="form-label">Car Brand</label>
                  <Select
                    options={brandOptions}
                    value={selectedBrandOption}
                    onChange={(option) => selectDropdownValue("carBrand", option)}
                    placeholder="Select Brand"
                    classNamePrefix="react-select"
                    isSearchable
                    isClearable
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Car Model</label>
                  <Select
                    options={modelOptions}
                    value={selectedModelOption}
                    onChange={(option) => selectDropdownValue("carModel", option)}
                    placeholder={selectedBrandOption ? "Select Model" : "Select Brand First"}
                    classNamePrefix="react-select"
                    isSearchable
                    isClearable
                    isDisabled={!selectedBrandOption}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Registration Number <span className="text-danger">*</span>
                  </label>
                  <input
                    name="registrationNumber"
                    type="text"
                    className="form-control"
                    placeholder="e.g. TS09AB1234"
                    value={formData.registrationNumber}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        registrationNumber: e.target.value.toUpperCase(),
                      }));
                      setErrors((prev) => ({ ...prev, registrationNumber: "" }));
                    }}
                    required
                  />
                  {errors.registrationNumber && (
                    <small className="text-danger">{errors.registrationNumber}</small>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Manufacture Year
                  </label>
                  <select
                    name="year"
                    className="form-select"
                    value={formData.year}
                    onChange={updateField}
                  >
                    <option value="">Select year</option>
                    {yearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.year && (
                    <small className="text-danger">{errors.year}</small>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    KM Driven
                  </label>
                  <input
                    name="kmDriven"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    placeholder="e.g. 45000"
                    value={formData.kmDriven}
                    onChange={updateField}
                  />
                  {errors.kmDriven && (
                    <small className="text-danger">{errors.kmDriven}</small>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Fuel Type</label>
                  <Select
                    options={fuelOptions}
                    value={selectedFuelOption}
                    onChange={(option) => selectDropdownValue("fuelType", option)}
                    placeholder="Select Fuel Type"
                    classNamePrefix="react-select"
                    isSearchable
                    isClearable
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Technician Name</label>
                  <input
                    name="technicianName"
                    type="text"
                    className="form-control"
                    placeholder="Assigned technician"
                    value={formData.technicianName}
                    onChange={updateField}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Inspection Date</label>
                  <input
                    name="inspectionDate"
                    type="datetime-local"
                    className="form-control"
                    value={formData.inspectionDate}
                    onChange={updateField}
                  />
                </div>

                {/* Car Images */}
                <div className="col-12">
                  <label className="form-label">Car Images</label>
                  <div
                    className="border rounded-2 p-16 text-center"
                    style={{ cursor: "pointer", background: "#fafafa" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="ri-image-add-line fs-24 text-secondary-light" />
                    <p className="mb-0 text-secondary-light text-sm mt-6">
                      Click to upload car photos (JPG, PNG, WEBP)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleImageSelect}
                    />
                  </div>
                  {imagePreviewUrls.length > 0 && (
                    <div className="d-flex flex-wrap gap-12 mt-12">
                      {imagePreviewUrls.map((url, index) => (
                        <div
                          key={index}
                          style={{ position: "relative", width: 100, height: 100 }}
                        >
                          <img
                            src={url}
                            alt={`car-${index}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              background: "#dc3545",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: 22,
                              height: 22,
                              fontSize: 12,
                              lineHeight: "22px",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══ Step 3: Checklist ═════════════════════════════════════════ */}
            {currentStep === 3 && (
              <>
                <div className="col-12">
                  <label className="form-label d-block mb-12">
                    Inspection Checklist
                  </label>
                  <div className="d-flex flex-column gap-16">
                    {checklistLoading ? (
                      <div className="text-secondary">Loading checklist…</div>
                    ) : checklistError ? (
                      <div className="alert alert-warning">{checklistError}</div>
                    ) : checklistItems.length === 0 ? (
                      <div className="text-secondary">
                        No checklist items found for the selected plan.
                      </div>
                    ) : (
                      Object.entries(checklistCategories).map(
                        ([categoryName, items]) => (
                          <div key={categoryName} className="border rounded-2 p-12">
                            <h6 className="mb-12">{categoryName}</h6>
                            <div className="d-flex flex-column gap-10">
                              {items.map((item) => {
                                const itemId = String(item.Id ?? item.id ?? item.Includes ?? "");
                                const state = checklistState[itemId] || {};
                                return (
                                  <div
                                    key={itemId}
                                    className="row g-2 align-items-center"
                                  >
                                    <div className="col-md-5">
                                      <div className="form-check d-flex align-items-center gap-2 m-0">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={itemId}
                                          checked={state.checked ?? true}
                                          onChange={(e) =>
                                            updateChecklistField(
                                              itemId,
                                              "checked",
                                              e.target.checked,
                                            )
                                          }
                                          style={{ marginTop: 0 }}
                                        />
                                        <label
                                          className="form-check-label m-0"
                                          htmlFor={itemId}
                                        >
                                          {item.Includes || item.Name || "Untitled item"}
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-7">
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Reason / observation"
                                        value={state.reason || ""}
                                        onChange={(e) =>
                                          updateChecklistField(
                                            itemId,
                                            "reason",
                                            capitalizeFirst(e.target.value),
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Inspection Summary</label>
                  <textarea
                    name="inspectionSummary"
                    rows="4"
                    className="form-control"
                    placeholder="Write inspection summary"
                    value={formData.inspectionSummary}
                    onChange={updateField}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Requested Repairs</label>
                  <textarea
                    name="requestedRepairs"
                    rows="6"
                    className="form-control"
                    placeholder="Describe all requested repairs"
                    value={formData.requestedRepairs}
                    onChange={updateField}
                  />
                </div>
              </>
            )}

            {/* ══ Step 4: Payment ═══════════════════════════════════════════ */}
            {currentStep === 4 && (
              <>
                <div className="col-md-6">
                  <label className="form-label">
                    Inspection Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    name="lastPaymentAmount"
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={formData.lastPaymentAmount}
                    onChange={updateField}
                    min={1}
                    required
                  />
                  {errors.lastPaymentAmount && (
                    <small className="text-danger">
                      {errors.lastPaymentAmount}
                    </small>
                  )}
                </div>

                {/* <div className="col-md-6">
                  <label className="form-label">Amount Status</label>
                  <input
                    type="text"
                    className="form-control"
                    value="Pending"
                    readOnly
                    style={{
                      background: "#fff8e1",
                      color: "#856404",
                      fontWeight: 600,
                      cursor: "not-allowed",
                    }}
                  />
                  <small className="text-secondary-light">
                    Automatically set to{" "}
                    <strong>Pending</strong> — updated once payment is received.
                  </small>
                </div> */}

                <div className="col-12">
                  <label className="form-label">Payment Note</label>
                  <textarea
                    name="paymentNote"
                    rows="4"
                    className="form-control"
                    placeholder="Optional payment remark"
                    value={formData.paymentNote}
                    onChange={updateField}
                  />
                </div>
              </>
            )}
          </form>

          {/* Navigation */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-12 mt-24">
            <button
              type="button"
              className="btn btn-light border"
              onClick={resetForm}
            >
              Reset
            </button>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  className="btn btn-primary-600"
                  onClick={nextStep}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Submitting…
                    </>
                  ) : (
                    "Submit Inspection"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceInspectionRequestLayer;