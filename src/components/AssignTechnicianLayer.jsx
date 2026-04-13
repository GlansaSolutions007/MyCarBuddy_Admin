import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const isPastTimeForDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const selectedDate = String(dateStr).split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  if (selectedDate !== today) return false;
  const t = String(timeStr).slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return t <= currentTimeStr;
};

const getLocalISODateTime = () => {
  const now = new Date();
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.000Z`;
};

const isGarageServiceCompletedApproved = (item) => {
  const status = (item?.StatusName ?? item?.statusName ?? item?.AddOnStatus ?? item?.addOnStatus)?.toString().trim();
  const isApproved = item?.IsCompleted_Confirmation === 1 || item?.isCompleted_Confirmation === 1;
  return status === "ServiceCompleted" && isApproved;
};

// ─── Choice Card ──────────────────────────────────────────────────────────────
const ChoiceCard = ({ icon, title, subtitle, onClick, selected, color = "#0d9488" }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: "100%",
      padding: "16px 20px",
      borderRadius: 16,
      border: `2px solid ${selected ? color : "#e2e8f0"}`,
      background: selected ? `${color}10` : "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 16,
      textAlign: "left",
      transition: "all 0.2s ease",
      transform: selected ? "translateY(-1px)" : "none",
      boxShadow: selected ? `0 4px 16px ${color}25` : "0 1px 3px rgba(0,0,0,0.06)",
    }}
    onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`; } }}
    onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; } }}
  >
    <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon icon={icon} width={24} style={{ color }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
    </div>
    {selected && <Icon icon="mdi:check-circle" width={22} style={{ color, flexShrink: 0 }} />}
  </button>
);

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, children, visible, stepNum, accent = "#0d9488" }) => {
  if (!visible) return null;
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease-out", marginBottom: 24 }}>
      <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: accent }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</span>
      </div>
      {children}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AssignTechnicianLayer = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const employeeData = JSON.parse(localStorage.getItem("employeeData") || "{}");
  const userId = employeeData?.Id;
  const roleName = employeeData?.RoleName;

  // Data State
  const [bookingData, setBookingData] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [fieldAdvisors, setFieldAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flow State
  const [serviceType, setServiceType] = useState(null);
  const [assignType, setAssignType] = useState("technician"); 
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedFieldAdvisor, setSelectedFieldAdvisor] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [assignDate, setAssignDate] = useState(today);
  const [assignTime, setAssignTime] = useState("");

  const [garageTask, setGarageTask] = useState(null);
  const [garageRoute, setGarageRoute] = useState(null);
  const [garagePickupDealer, setGaragePickupDealer] = useState(null);
  const [garageDeliverDealer, setGarageDeliverDealer] = useState(null);
  const [garageDriver, setGarageDriver] = useState(null);
  const [garageDate, setGarageDate] = useState(today);
  const [garageTime, setGarageTime] = useState("");
  const [hasExistingCustomerToDealerRoute, setHasExistingCustomerToDealerRoute] = useState(false);

  // Garage Helpers
  const garageDealerOptions = (() => {
    const seen = new Set();
    return (bookingData?.BookingAddOns || [])
      .filter((a) => a.DealerID != null && a.DealerName && !seen.has(Number(a.DealerID)) && (seen.add(Number(a.DealerID)), true))
      .map((a) => ({ value: Number(a.DealerID), label: a.DealerName }));
  })();

  const garageProgressServices = [
    ...(bookingData?.BookingAddOns || []),
    ...(bookingData?.SupervisorBookings || []),
  ].filter((item) => item?.DealerID != null && item?.DealerName);

  const garageDealerProgressGroups = Object.values(
    garageProgressServices.reduce((acc, item) => {
      const dealerId = Number(item.DealerID);
      if (!acc[dealerId]) acc[dealerId] = { dealerId, dealerName: item.DealerName, services: [] };
      acc[dealerId].services.push(item);
      return acc;
    }, {})
  );

  const completedGarageDealerOptions = garageDealerProgressGroups
    .filter((g) => g.services.length > 0 && g.services.every(isGarageServiceCompletedApproved))
    .map((g) => ({ value: g.dealerId, label: g.dealerName }));

  const remainingGarageDealerOptions = garageDealerProgressGroups
    .filter((g) => g.services.some((item) => !isGarageServiceCompletedApproved(item)))
    .map((g) => ({ value: g.dealerId, label: g.dealerName }));

  const allGarageServicesCompletedApproved =
    garageProgressServices.length > 0 && garageProgressServices.every(isGarageServiceCompletedApproved);

  const singleGarageDealerOption = garageDealerOptions.length === 1 ? garageDealerOptions[0] : null;

  const currentGarageDealerOption = (() => {
    const routes = bookingData?.CarPickUpDelivery || [];
    if (!routes.length) return completedGarageDealerOptions[0] || singleGarageDealerOption || null;
    const last = routes[routes.length - 1];
    const dealerId = Number(last?.PickTo) || Number(last?.PickFrom) || null;
    return garageDealerOptions.find((o) => o.value === dealerId) || completedGarageDealerOptions[0] || singleGarageDealerOption || null;
  })();

  const pendingNextGarageDealerOptions = remainingGarageDealerOptions.filter(
    (d) => !currentGarageDealerOption || d.value !== currentGarageDealerOption.value
  );

  useEffect(() => {
    Promise.all([fetchBookingData(), fetchTechnicians(), fetchSupervisors(), fetchFieldAdvisors()])
      .finally(() => setLoading(false));
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${bookingId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data[0];
      setBookingData(data);
      const routes = data?.CarPickUpDelivery || [];
      const hasRoute = routes.some((r) => r.RouteType === "CustomerToDealer" && r.Status?.toLowerCase() !== "cancelled");
      setHasExistingCustomerToDealerRoute(hasRoute);
      if (hasRoute && currentGarageDealerOption) setGaragePickupDealer(currentGarageDealerOption);
    } catch (e) { console.error(e); }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails`, { headers: { Authorization: `Bearer ${token}` } });
      setTechnicians(res.data.jsonResult.map((t) => ({ value: t.TechID, label: `${t.TechnicianName} (${t.PhoneNumber})` })));
    } catch (e) { console.error(e); }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, { headers: { Authorization: `Bearer ${token}` } });
      const employees = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSupervisors(employees.filter((e) => e.RoleName?.toLowerCase() === "supervisor").map((e) => ({ value: e.Id, label: `${e.Name} (${e.PhoneNumber || "N/A"})` })));
    } catch (e) { console.error(e); }
  };

  const fetchFieldAdvisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, { headers: { Authorization: `Bearer ${token}` } });
      const employees = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setFieldAdvisors(employees.filter((e) => e.RoleName?.toLowerCase() === "field advisor").map((e) => ({ value: e.Id, label: `${e.Name} (${e.PhoneNumber || "N/A"})` })));
    } catch (e) { console.error(e); }
  };

  const handleDoorstepSubmit = async () => {
    if (!assignDate || !assignTime) return Swal.fire("Error", "Please select date and time.", "error");
    const combinedAssignDate = `${assignDate}T${assignTime}:00`;
    let payload, apiUrl;

    if (assignType === "fieldAdvisor") {
      payload = { bookingIds: [bookingId], supervisorHeadId: Number(userId), fieldAdvisorId: selectedFieldAdvisor.value, assignTimeSlot: assignTime };
      apiUrl = `${API_BASE}Supervisor/AssignToFieldAdvisor`;
    } else if (assignType === "technician") {
      const selectedServiceNames = selectedServices.map((s) => s.value);
      const addOns = (bookingData?.BookingAddOns || []).filter((a) => selectedServiceNames.includes(a.ServiceName));
      const addOnIds = addOns.map((a) => String(a.AddOnID)).join(",") || "0";
      payload = { bookingID: bookingData.BookingID, assignDate: combinedAssignDate, role: "Technician", techID: selectedTechnician.value, addOnId: addOnIds, leadId: bookingData.LeadId, ServiceType: "ServiceAtHome", assignTimeSlot: assignTime };
      apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
    } else {
      payload = { bookingID: bookingData.BookingID, assignDate: combinedAssignDate, role: "Supervisor", techID: selectedSupervisor.value, leadId: bookingData.LeadId, ServiceType: "ServiceAtHome", timeSlot: assignTime };
      apiUrl = `${API_BASE}Supervisor/SavePickupDeliveryTime`;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(apiUrl, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 200 || res.status === 201) {
        await Swal.fire({ icon: "success", title: "Assigned!", text: res.data?.message || "Successfully assigned." });
        navigate(-1);
      }
    } catch (e) {
      Swal.fire("Error", e.response?.data?.message || "Assignment failed.", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleGarageSubmit = async () => {
    if (!garageDate || !garageTime) return Swal.fire("Error", "Please select date and time.", "error");
    const bid = Number(bookingId) || bookingData?.BookingID;
    const pickType = garageTask === "carPickup" ? "CarPick" : "CarDrop";
    const routeType = pickType === "CarDrop" ? "DealerToCustomer" : garageRoute === "customerToDealer" ? "CustomerToDealer" : "DealerToDealer";
    let pickFrom = 0, pickTo = 0;
    if (garageRoute === "customerToDealer") {
      if (garageTask === "carPickup") { pickFrom = bookingData.CustID ?? 0; pickTo = garageDeliverDealer?.value ?? 0; }
      else { pickFrom = garagePickupDealer?.value ?? 0; pickTo = bookingData.CustID ?? 0; }
    } else {
      pickFrom = garagePickupDealer?.value ?? 0; pickTo = garageDeliverDealer?.value ?? 0;
    }
    
    const payload = { bookingID: bid, leadId: bookingData?.LeadId, serviceType: "ServiceAtGarage", pickType, routeType, pickFrom, pickTo, techID: garageDriver?.value ?? 0, assignDate: `${garageDate}T${garageTime}:00` };

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}Supervisor/SavePickupDeliveryTime`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 200 || res.status === 201) {
        await Swal.fire({ icon: "success", title: "Saved!", text: res.data?.message || "Pickup/delivery saved successfully." });
        navigate(-1);
      }
    } catch (e) {
      Swal.fire("Error", e.response?.data?.message || "Failed to save.", "error");
    } finally { setIsSubmitting(false); }
  };

  // Visibility
  const isGarageBooking = bookingData?.ServiceType === "ServiceAtGarage";
  const showDoorstepAssignType = serviceType === "doorstep";
  const showDoorstepEmployee = serviceType === "doorstep" && !!assignType;
  const showDoorstepServices = serviceType === "doorstep" && assignType === "technician" && !!selectedTechnician;
  const showDoorstepDateTime = serviceType === "doorstep" && (
    (assignType === "technician" && selectedServices.length > 0) ||
    (assignType === "supervisor" && !!selectedSupervisor) ||
    (assignType === "fieldAdvisor" && !!selectedFieldAdvisor)
  );
  const isDoorstepReady = showDoorstepDateTime && !!assignDate && !!assignTime;

  const showGarageTask = serviceType === "garage";
  const showGarageRoute = serviceType === "garage" && !!garageTask;
  const showGarageDealer = serviceType === "garage" && !!garageTask && !!garageRoute;
  const showGarageDriver = serviceType === "garage" && !!garageTask && !!garageRoute && (
    garageTask === "carDrop" ||
    (garageRoute === "customerToDealer" && !!garageDeliverDealer) ||
    (garageRoute === "dealerToDealer" && !!garagePickupDealer && !!garageDeliverDealer)
  );
  const showGarageDateTime = showGarageDriver && !!garageDriver;
  const isGarageReady = showGarageDateTime && !!garageDate && !!garageTime;

  const availableServices = (bookingData?.BookingAddOns || [])
    .filter(a => (a.StatusName || a.statusName || a.AddOnStatus || a.addOnStatus) !== "ServiceCompleted")
    .map(a => ({ value: a.ServiceName, label: `${a.ServiceName} (${a.DealerName || "No Dealer"})` }));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "#fff", padding: "24px 16px" }}>
      <style>{`
        .assign-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 14px; width: 100%; outline: none; transition: border-color 0.2s; }
        .assign-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .assign-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .step1-grid { display: grid; grid-template-columns: ${isGarageBooking ? "1fr" : "1fr 1fr"}; gap: 16px; }
        @media (max-width: 768px) { .step1-grid, .field-row { grid-template-columns: 1fr; } }
      `}</style>

      {/* Booking summary pill */}
      <div style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", borderRadius: 16, padding: "16px 20px", marginBottom: 28, color: "#fff", display: "flex", flexWrap: "wrap", gap: 20 }}>
        {[
          { icon: "mdi:calendar", label: "Booking Date", value: bookingData?.BookingDate ? new Date(bookingData.BookingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
          { icon: "mdi:account", label: "Customer", value: bookingData?.CustomerName || "—" },
          { icon: "mdi:car", label: "Service Type", value: bookingData?.ServiceType === "ServiceAtGarage" ? "At Garage" : "At Doorstep" },
          { icon: "mdi:map-marker", label: "Address", value: bookingData?.FullAddress || "—" },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon icon={icon} width={15} /> {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Service Location ────────────────────────────────────────── */}
      <Section title="Step 1 — Where will service happen?" visible={true} stepNum={1}>
        <div className="step1-grid">
          {!isGarageBooking && (
            <ChoiceCard icon="mdi:home-circle-outline" title="Service at Doorstep" subtitle="Technician visits customer's location" selected={serviceType === "doorstep"} onClick={() => { setServiceType("doorstep"); setGarageTask(null); setGarageRoute(null); }} color="#0d9488" />
          )}
          <ChoiceCard icon="mdi:garage" title="Service at Garage" subtitle="Car pickup/drop & service at dealer's location" selected={serviceType === "garage"} onClick={() => { setServiceType("garage"); setAssignType("technician"); }} color="#7c3aed" />
        </div>
      </Section>

      {/* ── DOORSTEP FLOW ──────────────────────────────────────────────────── */}
      <Section title="Step 2 — Who to assign?" visible={showDoorstepAssignType} stepNum={2}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ChoiceCard icon="mdi:account-hard-hat" title="Technician" subtitle="Assign a field technician" selected={assignType === "technician"} onClick={() => { setAssignType("technician"); setSelectedSupervisor(null); setSelectedFieldAdvisor(null); }} color="#0d9488" />
          {/* <ChoiceCard icon="mdi:account-tie" title="Supervisor" subtitle="Assign a supervisor" selected={assignType === "supervisor"} onClick={() => { setAssignType("supervisor"); setSelectedTechnician(null); setSelectedFieldAdvisor(null); setSelectedServices([]); }} color="#2563eb" />
          {roleName !== "Field Advisor" && (
            <ChoiceCard icon="mdi:account-badge" title="Field Advisor" subtitle="Assign a field advisor" selected={assignType === "fieldAdvisor"} onClick={() => { setAssignType("fieldAdvisor"); setSelectedTechnician(null); setSelectedSupervisor(null); setSelectedServices([]); }} color="#d97706" />
          )} */}
        </div>
      </Section>

      <Section title={`Step 3 — Select ${assignType}`} visible={showDoorstepEmployee} stepNum={3}>
        {assignType === "technician" && <Select options={technicians} value={selectedTechnician} onChange={setSelectedTechnician} placeholder="Search technician..." isClearable />}
        {assignType === "supervisor" && <Select options={supervisors} value={selectedSupervisor} onChange={setSelectedSupervisor} placeholder="Search supervisor..." isClearable />}
        {assignType === "fieldAdvisor" && <Select options={fieldAdvisors} value={selectedFieldAdvisor} onChange={setSelectedFieldAdvisor} placeholder="Search field advisor..." isClearable />}
      </Section>

      <Section title="Step 4 — Select Services" visible={showDoorstepServices} stepNum={4}>
        <Select isMulti options={availableServices} value={selectedServices} onChange={(v) => setSelectedServices(v || [])} placeholder="Select services..." closeMenuOnSelect={false} />
      </Section>

      <Section title={`Step ${assignType === "technician" ? "5" : "4"} — Schedule`} visible={showDoorstepDateTime} stepNum={5}>
        <div className="field-row">
          <div>
            <label className="assign-label">Date *</label>
            <input type="date" className="assign-input" min={today} value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
          </div>
          <div>
            <label className="assign-label">Time *</label>
            <input type="time" className="assign-input" value={assignTime} onChange={(e) => {
              if (isPastTimeForDate(assignDate, e.target.value)) return Swal.fire("Warning", "Cannot select past time for today.", "warning");
              setAssignTime(e.target.value);
            }} />
          </div>
        </div>
      </Section>

      {isDoorstepReady && (
        <button onClick={handleDoorstepSubmit} disabled={isSubmitting} style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {isSubmitting ? "Assigning..." : "Confirm Assignment"}
        </button>
      )}

      {/* ── GARAGE FLOW ─────────────────────────────────────────────────────── */}
      <Section title="Step 2 — Task Type" visible={showGarageTask} stepNum={2} accent="#7c3aed">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!(garageDealerOptions.length === 1 && hasExistingCustomerToDealerRoute) && (
            <ChoiceCard icon="mdi:car-pickup" title="Car Pickup" subtitle="Pick up from customer" selected={garageTask === "carPickup"} onClick={() => { setGarageTask("carPickup"); setGarageRoute(null); setGarageDriver(null); }} color="#7c3aed" />
          )}
          {hasExistingCustomerToDealerRoute && allGarageServicesCompletedApproved && (
            <ChoiceCard icon="mdi:car-side" title="Car Drop" subtitle="Deliver back to customer" selected={garageTask === "carDrop"} onClick={() => { setGarageTask("carDrop"); setGarageRoute("customerToDealer"); setGaragePickupDealer(currentGarageDealerOption); setGarageDriver(null); }} color="#7c3aed" />
          )}
        </div>
      </Section>

      <Section title="Step 3 — Route" visible={showGarageRoute} stepNum={3} accent="#7c3aed">
        {garageTask === "carDrop" ? (
          <div style={{ padding: "14px 16px", background: "#f0fdf4", borderRadius: 10, border: "1.5px solid #bbf7d0", color: "#166534" }}>Route: <strong>Dealer → Customer</strong></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!hasExistingCustomerToDealerRoute && (
              <ChoiceCard icon="mdi:account-arrow-right" title="Customer → Dealer" subtitle="Pick up from customer" selected={garageRoute === "customerToDealer"} onClick={() => { setGarageRoute("customerToDealer"); setGarageDeliverDealer(singleGarageDealerOption); }} color="#7c3aed" />
            )}
            {hasExistingCustomerToDealerRoute && completedGarageDealerOptions.length > 0 && pendingNextGarageDealerOptions.length > 0 && (
              <ChoiceCard icon="mdi:swap-horizontal" title="Dealer → Dealer" subtitle="Move vehicle between dealers" selected={garageRoute === "dealerToDealer"} onClick={() => { setGarageRoute("dealerToDealer"); setGaragePickupDealer(currentGarageDealerOption); setGarageDeliverDealer(pendingNextGarageDealerOptions.length === 1 ? pendingNextGarageDealerOptions[0] : null); }} color="#7c3aed" />
            )}
          </div>
        )}
      </Section>

      <Section title="Step 4 — Dealer Details" visible={showGarageDealer} stepNum={4} accent="#7c3aed">
        {garageTask === "carPickup" && garageRoute === "customerToDealer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>PICKUP FROM</div>
              <div style={{ fontWeight: 600 }}>{bookingData?.FullAddress || "Customer Location"}</div>
            </div>
            <div>
              <label className="assign-label">Deliver To (Dealer) *</label>
              {singleGarageDealerOption ? (
                <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 10, border: "1.5px solid #bbf7d0", color: "#166534", fontWeight: 600 }}>{singleGarageDealerOption.label} <span style={{ float: "right", fontSize: 11 }}>Assigned</span></div>
              ) : (
                <Select options={garageDealerOptions} value={garageDeliverDealer} onChange={setGarageDeliverDealer} placeholder="Select dealer..." isClearable />
              )}
            </div>
          </div>
        )}
        {(garageTask === "carDrop" || garageRoute === "dealerToDealer") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>PICKUP FROM</div>
              <div style={{ fontWeight: 600 }}>{garagePickupDealer?.label || "—"}</div>
            </div>
            <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>DELIVER TO</div>
              <div style={{ fontWeight: 600 }}>{garageRoute === "dealerToDealer" ? (garageDeliverDealer?.label || "Select next dealer...") : (bookingData?.FullAddress || "Customer")}</div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Step 5 — Assign Driver" visible={showGarageDriver} stepNum={5} accent="#7c3aed">
        <Select options={technicians} value={garageDriver} onChange={setGarageDriver} placeholder="Search driver..." isClearable />
      </Section>

      <Section title="Step 6 — Schedule" visible={showGarageDateTime} stepNum={6} accent="#7c3aed">
        <div className="field-row">
          <div>
            <label className="assign-label">Date *</label>
            <input type="date" className="assign-input" min={today} value={garageDate} onChange={(e) => setGarageDate(e.target.value)} />
          </div>
          <div>
            <label className="assign-label">Time *</label>
            <input type="time" className="assign-input" value={garageTime} onChange={(e) => {
              if (isPastTimeForDate(garageDate, e.target.value)) return Swal.fire("Warning", "Cannot select past time.", "warning");
              setGarageTime(e.target.value);
            }} />
          </div>
        </div>
      </Section>

      {isGarageReady && (
        <button onClick={handleGarageSubmit} disabled={isSubmitting} style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {isSubmitting ? "Saving..." : "Confirm Assignment"}
        </button>
      )}
    </div>
  );
};

export default AssignTechnicianLayer;