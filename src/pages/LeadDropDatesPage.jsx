import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const normalizeIsoForDateTimeLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toIsoFromDateTimeLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};

const getFirstLatest = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => {
    const da = a?.createdDate ? new Date(a.createdDate).getTime() : 0;
    const db = b?.createdDate ? new Date(b.createdDate).getTime() : 0;
    return db - da;
  });
  return sorted[0] || null;
};

const LeadDropDatesPage = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leads, setLeads] = useState([]); // [{leadId,label}]
  const [leadId, setLeadId] = useState("");

  // fetched lead details
  const [leadDetails, setLeadDetails] = useState(null);

  // date inputs requested
  const [dates, setDates] = useState({
    leadCreatedDate: "",
    leadAssignedHeadDate: "",
    headAssignDate: "",
    employeeAssignDate: "",

    trackingCreatedDates: [],

    bookingDate: "",
    bookingAddOns: [], // [{serviceName, createdDate, addOnID, serviceId}]

    dealerApprovalTracking: [], // [{id, createdDate}]
    bookingAssignments: [], // [{assignedDate, supervisorHeadId, assignmentId}]

    payments: [], // [{paymentID, paymentDate}]

    // car pickup/drop single list items
    carPickupDeliveryList: [], // [{carPickId, assignDate,pickupDate,deliveryDate,createdDate}]
  });

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
              const id = x?.leadId ?? x?.LeadId ?? x?.leadID ?? x?.Id ?? x?.id;
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
          // try next
        }
      }
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchLeadDetailsById = async (selectedLeadId) => {
    if (!selectedLeadId) return;
    setLoading(true);

    try {
      const url = `${API_BASE}Leads/GetLeadDetailsByLeadId/${encodeURIComponent(selectedLeadId)}`;
      const res = await axios.get(url, { headers });
      const payload = res.data?.data ? res.data.data : res.data;

      if (!payload) {
        Swal.fire({ icon: "warning", title: "No data", text: "Lead details not found." });
        setLeadDetails(null);
        return;
      }

      setLeadDetails(payload);

      const leadCreated = payload?.leadAssignments?.[0]?.headAssignDate
        ? payload?.leadAssignments?.[0]?.headAssignDate
        : payload?.bookingAssignments?.[0]?.assignedDate || "";

      const headAssign = payload?.leadAssignments?.[0]?.headAssignDate || "";
      const employeeAssign = payload?.leadAssignments?.[0]?.employeeAssignDate || "";

      const tracking = Array.isArray(payload?.trackingHistory) ? payload.trackingHistory : [];

      const bookingDate = payload?.booking?.bookingDate || "";

      const bookingAddOns = Array.isArray(payload?.bookingAddOns) ? payload.bookingAddOns : [];
      const bookingAddOnsMapped = bookingAddOns.map((x) => ({
        serviceName: x?.serviceName ?? "",
        createdDate: x?.createdDate ?? "",
        addOnID: x?.addOnID ?? 0,
        serviceId: x?.serviceId ?? 0,
      }));

      const dealerApprovalTracking = Array.isArray(payload?.dealerApprovalTracking)
        ? payload.dealerApprovalTracking
        : [];

      const bookingAssignments = Array.isArray(payload?.bookingAssignments) ? payload.bookingAssignments : [];

      const payments = Array.isArray(payload?.payments) ? payload.payments : [];

      const carPickupDeliveryListRaw = payload?.carPickupDelivery
        ? [payload.carPickupDelivery]
        : [];

      setDates({
        leadCreatedDate: payload?.leadAssignments?.[0]?.headAssignDate || payload?.booking?.bookingDate || "",
        leadAssignedHeadDate: payload?.leadAssignments?.[0]?.headAssignDate || "",
        headAssignDate: headAssign,
        employeeAssignDate: employeeAssign,

        trackingCreatedDates: tracking.map((t) => ({
          trackId: t?.trackId ?? 0,
          createdDate: t?.createdDate ?? "",
        })),

        bookingDate,
        bookingAddOns: bookingAddOnsMapped,

        dealerApprovalTracking: dealerApprovalTracking.map((d) => ({
          id: d?.id ?? 0,
          createdDate: d?.createdDate ?? "",
          trackId: d?.trackId ?? "",
        })),

        bookingAssignments: bookingAssignments.map((b) => ({
          assignmentId: b?.assignmentId ?? 0,
          supervisorHeadId: b?.supervisorHeadId ?? "",
          assignedDate: b?.assignedDate ?? "",
        })),

        payments: payments.map((p) => ({ paymentID: p?.paymentID ?? 0, paymentDate: p?.paymentDate ?? "" })),

        carPickupDeliveryList: carPickupDeliveryListRaw.map((x) => ({
          carPickId: x?.id ?? 0,
          assignDate: x?.assignDate ?? "",
          pickupDate: x?.pickupDate ?? x?.pickupTime ?? x?.pickupDate ?? x?.pickupVerifiedAt ?? "",
          deliveryDate: x?.deliveryDate ?? x?.deliveryTime ?? x?.deliveryDate ?? x?.deliveryVerifiedAt ?? "",
          createdDate: x?.createdDate ?? "",
          pickupDateRaw: x?.pickupDate ?? "",
          deliveryDateRaw: x?.deliveryDate ?? "",
        })),
      });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Failed", text: "Unable to load lead details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tryLoadLeads();
  }, []);

  useEffect(() => {
    if (leadId) fetchLeadDetailsById(leadId);
  }, [leadId]);

  const handleSubmit = async () => {
    if (!leadId) {
      Swal.fire({ icon: "warning", title: "Select Lead", text: "Please select a lead." });
      return;
    }
    setSaving(true);
    try {
      const bookingID = leadDetails?.booking?.bookingID ?? 0;

      const latestAddOn = leadDetails?.bookingAddOns?.[0] || null;
      const addOnID = latestAddOn?.addOnID ?? 0;

      const carPickId = dates.carPickupDeliveryList?.[0]?.carPickId ?? 0;

      const payload = {
        leadId: String(leadId),
        bookingID: Number(bookingID) || 0,
        addOnID: Number(addOnID) || 0,
        carPickId: Number(carPickId) || 0,

        paymentDate: dates.payments?.[0]?.paymentDate || "",
        bookingDate: dates.bookingDate || "",
        bookingAddOnCreatedDate: dates.bookingAddOns?.[0]?.createdDate || "",

        assignedDate: dates.bookingAssignments?.[0]?.assignedDate || "",
        headAssignDate: dates.headAssignDate || "",
        employeeAssignDate: dates.employeeAssignDate || "",

        trackingCreatedDate: dates.trackingCreatedDates?.[0]?.createdDate || "",

        pickupCreatedDate: dates.carPickupDeliveryList?.[0]?.assignDate || "",

        carPickupDeliveryList: (dates.carPickupDeliveryList || []).map((x) => ({
          carPickId: Number(x.carPickId) || 0,
          assignDate: toIsoFromDateTimeLocalInput(x.assignDate) || x.assignDate,
          pickupDate: toIsoFromDateTimeLocalInput(x.pickupDate) || x.pickupDate,
          deliveryDate: toIsoFromDateTimeLocalInput(x.deliveryDate) || x.deliveryDate,
          createdDate: toIsoFromDateTimeLocalInput(x.createdDate) || x.createdDate,
        })),

        trackingList: (dates.trackingCreatedDates || []).map((t) => ({
          trackId: Number(t.trackId) || 0,
          trackingCreatedDate: toIsoFromDateTimeLocalInput(t.createdDate) || t.createdDate,
        })),
      };

      await axios.post(`${API_BASE}Leads/UpdateLeadBookingDates`, payload, { headers });

      Swal.fire({ icon: "success", title: "Updated", text: "Lead booking dates updated." });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Update failed", text: e?.response?.data?.message || "Request failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h5 className="mb-0">Lead Drop Dates Update</h5>
          <button
            type="button"
            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Icon icon="simple-line-icons:check" className="text-xl" />
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="card-body py-20">
        <div className="row g-3">
          <div className="col-lg-4 col-md-6">
            <label className="form-label">Leads</label>
            <select
              className="form-select"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              disabled={leadsLoading || loading}
            >
              <option value="">{leadsLoading ? "Loading..." : "Select Lead"}</option>
              {leads.map((x) => (
                <option key={x.leadId} value={x.leadId}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <h6 className="mb-3">Inputs</h6>
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">lead created date</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(dates.leadCreatedDate)}
              onChange={(e) => setDates((p) => ({ ...p, leadCreatedDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">lead assigned dates (headAssignDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(dates.headAssignDate)}
              onChange={(e) => setDates((p) => ({ ...p, headAssignDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-4 col-md-6">
            <label className="form-label">employeeAssignDate</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(dates.employeeAssignDate)}
              onChange={(e) => setDates((p) => ({ ...p, employeeAssignDate: e.target.value }))}
            />
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">trackingHistory createdDate</h6>
          </div>

          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>trackId</th>
                    <th>createdDate</th>
                  </tr>
                </thead>
                <tbody>
                  {(dates.trackingCreatedDates || []).map((t, idx) => (
                    <tr key={`${t.trackId}-${idx}`}>
                      <td>{t.trackId}</td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(t.createdDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              trackingCreatedDates: (p.trackingCreatedDates || []).map((it) =>
                                it.trackId === t.trackId ? { ...it, createdDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {!dates.trackingCreatedDates?.length ? (
                    <tr>
                      <td colSpan={2} className="text-muted">No tracking history found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">booking date & booking addons createdDate</h6>
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">booking date (bookingDate)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={normalizeIsoForDateTimeLocalInput(dates.bookingDate)}
              onChange={(e) => setDates((p) => ({ ...p, bookingDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">booking addons date</label>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th>serviceName</th>
                    <th>createdDate</th>
                  </tr>
                </thead>
                <tbody>
                  {(dates.bookingAddOns || []).map((x, idx) => (
                    <tr key={`${x.addOnID}-${idx}`}>
                      <td>{x.serviceName}</td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(x.createdDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              bookingAddOns: (p.bookingAddOns || []).map((it) =>
                                it.addOnID === x.addOnID ? { ...it, createdDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {!dates.bookingAddOns?.length ? (
                    <tr>
                      <td colSpan={2} className="text-muted">No booking add-ons found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">dealerApprovalTracking & bookingAssignments & payments</h6>
          </div>

          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th>dealerApprovalTracking createdDate</th>
                    <th>bookingAssignments assignedDate</th>
                    <th>payments paymentDate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div>
                        {(dates.dealerApprovalTracking || []).map((d) => (
                          <div key={d.id} className="mb-2">
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              value={normalizeIsoForDateTimeLocalInput(d.createdDate)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDates((p) => ({
                                  ...p,
                                  dealerApprovalTracking: (p.dealerApprovalTracking || []).map((it) =>
                                    it.id === d.id ? { ...it, createdDate: v } : it
                                  ),
                                }));
                              }}
                            />
                          </div>
                        ))}
                        {!dates.dealerApprovalTracking?.length ? (
                          <span className="text-muted">-</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div>
                        {(dates.bookingAssignments || []).map((b, idx) => (
                          <div key={`${b.assignmentId}-${idx}`} className="mb-2">
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              value={normalizeIsoForDateTimeLocalInput(b.assignedDate)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDates((p) => ({
                                  ...p,
                                  bookingAssignments: (p.bookingAssignments || []).map((it) =>
                                    it.assignmentId === b.assignmentId ? { ...it, assignedDate: v } : it
                                  ),
                                }));
                              }}
                            />
                          </div>
                        ))}
                        {!dates.bookingAssignments?.length ? (
                          <span className="text-muted">-</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div>
                        {(dates.payments || []).map((pmt, idx) => (
                          <div key={`${pmt.paymentID}-${idx}`} className="mb-2">
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              value={normalizeIsoForDateTimeLocalInput(pmt.paymentDate)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDates((p) => ({
                                  ...p,
                                  payments: (p.payments || []).map((it) =>
                                    it.paymentID === pmt.paymentID ? { ...it, paymentDate: v } : it
                                  ),
                                }));
                              }}
                            />
                          </div>
                        ))}
                        {!dates.payments?.length ? (
                          <span className="text-muted">-</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12">
            <h6 className="mb-3 mt-4">carPickupDelivery createdDate / assignDate / pickup / delivery</h6>
          </div>

          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th>carPickId</th>
                    <th>assignDate</th>
                    <th>pickupDate</th>
                    <th>deliveryDate</th>
                    <th>createdDate</th>
                  </tr>
                </thead>
                <tbody>
                  {(dates.carPickupDeliveryList || []).map((x, idx) => (
                    <tr key={`${x.carPickId}-${idx}`}>
                      <td>{x.carPickId}</td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(x.assignDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              carPickupDeliveryList: (p.carPickupDeliveryList || []).map((it) =>
                                it.carPickId === x.carPickId ? { ...it, assignDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(x.pickupDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              carPickupDeliveryList: (p.carPickupDeliveryList || []).map((it) =>
                                it.carPickId === x.carPickId ? { ...it, pickupDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(x.deliveryDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              carPickupDeliveryList: (p.carPickupDeliveryList || []).map((it) =>
                                it.carPickId === x.carPickId ? { ...it, deliveryDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={normalizeIsoForDateTimeLocalInput(x.createdDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDates((p) => ({
                              ...p,
                              carPickupDeliveryList: (p.carPickupDeliveryList || []).map((it) =>
                                it.carPickId === x.carPickId ? { ...it, createdDate: v } : it
                              ),
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {!dates.carPickupDeliveryList?.length ? (
                    <tr>
                      <td colSpan={5} className="text-muted">No car pickup/drop records.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12">
            <div className="text-muted small">
              Loads <b>GetLeadDetailsByLeadId</b> after selecting a lead, then updates via <b>UpdateLeadBookingDates</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDropDatesPage;

