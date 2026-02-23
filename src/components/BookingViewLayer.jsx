import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Select from "react-select";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

// Helper function to convert various time formats into 12-hour AM/PM format
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const raw = timeStr.toString().trim();

  // If already includes AM/PM, try to normalize spacing and return as-is
  if (/\b(AM|PM)\b/i.test(raw)) {
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3].toUpperCase();
      const hh = hour % 12 || 12;
      const mm = minute.toString().padStart(2, "0");
      return `${hh}:${mm} ${period}`;
    }
    return raw.replace(/am/i, "AM").replace(/pm/i, "PM");
  }

  // Extract HH and MM from formats like HH:MM or HH:MM:SS or even just HH
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?/);
  if (!match) return raw;
  const hour24 = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return raw;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Helper function to format timeslot string with flexible dash and spacing
const formatTimeSlot = (timeSlotStr) => {
  if (!timeSlotStr) return "";
  const parts = timeSlotStr.toString().split(/\s*-\s*/);
  if (parts.length !== 2) return formatTime(timeSlotStr);
  return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
};

const BookingViewLayer = () => {
  const [bookingData, setBookingData] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState([]);
  const [selectedReassignTimeSlot, setSelectedReassignTimeSlot] =
    useState(null);
  const token = localStorage.getItem("token");
  const roleId = localStorage.getItem("roleId");
  const roleIdInt = { confirmedBy: roleId ? Number(roleId) : null, };
  const role = localStorage.getItem("role");
  const duserId = localStorage.getItem("userId");
  const [previewServices, setPreviewServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isPaid, setIsPaid] = useState(false);

  // NEW STATES FOR SUPERVISOR/TECHNICIAN SELECTION
  const [assignType, setAssignType] = useState("technician");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  // States for initial assignment modal (separate from reassign modal)
  const [initialAssignModalOpen, setInitialAssignModalOpen] = useState(false);
  const [initialAssignType, setInitialAssignType] = useState("technician");
  const [selectedInitialTechnician, setSelectedInitialTechnician] = useState(null);
  const [selectedInitialSupervisor, setSelectedInitialSupervisor] = useState(null);
  const [selectedInitialFieldAdvisor, setSelectedInitialFieldAdvisor] = useState(null);
  const [selectedInitialTimeSlot, setSelectedInitialTimeSlot] = useState(null);
  const [fieldAdvisors, setFieldAdvisors] = useState([]);
  const [showCustomerConfirmationModal, setShowCustomerConfirmationModal] = useState(false);
  const [confirmationDescription, setConfirmationDescription] = useState("");
  // Assign flow: step 1 = service location choice (doorstep vs garage)
  const [showAssignStep1Modal, setShowAssignStep1Modal] = useState(false);
  const [assignServiceLocation, setAssignServiceLocation] = useState(null); // "doorstep" | "garage"
  // Garage flow (service at garage): pickup/drop and dealer/driver flow
  const [showGarageFlowModal, setShowGarageFlowModal] = useState(false);
  const [garageStep, setGarageStep] = useState("task"); // "task" | "route" | "details" | "return"
  const [garageTask, setGarageTask] = useState(null); // "carPickup" | "carDrop"
  const [garageRoute, setGarageRoute] = useState(null); // "customerToDealer" | "dealerToDealer"
  const [garagePickupDealer, setGaragePickupDealer] = useState(null);
  const [garageDeliverDealer, setGarageDeliverDealer] = useState(null);
  const [garageDriver, setGarageDriver] = useState(null);
  const [garageServiceDone, setGarageServiceDone] = useState(false);
  // Pickup date & time for garage flow
  const [garagePickupDate, setGaragePickupDate] = useState("");
  const [garagePickupTime, setGaragePickupTime] = useState("");
  const [garageDeliveryDate, setGarageDeliveryDate] = useState("");
  const [garageDeliveryTime, setGarageDeliveryTime] = useState("");
  // Dealers from this booking's add-ons (unique by DealerID) for garage flow dropdowns
  const garageDealerOptions = (() => {
    const addOns = bookingData?.BookingAddOns || [];
    const seen = new Set();
    return addOns
      .filter((a) => a.DealerID != null && a.DealerName && !seen.has(Number(a.DealerID)) && (seen.add(Number(a.DealerID)), true))
      .map((a) => ({ value: Number(a.DealerID), label: a.DealerName }));
  })();
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTypeChoice, setPaymentTypeChoice] = useState(null); // null | "online" | "other"
  const [paymentMode, setPaymentMode] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [isDiscountApplicable, setIsDiscountApplicable] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const userId = employeeData?.Id;
  const roleName = employeeData?.RoleName;
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm
  const finalPayAmount = Math.max(
    Number(payAmount || 0) - Number(discountAmount || 0),
    0,
  );
  // State for dynamically adding services
  const [servicesToAdd, setServicesToAdd] = useState([
    {
      id: Date.now(),
      name: "",
      bodyPart: "",
      price: "",
      description: "",
      gstPercent: "",
      gstAmount: "",
      totalAmount: "",
    },
  ]);

  const { bookingId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setIsPaid(!!bookingData?.Payments);
  }, [bookingData]);

  // Keep discount amount not more than entered amount
  useEffect(() => {
    const pay = Number(payAmount || 0);
    const discount = Number(discountAmount || 0);
    if (pay >= 0 && discount > pay) setDiscountAmount(String(pay));
  }, [payAmount, discountAmount]);

  const fetchBookingData = async () => {
    try {
      let url = `${API_BASE}Bookings/BookingId?Id=${bookingId}`;
      // If Dealer
      if (roleId === "3") {
        url += `&dealerId=${duserId}`;
      }
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookingData(res.data[0]);
      console.log("Booking Data:", res.data[0]);
      const formatDate = (date) => {
        if (!date) return "";
        if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        return new Date(date).toISOString().split("T")[0];
      };

      const formatTime = (time) => {
        if (!time) return "";
        const match = time.toString().match(/^(\d{1,2}):(\d{2})/);
        return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
      };

      // Prefill pickup and delivery fields
      const pickupDelivery = res.data?.[0]?.PickupDelivery?.[0];

      if (pickupDelivery) {
        setPickupDate(formatDate(pickupDelivery.PickupDate));
        setPickupTime(formatTime(pickupDelivery.PickupTime));
        setDropDate(formatDate(pickupDelivery.DeliveryDate));
        setDropTime(formatTime(pickupDelivery.DeliveryTime));
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnicians(
        res.data.jsonResult.map((t) => ({
          value: t.TechID,
          label: `${t.TechnicianName} (${t.PhoneNumber})`,
        })),
      );
    } catch (error) {
      console.error("Failed to load technicians", error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_BASE}TimeSlot`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeSlots(
        response.data.map((slot) => ({
          ...slot,
          TsID: slot.TsID,
          StartTime: slot.startTime || slot.StartTime,
          EndTime: slot.endTime || slot.EndTime,
          IsActive: slot.IsActive ?? slot.Status ?? slot.status,
        })),
      );
    } catch (err) {
      console.error("Error fetching time slots:", err);
    }
  };

  const getSelectedTimeSlotOptions = () => {
    if (!bookingData || !bookingData.TimeSlot) return [];
    const raw = bookingData.TimeSlot.toString();
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((p) => ({
      value: p,
      label: p.includes(" - ") ? formatTimeSlot(p) : p,
    }));
  };

  useEffect(() => {
    fetchTechnicians();
    fetchBookingData();
    fetchTimeSlots();
    fetchSupervisors();
    fetchFieldAdvisors();
    fetchServiceTypes();
    fetchTempServices();
  }, [bookingId]);

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
            emp.RoleName?.toLowerCase() === "supervisor",
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

  const fetchFieldAdvisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employees = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

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
    } catch (error) {
      console.error("Failed to fetch field advisors:", error);
      setFieldAdvisors([]);
    }
  };

  const payments = [
    { id: 1, amount: "₹1500", method: "UPI", date: "2025-07-01" },
    { id: 2, amount: "₹2500", method: "Credit Card", date: "2025-06-10" },
  ];

  const handleReschedule = async () => {
    if (!newDate) {
      Swal.fire("Error", "Please select a new date.", "error");
      return;
    }
    if (!selectedTimeSlot || selectedTimeSlot.length === 0) {
      Swal.fire("Error", "Please select at least one time slot.", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Reschedule",
      text: `Are you sure you want to reschedule to ${newDate} at ${selectedTimeSlot
        .map(formatTimeSlot)
        .join(", ")}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reschedule it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(
        `${API_BASE}Reschedules`,
        {
          bookingID: bookingId,
          reason: reason,
          oldSchedule: bookingData.BookingDate,
          newSchedule: newDate,
          timeSlot: selectedTimeSlot.join(","),
          requestedBy: localStorage.getItem("userId") || 1, // Using localStorage for userId
          Status: "",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Booking rescheduled successfully!",
      });
      setShowReschedule(false);
      setNewDate("");
      setSelectedTimeSlot("");
      setReason("");
      fetchBookingData(); // Refresh booking data
    } catch (error) {
      Swal.fire("Error", "Failed to reschedule booking.", "error");
      console.error(error);
    }
  };

  const handleAssignClick = () => {
    if (bookingData && bookingData.TimeSlot) {
      const options = getSelectedTimeSlotOptions();
      if (options.length > 0) {
        setSelectedReassignTimeSlot(options[0]);
      }
    }
    setAssignType("technician");
    setSelectedTechnician(null);
    setSelectedSupervisor(null);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedReassignTimeSlot) {
      Swal.fire({
        icon: "warning",
        title: "Missing Time Slot",
        text: "Please select a time slot.",
      });
      return;
    }

    let payload = {};
    const apiUrl = `${API_BASE}Bookings/assign-technician`;

    if (assignType === "technician") {
      if (!selectedTechnician) {
        Swal.fire({
          icon: "warning",
          title: "Missing Technician",
          text: "Please select a technician.",
        });
        return;
      }

      payload = {
        BookingID: bookingId,
        TechID: selectedTechnician.value,
        AssingedTimeSlot: selectedReassignTimeSlot.value,
        Role: "technician",
        AssignedBy: localStorage.getItem("userId"),
      };
    } else if (assignType === "supervisor") {
      if (!selectedSupervisor) {
        Swal.fire({
          icon: "warning",
          title: "Missing Supervisor",
          text: "Please select a supervisor.",
        });
        return;
      }

      payload = {
        BookingID: bookingId,
        TechID: selectedSupervisor.value,
        AssingedTimeSlot: selectedReassignTimeSlot.value,
        Role: "supervisor",
        AssignedBy: localStorage.getItem("userId"),
      };
    }

    try {
      const res = await axios.put(apiUrl, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success || res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text:
            res.data.message ||
            `${assignType === "technician" ? "Technician" : "Supervisor"
            } assigned successfully`,
        });

        setSelectedTechnician(null);
        setSelectedSupervisor(null);
        setSelectedReassignTimeSlot(null);
        setAssignModalOpen(false);
        setAssignType("technician");
        fetchBookingData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            res.data.message ||
            `${assignType === "technician" ? "Technician" : "Supervisor"
            } assignment failed.`,
        });
      }
    } catch (error) {
      console.error(`Failed to assign ${assignType}`, error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          `Failed to assign ${assignType}. Please try again.`,
      });
    }
  };

  // Handler for initial assignment: first show service location (doorstep vs garage)
  const handleInitialAssignClick = () => {
    setAssignServiceLocation(null);
    setShowAssignStep1Modal(true);
  };

  // After user selects "Service at doorstep" → open employee selection modal
  const openDoorstepAssignModal = () => {
    setShowAssignStep1Modal(false);
    setInitialAssignType("technician");
    setSelectedInitialTechnician(null);
    setSelectedInitialSupervisor(null);
    setSelectedInitialFieldAdvisor(null);
    if (bookingData && bookingData.TimeSlot) {
      const slots = bookingData.TimeSlot.split(",").map((s) => s.trim());
      if (slots.length === 1) {
        const slot = slots[0];
        const [start, end] = slot.split(" - ");
        setSelectedInitialTimeSlot({
          value: slot,
          label: `${formatTime(start)} - ${formatTime(end)}`,
        });
      } else {
        setSelectedInitialTimeSlot(null);
      }
    }
    setInitialAssignModalOpen(true);
  };

  // After user selects "Service at garage" → open garage flow modal
  const openGarageFlowModal = () => {
    setShowAssignStep1Modal(false);
    setGarageStep("task");
    setGarageTask(null);
    setGarageRoute(null);
    setGaragePickupDealer(null);
    setGarageDeliverDealer(null);
    setGarageDriver(null);
    setGarageServiceDone(false);
    setGaragePickupDate(new Date().toISOString().split("T")[0]);
    setGaragePickupTime(new Date().toTimeString().slice(0, 5));
    setGarageDeliveryDate("");
    setGarageDeliveryTime("");
    setShowGarageFlowModal(true);
  };

  const closeGarageFlowModal = () => {
    setShowGarageFlowModal(false);
    setGarageStep("task");
    setGarageTask(null);
    setGarageRoute(null);
    setGaragePickupDealer(null);
    setGarageDeliverDealer(null);
    setGarageDriver(null);
    setGarageServiceDone(false);
    setGaragePickupDate("");
    setGaragePickupTime("");
    setGarageDeliveryDate("");
    setGarageDeliveryTime("");
  };

  // Format time as HH:mm:ss for SavePickupDeliveryTime API
  const toTimeApi = (t) => {
    if (!t || typeof t !== "string") return "";
    const s = t.trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}:00` : "";
  };

  const savePickupDeliveryTime = async (payload) => {
    try {
      const res = await axios.post(
        `${API_BASE}Supervisor/SavePickupDeliveryTime`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { ok: true, data: res.data };
    } catch (err) {
      console.error("SavePickupDeliveryTime error:", err);
      return { ok: false, message: err.response?.data?.message || err.message };
    }
  };

  const buildGaragePayload = () => {
    const bid = Number(bookingId) || bookingData?.BookingID;
    const leadId = bookingData?.LeadId || "";
    if (!bid || !leadId) return null;
    const pickType = garageTask === "carPickup" ? "CarPick" : "CarDrop";
    const routeType = garageRoute === "customerToDealer" ? "CustomerToDealer" : "DealerToDealer";
    let pickFrom = 0;
    let pickTo = 0;
    if (garageRoute === "customerToDealer") {
      if (garageTask === "carPickup") {
        pickFrom = 0;
        pickTo = garageDeliverDealer?.value ?? 0;
      } else {
        pickFrom = garagePickupDealer?.value ?? 0;
        pickTo = 0;
      }
    } else {
      pickFrom = garagePickupDealer?.value ?? 0;
      pickTo = garageDeliverDealer?.value ?? 0;
    }
    return {
      bookingID: bid,
      leadId,
      serviceType: "ServiceAtGarage",
      pickType,
      routeType,
      pickFrom,
      pickTo,
      pickupDate: garagePickupDate || "",
      pickupTime: toTimeApi(garagePickupTime),
      deliveryDate: garageDeliveryDate || "",
      deliveryTime: toTimeApi(garageDeliveryTime),
      techID: garageDriver?.value ?? 0,
      assignDate: new Date().toISOString(),
    };
  };

  const handleInitialAssignConfirm = async () => {
    // Time slot validation only for technician and supervisor
    if (initialAssignType !== "fieldAdvisor" && !selectedInitialTimeSlot) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a time slot",
      });
      return;
    }

    let payload;
    let apiUrl;
    let method;

    // Handle Field Advisor assignment
    if (initialAssignType === "fieldAdvisor") {
      if (!selectedInitialFieldAdvisor) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a field advisor before assigning.",
        });
        return;
      }

      payload = {
        bookingIds: [bookingId],
        supervisorHeadId: Number(userId),
        fieldAdvisorId: selectedInitialFieldAdvisor.value,
      };
      apiUrl = `${API_BASE}Supervisor/AssignToFieldAdvisor`;
      method = "post";
    } else {
      // Common payload format for technician and supervisor
      payload = {
        bookingID: bookingId,
        techID:
          initialAssignType === "technician"
            ? selectedInitialTechnician?.value
            : selectedInitialSupervisor?.value,
        assingedTimeSlot: selectedInitialTimeSlot.value,
        role: initialAssignType === "technician" ? "Technician" : "Supervisor",
      };

      // API URL and method differ based on assign type
      if (initialAssignType === "technician") {
        if (!selectedInitialTechnician) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please select a technician before assigning.",
          });
          return;
        }
        apiUrl = `${API_BASE}Bookings/assign-technician`;
        method = "put";
      } else {
        if (!selectedInitialSupervisor) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please select a supervisor before assigning.",
          });
          return;
        }
        apiUrl = `${API_BASE}Bookings/assign-technician`;
        method = "put";
      }
    }

    try {
      const res = await axios({
        method: method,
        url: apiUrl,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 201) {
        const assignTypeLabel =
          initialAssignType === "technician"
            ? "Technician"
            : initialAssignType === "supervisor"
              ? "Supervisor"
              : "Field Advisor";

        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || `${assignTypeLabel} assigned successfully`,
        });
        fetchBookingData();
        setInitialAssignModalOpen(false);
        setSelectedInitialTechnician(null);
        setSelectedInitialSupervisor(null);
        setSelectedInitialFieldAdvisor(null);
        setSelectedInitialTimeSlot(null);
        setInitialAssignType("technician");
      } else {
        const assignTypeLabel =
          initialAssignType === "technician"
            ? "technician"
            : initialAssignType === "supervisor"
              ? "supervisor"
              : "field advisor";

        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || `Failed to assign ${assignTypeLabel}`,
        });
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text:
          error.response?.data?.message ||
          `Error while assigning ${initialAssignType}. Please check the console for details.`,
      });
    }
  };

  // Get time slot options for initial assignment
  const getInitialTimeSlotOptions = () => {
    if (!bookingData || !bookingData.TimeSlot) return [];
    return bookingData.TimeSlot.split(",").map((slot) => {
      const trimmed = slot.trim();
      const [start, end] = trimmed.split(" - ");
      return {
        value: trimmed,
        label: `${formatTime(start)} - ${formatTime(end)}`,
      };
    });
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel Booking",
      text: "Are you sure you want to cancel this booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(
        `${API_BASE}Bookings/Cancel`,
        {
          BookingID: bookingId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      Swal.fire(
        "Cancelled!",
        "Booking has been cancelled successfully.",
        "success",
      );
      fetchBookingData(); // Refresh booking data
    } catch (error) {
      Swal.fire("Error", "Failed to cancel booking.", "error");
      console.error(error);
    }
  };

  const handleRefund = async (payment) => {
    const amountPaid =
      bookingData.TotalPrice +
      bookingData.GSTAmount -
      (bookingData.CouponAmount || 0);
    const refundedAmount = parseFloat(payment.RefundAmount) || 0;
    const remaining = amountPaid - refundedAmount;

    if (remaining <= 0) {
      Swal.fire(
        "Notification",
        "Your full amount has already been refunded.",
        "info",
      );
      return;
    }

    const { value: refundAmount } = await Swal.fire({
      title: "Enter Refund Amount",
      input: "number",
      inputLabel: `Refund Amount (Max: ₹${remaining.toFixed(2)})`,
      inputValue: remaining.toFixed(2),
      inputAttributes: {
        min: 0,
        max: remaining,
        step: "0.01",
      },
      inputValidator: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return "Please enter a valid positive amount!";
        }
        if (num > remaining) {
          return "Refund amount cannot exceed the remaining amount!";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Refund",
      cancelButtonText: "Cancel",
    });

    if (!refundAmount) return;

    try {
      const res = await axios.post(
        `${API_BASE}Refund/Refund`,
        {
          amount: parseFloat(refundAmount),
          bookingId: bookingData.BookingID,
          // paymentId: payment.TransactionID      // Uncomment if you need to send TransactionID
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        Swal.fire("Success", "Refund processed successfully!", "success");
        fetchBookingData(); // Refresh data after refund
      } else {
        Swal.fire(
          "Error",
          res.data.message || "Failed to process refund.",
          "error",
        );
      }
    } catch (error) {
      console.error("Refund error:", error);
      Swal.fire("Error", "Failed to process refund.", "error");
    }
  };

  const filteredTechnicians = technicians.filter((tech) => {
    return bookingData && bookingData.TechID
      ? tech.value !== bookingData.TechID
      : true;
  });

  const filteredSupervisors = supervisors.filter((sup) => {
    return bookingData && bookingData.SupervisorID
      ? sup.value !== bookingData.SupervisorID
      : true;
  });

  // Handler for adding a new service input block
  const handleAddServiceBlock = () => {
    setServicesToAdd([
      ...servicesToAdd,
      { id: Date.now(), name: "", price: "", description: "" },
    ]);
  };

  // Handler for updating a service within the servicesToAdd array
  const handleServiceChange = (id, field, value) => {
    setServicesToAdd((prevServices) =>
      prevServices.map((service) => {
        if (service.id === id) {
          const updatedService = { ...service, [field]: value };

          const price = parseFloat(updatedService.price) || 0;
          const gstPercent = parseFloat(updatedService.gstPercent) || 0;
          const qty = parseInt(updatedService.qty) || 0; // stored but not used in amount calc

          // Base amount is now only price
          const baseAmount = price;

          // GST calculated on base price only
          const gstAmount = (baseAmount * gstPercent) / 100;

          // Total = price + gst only (no qty multiplication)
          const totalAmount = baseAmount + gstAmount;

          updatedService.gstAmount = gstAmount.toFixed(2);
          updatedService.totalAmount = totalAmount.toFixed(2);

          return updatedService;
        }
        return service;
      }),
    );
  };

  // Handler for removing a service input block
  const handleFinalSubmit = (id) => {
    setServicesToAdd(servicesToAdd.filter((s) => s.id !== id));
  };

  // Handler for submitting all added services
  const handleSubmitAllServices = async () => {
    const supervisorId = bookingData?.SupervisorID; // FIX
    if (!previewServices.length) {
      Swal.fire("Error", "No services added.", "error");
      return;
    }

    const payload = {
      bookingID: Number(bookingId),
      supervisorID: Number(supervisorId),
      addOns: previewServices.map((item) => ({
        serviceName: item.name,
        servicePrice: Number(item.price),
        quantity: Number(item.qty),
        description: item.description || "",
        gstPercent: Number(item.gstPercent || 0),
        gstPrice: Number(item.gstAmount || 0),
        totalPrice: Number(item.totalAmount || item.price),
        type: item.type || "SparePart",
      })),
    };

    try {
      const res = await axios.post(
        `${API_BASE}Supervisor/add-temp-addons`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.fire("Success", "Add-ons added successfully!", "success");
    } catch (error) {
      console.error("Error submitting spare parts:", error);
      Swal.fire("Error", "Failed to submit add-ons.", "error");
    }
  };

  // Calculate the grand total of all services
  const calculateGrandTotal = () => {
    return servicesToAdd
      .reduce((sum, service) => {
        const total = parseFloat(service.totalAmount) || 0;
        return sum + total;
      }, 0)
      .toFixed(2);
  };

  // Calculate Add Service total dynamically
  const addServiceTotal = bookingData?.BookingAddOns
    ? bookingData.BookingAddOns.reduce(
      (sum, item) => sum + (item.TotalPrice || 0),
      0,
    )
    : 0;

  const handleAddLocalService = async () => {
    const valid = servicesToAdd.filter(
      (s) => s.name && s.price && Number(s.price) > 0,
    );

    if (valid.length === 0) {
      Swal.fire("Error", "Please add the required fields!", "error");
      return;
    }

    const supervisorId = bookingData?.SupervisorID || 0;

    const payload = {
      bookingID: Number(bookingId),
      supervisorID: supervisorId,
      addOns: valid.map((item) => ({
        serviceName: item.name,
        servicePrice: Number(item.price),
        quantity: Number(item.qty),
        description: item.description || "",
        gstPercent: Number(item.gstPercent || 0),
        gstPrice: Number(item.gstAmount || 0),
        totalPrice: Number(item.totalAmount || item.price),
        type: item.bodyPart || "SparePart",
      })),
    };

    try {
      await axios.post(`${API_BASE}Supervisor/add-temp-addons`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Service added successfully!", "success");

      // clear form
      setServicesToAdd([
        {
          id: Date.now(),
          name: "",
          bodyPart: "",
          price: "",
          qty: "",
          gstPercent: "",
          gstAmount: "",
          totalAmount: "",
          description: "",
        },
      ]);

      fetchTempServices();

      fetchBookingData(); // refresh
    } catch (error) {
      console.error("Add Service Error:", error);
      Swal.fire("Error", "Failed to add service.", "error");
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}Supervisor/ServiceTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setServiceTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load service types", error);
    }
  };

  const fetchTempServices = async () => {
    try {
      const res = await axios.get(`${API_BASE}Supervisor/TempServices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only services related to current booking
      const temp = Array.isArray(res.data)
        ? res.data.filter((item) => item.BookingID == bookingId)
        : [];

      setPreviewServices(
        temp.map((item) => ({
          id: item.AddOnID,
          name: item.ServiceName,
          price: item.ServicePrice,
          description: item.Description,
          gstPercent: item.GSTPercent,
          gstAmount: item.GSTPrice,
          totalAmount: item.TotalPrice,
          bodyPart: item.Type,
        })),
      );

      console.log("Fetched Temp Services:", temp);
    } catch (error) {
      console.error("Failed to load temp services", error);
    }
  };

  const handleDeleteTempService = async (id) => {
    if (!id) return;

    Swal.fire({
      title: "Are you sure?",
      text: "This service will be removed!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${API_BASE}Supervisor/TempAddOnService?addOnId=${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          // Remove from UI
          setPreviewServices((prev) => prev.filter((s) => s.id !== id));

          Swal.fire("Deleted!", "Service removed successfully", "success");
        } catch (error) {
          console.error(error);
          Swal.fire("Error", "Failed to delete service", "error");
        }
      }
    });
  };

  const dealer = localStorage.getItem("role") || "Admin";

  const handleServiceCompleted = async (addon) => {
    const addOnID = addon?.AddOnID ?? addon?.addOnID;
    if (!addOnID) {
      Swal.fire("Error", "AddOn ID not found", "error");
      return;
    }
    const confirmResult = await Swal.fire({
      title: "Mark as Completed?",
      text: "This will set the service status to Completed.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Complete",
      cancelButtonText: "Cancel",
    });
    if (!confirmResult.isConfirmed) return;
    try {
      const payload = {
        addOnID: addOnID,
        is_Completed: true,
        completedBy: parseInt(localStorage.getItem("userId")) || 0,
        completedRole: dealer,
        statusName: "ServiceCompleted",
      };
      const response = await axios.put(
        `${API_BASE}Supervisor/UpdateAddOnCompletion`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 200 || response.status === 201) {
        Swal.fire("Success!", "Service marked as completed.", "success");
        await fetchBookingData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update service completion",
        "error",
      );
    }
  };

  const handleAddOnStatusChange = async (addon, selectedStatus) => {
    const addOnID = addon?.AddOnID ?? addon?.addOnID ?? addon?.Id ?? addon?.id;
    if (!addOnID) {
      Swal.fire("Error", "AddOn ID not found", "error");
      return;
    }
    try {
      const payload = {
        addOnID: addOnID,
        is_Completed: selectedStatus === "ServiceCompleted",
        completedBy: parseInt(localStorage.getItem("userId")) || 0,
        completedRole: dealer,
        statusName: selectedStatus,
      };
      const response = await axios.put(
        `${API_BASE}Supervisor/UpdateAddOnCompletion`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 200 || response.status === 201) {
        Swal.fire("Success!", "Status updated successfully.", "success");
        await fetchBookingData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update status",
        "error",
      );
    }
  };

  const handleFinalSubmitToMain = async () => {
    if (!previewServices.length) {
      Swal.fire("Error", "No services to submit!", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}Supervisor/MoveTempAddOns?bookingId=${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        Swal.fire("Success", "Services saved successfully!", "success");

        // Clear preview list
        setPreviewServices([]);

        // Refresh booking
        fetchBookingData();
        fetchTempServices();
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Something went wrong",
          "error",
        );
      }
    } catch (error) {
      console.error("Final Submit Error:", error);
      Swal.fire("Error", "Failed to save services", "error");
    }
  };

  const showGenerateInvoiceConfirm = (name, generateHandler, invoiceType) => {
    // const bookingTotal =
    //   Number(bookingData?.TotalPrice || 0) +
    //   Number(bookingData?.GSTAmount || 0) +
    //   Number(bookingData?.LabourCharges || 0) -
    //   Number(bookingData?.CouponAmount || 0);
    // if (bookingTotal <= 0) {
    //   Swal.fire("Error", "Please check amount.", "error");
    //   return;
    // }
    Swal.fire({
      title: name,
      html: "Do you want to <strong>generate a new invoice</strong> or <strong>view the existing invoice</strong>?",
      icon: "question",
      showDenyButton: true,
      confirmButtonText: "Yes, generate new invoice",
      denyButtonText: "View invoice",
    }).then((result) => {
      if (result.isConfirmed) {
        generateHandler();
      } else if (result.isDenied) {
        const typeParam = invoiceType ? `?type=${encodeURIComponent(invoiceType)}` : "";
        navigate(`/invoice-view/${bookingData.BookingID}${typeParam}`);
      }
    });
  };

  const handleGenerateFinalInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}Leads/GenerateFinalInvoice`,
        {
          bookingID: bookingData.BookingID,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire(
        "Success",
        res.data?.message || "Final Invoice generated successfully.",
        "success",
      );
      navigate(`/invoice-view/${bookingData.BookingID}?type=Final`);
    } catch (error) {
      console.error("Generate Invoice Error:", error);

      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to generate Final invoice.",
        "error",
      );
    }
  };
  const handleGenerateEstimationInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}Leads/GenerateEstimationInvoice`,
        {
          bookingID: bookingData.BookingID,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire(
        "Success",
        res.data?.message || "Estimation Invoice generated successfully.",
        "success",
      );
      navigate(`/invoice-view/${bookingData.BookingID}`);
    } catch (error) {
      console.error("Generate Invoice Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message ||
        "Failed to generate Estimation invoice.",
        "error",
      );
    }
  };

  const handleGenerateDealerInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }
    const dealerID = bookingData?.BookingAddOns?.find(
      (addon) => addon?.DealerID,
    )?.DealerID;

    if (!dealerID) {
      Swal.fire("Error", "Dealer ID not found.", "error");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}Dealer/GenerateDealerInvoice`,
        {
          bookingID: bookingData.BookingID,
          dealerID: dealerID,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire(
        "Success",
        res.data?.message || "Dealer Invoice generated successfully.",
        "success",
      );
      // change route if dealer invoice has different view
      navigate(`/invoice-view/${bookingData.BookingID}?type=Dealer`);
    } catch (error) {
      console.error("Generate Dealer Invoice Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to generate Dealer invoice.",
        "error",
      );
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentTypeChoice(null);
    setPaymentMode("");
    setPayAmount("");
    setIsDiscountApplicable(false);
    setDiscountAmount("");
  };

  const handleCustomerConfirmation = () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }

    const hasDealerId = (item) => {
      const id = item?.DealerID;
      return id != null && id !== "" && Number(id) !== 0;
    };

    const addOnsWithoutDealer = (bookingData?.BookingAddOns || []).filter(
      (item) => !hasDealerId(item),
    );
    const supervisorBookingsWithoutDealer = (
      bookingData?.SupervisorBookings || []
    ).filter((item) => !hasDealerId(item));

    const missingDealer = [...addOnsWithoutDealer, ...supervisorBookingsWithoutDealer];
    if (missingDealer.length > 0) {
      const names = missingDealer
        .map((item) => item?.ServiceName || item?.Description || "Service")
        .filter(Boolean);
      Swal.fire({
        icon: "error",
        title: "Dealer required",
        html: `Please select a dealer for all services before confirmation.<br/><br/><strong>Missing dealer for:</strong><br/>${names.join("<br/>")}`,
      });
      return;
    }

    const isSupervisorConfirmed = (item) =>
      item?.IsSupervisor_Confirm === 1 ||
      item?.IsSupervisor_Confirm === true;

    const addOnsNotConfirmed = (bookingData?.BookingAddOns || []).filter(
      (item) => !isSupervisorConfirmed(item),
    );
    const supervisorBookingsNotConfirmed = (
      bookingData?.SupervisorBookings || []
    ).filter((item) => !isSupervisorConfirmed(item));

    const missingConfirm = [...addOnsNotConfirmed, ...supervisorBookingsNotConfirmed];
    if (missingConfirm.length > 0) {
      const names = missingConfirm
        .map((item) => item?.ServiceName || item?.Description || "Service")
        .filter(Boolean);
      Swal.fire({
        icon: "error",
        title: "Supervisor confirmation required",
        html: `All services must be confirmed by supervisor before customer confirmation.<br/><br/><strong>Pending supervisor confirmation for:</strong><br/>${names.join("<br/>")}`,
      });
      return;
    }

    // Open the confirmation modal
    setConfirmationDescription("");
    setShowCustomerConfirmationModal(true);
  };

  const handleCustomerConfirmationSubmit = async () => {
    if (!confirmationDescription || confirmationDescription.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Description Required",
        text: "Please provide a description for the confirmation.",
      });
      return;
    }

    try {
      await axios.post(
        `${API_BASE}Supervisor/MoveSupervisorBookings?bookingId=${bookingData.BookingID}`,
        {
          confirmDescription: confirmationDescription.trim(),
          confirmedBy: roleIdInt.confirmedBy,
          confirmRole: roleName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire("Success", "Customer confirmation completed successfully.", "success");
      setShowCustomerConfirmationModal(false);
      setConfirmationDescription("");
      fetchBookingData();
    } catch (error) {
      console.error("Customer Confirmation Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to complete customer confirmation.",
        "error",
      );
    }
  };

  const totalAmount =
    (bookingData?.TotalPrice || 0) +
    (bookingData?.GSTAmount || 0) +
    (bookingData?.LabourCharges || 0) -
    (bookingData?.CouponAmount || 0);

  // const alreadyPaid = bookingData?.PaidAmount || 0;
  const alreadyPaid = (bookingData?.Payments || [])
    // .filter(
    //   (payment) => payment.PaymentStatus === "Success" || payment.PaymentStatus === "Partialpaid" && !payment.IsRefunded
    // )
    .filter(
      (payment) =>
        (payment.PaymentStatus === "Success" ||
          payment.PaymentStatus === "Partialpaid") &&
        !payment.IsRefunded,
    )
    .reduce((sum, payment) => {
      return sum + Number(payment.AmountPaid || 0);
    }, 0);
  const remainingAmount = Math.max(totalAmount - alreadyPaid, 0);

  const hasAtLeastOneService =
    (bookingData?.BookingAddOns?.length > 0) ||
    (bookingData?.SupervisorBookings?.length > 0);
  const isSupervisorConfirmed = (item) =>
    item?.IsSupervisor_Confirm === 1 || item?.IsSupervisor_Confirm === true;
  const allSupervisorConfirmed =
    hasAtLeastOneService &&
    (bookingData?.BookingAddOns || []).every(isSupervisorConfirmed) &&
    (bookingData?.SupervisorBookings || []).every(isSupervisorConfirmed);
  const showEstimationButton = allSupervisorConfirmed;
  const showFinalButton = remainingAmount === 0 && hasAtLeastOneService && allSupervisorConfirmed && totalAmount > 0;
  const showEnterPaymentButton = remainingAmount > 0 && hasAtLeastOneService && allSupervisorConfirmed && totalAmount > 0;
  const showDealerInvoiceButton = hasAtLeastOneService && allSupervisorConfirmed && totalAmount > 0;
  const confirmationData = bookingData?.BookingAddOns?.find(
    (item) => item?.ConfirmedBy && item?.ConfirmRole && item?.ConfirmDescription
  );

  const handleConfirmPayment = async () => {
    try {
      const isOnline = paymentTypeChoice === "online";
      if (!isOnline && !paymentMode) {
        Swal.fire("Validation", "Please select payment mode", "warning");
        return;
      }

      if (!payAmount || payAmount <= 0) {
        Swal.fire("Validation", "Enter valid amount", "warning");
        return;
      }

      if (Number(discountAmount || 0) > Number(payAmount || 0)) {
        Swal.fire("Validation", "Discount cannot exceed entered amount", "warning");
        return;
      }

      if (payAmount > remainingAmount) {
        Swal.fire(
          "Validation",
          "Amount cannot exceed remaining balance",
          "warning",
        );
        return;
      }

      const finalAmount = Number(payAmount || 0) - Number(discountAmount || 0);

      if (finalAmount <= 0) {
        Swal.fire(
          "Validation",
          "Final payable amount must be greater than zero",
          "warning",
        );
        return;
      }

      // ✅ NEW PAYLOAD
      const payload = {
        bookingID: bookingData.BookingID,
        amountPaid: finalAmount,
        paymentMode: isOnline ? "Online" : paymentMode,
        paymentStatus: "Success",
        paymentType: "Static",
        createdBy: userId,
      };

      const res = await axios.post(
        `${API_BASE}Payments/InsertBookingAddOnsPayment`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res?.data?.status) {
        Swal.fire("Success", "Payment confirmed successfully", "success");
        setShowPaymentModal(false);
        setIsPaid(true);
        fetchBookingData(); // refresh booking & payments
      } else {
        Swal.fire("Error", "Payment confirmation failed", "error");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  const handleSubmitPickupDetails = async () => {
    if (!pickupDate || !pickupTime || !dropDate || !dropTime) {
      Swal.fire(
        "Validation",
        "Please fill all pickup and drop details",
        "warning",
      );
      return;
    }

    const payload = {
      bookingID: bookingData.BookingID,
      leadId: bookingData.LeadId,
      pickupDate,
      pickupTime: pickupTime + ":00",
      deliveryDate: dropDate,
      deliveryTime: dropTime + ":00",
    };

    try {
      const res = await axios.post(
        `${API_BASE}Supervisor/SavePickupDeliveryTime`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success || res.status === 200) {
        Swal.fire(
          "Success",
          "Pickup and Drop details saved successfully!",
          "success",
        );
        // Reset form
        setPickupDate("");
        setPickupTime("");
        setDropDate("");
        setDropTime("");
        fetchBookingData(); // Refresh booking data
      } else {
        Swal.fire(
          "Error",
          res.data.message || "Failed to save details",
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving pickup details:", error);
      Swal.fire("Error", "Failed to save pickup and delivery details", "error");
    }
  };

  const isPastTimeToday = (selectedTime) => {
    const now = new Date();
    const [h, m] = selectedTime.split(":");
    const selected = new Date();
    selected.setHours(h, m, 0, 0);

    return selected < now;
  };
  const displayDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <style>{`
        .btn-press-effect {
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, opacity 0.15s ease;
        }
        .btn-press-effect:active {
          transform: scale(0.96);
        }
        .btn-press-effect:hover:active {
          transform: translateY(-1px) scale(0.96);
        }
        .btn-close-press:active {
          transform: scale(0.88);
          opacity: 0.8;
        }
        .btn-close-press {
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
      `}</style>
      <div className="row gy-4 mt-3">
        {/* Right Tabs Content */}
        <div className="col-lg-12">
          <div className="card h-100">
            <div className="card-body p-24">
              {bookingData ? (
                <div className="row g-4">
                  {/* ================= LEFT SIDE: PERSONAL INFORMATION ================= */}
                  <div className="col-lg-8 col-md-12">
                    <Accordion className="mb-3">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          <h6 className="mb-2 fw-bold text-primary">
                            👤 Personal Information
                          </h6>
                        </Accordion.Header>

                        <Accordion.Body>
                          <div className="row g-4 align-items-start">
                            {/* ================= IMAGE ================= */}
                            <div className="col-lg-3 col-md-4 col-12 text-center">
                              <div className="pb-3">
                                {bookingData.ProfileImage ? (
                                  <img
                                    src={`${API_IMAGE}${bookingData.ProfileImage}`}
                                    alt="User"
                                    className="border br-white border-width-2-px w-120-px h-120-px rounded-circle object-fit-cover"
                                  />
                                ) : (
                                  <img
                                    src="/assets/images/user-grid/user-grid-img14.png"
                                    alt="Default User"
                                    className="border br-white border-width-2-px w-120-px h-120-px rounded-circle object-fit-cover"
                                  />
                                )}
                              </div>
                            </div>

                            {/* ================= PERSONAL INFO ================= */}
                            <div className="col-lg-9 col-md-8 col-12">
                              <ul className="mb-0">
                                <li className="d-flex align-items-center gap-1">
                                  <span className=" w-50 fw-semibold text-primary-light">
                                    Customer Name :
                                  </span>
                                  <span className="w-50 text-secondary-light fw-bold">
                                    {bookingData.CustomerName || "N/A"}
                                  </span>
                                </li>

                                <li className="d-flex align-items-center gap-1">
                                  <span className=" w-50 fw-semibold text-primary-light">
                                    Phone Number :
                                  </span>
                                  <span className="w-50 text-secondary-light fw-bold">
                                    {bookingData.PhoneNumber || "N/A"}
                                  </span>
                                </li>
                                <li className="d-flex align-items-center gap-1">
                                  <span className=" w-50 fw-semibold text-primary-light">
                                    Full Address :
                                  </span>
                                  <span className="w-50 text-secondary-light fw-bold">
                                    {bookingData.FullAddress || "N/A"}
                                  </span>
                                </li>
                                <>
                                  {/* {bookingData.TechFullName && ( */}
                                  <>
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-50 fw-semibold text-primary-light">
                                        Technician Name/Number :
                                      </span>
                                      <span className="w-50 text-secondary-light fw-bold">
                                        {bookingData?.TechFullName || bookingData?.TechPhoneNumber ? (
                                          <>
                                            {bookingData?.TechFullName || ""}
                                            {bookingData?.TechPhoneNumber ? ` (${bookingData.TechPhoneNumber})` : ""}
                                          </>
                                        ) : (
                                          "N/A"
                                        )}
                                      </span>
                                    </li>
                                  </>
                                  {/* {(pickupDate || dropDate) && ( */}
                                  <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Supervisor Name/Number :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {bookingData?.SupervisorName || bookingData?.SupervisorPhoneNumber ? (
                                        <>
                                          {bookingData?.SupervisorName || ""}
                                          {bookingData?.SupervisorPhoneNumber ? ` (${bookingData.SupervisorPhoneNumber})` : ""}
                                        </>
                                      ) : (
                                        "N/A"
                                      )}
                                    </span>
                                  </li>
                                  <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Field Advisor Name/Number :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {bookingData?.FieldAdvisorName || bookingData?.FieldAdvisorPhoneNumber ? (
                                        <>
                                          {bookingData?.FieldAdvisorName || ""}
                                          {bookingData?.FieldAdvisorPhoneNumber ? ` (${bookingData.FieldAdvisorPhoneNumber})` : ""}
                                        </>
                                      ) : (
                                        "N/A"
                                      )}
                                    </span>
                                  </li>
                                  <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Pickup Date & Time :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {displayDate(pickupDate)}
                                      {pickupTime && ` : ${pickupTime}`}
                                    </span>
                                  </li>

                                  <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Drop Date & Time :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {displayDate(dropDate)}
                                      {dropTime && ` : ${dropTime}`}
                                    </span>
                                  </li>
                                </>
                              </ul>
                            </div>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </div>

                  {/* ================= RIGHT SIDE: VEHICLE DETAILS ================= */}
                  <div className="col-lg-4 col-md-12">
                    <Accordion className="mb-3">
                      <Accordion.Item eventKey="1">
                        <Accordion.Header>
                          <h6 className="mb-2 fw-bold text-primary">
                            🚗 Vehicle Details
                          </h6>
                        </Accordion.Header>

                        <Accordion.Body>
                          {bookingData.VehicleDetails &&
                            Array.isArray(bookingData.VehicleDetails) &&
                            bookingData.VehicleDetails.length > 0 ? (
                            <div>
                              {bookingData.VehicleDetails.map((vehicle, index) => (
                                <div key={index} className={index > 0 ? "mt-4 pt-4 border-top" : ""}>
                                  {/* <div className="d-flex align-items-center gap-2 mb-3">
                                  <Icon 
                                    icon="mdi:car" 
                                    className="text-primary fs-5" 
                                  />
                                  <span className="fw-bold text-primary">
                                    Vehicle {bookingData.VehicleDetails.length > 1 ? `${index + 1}` : ""} Details
                                  </span>
                                </div> */}
                                  <ul className="mb-0">
                                    {/* {vehicle.RegistrationNumber && ( */}
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-70 fw-semibold text-primary-light">
                                        Reg. Number :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold ms-2">
                                        {vehicle.RegistrationNumber || "N/A"}
                                      </span>
                                    </li>
                                    {/* )} */}
                                    {/* {vehicle.BrandName && vehicle.ModelName && ( */}
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-70 fw-semibold text-primary-light">
                                        Brand :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold ms-2">
                                        {vehicle.BrandName} ({vehicle.ModelName || "N/A"})
                                      </span>
                                    </li>
                                    {/* )} */}
                                    {/* {vehicle.YearOfPurchase && ( */}
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-70 fw-semibold text-primary-light">
                                        Year of Purchase :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold ms-2">
                                        {vehicle.YearOfPurchase || "N/A"}
                                      </span>
                                    </li>
                                    {/* )} */}
                                    {/* {vehicle.FuelTypeName && ( */}
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-70 fw-semibold text-primary-light">
                                        Fuel Type :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold ms-2">
                                        {vehicle.FuelTypeName || "N/A"}
                                      </span>
                                    </li>
                                    {/* )} */}
                                    {/* {vehicle.KmDriven !== null && vehicle.KmDriven !== undefined && ( */}
                                    <li className="d-flex align-items-center gap-1">
                                      <span className="w-70 fw-semibold text-primary-light">
                                        KM Driven :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold ms-2">
                                        {vehicle.KmDriven !== null && vehicle.KmDriven !== undefined ? vehicle.KmDriven.toLocaleString() : "N/A"} km
                                      </span>
                                    </li>
                                    {/* )} */}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted py-4">
                              <Icon icon="mdi:car-off" className="fs-1 mb-2" />
                              <p className="mb-0">No vehicle details available</p>
                            </div>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </div>
                </div>
              ) : (
                <div className="pb-24 ms-16 mb-24 me-16 text-center">
                  <img
                    src="/assets/images/user-grid/user-grid-img13.png"
                    alt="Default User"
                    className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
                  />
                  <h6 className="mb-0 mt-16">Loading...</h6>
                </div>
              )}
              {/* ================= CAR PICKUP / DROP ACCORDION ================= */}
              <div className="accordion mb-3" id="carPickupDropAccordion">
                <div className="accordion-item border radius-16">
                  <h2 className="accordion-header" id="headingPickupDrop">
                    <button
                      className="accordion-button collapsed fw-semibold gap-2"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapsePickupDrop"
                      aria-expanded="false"
                      aria-controls="collapsePickupDrop"
                    >
                      <i className="bi bi-car-front-fill"></i>
                      <span className="fw-semibold text-primary">
                        Car Pickup & Drop Details
                      </span>
                    </button>
                  </h2>

                  <div
                    id="collapsePickupDrop"
                    className="accordion-collapse collapse"
                    aria-labelledby="headingPickupDrop"
                    data-bs-parent="#carPickupDropAccordion"
                  >
                    <div className="mt-3">
                      <div className="rounded-3 overflow-hidden border-0 shadow-sm" style={{ backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                        {/* Header – dark teal with BID, OTP, Payment, action */}
                        <div
                          className="px-3 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2"
                          style={{ backgroundColor: "#0d9488", color: "#fff", minHeight: "48px" }}
                        >
                          <span className="d-flex align-items-center gap-2 small fw-semibold text-white">
                            <Icon icon="mdi:clipboard-check-outline" width={20} height={20} />
                            BID : #{bookingData?.BookingTrackID || "—"}
                            <span className="opacity-90 fw-normal"> &nbsp; Date : {displayDate(bookingData?.BookingDate)}</span>
                          </span>
                        </div>
                        {/* Timeline – white body, center icons + segment connectors */}
                        <div className="p-4 position-relative" style={{ backgroundColor: "#fff" }}>
                          <div className="d-flex align-items-flex-start py-20 justify-content-between position-relative">
                            {[
                              { key: "pickup", label: "Pickup Scheduled", sub: pickupDate && pickupTime ? `${displayDate(pickupDate)} ${pickupTime}` : "22/02/2026 09:30", icon: "mdi:calendar-check", done: true },
                              { key: "picked", label: "Vehicle Picked Up", sub: "22/02/2026", icon: "mdi:car-pickup", done: true },
                              { key: "dealer", label: "At Dealer", sub: "22/02/2026", icon: "mdi:garage", done: true },
                              { key: "delivery", label: "Delivery Scheduled", sub: dropDate && dropTime ? `${displayDate(dropDate)} ${dropTime}` : "23/02/2026 18:00", icon: "mdi:calendar-clock", done: false },
                              { key: "done", label: "Completed", sub: "Pending", icon: "mdi:check-circle-outline", done: false },
                            ].map((step, idx) => (
                              <div key={step.key} className="d-flex flex-column align-items-center position-relative" style={{ flex: "1 1 0", minWidth: 0, zIndex: 2 }}>
                                {/* Segment line to the right (teal if current step done, gray otherwise) */}
                                {idx < 4 && (
                                  <div
                                    className="position-absolute d-none d-md-block"
                                    style={{
                                      top: 20,
                                      left: "calc(50% + 24px)",
                                      width: "calc(100% - 28px)",
                                      height: 3,
                                      borderRadius: 2,
                                      backgroundColor: step.done ? "#0d9488" : "#e5e7eb",
                                      zIndex: 0,
                                    }}
                                  />
                                )}
                                <div
                                  className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                                  style={{
                                    width: 44,
                                    height: 44,
                                    backgroundColor: step.done ? "#0d9488" : "#e5e7eb",
                                    color: step.done ? "#fff" : "#9ca3af",
                                    boxShadow: step.done ? "0 2px 6px rgba(13,148,136,0.35)" : "0 1px 3px rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <Icon icon={step.icon} width={22} height={22} />
                                </div>
                                <span className="small fw-bold text-center text-dark" style={{ fontSize: "12px", lineHeight: 1.25 }}>{step.label}</span>
                                <span className="small text-muted text-center mt-1" style={{ fontSize: "11px" }}>{step.sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ================= RESCHEDULE SECTION ================= */}
              {showReschedule && bookingData && (
                <div className="card border radius-16 mb-3">
                  <div className="card-body p-24">
                    <h6 className="fw-bold mb-3 text-primary">
                      Reschedule Booking
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Reschedule Date</label>
                        <input
                          type="date"
                          className="form-control py-2"
                          min={today}
                          value={newDate}
                          onChange={(e) => {
                            setNewDate(e.target.value);
                          }}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Time Slot</label>
                        <Select
                          isMulti
                          options={timeSlots
                            .filter((slot) => {
                              if (!slot.IsActive) return false;

                              if (newDate !== today) return true;

                              const now = new Date();
                              const [h, m] =
                                slot.StartTime.split(":").map(Number);

                              const slotTime = new Date();
                              slotTime.setHours(h, m, 0, 0);

                              return slotTime > now;
                            })
                            .sort((a, b) => {
                              const [aH, aM] = a.StartTime.split(":").map(Number);
                              const [bH, bM] = b.StartTime.split(":").map(Number);
                              return aH * 60 + aM - (bH * 60 + bM);
                            })
                            .map((slot) => ({
                              value: `${slot.StartTime} - ${slot.EndTime}`,
                              label: `${formatTime(
                                slot.StartTime,
                              )} - ${formatTime(slot.EndTime)}`,
                            }))}
                          value={selectedTimeSlot.map((val) => ({
                            value: val,
                            label: formatTimeSlot(val),
                          }))}
                          onChange={(selectedOptions) =>
                            setSelectedTimeSlot(
                              selectedOptions
                                ? selectedOptions.map((opt) => opt.value)
                                : [],
                            )
                          }
                          placeholder="Select time slots"
                          isDisabled={!newDate}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Reason</label>
                        <textarea
                          className="form-control"
                          rows="1"
                          placeholder="Enter reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowReschedule(false)}
                      >
                        Cancel Reschedule
                      </button>
                      <button
                        className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                        onClick={handleReschedule}
                      >
                        Submit Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary"
                onClick={handleGenerateFinalInvoice}
              >
                Final Invoice
              </button>
            </div> */}
              <ul className="nav border-gradient-tab nav-pills mb-20">
                <li className="nav-item">
                  <button
                    className="nav-link active"
                    data-bs-toggle="pill"
                    data-bs-target="#booking"
                  >
                    Bookings
                  </button>
                </li>

                {/* Push button to the end */}
                <li className="nav-item ms-auto m-1 d-flex gap-2">
                  {/* Invoice and Refund buttons */}
                  {bookingData &&
                    bookingData.Payments &&
                    bookingData.Payments[0] &&
                    (bookingData.Payments[0].FolderPath ||
                      bookingData.Payments[0].IsRefunded) && (
                      <div className="d-flex gap-2">
                        {/* {bookingData.Payments[0].FolderPath && (
                        <a
                          href={bookingData.Payments[0].FolderPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-warning btn-sm"
                        >
                          Invoice
                        </a>
                      )} */}

                        {bookingData.Payments[0].IsRefunded && (
                          <button
                            onClick={() => handleRefund(bookingData.Payments[0])}
                            className="btn btn-danger btn-sm"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    )}
                  <Link
                    to={`/lead-view/${bookingData?.LeadId}`}
                    className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                    title="View"
                  >
                    View Lead
                  </Link>

                  {/* Reschedule & Reassign Buttons */}
                  {bookingData &&
                    !["Completed", "Cancelled", "Refunded"].includes(
                      bookingData.BookingStatus,
                    ) && (
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                          onClick={handleCustomerConfirmation}
                        >
                          Customer Confirmation
                        </button>
                        <button
                          className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                          onClick={() => setShowReschedule(!showReschedule)}
                        >
                          Reschedule
                        </button>

                        {/* BUTTON 1 — your current condition, but ONLY when roleId !== "8" */}
                        {roleId !== "8" &&
                          (bookingData.TechID || bookingData.SupervisorID) && (
                            <button
                              className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                              onClick={() => handleAssignClick()}
                            >
                              Reassign
                            </button>
                          )}

                        {/* BUTTON 2 — only for roleId = "8" AND TechID available */}
                        {roleId === "8" && bookingData.TechID && (
                          <button
                            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                            onClick={() => handleAssignClick()}
                          >
                            Reassign
                          </button>
                        )}
                      </div>
                    )}
                  {!(
                    bookingData?.BookingStatus === "Completed" &&
                    bookingData?.Payments?.length > 0 &&
                    bookingData?.Payments?.[bookingData.Payments.length - 1]
                      ?.PaymentStatus === "Success"
                  ) && (
                      <Link
                        to={`/book-service/${bookingData?.LeadId}/${bookingData?.BookingID}/${bookingData?.BookingTrackID}`}
                        className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                        title="Add"
                      >
                        Add / Edit Services
                      </Link>
                    )}


                </li>

                {/* {bookingData &&
                bookingData.BookingStatus !== "Cancelled" &&
                bookingData.BookingStatus !== "Failed" &&
                bookingData.BookingStatus !== "Completed" && (
                  <li className="nav-item">
                    <button
                      className="nav-link"
                      data-bs-toggle="pill"
                      data-bs-target="#addservice"
                    >
                      Add Service
                    </button>
                  </li>
                )} */}
                {/* You might want a payment tab here to view past payments */}
                {/* <li className='nav-item'><button className='nav-link' data-bs-toggle='pill' data-bs-target='#payment'>Payments</button></li> */}
              </ul>

              <div className="tab-content">
                {/* ====================== BOOKINGS TAB ====================== */}
                <div className="tab-pane fade show active" id="booking">
                  {bookingData ? (
                    <Accordion
                      defaultActiveKey="0"
                      className="styled-booking-accordion"
                    >
                      <Accordion.Item
                        eventKey="0"
                        key={bookingData.BookingID}
                        className="mb-3 shadow-sm rounded-3 border border-light"
                      >
                        <Accordion.Header>
                          <div className="d-flex flex-column w-100">
                            <div className="d-flex justify-content-between align-items-center w-100">
                              <div className="d-flex align-items-center gap-3">
                                <Icon
                                  icon="mdi:calendar-check"
                                  className="text-primary fs-4"
                                />
                                <div>
                                  <h6 className="mb-0 text-dark fw-bold">
                                    Booking #{bookingData.BookingTrackID}
                                  </h6>
                                  <small className="text-muted">
                                    Scheduled: {bookingData.BookingDate} (
                                    {bookingData.TimeSlot})
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="ms-2 small">Payment Status:</span>
                                {(() => {
                                  const payments = bookingData?.Payments;

                                  let label = "Pending";
                                  let badgeClass = "bg-warning text-dark";

                                  if (payments?.length > 0) {
                                    const lastPayment =
                                      payments[payments.length - 1];
                                    const status = lastPayment?.PaymentStatus;

                                    if (status === "Success") {
                                      label = "Paid";
                                      badgeClass = "bg-success";
                                    } else if (status === "Partialpaid") {
                                      label = "Partial Paid";
                                      badgeClass = "bg-primary";
                                    }
                                  }
                                  return (
                                    <span className="fw-semibold d-flex align-items-center">
                                      <span
                                        className={`badge px-3 py-1 rounded-pill ${badgeClass}`}
                                      >
                                        {label}
                                      </span>
                                    </span>
                                  );
                                })()}

                                <span className="ms-2 small">Booking Status:</span>
                                <span
                                  className={`badge px-3 py-1 rounded-pill ${bookingData.BookingStatus === "Completed"
                                    ? "bg-success"
                                    : bookingData.BookingStatus === "Confirmed"
                                      ? "bg-primary"
                                      : "bg-warning text-dark"
                                    }`}
                                >
                                  {bookingData.BookingStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Accordion.Header>

                        <Accordion.Body className="bg-white">
                          <div className="container-fluid">
                            {/* ============= Packages Section ============= */}
                            {bookingData?.Packages?.length > 0 && (
                              <Accordion defaultActiveKey="pkg1" className="mb-4">
                                <Accordion.Item eventKey="pkg1">
                                  <Accordion.Header>
                                    <h6 className="text-success fw-bold mb-0">
                                      📦 Packages
                                    </h6>
                                  </Accordion.Header>

                                  <Accordion.Body>
                                    <div
                                      className="overflow-auto"
                                      style={{
                                        maxHeight: "300px",
                                        paddingRight: "3px",
                                      }}
                                    >
                                      <ul className="list-group list-group-flush">
                                        {bookingData.Packages.map(
                                          (pkg, index) => (
                                            <li
                                              key={pkg.PackageID || index}
                                              className="list-group-item border rounded-3 shadow-sm mb-2 bg-light"
                                            >
                                              <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                  <strong className="text-dark">
                                                    {pkg.PackageName}
                                                  </strong>
                                                  {pkg.Category
                                                    ?.SubCategories?.[0]?.Includes
                                                    ?.length > 0 && (
                                                      <ul className="text-muted small ps-3 mb-0">
                                                        {pkg.Category.SubCategories[0].Includes.map(
                                                          (inc) => (
                                                            <li key={inc.IncludeID}>
                                                              {inc.IncludeName}
                                                            </li>
                                                          ),
                                                        )}
                                                      </ul>
                                                    )}
                                                </div>

                                                <span className="badge bg-success-subtle text-success border border-success">
                                                  ⏱ Duration:{" "}
                                                  {pkg.EstimatedDurationMinutes >=
                                                    60
                                                    ? (() => {
                                                      const hours = Math.floor(
                                                        pkg.EstimatedDurationMinutes /
                                                        60,
                                                      );
                                                      const minutes =
                                                        pkg.EstimatedDurationMinutes %
                                                        60;
                                                      return minutes === 0
                                                        ? `${hours} hr`
                                                        : `${hours} hr ${minutes} mins`;
                                                    })()
                                                    : `${pkg.EstimatedDurationMinutes} mins`}
                                                </span>
                                              </div>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                              </Accordion>
                            )}

                            {/* ============= Additional Services ============= */}
                            {bookingData?.AddonServices?.length > 0 && (
                              <Accordion defaultActiveKey="1" className="mb-4">
                                <Accordion.Item eventKey="1">
                                  <Accordion.Header>
                                    <h6 className="text-primary fw-bold mb-0">
                                      🛠️ Additional Services
                                    </h6>
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <div
                                      className="overflow-auto"
                                      style={{ maxHeight: "300px" }}
                                    >
                                      <ul className="list-group list-group-flush">
                                        {bookingData.AddonServices.map(
                                          (addon, index) => (
                                            <li
                                              key={index}
                                              className="list-group-item d-flex justify-content-between align-items-center flex-wrap"
                                            >
                                              <div>
                                                <strong className="text-dark">
                                                  {addon.ServiceName}
                                                </strong>
                                                {addon.Description && (
                                                  <p className="mb-0 text-muted small">
                                                    {addon.Description}
                                                  </p>
                                                )}
                                              </div>
                                              <span className="badge bg-secondary rounded-pill">
                                                ₹
                                                {Number(
                                                  addon.ServicePrice,
                                                ).toFixed(2)}
                                              </span>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                              </Accordion>
                            )}

                            {bookingData?.BookingAddOns?.length > 0 && (
                              <div className="card mb-4 mt-4">
                                <div className="card-header bg-success">
                                  <h6 className="mb-0 fw-bold text-white">Customer Confirmed Services</h6>
                                </div>
                                <div className="card-body p-0">
                                  <div
                                    className="table-responsive"
                                    style={{
                                      maxHeight: "800px",
                                      overflowX: "auto",
                                    }}
                                  >
                                    <table
                                      className="table table-sm table-striped table-hover align-middle mb-0"
                                      style={{
                                        tableLayout: "fixed",
                                        minWidth: "1200px",
                                      }}
                                    >
                                      <thead
                                        className="table-light sticky-top position-relative"
                                        style={{ zIndex: 1 }}
                                      >
                                        <tr>
                                          <th
                                            style={{ width: "60px" }}
                                            className="text-center"
                                          >
                                            S.No
                                          </th>
                                          <th style={{ width: "100px" }}>Type</th>
                                          <th style={{ width: "180px" }}>
                                            Service Name
                                          </th>
                                          <th style={{ width: "100px" }}>Date</th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Part Price
                                          </th>
                                          <th
                                            style={{ width: "125px" }}
                                            className="text-end"
                                          >
                                            DLR Part Price
                                          </th>
                                          <th
                                            style={{ width: "70px" }}
                                            className="text-end"
                                          >
                                            Qty
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Part Total
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR Part Total
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            Service Chg.
                                          </th>
                                          <th
                                            style={{ width: "145px" }}
                                            className="text-end"
                                          >
                                            DLR Service Chg.
                                          </th>
                                          <th
                                            style={{ width: "90px" }}
                                            className="text-end"
                                          >
                                            GST %
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR GST %
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            GST Amt.
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR GST Amt.
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Our %
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Our Amt.
                                          </th>
                                          <th style={{ width: "180px" }}
                                            className="text-center">
                                            Selected Dealer
                                          </th>
                                          <th style={{ width: "180px" }}
                                            className="text-center">
                                            Confirm Service
                                          </th>
                                          <th
                                            style={{ width: "160px" }}
                                            className="text-center"
                                          >
                                            Dlr. Service Status
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Total Amt
                                          </th>

                                        </tr>
                                      </thead>

                                      <tbody>
                                        {bookingData.BookingAddOns.map(
                                          (addon, index) => (
                                            <tr key={addon.AddOnID || index}>
                                              <td className="text-center">
                                                {index + 1}.
                                              </td>
                                              <td className="normal">
                                                {addon.ServiceType || "—"}
                                              </td>
                                              <td className="normal">
                                                <div className="normal">
                                                  {/* <strong > */}
                                                  {addon.ServiceName || "—"}
                                                  {/* </strong> */}
                                                  {addon.Includes &&
                                                    Array.isArray(
                                                      addon.Includes,
                                                    ) &&
                                                    addon.Includes.length > 0 && (
                                                      <ul className="text-muted small ps-3 mb-0 mt-2">
                                                        {addon.Includes.map(
                                                          (inc) => (
                                                            <li
                                                              key={
                                                                inc.IncludeID ||
                                                                inc.id
                                                              }
                                                            >
                                                              {inc.IncludeName ||
                                                                inc.name}
                                                            </li>
                                                          ),
                                                        )}
                                                      </ul>
                                                    )}
                                                </div>
                                              </td>

                                              <td className="normal">
                                                {addon.CreatedDate
                                                  ? new Date(
                                                    addon.CreatedDate,
                                                  ).toLocaleDateString("en-IN")
                                                  : "—"}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.BasePrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.DealerBasePrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {addon.Quantity ?? "1"}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.ServicePrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.DealerSparePrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.LabourCharges || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.DealerPrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {addon.GSTPercent ?? 0}%
                                              </td>
                                              <td className="text-end">
                                                {addon.DealerGSTPercent ?? 0}%
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.GSTPrice || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.DealerGSTAmount || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td className="text-end">
                                                {addon.Percentage ?? "0"}%
                                              </td>
                                              <td className="text-end">
                                                {Number(
                                                  addon.Our_Earnings || 0,
                                                ).toFixed(2)}
                                              </td>
                                              <td
                                                className=" normal text-center"
                                                style={{
                                                  whiteSpace: "normal",
                                                  wordBreak: "break-word",
                                                }}
                                              >
                                                {addon.DealerName || "—"}
                                              </td>
                                              <td
                                                className=" normal text-center"
                                                style={{
                                                  whiteSpace: "normal",
                                                  wordBreak: "break-word",
                                                }}
                                                title={addon.ConfirmDescription || ""}
                                              >
                                                {addon.ConfirmRole || "—"}
                                              </td>
                                              <td className="text-center align-middle">
                                                {(() => {
                                                  const isApproved =
                                                    (addon.IsDealer_Confirm ?? addon.isDealer_Confirm)
                                                      ?.toString()
                                                      .trim()
                                                      .toLowerCase() === "approved";
                                                  const status = (addon.StatusName ?? addon.statusName ?? addon.AddOnStatus ?? addon.addOnStatus)
                                                    ?.toString()
                                                    .trim();
                                                  return (
                                                    <div className="d-flex gap-2 align-items-center justify-content-center">
                                                      {isApproved && (
                                                        <select
                                                          className="form-select form-select-sm"
                                                          value={status}
                                                          onChange={(e) =>
                                                            handleAddOnStatusChange(addon, e.target.value)
                                                          }
                                                        >
                                                          <option value="">Select Status</option>
                                                          <option value="Pending">Pending</option>
                                                          <option value="ServiceCompleted">Completed</option>
                                                          <option value="Rework">Rework</option>
                                                          <option value="InProgress">In-Progress</option>
                                                        </select>
                                                      ) || (
                                                          <span className="badge bg-warning text-dark px-3 py-4 rounded-pill">
                                                            Dealer Pending
                                                          </span>
                                                        )}
                                                    </div>
                                                  );
                                                })()}
                                              </td>
                                              <td className="text-end fw-bold text-primary">
                                                {Number(
                                                  addon.TotalPrice || 0,
                                                ).toFixed(2)}
                                              </td>

                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bookingData?.SupervisorBookings?.length > 0 && (
                              <div className="card mb-4 mt-4">
                                <div className="card-header bg-warning text-dark">
                                  <h6 className="mb-0 fw-bold">Customer Not Confirmed Services</h6>
                                </div>
                                <div className="card-body p-0">
                                  <div
                                    className="table-responsive"
                                    style={{
                                      maxHeight: "800px",
                                      overflowX: "auto",
                                    }}
                                  >
                                    <table
                                      className="table table-sm table-striped table-hover align-middle mb-0"
                                      style={{
                                        tableLayout: "fixed",
                                        minWidth: "1200px",
                                      }}
                                    >
                                      <thead
                                        className="table-light sticky-top position-relative"
                                        style={{ zIndex: 1 }}
                                      >
                                        <tr>
                                          <th
                                            style={{ width: "60px" }}
                                            className="text-center"
                                          >
                                            S.No
                                          </th>
                                          <th style={{ width: "100px" }}>Type</th>
                                          <th style={{ width: "180px" }}>
                                            Service Name
                                          </th>
                                          <th style={{ width: "100px" }}>Date</th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Part Price
                                          </th>
                                          <th
                                            style={{ width: "125px" }}
                                            className="text-end"
                                          >
                                            DLR Part Price
                                          </th>
                                          <th
                                            style={{ width: "70px" }}
                                            className="text-end"
                                          >
                                            Qty
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Part Total
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR Part Total
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            Service Chg.
                                          </th>
                                          <th
                                            style={{ width: "145px" }}
                                            className="text-end"
                                          >
                                            DLR Service Chg.
                                          </th>
                                          <th
                                            style={{ width: "90px" }}
                                            className="text-end"
                                          >
                                            GST %
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR GST %
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            GST Amt.
                                          </th>
                                          <th
                                            style={{ width: "120px" }}
                                            className="text-end"
                                          >
                                            DLR GST Amt.
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Our %
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Our Amt.
                                          </th>
                                          <th style={{ width: "200px" }}
                                            className="text-center">
                                            Selected Dealer
                                          </th>
                                          <th
                                            style={{ width: "160px" }}
                                            className="text-center"
                                          >
                                            Service Status
                                          </th>
                                          <th
                                            style={{ width: "100px" }}
                                            className="text-end"
                                          >
                                            Total Amt
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {bookingData.SupervisorBookings.map(
                                          (supervisorBooking, index) => {
                                            const totalPrice =
                                              (Number(supervisorBooking.Price || 0)) +
                                              (Number(supervisorBooking.GSTAmount || 0)) +
                                              (Number(supervisorBooking.LabourCharges || 0));

                                            return (
                                              <tr key={supervisorBooking.Id || index}>
                                                <td className="text-center">
                                                  {index + 1}.
                                                </td>
                                                <td className="normal">
                                                  {supervisorBooking.ServiceType || "—"}
                                                </td>
                                                <td className="normal">
                                                  <div className="normal">
                                                    {supervisorBooking.ServiceName || "—"}
                                                    {supervisorBooking.Includes &&
                                                      (Array.isArray(supervisorBooking.Includes)
                                                        ? supervisorBooking.Includes.length > 0 && (
                                                          <ul className="text-muted small ps-3 mb-0 mt-2">
                                                            {supervisorBooking.Includes.map(
                                                              (inc) => (
                                                                <li
                                                                  key={
                                                                    inc.IncludeID ||
                                                                    inc.id ||
                                                                    inc
                                                                  }
                                                                >
                                                                  {inc.IncludeName ||
                                                                    inc.name ||
                                                                    inc}
                                                                </li>
                                                              ),
                                                            )}
                                                          </ul>
                                                        )
                                                        : typeof supervisorBooking.Includes === 'string' && supervisorBooking.Includes.trim() !== '' && (
                                                          <div className="text-muted small mt-2">
                                                            {supervisorBooking.Includes}
                                                          </div>
                                                        )
                                                      )}
                                                  </div>
                                                </td>

                                                <td className="normal">
                                                  {supervisorBooking.CreatedDate
                                                    ? new Date(
                                                      supervisorBooking.CreatedDate,
                                                    ).toLocaleDateString("en-IN")
                                                    : "—"}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.BasePrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.DealerBasePrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {supervisorBooking.Quantity ?? "1"}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.Price || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.DealerSparePrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.LabourCharges || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.DealerPrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {supervisorBooking.GSTPercent ?? 0}%
                                                </td>
                                                <td className="text-end">
                                                  {supervisorBooking.DealerGSTPercent ?? 0}%
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.GSTAmount || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.DealerGSTAmount || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {supervisorBooking.Percentage ?? "0"}%
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    supervisorBooking.Our_Earnings || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td
                                                  className="normal text-center"
                                                  style={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                  }}
                                                >
                                                  {supervisorBooking.DealerName || "—"}
                                                </td>
                                                <td className="text-center align-middle">
                                                  {(() => {
                                                    const isApproved =
                                                      (supervisorBooking.IsDealer_Confirm ?? supervisorBooking.isDealer_Confirm)
                                                        ?.toString()
                                                        .trim()
                                                        .toLowerCase() === "approved";
                                                    const status = (supervisorBooking.StatusName ?? supervisorBooking.statusName ?? supervisorBooking.AddOnStatus ?? supervisorBooking.addOnStatus)
                                                      ?.toString()
                                                      .trim();
                                                    return (
                                                      <div className="d-flex gap-2 align-items-center justify-content-center">
                                                        {isApproved && (
                                                          <select
                                                            className="form-select form-select-sm"
                                                            value={status}
                                                            onChange={(e) =>
                                                              handleAddOnStatusChange(supervisorBooking, e.target.value)
                                                            }
                                                          >
                                                            <option value="">Select Status</option>
                                                            <option value="Pending">Pending</option>
                                                            <option value="ServiceCompleted">Completed</option>
                                                            <option value="Rework">Rework</option>
                                                            <option value="InProgress">In-Progress</option>
                                                          </select>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
                                                </td>
                                                <td className="text-end fw-bold text-primary">
                                                  {totalPrice.toFixed(2)}
                                                </td>
                                              </tr>
                                            );
                                          },
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                            <h6 className="fw-bold mb-0">Billing Summary</h6>
                          </div> */}
                            {bookingData ? (
                              <>
                                <ul className="list-group list-group-flush ">
                                  <li className="list-group-item d-flex justify-content-between p-0">
                                    <span className="text-secondary">
                                      Parts Subtotal
                                    </span>
                                    <span>
                                      ₹
                                      {Number(
                                        bookingData.TotalPrice || 0,
                                      ).toFixed(2)}
                                    </span>
                                  </li>
                                  <li className="list-group-item d-flex justify-content-between p-0">
                                    <span className="text-secondary">
                                      Service Charges
                                    </span>
                                    <span>
                                      ₹
                                      {Number(
                                        bookingData.LabourCharges || 0,
                                      ).toFixed(2)}
                                    </span>
                                  </li>
                                  {/* <li className="list-group-item d-flex justify-content-between p-0">
                                  <span className="text-secondary">
                                    GST Total
                                  </span>
                                  <span>
                                    ₹
                                    {Number(bookingData.GSTAmount || 0).toFixed(2)}
                                  </span>
                                </li> */}
                                  <li className="list-group-item d-flex justify-content-between p-0">
                                    <span className="text-secondary">SGST(9%)</span>
                                    <span>
                                      ₹
                                      {(
                                        Number(bookingData.GSTAmount || 0) / 2
                                      ).toFixed(2)}
                                    </span>
                                  </li>
                                  <li className="list-group-item d-flex justify-content-between p-0">
                                    <span className="text-secondary">CGST(9%)</span>
                                    <span>
                                      ₹
                                      {(
                                        Number(bookingData.GSTAmount || 0) / 2
                                      ).toFixed(2)}
                                    </span>
                                  </li>

                                  {bookingData.CouponAmount ? (
                                    <li className="list-group-item d-flex justify-content-between p-0">
                                      <span className="fw-semibold text-secondary">
                                        Coupon
                                      </span>
                                      <span>
                                        - ₹
                                        {Number(
                                          bookingData.CouponAmount || 0,
                                        ).toFixed(2)}
                                      </span>
                                    </li>
                                  ) : null}

                                  <li className="list-group-item d-flex justify-content-between border-top p-0">
                                    <span className="fw-bold text-dark">
                                      Total Amount
                                    </span>
                                    <span className="fw-bold text-success">
                                      ₹
                                      {Number(
                                        (bookingData.TotalPrice || 0) +
                                        (bookingData.GSTAmount || 0) +
                                        (bookingData.LabourCharges || 0) -
                                        (bookingData.CouponAmount || 0),
                                      ).toFixed(2)}
                                    </span>
                                  </li>
                                  {/* {alreadyPaid > 0 && (
                                <> */}
                                  <li className="list-group-item d-flex justify-content-between p-0">
                                    <span className="text-secondary">
                                      Already Paid
                                    </span>
                                    <span className="text-primary">
                                      - ₹{alreadyPaid.toFixed(2)}
                                    </span>
                                  </li>
                                  {bookingData?.SupervisorBookings?.length > 0 && (
                                    <li className="list-group-item d-flex justify-content-between border-top bg-warning p-0">
                                      <span className="fw-bold text-dark">
                                        Customer Not Confirmed Services Amount
                                      </span>
                                      <span className="fw-bold text-dark">
                                        ₹
                                        {Math.max(
                                          (
                                            (bookingData?.SupervisorBookings || []).reduce((total, booking) => {
                                              return (
                                                total +
                                                Number(booking?.Price || 0) +
                                                Number(booking?.GSTAmount || 0) +
                                                Number(booking?.LabourCharges || 0)
                                              );
                                            }, 0)
                                          )
                                        ).toFixed(2)}
                                      </span>
                                    </li>
                                  )}
                                  <li className="list-group-item d-flex justify-content-between border-top p-0">
                                    <span className="fw-bold text-dark">
                                      Remaining Amount
                                    </span>
                                    <span className="fw-bold text-success">
                                      ₹
                                      {Math.max(
                                        Number(
                                          (bookingData.TotalPrice || 0) +
                                          (bookingData.GSTAmount || 0) +
                                          (bookingData.LabourCharges || 0) -
                                          (bookingData.CouponAmount || 0),
                                        ) - alreadyPaid,
                                        0,
                                      ).toFixed(2)}
                                    </span>
                                  </li>
                                  {/* </>
                              )} */}
                                </ul>
                                {bookingData?.SupervisorBookings &&
                                  bookingData.SupervisorBookings.length > 0 && (
                                    <div className="alert alert-info py-2 px-3 mb-2 mb-md-3 small">
                                      There are{" "}
                                      <strong>{bookingData.SupervisorBookings.length}</strong>{" "}
                                      booking(s) that need to be confirmed by the customer.
                                    </div>
                                  )}
                                <div className="d-flex justify-content-center gap-2 mt-3 mb-3 flex-wrap">

                                  {/* Show Confirm Payment only if not paid */}
                                  {showEnterPaymentButton && (
                                    <button
                                      className="btn btn-primary-600 btn-sm"
                                      onClick={() => {
                                        setPaymentMode("");
                                        setPayAmount(remainingAmount);
                                        setShowPaymentModal(true);
                                      }}
                                    >
                                      Enter Payment
                                    </button>
                                  )}
                                  {/* Assign Button - similar to BookingLayer */}
                                  {(role === "Admin" || roleName === "Supervisor Head" || roleName === "Field Advisor") &&
                                    !(
                                      bookingData?.BookingStatus === "Completed" &&
                                      bookingData?.PaymentStatus === "Success"
                                    ) && (
                                      <button
                                        className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center"
                                        onClick={handleInitialAssignClick}
                                      >
                                        Service Assignment
                                      </button>
                                    )}
                                  {/* {showEstimationButton && ( */}
                                  <button
                                    className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                    onClick={() => showGenerateInvoiceConfirm("Generate Estimation Invoice", handleGenerateEstimationInvoice, "Estimation")}
                                  >
                                    Generate Estimation Invoice
                                  </button>
                                  {/* )} */}

                                  {/* Final Invoice: show only after full payment is completed */}
                                  {showFinalButton && (
                                    <button
                                      className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                      onClick={() => showGenerateInvoiceConfirm("Generate Final Invoice", handleGenerateFinalInvoice, "Final")}
                                    >
                                      Generate Final Invoice
                                    </button>
                                  )}
                                  {showDealerInvoiceButton && (
                                    <button
                                      className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                      onClick={() => showGenerateInvoiceConfirm("Generate Dealer Invoice", handleGenerateDealerInvoice, "Dealer")}
                                    >
                                      Generate Dealer Invoice
                                    </button>
                                  )}
                                </div>
                                <div className="small text-muted mt-2 mb-0 fw-bold">
                                  <strong>Note:</strong> Estimation button displays when at least one service exists and supervisor has confirmed all services. Final Invoice button displays after full payment is completed.
                                </div>
                              </>
                            ) : (
                              <p className="text-muted mb-0">
                                Loading summary...
                              </p>
                            )}
                            {/* ============= Location Map ============= */}
                            {bookingData?.Latitude && bookingData?.Longitude && (
                              <Accordion defaultActiveKey="3">
                                <Accordion.Item eventKey="3">
                                  <Accordion.Header>
                                    <h6 className="text-info fw-bold mb-0">
                                      🗺️ Location
                                    </h6>
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <div
                                      className="rounded border overflow-hidden shadow-sm"
                                      style={{ height: "250px" }}
                                    >
                                      <iframe
                                        title={`map-${bookingData.BookingID}`}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        src={`https://maps.google.com/maps?q=${bookingData.Latitude},${bookingData.Longitude}&z=15&output=embed`}
                                        allowFullScreen
                                        loading="lazy"
                                      ></iframe>
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                              </Accordion>
                            )}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  ) : (
                    <p>Loading booking details...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Technician/Supervisor Modal */}
        {assignModalOpen && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080" }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "500px", width: "90%" }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Assign</h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={() => {
                      setAssignModalOpen(false);
                      setAssignType("technician");
                      setSelectedTechnician(null);
                      setSelectedSupervisor(null);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <div className="d-flex justify-content-center align-items-center gap-4 mb-3 ">
                    <div className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="assignTech"
                        checked={assignType === "technician"}
                        onChange={() => {
                          setAssignType("technician");
                          setSelectedSupervisor(null);
                        }}
                        style={{ width: "18px", height: "18px", margin: 0 }}
                      />
                      <label
                        htmlFor="assignTech"
                        className="form-check-label mb-0"
                      >
                        Technician
                      </label>
                    </div>
                    {roleId !== "8" && roleName !== "Field Advisor" && (
                      <div className="form-check d-flex align-items-center gap-2 m-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="assignSup"
                          checked={assignType === "supervisor"}
                          onChange={() => {
                            setAssignType("supervisor");
                            setSelectedTechnician(null);
                          }}
                          style={{ width: "18px", height: "18px", margin: 0 }}
                        />
                        <label
                          htmlFor="assignSup"
                          className="form-check-label mb-0"
                        >
                          Supervisor
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    {/* <label className="form-label">Time Slot</label> */}
                    <Select
                      options={getSelectedTimeSlotOptions()}
                      value={selectedReassignTimeSlot}
                      onChange={(val) => setSelectedReassignTimeSlot(val)}
                      placeholder="Select Time Slot"
                      isDisabled={
                        !getSelectedTimeSlotOptions().length ||
                        getSelectedTimeSlotOptions().length <= 1
                      }
                    />
                  </div>

                  {assignType === "technician" ? (
                    <div>
                      {/* <label className="form-label">Technician</label> */}
                      <Select
                        options={filteredTechnicians}
                        value={selectedTechnician}
                        onChange={(val) => setSelectedTechnician(val)}
                        placeholder="Select Technician"
                        isDisabled={!filteredTechnicians.length}
                      />
                    </div>
                  ) : (
                    <div>
                      {/* <label className="form-label">Supervisor</label> */}
                      <Select
                        options={filteredSupervisors}
                        value={selectedSupervisor}
                        onChange={(val) => setSelectedSupervisor(val)}
                        placeholder="Select Supervisor"
                        isDisabled={!supervisors.length}
                      />
                    </div>
                  )}
                </div>
                <div className=" modal-footer mt-3 d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-press-effect btn-secondary"
                    onClick={() => {
                      setAssignModalOpen(false);
                      setAssignType("technician");
                      setSelectedTechnician(null);
                      setSelectedSupervisor(null);
                      setSelectedReassignTimeSlot(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handleAssignConfirm}
                    disabled={
                      !selectedReassignTimeSlot ||
                      (assignType === "technician" && !selectedTechnician) ||
                      (assignType === "supervisor" && !selectedSupervisor)
                    }
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showPaymentModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: paymentTypeChoice ? "420px" : "440px", width: "90%" }}>
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header border-0">
                  <h6 className="modal-title fw-bold">
                    {!paymentTypeChoice ? "Payment" : paymentTypeChoice === "online" ? "Pay through online" : "Enter Payment Details"}
                  </h6>
                  <button type="button" className="btn-close btn-close-press" onClick={closePaymentModal} />
                </div>

                <div className="modal-body">
                  {/* Step 1: Choose payment type */}
                  {!paymentTypeChoice && (
                    <>
                      <p className="text-muted small mb-3">Choose how you want to pay.</p>
                      <div className="d-flex flex-column gap-2">
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{ minHeight: "56px", border: "1px solid #dee2e6" }}
                          onClick={() => {
                            setPaymentTypeChoice("online");
                            setPaymentMode("Online");
                            setPayAmount(remainingAmount);
                          }}
                        >
                          <span className="d-flex align-items-center gap-2 fw-semibold text-dark">
                            <Icon icon="mdi:credit-card-outline" width={24} height={24} className="text-primary" />
                            Pay through online
                          </span>
                          <Icon icon="mdi:chevron-right" width={22} height={22} className="text-secondary opacity-75" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{ minHeight: "56px", border: "1px solid #dee2e6" }}
                          onClick={() => {
                            setPaymentTypeChoice("other");
                            setPaymentMode("");
                            setPayAmount(remainingAmount);
                          }}
                        >
                          <span className="d-flex align-items-center gap-2 fw-semibold text-dark">
                            <Icon icon="mdi:cash-multiple" width={24} height={24} className="text-primary" />
                            Pay through other method
                          </span>
                          <Icon icon="mdi:chevron-right" width={22} height={22} className="text-secondary opacity-75" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2a: Pay through online – amount + discount only */}
                  {paymentTypeChoice === "online" && (
                    <>
                      <div className="border rounded-3 p-3 bg-light mb-3">
                        <div className="d-flex justify-content-between small">
                          <span>Remaining</span>
                          <strong>₹{remainingAmount.toFixed(2)}</strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Enter Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={remainingAmount}
                          value={payAmount}
                          onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
                          placeholder="Amount"
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label fw-semibold">Discount Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={Math.max(0, Number(payAmount || 0))}
                          value={discountAmount}
                          onChange={(e) => {
                            const pay = Number(payAmount || 0);
                            const val = Math.max(0, Number(e.target.value));
                            setDiscountAmount(val > pay ? pay : val);
                          }}
                          placeholder="0"
                        />
                        {Number(payAmount || 0) > 0 && (
                          <small className="text-muted">Max: ₹{Number(payAmount || 0).toFixed(2)}</small>
                        )}
                      </div>
                      {Number(discountAmount || 0) > 0 && (
                        <div className="mt-2 small text-muted">
                          Final payable: ₹{Math.max(Number(payAmount || 0) - Number(discountAmount || 0), 0).toFixed(2)}
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2b: Pay through other – full form (mode + amount + discount) */}
                  {paymentTypeChoice === "other" && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Payment Mode</label>
                        <select
                          className="form-select"
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                        >
                          <option value="">Select payment mode</option>
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="NetBanking">Net Banking</option>
                        </select>
                      </div>
                      <div className="border rounded-3 p-3 bg-light mb-3">
                        <div className="d-flex justify-content-between small">
                          <span>Total Amount</span>
                          <strong>₹{totalAmount.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between small">
                          <span>Already Paid</span>
                          <strong>₹{alreadyPaid.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between small text-success">
                          <span>Remaining</span>
                          <strong>₹{remainingAmount.toFixed(2)}</strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Enter Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={remainingAmount}
                          value={payAmount}
                          onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
                          placeholder="Amount"
                        />
                      </div>
                      <div className="mb-0">
                        <label className="form-label fw-semibold">Discount Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={Math.max(0, Number(payAmount || 0))}
                          value={discountAmount}
                          onChange={(e) => {
                            const pay = Number(payAmount || 0);
                            const val = Math.max(0, Number(e.target.value));
                            setDiscountAmount(val > pay ? pay : val);
                          }}
                          placeholder="0"
                        />
                        {Number(payAmount || 0) > 0 && (
                          <small className="text-muted">Max: ₹{Number(payAmount || 0).toFixed(2)}</small>
                        )}
                      </div>
                      {Number(discountAmount || 0) > 0 && (
                        <div className="mt-2 small text-muted">
                          Final payable: ₹{Math.max(Number(payAmount || 0) - Number(discountAmount || 0), 0).toFixed(2)}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {(paymentTypeChoice === "online" || paymentTypeChoice === "other") && (
                  <div className="modal-footer border-0 justify-content-center gap-2">
                    <button type="button" className="btn btn-press-effect btn-outline-secondary btn-sm" onClick={() => { setPaymentTypeChoice(null); setPaymentMode(""); setPayAmount(remainingAmount); setDiscountAmount(""); }}>
                      Back
                    </button>
                    <button type="button" className="btn btn-press-effect btn-primary-600 btn-sm" onClick={handleConfirmPayment}>
                      Confirm Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Assign - Service at doorstep vs Service at garage (tap card to proceed) */}
        {showAssignStep1Modal && (
          <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "460px", width: "90%" }}
            >
              <div className="modal-content border-0 shadow-lg p-3 rounded-3 overflow-hidden">
                <div className="modal-header border-0 pb-0">
                  <h6 className="modal-title fw-bold">Assign To</h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={() => {
                      setShowAssignStep1Modal(false);
                      setAssignServiceLocation(null);
                    }}
                  />
                </div>
                <div className="modal-body pt-1 pb-4">
                  <p className="text-muted small mb-3">Tap an option to proceed.</p>
                  <div className="d-flex flex-column gap-3">
                    <button
                      type="button"
                      className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white position-relative overflow-hidden transition"
                      style={{
                        minHeight: "72px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "";
                        e.currentTarget.style.boxShadow = "";
                      }}
                      onClick={openDoorstepAssignModal}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                          <Icon icon="mdi:home-circle-outline" width={26} height={26} className="text-primary" />
                        </span>
                        <div>
                          <span className="fw-semibold d-block text-dark">Service at doorstep</span>
                          <span className="small text-muted">Technician visits customer location</span>
                        </div>
                      </div>
                      <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white position-relative overflow-hidden"
                      style={{ minHeight: "72px", transition: "all 0.2s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "";
                        e.currentTarget.style.boxShadow = "";
                      }}
                      onClick={openGarageFlowModal}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                          <Icon icon="mdi:garage" width={26} height={26} className="text-primary" />
                        </span>
                        <div>
                          <span className="fw-semibold d-block text-dark">Service at garage</span>
                          <span className="small text-muted">Pickup/drop & dealer flow</span>
                        </div>
                      </div>
                      <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initial Assign Modal - similar to BookingLayer */}
        {initialAssignModalOpen && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080" }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "500px", width: "90%" }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Assign</h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={() => {
                      setInitialAssignModalOpen(false);
                      setInitialAssignType("technician");
                      setSelectedInitialTechnician(null);
                      setSelectedInitialSupervisor(null);
                      setSelectedInitialFieldAdvisor(null);
                      setSelectedInitialTimeSlot(null);
                    }}
                  />
                </div>

                <div className="modal-body">
                  {/* Assignment Type Checkboxes */}
                  <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                    {/* Field Advisor Checkbox */}
                    {roleName !== "Field Advisor" && (
                      <div className="form-check d-flex align-items-center gap-2 m-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="assignInitialFieldAdvisor"
                          checked={initialAssignType === "fieldAdvisor"}
                          onChange={() => {
                            setInitialAssignType("fieldAdvisor");
                            setSelectedInitialTechnician(null);
                            setSelectedInitialSupervisor(null);
                          }}
                          style={{ width: "18px", height: "18px", margin: 0 }}
                        />
                        <label
                          htmlFor="assignInitialFieldAdvisor"
                          className="form-check-label mb-0"
                        >
                          Field Advisor
                        </label>
                      </div>
                    )}
                    {/* Technician Checkbox: always show */}
                    <div className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="assignInitialTech"
                        checked={initialAssignType === "technician"}
                        onChange={() => {
                          setInitialAssignType("technician");
                          setSelectedInitialSupervisor(null);
                          setSelectedInitialFieldAdvisor(null);
                        }}
                        style={{ width: "18px", height: "18px", margin: 0 }}
                      />
                      <label
                        htmlFor="assignInitialTech"
                        className="form-check-label mb-0"
                      >
                        Technician
                      </label>
                    </div>
                    {/* Supervisor Checkbox: show only if roleId is NOT 8 */}
                    {/* {roleId !== "8" && roleName !== "Field Advisor" && (
                    <div className="form-check d-flex align-items-center gap-2 m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="assignInitialSup"
                        checked={initialAssignType === "supervisor"}
                        onChange={() => {
                          setInitialAssignType("supervisor");
                          setSelectedInitialTechnician(null);
                          setSelectedInitialFieldAdvisor(null);
                        }}
                        style={{ width: "18px", height: "18px", margin: 0 }}
                      />
                      <label
                        htmlFor="assignInitialSup"
                        className="form-check-label mb-0"
                      >
                        Supervisor
                      </label>
                    </div>
                  )} */}
                  </div>

                  {/* Time Slot Selection - Hide for Field Advisor */}
                  {initialAssignType !== "fieldAdvisor" && (
                    <div className="mb-3">
                      {bookingData?.TimeSlot?.split(",").length === 1 ? (
                        <Select
                          value={selectedInitialTimeSlot}
                          isDisabled
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: "#f5f5f5",
                              cursor: "not-allowed",
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: "#495057",
                            }),
                          }}
                        />
                      ) : (
                        <Select
                          options={getInitialTimeSlotOptions()}
                          value={selectedInitialTimeSlot}
                          onChange={(val) => setSelectedInitialTimeSlot(val)}
                          placeholder="Select TimeSlot"
                        />
                      )}
                    </div>
                  )}

                  {/* Employee Selection based on assignType */}
                  {initialAssignType === "technician" ? (
                    <Select
                      options={technicians}
                      value={selectedInitialTechnician}
                      onChange={(val) => setSelectedInitialTechnician(val)}
                      placeholder="Select Technician"
                    />
                  ) : initialAssignType === "supervisor" ? (
                    <Select
                      options={supervisors}
                      value={selectedInitialSupervisor}
                      onChange={(val) => setSelectedInitialSupervisor(val)}
                      placeholder="Select Supervisor"
                    />
                  ) : (
                    <Select
                      options={fieldAdvisors}
                      value={selectedInitialFieldAdvisor}
                      onChange={(val) => setSelectedInitialFieldAdvisor(val)}
                      placeholder="Select Field Advisor"
                    />
                  )}
                </div>
                <div className="modal-footer d-inline-flex align-items-center justify-content-center">
                  <button
                    className="btn btn-press-effect btn-secondary btn-sm"
                    onClick={() => {
                      setInitialAssignModalOpen(false);
                      setInitialAssignType("technician");
                      setSelectedInitialTechnician(null);
                      setSelectedInitialSupervisor(null);
                      setSelectedInitialFieldAdvisor(null);
                      setSelectedInitialTimeSlot(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                    onClick={handleInitialAssignConfirm}
                    disabled={
                      (initialAssignType !== "fieldAdvisor" && !selectedInitialTimeSlot) ||
                      (initialAssignType === "technician" && !selectedInitialTechnician) ||
                      (initialAssignType === "supervisor" && !selectedInitialSupervisor) ||
                      (initialAssignType === "fieldAdvisor" && !selectedInitialFieldAdvisor)
                    }
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Garage flow modal: Car pickup / Car drop → dealer/driver flow */}
        {showGarageFlowModal && (
          <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
              style={{ maxWidth: "520px", width: "90%" }}
            >
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header border-0 flex-column align-items-stretch">
                  <div className="d-flex align-items-center justify-content-between w-100">
                    <h6 className="modal-title fw-bold mb-0">
                      {garageStep === "task" && "Service at garage"}
                      {garageStep === "route" && (garageTask === "carPickup" ? "Car pickup" : "Car drop")}
                      {garageStep === "details" && "Assign pickup & delivery"}
                    </h6>
                    <button type="button" className="btn-close btn-close-press" onClick={closeGarageFlowModal} />
                  </div>
                  {/* Stepper */}
                  <div className="d-flex align-items-center gap-1 mt-2" style={{ gap: "4px" }}>
                    {["task", "route", "details"].map((step) => {
                      const steps = ["task", "route", "details"];
                      const idx = steps.indexOf(garageStep);
                      const thisIdx = steps.indexOf(step);
                      const active = step === garageStep || thisIdx < idx;
                      return (
                        <div
                          key={step}
                          className="rounded-pill flex-grow-1"
                          style={{
                            height: "4px",
                            backgroundColor: active ? "var(--bs-primary)" : "var(--bs-border-color)",
                            opacity: active ? 1 : 0.4,
                            transition: "all 0.25s ease",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="modal-body">
                  {/* Step: Car pickup vs Car drop — tap to advance */}
                  {garageStep === "task" && (
                    <>
                      <p className="text-muted small mb-3">Tap an option to continue.</p>
                      <div className="d-flex flex-column gap-3">
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{ minHeight: "72px", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "";
                            e.currentTarget.style.boxShadow = "";
                          }}
                          onClick={() => { setGarageTask("carPickup"); setGarageStep("route"); }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                              <Icon icon="mdi:car-pickup" width={26} height={26} className="text-primary" />
                            </span>
                            <div>
                              <span className="fw-semibold d-block text-dark">Car pickup</span>
                              <span className="small text-muted">Pick up vehicle and take to dealer</span>
                            </div>
                          </div>
                          <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{ minHeight: "72px", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "";
                            e.currentTarget.style.boxShadow = "";
                          }}
                          onClick={() => { setGarageTask("carDrop"); setGarageStep("route"); }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                              <Icon icon="mdi:car-side" width={26} height={26} className="text-primary" />
                            </span>
                            <div>
                              <span className="fw-semibold d-block text-dark">Car drop</span>
                              <span className="small text-muted">Deliver vehicle back to customer</span>
                            </div>
                          </div>
                          <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step: Customer to dealer vs Dealer to dealer — tap to advance */}
                  {garageStep === "route" && (
                    <>
                      <p className="text-muted small mb-3">Tap an option to continue.</p>
                      <div className="d-flex flex-column gap-3">
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{ minHeight: "72px", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "";
                            e.currentTarget.style.boxShadow = "";
                          }}
                          onClick={() => { setGarageRoute("customerToDealer"); setGarageStep("details"); }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                              <Icon icon="mdi:account-arrow-right" width={24} height={24} className="text-primary" />
                            </span>
                            <div>
                              <span className="fw-semibold d-block text-dark">Customer to dealer</span>
                              <span className="small text-muted">
                                {garageTask === "carPickup" ? "Pickup at customer → Deliver at dealer" : "Pickup at dealer → Deliver at customer"}
                              </span>
                            </div>
                          </div>
                          <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                        </button>
                        {garageTask === "carPickup" && (
                          <button
                            type="button"
                            className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                            style={{ minHeight: "72px", transition: "all 0.2s ease" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "";
                              e.currentTarget.style.boxShadow = "";
                            }}
                            onClick={() => { setGarageRoute("dealerToDealer"); setGarageStep("details"); }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10" style={{ width: 48, height: 48 }}>
                                <Icon icon="mdi:swap-horizontal" width={24} height={24} className="text-primary" />
                              </span>
                              <div>
                                <span className="fw-semibold d-block text-dark">Dealer to dealer</span>
                                <span className="small text-muted">Pickup at one dealer → Deliver at another</span>
                              </div>
                            </div>
                            <Icon icon="mdi:chevron-right" width={24} height={24} className="text-secondary opacity-75" />
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Step: Details – pickup/deliver locations + driver */}
                  {garageStep === "details" && (
                    <>
                      <div className="small text-muted mb-2 fw-semibold">Pickup & deliver</div>
                      {garageRoute === "customerToDealer" && garageTask === "carPickup" && (
                        <div className="rounded-3 border p-3 mb-3 bg-light">
                          <div className="mb-2">
                            <span className="small text-muted d-block">Pickup at</span>
                            <span className="fw-semibold">
                              {bookingData?.Address || "Customer location"}
                            </span>
                          </div>
                          <div className="mb-0">
                            <label className="form-label small mb-1">Deliver at (dealer)</label>
                            <Select
                              options={garageDealerOptions}
                              value={garageDeliverDealer}
                              onChange={setGarageDeliverDealer}
                              placeholder="Select dealer"
                            />
                          </div>
                        </div>
                      )}
                      {garageRoute === "customerToDealer" && garageTask === "carDrop" && (
                        <div className="rounded-3 border p-3 mb-3 bg-light">
                          <div className="mb-2">
                            <label className="form-label small mb-1">Pickup at (dealer)</label>
                            <Select
                              options={garageDealerOptions}
                              value={garagePickupDealer}
                              onChange={setGaragePickupDealer}
                              placeholder="Select dealer"
                            />
                          </div>
                          <div className="mb-0">
                            <span className="small text-muted d-block">Deliver at</span>
                            <span className="fw-semibold">{bookingData?.Address || "Customer location"}</span>
                          </div>
                        </div>
                      )}
                      {garageRoute === "dealerToDealer" && (
                        <div className="rounded-3 border p-3 mb-3 bg-light">
                          <div className="mb-3">
                            <label className="form-label small mb-1">Pickup at (dealer)</label>
                            <Select
                              options={garageDealerOptions}
                              value={garagePickupDealer}
                              onChange={setGaragePickupDealer}
                              placeholder="Select pickup dealer"
                            />
                          </div>
                          <div>
                            <label className="form-label small mb-1">Deliver at (dealer)</label>
                            <Select
                              options={garageDealerOptions}
                              value={garageDeliverDealer}
                              onChange={setGarageDeliverDealer}
                              placeholder="Select deliver dealer"
                            />
                          </div>
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label small mb-1">Assign driver</label>
                        <Select
                          options={technicians}
                          value={garageDriver}
                          onChange={setGarageDriver}
                          placeholder="Select driver"
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small mb-1">Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            min={today}
                            value={garagePickupDate}
                            onChange={(e) => setGaragePickupDate(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Time</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={garagePickupTime}
                            onChange={(e) => setGaragePickupTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                </div>
                <div className="modal-footer border-0 d-flex justify-content-between gap-2 flex-wrap">
                  <div>
                    {garageStep !== "task" && (
                      <button
                        type="button"
                        className="btn btn-press-effect btn-outline-secondary btn-sm"
                        onClick={() => {
                          if (garageStep === "details") setGarageStep("route");
                          else setGarageStep("task");
                        }}
                      >
                        Back
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {garageStep === "details" && garageRoute !== "dealerToDealer" && (
                      <button
                        type="button"
                        className="btn btn-press-effect btn-primary btn-sm"
                        disabled={
                          (garageRoute === "customerToDealer" && garageTask === "carPickup" && !garageDeliverDealer) ||
                          (garageRoute === "customerToDealer" && garageTask === "carDrop" && !garagePickupDealer) ||
                          !garageDriver ||
                          !garagePickupDate ||
                          !garagePickupTime
                        }
                        onClick={async () => {
                          const payload = buildGaragePayload();
                          if (!payload) {
                            Swal.fire({ icon: "error", title: "Error", text: "Booking/Lead info missing." });
                            return;
                          }
                          const result = await savePickupDeliveryTime(payload);
                          if (result.ok) {
                            Swal.fire({ icon: "success", title: "Assigned", text: result.data?.message || "Pickup/delivery saved successfully." });
                            closeGarageFlowModal();
                            fetchBookingData();
                          } else {
                            Swal.fire({ icon: "error", title: "Error", text: result.message || "Failed to save." });
                          }
                        }}
                      >
                        Assign
                      </button>
                    )}
                    {garageStep === "details" && garageRoute === "dealerToDealer" && (
                      <button
                        type="button"
                        className="btn btn-press-effect btn-primary btn-sm"
                        disabled={
                          !garagePickupDealer ||
                          !garageDeliverDealer ||
                          !garageDriver ||
                          !garagePickupDate ||
                          !garagePickupTime
                        }
                        onClick={async () => {
                          const payload = buildGaragePayload();
                          if (!payload) {
                            Swal.fire({ icon: "error", title: "Error", text: "Booking/Lead info missing." });
                            return;
                          }
                          const result = await savePickupDeliveryTime(payload);
                          if (result.ok) {
                            Swal.fire({ icon: "success", title: "Saved", text: result.data?.message || "Pickup/delivery saved successfully." });
                            closeGarageFlowModal();
                            fetchBookingData();
                          } else {
                            Swal.fire({ icon: "error", title: "Error", text: result.message || "Failed to save." });
                          }
                        }}
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Confirmation Modal */}
        {showCustomerConfirmationModal && (
          <div
            className="modal fade show d-block"
            style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(5px)" }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "600px", width: "90%" }}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">Customer Confirmation</h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={() => {
                      setShowCustomerConfirmationModal(false);
                      setConfirmationDescription("");
                    }}
                  />
                </div>

                <div className="modal-body">
                  {/* Explanation Section */}
                  <div className="alert alert-info mb-3">
                    <h6 className="fw-bold mb-2">Why is confirmation required?</h6>
                    <p className="mb-0 small">
                      Customer confirmation is required to finalize the booking and move all services
                      from temporary status to confirmed status. This ensures that the customer has
                      reviewed and approved all services before proceeding with the booking process.
                      Once confirmed, the services will be moved to the main booking and cannot be
                      easily modified.
                    </p>
                  </div>

                  {/* Description Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Please provide a description for this confirmation..."
                      value={confirmationDescription}
                      onChange={(e) => setConfirmationDescription(e.target.value)}
                      required
                    />
                    <small className="text-muted">
                      This description will be recorded along with your confirmation.
                    </small>
                  </div>
                </div>

                <div className="modal-footer justify-content-center">
                  <button
                    className="btn btn-press-effect btn-secondary btn-sm"
                    onClick={() => {
                      setShowCustomerConfirmationModal(false);
                      setConfirmationDescription("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handleCustomerConfirmationSubmit}
                    disabled={!confirmationDescription || confirmationDescription.trim() === ""}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookingViewLayer;
