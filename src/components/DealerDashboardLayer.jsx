import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

// Pending status check for addon
const isPendingDealerConfirm = (val) =>
  (val?.IsDealer_Confirm ?? val?.isDealer_Confirm)?.toString()?.trim() === "Pending";

// Match addon to current dealer (DealerID can be number or string)
const addonMatchesDealer = (addon, dealerId) => {
  const d = addon?.DealerID ?? addon?.dealerId;
  if (d == null || d === "") return false;
  return String(d) === String(dealerId) || Number(d) === Number(dealerId);
};

// Build flat list of pending addon rows: only BookingAddOns (and BookingsTempAddons) where DealerID matches and IsDealer_Confirm is Pending
const getPendingAddonRows = (bookings, dealerId) => {
  const rows = [];
  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    const addonSources = [
      ...(booking?.BookingAddOns || []).map((a) => ({ addon: a, source: "BookingAddOns" })),
      ...(booking?.BookingsTempAddons || []).map((a) => ({ addon: a, source: "BookingsTempAddons" })),
    ];
    addonSources.forEach(({ addon, source }, idx) => {
      if (!addonMatchesDealer(addon, dealerId)) return;
      if (!isPendingDealerConfirm(addon)) return;
      const addonId = addon?.AddOnID ?? addon?.AddOnId ?? addon?.Id ?? addon?.id ?? idx;
      rows.push({
        rowId: `${booking.BookingID}-${addonId}-${idx}`,
        booking,
        addon,
        source,
      });
    });
  });
  return rows;
};

// Single service name from addon
const getAddonServiceName = (addon) =>
  addon?.AddOnName ?? addon?.ServiceName ?? addon?.Name ?? "Service";

// Normalize includes for UpdateSupervisorBooking: comma-separated string of IDs
const getAddonIncludes = (addon) => {
  const raw = addon?.Includes ?? addon?.includes ?? addon?.IncludeIds ?? addon?.includeIds;
  if (raw == null || raw === "") return "";
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    const ids = raw.map((i) => (typeof i === "object" ? i?.IncludeID ?? i?.includeID ?? i?.id : i));
    return ids.filter((id) => id != null && id !== "").join(",");
  }
  return "";
};

// serviceId for API: Package → packageId; Service → serviceId/includeId
const getAddonServiceId = (addon) => {
  const st = (addon?.ServiceType ?? addon?.serviceType ?? "Service").toString();
  if (st === "Package") return Number(addon?.PackageId ?? addon?.packageId ?? addon?.ServiceId ?? addon?.serviceId ?? 0) || 0;
  return Number(addon?.ServiceId ?? addon?.serviceId ?? addon?.IncludeId ?? addon?.includeId ?? 0) || 0;
};

// Car details only (no customer name)
const getCarDetails = (b) => {
  const parts = [];
  if (b?.VehicleDetails?.[0]?.RegistrationNumber?.trim()) parts.push(b.VehicleDetails[0].RegistrationNumber.trim());
  // if (b?.VehicleDetails?.[0]?.BrandName?.trim()) parts.push(b.VehicleDetails[0].BrandName.trim());
  // if (b?.VehicleDetails?.[0]?.ModelName?.trim()) parts.push(b.VehicleDetails[0].ModelName.trim());
  // if (b?.VehicleDetails?.[0]?.FuelTypeName?.trim()) parts.push(b.VehicleDetails[0].FuelTypeName.trim());
  // if (b?.VehicleDetails?.[0]?.KmDriven?.trim()) parts.push(b.VehicleDetails[0].KmDriven.trim());
  // if (b?.VehicleDetails?.[0]?.YearOfPurchase?.trim()) parts.push(b.VehicleDetails[0].YearOfPurchase.trim());
  return parts.length ? parts.join(" · ") : "—";
};

