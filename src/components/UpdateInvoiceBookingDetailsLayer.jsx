import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const formatDateFromApi = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};


const UpdateInvoiceBookingDetailsLayer = () => {
  const token = localStorage.getItem("token");

  const [bookingId, setBookingId] = useState("");
  const [bookingIds, setBookingIds] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const [form, setForm] = useState({
    bookingTrackID: "",
    custFullName: "",
    custPhoneNumber: "",
    custEmail: "",
    fullAddress: "",
    bookingDate: "",
    timeSlot: "",
    invoiceNumber: "",
    invoiceCreatedDate: "",
    invoiceFile: null,
    invoiceFileName: "",
  });


  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const normalizeIsoForDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const normalizeIsoForDateTimeInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    // datetime-local expects: YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const toIsoFromDateInput = (value) => {
    if (!value) return "";
    // value is YYYY-MM-DD
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const toIsoFromDateTimeLocalInput = (value) => {
    if (!value) return "";
    // value is YYYY-MM-DDTHH:mm
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const loadBookingIds = async () => {
    // Attempt a few common list endpoints. If none work, keep dropdown empty.
    const candidateEndpoints = [
      `${API_BASE}Bookings`,
      `${API_BASE}Bookings/list`,
      `${API_BASE}Bookings/All`,
    ];

    setIsLoadingBookings(true);
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

          const ids = list
            .map((x) => x.BookingID ?? x.bookingID ?? x.Id ?? x.id)
            .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x) && x > 0);

          const unique = Array.from(new Set(ids));
          unique.sort((a, b) => b - a);

          if (unique.length > 0) {
            setBookingIds(unique.map(String));
            return;
          }
        } catch {
          // try next candidate
        }
      }

      setBookingIds([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchBookingData = async (id) => {
    if (!id) return;
    setIsFetching(true);
    try {
      const res = await axios.get(`${API_BASE}Bookings/BookingId?Id=${id}`, { headers });
      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      if (!data) {
        Swal.fire({ icon: "warning", title: "No data", text: "Booking not found." });
        return;
      }

      setForm({
        bookingTrackID: data.BookingTrackID ?? data.bookingTrackID ?? "",
        custFullName: data.CustFullName ?? data.custFullName ?? data.CustomerName ?? data.CustomerFullName ?? "",
        custPhoneNumber: data.CustPhoneNumber ?? data.custPhoneNumber ?? data.PhoneNumber ?? "",
        custEmail: data.CustEmail ?? data.custEmail ?? data.Email ?? data.CustEmailAddress ?? "",
        fullAddress: data.FullAddress ?? data.fullAddress ?? data.Address ?? "",
        bookingDate: normalizeIsoForDateInput(data.BookingDate ?? data.bookingDate),
        timeSlot: data.TimeSlot ?? data.timeSlot ?? "",
        invoiceNumber: data.InvoiceNumber ?? data.invoiceNumber ?? "",
        invoiceCreatedDate: normalizeIsoForDateTimeInput(data.InvoiceCreatedDate ?? data.invoiceCreatedDate),
      });
    } catch (e) {
      console.error("fetchBookingData error", e);
      Swal.fire({ icon: "error", title: "Failed", text: e?.response?.data?.message || "Failed to load booking." });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadBookingIds();
  }, []);

  useEffect(() => {
    if (bookingId) fetchBookingData(bookingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const validate = () => {
    const required = [
      { key: "bookingTrackID", label: "Booking Track ID", value: form.bookingTrackID },
      { key: "custFullName", label: "Customer Full Name", value: form.custFullName },
      { key: "custPhoneNumber", label: "Customer Phone Number", value: form.custPhoneNumber },
      { key: "fullAddress", label: "Full Address", value: form.fullAddress },

      { key: "bookingDate", label: "Booking Date", value: form.bookingDate },
      { key: "timeSlot", label: "Time Slot", value: form.timeSlot },
      // { key: "invoiceNumber", label: "Invoice Number", value: form.invoiceNumber },
      // { key: "invoiceCreatedDate", label: "Invoice Created Date", value: form.invoiceCreatedDate },
    ];

    const missing = required.filter((x) => !x.value || String(x.value).trim() === "");
    if (missing.length) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: `Please fill: ${missing.map((m) => m.label).join(", ")}`,
      });
      return false;
    }

    if (form.custEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.custEmail)) {
      Swal.fire({ icon: "warning", title: "Invalid email", text: "Please enter a valid customer email." });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!bookingId) {
      Swal.fire({ icon: "warning", title: "Select Booking", text: "Please select a booking ID." });
      return;
    }

    setIsSaving(true);
    try {
      // send as form-data (invoice file optional)
      const formData = new FormData();
      formData.append("bookingID", String(Number(bookingId)));
      formData.append("bookingTrackID", form.bookingTrackID);
      formData.append("custFullName", form.custFullName);
      formData.append("custPhoneNumber", form.custPhoneNumber);
      formData.append("custEmail", form.custEmail);
      formData.append("fullAddress", form.fullAddress);
      formData.append("bookingDate", toIsoFromDateInput(form.bookingDate));
      formData.append("timeSlot", form.timeSlot);
      formData.append("invoiceNumber", form.invoiceNumber);
      formData.append(
        "invoiceCreatedDate",
        toIsoFromDateTimeLocalInput(form.invoiceCreatedDate),
      );

      // invoice file (optional)
      if (form.invoiceFile) {
        formData.append("InvoiceFile", form.invoiceFile);
      }

      await axios.put(
        `${API_BASE}Bookings/UpdateInvoiceBookingsDetails`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        },
      );


      Swal.fire({ icon: "success", title: "Updated", text: "Invoice booking details updated successfully." });
    } catch (e) {
      console.error("save error", e);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e?.response?.data?.message || "Failed to update invoice booking details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h5 className="mb-0">Update Booking Invoice Details</h5>
          <button
            type="button"
            className="btn btn-primary-600 btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Icon icon="simple-line-icons:check" className="text-xl" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="card-body py-20">
        <div className="row g-3">
          <div className="col-lg-4 col-md-6">
            <label className="form-label">Booking ID</label>
            <select
              className="form-select"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              disabled={isLoadingBookings}
            >
              <option value="">{isLoadingBookings ? "Loading..." : bookingIds.length ? "Select Booking" : "(Dropdown unavailable)"}</option>
              {bookingIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            {!bookingIds.length && (
              <div className="text-muted small mt-1">
                Booking list endpoint not found. Use the next input to enter booking ID manually.
              </div>
            )}

            {!bookingIds.length && (
              <input
                className="form-control mt-2"
                placeholder="Enter booking ID"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            )}
          </div>

          <div className="col-12" />

          <div className="col-lg-6 col-md-12">
            <label className="form-label">bookingTrackID</label>
            <input
              className="form-control"
              value={form.bookingTrackID}
              onChange={(e) => setForm((p) => ({ ...p, bookingTrackID: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">custFullName</label>
            <input
              className="form-control"
              value={form.custFullName}
              onChange={(e) => setForm((p) => ({ ...p, custFullName: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">custPhoneNumber</label>
            <input
              className="form-control"
              value={form.custPhoneNumber}
              onChange={(e) => setForm((p) => ({ ...p, custPhoneNumber: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">custEmail</label>
            <input
              type="email"
              className="form-control"
              value={form.custEmail}
              onChange={(e) => setForm((p) => ({ ...p, custEmail: e.target.value }))}
            />
          </div>

          <div className="col-12">
            <label className="form-label">fullAddress</label>
            <input
              className="form-control"
              value={form.fullAddress}
              onChange={(e) => setForm((p) => ({ ...p, fullAddress: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">bookingDate</label>
            <input
              type="date"
              className="form-control"
              value={form.bookingDate}
              onChange={(e) => setForm((p) => ({ ...p, bookingDate: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">timeSlot</label>
            <input
              className="form-control"
              value={form.timeSlot}
              onChange={(e) => setForm((p) => ({ ...p, timeSlot: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">invoiceNumber</label>
            <input
              className="form-control"
              value={form.invoiceNumber}
              onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
            />
          </div>

          <div className="col-lg-6 col-md-12">
            <label className="form-label">invoiceCreatedDate</label>
            <input
              type="datetime-local"
              className="form-control"
              value={form.invoiceCreatedDate}
              onChange={(e) => setForm((p) => ({ ...p, invoiceCreatedDate: e.target.value }))}
            />
          </div>

          <div className="col-12">
            <label className="form-label">InvoiceFile (optional)</label>
            <input
              type="file"
              className="form-control"
              accept="application/pdf,image/*"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                setForm((p) => ({ ...p, invoiceFile: file, invoiceFileName: file ? file.name : "" }));
              }}
            />
            {form.invoiceFileName ? (
              <div className="text-muted small mt-1">Selected: {form.invoiceFileName}</div>
            ) : null}
          </div>


          <div className="col-12">
            <div className="d-flex align-items-center justify-content-end gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={isFetching}
                onClick={() => {
                  if (!bookingId) return;
                  fetchBookingData(bookingId);
                }}
              >
                {isFetching ? "Loading..." : "Refresh"}
              </button>
              <button type="button" className="btn btn-primary-600 btn-sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="text-muted small mt-2">
              Note: payload intentionally excludes <b>custId</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateInvoiceBookingDetailsLayer;

