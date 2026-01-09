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
  const [previewServices, setPreviewServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isPaid, setIsPaid] = useState(false);

  // NEW STATES FOR SUPERVISOR/TECHNICIAN SELECTION
  const [assignType, setAssignType] = useState("technician");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [isDiscountApplicable, setIsDiscountApplicable] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm
  const finalPayAmount = Math.max(
    Number(payAmount || 0) - Number(discountAmount || 0),
    0
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

  const fetchBookingData = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}Bookings/BookingId?Id=${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
        }))
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
        }))
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
        { headers: { Authorization: `Bearer ${token}` } }
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
    }
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
        }
      );
      Swal.fire(
        "Cancelled!",
        "Booking has been cancelled successfully.",
        "success"
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
        "info"
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
        }
      );

      if (res.data.success) {
        Swal.fire("Success", "Refund processed successfully!", "success");
        fetchBookingData(); // Refresh data after refund
      } else {
        Swal.fire(
          "Error",
          res.data.message || "Failed to process refund.",
          "error"
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

          // Parse values safely
          const price = parseFloat(updatedService.price) || 0;
          const gstPercent = parseFloat(updatedService.gstPercent) || 0;

          // Auto-calculate GST Amount and Total
          const gstAmount = (price * gstPercent) / 100;
          const totalAmount = price + gstAmount;

          updatedService.gstAmount = gstAmount.toFixed(2);
          updatedService.totalAmount = totalAmount.toFixed(2);

          return updatedService;
        }
        return service;
      })
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
        }
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
        0
      )
    : 0;

  const handleAddLocalService = async () => {
    const valid = servicesToAdd.filter(
      (s) => s.name && s.price && Number(s.price) > 0
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
        }))
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
            }
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

  const handleFinalSubmitToMain = async () => {
    if (!previewServices.length) {
      Swal.fire("Error", "No services to submit!", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}Supervisor/MoveTempAddOns?bookingId=${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
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
          "error"
        );
      }
    } catch (error) {
      console.error("Final Submit Error:", error);
      Swal.fire("Error", "Failed to save services", "error");
    }
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
        }
      );
      Swal.fire(
        "Success",
        res.data?.message || "Final Invoice generated successfully.",
        "success"
      );
      navigate(`/invoice-view/${bookingData.BookingID}`);
    } catch (error) {
      console.error("Generate Invoice Error:", error);

      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to generate Final invoice.",
        "error"
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
        }
      );
      Swal.fire(
        "Success",
        res.data?.message || "Estimation Invoice generated successfully.",
        "success"
      );
      navigate(`/invoice-view/${bookingData.BookingID}`);
    } catch (error) {
      console.error("Generate Invoice Error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message ||
          "Failed to generate Estimation invoice.",
        "error"
      );
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentMode("");
    setPayAmount("");
    setIsDiscountApplicable(false);
    setDiscountAmount("");
  };

  const totalAmount =
    (bookingData?.TotalPrice || 0) +
    (bookingData?.GSTAmount || 0) +
    (bookingData?.LabourCharges || 0) -
    (bookingData?.CouponAmount || 0);

  // const alreadyPaid = bookingData?.PaidAmount || 0;
  const alreadyPaid = (bookingData?.Payments || [])
    .filter(
      (payment) => payment.PaymentStatus === "Success" && !payment.IsRefunded
    )
    .reduce((sum, payment) => {
      return sum + Number(payment.AmountPaid || 0);
    }, 0);
  const remainingAmount = Math.max(totalAmount - alreadyPaid, 0);

  const handleConfirmPayment = async () => {
    try {
      if (!paymentMode) {
        Swal.fire("Validation", "Please select payment mode", "warning");
        return;
      }

      if (!payAmount || payAmount <= 0) {
        Swal.fire("Validation", "Enter valid amount", "warning");
        return;
      }

      if (isDiscountApplicable) {
        if (!discountAmount || discountAmount <= 0) {
          Swal.fire("Validation", "Enter valid discount amount", "warning");
          return;
        }

        if (discountAmount > payAmount) {
          Swal.fire(
            "Validation",
            "Discount cannot exceed entered amount",
            "warning"
          );
          return;
        }
      }

      if (payAmount > remainingAmount) {
        Swal.fire(
          "Validation",
          "Amount cannot exceed remaining balance",
          "warning"
        );
        return;
      }

      const finalAmount = Number(payAmount || 0) - Number(discountAmount || 0);

      if (finalAmount <= 0) {
        Swal.fire(
          "Validation",
          "Final payable amount must be greater than zero",
          "warning"
        );
        return;
      }

      // ✅ NEW PAYLOAD
      const payload = {
        bookingID: bookingData.BookingID,
        amountPaid: finalAmount,
        paymentMode, // ex: Cash / UPI / Card
        paymentStatus: "Success", // 🔒 static
        paymentType: "Static", // 🔒 static
      };

      const res = await axios.post(
        `${API_BASE}Payments/InsertBookingAddOnsPayment`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
        "warning"
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success || res.status === 200) {
        Swal.fire(
          "Success",
          "Pickup and Drop details saved successfully!",
          "success"
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
          "error"
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
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="row gy-4 mt-3">
      {/* Right Tabs Content */}
      <div className="col-lg-12">
        <div className="card h-100">
          <div className="card-body p-24">
            {bookingData ? (
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
                              className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
                            />
                          ) : (
                            <img
                              src="/assets/images/user-grid/user-grid-img14.png"
                              alt="Default User"
                              className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
                            />
                          )}
                        </div>
                      </div>

                      {/* ================= PERSONAL INFO ================= */}
                      <div className="col-lg-9 col-md-8 col-12">
                        <ul className="mb-0">
                          <li className="d-flex align-items-center gap-1 mb-12">
                            <span className="w-50 fw-semibold text-primary-light">
                              Customer Name :
                            </span>
                            <span className="w-70 text-secondary-light fw-bold">
                              {bookingData.CustomerName || "N/A"}
                            </span>
                          </li>

                          <li className="d-flex align-items-center gap-1 mb-12">
                            <span className="w-50 fw-semibold text-primary-light">
                              Phone Number :
                            </span>
                            <span className="w-70 text-secondary-light fw-bold">
                              {bookingData.PhoneNumber || "—"}
                            </span>
                          </li>

                          <li className="d-flex align-items-center gap-1 mb-12">
                            <span className="w-50 fw-semibold text-primary-light">
                              Vehicle Number :
                            </span>
                            <span className="w-70 text-secondary-light fw-bold">
                              {bookingData.VehicleNumber || "—"}
                            </span>
                          </li>
                          <li className="d-flex align-items-center gap-1 mb-12">
                            <span className="w-50 fw-semibold text-primary-light">
                              Full Address :
                            </span>
                            <span className="w-70 text-secondary-light fw-bold">
                              {bookingData.FullAddress || "—"}
                            </span>
                          </li>
                          {/* Assigned To */}
                          {!bookingData.TechFullName &&
                          !bookingData.SupervisorName ? (
                            <li className="d-flex align-items-center gap-1 mb-12">
                              <span className="w-50 fw-semibold text-primary-light">
                                Assigned To :
                              </span>
                              <span className="w-70 text-secondary-light fw-bold">
                                N/A
                              </span>
                            </li>
                          ) : (
                            <>
                              {bookingData.TechFullName && (
                                <>
                                  <li className="d-flex align-items-center gap-1 mb-12">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Technician :
                                    </span>
                                    <span className="w-70 text-secondary-light fw-bold">
                                      {bookingData.TechFullName}
                                    </span>
                                  </li>

                                  {bookingData.TechPhoneNumber && (
                                    <li className="d-flex align-items-center gap-1 mb-12">
                                      <span className="w-50 fw-semibold text-primary-light">
                                        Technician Number :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold">
                                        {bookingData.TechPhoneNumber}
                                      </span>
                                    </li>
                                  )}
                                </>
                              )}
                              {(pickupDate || dropDate) && (
                                <>
                                  <li className="d-flex align-items-center gap-1 mb-12">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Pickup Date & Time :
                                    </span>
                                    <span className="w-70 text-secondary-light fw-bold">
                                      {displayDate(pickupDate)}
                                      {pickupTime && ` : ${pickupTime}`}
                                      {/* OR use displayTime(pickupTime) */}
                                    </span>
                                  </li>

                                  <li className="d-flex align-items-center gap-1 mb-12">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Car Drop Date & Time :
                                    </span>
                                    <span className="w-70 text-secondary-light fw-bold">
                                      {displayDate(dropDate)}
                                      {dropTime && ` : ${dropTime}`}
                                    </span>
                                  </li>
                                </>
                              )}

                              {bookingData.SupervisorName && (
                                <>
                                  <li className="d-flex align-items-center gap-1 mb-12">
                                    <span className="w-50 fw-semibold text-primary-light">
                                      Supervisor :
                                    </span>
                                    <span className="w-70 text-secondary-light fw-bold">
                                      {bookingData.SupervisorName}
                                    </span>
                                  </li>

                                  {bookingData.SupervisorPhoneNumber && (
                                    <li className="d-flex align-items-center gap-1 mb-12">
                                      <span className="w-50 fw-semibold text-primary-light">
                                        Supervisor Number :
                                      </span>
                                      <span className="w-70 text-secondary-light fw-bold">
                                        {bookingData.SupervisorPhoneNumber}
                                      </span>
                                    </li>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            ) : (
              <div className="pb-24 ms-16 mb-24 me-16 text-center">
                <img
                  src="/assets/images/user-grid/user-grid-img14.png"
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
                  <div className="accordion-body">
                    <div className="row g-3">
                      {/* Pickup Date */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          min={today}
                          value={pickupDate}
                          onChange={(e) => {
                            setPickupDate(e.target.value);
                            setPickupTime("");
                            setDropDate("");
                            setDropTime("");
                          }}
                        />
                      </div>

                      {/* Pickup Time */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold">
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={pickupTime}
                          min={pickupDate === today ? nowTime : undefined}
                          disabled={!pickupDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (
                              pickupDate === today &&
                              isPastTimeToday(value)
                            ) {
                              return;
                            }
                            setPickupTime(value);
                            setDropTime("");
                          }}
                        />
                      </div>

                      {/* Drop Date */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Drop Date</label>
                        <input
                          type="date"
                          className="form-control"
                          min={pickupDate || today}
                          value={dropDate}
                          onChange={(e) => {
                            setDropDate(e.target.value);
                            setDropTime("");
                          }}
                          disabled={!pickupDate}
                        />
                      </div>

                      {/* Drop Time */}
                      <div className="col-md-3">
                        <label className="form-label fw-bold">Drop Time</label>
                        <input
                          type="time"
                          className="form-control"
                          value={dropTime}
                          disabled={!pickupDate || !pickupTime}
                          min={
                            pickupDate === dropDate
                              ? pickupTime ||
                                (pickupDate === today ? nowTime : undefined)
                              : undefined
                          }
                          onChange={(e) => {
                            const value = e.target.value;

                            if (pickupDate === dropDate && value < pickupTime) {
                              return;
                            }
                            setDropTime(value);
                          }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="d-flex justify-content-center gap-2 mt-4">
                      <button
                        className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                        onClick={handleSubmitPickupDetails}
                      >
                        Submit Details
                      </button>
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
                              slot.StartTime
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
                              : []
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
                      className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                      onClick={handleReschedule}
                    >
                      Submit Reschedule
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowReschedule(false)}
                    >
                      Cancel Reschedule
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

                {/* Reschedule & Reassign Buttons */}
                {bookingData &&
                  !["Completed", "Cancelled", "Refunded"].includes(
                    bookingData.BookingStatus
                  ) && (
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-warning btn-sm d-inline-flex align-items-center"
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
                <Link
                  to={`/book-service/${bookingData?.LeadId}`}
                  className="btn btn-primary-600 btn-sm text-success-main d-inline-flex align-items-center justify-content-center"
                  title="Add"
                >
                  Add / Edit Services
                </Link>
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
                              {bookingData?.Payments?.length > 0 &&
                                (() => {
                                  const rawStatus =
                                    bookingData.Payments?.[0]?.PaymentStatus ||
                                    "-";
                                  const status =
                                    rawStatus === "Success"
                                      ? "Paid"
                                      : rawStatus;

                                  const colorMap = {
                                    Paid: "#28A745",
                                    Pending: "#F57C00",
                                    Refunded: "#25878F",
                                    Failed: "#E34242",
                                    "-": "#BFBFBF",
                                  };

                                  const color = colorMap[status] || "#6c757d";

                                  return (
                                    <span
                                      className="fw-semibold d-flex align-items-center"
                                      style={{ fontSize: "13px" }}
                                    >
                                      <span
                                        className="badge"
                                        style={{
                                          backgroundColor: color,
                                          fontSize: "11px",
                                          fontWeight: 500,
                                          padding: "4px 10px",
                                          borderRadius: "12px",
                                        }}
                                      >
                                        {status}
                                      </span>
                                    </span>
                                  );
                                })()}

                              <span
                                className={`badge px-3 py-1 rounded-pill ${
                                  bookingData.BookingStatus === "Completed"
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
                                                      )
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
                                                          60
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
                                        )
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
                                                addon.ServicePrice
                                              ).toFixed(2)}
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </Accordion.Body>
                              </Accordion.Item>
                            </Accordion>
                          )}

                          {bookingData?.BookingAddOns?.length > 0 && (
                            <div className="card mb-4 mt-4">
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
                                      className="table-light sticky-top"
                                      style={{ zIndex: 2 }}
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
                                          style={{ width: "100px" }}
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
                                          Service Chg.
                                        </th>
                                        <th
                                          style={{ width: "90px" }}
                                          className="text-end"
                                        >
                                          GST %
                                        </th>
                                        <th
                                          style={{ width: "100px" }}
                                          className="text-end"
                                        >
                                          GST Amt.
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

                                        <th
                                          style={{ width: "100px" }}
                                          className="text-end"
                                        >
                                          Total Amt
                                        </th>
                                        {/* <th style={{ width: "200px" }}
                                        className="text-center">
                                          Description
                                        </th> */}
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
                                                    addon.Includes
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
                                                        )
                                                      )}
                                                    </ul>
                                                  )}
                                              </div>
                                            </td>

                                            <td className="normal">
                                              {addon.CreatedDate
                                                ? new Date(
                                                    addon.CreatedDate
                                                  ).toLocaleDateString("en-IN")
                                                : "—"}
                                            </td>
                                            <td className="text-end">
                                              {Number(
                                                addon.BasePrice || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td className="text-end">
                                              {addon.Quantity ?? "1"}
                                            </td>
                                            <td className="text-end">
                                              {Number(
                                                addon.ServicePrice || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td className="text-end">
                                              {Number(
                                                addon.LabourCharges || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td className="text-end">
                                              {addon.GSTPercent ?? 0}%
                                            </td>
                                            <td className="text-end">
                                              {Number(
                                                addon.GSTPrice || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td className="text-end">
                                              {addon.Percentage ?? "0"}%
                                            </td>
                                            <td className="text-end">
                                              {Number(
                                                addon.Our_Earnings || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td className="text-end fw-bold text-primary">
                                              {Number(
                                                addon.TotalPrice || 0
                                              ).toFixed(2)}
                                            </td>
                                            <td
                                              className=" normal"
                                              style={{
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                              }}
                                            >
                                              {/* {addon.Description || "—"} */}
                                            </td>
                                          </tr>
                                        )
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
                                    Items Subtotal
                                  </span>
                                  <span>
                                    ₹
                                    {Number(
                                      bookingData.TotalPrice || 0
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
                                      bookingData.LabourCharges || 0
                                    ).toFixed(2)}
                                  </span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between p-0">
                                  <span className="text-secondary">
                                    GST Total
                                  </span>
                                  <span>
                                    ₹
                                    {Number(bookingData.GSTAmount || 0).toFixed(
                                      2
                                    )}
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
                                        bookingData.CouponAmount || 0
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
                                        (bookingData.CouponAmount || 0)
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
                                          (bookingData.CouponAmount || 0)
                                      ) - alreadyPaid,
                                      0
                                    ).toFixed(2)}
                                  </span>
                                </li>
                                {/* </>
                              )} */}
                              </ul>
                              <div className="d-flex justify-content-center gap-2 mt-3 mb-3">
                                {/* Show Confirm Payment only if not paid */}
                                {remainingAmount > 0 && (
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
                                {remainingAmount > 0 && (
                                  <button
                                    className="btn btn-warning btn-sm d-inline-flex align-items-center"
                                    onClick={handleGenerateEstimationInvoice}
                                  >
                                    Generate Estimation Invoice
                                  </button>
                                )}

                                {/* Show Generate Invoice only if paid */}
                                {remainingAmount === 0 &&
                                  bookingData?.BookingAddOns &&
                                  bookingData.BookingAddOns.length > 0 && (
                                    <button
                                      className="btn btn-info btn-sm d-inline-flex align-items-center"
                                      onClick={handleGenerateFinalInvoice}
                                    >
                                      Generate Final Invoice
                                    </button>
                                  )}
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
            {/* <div className="d-flex justify-content-center gap-2 mt-3">
              {remainingAmount > 0 && (
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
              {remainingAmount > 0 && (
                <button
                  className="btn btn-warning btn-sm d-inline-flex align-items-center"
                  onClick={handleGenerateEstimationInvoice}
                >
                  Generate Estimation Invoice
                </button>
              )}

              {remainingAmount === 0 &&
                bookingData?.BookingAddOns &&
                bookingData.BookingAddOns.length > 0 && (
                  <button
                    className="btn btn-info btn-sm d-inline-flex align-items-center"
                    onClick={handleGenerateFinalInvoice}
                  >
                    Generate Final Invoice
                  </button>
                )}
            </div> */}
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
                  className="btn-close"
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
                  {roleId !== "8" && (
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
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
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
                  className="btn btn-primary btn-sm"
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
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header justify-content-center">
                <h6 className="modal-title">Enter Payment Details</h6>
              </div>

              <div className="modal-body">
                {/* Payment Mode */}
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

                {/* Amount Details */}
                <div className="border rounded p-3 bg-light mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Total Amount</span>
                    <strong>₹{totalAmount.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Already Paid</span>
                    <strong>₹{alreadyPaid.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-success">
                    <span>Remaining</span>
                    <strong>₹{remainingAmount.toFixed(2)}</strong>
                  </div>
                </div>
                {/* Discount Section */}
                {/* <div className="mb-3">
                  <div className="form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="discountApplicable"
                      checked={isDiscountApplicable}
                      onChange={(e) => {
                        setIsDiscountApplicable(e.target.checked);
                        if (!e.target.checked) {
                          setDiscountAmount("");
                        }
                      }}
                    />
                    <label
                      className="form-check-label fw-semibold"
                      htmlFor="discountApplicable"
                    >
                      {" "}
                      Is Discount Applicable
                    </label>
                  </div>
                </div> */}

                {/* {isDiscountApplicable && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Enter Discount Amount
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      max={remainingAmount}
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(Math.max(0, Number(e.target.value)))
                      }
                      placeholder="Enter discount amount"
                    />
                  </div>
                )}
                {isDiscountApplicable && (
                  <div className="border rounded p-2 bg-warning-subtle mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">Final Payable</span>
                      <strong>
                        ₹
                        {Math.max(
                          Number(payAmount || 0) - Number(discountAmount || 0),
                          0
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )} */}
                {/* Pay Amount */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Enter Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={remainingAmount}
                    value={payAmount}
                    onChange={(e) =>
                      setPayAmount(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
              </div>

              <div className="modal-footer justify-content-center">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={closePaymentModal}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary-600 btn-sm"
                  onClick={handleConfirmPayment}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingViewLayer;