const DealerDashboardLayer = () => {
 const [dashboardData, setDashboardData] = useState({
  totalServices: 0,
  acceptedBookings: 0,
  rejectedBookings: 0,
  ongoingBookings: 0,
  todaysVehiclesHandover: 0,
  totalAmount: 0,
  receivedPayment: 0,
  balancePayment: 0,
  comletedBookings: 0,
});
const [loading, setLoading] = useState(false);
const [pendingRows, setPendingRows] = useState([]);
const [pendingLoading, setPendingLoading] = useState(false);
const [actionRowId, setActionRowId] = useState(null);
const [actionStatus, setActionStatus] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceModalRow, setPriceModalRow] = useState(null);
  const [priceForm, setPriceForm] = useState({
    priceType: "Service price",
    amount: "",
    gstPercent: 18,
    gstAmount: "",
  });
  const [priceSubmitLoading, setPriceSubmitLoading] = useState(false);
  const [priceModalAddonEnriched, setPriceModalAddonEnriched] = useState(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  // Format currency
  const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

  // 🔹 API integration
  useEffect(() => {
  if (userId) {
    fetchDashboardData();
    fetchPendingBookings();
  }
}, [userId]);

  useEffect(() => {
    if (!showPriceModal || !priceModalRow?.booking?.BookingID) return;
    const addonId = priceModalRow.addon?.AddOnID ?? priceModalRow.addon?.AddOnId ?? priceModalRow.addon?.id;
    if (getAddonIncludes(priceModalRow.addon) !== "" && getAddonServiceId(priceModalRow.addon) !== 0) {
      return;
    }
    const fetchBookingForIncludes = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}Bookings/BookingId?Id=${priceModalRow.booking.BookingID}&dealerId=${userId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const booking = Array.isArray(res.data) ? res.data[0] : res.data;
        const addons = [
          ...(booking?.BookingAddOns || []),
          ...(booking?.BookingsTempAddons || []),
        ];
        const fullAddon = addons.find(
          (a) => (a?.AddOnID ?? a?.AddOnId ?? a?.id) == addonId
        );
        if (fullAddon) setPriceModalAddonEnriched({ ...priceModalRow.addon, ...fullAddon });
      } catch (e) {
        console.error("Fetch booking for includes:", e);
      }
    };
    fetchBookingForIncludes();
  }, [showPriceModal, priceModalRow?.booking?.BookingID, priceModalRow?.rowId]);

  const fetchDashboardData = async () => {

    try {
       setLoading(true);
      const res = await axios.get(
        `${API_BASE}Dealer/GetDealerDashboardSummary?DealerID=${userId}`,
      );
      const data = res.data;
      setDashboardData({
        totalServices: data.TotalServices,
        acceptedBookings: data.AcceptedBookings,
        rejectedBookings: data.RejectedBookings,
        ongoingBookings: data.OngoingBookings,
        todaysVehiclesHandover: data.TodaysVehiclesHandover,
        totalAmount: data.TotalPrice, // Total Amount
        receivedPayment: data.PaidAmount, // Received Payment
        balancePayment: data.BalanceAmount, // Balance Payment
        comletedBookings: data.CompletedBookings,
      });

    } 
    catch (error) {
      console.error("Dashboard API error:", error);
    } finally {
    setLoading(false);
  }
  };

  const fetchPendingBookings = async () => {
    if (!userId) return;
    try {
      setPendingLoading(true);
      const res = await axios.get(
        `${API_BASE}Bookings?type=Dealer&dealerid=${userId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const rows = getPendingAddonRows(list, userId);
      setPendingRows(rows);
    } catch (err) {
      console.error("Pending bookings fetch error:", err);
      setPendingRows([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const confirmAddon = async (row, status) => {
    setActionRowId(row.rowId);
    setActionStatus(status);
    const addon = row.addon;
    const addonId = addon?.AddOnID ?? addon?.AddOnId ?? addon?.Id ?? addon?.id;
    if (!addonId) {
      Swal.fire({ icon: "error", title: "Error", text: "Item ID not found." });
      setActionRowId(null);
      setActionStatus(null);
      return;
    }
    const type = row.source === "BookingAddOns" ? "AddOn" : "TempAddon";
    const dealerId = addon?.DealerID ?? addon?.dealerId ?? userId;
    try {
      const res = await axios.post(
        `${API_BASE}Dealer/DealerApproveBookingBulk`,
        {
          ids: String(addonId),
          type,
          status,
          dealerId: Number(dealerId) || dealerId,
          createdBy: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.status === 200 || res.status === 201 || res.data?.success !== false) {
        setPendingRows((prev) => prev.filter((r) => r.rowId !== row.rowId));
        if (status === "Approved") {
          setPriceForm({ priceType: "Service price", amount: "", gstPercent: 18, gstAmount: "" });
          setPriceModalAddonEnriched(null);
          setPriceModalRow(row);
          setShowPriceModal(true);
        } else {
          Swal.fire({
            icon: "success",
            title: "Rejected",
            text: "Service rejected.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } else {
        throw new Error(res.data?.message || "Request failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Request failed.";
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally {
      setActionRowId(null);
      setActionStatus(null);
    }
  };

  const handleAccept = (row) => () => confirmAddon(row, "Approved");
  const handleReject = (row) => () => confirmAddon(row, "Rejected");
  const rowBusy = (row) => actionRowId === row.rowId;
  const acceptBusy = (row) => rowBusy(row) && actionStatus === "Approved";
  const rejectBusy = (row) => rowBusy(row) && actionStatus === "Rejected";

  const updatePriceForm = (updates) => {
    setPriceForm((prev) => {
      const next = { ...prev, ...updates };
      if (updates.amount !== undefined || updates.gstPercent !== undefined) {
        const amt = Number(updates.amount ?? prev.amount) || 0;
        const pct = Number(updates.gstPercent ?? prev.gstPercent) || 18;
        next.gstAmount = amt > 0 ? (amt * pct / 100).toFixed(2) : "";
      }
      return next;
    });
  };

  const handlePriceSubmit = async () => {
    if (!priceModalRow) return;
    const amt = Number(priceForm.amount);
    if (isNaN(amt) || amt < 0) {
      Swal.fire({ icon: "warning", title: "Invalid Amount", text: "Please enter a valid amount." });
      return;
    }
    const row = priceModalRow;
    const addon = priceModalAddonEnriched || row.addon;
    const booking = row.booking;
    const addonId = addon?.AddOnID ?? addon?.AddOnId ?? addon?.Id ?? addon?.id;
    const isPartPrice = priceForm.priceType === "Part price";
    const basePrice = isPartPrice ? amt : 0;
    const labourCharges = isPartPrice ? 0 : amt;
    const partTotal = isPartPrice ? amt : 0;
    const gstPercent = Number(priceForm.gstPercent) || 18;
    const gstAmount = Number(priceForm.gstAmount) || 0;

    const payload = {
      id: addonId,
      bookingId: booking.BookingID,
      bookingTrackID: booking.BookingTrackID || "",
      leadId: booking.LeadId ?? booking.LeadID ?? "",
      serviceType: addon?.ServiceType ?? addon?.serviceType ?? "Service",
      serviceName: getAddonServiceName(addon),
      basePrice,
      quantity: 1,
      price: partTotal,
      gstPercent,
      gstAmount,
      description: addon?.Description ?? addon?.description ?? "",
      dealerID: addon?.DealerID ?? addon?.dealerId ?? userId,
      percentage: Number(addon?.percentage ?? addon?.Percentage) || 0,
      our_Earnings: 0,
      labourCharges,
      modifiedBy: parseInt(userId, 10) || 0,
      isActive: true,
      type: "Confirm",
      includes: getAddonIncludes(addon),
      serviceId: getAddonServiceId(addon),
      dealerType: "dealer",
    };

    setPriceSubmitLoading(true);
    try {
      await axios.put(
        `${API_BASE}Supervisor/UpdateSupervisorBooking`,
        payload,
        { headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      Swal.fire({ icon: "success", title: "Saved", text: "Price details saved successfully." });
      setShowPriceModal(false);
      setPriceModalRow(null);
      setPriceModalAddonEnriched(null);
      setPriceForm({ priceType: "Service price", amount: "", gstPercent: 18, gstAmount: "" });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "Failed to save.",
      });
    } finally {
      setPriceSubmitLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
             <div className="card radius-8 col-md-12 bg-none">
                <div className="card-body dashboard-first-section radius-8">
                  <div className="position-absolute">
                    <div className=" text-2xl font-semibold text-primary-foreground">
                      Welcome {localStorage.getItem("name")}!
                    </div>
                    {/* <div className="card col-md-6">
                      <div className=" py-2 px-3 ">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-primary-foreground/80">
                            Todays Pending
                          </div>
                          <div className="text-lg font-semibold text-primary-foreground">
                            {dashboardData.todaysVehiclesHandover}
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Character Image */}
                  <div className="position-relative text-end">
                    <img
                      alt="user"
                      loading="lazy"
                      width="80"
                      height="201"
                      decoding="async"
                      className="w-full h-full object-cover"
                      src="/assets/images/admin.webp"
                      style={{ color: "transparent" }}
                    />
                  </div>
                </div>
              </div>

            {/* Services to confirm — pending IsDealer_Confirm */}
            <div className="col-12 mt-4">
              <style>{`
                @keyframes dealer-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .dealer-pending-card { border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); }
                .dealer-pending-card .card-header-trend { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-bottom: 1px solid #dcfce7; color: #166534; }
                .dealer-table-trend { border-collapse: separate; border-spacing: 0; }
                .dealer-table-trend thead th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
                .dealer-table-trend tbody tr { background: #fff; transition: background 0.15s ease; }
                .dealer-table-trend tbody tr:hover { background: #f8fafc; }
                .dealer-table-trend tbody tr:nth-child(even) { background: #fafafa; }
                .dealer-table-trend tbody tr:nth-child(even):hover { background: #f1f5f9; }
                .dealer-table-trend tbody td { padding: 14px 16px; color: #334155; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; }
                .dealer-dot-pending { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; animation: dealer-blink 1.8s ease-in-out infinite; }
              `}</style>
              <div className="card dealer-pending-card border-0">
                <div className="card-header card-header-trend d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 px-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="dealer-dot-pending flex-shrink-0" />
                    <h6 className="mb-0 fw-bold">Services to confirm</h6>
                    {pendingRows.length > 0 && (
                      <span className="badge bg-success bg-opacity-25 text-success ms-2">{pendingRows.length}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={fetchPendingBookings}
                    disabled={pendingLoading}
                  >
                    <Icon icon="solar:refresh-bold" className="me-1" />
                    Refresh
                  </button>
                </div>
                <div className="card-body p-0 bg-white">
                  {pendingLoading ? (
                    <div className="text-center py-5 text-secondary">
                      <Icon icon="solar:loading-bold" className="fs-2" style={{ animation: "spin 1s linear infinite" }} />
                      <p className="mb-0 mt-2">Loading...</p>
                    </div>
                  ) : pendingRows.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <Icon icon="solar:check-circle-bold" className="fs-1 text-success" />
                      <p className="mb-0 mt-2">No pending confirmations</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table dealer-table-trend align-middle mb-0">
                        <thead>
                          <tr>
                            <th className="text-nowrap ps-4">Booking ID</th>
                            <th className="text-nowrap">Date</th>
                            <th className="text-nowrap">Service name</th>
                            <th className="text-nowrap">Car details</th>
                            <th className="text-nowrap text-end pe-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingRows.map((row) => (
                            <tr key={row.rowId}>
                              <td className="ps-4">
                                <Link
                                  to={`/dealer-booking-view/${row.booking.LeadId}`}
                                  className="text-primary text-decoration-none fw-semibold"
                                >
                                  {row.booking.BookingTrackID || row.booking.BookingID}
                                </Link>
                              </td>
                              <td>{formatDate(row.booking.BookingDate)}</td>
                              <td>{getAddonServiceName(row.addon)}</td>
                              <td>{getCarDetails(row.booking)}</td>
                              <td className="text-end pe-4">
                                <div className="d-flex gap-2 justify-content-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success"
                                    onClick={handleAccept(row)}
                                    disabled={rowBusy(row)}
                                  >
                                    {acceptBusy(row) ? (
                                      <Icon icon="solar:loading-bold" className="fs-6" style={{ animation: "spin 1s linear infinite" }} />
                                    ) : (
                                      <>
                                        <Icon icon="solar:check-circle-bold" className="me-1" />
                                        Accept
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleReject(row)}
                                    disabled={rowBusy(row)}
                                  >
                                    {rejectBusy(row) ? (
                                      <Icon icon="solar:loading-bold" className="fs-6" style={{ animation: "spin 1s linear infinite" }} />
                                    ) : (
                                      <>
                                        <Icon icon="solar:close-circle-bold" className="me-1" />
                                        Reject
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row row-cols-xxxl-4 row-cols-lg-3 row-cols-md-2 row-cols-1 gy-4 mt-2">
             
              {/* Total Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Services
                        </p>
                        <h6 className="mb-0">{dashboardData.totalServices}</h6>
                      </div>
                      <div className="w-50-px h-50-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:calendar-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accepted Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Accepted Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.acceptedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejected Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Rejected Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.rejectedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-danger-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:close-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Completed Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Completed Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.comletedBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ongoing Bookings */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-4 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Ongoing Services
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.ongoingBookings}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:clock-circle-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Vehicles to be Handed Over */}
              {/* <div className="col">
                <div className="card shadow-none border bg-gradient-start-5 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Vehicles to be Handed Over Today
                        </p>
                        <h6 className="mb-0">
                          {dashboardData.todaysVehiclesHandover}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                           icon="solar:car-bold"
                          className="text-dark text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Total Amount */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-1 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Total Amount
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.totalAmount)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:wallet-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Received Payment */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-2 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Received Payment
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.receivedPayment)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:card-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Payment */}
              <div className="col">
                <div className="card shadow-none border bg-gradient-start-3 h-100">
                  <div className="card-body p-20">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <p className="fw-medium text-primary-light mb-1">
                          Balance Payment
                        </p>
                        <h6 className="mb-0">
                          {formatCurrency(dashboardData.balancePayment)}
                        </h6>
                      </div>
                      <div className="w-50-px h-50-px bg-warning rounded-circle d-flex justify-content-center align-items-center">
                        <Icon
                          icon="solar:bill-list-bold"
                          className="text-white text-2xl mb-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price modal after approve */}
      {showPriceModal && priceModalRow && (
        <div
          className="modal d-block bg-black bg-opacity-50"
          tabIndex={-1}
          style={{ zIndex: 1050 }}
          onClick={() => {
            setShowPriceModal(false);
            setPriceModalRow(null);
            setPriceModalAddonEnriched(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add price details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPriceModal(false);
                    setPriceModalRow(null);
                    setPriceModalAddonEnriched(null);
                  }}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Service name</label>
                  <div className="form-control bg-light">{getAddonServiceName(priceModalRow.addon)}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Price type</label>
                  <select
                    className="form-select"
                    value={priceForm.priceType}
                    onChange={(e) => updatePriceForm({ priceType: e.target.value })}
                  >
                    <option value="Service price">Service price</option>
                    <option value="Part price">Part price</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={0.01}
                    placeholder="0"
                    value={priceForm.amount}
                    onChange={(e) => updatePriceForm({ amount: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">GST %</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    step={0.01}
                    value={priceForm.gstPercent}
                    onChange={(e) => updatePriceForm({ gstPercent: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">GST amount</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={0.01}
                    placeholder="Auto from Amount × GST %"
                    value={priceForm.gstAmount}
                    onChange={(e) => setPriceForm((p) => ({ ...p, gstAmount: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowPriceModal(false);
                    setPriceModalRow(null);
                    setPriceModalAddonEnriched(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handlePriceSubmit}
                  disabled={priceSubmitLoading}
                >
                  {priceSubmitLoading ? (
                    <Icon icon="solar:loading-bold" className="fs-6" style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DealerDashboardLayer;
