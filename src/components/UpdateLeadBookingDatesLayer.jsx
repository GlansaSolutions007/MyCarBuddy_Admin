import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";

const TRACKING_STATUS_ASSIGNED_TO_HEAD = "Assigned To Head";

import axios from "axios";
import Swal from "sweetalert2";


const API_BASE = import.meta.env.VITE_APIURL;

const normalizeIsoForDateTimeLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const toIsoFromDateTimeLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};

const getLatestByCreatedDate = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => {
    const da = a?.createdDate ? new Date(a.createdDate).getTime() : 0;
    const db = b?.createdDate ? new Date(b.createdDate).getTime() : 0;
    return db - da;
  });
  return sorted[0] || null;
};

const UpdateLeadBookingDatesLayer = () => {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leads, setLeads] = useState([]); // [{leadId, label}]

  const [leadId, setLeadId] = useState("");
  const [bookingID, setBookingID] = useState(0);
  const [addOnID, setAddOnID] = useState(0);
  const [carPickId, setCarPickId] = useState(0);

  // form fields
  const [form, setForm] = useState({
    paymentDate: "",
    bookingDate: "",
    bookingAddOnCreatedDate: "",
    assignedDate: "",
    headAssignDate: "",
    employeeAssignDate: "",
    trackingCreatedDate: "",
    pickupCreatedDate: "",

    // lead created date (from API)
    facebookLeadCreatedDate: "",

    // phone number (from booking)
    phoneNumber: "",

    Name: "",


    


    // Tech fields from carPickupDelivery
    techAssignDate: "",
    pickupOtpVerifiedAt: "",
    dropOtpVerifiedAt: "",

    bookingAddOnServiceNames: "",
  });

  const [carPickupDeliveryList, setCarPickupDeliveryList] = useState([]);
  const [trackingList, setTrackingList] = useState([]);

  const [addOnsTrackingList, setAddOnsTrackingList] = useState([]);
  const [driverTrackingList, setDriverTrackingList] = useState([]);


  // full list (API requirement for table display)
  const [trackingHistoryList, setTrackingHistoryList] = useState([]);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tryLoadLeads = async () => {
    const candidateEndpoints = [
      `${API_BASE}Leads`,
      `${API_BASE}Leads/All`,
      `${API_BASE}Leads/List`,
      `${API_BASE}Leads/LeadsList`,
    ];

    setLeadsLoading(true);
    try {
      for (const url of candidateEndpoints) {
        try {
          const res = await axios.get(url, { headers });
          const data = res.data;
          const list = Array.isArray(data)
            ? data
            : data?.data && Array.isArray(data.data)
              ? data.data
              : data?.jsonResult && Array.isArray(data.jsonResult)
                ? data.jsonResult
                : [];

          const mapped = list
            .map((x) => {
              const id = x?.leadId ?? x?.LeadId ?? x?.leadID ?? x?.LeadID ?? x?.Id ?? x?.id;
              if (id == null) return null;
              return { leadId: String(id), label: String(id) };
            })
            .filter(Boolean);

          const unique = Array.from(new Map(mapped.map((x) => [x.leadId, x])).values());
          if (unique.length) {
            setLeads(unique);
            return;
          }
        } catch {
          // try next endpoint
        }
      }
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchLeadDetails = async (selectedLeadId) => {

    if (!selectedLeadId) return;

    setIsFetching(true);
    try {
      const url = `${API_BASE}Leads/GetLeadDetailsByLeadId/${encodeURIComponent(selectedLeadId)}`;
      const res = await axios.get(url, { headers });
      const data = res.data?.data ? res.data.data : res.data;

      if (!data) {
        Swal.fire({ icon: "warning", title: "No data", text: "Lead details not found." });
        return;
      }

      const carPickup = data?.carPickupDelivery || null;
      console.log("Fetched lead details:", { data, carPickup });
      const latestAddOn = getLatestByCreatedDate(data?.bookingAddOns);
      const latestTracking = getLatestByCreatedDate(data?.trackingHistory);
      const latestDealerApproval = getLatestByCreatedDate(data?.dealerApprovalTracking);
      const latestPayment = getLatestByCreatedDate(data?.payments);

      // table wants FULL trackingHistory
      setTrackingHistoryList(Array.isArray(data?.trackingHistory) ? data.trackingHistory : []);

      const booking = data?.booking || {};
      const leadAssignments = data?.leadAssignments?.[0] || {};

      setBookingID(booking?.bookingID ?? booking?.BookingID ?? 0);

      setCarPickId(carPickup?.id ?? 0);
      setAddOnID(latestAddOn?.addOnID ?? 0);

      // IMPORTANT: Do NOT overwrite driverTracking dates with derived API values.
      // All tech timing dates must come from loadLead() (leadscript.php) via `form.*`.
      // So we keep driverTrackingList only for row identification/status (ids etc.).
      // createdDate will be sent from `form.*` in handleSubmit().

      const trackingCreatedDate = latestTracking?.createdDate ?? "";
      const pickupCreatedDate = carPickup?.assignDate ?? carPickup?.pickupDate ?? "";
      const assignedDate = carPickup?.assignDate ?? latestDealerApproval?.createdDate ?? "";

      // Build carPickupDeliveryList using leadscript.php form fields (loadLead), not this API response
      setCarPickupDeliveryList(
        Array.isArray(carPickup)
          ? carPickup.map((x) => {
              const pickType = x?.pickType ?? "";

              // values from loadLead() mapped into `form` keys

              const pickupVerifiedAt =
                pickType === "CarPick" || x?.serviceType === "ServiceAtHome"
                  ? form.pickupVerifiedAt
                  : pickType === "CarDrop"
                    ? form.pickupDealerDate
                    : x?.pickupVerifiedAt ?? "";

              const deliveryVerifiedAt =
                pickType === "CarPick" || x?.serviceType === "ServiceAtHome"
                  ? form.deliveryVerifiedAt
                  : pickType === "CarDrop"
                    ? form.customerDropDate
                    : x?.deliveryVerifiedAt ?? "";

              const assignDate =
                pickType === "CarPick" || pickType === "CarDrop" || x?.serviceType === "ServiceAtHome"
                  ? form.techAssignDate || x?.assignDate || ""
                  : x?.assignDate || "";


              return {
                carPickId: x?.id ?? 0,
                id: x?.id ?? 0,
                pickType,
                routeType: x?.routeType ?? "",
                serviceType: x?.serviceType ?? "",
                assignDate: assignDate,
                pickupVerifiedAt,
                deliveryVerifiedAt,
                pickupDate: pickupVerifiedAt,
                deliveryDate: deliveryVerifiedAt,
                createdDate: x?.createdDate ?? "",
              };
            })
          : carPickup
            ? [
                {
                  carPickId: carPickup?.id ?? 0,
                  id: carPickup?.id ?? 0,
                  pickType: carPickup?.pickType ?? "",
                  routeType: carPickup?.routeType ?? "",
                  assignDate: form.techAssignDate || carPickup?.assignDate || "",
                  pickupVerifiedAt:
                    carPickup?.pickType === "CarPick"
                      ? form.pickupVerifiedAt
                      : carPickup?.pickType === "CarDrop"
                        ? form.pickupDealerDate
                        : carPickup?.pickupVerifiedAt ?? "",
                  deliveryVerifiedAt:
                    carPickup?.pickType === "CarPick"
                      ? form.deliveryVerifiedAt
                      : carPickup?.pickType === "CarDrop"
                        ? form.customerDropDate
                        : carPickup?.deliveryVerifiedAt ?? "",
                  pickupDate:
                    carPickup?.pickType === "CarPick"
                      ? form.pickupVerifiedAt
                      : carPickup?.pickType === "CarDrop"
                        ? form.pickupDealerDate
                        : carPickup?.pickupVerifiedAt ?? "",
                  deliveryDate:
                    carPickup?.pickType === "CarPick"
                      ? form.deliveryVerifiedAt
                      : carPickup?.pickType === "CarDrop"
                        ? form.customerDropDate
                        : carPickup?.deliveryVerifiedAt ?? "",
                  createdDate: carPickup?.createdDate ?? "",
                },
              ]
            : []
      );



      const fullTracking = Array.isArray(data?.trackingHistory) ? data.trackingHistory : [];

      // Send ALL trackingHistory rows (not only latest)
      setTrackingList(
        fullTracking
          .filter((t) => t && t.trackId != null)
          .map((t) => ({
            trackId: Number(t?.trackId) || 0,
            trackingCreatedDate: t?.createdDate ?? "",
          }))
      );

      setAddOnsTrackingList(Array.isArray(data?.addOnsTracking) ? data.addOnsTracking : []);
      // Keep driverTrackingList only for row identity (pickType/status/id etc.).
      // Dates shown/updated must come from loadLead() via `form.*`.
      setDriverTrackingList(
        (Array.isArray(data?.driverTracking) ? data.driverTracking : []).map((x) => ({
          ...x,
          createdDate: x?.createdDate ?? "",
        }))
      );

      // ensure driverTracking table dates/status come from leadscript.php fields (via form after loadLead)
      // (we keep list length but will populate dates via effect below)

    setForm((prevForm) => ({
        // keep in sync with loadLead() (for UI defaults like payment date)
        ...prevForm,
        paymentDate: latestPayment?.paymentDate ?? data?.["Payment Date Time"] ?? "",


        bookingDate: booking?.bookingDate ?? "",
        // keep in sync with loadLead() (for UI defaults like add-ons created date)
        bookingAddOnCreatedDate: form.bookingAddOnCreatedDate || (latestAddOn?.createdDate ?? ""),

        assignedDate: assignedDate,
        headAssignDate: leadAssignments?.headAssignDate ?? "",
        employeeAssignDate: leadAssignments?.employeeAssignDate ?? "",
        trackingCreatedDate: trackingCreatedDate,
        pickupCreatedDate: pickupCreatedDate,

        // lead created date (as requested)
        facebookLeadCreatedDate: data?.leadCreatedDate ?? "",
        phoneNumber: data?.booking?.custPhoneNumber ?? form.phoneNumber ?? "",
        Name: data?.booking?.custFullName ?? form.Name ?? "",


        techAssignDate: carPickup?.assignDate ?? "",
        pickupOtpVerifiedAt: carPickup?.pickupVerifiedAt ?? "",
        dropOtpVerifiedAt: carPickup?.deliveryVerifiedAt ?? "",


        bookingAddOnServiceNames: data?.bookingAddOns
          ? data.bookingAddOns.map((x) => x.serviceName).filter(Boolean).join(", ")
          : "",
    }));
    } catch (e) {
      console.error("fetchLeadDetails failed:", e);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: e?.response?.data?.message || "Failed to load lead details.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    tryLoadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (leadId) fetchLeadDetails(leadId);
    if (leadId) loadLead(leadId); // Load lead details from leadscript.php
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Auto-sync trackingHistory[].createdDate based on statusName
  // Mapping (as per user):
  // - Assigned To Head -> headAssignDate
  // - Assigned To Employee -> employeeAssignDate
  // - LeadConverted -> leadConvertDate
  // - Booking Created -> bookingDate
  // - Service Created -> bookingAddOnCreatedDate
  // - Assigned to supervisor -> employeeAssignDate
  // - Dealer Assigned -> dealerAssignDate
  // - Approved By Dealer -> dealerApprovalDate
  // - Customer Confirmed -> customerConfirmedDate
  useEffect(() => {
    setTrackingHistoryList((prev) => {
      if (!Array.isArray(prev)) return prev;

      const resolveIso = (maybeValue) => {
        if (!maybeValue) return null;
        const d = new Date(maybeValue);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
      };

      const next = prev.map((t) => {
        const statusName = t?.statusName ?? "";

        if (statusName === TRACKING_STATUS_ASSIGNED_TO_HEAD) {
          const iso = resolveIso(form.headAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Assigned To Employee") {
          const iso = resolveIso(form.employeeAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "LeadConverted") {
          const iso = resolveIso(form.leadConvertDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

         if (statusName === "Follow-Up: Interested") {
          const iso = resolveIso(form.followUpInterestedDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Booking Created") {
          const iso = resolveIso(form.bookingDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        // Service Created / booking addons createdDate
        if (statusName === "Service Created" || statusName === "Service Created (from Booking Addons)") {
          const iso = resolveIso(form.bookingAddOnCreatedDate);
          return iso ? { ...t, createdDate: iso } : t;
        }



        if (statusName === "Assigned to supervisor") {
          // existing mapping
          const iso = resolveIso(form.employeeAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Supervisor Confirmed") {
          // user wants old date from loadLead()
          const iso = resolveIso(form.supervisorAssignDate ?? form.employeeAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Dealer Assigned") {
          const iso = resolveIso(form.dealerAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Approved By Dealer") {
          const iso = resolveIso(form.dealerApprovalDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if (statusName === "Customer Confirmed") {
          const iso = resolveIso(form.customerConfirmedDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if(statusName === "Add-Ons Payment Received (Full)" || statusName === "Add-Ons Payment Received (Partial)"){
          const iso = resolveIso(form.paymentDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if(statusName === "Booking Complete"){
          const iso = resolveIso(form.bookingCompleteDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

        if(statusName === "Supervisor Confirmed"){
          const iso = resolveIso(form.supervisorAssignDate);
          return iso ? { ...t, createdDate: iso } : t;
        }

     

        return t;
      });

      return next;
    });
  }, [
    form.headAssignDate,
    form.employeeAssignDate,
    form.leadConvertDate,
    form.bookingDate,
    form.bookingAddOnCreatedDate,
    form.dealerAssignDate,
    form.dealerApprovalDate,
    form.customerConfirmedDate,
  ]);




  const validate = () => {
    // No required fields: backend should handle validation.
    // Keep only minimal check for leadId.
    return true;
  };

  const handleSubmit = async () => {
    if (!leadId) {
      Swal.fire({ icon: "warning", title: "Select Lead", text: "Please select/enter a Lead ID." });
      return;
    }
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        leadId: String(leadId),
        bookingID: Number(bookingID) || 0,
        addOnID: Number(addOnID) || 0,
        carPickId: Number(carPickId) || 0,

        paymentDate: toIsoFromDateTimeLocalInput(form.paymentDate),
        bookingDate: toIsoFromDateTimeLocalInput(form.bookingDate),
        bookingAddOnCreatedDate: toIsoFromDateTimeLocalInput(form.bookingAddOnCreatedDate),
        phoneNumber: form.phoneNumber != null ? String(form.phoneNumber) : "",
        facebookLeadCreatedDate: toIsoFromDateTimeLocalInput(form.facebookLeadCreatedDate),

        // assignedDate: toIsoFromDateTimeLocalInput(form.assignedDate),
        headAssignDate: toIsoFromDateTimeLocalInput(form.headAssignDate),
        employeeAssignDate: toIsoFromDateTimeLocalInput(form.employeeAssignDate),
        bookingCompletedDate: toIsoFromDateTimeLocalInput(form.bookingCompleteDate),


        // carPickupDeliveryList
        carPickupDeliveryList: carPickupDeliveryList.map((x) => {
          const isServiceAtHome = String(x?.serviceType ?? "").trim() === "ServiceAtHome";

          const pickupSource = isServiceAtHome ? form.pickupVerifiedAt : x?.pickupVerifiedAt;
          const deliverySource = isServiceAtHome ? form.deliveryVerifiedAt : x?.deliveryVerifiedAt;

          return {
            carPickId: Number(x.carPickId) || 0,
            assignDate: toIsoFromDateTimeLocalInput(x.assignDate) || x.assignDate,
            pickupDate:
              toIsoFromDateTimeLocalInput(pickupSource) || pickupSource || "",
            deliveryDate:
              toIsoFromDateTimeLocalInput(deliverySource) || deliverySource || "",
            createdDate: toIsoFromDateTimeLocalInput(x.createdDate) || x.createdDate,
          };
        }),

        // trackingList
        // IMPORTANT: use trackingHistoryList (table rows) so createdDate matches UI/auto-mapping
        trackingList: (Array.isArray(trackingHistoryList) ? trackingHistoryList : []).map((t) => ({
          trackId: Number(t?.trackId) || 0,
          trackingCreatedDate:
            toIsoFromDateTimeLocalInput(t?.createdDate) || t?.createdDate || "",
        })),

      // tech lists (editable tables)
        // addOnsTrackingList dates should come from loadLead() mapping (old dates)
        // i.e., use the single UI field `form.bookingAddOnCreatedDate`.
        addOnsTrackingList: (Array.isArray(addOnsTrackingList) ? addOnsTrackingList : []).map((x) => ({
          id: Number(x.id) || 0,
          createdDate: toIsoFromDateTimeLocalInput(form.bookingAddOnCreatedDate) || x?.createdDate || "",
        })),

        driverTrackingList: (Array.isArray(driverTrackingList) ? driverTrackingList : []).map((x) => {
          // IMPORTANT: Update API must receive the SAME dates shown in the UI,
          // which come from loadLead() => form.* mapping.

          const pickType = x?.pickType;
          const status = String(x?.status ?? "").trim().toLowerCase();
          const serviceType = String(x?.serviceType ?? "").trim();

          const uiDate = (() => {
            // CarPick mappings
            if (pickType === "CarPick") {
              if (status === "pickup_started") return form.techStartedDate;
              if (status === "pickup_reached") return form.techReachedDate;
              if (status === "car_picked") return form.pickupVerifiedAt;
              if (status === "in_transit") return form.dealerTransitDate;
              if (status === "drop_reached") return form.techReachedDate;
              if (status === "completed") return form.serviceCompleteDate;
              return x?.createdDate;
            }

            // CarDrop mappings
            if (pickType === "CarDrop") {
              if (status === "pickup_started") return form.techStartedDate2;
              if (status === "pickup_reached") return form.pickupDealerDate;
              if (status === "car_picked") return form.customerTransitDate;
              if (status === "in_transit") return form.customerTransitDate;
              if (status === "drop_reached") return form.customerDropDate;
              if (status === "completed") return form.bookingCompleteDate;
              return x?.createdDate;
            }

            // ServiceAtHome mappings (match UI table logic)
            if (serviceType === "ServiceAtHome") {
              if (status === "pickup_started") return form.techStartedDate;
              if (status === "pickup_reached") return form.techReachedDate;
              if (status === "servicestart") return form.pickupVerifiedAt;
              if (status === "completed") return form.serviceCompleteDate;
              return x?.createdDate;
            }

            return x?.createdDate;
          })();

          return {
            id: Number(x?.id) || 0,
            createdDate: toIsoFromDateTimeLocalInput(uiDate) || uiDate || "",
          };
        }),
      };

      await axios.post(`${API_BASE}Leads/UpdateLeadBookingDates`, payload, { headers });

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Lead booking dates updated successfully.",
      });
    } catch (e) {
      console.error("submit error", e);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || "Failed to update lead booking dates.",
      });
    } finally {
      setIsSaving(false);
    }
  };

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const [datePart, timePart] = value.trim().split(" ");
  if (!datePart || !timePart) return "";

  const [day, month, year] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

  const loadLead = async (leadId) => {

  const response = await fetch(
    `${API_BASE}Leads/GetLeadDetails?leadId=${leadId}`
  );
  const data = await response.json();

  setForm({
    leadId: data["LeadId"] || "",
        phoneNumber: data["Lead Phonenumber"] || "",
    Name: data["Customer Name"] || "",

    customerName: data["Customer Name"] || "",
    facebookLeadCreatedDate: toDateTimeLocal(data["Lead CreateDate Time"]) || "",
    invoiceDate: toDateTimeLocal(data["Invoice Date"]) || "",
    headAssignDate: toDateTimeLocal(data["Telecaller Head AssignDate Time"]) || "",
    employeeAssignDate: toDateTimeLocal(data["T.Employee AssignDate Time"]) || "",
    interestedDate: toDateTimeLocal(data["Follow-Up: Interested Date Time"]) || "",
    leadConvertDate: toDateTimeLocal(data["LeadConvert Date Time"]) || "",
    followUpInterestedDate: toDateTimeLocal(data["LeadConvert Date Time"]) || "",
    bookingDate: toDateTimeLocal(data["Booking Created Date Time"]) || "",
    bookingAddOnCreatedDate: toDateTimeLocal(data["Booking Addos Create Date Time"]) || "",
    supervisorAssignDate: toDateTimeLocal(data["Booking Superviosr Assign Date Time"]) || "",
    dealerAssignDate: toDateTimeLocal(data["Dealer Assign Date Time"]) || "",
    dealerApprovalDate: toDateTimeLocal(data["Dealer Approval Date Time"]) || "",
    customerConfirmedDate: toDateTimeLocal(data["Customer Confirmed Date Time"]) || "",
    techAssignDate: toDateTimeLocal(data["Tech Assign Date Time"]) || "",
    techStartedDate: toDateTimeLocal(data["Tech Started Date Time"]) || "",
    techReachedDate: toDateTimeLocal(data["Tech Reached Date Time"]) || "",
    pickupVerifiedAt: toDateTimeLocal(data["Car Pick From Customer Date Time"]) || "",
    dealerTransitDate: toDateTimeLocal(data["Tech to Dealer In Transit Date Time"]) || "",
    deliveryVerifiedAt: toDateTimeLocal(data["Tech Drop to Dealer location Date Time"]) || "",
    serviceCompleteDate: toDateTimeLocal(data["Service Complete Date Time"]) || "",
    techAssignDate2: toDateTimeLocal(data["Tech Assign2 Date Time"]) || "",
    techStartedDate2: toDateTimeLocal(data["Tech Started2 Date Time"]) || "",
    techReachedDate2: toDateTimeLocal(data["Tech Reached2 Date Time"]) || "",
    pickupDealerDate: toDateTimeLocal(data["Car Pick From Dealer Date Time"]) || "",
    customerTransitDate: toDateTimeLocal(data["Tech to Customer In Transit Date Time"]) || "",
    customerDropDate: toDateTimeLocal(data["Tech Drop to Customer Date Time"]) || "",
    bookingCompleteDate: toDateTimeLocal(data["Booking Complete Date Time"]) || "",
    paymentDate: toDateTimeLocal(data["Payment Date Time"]) || "",
  });

};

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h5 className="mb-0">Update Lead Booking Dates</h5>
          <button
            type="button"
            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Icon icon="simple-line-icons:check" className="text-xl" />
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="card-body py-20">
        <div className="row g-3">
          <div className="col-lg-4 col-md-6">
            <label className="form-label">Lead ID</label>
            <select
              className="form-select"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}

                // onChange={(e)=>loadLead(e.target.value)}
              disabled={leadsLoading || isFetching}
            >
              <option value="">
                {leadsLoading ? "Loading..." : leads.length ? "Select Lead" : "(Dropdown unavailable)"}
              </option>
              {leads.map((x) => (
                <option key={x.leadId} value={x.leadId}>
                  {x.label}
                </option>
              ))}
            </select>

            {!leads.length && (
              <input
                className="form-control mt-2"
                placeholder="Enter Lead ID"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
              />
            )}
          </div>

          <div className="col-lg-3 col-md-6">
            <label className="form-label">Booking ID (from API)</label>
            <input className="form-control" value={bookingID} disabled />
          </div>

          {/* <div className="col-lg-3 col-md-6">
            <label className="form-label">addOnID (latest add-on)</label>
            <input className="form-control" value={addOnID} disabled />
          </div> */}

          {/* <div className="col-lg-3 col-md-6">
            <label className="form-label">carPickId (from API)</label>
            <input className="form-control" value={carPickId} disabled />
          </div> */}

          <div className="col-12">
            <h6 className="mb-3">Lead & Assignment</h6>
          </div>
          
          <div className="col-lg-4 col-md-6">
            <label className="form-label">lead created date</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.facebookLeadCreatedDate)}
              onChange={(e) => setForm((p) => ({ ...p, facebookLeadCreatedDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">name</label>
            <input
              type="text"
              className="form-control"
              value={form.Name || ""}
              // onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">phoneNumber</label>
            <input
              type="text"
              className="form-control"
              value={form.phoneNumber || ""}
              onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            />
          </div>


          <div className="col-lg-4 col-md-6">
            <label className="form-label">headAssignDate</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.headAssignDate)}
              onChange={(e) => setForm((p) => ({ ...p, headAssignDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">employeeAssignDate</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.employeeAssignDate)}
              onChange={(e) => setForm((p) => ({ ...p, employeeAssignDate: e.target.value }))}
            />
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">trackingHistory (statusName, createdDate)</h6>
          </div>


          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "55%" }}>statusName</th>
                    <th style={{ width: "45%" }}>createdDate</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(trackingHistoryList) && trackingHistoryList.length
                    ? trackingHistoryList
                    : []
                  ).map((t, idx) => (
                    <tr key={`${t?.trackId ?? ""}-${t?.createdDate ?? ""}-${idx}`}>
                      <td>{t?.statusName ?? ""}</td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="datetime-local"
                              value={normalizeIsoForDateTimeLocalInput(t?.createdDate)}
                              onChange={(e) => {
                                const v = e.target.value;
                                const iso = v ? new Date(v).toISOString() : "";
                                const trackId = t?.trackId;

                                setTrackingHistoryList((prev) => {
                                  if (!Array.isArray(prev)) return prev;
                                  return prev.map((it) => {
                                    if (it?.trackId === trackId) {
                                      return { ...it, createdDate: iso || it?.createdDate };
                                    }
                                    return it;
                                  });
                                });
                              }}
                            />
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>



          <div className="col-12">
            <h6 className="mb-3 mt-4">Booking & Payment</h6>
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">booking date (booking.bookingDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.bookingDate)}
              onChange={(e) => setForm((p) => ({ ...p, bookingDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">payments date (latest payment.paymentDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.paymentDate)}
              onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">booking addons date (latest add-on.createdDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.bookingAddOnCreatedDate)}
              onChange={(e) => setForm((p) => ({ ...p, bookingAddOnCreatedDate: e.target.value }))}
            />
            {form.bookingAddOnServiceNames ? (
              <div className="text-muted small mt-1">Services: {form.bookingAddOnServiceNames}</div>
            ) : null}
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">Car pickup/drop (tech timing)</h6>
            {carPickupDeliveryList.length ? null : (
              <div className="text-muted small">No car pickup/drop records found for this lead.</div>
            )}
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "10%" }}>id</th>
                    <th style={{ width: "10%" }}>pickType</th>
                    <th style={{ width: "10%" }}>routeType</th>
                    <th style={{ width: "22%" }}>tech assign date</th>
                    <th style={{ width: "22%" }}>pickup date</th>
                    <th style={{ width: "22%" }}>deliveryDate</th>
                    {/* <th style={{ width: "24%" }}>createdDate</th> */}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(carPickupDeliveryList) && carPickupDeliveryList.length
                    ? carPickupDeliveryList
                    : (
                        // show raw objects if present (sometimes API keys differ)
                        Array.isArray(carPickupDeliveryList)
                          ? carPickupDeliveryList
                          : []
                      )
                  ).map((row, idx) => (
                    <tr key={`${row?.carPickId ?? ""}-${idx}`}>
                      <td>{row?.id ?? ""}</td>
                      <td>{row?.pickType ?? ""}</td>
                      <td>{row?.routeType !== "" ? row?.routeType : row?.ServiceType ?? ""}</td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={(() => {
                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;
                            if (pickType === "CarPick" || serviceType === "ServiceAtHome") return normalizeIsoForDateTimeLocalInput(form.techAssignDate);
                            if (pickType === "CarDrop") return normalizeIsoForDateTimeLocalInput(form.techAssignDate2);
                            // if (row?.assignDate) return normalizeIsoForDateTimeLocalInput(row?.assignDate);
                            return "";
                          })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const iso = v ? new Date(v).toISOString() : "";

                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;
                            if (pickType === "CarPick" || serviceType === "ServiceAtHome") {
                              setForm((p) => ({ ...p, techAssignDate: v || "" }));
                            } else if (pickType === "CarDrop") {
                              setForm((p) => ({ ...p, techAssignDate2: v || "" }));
                            }

                            setCarPickupDeliveryList((prev) =>
                              prev.map((it) =>
                                it?.carPickId === row?.carPickId
                                  ? { ...it, assignDate: iso || it?.assignDate }
                                  : it
                              )
                            );
                          }}
                        />
                      </td>


                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={(() => {
                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;

                            // prefer loadLead() (form.*). fallback to row.* (already mapped from fetchLeadDetails)
                            if (pickType === "CarPick") {
                              return normalizeIsoForDateTimeLocalInput(form.pickupVerifiedAt) || normalizeIsoForDateTimeLocalInput(row?.pickupVerifiedAt);
                            }

                            if (pickType === "CarDrop") {
                              return normalizeIsoForDateTimeLocalInput(form.techReachedDate2) || normalizeIsoForDateTimeLocalInput(row?.pickupVerifiedAt);
                            }

                            if (serviceType === "ServiceAtHome") {
                              return normalizeIsoForDateTimeLocalInput(form.pickupVerifiedAt) || normalizeIsoForDateTimeLocalInput(row?.pickupVerifiedAt);
                            }

                            return "";
                          })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const iso = v ? new Date(v).toISOString() : "";

                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;
                            if (pickType === "CarPick" || serviceType === "ServiceAtHome") {
                              setForm((p) => ({ ...p, pickupVerifiedAt: v || "" }));
                            } else if (pickType === "CarDrop") {
                              setForm((p) => ({ ...p, techReachedDate2: v || "" }));
                            }

                            setCarPickupDeliveryList((prev) =>
                              prev.map((it) =>
                                it?.carPickId === row?.carPickId
                                  ? { ...it, pickupVerifiedAt: iso || it?.pickupVerifiedAt }
                                  : it
                              )
                            );
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={(() => {
                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;
                            if (pickType === "CarPick" || serviceType === "ServiceAtHome") return normalizeIsoForDateTimeLocalInput(form.deliveryVerifiedAt);
                            if (pickType === "CarDrop") return normalizeIsoForDateTimeLocalInput(form.bookingCompleteDate);
                            return "";
                         })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const iso = v ? new Date(v).toISOString() : "";

                            const pickType = row?.pickType;
                            const serviceType = row?.serviceType;
                            if (pickType === "CarPick" || serviceType === "ServiceAtHome") {
                              setForm((p) => ({ ...p, deliveryVerifiedAt: v || "" }));
                            } else if (pickType === "CarDrop") {
                              setForm((p) => ({ ...p, customerDropDate: v || "" }));
                            }

                            setCarPickupDeliveryList((prev) =>
                              prev.map((it) =>
                                it?.carPickId === row?.carPickId
                                  ? { ...it, deliveryVerifiedAt: iso || it?.deliveryVerifiedAt }
                                  : it
                              )
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          <div className="col-lg-6 col-md-12">
            <label className="form-label">Supervisor assign date (bookingAssignments.assignedDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.employeeAssignDate)}
              onChange={(e) => setForm((p) => ({ ...p, employeeAssignDate: e.target.value }))}
            />
          </div>

          {/* <div className="col-lg-6 col-md-12">
            <label className="form-label">tracking history - createdDate (latest)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(form.trackingCreatedDate)}
              onChange={(e) => setForm((p) => ({ ...p, trackingCreatedDate: e.target.value }))}
            />
          </div> */}

          <div className="col-12">
            <h6 className="mb-3 mt-4">Tech - addOnsTracking</h6>

            <div className="row g-2 align-items-end">
              <div className="col-lg-4 col-md-6">
                <label className="form-label">createdDate (apply to all add-ons)</label>
                <input
                  className="form-control"
                  type="datetime-local"
                          value={normalizeIsoForDateTimeLocalInput(form.bookingAddOnCreatedDate)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddOnsTrackingList((prev) =>
                      Array.isArray(prev)
                        ? prev.map((it) => ({
                            ...it,
                            createdDate: v ? new Date(v).toISOString() : it?.createdDate,
                          }))
                        : prev
                    );
                  }}
                  disabled={!Array.isArray(addOnsTrackingList) || addOnsTrackingList.length === 0}
                />
              </div>

              <div className="col-lg-8 col-md-6">
                <div className="text-muted small">
                  {Array.isArray(addOnsTrackingList) && addOnsTrackingList.length
                    ? `Updating ${addOnsTrackingList.length} add-on record(s)`
                    : "No add-on tracking records found."}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">Tech - driverTracking</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th>pickDropId</th>
                    <th>pickType</th>
                    <th>serviceType</th>
                    <th>status</th>
                    <th>createdDate</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(driverTrackingList) && driverTrackingList.length
                    ? driverTrackingList
                    : []
                  ).map((row, idx) => (
                    <tr key={`${row?.id ?? ""}-${row?.createdDate ?? ""}-${idx}`}>
                      <td>{row?.pickDropId ?? ""}</td>
                      <td>{row?.pickType ?? ""}</td>
                      <td>{row?.serviceType ?? ""}</td>
                      <td>{row?.status ?? ""}</td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              type="datetime-local"
                              value={(() => {
                                const pickType = row?.pickType;
                                const status = String(row?.status ?? "").trim().toLowerCase();
                                const serviceType = String(row?.serviceType ?? "").trim();

                                // CarPick mappings
                                if (pickType === "CarPick") {
                                  if (status === "pickup_started") return normalizeIsoForDateTimeLocalInput(form.techStartedDate);
                                  if (status === "pickup_reached") return normalizeIsoForDateTimeLocalInput(form.techReachedDate);
                                  if (status === "car_picked") return normalizeIsoForDateTimeLocalInput(form.pickupVerifiedAt);
                                  if (status === "in_transit") return normalizeIsoForDateTimeLocalInput(form.dealerTransitDate);
                                  if (status === "drop_reached") return normalizeIsoForDateTimeLocalInput(form.techReachedDate);
                                  if (status === "completed") return normalizeIsoForDateTimeLocalInput(form.serviceCompleteDate);
                                }

                                // CarDrop mappings
                                if (pickType === "CarDrop") {
                                  if (status === "pickup_started") return normalizeIsoForDateTimeLocalInput(form.techStartedDate2);
                                  if (status === "pickup_reached") return normalizeIsoForDateTimeLocalInput(form.pickupDealerDate);
                                  if (status === "car_picked") return normalizeIsoForDateTimeLocalInput(form.customerTransitDate);
                                  if (status === "in_transit") return normalizeIsoForDateTimeLocalInput(form.customerTransitDate);
                                  if (status === "drop_reached") return normalizeIsoForDateTimeLocalInput(form.customerDropDate);
                                  if (status === "completed") return normalizeIsoForDateTimeLocalInput(form.bookingCompleteDate);
                                }

                                 if( serviceType === "ServiceAtHome") {
                                    if (status === "pickup_started") return normalizeIsoForDateTimeLocalInput(form.techStartedDate);
                                    if (status === "pickup_reached") return normalizeIsoForDateTimeLocalInput(form.techReachedDate);
                                    if (status === "servicestart") return normalizeIsoForDateTimeLocalInput(form.pickupVerifiedAt);
                                    if (status === "completed") return normalizeIsoForDateTimeLocalInput(form.serviceCompleteDate);
                                  }


                                return "";
                              })()}
                              onChange={(e) => {
                                const v = e.target.value;
                                const iso = v ? new Date(v).toISOString() : "";

                                // Write back into the same loadLead() fields so UI stays editable
                                // and Update API uses the updated values.
                                const pickType = row?.pickType;
                                const status = String(row?.status ?? "").trim().toLowerCase();
                                const serviceType = String(row?.serviceType ?? "").trim();

                                if (pickType === "CarPick") {
                                  if (status === "pickup_started") return setForm((p) => ({ ...p, techStartedDate: iso }));
                                  if (status === "pickup_reached") return setForm((p) => ({ ...p, techReachedDate: iso }));
                                  if (status === "car_picked") return setForm((p) => ({ ...p, pickupVerifiedAt: iso }));
                                  if (status === "in_transit") return setForm((p) => ({ ...p, dealerTransitDate: iso }));
                                  if (status === "drop_reached") return setForm((p) => ({ ...p, techReachedDate: iso }));
                                  if (status === "completed") return setForm((p) => ({ ...p, serviceCompleteDate: iso }));
                                }

                                if (pickType === "CarDrop") {
                                  if (status === "pickup_started") return setForm((p) => ({ ...p, techStartedDate2: iso }));
                                  if (status === "pickup_reached") return setForm((p) => ({ ...p, pickupDealerDate: iso }));
                                  if (status === "car_picked") return setForm((p) => ({ ...p, customerTransitDate: iso }));
                                  if (status === "in_transit") return setForm((p) => ({ ...p, customerTransitDate: iso }));
                                  if (status === "drop_reached") return setForm((p) => ({ ...p, customerDropDate: iso }));
                                  if (status === "completed") return setForm((p) => ({ ...p, bookingCompleteDate: iso }));
                                }

                                 if( serviceType === "ServiceAtHome") {
                                    if (status === "pickup_started") return normalizeIsoForDateTimeLocalInput(form.techStartedDate);
                                    if (status === "pickup_reached") return normalizeIsoForDateTimeLocalInput(form.techReachedDate);
                                    if (status === "servicestart") return normalizeIsoForDateTimeLocalInput(form.pickupVerifiedAt);
                                    if (status === "completed") return normalizeIsoForDateTimeLocalInput(form.serviceCompleteDate);
                                  }

                              }}
                            />
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12">
            <div className="text-muted small">
              Note: Mapping is based on the latest item by <b>createdDate</b> for:
              <ul className="mb-0">
                <li>trackingHistory → trackingCreatedDate</li>
                <li>bookingAddOns → bookingAddOnCreatedDate</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UpdateLeadBookingDatesLayer;

