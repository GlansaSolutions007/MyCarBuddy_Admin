import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Select from "react-select";
import TimeLineView from "./TimeLineView";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

// Helper function to convert various time formats into 12-hour AM/PM format

const formatTo12Hour = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(hour, minute);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

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
  const roleIdInt = { confirmedBy: roleId ? Number(roleId) : null };
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
  const [selectedInitialTechnician, setSelectedInitialTechnician] =
    useState(null);
  const [selectedInitialSupervisor, setSelectedInitialSupervisor] =
    useState(null);
  const [selectedInitialFieldAdvisor, setSelectedInitialFieldAdvisor] =
    useState(null);
  const [selectedInitialTimeSlot, setSelectedInitialTimeSlot] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState([]);
  const [fieldAdvisors, setFieldAdvisors] = useState([]);
  const [showCustomerConfirmationModal, setShowCustomerConfirmationModal] =
    useState(false);
  const [confirmationDescription, setConfirmationDescription] = useState("");
  const [confirmationFile, setConfirmationFile] = useState(null);
  // Assign flow: step 1 = service location choice (doorstep vs garage)
  const [showAssignStep1Modal, setShowAssignStep1Modal] = useState(false);
  const [assignServiceLocation, setAssignServiceLocation] = useState(null); // "doorstep" | "garage"
  // Garage flow (service at garage): pickup/drop and dealer/driver flow
  const [showGarageFlowModal, setShowGarageFlowModal] = useState(false);
  const [garageStep, setGarageStep] = useState("task"); // "task" | "route" | "details" | "return"
  const [garageTask, setGarageTask] = useState(null); // "carPickup" | "carDrop"
  const [garageRoute, setGarageRoute] = useState(null); // "customerToDealer" | "dealerToDealer"
  const [garageOpenedDirectToDetails, setGarageOpenedDirectToDetails] =
    useState(false);
  const [garagePickupDealer, setGaragePickupDealer] = useState(null);
  const [garageDeliverDealer, setGarageDeliverDealer] = useState(null);
  const [garageDriver, setGarageDriver] = useState(null);
  const [garageServiceDone, setGarageServiceDone] = useState(false);
  // Pickup date & time for garage flow
  const [garagePickupDate, setGaragePickupDate] = useState("");
  const [garagePickupTime, setGaragePickupTime] = useState("");
  const [garageDeliveryDate, setGarageDeliveryDate] = useState("");
  const [garageDeliveryTime, setGarageDeliveryTime] = useState("");
  const [
    hasExistingCustomerToDealerRoute,
    setHasExistingCustomerToDealerRoute,
  ] = useState(false);
  // Dealers from this booking's add-ons (unique by DealerID) for garage flow dropdowns
  const garageDealerOptions = (() => {
    const addOns = bookingData?.BookingAddOns || [];
    const seen = new Set();
    return addOns
      .filter(
        (a) =>
          a.DealerID != null &&
          a.DealerName &&
          !seen.has(Number(a.DealerID)) &&
          (seen.add(Number(a.DealerID)), true),
      )
      .map((a) => ({ value: Number(a.DealerID), label: a.DealerName }));
  })();
  // Filter out selected pickup dealer from delivery dealer options
  const garageDeliverDealerOptions = garageDealerOptions.filter(
    (dealer) =>
      !garagePickupDealer || dealer.value !== garagePickupDealer.value,
  );
  const singleGarageDealerOption =
    garageDealerOptions.length === 1 ? garageDealerOptions[0] : null;
  const garageProgressServices = [
    ...(bookingData?.BookingAddOns || []),
    ...(bookingData?.SupervisorBookings || []),
  ].filter((item) => item?.DealerID != null && item?.DealerName);
  const isGarageServiceCompletedApproved = (item) => {
    const status = (
      item?.StatusName ??
      item?.statusName ??
      item?.AddOnStatus ??
      item?.addOnStatus
    )
      ?.toString()
      .trim();
    const isApproved =
      item?.IsCompleted_Confirmation === 1 ||
      item?.isCompleted_Confirmation === 1;
    return status === "ServiceCompleted" && isApproved;
  };
  const garageDealerProgressGroups = Object.values(
    garageProgressServices.reduce((acc, item) => {
      const dealerId = Number(item.DealerID);
      if (!acc[dealerId]) {
        acc[dealerId] = {
          dealerId,
          dealerName: item.DealerName,
          services: [],
        };
      }
      acc[dealerId].services.push(item);
      return acc;
    }, {}),
  );
  const completedGarageDealerOptions = garageDealerProgressGroups
    .filter(
      (group) =>
        group.services.length > 0 &&
        group.services.every(isGarageServiceCompletedApproved),
    )
    .map((group) => ({
      value: group.dealerId,
      label: group.dealerName,
    }));
  const remainingGarageDealerOptions = garageDealerProgressGroups
    .filter((group) =>
      group.services.some((item) => !isGarageServiceCompletedApproved(item)),
    )
    .map((group) => ({
      value: group.dealerId,
      label: group.dealerName,
    }));
  const allGarageServicesCompletedApproved =
    garageProgressServices.length > 0 &&
    garageProgressServices.every(isGarageServiceCompletedApproved);
  const lastGarageDealerOption = (() => {
    const routes = bookingData?.CarPickUpDelivery || [];
    if (routes.length === 0) return null;
    const lastEntry = routes[routes.length - 1];
    const dealerId =
      Number(lastEntry?.PickTo) || Number(lastEntry?.PickFrom) || null;
    if (!dealerId) return null;
    return garageDealerOptions.find((opt) => opt.value === dealerId) || null;
  })();
  const currentGarageDealerOption =
    lastGarageDealerOption ||
    completedGarageDealerOptions[0] ||
    singleGarageDealerOption ||
    null;
  const pendingNextGarageDealerOptions = remainingGarageDealerOptions.filter(
    (dealer) =>
      !currentGarageDealerOption ||
      dealer.value !== currentGarageDealerOption.value,
  );
  const garageServiceItems = [
    ...(bookingData?.BookingAddOns || []),
    ...(bookingData?.SupervisorBookings || []),
  ].filter((item) => item?.ServiceName);
  const shouldSkipGaragePickupIntro =
    bookingData?.ServiceType === "ServiceAtGarage" &&
    garageServiceItems.length === 1 &&
    !!singleGarageDealerOption &&
    !hasExistingCustomerToDealerRoute;
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("");
  // Pickup/Drop Reschedule modal (from Technician Pickup / Drop Records table)
  const [showPickupDropRescheduleModal, setShowPickupDropRescheduleModal] =
    useState(false);
  const [pickupDropRescheduleRow, setPickupDropRescheduleRow] = useState(null);
  const [pickupDropRescheduleDate, setPickupDropRescheduleDate] = useState("");
  const [pickupDropRescheduleTimeSlot, setPickupDropRescheduleTimeSlot] =
    useState([]);
  // Pickup/Drop Reassign modal
  const [showPickupDropReassignModal, setShowPickupDropReassignModal] =
    useState(false);
  const [pickupDropReassignRow, setPickupDropReassignRow] = useState(null);
  const [pickupDropReassignTech, setPickupDropReassignTech] = useState(null);
  const [pickupDropReassignDate, setPickupDropReassignDate] = useState("");
  const [pickupDropReassignTimeSlot, setPickupDropReassignTimeSlot] = useState(
    [],
  );
  const [pickupDropActionLoading, setPickupDropActionLoading] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null); // for pickup image fullscreen view
  const [fullScreenImageClosing, setFullScreenImageClosing] = useState(false);
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTypeChoice, setPaymentTypeChoice] = useState(null); // null | "online" | "other"
  const [paymentMode, setPaymentMode] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
  const [isDiscountApplicable, setIsDiscountApplicable] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [couponOffers, setCouponOffers] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [showCustomerRejectionModal, setShowCustomerRejectionModal] =
    useState(false);
  const [rejectionDescription, setRejectionDescription] = useState("");
  const [rejectedServiceIds, setRejectedServiceIds] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [showAssignSupervisorModal, setShowAssignSupervisorModal] =
    useState(false);
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const userId = employeeData?.Id;
  const roleName = employeeData?.RoleName;
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm
  const [isLoading, setIsLoading] = useState(false);

  // buttons loaders
  const [isConverting, setIsConverting] = useState(false);
  const [isConfirmingService, setIsConfirmingService] = useState(false);
  const [isConfirmingCustomer, setIsConfirmingCustomer] = useState(false);
  const [isRejectingCustomer, setIsRejectingCustomer] = useState(false);
  const [isInitialAssigning, setIsInitialAssigning] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [isGarageAssigning, setIsGarageAssigning] = useState(false);
  const [revertingServiceId, setRevertingServiceId] = useState(null);
  const [isGeneratingEstimation, setIsGeneratingEstimation] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [isGeneratingDealer, setIsGeneratingDealer] = useState(false);

  // Filter time slots by date: upcoming = all active slots, today = only future slots
  const getFilteredTimeSlotsForDate = (selectedDate) => {
    const slots = Array.isArray(timeSlots) ? timeSlots : [];
    if (!selectedDate) return slots.filter((s) => s?.IsActive);

    const active = slots.filter((s) => s?.IsActive);
    if (selectedDate > today) return active;
    if (selectedDate !== today) return [];

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return active.filter((slot) => {
      const start = String(slot?.StartTime || "00:00").substring(0, 5);
      return start > currentTimeStr;
    });
  };
  const finalPayAmount = Math.max(
    Number(payAmount || 0) - Number(discountAmount || 0),
    0,
  );
  const hideAllActions =
    bookingData?.BookingStatus === "Completed" &&
    bookingData?.Payments?.length > 0 &&
    bookingData?.Payments?.[bookingData.Payments.length - 1]?.PaymentStatus ===
      "Success";

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

  // Auto-refresh booking details to reflect external updates (dealer/customer actions)
  const AUTO_REFRESH_MS = 15000;

  useEffect(() => {
    setIsPaid(!!bookingData?.Payments);
  }, [bookingData]);

  // Full-screen image: fade-in on open
  useEffect(() => {
    if (fullScreenImageUrl) {
      setFullScreenImageVisible(false);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setFullScreenImageVisible(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setFullScreenImageVisible(false);
    }
  }, [fullScreenImageUrl]);

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

      // Check if any CarPickUpDelivery has RouteType = "CustomerToDealer"
      const carPickUpDelivery = res.data?.[0]?.CarPickUpDelivery || [];
      const hasRoute = carPickUpDelivery.some(
        (item) =>
          item.RouteType === "CustomerToDealer" &&
          item.Status?.toLowerCase() !== "cancelled",
      );
      setHasExistingCustomerToDealerRoute(hasRoute);

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

  const toTimeDisplay = (t) =>
    t && String(t).length >= 5 ? String(t).substring(0, 5) : t || "";

  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_BASE}TimeSlot`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeSlots(
        (response.data || []).map((slot) => ({
          StartTime: slot.StartTime || slot.startTime || "",
          EndTime: slot.EndTime || slot.endTime || "",
          IsActive: slot.Status ?? slot.status ?? slot.IsActive ?? false,
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
  }, [bookingId, token, roleId, duserId]);

  // Poll booking data so confirmations/updates reflect immediately on screen
  // useEffect(() => {
  //   if (!bookingId || !token) return;

  //   const refresh = () => {
  //     // avoid refetching when tab is hidden
  //     if (document.visibilityState !== "visible") return;
  //     fetchBookingData();
  //   };

  //   // initial quick refresh
  //   refresh();

  //   const intervalId = window.setInterval(refresh, AUTO_REFRESH_MS);
  //   const onFocus = () => refresh();
  //   const onVisibility = () => refresh();

  //   window.addEventListener("focus", onFocus);
  //   document.addEventListener("visibilitychange", onVisibility);

  //   return () => {
  //     window.clearInterval(intervalId);
  //     window.removeEventListener("focus", onFocus);
  //     document.removeEventListener("visibilitychange", onVisibility);
  //   };
  // }, [bookingId, token, roleId, duserId]);

  useEffect(() => {
    if (!bookingId || !token) return;

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      fetchBookingData();
    };

    let idleTimeout;
    let intervalId = null;

    const startAutoRefresh = () => {
      if (intervalId) return; // already running
      intervalId = setInterval(() => {
        refresh();
      }, 15000); // every 15 seconds
    };

    const stopAutoRefresh = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleUserActivity = () => {
      // user is active → stop interval
      stopAutoRefresh();

      // reset idle timer
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        console.log("User idle, starting auto-refresh");
        startAutoRefresh(); // start after 15 seconds of inactivity
      }, 15000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];

    events.forEach((event) =>
      window.addEventListener(event, handleUserActivity),
    );

    // start tracking initially
    handleUserActivity();

    return () => {
      clearTimeout(idleTimeout);
      stopAutoRefresh();

      events.forEach((event) =>
        window.removeEventListener(event, handleUserActivity),
      );
    };
  }, [bookingId, token, roleId, duserId]);

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

  const openPickupDropRescheduleModal = (row) => {
    setPickupDropRescheduleRow(row);
    setPickupDropRescheduleDate(today);
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    setPickupDropRescheduleTimeSlot([currentTime]);
    setShowPickupDropRescheduleModal(true);
  };

  const closePickupDropRescheduleModal = () => {
    setShowPickupDropRescheduleModal(false);
    setPickupDropRescheduleRow(null);
    setPickupDropRescheduleDate("");
    setPickupDropRescheduleTimeSlot([]);
  };

  const handlePickupDropCancel = async (row) => {
    const id = row?.Id ?? row?.id;
    if (!id) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Record ID missing.",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Cancel Pickup/Drop",
      text: "Are you sure you want to cancel this pickup/drop assignment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, cancel",
    });
    if (!result.isConfirmed) return;
    setPickupDropActionLoading(true);
    try {
      await axios.post(
        `${API_BASE}ServiceImages/CancelCarPickupDelivery?id=${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Pickup/drop cancelled successfully.",
      });
      fetchBookingData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "Failed to cancel.",
      });
    } finally {
      setPickupDropActionLoading(false);
    }
  };

  const handlePickupDropRescheduleSubmit = async () => {
    if (!pickupDropRescheduleDate) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select reschedule date.",
      });
      return;
    }
    if (
      !pickupDropRescheduleTimeSlot ||
      pickupDropRescheduleTimeSlot.length === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select time.",
      });
      return;
    }
    const id = pickupDropRescheduleRow?.Id ?? pickupDropRescheduleRow?.id;
    if (!id) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Record ID missing.",
      });
      return;
    }

    const startTime = pickupDropRescheduleTimeSlot[0] || "00:00"; // Directly use the string "HH:MM"
    const newAssignDate = `${pickupDropRescheduleDate}T${startTime}:00`;
    const assignTimeSlot = startTime;

    setPickupDropActionLoading(true);
    try {
      await axios.post(
        `${API_BASE}ServiceImages/RescheduleCarPickupDelivery`,
        { id, newAssignDate, assignTimeSlot },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Rescheduled successfully.",
      });
      closePickupDropRescheduleModal();
      fetchBookingData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message || err.message || "Failed to reschedule.",
      });
    } finally {
      setPickupDropActionLoading(false);
    }
  };

  const openPickupDropReassignModal = (row) => {
    setPickupDropReassignRow(row);
    const now = new Date();
    setPickupDropReassignDate(today);
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    setPickupDropReassignTech(null);
    setPickupDropReassignTimeSlot([currentTime]);
    setShowPickupDropReassignModal(true);
  };

  const closePickupDropReassignModal = () => {
    setShowPickupDropReassignModal(false);
    setPickupDropReassignRow(null);
    setPickupDropReassignTech(null);
    setPickupDropReassignDate("");
    setPickupDropReassignTimeSlot([]);
  };

  const handlePickupDropReassignSubmit = async () => {
    if (!pickupDropReassignTech) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select a technician.",
      });
      return;
    }
    if (!pickupDropReassignDate) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select assign date.",
      });
      return;
    }
    if (
      !pickupDropReassignTimeSlot ||
      pickupDropReassignTimeSlot.length === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select time.",
      });
      return;
    }
    const id = pickupDropReassignRow?.Id ?? pickupDropReassignRow?.id;
    if (!id) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Record ID missing.",
      });
      return;
    }

    const newTechID = pickupDropReassignTech?.value ?? pickupDropReassignTech;
    const startTime = pickupDropReassignTimeSlot[0] || "00:00"; // Directly use the string "HH:MM"
    const newAssignDate = `${pickupDropReassignDate}T${startTime}:00`;
    const assignTimeSlot = startTime;

    setPickupDropActionLoading(true);
    try {
      await axios.post(
        `${API_BASE}ServiceImages/ReassignCarPickupDelivery`,
        { id, newTechID, newAssignDate, assignTimeSlot },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Reassigned successfully.",
      });
      closePickupDropReassignModal();
      fetchBookingData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message || err.message || "Failed to reassign.",
      });
    } finally {
      setPickupDropActionLoading(false);
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
    setIsReassigning(true);
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
            `${
              assignType === "technician" ? "Technician" : "Supervisor"
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
            `${
              assignType === "technician" ? "Technician" : "Supervisor"
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
    } finally {
      setIsReassigning(false);
    }
  };

  // Handler for initial assignment: first show service location (doorstep vs garage)
  // const handleInitialAssignClick = () => {
  //   setAssignServiceLocation(null);
  //   setShowAssignStep1Modal(true);
  // };

  const handleInitialAssignClick = () => {
    const routes = bookingData?.CarPickUpDelivery || [];
    const filteredRoutes = routes.filter(
      (route) => route.Status !== "Cancelled",
    );
    console.log(filteredRoutes, "asdasdd");
    const addOns = bookingData?.BookingAddOns || [];

    const lastRoute = filteredRoutes[filteredRoutes.length - 1];

    console.log(lastRoute, "lastRoute");
    const lastStatus = lastRoute?.Status?.toLowerCase();
    const routeType = lastRoute?.RouteType;

    // 1. Safety Check: If there are existing routes, ensure the last one is finished
    if (filteredRoutes.length > 0) {
      // If the technician is still active (not completed or cancelled), block and STOP
      if (lastStatus !== "completed" && lastStatus !== "cancelled") {
        Swal.fire({
          icon: "warning",
          title: "Cannot Assign",
          text: "The previously assigned technician has not completed the service. Please wait until the current assignment is completed before assigning a new technician.",
        });
        return; // Stop the function here so no modals open
      }

      // 🚨 NEW CONDITION (Garage check)
      if (
        bookingData?.ServiceType === "ServiceAtGarage" &&
        routeType === "CustomerToDealer" &&
        lastStatus === "completed"
      ) {
        const dealerId = Number(lastRoute?.PickTo); // 👈 DealerID from route
        // Filter only that dealer add-ons
        const dealerAddOns = addOns.filter(
          (a) => Number(a.DealerID) === dealerId,
        );

        // Check if any service NOT completed
        const hasPending = dealerAddOns.some(
          (a) => (a.StatusName || "").toLowerCase() !== "servicecompleted",
        );

        if (hasPending) {
          const dealerName =
            dealerAddOns[0]?.DealerName || lastRoute?.PickToName || "Dealer";

          Swal.fire({
            icon: "warning",
            title: "Service Still In Progress",
            text: `Car is at ${dealerName}, but service is not completed yet.`,
          });
          return;
        }
      }
    }
    // 2. If we reached here, assignment is ALLOWED.
    // Now decide: Skip Step 1 if it's already a Garage Service
    if (bookingData?.ServiceType === "ServiceAtGarage") {
      console.log(lastRoute, "lastRoute");
      if (
        bookingData?.ServiceType === "ServiceAtGarage" &&
        lastRoute?.RouteType === "CustomerToDealer" &&
        lastRoute?.Status === "completed"
      ) {
        const dealerId = Number(lastRoute?.PickTo); // 👈 DealerID from route
        // Filter only that dealer add-ons
        const dealerAddOns = addOns.filter(
          (a) => Number(a.DealerID) === dealerId,
        );
        console.log(dealerAddOns, "dealerAddOns");
        // Check if any service NOT completed
        const hasApproved = dealerAddOns.some(
          (a) => a.IsCompleted_Confirmation === 0,
        );
        console.log(hasApproved, "hasApproved");
        if (hasApproved) {
          const dealerName =
            dealerAddOns[0]?.DealerName || lastRoute?.PickToName || "Dealer";

          Swal.fire({
            icon: "warning",
            title: "Service Not Approved",
            text: `Service is completed at ${dealerName}, Service final approval is pending.`,
          });
          return;
        }
      }

      openGarageFlowModal(); // Directly go to Pickup/Drop selection (Step 2)
    } else {
      setAssignServiceLocation(null);
      setShowAssignStep1Modal(true); // Show Doorstep vs Garage choice (Step 1)
    }
  };

  // After user selects "Service at doorstep" → open employee selection modal
  const openDoorstepAssignModal = () => {
    setShowAssignStep1Modal(false);
    setInitialAssignType("technician");
    setSelectedInitialTechnician(null);
    setSelectedInitialSupervisor(null);
    setSelectedInitialFieldAdvisor(null);
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    setGaragePickupDate(today); // Sets the date input to Today
    setGaragePickupTime(currentTime); // Sets the time input to Current Time
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
    const shouldOpenDealerToDealer =
      hasExistingCustomerToDealerRoute &&
      !allGarageServicesCompletedApproved &&
      completedGarageDealerOptions.length > 0 &&
      pendingNextGarageDealerOptions.length > 0;
    const defaultGarageTask =
      hasExistingCustomerToDealerRoute && allGarageServicesCompletedApproved
        ? "carDrop"
        : "carPickup";
    const defaultGarageRoute = shouldOpenDealerToDealer
      ? "dealerToDealer"
      : "customerToDealer";

    setShowAssignStep1Modal(false);
    setGarageOpenedDirectToDetails(true);
    setGarageStep("details");
    setGarageTask(defaultGarageTask);
    setGarageRoute(defaultGarageRoute);
    setGaragePickupDealer(
      hasExistingCustomerToDealerRoute ? currentGarageDealerOption : null,
    );
    setGarageDeliverDealer(
      defaultGarageRoute === "dealerToDealer"
        ? pendingNextGarageDealerOptions.length === 1
          ? pendingNextGarageDealerOptions[0]
          : null
        : defaultGarageTask === "carPickup"
          ? singleGarageDealerOption
          : null,
    );
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
    setGarageOpenedDirectToDetails(false);
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

  const renderAssignedDealerField = (label, dealerOption) => (
    <div className="mb-0">
      <label className="form-label small mb-1">{label}</label>
      <div
        className="form-control d-flex align-items-center justify-content-between"
        style={{ minHeight: "42px", backgroundColor: "#fff" }}
      >
        <span className="fw-semibold">
          {dealerOption?.label || "Dealer not assigned"}
        </span>
        <span className="badge bg-success-subtle text-success">Assigned</span>
      </div>
    </div>
  );

  // Format time as HH:mm:ss for SavePickupDeliveryTime API
  const toTimeApi = (t) => {
    if (!t || typeof t !== "string") return "";
    const s = t.trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, "0")}:${m[2]}:00` : "";
  };

  // Get local time in ISO format (not UTC)
  const getLocalISODateTime = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
  };

  const isPastTimeForDate = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const selectedDate = String(dateStr).split("T")[0];
    if (selectedDate !== today) return false;
    const t = String(timeStr).slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(t)) return false;
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return t <= currentTimeStr;
  };

  const savePickupDeliveryTime = async (payload) => {
    try {
      const res = await axios.post(
        `${API_BASE}Supervisor/SavePickupDeliveryTime`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return { ok: true, data: res.data };
    } catch (err) {
      console.error("SavePickupDeliveryTime error:", err);
      return { ok: false, message: err.response?.data?.message || err.message };
    }
  };
  // const handleConvertToService = async () => {
  //   const result = await Swal.fire({
  //     title: "Convert Inspection?",
  //     text: "This will convert the inspection into a service.",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Yes, Convert",
  //     cancelButtonText: "Cancel",
  //   });

  //   if (!result.isConfirmed) return;
  //    setIsConverting(true);
  //   try {
  //     await axios.post(
  //       `${API_BASE}Bookings/convert-inspection-to-service`,
  //       {
  //         bookingId: bookingData?.BookingID,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       },
  //     );

  //     await Swal.fire({
  //       icon: "success",
  //       title: "Converted",
  //       text: "Inspection successfully converted to service. Please add extra services.",
  //     });

  //     // After successful convert, redirect to booking service page to add extra services
  //     if (
  //       bookingData?.LeadId &&
  //       bookingData?.BookingID &&
  //       bookingData?.BookingTrackID
  //     ) {
  //       navigate(
  //         `/book-service/${bookingData.LeadId}/${bookingData.BookingID}/${bookingData.BookingTrackID}`,
  //       );
  //       return;
  //     }

  //     // Fallback: just refresh booking details
  //     fetchBookingData();
  //   } catch (error) {
  //     console.error("Convert Error:", error);

  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text:
  //         error?.response?.data?.message ||
  //         "Failed to convert inspection to service.",
  //     });
  //   } finally {
  //     setIsConverting(false);
  //   }
  // };

  const handleConvertToService = async () => {
    const result = await Swal.fire({
      title: "Convert Inspection?",
      text: "This will convert the inspection into a service.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Convert",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsConverting(true);

    try {
      // 1️⃣ Convert Inspection → Service
      await axios.post(
        `${API_BASE}Bookings/convert-inspection-to-service`,
        {
          bookingId: bookingData?.BookingID,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // 2️⃣ Update Booking Status → ServiceInProgress
      await axios.put(
        `${API_BASE}Bookings/booking-status`,
        {
          bookingID: bookingData?.BookingID,
          bookingStatus: "ServiceInProgress",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // 3️⃣ Success Message
      await Swal.fire({
        icon: "success",
        title: "Converted",
        text: "Inspection converted and service started. Please add extra services.",
      });

      // 4️⃣ Redirect
      if (
        bookingData?.LeadId &&
        bookingData?.BookingID &&
        bookingData?.BookingTrackID
      ) {
        navigate(
          `/book-service/${bookingData.LeadId}/${bookingData.BookingID}/${bookingData.BookingTrackID}`,
        );
        return;
      }

      fetchBookingData();
    } catch (error) {
      console.error("Convert Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "Failed to convert inspection to service.",
      });
    } finally {
      setIsConverting(false);
    }
  };
  // const handleConfirmService = async () => {
  //   const addOns = bookingData?.BookingAddOns || [];
  //   const supervisorBookings = bookingData?.SupervisorBookings || [];
  //   const allServices = [...addOns, ...supervisorBookings];
  //   const itemsToConfirm = allServices.filter(
  //     (a) => (a.IsSupervisor_Confirm ?? a.isSupervisor_Confirm) !== 1,
  //   );
  //   if (itemsToConfirm.length === 0) {
  //     Swal.fire({
  //       icon: "info",
  //       title: "No pending services",
  //       text: "All services are already confirmed by supervisor.",
  //     });
  //     return;
  //   }
  //   const result = await Swal.fire({
  //     title: "Confirm services?",
  //     text: `This will confirm ${itemsToConfirm.length} service(s) for this booking.`,
  //     icon: "question",
  //     showCancelButton: true,
  //     confirmButtonText: "Yes, Confirm",
  //     cancelButtonText: "Cancel",
  //   });
  //   if (!result.isConfirmed) return;

  //   try {
  //     const uid = parseInt(
  //       duserId || localStorage.getItem("userId") || "0",
  //       10,
  //     );
  //     const rolename = roleName || employeeData?.RoleName || "";

  //     for (const addon of itemsToConfirm) {
  //       const addOnId = addon.AddOnID ?? addon.addOnId ?? addon.Id ?? addon.id;
  //       if (!addOnId) continue;

  //       const includes =
  //         Array.isArray(addon.Includes) && addon.Includes.length > 0
  //           ? addon.Includes.map((i) => i.IncludeID ?? i.includeId)
  //               .filter(Boolean)
  //               .join(",")
  //           : "";
  //       const payload = {
  //         id: addOnId,
  //         bookingId: bookingData.BookingID,
  //         bookingTrackID: bookingData.BookingTrackID,
  //         leadId: bookingData.LeadId,
  //         serviceType: addon.ServiceType || "Package",
  //         serviceName: addon.ServiceName || "",
  //         basePrice:
  //           Number(addon.BasePrice ?? addon.ServicePrice ?? addon.Price ?? 0) ||
  //           0,
  //         quantity: Number(addon.Quantity ?? 1) || 1,
  //         price:
  //           Number(
  //             addon.ServicePrice ?? addon.TotalPrice ?? addon.Price ?? 0,
  //           ) || 0,
  //         gstPercent: Number(addon.GSTPercent ?? 0) || 0,
  //         gstAmount: Number(addon.GSTPrice ?? addon.GSTAmount ?? 0) || 0,
  //         description: addon.Description || "",
  //         dealerID:
  //           addon.DealerID != null && addon.DealerID !== ""
  //             ? Number(addon.DealerID)
  //             : 0,
  //         percentage: Number(addon.Percentage ?? 0) || 0,
  //         supervisorRole: rolename,
  //         our_Earnings: Number(addon.Our_Earnings ?? 0) || 0,
  //         labourCharges: Number(addon.LabourCharges ?? 0) || 0,
  //         modifiedBy: uid,
  //         isActive: true,
  //         type: "Confirm",
  //         includes,
  //         serviceId: Number(addon.ServiceId ?? 0) || 0,
  //       };

  //       await axios.put(
  //         `${API_BASE}Supervisor/UpdateSupervisorBooking`,
  //         payload,
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${token}`,
  //           },
  //         },
  //       );
  //     }

  //     Swal.fire({
  //       icon: "success",
  //       title: "Confirmed",
  //       text: "Services confirmed successfully.",
  //     });
  //     fetchBookingData();
  //   } catch (error) {
  //     console.error("Confirm Service Error:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: error?.response?.data?.message || "Failed to confirm services.",
  //     });
  //   }
  // };

  const handleConfirmService = async () => {
    const addOns = bookingData?.BookingAddOns || [];
    const supervisorBookings = bookingData?.SupervisorBookings || [];
    const allServices = [...addOns, ...supervisorBookings];
    const itemsToConfirm = allServices.filter(
      (a) => (a.IsSupervisor_Confirm ?? a.isSupervisor_Confirm) !== 1,
    );

    if (itemsToConfirm.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No pending services",
        text: "All services are already confirmed by supervisor.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Confirm services?",
      text: `This will confirm ${itemsToConfirm.length} service(s) for this booking.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setIsConfirmingService(true);
    try {
      const supervisorId = Number(
        duserId || localStorage.getItem("userId") || 0,
      );
      const bookingId = bookingData?.BookingID;

      await axios.post(
        `${API_BASE}Supervisor/confirm-by-bookingid?bookingId=${encodeURIComponent(
          bookingId,
        )}&supervisorId=${encodeURIComponent(supervisorId)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Confirmed",
        text: "Services confirmed successfully.",
      });
      fetchBookingData();
    } catch (error) {
      console.error("Confirm Service Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to confirm services.",
      });
    } finally {
      setIsConfirmingService(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    const newFiles = [...selectedImages, ...files];
    setSelectedImages(newFiles);

    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviewImages((prev) => [...prev, ...newPreviews]);

    e.target.value = ""; // allows selecting same file again
  };

  const handleRemoveImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // const handleFieldAdvisorConfirm = async () => {
  //   if (!selectedAddon) return;

  //   const addOnId = selectedAddon?.AddOnID ?? selectedAddon?.addOnId;
  //   const employeeId = userId
  //     ? Number(userId)
  //     : Number(localStorage.getItem("userId") || 0);

  //   if (!addOnId || !employeeId) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Invalid data",
  //       text: "AddOn ID or Employee ID missing.",
  //     });
  //     return;
  //   }
  //   setIsConfirmingCompletion(true);
  //   try {
  //     const formData = new FormData();

  //     formData.append("AddOnId", addOnId);
  //     formData.append("EmployeeId", employeeId);

  //     selectedImages.forEach((img) => {
  //       formData.append("Images", img);
  //     });

  //     const res = await axios.post(`${API_BASE}Supervisor/confirm`, formData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     if (res.status >= 200 && res.status < 300) {
  //       Swal.fire({
  //         icon: "success",
  //         title: "Confirmed",
  //         text: "Service confirmed successfully.",
  //       });

  //       setShowConfirmModal(false);
  //       setSelectedImages([]);
  //       setPreviewImages([]);

  //       fetchBookingData();
  //     }
  //   } catch (err) {
  //     console.error("Supervisor/confirm error:", err);

  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text:
  //         err.response?.data?.message ||
  //         err.message ||
  //         "Failed to confirm service.",
  //     });
  //   } finally {
  //     setIsConfirmingCompletion(false);
  //   }
  // };

  const handleDirectApprove = async (addon) => {
    const addOnId = addon?.AddOnID ?? addon?.addOnId;
    const employeeId = userId
      ? Number(userId)
      : Number(localStorage.getItem("userId") || 0);

    if (!addOnId || !employeeId) {
      Swal.fire({
        icon: "warning",
        title: "Invalid data",
        text: "AddOn ID or Employee ID missing.",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Approve Service?",
      text: "Are you sure you want to approve this service completion?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
    });

    if (!confirmResult.isConfirmed) return;

    setIsConfirmingCompletion(true);
    try {
      const formData = new FormData();
      formData.append("AddOnId", addOnId);
      formData.append("EmployeeId", employeeId);
      // Images are not appended here as they are not required

      const res = await axios.post(`${API_BASE}Supervisor/confirm`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status >= 200 && res.status < 300) {
        Swal.fire({
          icon: "success",
          title: "Approved",
          text: "Service approved successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchBookingData();
      }
    } catch (err) {
      console.error("Approval error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to approve service.",
      });
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  // const handleFieldAdvisorConfirm = async (addon) => {
  //   const addOnId = addon?.AddOnID ?? addon?.addOnId;
  //   const employeeId = userId ? Number(userId) : Number(localStorage.getItem("userId") || 0);
  //   if (!addOnId || !employeeId) {
  //     Swal.fire({ icon: "warning", title: "Invalid data", text: "AddOn ID or Employee ID missing." });
  //     return;
  //   }
  //   try {
  //     const res = await axios.post(
  //       `${API_BASE}Supervisor/confirm`,
  //       { addOnId, employeeId },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     if (res.data != null && res.status >= 200 && res.status < 300) {
  //       Swal.fire({ icon: "success", title: "Confirmed", text: "Service confirmed successfully." });
  //       fetchBookingData();
  //     } else {
  //       Swal.fire({ icon: "error", title: "Error", text: res.data?.message || "Failed to confirm." });
  //     }
  //   } catch (err) {
  //     console.error("Supervisor/confirm error:", err);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: err.response?.data?.message || err.message || "Failed to confirm service.",
  //     });
  //   }
  // };

  const buildGaragePayload = () => {
    const bid = Number(bookingId) || bookingData?.BookingID;
    const leadId = bookingData?.LeadId || "";
    if (!bid || !leadId) return null;
    const pickType = garageTask === "carPickup" ? "CarPick" : "CarDrop";
    // const routeType = garageRoute === "customerToDealer" ? "CustomerToDealer" : "DealerToDealer";
    const routeType =
      pickType === "CarDrop"
        ? "DealerToCustomer"
        : garageRoute === "customerToDealer"
          ? "CustomerToDealer"
          : "DealerToDealer";
    let pickFrom = 0;
    let pickTo = 0;
    if (garageRoute === "customerToDealer") {
      if (garageTask === "carPickup") {
        pickFrom = bookingData.CustID ?? 0;
        pickTo = garageDeliverDealer?.value ?? 0;
      } else {
        pickFrom = garagePickupDealer?.value ?? 0;
        pickTo = bookingData.CustID ?? 0;
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
      pickupDate: "",
      pickupTime: "",
      deliveryDate: "",
      deliveryTime: "",
      techID: garageDriver?.value ?? 0,
      assignDate:
        garagePickupDate && garagePickupTime
          ? `${garagePickupDate}T${garagePickupTime}:00`
          : getLocalISODateTime(),
    };
  };

  const handleInitialAssignConfirm = async () => {
    // 1. YOUR VALIDATION BLOCK (Kept exactly as requested)
    if (!garagePickupDate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a date.",
      });
      return;
    }
    if (!garagePickupTime) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a time.",
      });
      return;
    }

    let payload;
    let apiUrl;
    let method = "post";

    // Combine Date and Time for the API (Format: YYYY-MM-DDTHH:mm:ss)
    const combinedAssignDate = `${garagePickupDate}T${garagePickupTime}:00`;

    // 2. Logic based on Assignment Type
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
        assignTimeSlot: garagePickupTime, // Now sending the string from time picker
      };
      apiUrl = `${API_BASE}Supervisor/AssignToFieldAdvisor`;
    } else if (initialAssignType === "technician") {
      if (!selectedInitialTechnician) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a technician before assigning.",
        });
        return;
      }
      if (!selectedServiceType || selectedServiceType.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select at least one service.",
        });
        return;
      }

      // Get comma-separated IDs of selected services
      const selectedServiceNames = selectedServiceType.map((st) => st.value);
      const selectedAddOns = (bookingData?.BookingAddOns || []).filter(
        (addon) =>
          addon.ServiceName && selectedServiceNames.includes(addon.ServiceName),
      );
      const addOnIds =
        selectedAddOns.map((addon) => String(addon.AddOnID)).join(",") || "0";

      payload = {
        bookingID: bookingData.BookingID,
        assignDate: combinedAssignDate,
        role: "Technician",
        techID: selectedInitialTechnician?.value,
        addOnId: addOnIds,
        leadId: bookingData.LeadId,
        ServiceType: "ServiceAtHome",
        assignTimeSlot: garagePickupTime, // Now sending the string from time picker
      };
      apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
    } else {
      // Supervisor logic
      if (!selectedInitialSupervisor) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please select a supervisor before assigning.",
        });
        return;
      }
      payload = {
        bookingID: bookingData.BookingID,
        assignDate: combinedAssignDate,
        role: "Supervisor",
        techID: selectedInitialSupervisor?.value,
        leadId: bookingData.LeadId,
        ServiceType: "ServiceAtHome",
        timeSlot: garagePickupTime, // Now sending the string from time picker
      };
      apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
    }

    // 3. Execution
    setIsInitialAssigning(true);
    try {
      const res = await axios({
        method: method,
        url: apiUrl,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Assigned successfully",
        });

        // Cleanup and Refresh
        setInitialAssignModalOpen(false);
        fetchBookingData();

        // Reset local states
        setSelectedInitialTechnician(null);
        setSelectedInitialSupervisor(null);
        setSelectedInitialFieldAdvisor(null);
        setSelectedServiceType([]);
        setGaragePickupDate("");
        setGaragePickupTime("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to assign",
        });
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text:
          error.response?.data?.message ||
          "Error while assigning. Please try again.",
      });
    } finally {
      setIsInitialAssigning(false);
    }
  };

  const handleInitialyyyAssignConfirm = async () => {
    // Time slot validation for all assignment types
    if (
      !pickupDropReassignTimeSlot ||
      pickupDropReassignTimeSlot.length === 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select at least one time slot",
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

      const assignTimeSlot = pickupDropReassignTimeSlot.join(",");

      payload = {
        bookingIds: [bookingId],
        supervisorHeadId: Number(userId),
        fieldAdvisorId: selectedInitialFieldAdvisor.value,
        assignTimeSlot: assignTimeSlot,
      };
      apiUrl = `${API_BASE}Supervisor/AssignToFieldAdvisor`;
      method = "post";
    } else {
      // Common payload format for technician and supervisor
      // payload = {
      //   bookingID: bookingId,
      //   techID:
      //     initialAssignType === "technician"
      //       ? selectedInitialTechnician?.value
      //       : selectedInitialSupervisor?.value,
      //   assingedTimeSlot: selectedInitialTimeSlot.value,
      //   role: initialAssignType === "technician" ? "Technician" : "Supervisor",
      // };
      //  alert(initialAssignType);
      // API URL and method differ based on assign type
      if (initialAssignType == "technician") {
        if (!selectedInitialTechnician) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please select a technician before assigning.",
          });
          return;
        }
        if (!selectedServiceType || selectedServiceType.length === 0) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please select a service type before assigning.",
          });
          return;
        }

        // Get addOnIds based on selected service names (comma-separated)
        const selectedServiceNames = selectedServiceType.map((st) => st.value);
        const selectedAddOns = (bookingData?.BookingAddOns || []).filter(
          (addon) =>
            addon.ServiceName &&
            selectedServiceNames.includes(addon.ServiceName),
        );
        const addOnIds =
          selectedAddOns.map((addon) => String(addon.AddOnID)).join(",") || "0";
        const assignTimeSlot = pickupDropReassignTimeSlot.join(",");
        const now = new Date();
        const localTime = now.toTimeString().slice(0, 5); // HH:MM format
        const finalTime = garagePickupTime || localTime;

        payload = {
          bookingID: bookingData.BookingID,
          assignDate: garagePickupDate + "T" + finalTime,
          role: "Technician",
          techID: selectedInitialTechnician?.value,
          addOnId: addOnIds,
          leadId: bookingData.LeadId,
          ServiceType: "ServiceAtHome",
          assignTimeSlot: assignTimeSlot,
        };
        apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
        method = "post";
      } else {
        if (!selectedInitialSupervisor) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Please select a supervisor before assigning.",
          });
          return;
        }

        const assignTimeSlot = pickupDropReassignTimeSlot.join(",");

        payload = {
          bookingID: bookingData.BookingID,
          assignDate: garagePickupDate + "T" + finalTime,
          role: "Supervisor",
          techID: selectedInitialSupervisor?.value,
          leadId: bookingData.LeadId,
          ServiceType: "ServiceAtHome",
          timeSlot: assignTimeSlot,
        };
        apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
        method = "post";
      }
    }
    setIsInitialAssigning(true);
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
        setSelectedServiceType([]);
        setInitialAssignType("technician");
        setPickupDropReassignTimeSlot([]);
        setGaragePickupDate("");
        setGaragePickupTime("");
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
    } finally {
      setIsInitialAssigning(false);
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

  const handleRevertService = async (service) => {
    try {
      const confirmRevert = await Swal.fire({
        title: "Are You Sure?",
        text: "Do you want to revert this rejected service?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Revert",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#116D6E",
        cancelButtonColor: "#6c757d",
      });

      if (!confirmRevert.isConfirmed) return;
      setRevertingServiceId(service.Id);
      const payload = {
        // bookingId: service.BookingId,
        // serviceId: service.ServiceId,
        ids: `${service.Id}`,
      };

      const response = await axios.post(
        `${API_BASE}Supervisor/UpdateSupervisorBookingIsActive`,
        payload,
      );

      if (response?.status === 200) {
        await Swal.fire({
          title: "Reverted!",
          text: "Service reverted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        fetchBookingData();
      } else {
        Swal.fire({
          title: "Failed",
          text: "Unable to revert the service.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Revert error:", error);

      Swal.fire({
        title: "Error",
        text: "Something went wrong while reverting the service.",
        icon: "error",
      });
    } finally {
      setRevertingServiceId(null);
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
        if (response.data.success) {
          Swal.fire(
            "Success!",
            "Service status updated successfully.",
            "success",
          );
        } else {
          Swal.fire(
            "Error",
            response.data.message || "Failed to update service completion",
            "error",
          );
        }

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

  const CheckServiceAmount = () => {
    const zeroAmountServices = [
      ...(bookingData?.BookingAddOns || []),
      ...(bookingData?.SupervisorBookings || []),
    ].filter((item) => {
      const total = Number(
        item.TotalPrice ??
          Number(item.Price || 0) +
            Number(item.GSTAmount || 0) +
            Number(item.LabourCharges || 0) -
            Number(item.CouponAmount || 0),
      );

      return total === 0;
    });

    console.log(zeroAmountServices, "zeroAmountServices");
    if (zeroAmountServices.length > 0) {
      const serviceNames = zeroAmountServices
        .map((s) => s.ServiceName || s.Name || "Unnamed Service")
        .join("<br>");

      Swal.fire({
        icon: "warning",
        title: "Invoice Cannot Be Generated",
        html: `
    Please update the price for the following services before generating the invoice:<br><br>
    ${serviceNames}
  `,
      });

      return false;
    }
    // navigate(`/invoice-view/${bookingData?.BookingID}?type=Estimation`);
    return true;
  };

  const showGenerateInvoiceConfirm = (name, generateHandler, invoiceType) => {
    const zeroAmountServices = [
      ...(bookingData?.BookingAddOns || []),
      ...(bookingData?.SupervisorBookings || []),
    ].filter((item) => {
      const total = Number(
        item.TotalPrice ??
          Number(item.Price || 0) +
            Number(item.GSTAmount || 0) +
            Number(item.LabourCharges || 0) -
            Number(item.CouponAmount || 0),
      );

      return total === 0;
    });

    if (zeroAmountServices.length > 0) {
      const serviceNames = zeroAmountServices
        .map((s) => s.ServiceName || s.Name || "Unnamed Service")
        .join("<br>");

      Swal.fire({
        icon: "warning",
        title: "Invoice Cannot Be Generated",
        html: `
    Please update the price for the following services before generating the invoice:<br><br>
    ${serviceNames}
  `,
      });

      return;
    }
    Swal.fire({
      title: name,
      html: `Do you want to generate ${invoiceType?.toLowerCase()} invoice or view existing invoice?`,
      icon: "question",
      showDenyButton: true,
      confirmButtonText: "Yes, generate",
      denyButtonText: "View invoice",
    }).then((result) => {
      if (result.isConfirmed) {
        generateHandler();
      } else if (result.isDenied) {
        let url = `/invoice-view/${bookingData.BookingID}?type=${encodeURIComponent(invoiceType)}`;

        // If Dealer type, find the dealerId from the addons and append to URL
        if (invoiceType.toLowerCase() === "dealer") {
          const dealerID = bookingData?.BookingAddOns?.find(
            (addon) => addon?.DealerID,
          )?.DealerID;
          if (dealerID) {
            url += `&dealerId=${dealerID}`;
          }
        }
        navigate(url);
      }
    });
  };

  const handleGenerateFinalInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }
    setIsGeneratingFinal(true);
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
    } finally {
      setIsGeneratingFinal(false);
    }
  };
  const handleGenerateEstimationInvoice = async () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }

    const supervisorBookings = bookingData?.SupervisorBookings || [];

    // if (!supervisorBookings.length) {
    //   Swal.fire(
    //     "Error",
    //     "No supervisor services found for this booking.",
    //     "error",
    //   );
    //   return;
    // }

    const servicesWithoutDealer = supervisorBookings.filter(
      (s) => !s.DealerID && !s.DealerName,
    );

    if (servicesWithoutDealer.length > 0) {
      const serviceNames = servicesWithoutDealer
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("<br>");

      Swal.fire({
        icon: "warning",
        title: "Dealer not assigned",
        html: `
          Please assign a dealer for the following services before generating the estimation invoice:<br><br>
          ${serviceNames}
        `,
      });
      return;
    }

    const notApprovedByDealer = supervisorBookings.filter((s) => {
      const dealerStatus = (s.IsDealer_Confirm ?? s.isDealer_Confirm)
        ?.toString()
        .trim()
        .toLowerCase();
      return dealerStatus !== "approved";
    });

    if (notApprovedByDealer.length > 0) {
      const serviceNames = notApprovedByDealer
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("<br>");

      Swal.fire({
        icon: "warning",
        title: "Dealer has not approved services",
        html: `
          The following services are not yet approved by the dealer. Please get them approved before generating the estimation invoice:<br><br>
          ${serviceNames}
        `,
      });
      return;
    }

    const zeroTotalSupervisorServices = supervisorBookings.filter((s) => {
      const total = Number(
        s.TotalPrice ??
          Number(s.Price || 0) +
            Number(s.GSTAmount || 0) +
            Number(s.LabourCharges || 0) -
            Number(s.CouponAmount || 0),
      );
      return total === 0;
    });

    if (zeroTotalSupervisorServices.length > 0) {
      const serviceNames = zeroTotalSupervisorServices
        .map((s) => s.ServiceName || "Unnamed Service")
        .join("<br>");

      Swal.fire({
        icon: "warning",
        title: "Invalid service amount",
        html: `
          The following supervisor services have a total amount of 0. Please update their prices before generating the estimation invoice:<br><br>
          ${serviceNames}
        `,
      });
      return;
    }
    setIsGeneratingEstimation(true);
    try {
      const res = await axios.post(
        `${API_BASE}Leads/GenerateEstimationInvoice`,
        {
          bookingID: bookingData.BookingID,
        },
        // const res = await axios.get(
        //   `${API_BASE}Leads/ViewEstimationInvoice?bookingId=${bookingData.BookingID}`,
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
    } finally {
      setIsGeneratingEstimation(false);
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
    setIsGeneratingDealer(true);
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
      // navigate(`/invoice-view/${bookingData.BookingID}?type=Dealer`);
      navigate(
        `/invoice-view/${bookingData.BookingID}?type=Dealer&dealerId=${dealerId}`,
      );
    } catch (error) {
      console.error("Generate Dealer Invoice Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to generate Dealer invoice.",
        "error",
      );
    } finally {
      setIsGeneratingDealer(false);
    }
  };

  // Ensure basic details (booking date, address, supervisor) are filled before key actions
  const ensureBasicDetails = () => {
    const fields = [
      (!bookingData?.BookingDate || !bookingData?.TimeSlot) &&
        "Booking date & time slot",
      !bookingData?.FullAddress && "Customer address",
      !(
        bookingData?.SupervisorHeadName ||
        bookingData?.SupervisorHeadPhoneNumber
      ) && "Supervisor assignment",
    ].filter(Boolean);

    if (fields.length) {
      Swal.fire({
        icon: "warning",
        title: "Details required",
        html: `
        <div class='text-center small'>
          <p class='mb-1'>Please enter following details before continuing:</p> <br/>
          <ul class='mb-2 ps-3'> <strong>
            ${fields.map((f) => `<li>${f}</li>`).join("")}
          </strong> </ul>
          <br/>
          <p class='mb-0'>Click <strong>Enter Details</strong> to fill them now.</p>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Enter Details",
        cancelButtonText: "Cancel",
        customClass: {
          confirmButton:
            "btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center me-2",
          cancelButton: "btn btn-secondary btn-sm ms-2",
        },
        buttonsStyling: false,
      }).then((res) => {
        if (res.isConfirmed && bookingData?.BookingID) {
          navigate(`/booking-basic/${bookingData.BookingID}`);
        }
      });

      return false;
    }
    return true;
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentTypeChoice(null);
    setPaymentMode("");
    setPayAmount("");
    setPaymentFile(null);
    setIsDiscountApplicable(false);
    setDiscountAmount("");
    setPaymentEmail("");
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

    const missingDealer = [
      ...addOnsWithoutDealer,
      ...supervisorBookingsWithoutDealer,
    ];
    if (missingDealer.length > 0) {
      const names = missingDealer
        .map((item) => item?.ServiceName || item?.Description || "Service")
        .filter(Boolean);
      Swal.fire({
        icon: "warning",
        title: "Dealer Selection Required",
        html: `Please select dealers for all services before confirmation.<br/><br/><strong>Dealer selection missing  for below services:</strong><br/><br/>${names.join("<br/>")}`,
      });
      return;
    }

    const isSupervisorConfirmed = (item) =>
      item?.IsSupervisor_Confirm === 1 || item?.IsSupervisor_Confirm === true;

    const addOnsNotConfirmed = (bookingData?.BookingAddOns || []).filter(
      (item) => !isSupervisorConfirmed(item),
    );
    const supervisorBookingsNotConfirmed = (
      bookingData?.SupervisorBookings || []
    ).filter((item) => !isSupervisorConfirmed(item));

    const missingConfirm = [
      ...addOnsNotConfirmed,
      ...supervisorBookingsNotConfirmed,
    ];
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

  const handleServiceCheckboxChange = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
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

    if (selectedServiceIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Select Services",
        text: "Please select at least one service to confirm.",
      });
      return;
    }
    setIsConfirmingCustomer(true);
    try {
      // ✅ Convert selected IDs to comma string
      const addOnIdsString = selectedServiceIds.join(",");

      // Upload file if exists
      if (confirmationFile) {
        const formData = new FormData();
        formData.append("BookingID", bookingData.BookingID);
        formData.append("UploadedBy", duserId);
        formData.append("CustID", bookingData.CustID);
        formData.append("ImageUploadType", "CustomerConfirmation");
        formData.append("ImageFile", confirmationFile);

        await axios.post(
          `${API_BASE}Supervisor/CustomerConfirmationImages`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      // ✅ Correct API
      await axios.post(
        `${API_BASE}Supervisor/MoveSupervisorBookings?addOnIds=${addOnIdsString}&custId=${bookingData.CustID}`,
        {
          confirmDescription: confirmationDescription.trim(),
          confirmedBy: roleIdInt.confirmedBy,
          confirmRole: roleName,
          status: "Confirmed",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.fire("Success", "Customer Confirmation Successful.", "success");

      setShowCustomerConfirmationModal(false);
      setConfirmationDescription("");
      setConfirmationFile(null);
      setSelectedServiceIds([]); // reset selection

      fetchBookingData();
    } catch (error) {
      console.error("Customer Confirmation Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || " Customer Confirmation Failed.",
        "error",
      );
    } finally {
      setIsConfirmingCustomer(false);
    }
  };

  const handleRejectServiceCheckboxChange = (id) => {
    setRejectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const handleCustomerRejection = () => {
    if (!bookingData?.BookingID) {
      Swal.fire("Error", "Booking data not available.", "error");
      return;
    }

    const hasDealerId = (item) => {
      const id = item?.DealerID;
      return id != null && id !== "" && Number(id) !== 0;
    };

    // Filter services missing dealers
    const addOnsWithoutDealer = (bookingData?.BookingAddOns || []).filter(
      (item) => !hasDealerId(item),
    );
    const supervisorBookingsWithoutDealer = (
      bookingData?.SupervisorBookings || []
    ).filter((item) => !hasDealerId(item));

    const missingDealer = [
      ...addOnsWithoutDealer,
      ...supervisorBookingsWithoutDealer,
    ];

    if (missingDealer.length > 0) {
      const names = missingDealer
        .map((item) => item?.ServiceName || item?.Description || "Service")
        .filter(Boolean);
      Swal.fire({
        icon: "warning",
        title: "Dealer Selection Required",
        html: `<strong>Dealer selection missing for below services:</strong><br/><br/>${names.join("<br/>")}`,
      });
      return;
    }

    const isSupervisorConfirmed = (item) =>
      item?.IsSupervisor_Confirm === 1 || item?.IsSupervisor_Confirm === true;

    // Filter services not confirmed by supervisor
    const addOnsNotConfirmed = (bookingData?.BookingAddOns || []).filter(
      (item) => !isSupervisorConfirmed(item),
    );
    const supervisorBookingsNotConfirmed = (
      bookingData?.SupervisorBookings || []
    ).filter((item) => !isSupervisorConfirmed(item));

    const missingConfirm = [
      ...addOnsNotConfirmed,
      ...supervisorBookingsNotConfirmed,
    ];

    if (missingConfirm.length > 0) {
      const names = missingConfirm
        .map((item) => item?.ServiceName || item?.Description || "Service")
        .filter(Boolean);
      Swal.fire({
        icon: "error",
        title: "Supervisor confirmation required",
        html: `All services must be confirmed by supervisor before customer rejection.<br/><br/><strong>Pending supervisor confirmation for:</strong><br/>${names.join("<br/>")}`,
      });
      return;
    }

    // If all validations pass, open the rejection modal
    setRejectionDescription("");
    setRejectedServiceIds([]);
    setShowCustomerRejectionModal(true);
  };

  const handleCustomerRejectionSubmit = async () => {
    if (!rejectionDescription || rejectionDescription.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Reason Required",
        text: "Please provide a reason for the rejection.",
      });
      return;
    }

    if (rejectedServiceIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Select Services",
        text: "Please select at least one service to reject.",
      });
      return;
    }
    setIsRejectingCustomer(true);
    try {
      // Convert selected IDs to comma string
      const addOnIdsString = rejectedServiceIds.join(",");
      await axios.post(
        `${API_BASE}Supervisor/MoveSupervisorBookings?addOnIds=${addOnIdsString}&custId=${bookingData.CustID}`,
        {
          confirmDescription: rejectionDescription.trim(),
          confirmedBy: roleIdInt.confirmedBy,
          confirmRole: roleName,
          status: "Reject",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      Swal.fire("Success", "Customer Rejection Successful.", "success");

      setShowCustomerRejectionModal(false);
      setRejectionDescription("");
      setRejectedServiceIds([]);

      fetchBookingData();
    } catch (error) {
      console.error("Customer Rejection Error:", error);

      Swal.fire(
        "Error",
        error?.response?.data?.message || "Customer Rejection Failed.",
        "error",
      );
    } finally {
      setIsRejectingCustomer(false);
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
  const couponAmount = Number(bookingData?.CouponAmount ?? 0) || 0;
  const alreadyPaidDisplay = alreadyPaid + couponAmount;
  const remainingAmount = Math.max(
    Number((totalAmount - alreadyPaid).toFixed(2)),
    0,
  );

  const hasAtLeastOneService =
    bookingData?.BookingAddOns?.length > 0 ||
    bookingData?.SupervisorBookings?.length > 0;
  const isSupervisorConfirmed = (item) =>
    item?.IsSupervisor_Confirm === 1 || item?.IsSupervisor_Confirm === true;
  const allSupervisorConfirmed =
    hasAtLeastOneService &&
    (bookingData?.BookingAddOns || []).every(isSupervisorConfirmed) &&
    (bookingData?.SupervisorBookings || []).every(isSupervisorConfirmed);
  const customerRejectedBookings = bookingData?.CustomerRejectedBookings || [];
  const hasOnlyZeroValueRejectedServices =
    !hasAtLeastOneService &&
    customerRejectedBookings.length > 0 &&
    customerRejectedBookings.every((item) => {
      const customerTotal = Number(
        item.TotalPrice ??
          Number(item.Price || 0) +
            Number(item.GSTAmount || 0) +
            Number(item.LabourCharges || 0) -
            Number(item.CouponAmount || 0),
      );
      const dealerTotal = Number(
        Number(item.DealerSparePrice || 0) +
          Number(item.DealerPrice || 0) +
          Number(item.DealerGSTAmount || 0),
      );

      return customerTotal === 0 && dealerTotal === 0;
    });
  const showEstimationButton = allSupervisorConfirmed;
  const showFinalButton =
    remainingAmount === 0 &&
    hasAtLeastOneService &&
    allSupervisorConfirmed &&
    totalAmount > 0;
  const showEnterPaymentButton =
    remainingAmount > 0 &&
    hasAtLeastOneService &&
    allSupervisorConfirmed &&
    totalAmount > 0;

  // const showDealerInvoiceButton =
  //   hasAtLeastOneService && allSupervisorConfirmed && totalAmount > 0;

  // 1. Get all unique dealer IDs from the booking
  const uniqueDealerIds = Array.from(
    new Set(
      [
        ...(bookingData?.BookingAddOns || []),
        ...(bookingData?.SupervisorBookings || []),
      ]
        .map((item) => String(item.DealerID || ""))
        .filter((id) => id !== "" && id !== "0"),
    ),
  );

  // 2. Filter out the MyCarBuddy internal ID (1)
  const partnerDealers = uniqueDealerIds.filter((id) => id !== "1");

  // 3. Show button ONLY if there is at least one partner dealer (External Dealer)
  const showDealerInvoiceButton =
    hasAtLeastOneService &&
    allSupervisorConfirmed &&
    totalAmount > 0 &&
    partnerDealers.length > 0; // If Dealer 1 and Dealer 55 both exist, this will be TRUE.

  // 4. Get the first actual partner dealer ID to use in the link
  const firstPartnerDealerId = partnerDealers[0];

  const confirmationData = bookingData?.BookingAddOns?.find(
    (item) =>
      item?.ConfirmedBy && item?.ConfirmRole && item?.ConfirmDescription,
  );

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true); // start loader
      const isOnline = paymentTypeChoice === "online";
      if (!isOnline && !paymentMode) {
        Swal.fire("Validation", "Please select payment mode", "warning");
        return;
      }

      if (!isOnline && !paymentFile) {
        Swal.fire("Validation", "Please attach payment proof file", "warning");
        return;
      }

      if (!payAmount || payAmount <= 0) {
        Swal.fire("Validation", "Enter valid amount", "warning");
        return;
      }

      if (Number(discountAmount || 0) > Number(payAmount || 0)) {
        Swal.fire(
          "Validation",
          "Discount cannot exceed entered amount",
          "warning",
        );
        return;
      }

      if (payAmount > remainingAmount) {
        Swal.fire(
          "Validation",
          `Amount cannot be greater than remaining balance ₹${Number(remainingAmount || 0).toFixed(2)}.`,
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

      // ✅ Validate email for online payment
      // if (isOnline && !paymentEmail) {
      //   Swal.fire("Validation", "Please enter email address", "warning");
      //   return;
      // }

      // ✅ Validate email format for online payment
      // if (isOnline && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentEmail)) {
      //   Swal.fire("Validation", "Please enter valid email address", "warning");
      //   return;
      // }

      // ✅ If online payment, call final-payment-link API first
      if (isOnline) {
        const onlinePaymentPayload = {
          bookingId: bookingData.BookingID,
          paymentAmount: finalAmount,
          phoneNumber: bookingData.PhoneNumber,
          email: bookingData.CustEmail,
          couponCode: selectedCoupon || "",
          couponAmount: discountAmount || 0,
          customerId: bookingData.CustID,
        };

        try {
          const onlineRes = await axios.post(
            `${API_BASE}Payments/final-payment-link`,
            onlinePaymentPayload,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (onlineRes?.data?.success || onlineRes?.data?.paymentLinkUrl) {
            // Payment link created successfully
            const paymentLink =
              onlineRes.data.paymentLinkUrl || onlineRes.data.paymentLinkUrl;

            Swal.fire({
              title: "Payment Link Sent",
              text: "Your payment link has been send to customer email and phone number.",
              icon: "success",
              confirmButtonText: "Ok",
            }).then(() => {
              // if (paymentLink) {
              //   window.open(paymentLink, "_blank");
              // }
              setShowPaymentModal(false);
              fetchBookingData(); // Refresh booking data
            });
            return;
          } else {
            Swal.fire("Error", "Failed to generate payment link", "error");
            return;
          }
        } catch (onlineErr) {
          console.error("Online Payment Error:", onlineErr);
          Swal.fire(
            "Error",
            onlineErr?.response?.data?.message ||
              "Failed to initiate online payment",
            "error",
          );
          return;
        }
      }

      // ✅ For offline payment, use FormData
      const formData = new FormData();
      formData.append("bookingID", bookingData.BookingID);
      formData.append("amountPaid", finalAmount);
      formData.append("paymentMode", paymentMode);
      formData.append("paymentStatus", "Success");
      formData.append("paymentType", "Static");
      formData.append("couponAmount", discountAmount || 0);
      formData.append("couponCode", selectedCoupon || "");
      formData.append("createdBy", userId);
      formData.append("ProofAttachment", paymentFile); // file

      const res = await axios.post(
        `${API_BASE}Payments/InsertBookingAddOnsPayment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res?.data?.status) {
        Swal.fire("Success", "Payment updated successfully", "success");
        setShowPaymentModal(false);
        setPaymentFile(null);
        setIsPaid(true);
        fetchBookingData(); // refresh booking & payments
      } else {
        Swal.fire("Error", "Payment updation failed", "error");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch coupons from API and filter by min booking amount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await axios.get(
          "https://dev-api.mycarsbuddy.com/api/Coupons",
        );
        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.jsonResult || [];
        const total = Number(totalAmount || 0);
        const list = raw
          .filter(
            (c) =>
              c.IsActive &&
              c.Status &&
              Number(c.MinBookingAmount || 0) <= total,
          )
          .map((c) => ({
            code: c.Code,
            label:
              c.DiscountType === "percentage"
                ? `${c.Code} - ${c.DiscountValue}%`
                : `${c.Code} - ₹${c.DiscountValue}`,
            discountType: c.DiscountType,
            discountValue: Number(c.DiscountValue || 0),
          }));
        // Always include a no-coupon option
        setCouponOffers([
          {
            code: "",
            label: "No coupon",
            discountType: null,
            discountValue: 0,
          },
          ...list,
        ]);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
        setCouponOffers([
          {
            code: "",
            label: "No coupon",
            discountType: null,
            discountValue: 0,
          },
        ]);
      }
    };
    fetchCoupons();
  }, [totalAmount]);

  // Apply coupon when selection or pay amount changes
  useEffect(() => {
    const offer = couponOffers.find((c) => c.code === selectedCoupon);
    const pay = Number(payAmount || 0);
    if (!offer || !selectedCoupon) {
      setDiscountAmount("");
      return;
    }
    let applied = 0;
    if (offer.discountType === "percentage") {
      applied = (pay * Number(offer.discountValue || 0)) / 100;
    } else {
      applied = Number(offer.discountValue || 0);
    }
    applied = Math.min(applied, pay);
    setDiscountAmount(Number(applied.toFixed(2)));
  }, [selectedCoupon, payAmount, couponOffers]);

  // Auto-set pickup dealer from last CarPickUpDelivery entry, or fallback to dealer from BookingAddOns
  useEffect(() => {
    if (
      garageStep === "details" &&
      (garageTask === "carDrop" || garageRoute === "dealerToDealer") &&
      !garagePickupDealer
    ) {
      if (currentGarageDealerOption) {
        setGaragePickupDealer(currentGarageDealerOption);
        return;
      }
      const carPickUpDelivery = bookingData?.CarPickUpDelivery || [];
      if (carPickUpDelivery.length > 0) {
        const lastEntry = carPickUpDelivery[carPickUpDelivery.length - 1];
        const pickedDealerId = lastEntry.PickTo || lastEntry.PickFrom;

        if (pickedDealerId) {
          const dealerOption = garageDealerOptions.find(
            (opt) => opt.value === Number(pickedDealerId),
          );
          if (dealerOption) {
            setGaragePickupDealer(dealerOption);
            return;
          }
        }
      }
      // Fallback: use dealer from BookingAddOns (where car is / service is done)
      if (garageDealerOptions.length > 0) {
        setGaragePickupDealer(garageDealerOptions[0]);
      }
    }
  }, [
    garageStep,
    garageTask,
    garageRoute,
    bookingData,
    garageDealerOptions,
    currentGarageDealerOption,
    garagePickupDealer,
  ]);

  useEffect(() => {
    if (
      garageStep === "details" &&
      garageRoute === "dealerToDealer" &&
      pendingNextGarageDealerOptions.length === 1 &&
      !garageDeliverDealer
    ) {
      setGarageDeliverDealer(pendingNextGarageDealerOptions[0]);
    }
  }, [
    garageStep,
    garageRoute,
    pendingNextGarageDealerOptions,
    garageDeliverDealer,
  ]);

  // const handleSubmitPickupDetails = async () => {
  //   if (!pickupDate || !pickupTime || !dropDate || !dropTime) {
  //     Swal.fire(
  //       "Validation",
  //       "Please fill all pickup and drop details",
  //       "warning",
  //     );
  //     return;
  //   }

  //   const payload = {
  //     bookingID: bookingData.BookingID,
  //     leadId: bookingData.LeadId,
  //     pickupDate,
  //     pickupTime: pickupTime + ":00",
  //     deliveryDate: dropDate,
  //     deliveryTime: dropTime + ":00",
  //   };

  //   try {
  //     const res = await axios.post(
  //       `${API_BASE}Supervisor/SavePickupDeliveryTime`,
  //       payload,
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );

  //     if (res.data.success || res.status === 200) {
  //       Swal.fire(
  //         "Success",
  //         "Pickup and Drop details saved successfully!",
  //         "success",
  //       );
  //       // Reset form
  //       setPickupDate("");
  //       setPickupTime("");
  //       setDropDate("");
  //       setDropTime("");
  //       fetchBookingData(); // Refresh booking data
  //     } else {
  //       Swal.fire(
  //         "Error",
  //         res.data.message || "Failed to save details",
  //         "error",
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error saving pickup details:", error);
  //     Swal.fire("Error", "Failed to save pickup and delivery details", "error");
  //   }
  // };

  const isPastTimeToday = (selectedTime) => {
    const now = new Date();
    const [h, m] = selectedTime.split(":");
    const selected = new Date();
    selected.setHours(h, m, 0, 0);

    return selected < now;
  };
  const displayDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const getDateValue = (value) => {
    if (!value) return 0;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };
  const getCustomerPartsTotal = (item = {}) =>
    Number(item.ServicePrice ?? item.Price ?? 0);
  const getCustomerLabourTotal = (item = {}) => Number(item.LabourCharges || 0);
  const getCustomerGstTotal = (item = {}) =>
    Number(item.GSTPrice ?? item.GSTAmount ?? 0);
  const getCustomerServiceTotal = (item = {}) => {
    const directTotal = Number(item.TotalPrice ?? 0);
    if (directTotal > 0) return directTotal;
    return (
      getCustomerPartsTotal(item) +
      getCustomerLabourTotal(item) +
      getCustomerGstTotal(item)
    );
  };
  const getDealerPartsTotal = (item = {}) => Number(item.DealerSparePrice || 0);
  const getDealerLabourTotal = (item = {}) => Number(item.DealerPrice || 0);
  const getDealerGstTotal = (item = {}) => Number(item.DealerGSTAmount || 0);
  const getDealerServiceTotal = (item = {}) =>
    getDealerPartsTotal(item) +
    getDealerLabourTotal(item) +
    getDealerGstTotal(item);
  const getMarginPercentValue = (item = {}) => Number(item.Percentage ?? 0);
  const getMarginAmountValue = (item = {}) => {
    const directAmount = Number(item.Our_Earnings ?? 0);
    if (directAmount > 0) return directAmount;

    const percent = getMarginPercentValue(item);
    const dealerTotal = getDealerServiceTotal(item);

    return percent > 0 && dealerTotal > 0
      ? Number(((dealerTotal * percent) / 100).toFixed(2))
      : 0;
  };
  const getIncludeNames = (item = {}) => {
    const includes = item.Includes;
    if (!includes) return [];
    if (Array.isArray(includes)) {
      return includes
        .map((inc) => inc?.IncludeName || inc?.name || inc)
        .filter(Boolean);
    }
    if (typeof includes === "string") {
      return includes
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [];
  };
  const normalizedReviewerRole = (
    roleName ||
    role ||
    localStorage.getItem("role") ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();
  const canReviewDealerCompletedService = [
    "admin",
    "field advisor",
    "supervisor",
  ].some((allowedRole) => normalizedReviewerRole.includes(allowedRole));

  const serviceStages = (() => {
    if (!bookingData) return [];

    const addOns = bookingData.BookingAddOns || [];
    const carPickUpDelivery = bookingData.CarPickUpDelivery || [];
    const payments = bookingData.Payments || [];

    const confirmedAddOns = addOns.filter((a) => a.IsSupervisor_Confirm === 1);
    const pendingAddOns = (bookingData.BookingsTempAddons || []).filter(
      (a) => a.IsSupervisor_Confirm !== 1,
    );
    const confirmedLength = confirmedAddOns.length;
    const pendingLength = pendingAddOns.length;

    const totalServices = addOns.length;
    const completedServices = addOns.filter((a) => a.Is_Completed).length;
    const normalizeTimelineValue = (value) =>
      (value || "").toString().trim().toLowerCase().replace(/\s+/g, "");
    const normalizedBookingWorkflowStatus = normalizeTimelineValue(
      bookingData?.BookingStatus,
    );
    const normalizedServiceStatuses = addOns.map((item) =>
      normalizeTimelineValue(
        item?.StatusName ??
          item?.statusName ??
          item?.AddOnStatus ??
          item?.addOnStatus,
      ),
    );
    const normalizedPaymentStatuses = payments.map((payment) =>
      normalizeTimelineValue(payment?.PaymentStatus),
    );
    const hasServiceInProgressSignal =
      normalizedBookingWorkflowStatus.includes("serviceinprogress") ||
      normalizedServiceStatuses.some(
        (status) =>
          status.includes("inprogress") || status.includes("serviceinprogress"),
      );
    const hasServiceStartedSignal =
      normalizedBookingWorkflowStatus.includes("servicestart") ||
      normalizedServiceStatuses.some((status) => status.includes("started"));
    const hasAnyServiceProgress =
      hasServiceInProgressSignal ||
      hasServiceStartedSignal ||
      completedServices > 0;
    const hasCompletedPayment = normalizedPaymentStatuses.some(
      (status) => status === "success" || status === "paid",
    );
    const hasPartialPayment =
      !hasCompletedPayment &&
      (normalizedPaymentStatuses.some((status) => status === "partialpaid") ||
        payments.some((payment) => Number(payment?.AmountPaid || 0) > 0));

    const leadStage = {
      id: "lead-created",
      title: "Lead created",
      icon: "mdi:lead-pencil",
      date: bookingData.LeadCreatedDate,
      status: "completed",
      details: `Lead ID: ${bookingData.LeadId ?? "—"}`,
    };

    const bookingStage = {
      id: "booking-created",
      title: "Booking created",
      icon: "mdi:calendar-plus",
      date: bookingData.BookingDate,
      status: "completed",
      details: `Booking ID: ${bookingData.BookingTrackID ?? "—"}`,
    };

    // const assignStage = {
    //   id: "assign-stage",
    //   title: "Supervisor/Field Advisor Assigned",
    //   icon: "mdi:account-group",
    //   date:
    //     bookingData.SupervisorHeadAssignDate ||
    //     bookingData.FieldAdvisorAssignDate,
    //   status:
    //     bookingData.SupervisorHeadName || bookingData.FieldAdvisorName
    //       ? "completed"
    //       : "pending",
    //   details: `${bookingData.SupervisorHeadName || "—"} / ${
    //     bookingData.FieldAdvisorName || "—"
    //   }`,
    // };

    const supervisorStage = {
      id: "supervisor-assigned",
      title: bookingData.SupervisorHeadName
        ? "Supervisor assigned"
        : "Supervisor assignment pending",
      icon: "mdi:account-tie",
      date: bookingData.SupervisorHeadAssignDate,
      status: bookingData.SupervisorHeadName ? "completed" : "pending",
      details: bookingData.SupervisorHeadName || "—",
    };

    const fieldAdvisorStage = {
      id: "field-advisor-assigned",
      title: bookingData.FieldAdvisorName
        ? "Field advisor assigned"
        : "Field advisor assignment",
      icon: "mdi:account-hard-hat",
      date: bookingData.FieldAdvisorAssignDate,
      status: bookingData.FieldAdvisorName ? "completed" : "pending",
      details: bookingData.FieldAdvisorName || "—",
    };
    const allDealerItems = [
      ...(bookingData?.BookingAddOns || []),
      ...(bookingData?.SupervisorBookings || []),
    ];
    const assignedDealerEntries = allDealerItems.filter(
      (item) =>
        (item?.DealerID != null && item?.DealerID !== "") || item?.DealerName,
    );
    const assignedDealerCount = new Set(
      assignedDealerEntries.map(
        (item) =>
          `${item?.DealerID ?? "no-id"}-${item?.DealerName ?? "no-name"}`,
      ),
    ).size;
    const dealerApprovalCount = allDealerItems.filter(
      (a) => a.IsDealer_Confirm === "Approved",
    ).length;
    const dealerAssignmentStage = {
      id: "dealer-assignment",
      title:
        assignedDealerCount > 0
          ? "Dealer assigned"
          : "Dealer assignment pending",
      icon: "mdi:store-check-outline",
      date:
        assignedDealerEntries[0]?.UpdatedDate ||
        assignedDealerEntries[0]?.CreatedDate,
      status: assignedDealerCount > 0 ? "completed" : "pending",
      details:
        assignedDealerCount > 0
          ? `${assignedDealerCount} dealer(s) assigned`
          : "No dealers assigned",
    };
    const dealerApprovalStage = {
      id: "dealer-confirmation",
      title:
        allDealerItems.length === 0
          ? "Dealer approval pending"
          : allDealerItems.every((a) => a.IsDealer_Confirm === "Approved")
            ? "Dealer approval completed"
            : allDealerItems.some((a) => a.IsDealer_Confirm === "Rejected")
              ? "Dealer approval failed"
              : "Dealer approval in progress",
      icon: "mdi:handshake",
      date: allDealerItems.find((a) => a.IsDealer_Confirm)?.UpdatedDate,
      status:
        allDealerItems.length === 0
          ? "pending"
          : allDealerItems.every((a) => a.IsDealer_Confirm === "Approved")
            ? "completed"
            : allDealerItems.some((a) => a.IsDealer_Confirm === "Rejected")
              ? "failed"
              : "in-progress",
      details:
        allDealerItems.length === 0
          ? "No dealers"
          : `${dealerApprovalCount} Serv(s) Approved / ${allDealerItems.length - dealerApprovalCount} Serv(s) Not Approved`,
    };

    // const dealerApprovalCount = addOns.filter(
    //   (a) => a.IsDealer_Confirm === "Approved",
    // ).length;
    // const dealerStage = {
    //   id: "dealer-confirmation",
    //   title: "Dealer Confirmation",
    //   icon: "mdi:handshake",
    //   date: addOns.find((a) => a.IsDealer_Confirm)?.UpdatedDate,
    //   status:
    //     addOns.length === 0
    //       ? "pending"
    //       : addOns.every((a) => a.IsDealer_Confirm === "Approved")
    //         ? "completed"
    //         : addOns.some((a) => a.IsDealer_Confirm === "Rejected")
    //           ? "failed"
    //           : "in-progress",
    //   details:
    //     addOns.length === 0
    //       ? "No dealers"
    //       : `${dealerApprovalCount} dealers confirmed services`,
    // };

    const customerStage = {
      id: "customer-confirmation",
      title:
        confirmedLength === 0 && pendingLength === 0
          ? "Customer confirmation pending"
          : confirmedLength > 0
            ? pendingLength === 0
              ? "Customer confirmed"
              : "Customer confirmation in progress"
            : "Customer confirmation pending",
      icon: "mdi:account-check",
      date: addOns.find((a) => a.ConfirmRole)?.ConfirmDate,
      status:
        confirmedLength === 0 && pendingLength === 0
          ? "pending"
          : confirmedLength > 0
            ? pendingLength === 0
              ? "completed"
              : "in-progress"
            : "pending",
      details: `${confirmedLength} confirmed / ${pendingLength} pending`,
    };

    const technicianStage = {
      id: "technician-assigned",
      title:
        carPickUpDelivery.length > 0
          ? "Technician assigned"
          : "Technician assignment",
      icon: "mdi:engineer",
      date: carPickUpDelivery[0]?.AssignDate,
      status: carPickUpDelivery.length > 0 ? "completed" : "pending",
      details:
        carPickUpDelivery
          .map((p) => p.TechnicinaName)
          .filter(Boolean)
          .join(", ") || "—",
    };

    const serviceCompletedStage = {
      id: "service-completed",
      title:
        totalServices === 0
          ? "Service pending"
          : completedServices === totalServices
            ? "Services completed"
            : hasAnyServiceProgress
              ? "Service in progress"
              : "Service pending",
      icon: "mdi:car-check",
      date: addOns.find((a) => a.Is_Completed)?.CompletedDate,
      status:
        totalServices === 0
          ? "pending"
          : completedServices === totalServices
            ? "completed"
            : hasAnyServiceProgress
              ? "in-progress"
              : "pending",
      details:
        totalServices === 0
          ? "No services"
          : `${completedServices}/${totalServices} services`,
    };

    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.AmountPaid || 0),
      0,
    );
    const paymentStage = {
      id: "payment-done",
      title: hasCompletedPayment
        ? "Payment completed"
        : hasPartialPayment
          ? "Payment in progress"
          : "Payment pending",
      icon: "mdi:credit-card-check",
      date: payments[payments.length - 1]?.PaymentDate,
      status: hasCompletedPayment
        ? "completed"
        : hasPartialPayment
          ? "in-progress"
          : "pending",
      details: `₹ ${totalPaid.toFixed(2)}`,
    };

    paymentStage.details =
      totalPaid > 0 ? `Paid ₹${totalPaid.toFixed(2)}` : "Awaiting payment";

    const bookingDoneStage = {
      id: "booking-done",
      title:
        bookingData.BookingStatus === "Completed"
          ? "Booking completed"
          : "Booking completion pending",
      icon: "mdi:check-circle",
      date: bookingData.BookingCompletedDate,
      status:
        bookingData.BookingStatus === "Completed" ? "completed" : "pending",
      details: bookingData.BookingStatus || "—",
    };

    let stages = [
      leadStage,
      bookingStage,
      // assignStage,
      supervisorStage,
      fieldAdvisorStage,
      dealerAssignmentStage,
      dealerApprovalStage,
      customerStage,
      technicianStage,
      serviceCompletedStage,
      paymentStage,
      bookingDoneStage,
    ];

    // If a later stage is completed while a middle stage is still pending,
    // mark that middle stage as failed (red) to indicate it was skipped.
    stages = stages.map((stage, idx) => {
      if (stage.status !== "pending") return stage;
      const hasLaterCompleted = stages
        .slice(idx + 1)
        .some((s) => s.status === "completed");
      if (hasLaterCompleted) {
        return { ...stage, status: "failed" };
      }
      return stage;
    });

    // Promote NEXT pending stage after last completed to "in-progress"
    let lastCompletedIndex = -1;
    stages.forEach((s, idx) => {
      if (s.status === "completed") {
        lastCompletedIndex = idx;
      }
    });
    let promoted = false;
    stages = stages.map((s, idx) => {
      if (!promoted && idx > lastCompletedIndex && s.status === "pending") {
        promoted = true;
        return { ...s, status: "in-progress" };
      }
      return s;
    });

    const paymentStageIndex = stages.findIndex(
      (stage) => stage.id === "payment-done",
    );
    if (
      paymentStageIndex >= 0 &&
      ["completed", "in-progress"].includes(stages[paymentStageIndex].status)
    ) {
      const lastProgressedNonPaymentStageIndex = stages.reduce(
        (lastIndex, stage, index) => {
          if (stage.id === "payment-done") return lastIndex;
          return ["completed", "in-progress"].includes(stage.status)
            ? index
            : lastIndex;
        },
        -1,
      );

      const desiredPaymentIndex = Math.min(
        lastProgressedNonPaymentStageIndex + 1,
        stages.length - 1,
      );

      if (desiredPaymentIndex !== paymentStageIndex) {
        const [paymentStageItem] = stages.splice(paymentStageIndex, 1);
        const adjustedInsertIndex =
          paymentStageIndex < desiredPaymentIndex
            ? desiredPaymentIndex - 1
            : desiredPaymentIndex;
        stages.splice(adjustedInsertIndex, 0, paymentStageItem);
      }
    }

    return stages;
  })();

  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-secondary-subtle text-secondary";
    const normalized = status.toString().toLowerCase();
    if (["completed", "paid", "closed", "success", "approved", "servicecompleted"].includes(normalized)) {
      return "bg-success-subtle text-success";
    }
    if (["pending", "in-progress", "processing"].includes(normalized)) {
      return "bg-warning-subtle text-dark";
    }
    if (["cancelled", "canceled", "rejected", "failed"].includes(normalized)) {
      return "bg-danger-subtle text-danger";
    }
    if (["confirmed", "active"].includes(normalized)) {
      return "bg-primary-subtle text-primary";
    }
    return "bg-secondary-subtle text-secondary";
  };

  // When both Supervisor and Field Advisor are missing, auto-scroll to Personal Information
  useEffect(() => {
    if (
      !bookingData ||
      bookingData?.SupervisorHeadName ||
      bookingData?.SupervisorHeadPhoneNumber ||
      bookingData?.FieldAdvisorName ||
      bookingData?.FieldAdvisorPhoneNumber
    ) {
      return;
    }
    const el = document.querySelector("#booking-personal-info-section");
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // ignore scroll errors
    }
  }, [bookingData]);

  const formatPickType = (type = "") => {
    if (!type) return "—";
    if (type.toLowerCase().includes("pick")) return "Car Pick";
    if (type.toLowerCase().includes("drop")) return "Car Drop";
    return type;
  };

  // Calculate aggregate sums for Unconfirmed Services
  const cncTotals = (bookingData?.SupervisorBookings || []).reduce(
    (acc, item) => {
      acc.parts += Number(item.Price || 0);
      acc.labour += Number(item.LabourCharges || 0);
      acc.gst += Number(item.GSTAmount || 0);
      return acc;
    },
    { parts: 0, labour: 0, gst: 0 },
  );

  cncTotals.total = cncTotals.parts + cncTotals.labour + cncTotals.gst;

  const hasConfirmed = (bookingData?.BookingAddOns?.length || 0) > 0;
  const hasUnconfirmed = (bookingData?.SupervisorBookings?.length || 0) > 0;
  const showComparison = hasConfirmed && hasUnconfirmed;

  // --- NEW DEALER TOTALS CALCULATION ---
  const dlrCcTotals = (bookingData?.BookingAddOns || []).reduce(
    (acc, item) => {
      acc.parts += Number(item.DealerSparePrice || 0);
      acc.labour += Number(item.DealerPrice || 0);
      acc.gst += Number(item.DealerGSTAmount || 0);
      return acc;
    },
    { parts: 0, labour: 0, gst: 0 },
  );
  dlrCcTotals.total = dlrCcTotals.parts + dlrCcTotals.labour + dlrCcTotals.gst;

  const dlrCncTotals = (bookingData?.SupervisorBookings || []).reduce(
    (acc, item) => {
      acc.parts += Number(item.DealerSparePrice || 0);
      acc.labour += Number(item.DealerPrice || 0);
      acc.gst += Number(item.DealerGSTAmount || 0);
      return acc;
    },
    { parts: 0, labour: 0, gst: 0 },
  );
  dlrCncTotals.total =
    dlrCncTotals.parts + dlrCncTotals.labour + dlrCncTotals.gst;

  const hasDlrConfirmed = (bookingData?.BookingAddOns?.length || 0) > 0;
  const hasDlrUnconfirmed = (bookingData?.SupervisorBookings?.length || 0) > 0;
  const showDlrComparison = hasDlrConfirmed && hasDlrUnconfirmed;
  // -------------------------------------

  const liveComparisonServices = [
    ...(bookingData?.BookingAddOns || []).map((item, index) => ({
      ...item,
      __pricingStage: "Customer Confirmed",
      __pricingOrder: index,
    })),
    ...(bookingData?.SupervisorBookings || []).map((item, index) => ({
      ...item,
      __pricingStage: "Awaiting Customer",
      __pricingOrder: (bookingData?.BookingAddOns?.length || 0) + index,
    })),
  ].map((item, index) => {
    const customerTotal = getCustomerServiceTotal(item);
    const dealerTotal = getDealerServiceTotal(item);
    const marginAmount = getMarginAmountValue(item);
    const marginPercent = getMarginPercentValue(item);
    const priceSpread = Number((customerTotal - dealerTotal).toFixed(2));

    return {
      id:
        item.AddOnID || item.Id || `${item.ServiceName || "service"}-${index}`,
      stage: item.__pricingStage,
      serviceName: item.ServiceName || "Service",
      incNames:
        item.Includes?.map((i) => i.IncludeName).join(" | ") ||
        "No Includes Added",
      serviceType: item.ServiceType || "Service",
      dealerName: item.DealerName || "Dealer not assigned",
      quantity: Number(item.Quantity || 1),
      createdAt: item.CreatedDate || item.BookingDate,
      includeNames: getIncludeNames(item),
      customerPartUnit: Number(item.BasePrice || 0),
      customerParts: getCustomerPartsTotal(item),
      customerLabour: getCustomerLabourTotal(item),
      customerGst: getCustomerGstTotal(item),
      customerGstPercent: Number(item.GSTPercent || 0),
      customerTotal,
      dealerPartUnit: Number(item.DealerBasePrice || 0),
      dealerParts: getDealerPartsTotal(item),
      dealerLabour: getDealerLabourTotal(item),
      dealerGst: getDealerGstTotal(item),
      dealerGstPercent: Number(item.DealerGSTPercent || 0),
      dealerTotal,
      dealerConfirmStatus:
        item.IsDealer_Confirm || item.isDealer_Confirm || "Pending",
      serviceStatus:
        item.StatusName ||
        item.statusName ||
        item.AddOnStatus ||
        item.addOnStatus ||
        "Pending",
      isCompletionApproved:
        item.IsCompleted_Confirmation === 1 ||
        item.isCompleted_Confirmation === 1,
      completionApprovedBy:
        item.EmployeeName || item.employeeName || employeeData?.Name || "",
      sourceItem: item,
      marginAmount,
      marginPercent,
      priceSpread,
      spreadWithoutMargin: Number((priceSpread + marginAmount).toFixed(2)),
      updatedAt: item.UpdatedDate || item.CreatedDate || item.BookingDate,
      sourceOrder:
        item.__pricingOrder !== undefined ? item.__pricingOrder : index,
    };
  });

  const customerRejectedComparisonServices = (
    bookingData?.CustomerRejectedBookings || []
  ).map((item, index) => {
    const customerTotal = getCustomerServiceTotal(item);
    const dealerTotal = getDealerServiceTotal(item);
    const marginAmount = getMarginAmountValue(item);
    const marginPercent = getMarginPercentValue(item);
    const priceSpread = Number((customerTotal - dealerTotal).toFixed(2));

    return {
      id:
        item.AddOnID ||
        item.Id ||
        `${item.ServiceName || "service"}-rejected-${index}`,
      stage: "Customer Rejected",
      serviceName: item.ServiceName || "Service",
      serviceType: item.ServiceType || "Service",
      dealerName: item.DealerName || "Dealer not assigned",
      quantity: Number(item.Quantity || 1),
      createdAt: item.CreatedDate || item.BookingDate,
      includeNames: getIncludeNames(item),
      customerPartUnit: Number(item.BasePrice || 0),
      customerParts: getCustomerPartsTotal(item),
      customerLabour: getCustomerLabourTotal(item),
      customerGst: getCustomerGstTotal(item),
      customerGstPercent: Number(item.GSTPercent || 0),
      customerTotal,
      dealerPartUnit: Number(item.DealerBasePrice || 0),
      dealerParts: getDealerPartsTotal(item),
      dealerLabour: getDealerLabourTotal(item),
      dealerGst: getDealerGstTotal(item),
      dealerGstPercent: Number(item.DealerGSTPercent || 0),
      dealerTotal,
      dealerConfirmStatus:
        item.IsDealer_Confirm || item.isDealer_Confirm || "Pending",
      serviceStatus:
        item.StatusName ||
        item.statusName ||
        item.AddOnStatus ||
        item.addOnStatus ||
        "Rejected",
      isCompletionApproved:
        item.IsCompleted_Confirmation === 1 ||
        item.isCompleted_Confirmation === 1,
      completionApprovedBy:
        item.EmployeeName || item.employeeName || employeeData?.Name || "",
      sourceItem: item,
      marginAmount,
      marginPercent,
      priceSpread,
      spreadWithoutMargin: Number((priceSpread - marginAmount).toFixed(2)),
      updatedAt: item.UpdatedDate || item.CreatedDate || item.BookingDate,
      sourceOrder: index,
    };
  });

  const buildPricingTotals = (services) =>
    services.reduce(
      (acc, item) => {
        acc.customerParts += item.customerParts;
        acc.customerLabour += item.customerLabour;
        acc.customerGst += item.customerGst;
        acc.customerTotal += item.customerTotal;
        acc.dealerParts += item.dealerParts;
        acc.dealerLabour += item.dealerLabour;
        acc.dealerGst += item.dealerGst;
        acc.dealerTotal += item.dealerTotal;
        acc.marginAmount += item.marginAmount;
        acc.priceSpread += item.priceSpread;
        if (item.marginAmount > 0) acc.marginServices += 1;
        if (Math.abs(item.priceSpread - item.marginAmount) > 1) {
          acc.varianceServices += 1;
        }
        return acc;
      },
      {
        customerParts: 0,
        customerLabour: 0,
        customerGst: 0,
        customerTotal: 0,
        dealerParts: 0,
        dealerLabour: 0,
        dealerGst: 0,
        dealerTotal: 0,
        marginAmount: 0,
        priceSpread: 0,
        marginServices: 0,
        varianceServices: 0,
      },
    );

  const getPricingStageBadgeClass = (stage) => {
    if (stage === "Customer Confirmed") {
      return "bg-success-subtle text-success";
    }

    if (stage === "Customer Rejected") {
      return "bg-danger-subtle text-danger";
    }

    return "bg-warning-subtle text-warning";
  };

  const pricingTotals = buildPricingTotals(liveComparisonServices);

  const customerRejectedPricingTotals = buildPricingTotals(
    customerRejectedComparisonServices,
  );

  const effectiveMarginPercent =
    pricingTotals.dealerTotal > 0
      ? Number(
          (
            (pricingTotals.marginAmount / pricingTotals.dealerTotal) *
            100
          ).toFixed(2),
        )
      : 0;
  const rejectedEffectiveMarginPercent =
    customerRejectedPricingTotals.dealerTotal > 0
      ? Number(
          (
            (customerRejectedPricingTotals.marginAmount /
              customerRejectedPricingTotals.dealerTotal) *
            100
          ).toFixed(2),
        )
      : 0;
  const priceSpreadPercent =
    pricingTotals.dealerTotal > 0
      ? Number(
          (
            (pricingTotals.priceSpread / pricingTotals.dealerTotal) *
            100
          ).toFixed(2),
        )
      : 0;
  const unmatchedSpreadAmount = Number(pricingTotals.priceSpread);
  const pricingBarBase = Math.max(
    pricingTotals.customerTotal,
    pricingTotals.dealerTotal,
    1,
  );
  const dealerBarWidth = Math.min(
    100,
    (pricingTotals.dealerTotal / pricingBarBase) * 100,
  );
  const marginBarWidth = Math.min(
    100,
    (pricingTotals.marginAmount / pricingBarBase) * 100,
  );
  const spreadExtraBarWidth = Math.min(
    100,
    (Math.max(unmatchedSpreadAmount, 0) / pricingBarBase) * 100,
  );

  const handleBookingCancellation = async () => {
    try {
      // 1️⃣ Ask reason (with validation)
      const { value: reason } = await Swal.fire({
        title: "Cancel Booking",
        input: "textarea",
        inputLabel: "Enter cancellation reason",
        inputPlaceholder: "Type reason...",
        showCancelButton: true,
        confirmButtonText: "Submit",
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return "Reason is required!";
          }
        },
      });

      if (!reason) return;

      // 2️⃣ Prepare payload
      const payload = {
        bookingID: bookingData?.Id || bookingId, // fallback safe
        cancelledBy: String(userId) || localStorage.getItem("userId"),
        reason: reason.trim(),
        refundStatus: "",
      };

      console.log("Cancellation Payload:", payload);

      // 3️⃣ API call
      const res = await axios.post(`${API_BASE}cancellations`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 4️⃣ Success
      Swal.fire({
        icon: "success",
        title: "Cancelled",
        text: "Booking cancelled successfully!",
      });

      // 5️⃣ Refresh UI
      fetchBookingData();
    } catch (error) {
      console.error("Cancellation Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to cancel booking.",
      });
    }
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
        .pickup-drop-row:hover {
          background-color: #f8fafc !important;
        }
        .dlr-column {
          background-color: rgba(251, 191, 36, 0.12) !important;
          color: #92400e;
        }
        .table-center-all th,
        .table-center-all td {
          text-align: center !important;
        }
        .blink-assign {
          position: relative;
          animation: blinkAssign 1s ease-in-out infinite;
        }
        @keyframes blinkAssign {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pricing-intelligence-card {
          border: 1px solid rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }
        .pricing-intelligence-header {
          padding: 1.25rem 1.5rem;
          background:
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 32%),
            linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #eff6ff 100%);
          color: #fff;
        }
        .pricing-intelligence-header h5 {
          margin: 0.2rem 0;
          color: #fff;
        }
        .pricing-intelligence-header p {
          margin: 0;
          color: rgba(255, 255, 255, 0.84);
          max-width: 760px;
        }
        .pricing-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        .pricing-kpi-card {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
        }
        .pricing-kpi-label {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }
        .pricing-kpi-value {
          font-size: 1.6rem;
          line-height: 1.1;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0.45rem;
        }
        .pricing-kpi-subtext {
          margin-top: 0.35rem;
          font-size: 0.86rem;
          color: #475569;
        }
        .pricing-panel {
          height: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.06);
          padding: 1rem;
        }
        .pricing-breakdown-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.6rem 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        .pricing-breakdown-row:last-child {
          border-bottom: none;
        }
        .pricing-visual-track {
          display: flex;
          width: 100%;
          min-height: 16px;
          border-radius: 999px;
          overflow: hidden;
          background: #e2e8f0;
        }
        .pricing-visual-track span {
          display: block;
          min-height: 16px;
        }
        .pricing-visual-dealer {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
        }
        .pricing-visual-margin {
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
        }
        .pricing-visual-extra {
          background: linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%);
        }
        .pricing-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: #f1f5f9;
          color: #334155;
          font-size: 0.76rem;
          font-weight: 600;
        }
        .pricing-comparison-table th {
          white-space: nowrap;
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .pricing-spread-positive {
          color: #047857;
          font-weight: 700;
        }
        .pricing-spread-negative {
          color: #dc2626;
          font-weight: 700;
        }
        .pricing-note-card {
          border-radius: 16px;
          border: 1px dashed rgba(29, 78, 216, 0.25);
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.9) 0%, #fff 100%);
          padding: 0.9rem 1rem;
        }
        .service-compare-list {
          display: grid;
          gap: 1rem;
        }
        .service-compare-card {
          border: 1px solid #dbeafe;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.06);
          padding: 1rem 1.1rem;
        }
        .service-compare-top {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.9rem;
          margin-bottom: 0.9rem;
        }
        .service-compare-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
          .service-compare-title-include {
            font-size: 0.8rem;
            font-weight: 400;
            color: #64748b;
          }
        .service-compare-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.45rem;
        }
        .service-compare-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 0.9fr;
          gap: 0.9rem;
        }
        .service-compare-section {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.96);
          padding: 0.85rem 0.9rem;
        }
        .service-compare-section h6 {
          margin: 0 0 0.7rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }
        .service-compare-line {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          padding: 0.35rem 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 0.86rem;
        }
        .service-compare-line:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .service-compare-line span:first-child {
          color: #64748b;
        }
        .service-compare-line strong {
          color: #0f172a;
        }
        .service-compare-highlight {
          border-radius: 16px;
          padding: 0.9rem;
          background: linear-gradient(180deg, rgba(240, 253, 244, 0.95) 0%, #fff 100%);
          border: 1px solid rgba(34, 197, 94, 0.22);
        }
        .service-compare-highlight.warn {
          background: linear-gradient(180deg, rgba(255, 251, 235, 0.98) 0%, #fff 100%);
          border-color: rgba(245, 158, 11, 0.22);
        }
        .service-compare-include-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.7rem;
        }
        @media (max-width: 991px) {
          .service-compare-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <TimeLineView bookingData={bookingData} displayDate={displayDate} />

      <div className="row gy-2">
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
                          <h6
                            id="booking-personal-info-section"
                            className="mb-0 fw-bold text-primary d-flex align-items-center gap-2"
                          >
                            <Icon
                              icon="mdi:account-circle-outline"
                              width={20}
                              height={20}
                            />
                            Personal Information
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
                                    Email :
                                  </span>
                                  <span className="w-50 text-secondary-light fw-bold">
                                    {bookingData.CustEmail || "N/A"}
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
                                  {/* <>
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
                                  </> */}
                                  {/* {(pickupDate || dropDate) && ( */}
                                  <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Supervisor Name/Number :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold d-flex align-items-center justify-content-between">
                                      <span>
                                        {bookingData?.SupervisorHeadName ||
                                        bookingData?.SupervisorHeadPhoneNumber ? (
                                          <>
                                            {bookingData?.SupervisorHeadName ||
                                              ""}
                                            {bookingData?.SupervisorHeadPhoneNumber
                                              ? ` (${bookingData.SupervisorHeadPhoneNumber})`
                                              : ""}
                                          </>
                                        ) : (
                                          "N/A"
                                        )}
                                      </span>
                                      {!bookingData?.SupervisorHeadName &&
                                        !bookingData?.SupervisorHeadPhoneNumber && (
                                          <button
                                            type="button"
                                            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2"
                                            title="Assign Supervisor"
                                            onClick={() => {
                                              if (bookingData?.BookingID) {
                                                navigate(
                                                  `/booking-basic/${bookingData.BookingID}?stage=assign-supervisor`,
                                                );
                                              }
                                            }}
                                          >
                                            Assign
                                          </button>
                                        )}
                                    </span>
                                  </li>
                                  <li className="d-flex align-items-center gap-1 mt-2">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Field Advisor Name/Number :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold d-flex align-items-center justify-content-between">
                                      <span>
                                        {bookingData?.FieldAdvisorName ||
                                        bookingData?.FieldAdvisorPhoneNumber ? (
                                          <>
                                            {bookingData?.FieldAdvisorName ||
                                              ""}
                                            {bookingData?.FieldAdvisorPhoneNumber
                                              ? ` (${bookingData.FieldAdvisorPhoneNumber})`
                                              : ""}
                                          </>
                                        ) : (
                                          "N/A"
                                        )}
                                      </span>
                                      {!bookingData?.FieldAdvisorName &&
                                        !bookingData?.FieldAdvisorPhoneNumber && (
                                          <button
                                            type="button"
                                            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center gap-2 py-2"
                                            title="Assign Field Advisor"
                                            onClick={() => {
                                              if (bookingData?.BookingID) {
                                                navigate(
                                                  `/booking-basic/${bookingData.BookingID}?stage=assign-fa`,
                                                );
                                              }
                                            }}
                                          >
                                            Assign
                                          </button>
                                        )}
                                    </span>
                                  </li>
                                  {/* <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Pickup Date & Time :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {displayDate(pickupDate)}
                                      {pickupTime && ` : ${pickupTime}`}
                                    </span>
                                  </li> */}

                                  {/* <li className="d-flex align-items-center gap-1">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Drop Date & Time :
                                    </span>
                                    <span className="w-50 text-secondary-light fw-bold">
                                      {displayDate(dropDate)}
                                      {dropTime && ` : ${dropTime}`}
                                    </span>
                                  </li> */}
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
                          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                            <Icon icon="mdi:car" width={20} height={20} />
                            Vehicle Details
                          </h6>
                        </Accordion.Header>

                        <Accordion.Body>
                          {bookingData.VehicleDetails &&
                          Array.isArray(bookingData.VehicleDetails) &&
                          bookingData.VehicleDetails.length > 0 ? (
                            <div>
                              {bookingData.VehicleDetails.map(
                                (vehicle, index) => (
                                  <div
                                    key={index}
                                    className={
                                      index > 0 ? "mt-4 pt-4 border-top" : ""
                                    }
                                  >
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
                                        <span className="fw-semibold text-primary-light">
                                          Brand :
                                        </span>
                                        <span className="w-70 text-secondary-light fw-bold ms-2">
                                          {vehicle.BrandName} (
                                          {vehicle.ModelName || "N/A"})
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
                                          {vehicle.KmDriven !== null &&
                                          vehicle.KmDriven !== undefined
                                            ? vehicle.KmDriven.toLocaleString()
                                            : "N/A"}{" "}
                                          km
                                        </span>
                                      </li>
                                      {/* )} */}
                                    </ul>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-muted py-4">
                              <Icon icon="mdi:car-off" className="fs-1 mb-2" />
                              <p className="mb-0">
                                No vehicle details available
                              </p>
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
                              const [aH, aM] =
                                a.StartTime.split(":").map(Number);
                              const [bH, bM] =
                                b.StartTime.split(":").map(Number);
                              return aH * 60 + aM - (bH * 60 + bM);
                            })
                            .map((slot) => {
                              const val = `${slot.StartTime} - ${slot.EndTime}`;
                              return {
                                value: val,
                                label: `${toTimeDisplay(slot.StartTime)} - ${toTimeDisplay(slot.EndTime)}`,
                              };
                            })}
                          value={selectedTimeSlot.map((val) => {
                            const [s, e] = (val || "").split(/\s*-\s*/);
                            return {
                              value: val,
                              label: `${toTimeDisplay(s)} - ${toTimeDisplay(e)}`,
                            };
                          })}
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
                            onClick={() =>
                              handleRefund(bookingData.Payments[0])
                            }
                            className="btn btn-danger btn-sm"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    )}
                  <Link
                    to={`/lead-view/${bookingData?.LeadId}`}
                    className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center gap-2"
                    title="View Lead"
                  >
                    {" "}
                    <Icon
                      icon="mdi:eye-outline"
                      width={16}
                      height={16}
                      className="mx-2"
                    />
                    View Lead
                  </Link>
                  {!hideAllActions &&
                    bookingData?.BookingStatus !== "Cancelled" && (
                      <button
                        type="button"
                        className="btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center gap-2"
                        title="Customer Details"
                        onClick={() => {
                          if (bookingData?.BookingID) {
                            navigate(`/booking-basic/${bookingData.BookingID}`);
                          }
                        }}
                      >
                        <Icon
                          icon="mdi:format-list-checkbox"
                          width={16}
                          height={16}
                        />
                        Customer Details
                      </button>
                    )}
                  {/* Convert To Service / Service Converted - Add Services Button */}
                  {bookingData?.Isinspection === 1 &&
                    bookingData?.Isservice_converted === 0 &&
                    bookingData?.BookingStatus !== "Cancelled" && (
                      <button
                        className="btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center gap-2"
                        onClick={handleConvertToService}
                        title="Convert To Service"
                        disabled={isConverting}
                      >
                        {isConverting ? ( // <--- Add this conditional logic
                          <>
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Converting...
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:swap-horizontal-bold" />
                            Convert To Service
                          </>
                        )}
                      </button>
                    )}
                  {bookingData?.Isinspection === 1 &&
                    bookingData?.Isservice_converted === 1 &&
                    (bookingData?.BookingAddOns?.length ?? 0) === 1 &&
                    (bookingData?.SupervisorBookings?.length ?? 0) === 0 && (
                      <Link
                        to={`/book-service/${bookingData?.LeadId}/${bookingData?.BookingID}/${bookingData?.BookingTrackID}`}
                        onClick={(e) => {
                          if (!ensureBasicDetails()) {
                            e.preventDefault();
                          }
                        }}
                        className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center gap-2"
                        title="Service converted, add extra services"
                      >
                        <Icon icon="mdi:plus-circle-outline" />
                        Service Converted – Add Services
                      </Link>
                    )}
                  {/* {!(
                    bookingData?.BookingStatus === "Completed" &&
                    bookingData?.Payments?.length > 0 &&
                    bookingData?.Payments?.[bookingData.Payments.length - 1]
                      ?.PaymentStatus === "Success"
                  ) && ( */}
                  {!hideAllActions && (
                    <>
                      {/* Confirm Services Button */}
                      {((bookingData?.Isinspection === 1 &&
                        bookingData?.Isservice_converted === 1) ||
                        (bookingData?.Isinspection === 0 &&
                          bookingData?.Isservice_converted === 0)) &&
                        bookingData?.BookingStatus !== "Cancelled" && (
                          <Link
                            to={`/book-service/${bookingData?.LeadId}/${bookingData?.BookingID}/${bookingData?.BookingTrackID}`}
                            onClick={(e) => {
                              if (!ensureBasicDetails()) {
                                e.preventDefault(); // Stop navigation if details are missing
                              }
                            }}
                            className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center gap-2"
                            title={
                              roleName === "Field Advisor"
                                ? "Assign Dealers"
                                : roleName === "Supervisor Head"
                                  ? "Confirm Services"
                                  : "Confirm Services"
                            }
                          >
                            <Icon icon="mdi:pencil-outline" />
                            {roleName === "Field Advisor"
                              ? "Assign Dealers"
                              : roleName === "Supervisor Head"
                                ? "Confirm Services"
                                : "Confirm Services"}
                          </Link>
                        )}

                      {/* Confirm Service Button - Admin & Supervisor only, when Convert To Service is enabled and there are unconfirmed services */}
                      {(() => {
                        if (
                          bookingData?.Isinspection !== 1 ||
                          bookingData?.Isservice_converted !== 0 ||
                          !(roleId === "1" || roleId === "8")
                        ) {
                          return null;
                        }
                        const addOns = bookingData?.BookingAddOns || [];
                        const supervisorBookings =
                          bookingData?.SupervisorBookings || [];
                        const allServices = [...addOns, ...supervisorBookings];
                        const itemsToConfirm = allServices.filter(
                          (a) =>
                            (a.IsSupervisor_Confirm ??
                              a.isSupervisor_Confirm) !== 1,
                        );
                        if (itemsToConfirm.length === 0) {
                          return null;
                        }
                        return (
                          <button
                            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center justify-content-center gap-2"
                            onClick={() => {
                              if (!ensureBasicDetails()) return;
                              handleConfirmService();
                            }}
                            title="Confirm Service"
                            disabled={isConfirmingService}
                          >
                            {isConfirmingService ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Confirming...
                              </>
                            ) : (
                              <>
                                <Icon icon="mdi:check-circle-outline" />
                                Confirm Service
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </>
                  )}

                  {/* Reschedule & Reassign Buttons */}
                  {bookingData &&
                    !hideAllActions &&
                    !["Completed", "Cancelled", "Refunded"].includes(
                      bookingData.BookingStatus,
                    ) && (
                      <div className="d-flex gap-2 flex-wrap">
                        <div className="dropdown">
                          <button
                            className="btn btn-primary-600 btn-sm dropdown-toggle d-inline-flex align-items-center"
                            type="button"
                            id="bookingActionsDropdown"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            ref={(el) => {
                              if (el)
                                el.style.setProperty(
                                  "color",
                                  "#fff",
                                  "important",
                                );
                            }}
                          >
                            Customer Actions
                          </button>

                          {/* Added 'dropdown-menu-end' to align to the right edge if needed, 
                              and 'p-3' for internal padding like in your image */}
                          <ul
                            className="dropdown-menu dropdown-menu-end shadow border-0 p-3"
                            aria-labelledby="bookingActionsDropdown"
                            style={{ minWidth: "206px", borderRadius: "12px" }}
                          >
                            {bookingData?.SupervisorBookings?.length > 0 && (
                              <li className="mb-2">
                                {" "}
                                {/* Added margin bottom for spacing */}
                                <button
                                  className="btn btn-success btn-sm w-100 d-inline-flex align-items-center justify-content-center"
                                  onClick={handleCustomerConfirmation}
                                  style={{
                                    height: "40px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  Customer Confirmation
                                </button>
                              </li>
                            )}

                            {bookingData?.SupervisorBookings?.length > 0 && (
                              <li className="mb-2">
                                <button
                                  className="btn btn-danger btn-sm w-100 d-inline-flex align-items-center justify-content-center"
                                  onClick={handleCustomerRejection}
                                  style={{
                                    height: "40px",
                                    whiteSpace: "normal",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  Customer Rejection
                                </button>
                              </li>
                            )}

                            {/* Divider - only shows if the buttons above are present */}
                            {bookingData?.SupervisorBookings?.length > 0 && (
                              <li className="my-2">
                                <hr className="dropdown-divider" />
                              </li>
                            )}

                            <li>
                              <button
                                className="btn btn-warning btn-sm w-100 d-inline-flex align-items-center justify-content-center"
                                onClick={handleBookingCancellation}
                                style={{
                                  height: "40px",
                                  whiteSpace: "normal",
                                  lineHeight: "1.2",
                                }}
                              >
                                Booking Cancellation
                              </button>
                            </li>
                          </ul>
                        </div>
                        {/* <button
                          className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                          onClick={() => setShowReschedule(!showReschedule)}
                        >
                          Reschedule
                        </button> */}

                        {/* BUTTON 1 — your current condition, but ONLY when roleId !== "8" */}
                        {/* {roleId !== "8" &&
                          (bookingData.TechID || bookingData.SupervisorID) && (
                            <button
                              className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                              onClick={() => handleAssignClick()}
                            >
                              Reassign
                            </button>
                          )} */}

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
                                  width={20}
                                  height={20}
                                  className="text-primary"
                                />
                                <div>
                                  <h6 className="mb-0 text-dark fw-bold">
                                    Booking #{bookingData.BookingTrackID}
                                  </h6>
                                  <small className="text-muted">
                                    Scheduled:{" "}
                                    {bookingData?.BookingDate
                                      ? new Date(bookingData.BookingDate).toLocaleString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : " "}
                                    <>
                                      <style>
                                        {`
                                        .hover-dropdown:hover .dropdown-menu {
                                          display: block;
                                          margin-top: 10px;
                                        }
                                      `}
                                      </style>

                                      {bookingData.TimeSlot?.includes(",") ? (
                                        <div className="dropdown d-inline hover-dropdown">
                                          <span
                                            className="dropdown-toggle"
                                            style={{ cursor: "pointer" }}
                                          >
                                            (
                                            {bookingData.TimeSlot.split(
                                              ",",
                                            )[0].trim()}
                                            )
                                          </span>

                                          <ul
                                            className="dropdown-menu p-2"
                                            style={{
                                              minWidth: "max-content",
                                              left: "auto",
                                              right: 0,
                                            }}
                                          >
                                            {bookingData.TimeSlot.split(
                                              ",",
                                            ).map((slot, index) => (
                                              <li key={index}>
                                                <span className="dropdown-item-text">
                                                {formatTo12Hour(slot.trim())}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ) : (
                                        <>({formatTo12Hour(bookingData.TimeSlot)})</>
                                      )}
                                    </>
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="ms-2 small">
                                  Payment Status:
                                </span>
                                {(() => {
                                  const bookingStatus =
                                    bookingData?.PaymentStatus; // 👈 root level
                                  const payments = bookingData?.Payments;

                                  let label = "Pending";
                                  let badgeClass = "bg-warning text-dark";

                                  // ✅ Priority 1: Booking PaymentStatus
                                  if (bookingStatus === "Success") {
                                    label = "Paid";
                                    badgeClass = "bg-success";
                                  } else if (bookingStatus === "Partialpaid") {
                                    label = "Partial Paid";
                                    badgeClass = "bg-primary";
                                  } else if (bookingStatus === "Pending") {
                                    label = "Pending";
                                    badgeClass = "bg-warning text-dark";
                                  }

                                  // ✅ Optional fallback (if root status missing)
                                  else if (payments?.length > 0) {
                                    const status = payments[0]?.PaymentStatus;

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

                                <span className="ms-2 small">
                                  Booking Status:
                                </span>
                                <span
                                  className={`badge px-3 py-1 rounded-pill ${
                                    bookingData.BookingStatus === "Completed"
                                      ? "bg-success"
                                      : bookingData.BookingStatus ===
                                          "Confirmed"
                                        ? "bg-primary"
                                        : "bg-warning text-dark"
                                  }`}
                                >
                                  {bookingData.BookingStatus ===
                                  "ServiceInProgress"
                                    ? "Service in progress"
                                    : bookingData.BookingStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Accordion.Header>

                        <Accordion.Body className="bg-white">
                          <div className="container-fluid">
                            {/* ============= Packages Section ============= */}
                            {bookingData?.Packages?.length > 0 && (
                              <Accordion
                                defaultActiveKey="pkg1"
                                className="mb-4"
                              >
                                <Accordion.Item eventKey="pkg1">
                                  <Accordion.Header>
                                    <h6 className="text-success fw-bold mb-0 d-flex align-items-center gap-2">
                                      <Icon
                                        icon="mdi:package-variant"
                                        width={20}
                                        height={20}
                                        className="text-success"
                                      />
                                      Packages
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
                                                    ?.SubCategories?.[0]
                                                    ?.Includes?.length > 0 && (
                                                    <ul className="text-muted small ps-3 mb-0">
                                                      {pkg.Category.SubCategories[0].Includes.map(
                                                        (inc) => (
                                                          <li
                                                            key={inc.IncludeID}
                                                          >
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
                                                        const hours =
                                                          Math.floor(
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
                                    <h6 className="text-primary fw-bold mb-0 d-flex align-items-center gap-2">
                                      <Icon
                                        icon="mdi:wrench"
                                        width={20}
                                        height={20}
                                      />
                                      Additional Services
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

                            {false &&
                              bookingData?.BookingAddOns?.length > 0 && (
                                <div className="card mb-4 mt-4">
                                  <div className="card-header bg-success">
                                    <h6 className="mb-0 fw-bold text-white">
                                      Customer Confirmed Services
                                    </h6>
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
                                        className="table table-sm table-striped table-hover align-middle mb-0 table-center-all"
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
                                            <th style={{ width: "100px" }}>
                                              Type
                                            </th>
                                            <th style={{ width: "180px" }}>
                                              Service Name
                                            </th>
                                            <th style={{ width: "100px" }}>
                                              Date
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              Part Price
                                            </th>
                                            <th
                                              style={{ width: "125px" }}
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
                                            >
                                              DLR GST Amt.
                                            </th>
                                            {roleName !== "Field Advisor" && (
                                              <>
                                                <th
                                                  style={{ width: "100px" }}
                                                  className="text-end"
                                                >
                                                  MCB Margin Amount
                                                </th>
                                                <th
                                                  style={{ width: "140px" }}
                                                  className="text-end"
                                                >
                                                  MCB Amt.
                                                </th>
                                              </>
                                            )}
                                            <th
                                              style={{ width: "170px" }}
                                              className="text-center"
                                            >
                                              Dealer Name
                                            </th>
                                            {/* <th style={{ width: "180px" }}
                                            className="text-center">
                                            Confirm Service
                                          </th> */}
                                            <th
                                              style={{ width: "160px" }}
                                              className="text-center"
                                            >
                                              DLR Service Status
                                            </th>
                                            <th
                                              style={{ width: "160px" }}
                                              className="text-center"
                                            >
                                              MCB Approval
                                            </th>
                                            <th
                                              style={{ width: "140px" }}
                                              className="text-end"
                                            >
                                              DLR Total Amt.
                                            </th>
                                            <th
                                              style={{ width: "150px" }}
                                              className="text-end"
                                            >
                                              Cust. Total Amt.
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
                                                      addon.Includes.length >
                                                        0 && (
                                                        <ul
                                                          className="text-muted small ps-3 mb-0 mt-2"
                                                          style={{
                                                            textAlign: "left",
                                                          }}
                                                        >
                                                          {addon.Includes.map(
                                                            (inc) => (
                                                              <li
                                                                key={
                                                                  inc.IncludeID ||
                                                                  inc.id
                                                                }
                                                                style={{
                                                                  textAlign:
                                                                    "left",
                                                                }}
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
                                                      ).toLocaleDateString(
                                                        "en-IN",
                                                      )
                                                    : "—"}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    addon.BasePrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end dlr-column">
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
                                                <td className="text-end dlr-column">
                                                  {Number(
                                                    addon.DealerSparePrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    addon.LabourCharges || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end dlr-column">
                                                  {Number(
                                                    addon.DealerPrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end">
                                                  {addon.GSTPercent ?? 0}%
                                                </td>
                                                <td className="text-end dlr-column">
                                                  {addon.DealerGSTPercent ?? 0}%
                                                </td>
                                                <td className="text-end">
                                                  {Number(
                                                    addon.GSTPrice || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                <td className="text-end dlr-column">
                                                  {Number(
                                                    addon.DealerGSTAmount || 0,
                                                  ).toFixed(2)}
                                                </td>
                                                {roleName !==
                                                  "Field Advisor" && (
                                                  <>
                                                    <td className="text-end">
                                                      {addon.Percentage ?? "0"}%
                                                    </td>
                                                    <td className="text-end">
                                                      {Number(
                                                        addon.Our_Earnings || 0,
                                                      ).toFixed(2)}
                                                    </td>
                                                  </>
                                                )}
                                                <td
                                                  className=" normal text-center"
                                                  style={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                  }}
                                                >
                                                  {addon.DealerName || "—"}{" "}
                                                  {addon.IsDealer_Confirm &&
                                                  addon.DealerName ? (
                                                    <span
                                                      className={`badge px-3 py-2 rounded-pill ${
                                                        addon.IsDealer_Confirm ===
                                                        "Approved"
                                                          ? "bg-success text-white"
                                                          : "bg-danger text-white"
                                                      }`}
                                                    >
                                                      {addon.IsDealer_Confirm}
                                                    </span>
                                                  ) : (
                                                    ""
                                                  )}
                                                </td>
                                                {/* <td
                                                className=" normal text-center"
                                                style={{
                                                  whiteSpace: "normal",
                                                  wordBreak: "break-word",
                                                }}
                                                title={addon.ConfirmDescription || ""}
                                              >
                                                {addon.ConfirmRole || "—"}
                                              </td> */}
                                                <td className="text-center ">
                                                  {(() => {
                                                    const dealerConfirm = (
                                                      addon.IsDealer_Confirm ??
                                                      addon.isDealer_Confirm
                                                    )
                                                      ?.toString()
                                                      .trim()
                                                      .toLowerCase();
                                                    const isApproved =
                                                      dealerConfirm ===
                                                      "approved";
                                                    const isRejected =
                                                      dealerConfirm ===
                                                      "rejected";
                                                    const status = (
                                                      addon.StatusName ??
                                                      addon.statusName ??
                                                      addon.AddOnStatus ??
                                                      addon.addOnStatus
                                                    )
                                                      ?.toString()
                                                      .trim();
                                                    return (
                                                      <div className="d-flex gap-2 align-items-center justify-content-center">
                                                        {isApproved ? (
                                                          <select
                                                            className="form-select form-select-sm"
                                                            value={status}
                                                            onChange={(e) =>
                                                              handleAddOnStatusChange(
                                                                addon,
                                                                e.target.value,
                                                              )
                                                            }
                                                          >
                                                            {status ===
                                                            "ServiceCompleted" ? (
                                                              <>
                                                                <option value="ServiceCompleted">
                                                                  Completed
                                                                </option>
                                                                <option value="Rework">
                                                                  Rework
                                                                </option>
                                                              </>
                                                            ) : (
                                                              <>
                                                                {/* <option value="">Select Status</option> */}
                                                                <option value="Pending">
                                                                  Pending
                                                                </option>
                                                                <option value="InProgress">
                                                                  In-Progress
                                                                </option>
                                                                <option value="ServiceCompleted">
                                                                  Completed
                                                                </option>
                                                                <option value="Rework">
                                                                  Rework
                                                                </option>
                                                              </>
                                                            )}
                                                          </select>
                                                        ) : isRejected ? (
                                                          <span className="badge bg-danger text-white px-3 py-4 rounded-pill">
                                                            Rejected
                                                          </span>
                                                        ) : (
                                                          <span
                                                            className={` ${addon.DealerName ? " badge bg-warning text-dark  px-3 py-4 rounded-pill" : ""}`}
                                                          >
                                                            {addon.DealerName
                                                              ? `Pending`
                                                              : "—"}
                                                          </span>
                                                        )}
                                                      </div>
                                                    );
                                                  })()}
                                                </td>
                                                <td className="text-center">
                                                  {addon.IsCompleted_Confirmation ===
                                                    1 ||
                                                  addon.isCompleted_Confirmation ===
                                                    1 ? (
                                                    <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                                                      <span>Approved By</span>
                                                      <span className="badge bg-success px-3 py-3 py-4 rounded-pill">
                                                        {addon.EmployeeName ??
                                                          addon.employeeName ??
                                                          "—"}
                                                      </span>
                                                    </div>
                                                  ) : (
                                                    (() => {
                                                      const status = (
                                                        addon.StatusName ??
                                                        addon.statusName ??
                                                        addon.AddOnStatus ??
                                                        addon.addOnStatus
                                                      )
                                                        ?.toString()
                                                        .trim();
                                                      const isServiceCompleted =
                                                        status ===
                                                        "ServiceCompleted";
                                                      return isServiceCompleted ? (
                                                        <button
                                                          type="button"
                                                          className="btn btn-primary-600 btn-sm"
                                                          // onClick={() => handleFieldAdvisorConfirm(addon)}
                                                          // onClick={() => {
                                                          //   setSelectedAddon(
                                                          //     addon,
                                                          //   );
                                                          //   setShowConfirmModal(
                                                          //     true,
                                                          //   );
                                                          // }}
                                                          disabled={
                                                            isConfirmingCompletion
                                                          }
                                                          onClick={() =>
                                                            handleDirectApprove(
                                                              addon,
                                                            )
                                                          }
                                                        >
                                                          Approve
                                                        </button>
                                                      ) : null;
                                                    })()
                                                  )}
                                                </td>
                                                <td className="text-end fw-bold dlr-column">
                                                  {(
                                                    Number(
                                                      addon.DealerSparePrice ||
                                                        0,
                                                    ) +
                                                    Number(
                                                      addon.DealerPrice || 0,
                                                    ) +
                                                    Number(
                                                      addon.DealerGSTAmount ||
                                                        0,
                                                    )
                                                  ).toFixed(2)}
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

                            {false &&
                              bookingData?.SupervisorBookings?.length > 0 && (
                                <div className="card mb-4 mt-4">
                                  <div className="card-header bg-warning text-dark">
                                    <h6 className="mb-0 fw-bold">
                                      Customer Not Confirmed Services
                                    </h6>
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
                                        className="table table-sm table-striped table-hover align-middle mb-0 table-center-all"
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
                                            <th style={{ width: "100px" }}>
                                              Type
                                            </th>
                                            <th style={{ width: "180px" }}>
                                              Service Name
                                            </th>
                                            <th style={{ width: "100px" }}>
                                              Date
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              Part Price
                                            </th>
                                            <th
                                              style={{ width: "125px" }}
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
                                            >
                                              DLR GST Amt.
                                            </th>
                                            <th
                                              style={{ width: "130px" }}
                                              className="text-end"
                                            >
                                              MCB Margin Amount
                                            </th>
                                            <th
                                              style={{ width: "150px" }}
                                              className="text-end"
                                            >
                                              MCB Amt.
                                            </th>
                                            <th
                                              style={{ width: "170px" }}
                                              className="text-center"
                                            >
                                              Dealer Name
                                            </th>
                                            {/* <th
                                            style={{ width: "160px" }}
                                            className="text-center"
                                          >
                                            Service Status
                                          </th> */}
                                            <th
                                              style={{ width: "140px" }}
                                              className="text-end"
                                            >
                                              DLR Total Amt.
                                            </th>
                                            <th
                                              style={{ width: "150px" }}
                                              className="text-end"
                                            >
                                              Cust. Total Amt.
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {bookingData.SupervisorBookings.map(
                                            (supervisorBooking, index) => {
                                              const totalPrice =
                                                Number(
                                                  supervisorBooking.Price || 0,
                                                ) +
                                                Number(
                                                  supervisorBooking.GSTAmount ||
                                                    0,
                                                ) +
                                                Number(
                                                  supervisorBooking.LabourCharges ||
                                                    0,
                                                );

                                              return (
                                                <tr
                                                  key={
                                                    supervisorBooking.Id ||
                                                    index
                                                  }
                                                >
                                                  <td className="text-center">
                                                    {index + 1}.
                                                  </td>
                                                  <td className="normal">
                                                    {supervisorBooking.ServiceType ||
                                                      "—"}
                                                  </td>
                                                  <td className="normal">
                                                    <div className="normal">
                                                      {supervisorBooking.ServiceName ||
                                                        "—"}
                                                      {supervisorBooking.Includes &&
                                                        (Array.isArray(
                                                          supervisorBooking.Includes,
                                                        )
                                                          ? supervisorBooking
                                                              .Includes.length >
                                                              0 && (
                                                              <ul
                                                                className="text-muted small ps-3 mb-0 mt-2"
                                                                style={{
                                                                  textAlign:
                                                                    "left",
                                                                }}
                                                              >
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
                                                          : typeof supervisorBooking.Includes ===
                                                              "string" &&
                                                            supervisorBooking.Includes.trim() !==
                                                              "" && (
                                                              <div className="text-muted small mt-2">
                                                                {
                                                                  supervisorBooking.Includes
                                                                }
                                                              </div>
                                                            ))}
                                                    </div>
                                                  </td>

                                                  <td className="normal">
                                                    {supervisorBooking.CreatedDate
                                                      ? new Date(
                                                          supervisorBooking.CreatedDate,
                                                        ).toLocaleDateString(
                                                          "en-IN",
                                                        )
                                                      : "—"}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      supervisorBooking.BasePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      supervisorBooking.DealerBasePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {supervisorBooking.Quantity ??
                                                      "1"}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      supervisorBooking.Price ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      supervisorBooking.DealerSparePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      supervisorBooking.LabourCharges ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      supervisorBooking.DealerPrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {supervisorBooking.GSTPercent ??
                                                      0}
                                                    %
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {supervisorBooking.DealerGSTPercent ??
                                                      0}
                                                    %
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      supervisorBooking.GSTAmount ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      supervisorBooking.DealerGSTAmount ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {supervisorBooking.Percentage ??
                                                      "0"}
                                                    %
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      supervisorBooking.Our_Earnings ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  {/* <td
                                                  className="normal text-center"
                                                  style={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                  }}
                                                >
                                                  {supervisorBooking.DealerName || "Not Assigned"}
                                                </td> */}
                                                  <td
                                                    className=" normal text-center"
                                                    style={{
                                                      whiteSpace: "normal",
                                                      wordBreak: "break-word",
                                                    }}
                                                  >
                                                    {supervisorBooking.DealerName ||
                                                      "—"}

                                                    {supervisorBooking.IsDealer_Confirm &&
                                                      supervisorBooking.DealerName && (
                                                        <span
                                                          className={`badge px-3 py-2 rounded-pill ${
                                                            supervisorBooking.IsDealer_Confirm ===
                                                            "Approved"
                                                              ? "bg-success text-white"
                                                              : supervisorBooking.IsDealer_Confirm ===
                                                                  "Rejected"
                                                                ? "bg-danger text-white"
                                                                : supervisorBooking.IsDealer_Confirm ===
                                                                    "Pending"
                                                                  ? "bg-warning text-dark"
                                                                  : "bg-secondary text-white"
                                                          }`}
                                                        >
                                                          {
                                                            supervisorBooking.IsDealer_Confirm
                                                          }
                                                        </span>
                                                      )}
                                                  </td>
                                                  {/* <td className="text-center">
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
                                                </td> */}
                                                  <td className="text-end fw-bold dlr-column">
                                                    {(
                                                      Number(
                                                        supervisorBooking.DealerSparePrice ||
                                                          0,
                                                      ) +
                                                      Number(
                                                        supervisorBooking.DealerPrice ||
                                                          0,
                                                      ) +
                                                      Number(
                                                        supervisorBooking.DealerGSTAmount ||
                                                          0,
                                                      )
                                                    ).toFixed(2)}
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

                            {false &&
                              bookingData?.CustomerRejectedBookings?.length >
                                0 && (
                                <div className="card mb-4 mt-4">
                                  <div className="card-header bg-danger text-light">
                                    <h6 className="mb-0 fw-bold text-white">
                                      Customer Rejected Services
                                    </h6>
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
                                        className="table table-sm table-striped table-hover align-middle mb-0 table-center-all"
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
                                            <th style={{ width: "100px" }}>
                                              Type
                                            </th>
                                            <th style={{ width: "180px" }}>
                                              Service Name
                                            </th>
                                            <th style={{ width: "100px" }}>
                                              Date
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              Part Price
                                            </th>
                                            <th
                                              style={{ width: "125px" }}
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
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
                                              className="text-end dlr-column"
                                            >
                                              DLR GST Amt.
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              MCB Margin Amount
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              MCB Amt.
                                            </th>
                                            <th
                                              style={{ width: "170px" }}
                                              className="text-center"
                                            >
                                              Dealer Name
                                            </th>
                                            <th
                                              style={{ width: "140px" }}
                                              className="text-end"
                                            >
                                              DLR Total Amt.
                                            </th>
                                            <th
                                              style={{ width: "150px" }}
                                              className="text-end"
                                            >
                                              Cust. Total Amt.
                                            </th>
                                            <th
                                              style={{ width: "100px" }}
                                              className="text-end"
                                            >
                                              Action
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {bookingData?.CustomerRejectedBookings?.map(
                                            (
                                              CustomerRejectedBookings,
                                              index,
                                            ) => {
                                              const totalPrice =
                                                Number(
                                                  CustomerRejectedBookings.Price ||
                                                    0,
                                                ) +
                                                Number(
                                                  CustomerRejectedBookings.GSTAmount ||
                                                    0,
                                                ) +
                                                Number(
                                                  CustomerRejectedBookings.LabourCharges ||
                                                    0,
                                                );

                                              return (
                                                <tr
                                                  key={
                                                    CustomerRejectedBookings.Id ||
                                                    index
                                                  }
                                                >
                                                  <td className="text-center">
                                                    {index + 1}.
                                                  </td>
                                                  <td className="normal">
                                                    {CustomerRejectedBookings.ServiceType ||
                                                      "—"}
                                                  </td>
                                                  <td className="normal">
                                                    <div className="normal">
                                                      {CustomerRejectedBookings.ServiceName ||
                                                        "—"}
                                                      {CustomerRejectedBookings.Includes &&
                                                        (Array.isArray(
                                                          CustomerRejectedBookings.Includes,
                                                        )
                                                          ? CustomerRejectedBookings
                                                              .Includes.length >
                                                              0 && (
                                                              <ul
                                                                className="text-muted small ps-3 mb-0 mt-2"
                                                                style={{
                                                                  textAlign:
                                                                    "left",
                                                                }}
                                                              >
                                                                {CustomerRejectedBookings.Includes.map(
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
                                                          : typeof CustomerRejectedBookings.Includes ===
                                                              "string" &&
                                                            CustomerRejectedBookings.Includes.trim() !==
                                                              "" && (
                                                              <div className="text-muted small mt-2">
                                                                {
                                                                  CustomerRejectedBookings.Includes
                                                                }
                                                              </div>
                                                            ))}
                                                    </div>
                                                  </td>

                                                  <td className="normal">
                                                    {CustomerRejectedBookings.CreatedDate
                                                      ? new Date(
                                                          CustomerRejectedBookings.CreatedDate,
                                                        ).toLocaleDateString(
                                                          "en-IN",
                                                        )
                                                      : "—"}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      CustomerRejectedBookings.BasePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      CustomerRejectedBookings.DealerBasePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {CustomerRejectedBookings.Quantity ??
                                                      "1"}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      CustomerRejectedBookings.Price ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      CustomerRejectedBookings.DealerSparePrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      CustomerRejectedBookings.LabourCharges ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      CustomerRejectedBookings.DealerPrice ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {CustomerRejectedBookings.GSTPercent ??
                                                      0}
                                                    %
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {CustomerRejectedBookings.DealerGSTPercent ??
                                                      0}
                                                    %
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      CustomerRejectedBookings.GSTAmount ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end dlr-column">
                                                    {Number(
                                                      CustomerRejectedBookings.DealerGSTAmount ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end">
                                                    {CustomerRejectedBookings.Percentage ??
                                                      "0"}
                                                    %
                                                  </td>
                                                  <td className="text-end">
                                                    {Number(
                                                      CustomerRejectedBookings.Our_Earnings ||
                                                        0,
                                                    ).toFixed(2)}
                                                  </td>
                                                  {/* <td
                                                  className="normal text-center"
                                                  style={{
                                                    whiteSpace: "normal",
                                                    wordBreak: "break-word",
                                                  }}
                                                >
                                                  {CustomerRejectedBookings.DealerName || "Not Assigned"}
                                                </td> */}
                                                  <td
                                                    className=" normal text-center"
                                                    style={{
                                                      whiteSpace: "normal",
                                                      wordBreak: "break-word",
                                                    }}
                                                  >
                                                    {CustomerRejectedBookings.DealerName ||
                                                      "—"}

                                                    {CustomerRejectedBookings.IsDealer_Confirm &&
                                                      CustomerRejectedBookings.DealerName && (
                                                        <span
                                                          className={`badge px-3 py-2 rounded-pill ${
                                                            CustomerRejectedBookings.IsDealer_Confirm ===
                                                            "Approved"
                                                              ? "bg-success text-white"
                                                              : CustomerRejectedBookings.IsDealer_Confirm ===
                                                                  "Rejected"
                                                                ? "bg-danger text-white"
                                                                : CustomerRejectedBookings.IsDealer_Confirm ===
                                                                    "Pending"
                                                                  ? "bg-warning text-dark"
                                                                  : "bg-secondary text-white"
                                                          }`}
                                                        >
                                                          {
                                                            CustomerRejectedBookings.IsDealer_Confirm
                                                          }
                                                        </span>
                                                      )}
                                                  </td>
                                                  <td className="text-end fw-bold dlr-column">
                                                    {(
                                                      Number(
                                                        CustomerRejectedBookings.DealerSparePrice ||
                                                          0,
                                                      ) +
                                                      Number(
                                                        CustomerRejectedBookings.DealerPrice ||
                                                          0,
                                                      ) +
                                                      Number(
                                                        CustomerRejectedBookings.DealerGSTAmount ||
                                                          0,
                                                      )
                                                    ).toFixed(2)}
                                                  </td>
                                                  <td className="text-end fw-bold text-primary">
                                                    {totalPrice.toFixed(2)}
                                                  </td>
                                                  <td className="text-center">
                                                    <button
                                                      className="btn btn-sm btn-primary-600"
                                                      onClick={() =>
                                                        handleRevertService(
                                                          CustomerRejectedBookings,
                                                        )
                                                      }
                                                      disabled={
                                                        revertingServiceId ===
                                                        CustomerRejectedBookings.Id
                                                      }
                                                    >
                                                      {revertingServiceId ===
                                                      CustomerRejectedBookings.Id ? ( // <--- SHOW SPINNER
                                                        <>
                                                          <span
                                                            className="spinner-border spinner-border-sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                          ></span>
                                                          Reverting...
                                                        </>
                                                      ) : (
                                                        <>
                                                          <i className="bi bi-arrow-counterclockwise me-1"></i>
                                                          Revert
                                                        </>
                                                      )}
                                                    </button>
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

                            {customerRejectedComparisonServices.length > 0 && (
                              <div className="card mb-4 mt-4 shadow-sm pricing-intelligence-card">
                                <div className="">
                                  <div className="pricing-panel mb-4">
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                      <div>
                                        <h6 className="mb-1 fw-bold text-danger">
                                          Customer rejected services
                                        </h6>
                                        <div className="small text-muted">
                                          Rejected services shown in the same
                                          detailed pricing-card layout with a
                                          direct revert action in each row.
                                        </div>
                                      </div>
                                      <div className="d-flex flex-wrap gap-2">
                                        <span className="pricing-chip">
                                          Dealer{" "}
                                          {formatCurrency(
                                            customerRejectedPricingTotals.dealerTotal,
                                          )}
                                        </span>
                                        <span className="pricing-chip">
                                          Customer{" "}
                                          {formatCurrency(
                                            customerRejectedPricingTotals.customerTotal,
                                          )}
                                        </span>
                                        <span className="pricing-chip">
                                          Total Profit{" "}
                                          {formatCurrency(
                                            customerRejectedPricingTotals.customerTotal -
                                              customerRejectedPricingTotals.dealerTotal +
                                              customerRejectedPricingTotals.marginAmount,
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="service-compare-list">
                                      {customerRejectedComparisonServices.map(
                                        (service) => (
                                          <div
                                            key={service.id}
                                            className="service-compare-card"
                                          >
                                            <div className="service-compare-top">
                                              <div>
                                                <div className="service-compare-title">
                                                  <b>Service Name: </b>
                                                  {service.serviceName}
                                                  <span className="ms-2 pricing-chip">
                                                    {service.serviceType}
                                                  </span>
                                                  <span className="ms-2 pricing-chip">
                                                    Qty {service.quantity}
                                                  </span>
                                                </div>
                                                <div className="service-compare-title-include">
                                                  <span className="">
                                                    <b>Includes: </b>{" "}
                                                    {service.incNames}
                                                  </span>
                                                </div>
                                                <div className="small text-muted mt-1">
                                                  <b>Dealer Name: </b>
                                                  {service.dealerName} |{" "}
                                                  <b>Added on: </b>{" "}
                                                  {service.createdAt
                                                    ? formatDateTime(
                                                        service.createdAt,
                                                      )
                                                    : "N/A"}
                                                </div>
                                                <div className="service-compare-meta">
                                                  <span
                                                    className={`badge rounded-pill px-3 py-2 ${getPricingStageBadgeClass(
                                                      service.stage,
                                                    )}`}
                                                  >
                                                    {service.stage}
                                                  </span>
                                                  <span
                                                    className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                                      service.dealerConfirmStatus,
                                                    )}`}
                                                  >
                                                    Dealer{" "}
                                                    {
                                                      service.dealerConfirmStatus
                                                    }
                                                  </span>
                                                  <span
                                                    className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                                      service.serviceStatus,
                                                    )}`}
                                                  >
                                                    Service{" "}
                                                    {service.serviceStatus}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="text-end">
                                                <div className="small text-muted">
                                                  Price spread
                                                </div>
                                                <div
                                                  className={
                                                    service.priceSpread >= 0
                                                      ? "pricing-spread-positive"
                                                      : "pricing-spread-negative"
                                                  }
                                                  style={{
                                                    fontSize: "1.05rem",
                                                  }}
                                                >
                                                  {formatCurrency(
                                                    service.priceSpread,
                                                  )}
                                                </div>
                                                <div className="small text-success mt-1">
                                                  Margin{" "}
                                                  {formatCurrency(
                                                    service.marginAmount,
                                                  )}{" "}
                                                  (
                                                  {service.marginPercent.toFixed(
                                                    2,
                                                  )}
                                                  %)
                                                </div>
                                              </div>
                                            </div>

                                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 mb-3">
                                              <div className="small text-muted">
                                                Customer rejected this service.
                                                Use revert if you want to move
                                                it back into the active flow.
                                              </div>
                                              <div>
                                                <button
                                                  className="btn btn-sm btn-primary-600"
                                                  onClick={() =>
                                                    handleRevertService(
                                                      service.sourceItem,
                                                    )
                                                  }
                                                  disabled={
                                                    revertingServiceId ===
                                                    service.sourceItem?.Id
                                                  }
                                                >
                                                  {revertingServiceId ===
                                                  service.sourceItem?.Id ? (
                                                    <>
                                                      <span
                                                        className="spinner-border spinner-border-sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                      ></span>{" "}
                                                      Reverting...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                                                      Revert
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>

                                            <div className="service-compare-grid">
                                              <div className="service-compare-section">
                                                <h6>Customer quote</h6>
                                                <div className="service-compare-line">
                                                  <span>Part total</span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.customerParts,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Service charge</span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.customerLabour,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>
                                                    CGST (
                                                    {service.customerGstPercent /
                                                      2}
                                                    %)
                                                  </span>
                                                  <strong>
                                                    {formatCurrency(
                                                      (
                                                        service.customerGst / 2
                                                      ).toFixed(2),
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>
                                                    SGST (
                                                    {service.customerGstPercent /
                                                      2}
                                                    %)
                                                  </span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.customerGst / 2,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Customer total</span>
                                                  <strong className="text-primary">
                                                    {formatCurrency(
                                                      service.customerTotal,
                                                    )}
                                                  </strong>
                                                </div>
                                              </div>

                                              <div className="service-compare-section">
                                                <h6>Dealer quote</h6>
                                                <div className="service-compare-line">
                                                  <span>Part total</span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.dealerParts,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Service charge</span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.dealerLabour,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>
                                                    CGST (
                                                    {service.dealerGstPercent /
                                                      2}
                                                    )%
                                                  </span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.dealerGst / 2,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>
                                                    SGST (
                                                    {service.dealerGstPercent /
                                                      2}
                                                    )%
                                                  </span>
                                                  <strong>
                                                    {formatCurrency(
                                                      service.dealerGst / 2,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Dealer total</span>
                                                  <strong className="text-warning-emphasis">
                                                    {formatCurrency(
                                                      service.dealerTotal,
                                                    )}
                                                  </strong>
                                                </div>
                                              </div>

                                              <div
                                                className={`service-compare-highlight ${
                                                  service.spreadWithoutMargin >
                                                  0
                                                    ? "warn"
                                                    : ""
                                                }`}
                                              >
                                                <div className="service-compare-line">
                                                  <span>MCB Margin %</span>
                                                  <strong className="text-success">
                                                    {service.marginPercent.toFixed(
                                                      2,
                                                    )}
                                                    %
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>MCB Margin Amount</span>
                                                  <strong className="text-success">
                                                    {formatCurrency(
                                                      service.marginAmount,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Company Profit</span>
                                                  <strong
                                                    className={
                                                      service.priceSpread >= 0
                                                        ? "pricing-spread-positive"
                                                        : "pricing-spread-negative"
                                                    }
                                                  >
                                                    {formatCurrency(
                                                      service.priceSpread,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>
                                                    Service Wise Profit
                                                  </span>
                                                  <strong
                                                    className={
                                                      service.spreadWithoutMargin >=
                                                      0
                                                        ? "text-info"
                                                        : "text-danger"
                                                    }
                                                  >
                                                    {formatCurrency(
                                                      service.spreadWithoutMargin,
                                                    )}
                                                  </strong>
                                                </div>
                                                <div className="service-compare-line">
                                                  <span>Last updated</span>
                                                  <strong>
                                                    {service.updatedAt
                                                      ? formatDateTime(
                                                          service.updatedAt,
                                                        )
                                                      : "N/A"}
                                                  </strong>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {liveComparisonServices.length > 0 && (
                              <div className="card mb-4 mt-4 shadow-sm pricing-intelligence-card">
                                <div className="">
                                  <div className="pricing-panel mb-4">
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                      <div>
                                        <h6 className="mb-1 fw-bold">
                                          Service-wise exact comparison
                                        </h6>
                                        <div className="small text-muted">
                                          Combined view of confirmed-service
                                          details and pricing comparison in one
                                          service card per row.
                                        </div>
                                      </div>
                                      <div className="d-flex flex-wrap gap-2">
                                        <span className="pricing-chip">
                                          Dealer{" "}
                                          {formatCurrency(
                                            pricingTotals.dealerTotal,
                                          )}
                                        </span>
                                        <span className="pricing-chip">
                                          Customer{" "}
                                          {formatCurrency(
                                            pricingTotals.customerTotal,
                                          )}
                                        </span>
                                        <span className="pricing-chip">
                                          Total Profit{" "}
                                          {formatCurrency(
                                            // pricingTotals.marginAmount,
                                            Number(
                                              pricingTotals.customerTotal,
                                            ) -
                                              Number(
                                                pricingTotals.dealerTotal,
                                              ) +
                                              Number(
                                                pricingTotals.marginAmount,
                                              ),
                                          )}{" "}
                                          {/* ({effectiveMarginPercent.toFixed(2)}%) */}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="service-compare-list">
                                      {liveComparisonServices.map((service) => (
                                        <div
                                          key={service.id}
                                          className="service-compare-card"
                                        >
                                          <div className="service-compare-top">
                                            <div>
                                              <div className="service-compare-title">
                                                <b>Service Name: </b>
                                                {service.serviceName}
                                                <span className="ms-2 pricing-chip">
                                                  {service.serviceType}
                                                </span>
                                                <span className="ms-2 pricing-chip">
                                                  Qty {service.quantity}
                                                </span>
                                              </div>
                                              <div className="service-compare-title-include">
                                                <span className="">
                                                  <b>Includes: </b>{" "}
                                                  {service.incNames}
                                                </span>
                                              </div>
                                              <div className="small text-muted mt-1">
                                                <b>Dealer Name: </b>
                                                {service.dealerName} |{" "}
                                                <b>Added on: </b>{" "}
                                                {service.createdAt
                                                  ? formatDateTime(
                                                      service.createdAt,
                                                    )
                                                  : "N/A"}
                                              </div>
                                              <div className="service-compare-meta">
                                                <span
                                                  className={`badge rounded-pill px-3 py-2 ${getPricingStageBadgeClass(
                                                    service.stage,
                                                  )}`}
                                                >
                                                  {service.stage}
                                                </span>
                                                <span
                                                  className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                                    service.dealerConfirmStatus,
                                                  )}`}
                                                >
                                                  Dealer{" "}
                                                  {service.dealerConfirmStatus}
                                                </span>
                                                <span
                                                  className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                                    service.serviceStatus,
                                                  )}`}
                                                >
                                                  {" "}
                                                  {service.serviceStatus ===
                                                  "InProgress"
                                                    ? "Service In Progress"
                                                    : service.serviceStatus ===
                                                        "ServiceCompleted"
                                                      ? "Service Completed"
                                                      : service.serviceStatus ===
                                                          "Pending"
                                                        ? "Service Pending"
                                                        : service.serviceStatus}
                                                </span>
                                              </div>
                                              {/* {service.includeNames.length >
                                                0 && (
                                                <div className="service-compare-include-row">
                                                  {service.includeNames.map(
                                                    (name, idx) => (
                                                      <span
                                                        key={`${service.id}-include-${idx}`}
                                                        className="pricing-chip"
                                                      >
                                                        {name}
                                                      </span>
                                                    ),
                                                  )}
                                                </div>
                                              )} */}
                                            </div>

                                            <div className="text-end">
                                              <div className="small text-muted">
                                                Price spread
                                              </div>
                                              <div
                                                className={
                                                  service.priceSpread >= 0
                                                    ? "pricing-spread-positive"
                                                    : "pricing-spread-negative"
                                                }
                                                style={{ fontSize: "1.05rem" }}
                                              >
                                                {formatCurrency(
                                                  service.priceSpread,
                                                )}
                                              </div>
                                              <div className="small text-success mt-1">
                                                Margin{" "}
                                                {formatCurrency(
                                                  service.marginAmount,
                                                )}{" "}
                                                (
                                                {service.marginPercent.toFixed(
                                                  2,
                                                )}
                                                %)
                                              </div>
                                            </div>
                                          </div>

                                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 mb-3">
                                            <div className="small text-muted">
                                              Dealer-completed services need
                                              approval from admin, field
                                              advisor, or supervisor.
                                            </div>
                                            <div>
                                              {service.isCompletionApproved ? (
                                                <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">
                                                  Service completion approved by{" "}
                                                  {service.completionApprovedBy ||
                                                    "reviewer"}
                                                </span>
                                              ) : service.serviceStatus ===
                                                "ServiceCompleted" ? (
                                                canReviewDealerCompletedService ? (
                                                  <select
                                                    className="form-select form-select-sm"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                      const selectedAction =
                                                        e.target.value;
                                                      if (!selectedAction) {
                                                        return;
                                                      }

                                                      if (
                                                        selectedAction ===
                                                        "Approve"
                                                      ) {
                                                        handleDirectApprove(
                                                          service.sourceItem,
                                                        );
                                                      } else if (
                                                        selectedAction ===
                                                        "Rework"
                                                      ) {
                                                        handleAddOnStatusChange(
                                                          service.sourceItem,
                                                          "Rework",
                                                        );
                                                      }

                                                      e.target.value = "";
                                                    }}
                                                  >
                                                    <option value="" disabled>
                                                      Approve or Rework
                                                    </option>
                                                    <option value="Approve">
                                                      Approve
                                                    </option>
                                                    <option value="Rework">
                                                      Rework
                                                    </option>
                                                  </select>
                                                ) : (
                                                  <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill">
                                                    Awaiting admin / field
                                                    advisor / supervisor
                                                    approval
                                                  </span>
                                                )
                                              ) : (
                                                <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill">
                                                  Approval available after
                                                  dealer marks service completed
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="service-compare-grid">
                                            <div className="service-compare-section">
                                              <h6>Customer Quote</h6>
                                              {/* <div className="service-compare-line">
                                                <span>Part unit price</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.customerPartUnit,
                                                  )}
                                                </strong>
                                              </div> */}
                                              <div className="service-compare-line">
                                                <span>Part total</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.customerParts,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Service charge</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.customerLabour,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>
                                                  CGST (
                                                  {service.customerGstPercent /
                                                    2}
                                                  %)
                                                </span>
                                                <strong>
                                                  {formatCurrency(
                                                    (
                                                      service.customerGst / 2
                                                    ).toFixed(2),
                                                  )}
                                                </strong>
                                              </div>

                                              <div className="service-compare-line">
                                                <span>
                                                  SGST (
                                                  {service.customerGstPercent /
                                                    2}
                                                  %)
                                                </span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.customerGst / 2,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Customer total</span>
                                                <strong className="text-primary">
                                                  {formatCurrency(
                                                    service.customerTotal,
                                                  )}
                                                </strong>
                                              </div>
                                            </div>

                                            <div className="service-compare-section">
                                              <h6>Dealer Quote</h6>
                                              {/* <div className="service-compare-line">
                                                <span>Part unit price</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.dealerPartUnit,
                                                  )}
                                                </strong> 
                                              </div> */}
                                              <div className="service-compare-line">
                                                <span>Part total</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.dealerParts,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Service charge</span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.dealerLabour,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>
                                                  CGST (
                                                  {service.dealerGstPercent / 2}
                                                  )%
                                                </span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.dealerGst / 2,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>
                                                  SGST (
                                                  {service.dealerGstPercent / 2}
                                                  )%
                                                </span>
                                                <strong>
                                                  {formatCurrency(
                                                    service.dealerGst / 2,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Dealer total</span>
                                                <strong className="text-warning-emphasis">
                                                  {formatCurrency(
                                                    service.dealerTotal,
                                                  )}
                                                </strong>
                                              </div>
                                            </div>

                                            <div
                                              className={`service-compare-highlight ${
                                                service.spreadWithoutMargin > 0
                                                  ? "warn"
                                                  : ""
                                              }`}
                                            >
                                              <h6>Profit Summary</h6>
                                              <div className="service-compare-line">
                                                <span>MCB Margin %</span>
                                                <strong className="text-success">
                                                  {service.marginPercent.toFixed(
                                                    2,
                                                  )}
                                                  %
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>MCB Margin Amount</span>
                                                <strong className="text-success">
                                                  {formatCurrency(
                                                    service.marginAmount,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Company Profit</span>
                                                <strong
                                                  className={
                                                    service.priceSpread >= 0
                                                      ? "pricing-spread-positive"
                                                      : "pricing-spread-negative"
                                                  }
                                                >
                                                  {formatCurrency(
                                                    service.priceSpread,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Service Wise Profit</span>
                                                <strong
                                                  className={
                                                    service.spreadWithoutMargin >=
                                                    0
                                                      ? "text-info"
                                                      : "text-danger"
                                                  }
                                                >
                                                  {formatCurrency(
                                                    service.spreadWithoutMargin,
                                                  )}
                                                </strong>
                                              </div>
                                              <div className="service-compare-line">
                                                <span>Last Updated</span>
                                                <strong
                                                  style={{ fontSize: "12px" }}
                                                >
                                                  {service.updatedAt
                                                    ? formatDateTime(
                                                        service.updatedAt,
                                                      )
                                                    : "N/A"}
                                                </strong>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pricing-panel mb-4">
                                    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                      <h6 className="mb-0 fw-bold">
                                        Margin definition
                                      </h6>
                                      <span className="pricing-chip">
                                        Total Profit = Customer Total - Dealer
                                        Total + MCB Margin
                                      </span>
                                    </div>

                                    <div className="row g-3">
                                      <div className="col-md-6 col-xl-3">
                                        <div className="pricing-kpi-card h-100">
                                          <div className="pricing-kpi-label">
                                            Dealer total
                                          </div>
                                          <div className="pricing-kpi-value">
                                            {formatCurrency(
                                              pricingTotals.dealerTotal,
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-md-6 col-xl-3">
                                        <div className="pricing-kpi-card h-100">
                                          <div className="pricing-kpi-label">
                                            Customer total
                                          </div>
                                          <div className="pricing-kpi-value">
                                            {formatCurrency(
                                              pricingTotals.customerTotal,
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-md-6 col-xl-3">
                                        <div className="pricing-kpi-card h-100">
                                          <div className="pricing-kpi-label">
                                            MCB Margin
                                          </div>
                                          <div className="pricing-kpi-value text-success">
                                            {formatCurrency(
                                              pricingTotals.marginAmount,
                                            )}
                                          </div>
                                          <div className="pricing-kpi-subtext">
                                            {effectiveMarginPercent.toFixed(2)}%
                                            of dealer total
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-md-6 col-xl-3">
                                        <div className="pricing-kpi-card h-100">
                                          <div className="pricing-kpi-label">
                                            Total Profit
                                          </div>
                                          <div className="pricing-kpi-value text-primary">
                                            {formatCurrency(
                                              Number(unmatchedSpreadAmount) +
                                                Number(
                                                  pricingTotals.marginAmount,
                                                ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* <div className="mt-4">
                                      <div className="d-flex justify-content-between small text-muted mb-2">
                                        <span>Visual split</span>
                                        <span>
                                          Dealer + Margin + Total Profit
                                        </span>
                                      </div>
                                      <div className="pricing-visual-track">
                                        <span
                                          className="pricing-visual-dealer"
                                          style={{
                                            width: `${dealerBarWidth}%`,
                                          }}
                                        />
                                        <span
                                          className="pricing-visual-margin"
                                          style={{
                                            width: `${marginBarWidth}%`,
                                          }}
                                        />
                                        <span
                                          className="pricing-visual-extra"
                                          style={{
                                            width: `${spreadExtraBarWidth}%`,
                                          }}
                                        />
                                      </div>
                                    </div> */}
                                  </div>

                                  <div
                                    className="pricing-kpi-grid mb-4"
                                    style={{ display: "none" }}
                                  >
                                    <div className="pricing-kpi-card">
                                      <div className="pricing-kpi-label">
                                        Dealer total
                                      </div>
                                      <div className="pricing-kpi-value">
                                        {formatCurrency(
                                          pricingTotals.dealerTotal,
                                        )}
                                      </div>
                                      <div className="pricing-kpi-subtext">
                                        Parts{" "}
                                        {formatCurrency(
                                          pricingTotals.dealerParts,
                                        )}
                                        , labour{" "}
                                        {formatCurrency(
                                          pricingTotals.dealerLabour,
                                        )}
                                      </div>
                                    </div>

                                    <div className="pricing-kpi-card">
                                      <div className="pricing-kpi-label">
                                        Customer total
                                      </div>
                                      <div className="pricing-kpi-value">
                                        {formatCurrency(
                                          pricingTotals.customerTotal,
                                        )}
                                      </div>
                                      <div className="pricing-kpi-subtext">
                                        Parts{" "}
                                        {formatCurrency(
                                          pricingTotals.customerParts,
                                        )}
                                        , labour{" "}
                                        {formatCurrency(
                                          pricingTotals.customerLabour,
                                        )}
                                      </div>
                                    </div>

                                    <div className="pricing-kpi-card">
                                      <div className="pricing-kpi-label">
                                        MCB Margin Amount
                                      </div>
                                      <div className="pricing-kpi-value text-success">
                                        {formatCurrency(
                                          pricingTotals.marginAmount,
                                        )}
                                      </div>
                                      <div className="pricing-kpi-subtext">
                                        Margin available on{" "}
                                        {pricingTotals.marginServices}{" "}
                                        service(s)
                                      </div>
                                    </div>

                                    <div className="pricing-kpi-card">
                                      <div className="pricing-kpi-label">
                                        Effective margin %
                                      </div>
                                      <div className="pricing-kpi-value text-success">
                                        {effectiveMarginPercent.toFixed(2)}%
                                      </div>
                                      <div className="pricing-kpi-subtext">
                                        Margin amount divided by dealer total
                                      </div>
                                    </div>

                                    <div className="pricing-kpi-card">
                                      <div className="pricing-kpi-label">
                                        Price spread
                                      </div>
                                      <div className="pricing-kpi-value text-primary">
                                        {formatCurrency(
                                          pricingTotals.priceSpread,
                                        )}
                                      </div>
                                      <div className="pricing-kpi-subtext">
                                        {priceSpreadPercent.toFixed(2)}% higher
                                        than dealer total
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className="row g-4"
                                    style={{ display: "none" }}
                                  >
                                    <div className="col-12 col-xl-4">
                                      <div className="pricing-panel">
                                        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                          <h6 className="mb-0 fw-bold">
                                            Margin definition
                                          </h6>
                                          <span className="pricing-chip">
                                            Total Profit = Customer Total -
                                            Dealer Total + MCB Margin
                                          </span>
                                        </div>

                                        <div className="pricing-note-card mb-3">
                                          <div className="fw-semibold text-dark mb-1">
                                            Margin means the company earning
                                          </div>
                                          <div className="small text-muted">
                                            Margin Amount is taken from{" "}
                                            <strong>`Our_Earnings`</strong>.
                                            Margin Percentage is taken from{" "}
                                            <strong>`Percentage`</strong>.
                                          </div>
                                        </div>

                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            Dealer quote total
                                          </span>
                                          <strong>
                                            {formatCurrency(
                                              pricingTotals.dealerTotal,
                                            )}
                                          </strong>
                                        </div>
                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            Customer quote total
                                          </span>
                                          <strong>
                                            {formatCurrency(
                                              pricingTotals.customerTotal,
                                            )}
                                          </strong>
                                        </div>
                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            MCB Margin Amount
                                          </span>
                                          <strong className="text-success">
                                            {formatCurrency(
                                              pricingTotals.marginAmount,
                                            )}
                                          </strong>
                                        </div>
                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            MCB Margin %
                                          </span>
                                          <strong className="text-success">
                                            {effectiveMarginPercent.toFixed(2)}%
                                          </strong>
                                        </div>
                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            Customer price spread
                                          </span>
                                          <strong className="text-primary">
                                            {formatCurrency(
                                              pricingTotals.priceSpread,
                                            )}
                                          </strong>
                                        </div>
                                        <div className="pricing-breakdown-row">
                                          <span className="text-muted">
                                            Spread not explained by margin
                                          </span>
                                          <strong
                                            className={
                                              unmatchedSpreadAmount >= 0
                                                ? "text-info"
                                                : "text-danger"
                                            }
                                          >
                                            {formatCurrency(
                                              unmatchedSpreadAmount,
                                            )}
                                          </strong>
                                        </div>

                                        {/* <div className="mt-4">
                                          <div className="d-flex justify-content-between small text-muted mb-2">
                                            <span>Visual split</span>
                                            <span>
                                              Dealer + Margin + Total Profit
                                            </span>
                                          </div>
                                          <div className="pricing-visual-track">
                                            <span
                                              className="pricing-visual-dealer"
                                              style={{
                                                width: `${dealerBarWidth}%`,
                                              }}
                                            />
                                            <span
                                              className="pricing-visual-margin"
                                              style={{
                                                width: `${marginBarWidth}%`,
                                              }}
                                            />
                                            <span
                                              className="pricing-visual-extra"
                                              style={{
                                                width: `${spreadExtraBarWidth}%`,
                                              }}
                                            />
                                          </div>
                                          <div className="d-flex flex-wrap gap-2 mt-3">
                                            <span className="pricing-chip">
                                              Dealer{" "}
                                              {formatCurrency(
                                                pricingTotals.dealerTotal,
                                              )}
                                            </span>
                                            <span className="pricing-chip">
                                              Margin{" "}
                                              {formatCurrency(
                                                pricingTotals.marginAmount,
                                              )}
                                            </span>
                                            <span className="pricing-chip">
                                              Total Profit{" "}
                                              {formatCurrency(
                                                Math.max(
                                                  unmatchedSpreadAmount,
                                                  0,
                                                ),
                                              )}
                                            </span>
                                          </div>
                                        </div> */}
                                      </div>
                                    </div>

                                    <div className="col-12 col-xl-8">
                                      <div className="pricing-panel">
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                          <div>
                                            <h6 className="mb-1 fw-bold">
                                              Service-wise exact comparison
                                            </h6>
                                            <div className="small text-muted">
                                              Every row shows dealer total,
                                              customer total, MCB Margin, and
                                              the final spread.
                                            </div>
                                          </div>
                                          <div className="d-flex flex-wrap gap-2">
                                            <span className="pricing-chip">
                                              Services:{" "}
                                              {liveComparisonServices.length}
                                            </span>
                                            <span className="pricing-chip">
                                              Variance rows:{" "}
                                              {pricingTotals.varianceServices}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="table-responsive">
                                          <table className="table table-hover align-middle pricing-comparison-table mb-0">
                                            <thead className="table-light">
                                              <tr>
                                                <th>Service</th>
                                                <th>Status</th>
                                                <th>Dealer</th>
                                                <th className="text-end">
                                                  Dealer Total
                                                </th>
                                                <th className="text-end">
                                                  Customer Total
                                                </th>
                                                <th className="text-end">
                                                  Margin %
                                                </th>
                                                <th className="text-end">
                                                  Margin Amt
                                                </th>
                                                <th className="text-end">
                                                  Price Spread
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {liveComparisonServices.map(
                                                (service) => (
                                                  <tr key={service.id}>
                                                    <td>
                                                      <div className="fw-semibold text-dark">
                                                        {service.serviceName}
                                                      </div>
                                                      <div className="small text-muted">
                                                        {service.dealerName}
                                                      </div>
                                                    </td>
                                                    <td>
                                                      <span
                                                        className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(
                                                          service.stage,
                                                        )}`}
                                                      >
                                                        {service.stage}
                                                      </span>
                                                    </td>
                                                    <td>
                                                      <div className="small text-muted">
                                                        Parts{" "}
                                                        {formatCurrency(
                                                          service.dealerParts,
                                                        )}
                                                      </div>
                                                      <div className="small text-muted">
                                                        Labour{" "}
                                                        {formatCurrency(
                                                          service.dealerLabour,
                                                        )}
                                                      </div>
                                                      <div className="small text-muted">
                                                        GST{" "}
                                                        {formatCurrency(
                                                          service.dealerGst,
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="text-end fw-semibold">
                                                      {formatCurrency(
                                                        service.dealerTotal,
                                                      )}
                                                    </td>
                                                    <td className="text-end fw-semibold text-primary">
                                                      {formatCurrency(
                                                        service.customerTotal,
                                                      )}
                                                    </td>
                                                    <td className="text-end">
                                                      {service.marginPercent.toFixed(
                                                        2,
                                                      )}
                                                      %
                                                    </td>
                                                    <td className="text-end text-success fw-semibold">
                                                      {formatCurrency(
                                                        service.marginAmount,
                                                      )}
                                                    </td>
                                                    <td
                                                      className={`text-end ${
                                                        service.priceSpread >= 0
                                                          ? "pricing-spread-positive"
                                                          : "pricing-spread-negative"
                                                      }`}
                                                    >
                                                      {formatCurrency(
                                                        service.priceSpread,
                                                      )}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {bookingData ? (
                              <>
                                <div className="mt-2 border-top pt-2">
                                  {/* ===================== DEALER BILLING SUMMARY ===================== */}
                                  {false &&
                                    (hasDlrConfirmed || hasDlrUnconfirmed) && (
                                      <div className="mb-4">
                                        <div
                                          className="d-flex fw-bold mb-2 border-bottom pb-1 bg-warning-subtle text-warning-emphasis px-2 rounded-top"
                                          style={{ fontSize: "16px" }}
                                        >
                                          <div style={{ flex: "1" }}>
                                            Dealer Billing Summary
                                          </div>
                                          {showDlrComparison && (
                                            <div
                                              style={{ width: "180px" }}
                                              className="text-center"
                                            >
                                              Not Confirmed Services
                                            </div>
                                          )}
                                          <div
                                            style={{ width: "180px" }}
                                            className="text-end"
                                          >
                                            {hasDlrConfirmed
                                              ? "Confirmed Services"
                                              : "Not Confirmed Services"}
                                          </div>
                                        </div>

                                        <div className="billing-rows">
                                          {[
                                            {
                                              label: "Parts Subtotal",
                                              cnc: dlrCncTotals.parts,
                                              cc: dlrCcTotals.parts,
                                            },
                                            {
                                              label: "Service Charges",
                                              cnc: dlrCncTotals.labour,
                                              cc: dlrCcTotals.labour,
                                            },
                                            {
                                              label: "SGST(9%)",
                                              cnc: dlrCncTotals.gst / 2,
                                              cc: dlrCcTotals.gst / 2,
                                            },
                                            {
                                              label: "CGST(9%)",
                                              cnc: dlrCncTotals.gst / 2,
                                              cc: dlrCcTotals.gst / 2,
                                            },
                                          ].map((row, idx) => {
                                            const centerValue =
                                              showDlrComparison
                                                ? row.cnc
                                                : null;
                                            const rightValue =
                                              !hasDlrConfirmed &&
                                              hasDlrUnconfirmed
                                                ? row.cnc
                                                : row.cc;

                                            return (
                                              <div
                                                key={idx}
                                                className="d-flex py-1 border-bottom-dashed align-items-center"
                                              >
                                                <span
                                                  className="text-secondary"
                                                  style={{ flex: "1" }}
                                                >
                                                  {row.label}
                                                </span>
                                                {showDlrComparison && (
                                                  <span
                                                    className="text-center"
                                                    style={{ width: "180px" }}
                                                  >
                                                    ₹
                                                    {Number(
                                                      centerValue || 0,
                                                    ).toFixed(2)}
                                                  </span>
                                                )}
                                                <span
                                                  className="text-end"
                                                  style={{ width: "180px" }}
                                                >
                                                  ₹
                                                  {Number(
                                                    rightValue || 0,
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                            );
                                          })}

                                          <div className="d-flex py-2 align-items-center fw-bold border-top mt-1">
                                            <span
                                              className="text-dark"
                                              style={{ flex: "1" }}
                                            >
                                              Dealer Total Amount
                                            </span>
                                            {showDlrComparison && (
                                              <span
                                                className="text-dark text-center"
                                                style={{ width: "180px" }}
                                              >
                                                ₹{dlrCncTotals.total.toFixed(2)}
                                              </span>
                                            )}
                                            <span
                                              className="text-dark text-end"
                                              style={{ width: "180px" }}
                                            >
                                              ₹
                                              {(!hasDlrConfirmed &&
                                              hasDlrUnconfirmed
                                                ? dlrCncTotals.total
                                                : dlrCcTotals.total
                                              ).toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                                {/* <div className="mt-2 border-top pt-2">
                                  <div className="d-flex fw-bold mb-2 border-bottom pb-1 bg-primary-subtle text-primary-emphasis px-2 rounded-top" style={{ fontSize: '16px', display: 'none' }}>
                                    <div style={{ flex: '1' }}>Customer Billing Summary</div>
                                    {showComparison && (
                                      <div style={{ width: '180px' }} className="text-center">Not Confirmed Services</div>
                                    )}
                                    {(hasConfirmed || hasUnconfirmed) && (
                                      <div style={{ width: '180px' }} className="text-end">
                                        {hasConfirmed ? "Confirmed Services" : "Not Confirmed Services"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="billing-rows" style={{ display: "none" }}>
                                    {[
                                      { label: "Parts Subtotal", cnc: cncTotals.parts, cc: bookingData.TotalPrice },
                                      { label: "Service Charges", cnc: cncTotals.labour, cc: bookingData.LabourCharges },
                                      { label: "SGST(9%)", cnc: cncTotals.gst / 2, cc: (bookingData.GSTAmount || 0) / 2 },
                                      { label: "CGST(9%)", cnc: cncTotals.gst / 2, cc: (bookingData.GSTAmount || 0) / 2 },
                                      { label: "Coupon", cc: bookingData.CouponAmount, isCoupon: true },
                                    ].map((row, idx) => {
                                      // Logic: If only CNC exists, row.cc will show CNC value on the right
                                      const centerValue = showComparison ? row.cnc : null;
                                      const rightValue = !hasConfirmed && hasUnconfirmed ? row.cnc : row.cc;

                                      if (row.isCoupon && !row.cc) return null; // Hide coupon if 0

                                      return (
                                        <div key={idx} className="d-flex py-1 border-bottom-dashed align-items-center">
                                          <span className="text-secondary" style={{ flex: '1' }}>{row.label}</span>

                                          {showComparison && (
                                            <span className=" text-center" style={{ width: '180px' }}>
                                              {row.label === "Coupon" ? "—" : `₹${Number(centerValue || 0).toFixed(2)}`}
                                            </span>
                                          )}

                                          <span className={`text-end ${row.isCoupon ? 'text-danger' : ''}`} style={{ width: '180px' }}>
                                            {row.isCoupon ? "-" : ""} ₹{Number(rightValue || 0).toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    })}

                                    <div className="d-flex py-2 align-items-center fw-bold border-top mt-1">
                                      <span className="text-dark" style={{ flex: '1' }}>Customer Total Amount</span>
                                      {showComparison && (
                                        <span className="text-dark text-center" style={{ width: '180px' }}>
                                          ₹{cncTotals.total.toFixed(2)}
                                        </span>
                                      )}
                                      <span className="text-dark text-end" style={{ width: '180px' }}>
                                        ₹{(!hasConfirmed && hasUnconfirmed ? cncTotals.total : totalAmount).toFixed(2)}
                                      </span>
                                    </div>

                                    {hasConfirmed && (
                                      <>
                                        <div className="d-flex py-1 align-items-center  fw-bold border-top mt-1">
                                          <span className="text-secondary" style={{ flex: '1' }}>Paid Amount</span>
                                          <span className="text-success text-end" style={{ width: '180px' }}>
                                            - ₹{alreadyPaidDisplay.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="d-flex py-2 align-items-center fw-bold border-top mt-1">
                                          <span className="text-dark" style={{ flex: '1' }}>Balance Amount</span>
                                          <span className="text-primary text-end" style={{ width: '180px' }}>
                                            ₹{remainingAmount.toFixed(2)}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div> */}
                                {bookingData?.SupervisorBookings &&
                                  bookingData.SupervisorBookings.length > 0 && (
                                    <div className="alert alert-info py-2 px-3 mb-2 mb-md-3 small">
                                      There are{" "}
                                      <strong>
                                        {bookingData.SupervisorBookings.length}
                                      </strong>{" "}
                                      service(s) that need to be confirmed by
                                      the customer.
                                    </div>
                                  )}
                                {(() => {
                                  const addons = [
                                    ...(bookingData?.BookingAddOns || []),
                                    ...(bookingData?.BookingsTempAddons || []),
                                  ];
                                  const supervisorItems = [
                                    ...addons,
                                    ...(bookingData?.SupervisorBookings || []),
                                  ];
                                  const dlrPendingCount = addons.filter((a) => {
                                    const s = (
                                      a.StatusName ??
                                      a.statusName ??
                                      a.AddOnStatus ??
                                      a.addOnStatus ??
                                      a.Status
                                    )
                                      ?.toString()
                                      .trim()
                                      .toLowerCase();
                                    return (
                                      s !== "service completed" &&
                                      s !== "completed"
                                    );
                                  }).length;
                                  const supervisorPendingCount =
                                    supervisorItems.filter(
                                      (a) =>
                                        (a.IsSupervisor_Confirm ??
                                          a.isSupervisor_Confirm) !== 1,
                                    ).length;
                                  const isSupervisorAssigned = !!(
                                    bookingData?.SupervisorID ??
                                    bookingData?.SupervisorHeadId
                                  );
                                  return (
                                    <>
                                      {dlrPendingCount > 0 && (
                                        <div className="alert alert-warning py-2 px-3 mb-2 mb-md-3 small">
                                          <strong>{dlrPendingCount}</strong>{" "}
                                          services are pending for completion on
                                          the dealer side.
                                        </div>
                                      )}
                                      {!isSupervisorAssigned ? (
                                        <div className="alert alert-secondary py-2 px-3 mb-2 mb-md-3 small">
                                          Need to assign a Supervisor
                                        </div>
                                      ) : supervisorPendingCount > 0 ? (
                                        <div className="alert alert-secondary py-2 px-3 mb-2 mb-md-3 small">
                                          {supervisorPendingCount} service
                                          {supervisorPendingCount !== 1
                                            ? "s"
                                            : ""}{" "}
                                          need
                                          {supervisorPendingCount === 1
                                            ? "s"
                                            : ""}{" "}
                                          to be confirmed by the supervisor.
                                        </div>
                                      ) : null}
                                    </>
                                  );
                                })()}
                                <div className="d-flex justify-content-center gap-2 mt-3 mb-3 flex-wrap">
                                  {/* Show Confirm Payment only if not paid */}
                                  {showEnterPaymentButton &&
                                    !hideAllActions &&
                                    bookingData?.BookingStatus !==
                                      "Cancelled" && (
                                      <button
                                        className="btn btn-primary-600 btn-sm"
                                        onClick={() => {
                                          setPaymentMode("");
                                          setPayAmount(remainingAmount);
                                          setShowPaymentModal(true);
                                        }}
                                      >
                                        Payment Options
                                      </button>
                                    )}
                                  {/* Assign Button - hide when customer confirmation is pending */}
                                  {(role === "Admin" ||
                                    roleName === "Supervisor Head" ||
                                    roleName === "Field Advisor") &&
                                    bookingData?.BookingStatus !==
                                      "Completed" &&
                                    bookingData?.BookingAddOns != null &&
                                    Array.isArray(bookingData.BookingAddOns) &&
                                    bookingData.BookingAddOns.length > 0 &&
                                    (bookingData?.SupervisorBookings?.length ??
                                      0) === 0 &&
                                    !hideAllActions &&
                                    bookingData?.BookingStatus !==
                                      "Cancelled" && (
                                      <button
                                        className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center"
                                        // onClick={handleInitialAssignClick}
                                        onClick={() => {
                                          if (!ensureBasicDetails()) return;
                                          handleInitialAssignClick();
                                        }}
                                      >
                                        Assign Technician / Driver
                                      </button>
                                    )}

                                  {!hideAllActions &&
                                    roleName !== "Field Advisor" &&
                                    !hasOnlyZeroValueRejectedServices &&
                                    bookingData?.BookingStatus !==
                                      "Cancelled" && (
                                      <Link
                                        to={`/invoice-view/${bookingData?.BookingID}?type=Estimation`}
                                        className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center"
                                        title="View Estimation Invoice"
                                        onClick={(e) => {
                                          if (!ensureBasicDetails()) {
                                            e.preventDefault();
                                          } else if (!CheckServiceAmount()) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        View Estimation Invoice
                                      </Link>
                                    )}

                                  {/* {showEstimationButton && ( */}
                                  {/* {!hideAllActions && roleName !== "Field Advisor" && (
                                  <button
                                    className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                    onClick={() => {
                                      if (!ensureBasicDetails()) return;
                                      showGenerateInvoiceConfirm("Generate Estimation Invoice", handleGenerateEstimationInvoice, "Estimation");
                                      disabled={isGeneratingEstimation}
                                    }}
                                  >
                                   {isGeneratingEstimation ? ( 
                                          <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            Generating...
                                          </>
                                        ) : (
                                          "Generate Estimation Invoice"
                                        )}
                                  </button>
                                  )} */}
                                  {/* )} */}

                                  {/* Final Invoice: show only after full payment is completed */}
                                  {showFinalButton &&
                                    bookingData?.BookingStatus !==
                                      "Cancelled" && (
                                      <Link
                                        to={`/invoice-view/${bookingData?.BookingID}?type=Final`}
                                        className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                        title="View Estimation Invoice"
                                        onClick={(e) => {
                                          if (!ensureBasicDetails()) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        View Final Invoice
                                      </Link>
                                    )}
                                  {/* {showFinalButton && (
                                    <button
                                      className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                      onClick={() => {
                                        if (!ensureBasicDetails()) return;
                                        showGenerateInvoiceConfirm(
                                          "Generate Final Invoice",
                                          handleGenerateFinalInvoice,
                                          "Final",
                                        );
                                      }}
                                        disabled={isGeneratingFinal}
                                    >
                                     {isGeneratingFinal ? ( 
                                      <>
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                        Generating...
                                      </>
                                    ) : (
                                      " Generate Final Invoice"
                                    )}
                                    </button>
                                  )} */}
                                  {showDealerInvoiceButton && (
                                    <Link
                                      // to={`/invoice-view/${bookingData?.BookingID}?type=Dealer&dealerId=${
                                      //   bookingData?.BookingAddOns?.find((addon) => addon?.DealerID)?.DealerID
                                      // }`}
                                      to={`/invoice-view/${bookingData?.BookingID}?type=Dealer&dealerId=${firstPartnerDealerId}`}
                                      className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                      title="View Dealer Invoice"
                                      onClick={(e) => {
                                        // 1. Check basic details (Date, Address, Supervisor)
                                        if (!ensureBasicDetails()) {
                                          e.preventDefault();
                                          return;
                                        }

                                        // 2. Check if dealer ID exists before navigating
                                        const dealerID =
                                          bookingData?.BookingAddOns?.find(
                                            (addon) => addon?.DealerID,
                                          )?.DealerID;
                                        if (!dealerID) {
                                          e.preventDefault();
                                          Swal.fire(
                                            "Error",
                                            "No Dealer is assigned to the services yet.",
                                            "error",
                                          );
                                        }
                                      }}
                                    >
                                      View Dealer Invoice
                                    </Link>
                                  )}
                                  {/* {showDealerInvoiceButton && (
                                    <button
                                      className="btn btn-primary-600 btn-sm d-inline-flex align-items-center"
                                      onClick={() => {
                                        if (!ensureBasicDetails()) return;
                                        showGenerateInvoiceConfirm(
                                          "Generate Dealer Invoice",
                                          handleGenerateDealerInvoice,
                                          "Dealer",
                                        );
                                      }}
                                       disabled={isGeneratingDealer}
                                    >
                                        {isGeneratingDealer ? ( 
                                          <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            Generating...
                                          </>
                                        ) : (
                                          "Generate Dealer Invoice"
                                        )}
                                    </button>
                                  )} */}
                                </div>
                                {/* <div className="small text-muted mt-2 mb-0 fw-bold">
                                  <strong>Note:</strong> Estimation button displays when at least one service exists and supervisor has confirmed all services. Final Invoice button displays after full payment is completed.
                                </div> */}
                              </>
                            ) : (
                              <p className="text-muted mb-0">
                                Loading summary...
                              </p>
                            )}
                            {/* ============= Location Map ============= */}
                            {/* {bookingData?.Latitude && bookingData?.Longitude && (
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
                            )} */}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  ) : (
                    <p>Loading booking details...</p>
                  )}
                </div>
              </div>

              {/* ================= CAR PICKUP / DROP ACCORDION ================= */}
              <div
                className="accordion mb-3"
                id="carPickupDropAccordion"
                style={{ scrollMarginTop: "4.5rem" }}
              >
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
                      <Icon
                        icon="mdi:car-side"
                        width={20}
                        height={20}
                        className="text-primary"
                      />
                      <span className="fw-semibold text-primary">
                        Service Tracking
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
                      <div
                        className="rounded-3 overflow-hidden border-0 shadow-sm position-relative"
                        style={{
                          backgroundColor: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          zIndex: 1,
                          isolation: "isolate",
                        }}
                      >
                        {/* Header – dark teal with BID, OTP, Payment, action */}
                        <div
                          className="px-3 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2"
                          style={{
                            backgroundColor: "#0d9488",
                            color: "#fff",
                            minHeight: "48px",
                          }}
                        >
                          <span className="d-flex align-items-center gap-2 small fw-semibold text-white">
                            <Icon
                              icon="mdi:clipboard-check-outline"
                              width={20}
                              height={20}
                            />
                            BID : #{bookingData?.BookingTrackID || "—"}
                          </span>
                          <span className="opacity-90 fw-normal text-white ms-auto">
                            Date : {displayDate(bookingData?.BookingDate)}
                          </span>
                        </div>
                        {/* Timeline – dynamic from CarPickUpDelivery API */}
                        <div
                          className="p-4 position-relative"
                          style={{ backgroundColor: "#fff" }}
                        >
                          {(() => {
                            const list = bookingData?.CarPickUpDelivery ?? [];

                            const formatTimeOnly = (t) => {
                              if (!t) return "";
                              const m = String(t)
                                .trim()
                                .match(/^(\d{1,2}):(\d{2})/);
                              return m
                                ? `${m[1].padStart(2, "0")}:${m[2]}`
                                : "";
                            };
                            const steps = list.map((record, idx) => {
                              const formattedPickType = formatPickType(
                                record.PickType,
                              );

                              const routeType =
                                record.RouteType === "CustomerToDealer"
                                  ? "Customer To Dealer"
                                  : record.RouteType === "DealerToCustomer"
                                    ? "Dealer To Customer"
                                    : record.RouteType === "DealerToDealer"
                                      ? "Dealer To Dealer"
                                      : "—";

                              const isPick = (record.PickType || "")
                                .toLowerCase()
                                .includes("pick");

                              const assignStr = record.AssignDate
                                ? new Date(record.AssignDate).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "—";

                              const sub =
                                record.PickupDate && record.PickupTime
                                  ? `${displayDate(record.PickupDate)} ${formatTimeOnly(record.PickupTime)}`
                                  : record.DeliveryDate && record.DeliveryTime
                                    ? `${displayDate(record.DeliveryDate)} ${formatTimeOnly(record.DeliveryTime)}`
                                    : assignStr;

                              const label =
                                [formattedPickType, routeType]
                                  .filter(Boolean)
                                  .join(" – ") || "Service at Doorstep";

                              const done = !!(
                                record.PickupDate || record.DeliveryDate
                              );

                              return {
                                key: record.Id ?? idx,
                                label,
                                sub,
                                icon: isPick
                                  ? "mdi:car-pickup"
                                  : "mdi:car-side",
                                done,
                              };
                            });
                            if (steps.length === 0) {
                              return (
                                <p className="text-muted small mb-0 text-center py-3">
                                  No pickup/drop records for this booking.
                                </p>
                              );
                            }
                            return (
                              <div className="d-flex align-items-flex-start py-20 justify-content-between position-relative">
                                {steps.map((step, idx) => (
                                  <div
                                    key={step.key}
                                    className="d-flex flex-column align-items-center position-relative"
                                    style={{
                                      flex: "1 1 0",
                                      minWidth: 0,
                                      zIndex: 1,
                                    }}
                                  >
                                    {idx < steps.length - 1 && (
                                      <div
                                        className="position-absolute d-none d-md-block"
                                        style={{
                                          top: 20,
                                          left: "calc(50% + 24px)",
                                          width: "calc(100% - 28px)",
                                          height: 3,
                                          borderRadius: 2,
                                          backgroundColor: step.done
                                            ? "#0d9488"
                                            : "#0d9488",
                                          zIndex: 0,
                                        }}
                                      />
                                    )}
                                    <div
                                      className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                                      style={{
                                        width: 44,
                                        height: 44,
                                        backgroundColor: step.done
                                          ? "#0d9488"
                                          : "#0d9488",
                                        color: step.done ? "#fff" : "#fff",
                                        boxShadow: step.done
                                          ? "0 2px 6px rgba(13,148,136,0.35)"
                                          : "0 1px 3px rgba(0,0,0,0.08)",
                                      }}
                                    >
                                      <Icon
                                        icon={step.icon}
                                        width={20}
                                        height={20}
                                      />
                                    </div>
                                    <span
                                      className="small fw-bold text-center text-dark"
                                      style={{
                                        fontSize: "12px",
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      {step.label}
                                    </span>
                                    <span
                                      className="small text-muted text-center mt-1"
                                      style={{ fontSize: "11px" }}
                                    >
                                      {step.sub}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Technician Pickup / Drop Records – modern table */}
                        {(bookingData?.CarPickUpDelivery ?? []).length > 0 && (
                          <div className="border-top mt-4 pt-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span
                                className="rounded-3 d-flex align-items-center justify-content-center"
                                style={{
                                  width: 36,
                                  height: 36,
                                  backgroundColor: "rgba(13,148,136,0.12)",
                                }}
                              >
                                <Icon
                                  icon="mdi:format-list-bulleted"
                                  width={20}
                                  height={20}
                                  className="text-primary"
                                />
                              </span>
                              <h6 className="mb-0 fw-bold text-dark">
                                Technician Details
                              </h6>
                            </div>
                            <div
                              className="rounded-3 overflow-hidden border"
                              style={{
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                backgroundColor: "#fff",
                              }}
                            >
                              <div className="table-responsive">
                                <table
                                  className="table align-middle mb-0 table-center-all"
                                  style={{
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  <thead>
                                    <tr
                                      style={{
                                        backgroundColor: "#f8fafc",
                                        borderBottom: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <th
                                        className="text-nowrap text-center ps-4 py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Tech ID
                                      </th>
                                      <th
                                        className="text-nowrap text-center py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Assign Date
                                      </th>
                                      <th
                                        className="text-nowrap text-center py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Route Type
                                      </th>
                                      <th
                                        className="text-nowrap text-center py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Service Type
                                      </th>
                                      <th
                                        className="text-nowrap text-center py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Status
                                      </th>
                                      <th
                                        className="text-nowrap text-center pe-4 py-3 fw-bold"
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#64748b",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(bookingData?.CarPickUpDelivery ?? []).map(
                                      (row, idx) => {
                                        const pickupImages = (
                                          bookingData?.BookingImages ?? []
                                        ).filter(
                                          (img) => img.PickId === row.Id,
                                        );

                                        return (
                                          <>
                                            <tr
                                              key={
                                                row.Id ?? row.BookingID ?? idx
                                              }
                                              style={{
                                                backgroundColor:
                                                  idx % 2 === 0
                                                    ? "#fff"
                                                    : "#fafafa",
                                                transition:
                                                  "background 0.15s ease",
                                                borderBottom:
                                                  "1px solid #f1f5f9",
                                              }}
                                              className="pickup-drop-row"
                                            >
                                              <td
                                                className="text-center ps-4 py-3 fw-semibold"
                                                style={{ color: "#334155" }}
                                              >
                                                {row.TechnicinaName ?? "—"}
                                              </td>
                                              <td
                                                className="text-center py-3"
                                                style={{ color: "#475569" }}
                                              >
                                                {row.AssignDate
                                                  ? new Date(
                                                      row.AssignDate,
                                                    ).toLocaleString("en-IN", {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    })
                                                  : "—"}
                                              </td>
                                              <td
                                                className="text-center py-3"
                                                style={{ color: "#475569" }}
                                              >
                                                {row.RouteType ==
                                                "CustomerToDealer"
                                                  ? "Customer To Dealer"
                                                  : row.RouteType ==
                                                      "DealerToCustomer"
                                                    ? "Dealer To Customer"
                                                    : row.RouteType ==
                                                        "DealerToDealer"
                                                      ? "Dealer To Dealer"
                                                      : "—"}
                                              </td>
                                              <td
                                                className="text-center py-3"
                                                style={{ color: "#475569" }}
                                              >
                                                {row.ServiceType ==
                                                "ServiceAtGarage"
                                                  ? "Service At Garage"
                                                  : "Service At Home"}
                                              </td>
                                              <td className="text-center py-3">
                                                <span
                                                  className="badge rounded-pill px-2 py-1"
                                                  style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    backgroundColor:
                                                      (
                                                        row.Status || ""
                                                      ).toLowerCase() ===
                                                      "assigned"
                                                        ? "rgba(13,148,136,0.15)"
                                                        : "rgba(100,116,139,0.15)",
                                                    color:
                                                      (
                                                        row.Status || ""
                                                      ).toLowerCase() ===
                                                      "assigned"
                                                        ? "#0d9488"
                                                        : "#64748b",
                                                  }}
                                                >
                                                  {row.Status ?? "—"}
                                                </span>
                                              </td>
                                              <td className="text-center pe-4 py-3">
                                                <div className="d-flex flex-column align-items-center gap-2">
                                                  {/* {row.BookingImages?.length > 0 && (
                                                  <div className="d-flex gap-3 flex-wrap justify-content-center">
                                                    {row.BookingImages.map((img) => (
                                                      <img
                                                        key={img.ImageID}
                                                        src={`${API_IMAGE}/${img.ImageURL}`}
                                                        alt="pickup"
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setFullScreenImageUrl(`${API_IMAGE}/${img.ImageURL}`)}
                                                        onKeyDown={(e) => e.key === "Enter" && setFullScreenImageUrl(`${API_IMAGE}/${img.ImageURL}`)}
                                                        style={{
                                                          width: "70px",
                                                          height: "70px",
                                                          objectFit: "cover",
                                                          borderRadius: "8px",
                                                          cursor: "pointer",
                                                        }}
                                                      />
                                                    ))}
                                                  </div>
                                                )} */}
                                                  {row.IsCancelled === 0 &&
                                                    row.Status !==
                                                      "completed" && (
                                                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                                                        <button
                                                          type="button"
                                                          className="btn btn-press-effect btn-danger btn-sm d-inline-flex align-items-center gap-1"
                                                          onClick={() =>
                                                            handlePickupDropCancel(
                                                              row,
                                                            )
                                                          }
                                                          disabled={
                                                            pickupDropActionLoading
                                                          }
                                                        >
                                                          <Icon
                                                            icon="mdi:close-circle-outline"
                                                            width={18}
                                                            height={18}
                                                          />
                                                          Cancel
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="btn btn-press-effect btn-warning btn-sm d-inline-flex align-items-center gap-1 text-dark"
                                                          onClick={() =>
                                                            openPickupDropReassignModal(
                                                              row,
                                                            )
                                                          }
                                                          disabled={
                                                            pickupDropActionLoading
                                                          }
                                                        >
                                                          <Icon
                                                            icon="mdi:account-switch-outline"
                                                            width={18}
                                                            height={18}
                                                          />
                                                          Reassign
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center gap-1"
                                                          onClick={() =>
                                                            openPickupDropRescheduleModal(
                                                              row,
                                                            )
                                                          }
                                                          disabled={
                                                            pickupDropActionLoading
                                                          }
                                                        >
                                                          <Icon
                                                            icon="mdi:calendar-edit-outline"
                                                            width={18}
                                                            height={18}
                                                          />
                                                          Reschedule
                                                        </button>
                                                      </div>
                                                    )}
                                                </div>
                                              </td>
                                            </tr>
                                          </>
                                        );
                                      },
                                    )}
                                    {/* {(bookingData?.CarPickUpDelivery ?? []).map((row, idx) => (
                                      
                                      <tr
                                        key={row.Id ?? row.BookingID ?? idx}
                                        style={{
                                          backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
                                          transition: "background 0.15s ease",
                                          borderBottom: "1px solid #f1f5f9",
                                        }}
                                        className="pickup-drop-row"
                                      >
                                        <td className="text-center ps-4 py-3 fw-semibold" style={{ color: "#334155" }}>{row.TechnicinaName ?? "—"}</td>
                                        <td className="text-center py-3" style={{ color: "#475569" }}>
                                          {row.AssignDate
                                            ? new Date(row.AssignDate).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                            : "—"}
                                        </td>
                                        <td className="text-center py-3" style={{ color: "#475569" }}>{row.RouteType == 'CustomerToDealer' ? "Customer To Dealer" : row.RouteType == 'DealerToCustomer' ? "Dealer To Customer" :row.RouteType == 'DealerToDealer' ? "Dealer To Dealer" : "—"}</td>
                                        <td className="text-center py-3" style={{ color: "#475569" }}>{row.ServiceType == "ServiceAtGarage" ? "Service At Garage" : "Service At Home"}</td>
                                        <td className="text-center py-3">
                                          <span
                                            className="badge rounded-pill px-2 py-1"
                                            style={{
                                              fontSize: "0.7rem",
                                              fontWeight: 600,
                                              backgroundColor: (row.Status || "").toLowerCase() === "assigned" ? "rgba(13,148,136,0.15)" : "rgba(100,116,139,0.15)",
                                              color: (row.Status || "").toLowerCase() === "assigned" ? "#0d9488" : "#64748b",
                                            }}
                                          >
                                            {row.Status ?? "—"}
                                          </span>
                                        </td>
                                        {row.IsCancelled === 0 && row.Status !== "completed" && (
                                          <td className="text-center pe-4 py-3">
                                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                                              <button
                                                type="button"
                                                className="btn btn-press-effect btn-danger btn-sm d-inline-flex align-items-center gap-1"
                                                onClick={() => handlePickupDropCancel(row)}
                                                disabled={pickupDropActionLoading}
                                              >
                                                <Icon icon="mdi:close-circle-outline" width={18} height={18} />
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-press-effect btn-warning btn-sm d-inline-flex align-items-center gap-1 text-dark"
                                                onClick={() => openPickupDropReassignModal(row)}
                                                disabled={pickupDropActionLoading}
                                              >
                                                <Icon icon="mdi:account-switch-outline" width={18} height={18} />
                                                Reassign
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-press-effect btn-primary-600 btn-sm d-inline-flex align-items-center gap-1"
                                                onClick={() => openPickupDropRescheduleModal(row)}
                                                disabled={pickupDropActionLoading}
                                              >
                                                <Icon icon="mdi:calendar-edit-outline" width={18} height={18} />
                                                Reschedule
                                              </button>
                                            </div>
                                          </td>
                                        )}
                                      </tr>
                                    ))} */}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= PAYMENTS ACCORDION ================= */}
              <Accordion className="mb-3" defaultActiveKey="">
                <Accordion.Item eventKey="payments">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon
                        icon="mdi:credit-card-multiple"
                        width={20}
                        height={20}
                      />
                      Payments
                    </h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    {(bookingData?.Payments ?? []).length > 0 ? (
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-hover align-middle mb-0"
                          style={{ fontSize: "0.875rem", textAlign: "center" }}
                        >
                          <thead
                            style={{
                              backgroundColor: "#f8fafc",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            <tr>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                S.No
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                Amount Paid
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                Payment Mode
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                Transaction ID
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                Payment Date
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  textAlign: "center",
                                }}
                              >
                                Status
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Proof Img.
                              </th>
                              {/* <th className="text-nowrap py-2 px-3 fw-bold" style={{ fontSize: "0.75rem", color: "#64748b" }}>Refunded</th> */}
                            </tr>
                          </thead>
                          <tbody>
                            {(bookingData?.Payments ?? [])
                              .slice()
                              .reverse()
                              .map((pay, idx) => (
                                <tr key={pay.PaymentID ?? idx}>
                                  {/* <td className="py-2 px-3">{pay.PaymentID ?? "—"}</td> */}
                                  <td className="py-2 px-3">{idx + 1}</td>
                                  <td className="py-2 px-3 fw-semibold">
                                    ₹
                                    {(pay.AmountPaid ?? 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    {pay.PaymentMode ?? "—"}
                                  </td>
                                  <td
                                    className="py-2 px-3 text-nowrap"
                                    style={{ maxWidth: "180px" }}
                                    title={pay.TransactionID}
                                  >
                                    {pay.TransactionID ?? "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    {pay.PaymentDate
                                      ? new Date(
                                          pay.PaymentDate,
                                        ).toLocaleString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className="badge rounded-pill px-2 py-1"
                                      style={{
                                        fontSize: "0.7rem",
                                        backgroundColor:
                                          (
                                            pay.PaymentStatus || ""
                                          ).toLowerCase() === "success"
                                            ? "rgba(34,197,94,0.15)"
                                            : "rgba(234,179,8,0.15)",
                                        color:
                                          (
                                            pay.PaymentStatus || ""
                                          ).toLowerCase() === "success"
                                            ? "#16a34a"
                                            : "#ca8a04",
                                      }}
                                    >
                                      {pay.PaymentStatus ?? "—"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {pay.ProofAttachment ? (
                                      <img
                                        src={`${API_IMAGE}${pay.ProofAttachment}`}
                                        alt="Payment Proof"
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                          objectFit: "cover",
                                          cursor: "pointer",
                                          borderRadius: "4px",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            `${API_IMAGE}${pay.ProofAttachment}`,
                                            "_blank",
                                          )
                                        }
                                      />
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  {/* <td className="py-2 px-3">{pay.IsRefunded ? "Yes" : "No"}</td> */}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No payments recorded for this booking.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* ================= DEALER STATUS (DEALER ADD-ON APPROVAL) ACCORDION ================= */}
              <Accordion className="mb-3" defaultActiveKey="">
                <Accordion.Item eventKey="dealerStatus">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon icon="mdi:store-check" width={20} height={20} />
                      Dealer Status
                    </h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    {(bookingData?.DealerAddOnApproval ?? []).length > 0 ? (
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-hover align-middle mb-0"
                          style={{ fontSize: "0.875rem" }}
                        >
                          <thead
                            style={{
                              backgroundColor: "#f8fafc",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            <tr>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                S.No
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Dealer Name
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Service Name
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Status
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Reason
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Status Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bookingData?.DealerAddOnApproval ?? [])
                              .slice()
                              .reverse()
                              .map((item, idx) => (
                                <tr key={item.Id ?? idx}>
                                  {/* <td className="py-2 px-3">{item.Id ?? "—"}</td> */}
                                  <td className="py-2 px-3">{idx + 1}</td>
                                  <td className="py-2 px-3">
                                    {item.DealerName ?? "—"}
                                  </td>
                                  <td className="py-2 px-3 fw-semibold">
                                    {item.ServiceName ?? "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    {(() => {
                                      const status = (
                                        item.IsDealer_Confirm || ""
                                      ).toLowerCase();

                                      const backgroundColor =
                                        status === "approved"
                                          ? "rgba(34,197,94,0.15)" // light green
                                          : status === "rejected"
                                            ? "rgba(239,68,68,0.15)" // light red
                                            : status === "assigned"
                                              ? "rgba(250,204,21,0.20)" // light yellow
                                              : "rgba(107,114,128,0.15)"; // default grey

                                      const color =
                                        status === "approved"
                                          ? "#16a34a"
                                          : status === "rejected"
                                            ? "#dc2626"
                                            : status === "assigned"
                                              ? "#ca8a04" // yellow text
                                              : "#6b7280";

                                      return (
                                        <span
                                          className="badge rounded-pill px-2 py-1"
                                          style={{
                                            fontSize: "0.7rem",
                                            backgroundColor,
                                            color,
                                          }}
                                        >
                                          {item.IsDealer_Confirm ?? "—"}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-2 px-3">
                                    {item.Reason ?? "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    {item.CreatedDate
                                      ? new Date(
                                          item.CreatedDate,
                                        ).toLocaleString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No dealer add-on approvals for this booking.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* ================= INVOICES (ESTIMATION & FINAL) ACCORDION ================= */}
              <Accordion className="mb-3" defaultActiveKey="">
                <Accordion.Item eventKey="invoices">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon
                        icon="mdi:file-document-multiple"
                        width={20}
                        height={20}
                      />
                      Invoices (Estimation & Final)
                    </h6>
                  </Accordion.Header>
                  <Accordion.Body>
                    {(bookingData?.Invoices ?? []).length > 0 ? (
                      <div className="table-responsive">
                        <table
                          className="table table-bordered table-hover align-middle mb-0"
                          style={{ fontSize: "0.875rem" }}
                        >
                          <thead
                            style={{
                              backgroundColor: "#f8fafc",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            <tr>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                S.No
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Invoice No
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Type
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Total
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Tax
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Discount
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Net Amount
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Status
                              </th>
                              <th
                                className="text-nowrap py-2 px-3 fw-bold"
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                View
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bookingData?.Invoices ?? [])
                              .slice()
                              .reverse()
                              .map((inv, idx) => (
                                <tr key={inv.InvoiceID ?? idx}>
                                  <td className="py-2 px-3">{idx + 1}</td>
                                  <td className="py-2 px-3 fw-semibold">
                                    {inv.InvoiceNumber ?? "—"}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className="badge rounded-pill px-2 py-1"
                                      style={{
                                        fontSize: "0.7rem",
                                        backgroundColor:
                                          (
                                            inv.InvoiceType || ""
                                          ).toLowerCase() === "final"
                                            ? "rgba(13,148,136,0.15)"
                                            : "rgba(59,130,246,0.15)",
                                        color:
                                          (
                                            inv.InvoiceType || ""
                                          ).toLowerCase() === "final"
                                            ? "#0d9488"
                                            : "#2563eb",
                                      }}
                                    >
                                      {inv.InvoiceType ?? "—"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    ₹
                                    {(inv.TotalAmount ?? 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    ₹
                                    {(inv.TaxAmount ?? 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    ₹
                                    {(inv.DiscountAmount ?? 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-2 px-3 fw-bold">
                                    ₹
                                    {(inv.NetAmount ?? 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className="badge rounded-pill px-2 py-1"
                                      style={{
                                        fontSize: "0.7rem",
                                        backgroundColor:
                                          (
                                            inv.InvoiceStatus || ""
                                          ).toLowerCase() === "generated"
                                            ? "rgba(34,197,94,0.15)"
                                            : "rgba(148,163,184,0.2)",
                                        color:
                                          (
                                            inv.InvoiceStatus || ""
                                          ).toLowerCase() === "generated"
                                            ? "#16a34a"
                                            : "#64748b",
                                      }}
                                    >
                                      {inv.InvoiceStatus ?? "—"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {inv.FolderPath ? (
                                      <a
                                        href={`${API_BASE.replace(/api\/?$/, "")}${inv.FolderPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary py-1 px-2"
                                      >
                                        <Icon
                                          icon="mdi:file-pdf-box"
                                          width={20}
                                          height={20}
                                        />
                                      </a>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No invoices recorded for this booking.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
              {/* ================= PICKUP IMAGES ACCORDION ================= */}
              <Accordion className="mb-3">
                <Accordion.Item eventKey="pickupImages">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon icon="mdi:car-arrow-right" width={20} height={20} />
                      Pickup Images
                    </h6>
                  </Accordion.Header>

                  <Accordion.Body>
                    {(
                      bookingData?.ServiceImages?.filter(
                        (i) => i.ImageUploadType === "Pickup",
                      ) ?? []
                    ).length > 0 ? (
                      <div className="row g-3">
                        {bookingData?.ServiceImages?.filter(
                          (i) => i.ImageUploadType === "Pickup",
                        ).map((img, idx) => (
                          <div
                            className="col-lg-2 col-md-3 col-4"
                            key={img.ImageID ?? idx}
                          >
                            <img
                              src={`${API_IMAGE}${img.ImageURL}`}
                              alt="Pickup"
                              className="img-fluid rounded border"
                              style={{
                                height: "100px",
                                width: "100%",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                window.open(
                                  `${API_IMAGE}${img.ImageURL}`,
                                  "_blank",
                                )
                              }
                            />

                            <div
                              className="text-muted text-center mt-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {img.UploadedAt
                                ? new Date(img.UploadedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No pickup images uploaded.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* ================= DELIVERY IMAGES ACCORDION ================= */}
              <Accordion className="mb-3">
                <Accordion.Item eventKey="deliveryImages">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon icon="mdi:car-arrow-left" width={20} height={20} />
                      Delivery Images
                    </h6>
                  </Accordion.Header>

                  <Accordion.Body>
                    {(
                      bookingData?.ServiceImages?.filter(
                        (i) => i.ImageUploadType === "Delivery",
                      ) ?? []
                    ).length > 0 ? (
                      <div className="row g-3">
                        {bookingData?.ServiceImages?.filter(
                          (i) => i.ImageUploadType === "Delivery",
                        ).map((img, idx) => (
                          <div
                            className="col-lg-2 col-md-3 col-4"
                            key={img.ImageID ?? idx}
                          >
                            <img
                              src={`${API_IMAGE}${img.ImageURL}`}
                              alt="Delivery"
                              className="img-fluid rounded border"
                              style={{
                                height: "100px",
                                width: "100%",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                window.open(
                                  `${API_IMAGE}${img.ImageURL}`,
                                  "_blank",
                                )
                              }
                            />

                            <div
                              className="text-muted text-center mt-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {img.UploadedAt
                                ? new Date(img.UploadedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No delivery images uploaded.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              {/* ================= SERVICE COMPLETION IMAGES ACCORDION ================= */}
              <Accordion className="mb-3" defaultActiveKey="">
                <Accordion.Item eventKey="serviceImages">
                  <Accordion.Header>
                    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                      <Icon icon="mdi:image-multiple" width={20} height={20} />
                      Customer Confirmation Images
                    </h6>
                  </Accordion.Header>

                  <Accordion.Body>
                    {(
                      bookingData?.ServiceImages?.filter(
                        (img) =>
                          img.ImageUploadType !== "Pickup" &&
                          img.ImageUploadType !== "Delivery",
                      ) ?? []
                    ).length > 0 ? (
                      <div className="row g-3">
                        {bookingData?.ServiceImages?.filter(
                          (img) =>
                            img.ImageUploadType !== "Pickup" &&
                            img.ImageUploadType !== "Delivery",
                        ).map((img, idx) => (
                          <div
                            className="col-lg-2 col-md-3 col-4"
                            key={img.ImageID ?? idx}
                          >
                            <img
                              src={`${API_IMAGE}${img.ImageURL}`}
                              alt="Service Completion"
                              className="img-fluid rounded border"
                              style={{
                                height: "100px",
                                width: "100%",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                window.open(
                                  `${API_IMAGE}${img.ImageURL}`,
                                  "_blank",
                                )
                              }
                            />

                            <div
                              className="text-muted text-center mt-1"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {img.UploadedAt
                                ? new Date(img.UploadedAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-4">
                        No service completion images uploaded.
                      </p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
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
                    {/* <Select
                      options={getSelectedTimeSlotOptions()}
                      value={selectedReassignTimeSlot}
                      onChange={(val) => setSelectedReassignTimeSlot(val)}
                      placeholder="Select Time Slot"
                      isDisabled={
                        !getSelectedTimeSlotOptions().length ||
                        getSelectedTimeSlotOptions().length <= 1
                      }
                    /> */}
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
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isPastTimeForDate(garagePickupDate, val)) {
                              // Close native time picker popup
                              e.currentTarget?.blur?.();
                              setTimeout(() => e.currentTarget?.blur?.(), 0);
                              document.activeElement?.blur?.();
                              Swal.fire({
                                icon: "warning",
                                title: "Invalid Time",
                                text: "You cannot select a past time for today.",
                              });
                              setGaragePickupTime("");
                              return;
                            }
                            setGaragePickupTime(val);
                          }}
                        />
                      </div>
                    </div>
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
                      isReassigning ||
                      !selectedReassignTimeSlot ||
                      (assignType === "technician" && !selectedTechnician) ||
                      (assignType === "supervisor" && !selectedSupervisor)
                    }
                  >
                    {isReassigning ? ( // <--- SHOW SPINNER
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Assigning...
                      </>
                    ) : (
                      "Assign"
                    )}
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
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{
                maxWidth: paymentTypeChoice ? "420px" : "440px",
                width: "90%",
              }}
            >
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header border-0">
                  <h6 className="modal-title fw-bold">
                    {!paymentTypeChoice
                      ? "Payment Options"
                      : paymentTypeChoice === "online"
                        ? "Pay online"
                        : "Enter Payment Details"}
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={closePaymentModal}
                  />
                </div>

                <div className="modal-body">
                  {/* Step 1: Choose payment type */}
                  {!paymentTypeChoice && (
                    <>
                      <p className="text-muted small mb-3">
                        Choose one payment option.
                      </p>
                      <div className="d-flex flex-column gap-2">
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{
                            minHeight: "56px",
                            border: "1px solid #dee2e6",
                          }}
                          onClick={() => {
                            setPaymentTypeChoice("online");
                            setPaymentMode("Online");
                            setPayAmount(remainingAmount);
                          }}
                        >
                          <span className="d-flex align-items-center gap-2 fw-semibold text-dark">
                            <Icon
                              icon="mdi:credit-card-outline"
                              width={24}
                              height={24}
                              className="text-primary"
                            />
                            Pay Online
                          </span>
                          <Icon
                            icon="mdi:chevron-right"
                            width={20}
                            height={20}
                            className="text-secondary opacity-75"
                          />
                        </button>
                        <button
                          type="button"
                          className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                          style={{
                            minHeight: "56px",
                            border: "1px solid #dee2e6",
                          }}
                          onClick={() => {
                            setPaymentTypeChoice("other");
                            setPaymentMode("");
                            setPayAmount(remainingAmount);
                          }}
                        >
                          <span className="d-flex align-items-center gap-2 fw-semibold text-dark">
                            <Icon
                              icon="mdi:cash-multiple"
                              width={24}
                              height={24}
                              className="text-primary"
                            />
                            Other
                          </span>
                          <Icon
                            icon="mdi:chevron-right"
                            width={20}
                            height={20}
                            className="text-secondary opacity-75"
                          />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2a: Pay through online – amount + discount only */}
                  {paymentTypeChoice === "online" && (
                    <>
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
                        <label className="form-label fw-semibold">
                          Enter Amount
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={remainingAmount}
                          value={payAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setPayAmount("");
                              return;
                            }
                            // Parse as float and limit to 2 decimal places
                            const num = parseFloat(val);
                            setPayAmount(num);
                          }}
                          onBlur={() => {
                            // Clean up the decimals when user stops typing
                            if (payAmount !== "") {
                              setPayAmount(
                                Number(Number(payAmount).toFixed(2)),
                              );
                            }
                          }}
                          placeholder="Amount"
                        />
                      </div>
                      {alreadyPaid === 0 && (
                        <>
                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              Apply Coupon
                            </label>
                            <select
                              className="form-select mb-2"
                              value={selectedCoupon}
                              onChange={(e) =>
                                setSelectedCoupon(e.target.value)
                              }
                            >
                              {couponOffers.map((o) => (
                                <option key={o.code} value={o.code}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const sel = couponOffers.find(
                                (c) => c.code === selectedCoupon,
                              );
                              if (!sel || sel.discountValue === 0) return null;
                              return (
                                <small className="text-muted d-block mb-2">
                                  Offer:{" "}
                                  {sel.discountType === "percentage"
                                    ? `${sel.discountValue}%`
                                    : `₹${Number(sel.discountValue).toFixed(2)}`}
                                </small>
                              );
                            })()}
                            {/* <label className="form-label fw-semibold">Discount Amount</label>
                            <input
                              type="number"
                              className="form-control"
                              disabled
                              min={0}
                              max={Math.max(0, Number(payAmount || 0))}
                              value={discountAmount}
                              onChange={(e) => {
                                const pay = Number(payAmount || 0);
                                const val = Math.max(0, Number(e.target.value));
                                setDiscountAmount(val > pay ? pay : val);
                              }}
                              placeholder="0"
                            /> */}
                            {Number(remainingAmount || 0) > 0 && (
                              <small className="text-muted">
                                Max: ₹{Number(remainingAmount || 0).toFixed(2)}
                              </small>
                            )}
                          </div>
                          {Number(discountAmount || 0) > 0 && (
                            <div className="mt-2 small text-muted">
                              Final payable: ₹
                              {Math.max(
                                Number(payAmount || 0) -
                                  Number(discountAmount || 0),
                                0,
                              ).toFixed(2)}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Step 2b: Pay through other – full form (mode + amount + discount) */}
                  {paymentTypeChoice === "other" && (
                    <>
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
                        <label className="form-label fw-semibold">
                          Payment Mode
                        </label>
                        <select
                          className="form-select"
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                        >
                          <option value="">Select payment mode</option>
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Credit/Debit Card</option>
                          <option value="NetBanking">Net Banking</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Enter Amount
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={remainingAmount}
                          value={payAmount}
                          onChange={(e) =>
                            setPayAmount(Math.max(0, Number(e.target.value)))
                          }
                          placeholder="Amount"
                        />
                      </div>
                      {alreadyPaid === 0 && (
                        <>
                          <div className="mb-0">
                            <label className="form-label fw-semibold">
                              Apply Coupon
                            </label>
                            <select
                              className="form-select mb-2"
                              value={selectedCoupon}
                              onChange={(e) =>
                                setSelectedCoupon(e.target.value)
                              }
                            >
                              {couponOffers.map((o) => (
                                <option key={o.code} value={o.code}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const sel = couponOffers.find(
                                (c) => c.code === selectedCoupon,
                              );
                              if (!sel || sel.discountValue === 0) return null;
                              return (
                                <small className="text-muted d-block mb-2">
                                  Offer:{" "}
                                  {sel.discountType === "percentage"
                                    ? `${sel.discountValue}%`
                                    : `₹${Number(sel.discountValue).toFixed(2)}`}
                                </small>
                              );
                            })()}
                            {/* <label className="form-label fw-semibold">Discount Amount</label>
                            <input
                              type="number"
                              className="form-control"
                              disabled
                              min={0}
                              max={Math.max(0, Number(payAmount || 0))}
                              value={discountAmount}
                              onChange={(e) => {
                                const pay = Number(payAmount || 0);
                                const val = Math.max(0, Number(e.target.value));
                                setDiscountAmount(val > pay ? pay : val);
                              }}
                              placeholder="0"
                            /> */}
                            {Number(remainingAmount || 0) > 0 && (
                              <small className="text-muted">
                                Max: ₹{Number(remainingAmount || 0).toFixed(2)}
                              </small>
                            )}
                          </div>
                          {Number(discountAmount || 0) > 0 && (
                            <div className="mt-2 small text-muted">
                              Final payable: ₹
                              {Math.max(
                                Number(payAmount || 0) -
                                  Number(discountAmount || 0),
                                0,
                              ).toFixed(2)}
                            </div>
                          )}
                        </>
                      )}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Attach Payment Proof{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          required
                          onChange={(e) =>
                            setPaymentFile(e.target.files?.[0] ?? null)
                          }
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        />
                        {paymentFile && (
                          <small className="text-muted d-block mt-1">
                            Selected: {paymentFile.name}
                          </small>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {(paymentTypeChoice === "online" ||
                  paymentTypeChoice === "other") && (
                  <div className="modal-footer border-0 justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-press-effect btn-secondary btn-sm"
                      onClick={() => {
                        setPaymentTypeChoice(null);
                        setPaymentMode("");
                        setPayAmount(remainingAmount);
                        setDiscountAmount("");
                        setPaymentFile(null);
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn  btn-primary-600 btn-sm"
                      onClick={handleConfirmPayment}
                      disabled={
                        isLoading ||
                        (paymentTypeChoice === "other" && !paymentFile)
                      }
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : paymentTypeChoice === "online" ? (
                        "Send Payment Link"
                      ) : (
                        "Update Payment"
                      )}
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
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "460px", width: "90%" }}
            >
              <div className="modal-content border-0 shadow-lg p-3 rounded-3 overflow-hidden">
                <div className="modal-header border-0 pb-0">
                  <h6 className="modal-title fw-bold">Select Service Type</h6>
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
                  <p className="text-muted small mb-3">
                    Select one option to proceed.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {bookingData?.ServiceType !== "ServiceAtGarage" && (
                      <button
                        type="button"
                        className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white position-relative overflow-hidden transition"
                        style={{
                          minHeight: "72px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "";
                          e.currentTarget.style.boxShadow = "";
                        }}
                        onClick={openDoorstepAssignModal}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                            style={{ width: 48, height: 48 }}
                          >
                            <Icon
                              icon="mdi:home-circle-outline"
                              width={24}
                              height={24}
                              className="text-primary"
                            />
                          </span>
                          <div>
                            <span className="fw-semibold d-block text-dark">
                              Service at Doorstep
                            </span>
                            <span className="small text-muted">
                              Technician visits customer location
                            </span>
                          </div>
                        </div>
                        <Icon
                          icon="mdi:chevron-right"
                          width={20}
                          height={20}
                          className="text-secondary opacity-75"
                        />
                      </button>
                    )}
                    {!(
                      bookingData?.BookingAddOns?.length === 1 &&
                      bookingData?.BookingAddOns[0]?.ServiceType ===
                        "Inspection"
                    ) && (
                      <button
                        type="button"
                        className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white position-relative overflow-hidden"
                        style={{
                          minHeight: "72px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "";
                          e.currentTarget.style.boxShadow = "";
                        }}
                        onClick={openGarageFlowModal}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                            style={{ width: 48, height: 48 }}
                          >
                            <Icon
                              icon="mdi:garage"
                              width={24}
                              height={24}
                              className="text-primary"
                            />
                          </span>
                          <div>
                            <span className="fw-semibold d-block text-dark">
                              Service at Garage
                            </span>
                            <span className="small text-muted">
                              Car pickup/drop & service done on dealer location
                            </span>
                          </div>
                        </div>
                        <Icon
                          icon="mdi:chevron-right"
                          width={20}
                          height={20}
                          className="text-secondary opacity-75"
                        />
                      </button>
                    )}
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
                      setSelectedServiceType([]);
                    }}
                  />
                </div>

                <div className="modal-body">
                  {/* Assignment Type Checkboxes */}
                  <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                    {/* Field Advisor Checkbox */}
                    {/* {roleName !== "Field Advisor" && (
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
                            setSelectedServiceType([]);
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
                    )} */}
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
                          setSelectedServiceType([]);
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
                  {/* {initialAssignType !== "fieldAdvisor" && (
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
                  )} */}

                  {/* Employee Selection based on assignType */}
                  {initialAssignType === "technician" ? (
                    <>
                      <Select
                        options={technicians}
                        value={selectedInitialTechnician}
                        onChange={(val) => setSelectedInitialTechnician(val)}
                        placeholder="Select Technician"
                      />
                      <div className="mt-3">
                        <Select
                          // options={
                          //   bookingData?.BookingAddOns
                          //     ? Array.from(
                          //       new Set(
                          //         bookingData.BookingAddOns
                          //           .map((addon) => addon.ServiceName)
                          //           .filter(Boolean),
                          //       ),
                          //     ).map((serviceName) => ({
                          //       value: serviceName,
                          //       label: serviceName,
                          //     }))
                          //     : []
                          // }
                          options={
                            bookingData?.BookingAddOns
                              ? bookingData.BookingAddOns.filter((addon) => {
                                  // Filter out completed services and items without a name
                                  const status = (
                                    addon.StatusName ??
                                    addon.statusName ??
                                    addon.AddOnStatus ??
                                    addon.addOnStatus
                                  )
                                    ?.toString()
                                    .trim();
                                  return (
                                    status !== "ServiceCompleted" &&
                                    addon.ServiceName
                                  );
                                }).map((addon) => ({
                                  value: addon.ServiceName,

                                  label: `${addon.ServiceName} (${addon.DealerName || "No Dealer"})`,
                                }))
                              : // .filter((v, i, a) => a.findIndex(t => t.label === v.label) === i)
                                []
                                ? bookingData.BookingAddOns.filter((addon) => {
                                    // Filter out completed services and items without a name
                                    const status = (
                                      addon.StatusName ??
                                      addon.statusName ??
                                      addon.AddOnStatus ??
                                      addon.addOnStatus
                                    )
                                      ?.toString()
                                      .trim();
                                    return (
                                      status !== "ServiceCompleted" &&
                                      addon.ServiceName
                                    );
                                  }).map((addon) => ({
                                    // The 'value' stays as the ServiceName (what the API expects)
                                    value: addon.ServiceName,
                                    // The 'label' is what the user sees in the dropdown
                                    label: (
                                      <>
                                        {addon.ServiceName} (
                                        <b>{addon.DealerName || "No Dealer"}</b>
                                        )
                                      </>
                                    ),
                                  }))
                                : []
                          }
                          isMulti
                          value={selectedServiceType}
                          onChange={(val) => setSelectedServiceType(val || [])}
                          placeholder="Select Service"
                        />
                      </div>
                    </>
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

                  <div className="row g-2 mb-2">
                    <span className="text-muted mt-20 small text-center fw-semibold">
                      Customer Scheduled:{" "}
                      {new Date(bookingData.BookingDate).toLocaleDateString()}{" "}
                      {bookingData.TimeSlot?.includes(",") ? (
                        <div className="dropdown d-inline">
                          <span
                            className="dropdown-toggle"
                            style={{ cursor: "pointer" }}
                            data-bs-toggle="dropdown"
                          >
                            ({bookingData.TimeSlot.split(",")[0].trim()})
                          </span>

                          <ul
                            className="dropdown-menu p-2"
                            style={{
                              minWidth: "max-content",
                              left: "auto",
                              right: 0,
                            }}
                          >
                            {bookingData.TimeSlot.split(",").map(
                              (slot, index) => (
                                <li key={index}>
                                  <span className="dropdown-item-text">
                                    {slot.trim()}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ) : (
                        <>({bookingData.TimeSlot})</>
                      )}
                    </span>
                    <div className="col-12">
                      <label className="form-label small mb-1">
                        {" "}
                        Select Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        min={today}
                        value={garagePickupDate}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          setGaragePickupDate(selectedDate);
                          // Re-validate time if date changes to today
                          if (
                            selectedDate === today &&
                            isPastTimeForDate(selectedDate, garagePickupTime)
                          ) {
                            setGaragePickupTime("");
                          }
                        }}
                      />
                    </div>
                    {/* <div class="col-6">
                      <label class="form-label small mb-1">Time</label>
                      <input
                        type="time"
                        className="form-control form-control-sm"
                        value={garagePickupTime}
                        onChange={(e) => setGaragePickupTime(e.target.value)}
                      />
                    </div> */}
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">
                      Select Time
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-sm py-2"
                      value={garagePickupTime} // This connects the state to the UI
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isPastTimeForDate(garagePickupDate, val)) {
                          e.currentTarget?.blur?.();
                          Swal.fire({
                            icon: "warning",
                            title: "Invalid Time",
                            text: "You cannot select a past time for today.",
                          });
                          setGaragePickupTime("");
                          return;
                        }
                        setGaragePickupTime(val);
                      }}
                    />
                  </div>
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
                      setSelectedServiceType([]);
                      setPickupDropReassignTimeSlot([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                    onClick={handleInitialAssignConfirm}
                    disabled={
                      isInitialAssigning ||
                      //   (initialAssignType !== "fieldAdvisor" && !seleInitialTimeSlot) ||
                      (initialAssignType === "technician" &&
                        !selectedInitialTechnician) ||
                      //   (initialAssignType === "supervisor" && !selectedInitialSupervisor) ||
                      //   (initialAssignType === "fieldAdvisor" && !selectedInitialFieldAdvisor) ||
                      (initialAssignType === "technician" &&
                        selectedServiceType.length === 0) ||
                      garagePickupDate === "" ||
                      !garagePickupTime
                      // pickupDropReassignTimeSlot.length === 0
                    }
                  >
                    {isInitialAssigning ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Assigning...
                      </>
                    ) : (
                      "Assign"
                    )}
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
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
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
                      {garageStep === "route" &&
                        (garageTask === "carPickup"
                          ? "Car pickup"
                          : "Car drop")}
                      {garageStep === "details" && "Assign pickup & delivery"}
                    </h6>
                    <button
                      type="button"
                      className="btn-close btn-close-press"
                      onClick={closeGarageFlowModal}
                    />
                  </div>
                  {/* Stepper */}
                  <div
                    className="d-flex align-items-center gap-1 mt-2"
                    style={{ gap: "4px" }}
                  >
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
                            backgroundColor: active
                              ? "var(--bs-primary)"
                              : "var(--bs-border-color)",
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
                      <div className="d-flex flex-column gap-3">
                        {/* Logic: Hide Car Pickup if only 1 dealer is assigned AND the car is already at a dealer */}
                        {!(
                          garageDealerOptions.length === 1 &&
                          hasExistingCustomerToDealerRoute
                        ) && (
                          <button
                            type="button"
                            className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                            style={{
                              minHeight: "72px",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "";
                              e.currentTarget.style.boxShadow = "";
                            }}
                            onClick={() => {
                              setGarageTask("carPickup");
                              setGarageStep("route");
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span
                                className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                                style={{ width: 48, height: 48 }}
                              >
                                <Icon
                                  icon="mdi:car-pickup"
                                  width={24}
                                  height={24}
                                  className="text-primary"
                                />
                              </span>
                              <div>
                                <span className="fw-semibold d-block text-dark">
                                  Car pickup
                                </span>
                                <span className="small text-muted">
                                  Pick up vehicle and take to dealer
                                </span>
                              </div>
                            </div>
                            <Icon
                              icon="mdi:chevron-right"
                              width={20}
                              height={20}
                              className="text-secondary opacity-75"
                            />
                          </button>
                        )}
                        {/* Hide Car drop when CustomerToDealer route does NOT exist */}
                        {hasExistingCustomerToDealerRoute &&
                          allGarageServicesCompletedApproved && (
                            <button
                              type="button"
                              className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                              style={{
                                minHeight: "72px",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                  "0 6px 20px rgba(0,0,0,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "";
                                e.currentTarget.style.boxShadow = "";
                              }}
                              onClick={() => {
                                setGarageTask("carDrop");
                                setGarageStep("route");
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <span
                                  className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                                  style={{ width: 48, height: 48 }}
                                >
                                  <Icon
                                    icon="mdi:car-side"
                                    width={24}
                                    height={24}
                                    className="text-primary"
                                  />
                                </span>
                                <div>
                                  <span className="fw-semibold d-block text-dark">
                                    Car drop
                                  </span>
                                  <span className="small text-muted">
                                    Deliver vehicle back to customer
                                  </span>
                                </div>
                              </div>
                              <Icon
                                icon="mdi:chevron-right"
                                width={20}
                                height={20}
                                className="text-secondary opacity-75"
                              />
                            </button>
                          )}
                      </div>
                    </>
                  )}

                  {/* Step: Customer to dealer vs Dealer to dealer — tap to advance */}
                  {garageStep === "route" && (
                    <>
                      <p className="text-muted small mb-3">
                        Tap an option to continue.
                      </p>
                      <div className="d-flex flex-column gap-3">
                        {/* Hide Customer to Dealer button if already exists (only when carPickup) */}
                        {(!hasExistingCustomerToDealerRoute ||
                          garageTask === "carDrop") && (
                          <button
                            type="button"
                            className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                            style={{
                              minHeight: "72px",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "";
                              e.currentTarget.style.boxShadow = "";
                            }}
                            onClick={() => {
                              setGarageRoute("customerToDealer");
                              setGarageStep("details");
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span
                                className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                                style={{ width: 48, height: 48 }}
                              >
                                <Icon
                                  icon="mdi:account-arrow-right"
                                  width={24}
                                  height={24}
                                  className="text-primary"
                                />
                              </span>
                              <div>
                                <span className="fw-semibold d-block text-dark">
                                  {garageTask === "carDrop"
                                    ? "Dealer to Customer"
                                    : "Customer to Dealer"}
                                </span>
                                <span className="small text-muted">
                                  {garageTask === "carPickup"
                                    ? "Pickup from Customer → Deliver to Dealer"
                                    : "Pickup from Dealer → Deliver to Customer"}
                                </span>
                              </div>
                            </div>
                            <Icon
                              icon="mdi:chevron-right"
                              width={20}
                              height={20}
                              className="text-secondary opacity-75"
                            />
                          </button>
                        )}
                        {garageTask === "carPickup" &&
                          hasExistingCustomerToDealerRoute &&
                          completedGarageDealerOptions.length > 0 &&
                          pendingNextGarageDealerOptions.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-press-effect border-0 rounded-3 p-3 text-start d-flex align-items-center justify-content-between gap-3 shadow-sm bg-white"
                              style={{
                                minHeight: "72px",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                  "0 6px 20px rgba(0,0,0,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "";
                                e.currentTarget.style.boxShadow = "";
                              }}
                              onClick={() => {
                                setGarageRoute("dealerToDealer");
                                setGarageStep("details");
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <span
                                  className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10"
                                  style={{ width: 48, height: 48 }}
                                >
                                  <Icon
                                    icon="mdi:swap-horizontal"
                                    width={24}
                                    height={24}
                                    className="text-primary"
                                  />
                                </span>
                                <div>
                                  <span className="fw-semibold d-block text-dark">
                                    Dealer to dealer
                                  </span>
                                  <span className="small text-muted">
                                    Pickup at one dealer → Deliver to another
                                    dealer
                                  </span>
                                </div>
                              </div>
                              <Icon
                                icon="mdi:chevron-right"
                                width={20}
                                height={20}
                                className="text-secondary opacity-75"
                              />
                            </button>
                          )}
                      </div>
                    </>
                  )}

                  {/* Step: Details – pickup/deliver locations + driver */}
                  {garageStep === "details" && (
                    <>
                      <div className="small text-muted mb-2 fw-semibold">
                        Pickup & delivery
                      </div>
                      {garageRoute === "customerToDealer" &&
                        garageTask === "carPickup" && (
                          <div className="rounded-3 border p-3 mb-3 bg-light">
                            <div className="mb-2">
                              <span className="small text-muted d-block">
                                Pickup from
                              </span>
                              <span className="fw-semibold">
                                {bookingData?.Address || "Customer location"}
                              </span>
                            </div>
                            <div className="mb-0">
                              {singleGarageDealerOption ? (
                                renderAssignedDealerField(
                                  "Deliver To (Dealer)",
                                  garageDeliverDealer ||
                                    singleGarageDealerOption,
                                )
                              ) : (
                                <>
                                  <label className="form-label small mb-1">
                                    Deliver To (Dealer)
                                  </label>
                                  <Select
                                    options={garageDealerOptions}
                                    value={garageDeliverDealer}
                                    onChange={setGarageDeliverDealer}
                                    placeholder="Select dealer"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      {garageRoute === "customerToDealer" &&
                        garageTask === "carDrop" && (
                          <div className="rounded-3 border p-3 mb-3 bg-light">
                            <div className="mb-2">
                              {garagePickupDealer ? (
                                renderAssignedDealerField(
                                  "Pickup From (Dealer)",
                                  garagePickupDealer,
                                )
                              ) : (
                                <>
                                  <label className="form-label small mb-1">
                                    Pickup From (Dealer)
                                  </label>
                                  <Select
                                    options={garageDealerOptions}
                                    value={garagePickupDealer}
                                    isDisabled={true}
                                    onChange={setGaragePickupDealer}
                                    placeholder="Select dealer"
                                  />
                                </>
                              )}
                            </div>
                            <div className="mb-0">
                              <span className="small text-muted d-block">
                                Deliver To
                              </span>
                              <span className="fw-semibold">
                                {bookingData?.Address || "Customer location"}
                              </span>
                            </div>
                          </div>
                        )}
                      {garageRoute === "dealerToDealer" && (
                        <div className="rounded-3 border p-3 mb-3 bg-light">
                          <div className="mb-3">
                            {garagePickupDealer ? (
                              renderAssignedDealerField(
                                "Pickup From (Dealer)",
                                garagePickupDealer,
                              )
                            ) : (
                              <>
                                <label className="form-label small mb-1">
                                  Pickup From (Dealer)
                                </label>
                                <Select
                                  options={garageDealerOptions}
                                  value={garagePickupDealer}
                                  onChange={setGaragePickupDealer}
                                  isDisabled={true}
                                  placeholder="Select pickup dealer"
                                />
                              </>
                            )}
                          </div>
                          <div>
                            {pendingNextGarageDealerOptions.length === 1 &&
                            (garageDeliverDealer ||
                              pendingNextGarageDealerOptions[0]) ? (
                              renderAssignedDealerField(
                                "Deliver To (Dealer)",
                                garageDeliverDealer ||
                                  pendingNextGarageDealerOptions[0],
                              )
                            ) : (
                              <>
                                <label className="form-label small mb-1">
                                  Deliver To (Dealer)
                                </label>
                                <Select
                                  options={pendingNextGarageDealerOptions}
                                  value={garageDeliverDealer}
                                  onChange={setGarageDeliverDealer}
                                  placeholder={
                                    pendingNextGarageDealerOptions.length > 0
                                      ? "Select remaining dealer"
                                      : "No remaining dealers"
                                  }
                                  isDisabled={
                                    pendingNextGarageDealerOptions.length === 0
                                  }
                                />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label small mb-1">
                          Assign driver
                        </label>
                        <Select
                          options={technicians}
                          value={garageDriver}
                          onChange={setGarageDriver}
                          placeholder="Select driver"
                        />
                      </div>
                      <div className="row g-2">
                        <span className="text-muted small fw-semibold text-center ">
                          Customer Scheduled:{" "}
                          {new Date(
                            bookingData.BookingDate,
                          ).toLocaleDateString()}{" "}
                          {bookingData.TimeSlot?.includes(",") ? (
                            <div className="dropdown d-inline">
                              <span
                                className="dropdown-toggle"
                                style={{ cursor: "pointer" }}
                                data-bs-toggle="dropdown"
                              >
                                ({bookingData.TimeSlot.split(",")[0].trim()})
                              </span>

                              <ul
                                className="dropdown-menu p-2"
                                style={{
                                  minWidth: "max-content",
                                  left: "auto",
                                  right: 0,
                                }}
                              >
                                {bookingData.TimeSlot.split(",").map(
                                  (slot, index) => (
                                    <li key={index}>
                                      <span className="dropdown-item-text">
                                        {slot.trim()}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          ) : (
                            <>({bookingData.TimeSlot})</>
                          )}
                        </span>
                        <div className="col-6">
                          <label className="form-label small mb-1">Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            min={today}
                            value={garagePickupDate}
                            onChange={(e) =>
                              setGaragePickupDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small mb-1">Time</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={garagePickupTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isPastTimeForDate(garagePickupDate, val)) {
                                // Close native time picker popup
                                e.currentTarget?.blur?.();
                                setTimeout(() => e.currentTarget?.blur?.(), 0);
                                document.activeElement?.blur?.();
                                Swal.fire({
                                  icon: "warning",
                                  title: "Invalid Time",
                                  text: "You cannot select a past time for today.",
                                });
                                setGaragePickupTime("");
                                return;
                              }
                              setGaragePickupTime(val);
                            }}
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
                          if (
                            garageStep === "details" &&
                            garageOpenedDirectToDetails
                          ) {
                            closeGarageFlowModal();
                            return;
                          }
                          if (garageStep === "details") setGarageStep("route");
                          else setGarageStep("task");
                        }}
                      >
                        Back
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {garageStep === "details" &&
                      garageRoute !== "dealerToDealer" && (
                        <button
                          type="button"
                          className="btn btn-press-effect btn-primary-600 btn-sm"
                          disabled={
                            isGarageAssigning ||
                            (garageRoute === "customerToDealer" &&
                              garageTask === "carPickup" &&
                              !garageDeliverDealer) ||
                            (garageRoute === "customerToDealer" &&
                              garageTask === "carDrop" &&
                              !garagePickupDealer) ||
                            !garageDriver ||
                            !garagePickupDate ||
                            !garagePickupTime
                          }
                          onClick={async () => {
                            // Check if all BookingAddOns have IsCompleted_Confirmation = 1 for carDrop
                            if (garageTask === "carDrop") {
                              const bookingAddOns =
                                bookingData?.BookingAddOns || [];
                              const allConfirmed =
                                allGarageServicesCompletedApproved;
                              if (!allConfirmed) {
                                const unconfirmedServices = bookingAddOns
                                  .filter(
                                    (addon) =>
                                      !isGarageServiceCompletedApproved(addon),
                                  )
                                  .map((addon) => addon.ServiceName)
                                  .join(", ");
                                Swal.fire({
                                  icon: "warning",
                                  title: "Service Completion Not Confirmed",
                                  html: `All services must be completed by Field Advisor before car drop.<br/><br/><strong>Pending services:</strong><br/>${unconfirmedServices || "Some services"}`,
                                });
                                return;
                              }
                            }

                            const payload = buildGaragePayload();
                            if (!payload) {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "Booking/Lead info missing.",
                              });
                              return;
                            }
                            setIsGarageAssigning(true);
                            const result =
                              await savePickupDeliveryTime(payload);
                            setIsGarageAssigning(false);
                            if (result.ok) {
                              Swal.fire({
                                icon: "success",
                                title: "Assigned",
                                text:
                                  result.data?.message ||
                                  "Pickup/delivery saved successfully.",
                              });
                              closeGarageFlowModal();
                              fetchBookingData();
                            } else {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: result.message || "Failed to save.",
                              });
                            }
                          }}
                        >
                          {isGarageAssigning ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Assigning...
                            </>
                          ) : (
                            "Assign"
                          )}
                        </button>
                      )}
                    {garageStep === "details" &&
                      garageRoute === "dealerToDealer" && (
                        <button
                          type="button"
                          className="btn btn-press-effect btn-primary btn-sm"
                          disabled={
                            isGarageAssigning ||
                            !garagePickupDealer ||
                            !garageDeliverDealer ||
                            !garageDriver ||
                            !garagePickupDate ||
                            !garagePickupTime
                          }
                          onClick={async () => {
                            const payload = buildGaragePayload();
                            if (!payload) {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "Booking/Lead info missing.",
                              });
                              return;
                            }
                            setIsGarageAssigning(true);
                            const result =
                              await savePickupDeliveryTime(payload);
                            setIsGarageAssigning(false);
                            if (result.ok) {
                              Swal.fire({
                                icon: "success",
                                title: "Saved",
                                text:
                                  result.data?.message ||
                                  "Pickup/delivery saved successfully.",
                              });
                              closeGarageFlowModal();
                              fetchBookingData();
                            } else {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: result.message || "Failed to save.",
                              });
                            }
                          }}
                        >
                          {isGarageAssigning ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Submiting...
                            </>
                          ) : (
                            "Submit"
                          )}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pickup/Drop Reschedule Modal (from Technician Pickup / Drop Records) */}
        {showPickupDropRescheduleModal && (
          <div
            className="modal fade show d-block"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "480px", width: "90%" }}
            >
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header border-0">
                  <h6 className="modal-title fw-bold">
                    Reschedule Pickup / Drop
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={closePickupDropRescheduleModal}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Reschedule Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm py-2"
                        min={today}
                        value={pickupDropRescheduleDate}
                        onChange={(e) =>
                          setPickupDropRescheduleDate(e.target.value)
                        }
                      />
                    </div>
                    <div className="col-12">
                      {pickupDropRescheduleRow?.ServiceType ===
                      "ServiceAtGarage" ? (
                        <>
                          <label className="form-label small fw-semibold">
                            Time
                          </label>
                          <input
                            type="time"
                            className="form-control form-control-sm py-2"
                            value={pickupDropRescheduleTimeSlot?.[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value;

                              if (
                                isPastTimeForDate(pickupDropRescheduleDate, val)
                              ) {
                                Swal.fire({
                                  icon: "warning",
                                  title: "Invalid Time",
                                  text: "You cannot select a past time for today.",
                                });
                                setPickupDropRescheduleTimeSlot([]);
                                return;
                              }

                              setPickupDropRescheduleTimeSlot(val ? [val] : []);
                            }}
                            disabled={!pickupDropRescheduleDate}
                          />
                        </>
                      ) : (
                        <>
                          <label className="form-label small fw-semibold">
                            Select Time{" "}
                          </label>
                          <input
                            type="time"
                            className="form-control form-control-sm py-2"
                            value={pickupDropRescheduleTimeSlot?.[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value;

                              if (
                                isPastTimeForDate(pickupDropRescheduleDate, val)
                              ) {
                                e.currentTarget?.blur?.();
                                Swal.fire({
                                  icon: "warning",
                                  title: "Invalid Time",
                                  text: "You cannot select a past time for today.",
                                });
                                setPickupDropRescheduleTimeSlot([]);
                                return;
                              }

                              setPickupDropRescheduleTimeSlot(val ? [val] : []);
                            }}
                            disabled={!pickupDropRescheduleDate}
                          />
                          {/* <Select
            isMulti
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            options={
              timeSlots
                ?.filter((slot) => {
                  if (!slot?.IsActive) return false;
                  if (pickupDropRescheduleDate !== today) return true;

                  const now = new Date();
                  const [h, m] = (slot.StartTime || "00:00").split(":").map(Number);
                  const slotTime = new Date();
                  slotTime.setHours(h, m, 0, 0);

                  return slotTime > now;
                })
                ?.map((slot) => ({
                  value: `${slot.StartTime} - ${slot.EndTime}`,
                  label: `${toTimeDisplay(slot.StartTime)} - ${toTimeDisplay(slot.EndTime)}`,
                })) ?? []
            }
            value={
              pickupDropRescheduleTimeSlot?.map((val) => {
                const [s, e] = val.split(" - ");
                return {
                  value: val,
                  label: `${toTimeDisplay(s)} - ${toTimeDisplay(e)}`,
                };
              }) ?? []
            }
            onChange={(opts) =>
              setPickupDropRescheduleTimeSlot(
                opts ? opts.map((o) => o.value) : []
              )
            }
            placeholder="Select time slot(s)"
            isDisabled={!pickupDropRescheduleDate}
          /> */}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-press-effect btn-outline-secondary btn-sm"
                    onClick={closePickupDropRescheduleModal}
                    disabled={pickupDropActionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handlePickupDropRescheduleSubmit}
                    disabled={pickupDropActionLoading}
                  >
                    {pickupDropActionLoading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pickup/Drop Reassign Modal */}
        {showPickupDropReassignModal && (
          <div
            className="modal fade show d-block"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "480px", width: "90%" }}
            >
              <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header border-0">
                  <h6 className="modal-title fw-bold">
                    Reassign Pickup / Drop
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={closePickupDropReassignModal}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Select Technician / Driver{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <Select
                        options={(() => {
                          const row = pickupDropReassignRow;
                          const rowTechId =
                            row?.TechnicianID ??
                            row?.TechID ??
                            row?.EmployeeID ??
                            row?.EmployeeId;
                          const rowTechName = (
                            row?.TechnicinaName ??
                            row?.TechnicianName ??
                            ""
                          )
                            .toString()
                            .trim();
                          return technicians.filter((t) => {
                            if (rowTechId != null && t.value == rowTechId)
                              return false;
                            if (
                              rowTechName &&
                              t.label &&
                              String(t.label)
                                .toLowerCase()
                                .includes(rowTechName.toLowerCase())
                            )
                              return false;
                            return true;
                          });
                        })()}
                        value={pickupDropReassignTech}
                        onChange={setPickupDropReassignTech}
                        placeholder="Select technician"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Assign Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm py-2"
                        min={today}
                        value={pickupDropReassignDate}
                        onChange={(e) =>
                          setPickupDropReassignDate(e.target.value)
                        }
                      />
                    </div>
                    <div className="col-12">
                      {pickupDropReassignRow?.ServiceType ===
                      "ServiceAtGarage" ? (
                        // SHOW TIME PICKER FOR GARAGE WITH VALIDATION
                        <>
                          <label className="form-label small fw-semibold">
                            Time
                          </label>
                          <input
                            type="time"
                            className="form-control form-control-sm py-2"
                            value={pickupDropReassignTimeSlot?.[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value;

                              // VALIDATION LOGIC
                              if (
                                isPastTimeForDate(pickupDropReassignDate, val)
                              ) {
                                // Force blur to close the native time picker popup
                                e.currentTarget?.blur?.();
                                setTimeout(() => e.currentTarget?.blur?.(), 0);
                                document.activeElement?.blur?.();

                                Swal.fire({
                                  icon: "warning",
                                  title: "Invalid Time",
                                  text: "You cannot select a past time for today.",
                                });

                                setPickupDropReassignTimeSlot([]); // Clear selection
                                return;
                              }

                              setPickupDropReassignTimeSlot(val ? [val] : []);
                            }}
                            disabled={!pickupDropReassignDate}
                          />
                        </>
                      ) : (
                        // SHOW MULTI-SELECT FOR HOME SERVICE (Existing Logic)
                        <>
                          <label className="form-label small fw-semibold">
                            Time Slot
                          </label>

                          <input
                            type="time"
                            className="form-control form-control-sm py-2"
                            value={pickupDropReassignTimeSlot?.[0] || ""}
                            onChange={(e) => {
                              const val = e.target.value;

                              if (
                                isPastTimeForDate(pickupDropReassignDate, val)
                              ) {
                                e.currentTarget?.blur?.();
                                Swal.fire({
                                  icon: "warning",
                                  title: "Invalid Time",
                                  text: "You cannot select a past time for today.",
                                });
                                setPickupDropReassignTimeSlot([]);
                                return;
                              }

                              setPickupDropReassignTimeSlot(val ? [val] : []);
                            }}
                            disabled={!pickupDropReassignDate}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-press-effect btn-outline-secondary btn-sm"
                    onClick={closePickupDropReassignModal}
                    disabled={pickupDropActionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handlePickupDropReassignSubmit}
                    disabled={pickupDropActionLoading}
                  >
                    {pickupDropActionLoading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Confirmation Modal */}
        {showCustomerConfirmationModal && (
          <div
            className="modal fade show d-block"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(5px)",
            }}
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
                      setConfirmationFile(null);
                    }}
                  />
                </div>

                <div className="modal-body">
                  {/* Explanation Section */}
                  <div className="alert alert-info mb-3">
                    <h6 className="fw-bold mb-2">
                      Why is confirmation required?
                    </h6>
                    <p className="mb-0 small">
                      Customer confirmation is required to finalize the booking
                      and move all services from temporary status to confirmed
                      status. This ensures that the customer has reviewed and
                      approved all services before proceeding with the booking
                      process. Once confirmed, the services will be moved to the
                      main booking and cannot be easily modified.
                    </p>
                  </div>
                  {/* Services Selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Select the services you want to confirm.
                    </label>

                    <div
                      className="border rounded p-2"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {bookingData?.SupervisorBookings?.map((service) => (
                        <div
                          key={service.Id}
                          className="d-flex align-items-center gap-3 mb-1 px-3"
                        >
                          <input
                            className="form-check-input mt-0"
                            type="checkbox"
                            id={`service-${service.Id}`}
                            checked={selectedServiceIds.includes(service.Id)}
                            onChange={() =>
                              handleServiceCheckboxChange(service.Id)
                            }
                            style={{ border: "1px solid black" }}
                          />

                          <label
                            className="form-check-label mb-0"
                            htmlFor={`service-${service.Id}`}
                          >
                            {service.ServiceName}
                          </label>
                        </div>
                      ))}
                    </div>
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
                      onChange={(e) =>
                        setConfirmationDescription(e.target.value)
                      }
                      required
                    />
                    <small className="text-muted">
                      This description will be recorded along with your
                      confirmation.
                    </small>
                  </div>

                  {/* File Upload Field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Attach File
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) =>
                        setConfirmationFile(e.target.files?.[0] ?? null)
                      }
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    />
                    {confirmationFile && (
                      <small className="text-muted d-block mt-1">
                        Selected: {confirmationFile.name}
                      </small>
                    )}
                  </div>
                </div>

                <div className="modal-footer justify-content-center">
                  <button
                    className="btn btn-press-effect btn-secondary btn-sm"
                    onClick={() => {
                      setShowCustomerConfirmationModal(false);
                      setConfirmationDescription("");
                      setConfirmationFile(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handleCustomerConfirmationSubmit}
                    disabled={
                      isConfirmingCustomer ||
                      !confirmationDescription ||
                      confirmationDescription.trim() === "" ||
                      selectedServiceIds.length === 0
                    }
                  >
                    {isConfirmingCustomer ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Confirming...
                      </>
                    ) : (
                      "Confirm Services"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showCustomerRejectionModal && (
          <div
            className="modal fade show d-block"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "600px", width: "90%" }}
            >
              <div className="modal-content">
                {/* Header */}
                <div className="modal-header">
                  <h6 className="fw-bold mb-2">Customer Rejection</h6>
                  <button
                    type="button"
                    className="btn-close btn-close-press"
                    onClick={() => {
                      setShowCustomerRejectionModal(false);
                      setRejectionDescription("");
                      setRejectedServiceIds([]);
                    }}
                  />
                </div>

                {/* Body */}
                <div className="modal-body">
                  {/* Explanation */}
                  <div className="alert alert-info mb-3">
                    <h6 className="fw-bold mb-2">Why is rejection required?</h6>
                    <p className="mb-0 small">
                      Service rejection is used when the customer declines
                      certain services after review. These rejected services
                      will be removed from the current booking and stored in the
                      rejected services list for record purposes.
                    </p>
                  </div>

                  {/* Service Selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Select services to reject
                    </label>

                    <div
                      className="border rounded p-2"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {bookingData?.SupervisorBookings?.map((service) => (
                        <div
                          key={service.Id}
                          className="d-flex align-items-center gap-3 mb-1 px-3"
                        >
                          <input
                            className="form-check-input mt-0"
                            type="checkbox"
                            checked={rejectedServiceIds.includes(service.Id)}
                            onChange={() =>
                              handleRejectServiceCheckboxChange(service.Id)
                            }
                            style={{ border: "1px solid black" }}
                          />

                          <label className="form-check-label mb-0">
                            {service.ServiceName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Rejection Reason <span className="text-danger">*</span>
                    </label>

                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Please provide reason for rejecting the selected services..."
                      value={rejectionDescription}
                      onChange={(e) => setRejectionDescription(e.target.value)}
                    />

                    <small className="text-muted">
                      This reason will be recorded in the booking history.
                    </small>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer justify-content-center">
                  <button
                    className="btn btn-press-effect btn-secondary btn-sm"
                    onClick={() => {
                      setShowCustomerRejectionModal(false);
                      setRejectionDescription("");
                      setRejectedServiceIds([]);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-press-effect btn-primary-600 btn-sm"
                    onClick={handleCustomerRejectionSubmit}
                    disabled={
                      isRejectingCustomer ||
                      !rejectionDescription ||
                      rejectionDescription.trim() === "" ||
                      rejectedServiceIds.length === 0
                    }
                  >
                    {isRejectingCustomer ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Rejecting...
                      </>
                    ) : (
                      "Reject Services"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {showConfirmModal && (
          <div
            className="modal fade show d-block"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">
                    Upload Service Completion Images
                  </h6>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedImages([]);
                      setPreviewImages([]);
                    }}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label fw-semibold">
                    Upload Images
                  </label>
                  <div
                    className="border border-2 border-primary border-dashed rounded text-center p-4"
                    style={{
                      cursor: "pointer",
                      background: "#f8fbff",
                      borderStyle: "dashed",
                    }}
                    onClick={() =>
                      document.getElementById("imageUploadInput").click()
                    }
                  >
                    <div className="mb-2">
                      <span style={{ fontSize: "40px", color: "#0d6efd" }}>
                        ⬆
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-5 py-2"
                    >
                      Browse
                    </button>
                    <p className="text-muted mt-2 mb-1">drop a file here</p>
                    <small className="text-danger">
                      *File supported .png, .jpg & .webp
                    </small>
                    <input
                      id="imageUploadInput"
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.webp"
                      hidden
                      onChange={handleImageChange}
                    />
                  </div>
                  {previewImages.length > 0 && (
                    <div className="row mt-3">
                      {previewImages.map((img, index) => (
                        <div
                          className="col-4 mb-2 position-relative"
                          key={index}
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: "absolute",
                              top: "1px",
                              right: "6px",
                              background: "#dc3545",
                              border: "none",
                              borderRadius: "50%",
                              width: "26px",
                              height: "26px",
                              color: "#fff",
                              fontSize: "16px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                            }}
                          >
                            ×
                          </button>
                          <img
                            src={img.url}
                            alt="preview"
                            className="img-fluid rounded border"
                            style={{
                              height: "100px",
                              width: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer justify-content-center">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary-600 btn-sm"
                    disabled={selectedImages.length === 0 || isConfirmingCompletion}
                    onClick={handleFieldAdvisorConfirm}
                  >
                     {isConfirmingCompletion ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Confirming...
                        </>
                      ) : (
                        "Confirm"
                      )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Full-screen pickup image viewer with open/close effects */}
        {fullScreenImageUrl && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="View pickup image"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              cursor: "pointer",
              opacity: fullScreenImageClosing
                ? 0
                : fullScreenImageVisible
                  ? 1
                  : 0,
              transition: "opacity 0.25s ease-out",
            }}
            onClick={() => {
              setFullScreenImageClosing(true);
              setTimeout(() => {
                setFullScreenImageUrl(null);
                setFullScreenImageClosing(false);
              }, 250);
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImageClosing(true);
                setTimeout(() => {
                  setFullScreenImageUrl(null);
                  setFullScreenImageClosing(false);
                }, 250);
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10001,
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Icon icon="mdi:close" width={24} height={24} />
            </button>
            <img
              src={fullScreenImageUrl}
              alt="Pickup full size"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: "8px",
                transform: fullScreenImageClosing
                  ? "scale(0.96)"
                  : fullScreenImageVisible
                    ? "scale(1)"
                    : "scale(0.96)",
                opacity: fullScreenImageClosing
                  ? 0.9
                  : fullScreenImageVisible
                    ? 1
                    : 0.9,
                transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Assign Supervisor Modal (reused structure from LeadViewLayer) */}
        <Modal
          show={showAssignSupervisorModal}
          onHide={() => setShowAssignSupervisorModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">Assign Supervisor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 pb-3 border-bottom">
              <label className="form-label fw-semibold text-primary-light mb-2">
                Customer Address
              </label>
              <div className="p-2 bg-light rounded">
                <p className="mb-0 text-secondary-light fw-medium">
                  {bookingData?.FullAddress || "No address available"}
                </p>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Area</label>
              <Select
                options={[]}
                value={null}
                isDisabled
                placeholder="Use lead screen to assign area"
                className="react-select-container"
                isSearchable
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Select Supervisor
              </label>
              <Select
                options={[]}
                value={null}
                isDisabled
                placeholder="Use lead screen to assign supervisor"
                className="react-select-container"
                isSearchable
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button
              variant="secondary btn-sm"
              onClick={() => setShowAssignSupervisorModal(false)}
            >
              Close
            </Button>
            <Button
              className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
              title="Go to Lead"
              onClick={() => {
                setShowAssignSupervisorModal(false);
                if (bookingData?.LeadId) {
                  navigate(`/lead-view/${bookingData.LeadId}`);
                }
              }}
            >
              Open Lead to Assign
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default BookingViewLayer;
