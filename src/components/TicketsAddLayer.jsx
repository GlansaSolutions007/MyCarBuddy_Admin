import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import FormError from "../components/FormError";
import useFormError from "../hook/useFormError";

const API_BASE = import.meta.env.VITE_APIURL;

const TicketsAddLayer = ({ setPageTitle }) => {
  const { TicketID } = useParams();
  const isEditing = Boolean(TicketID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { errors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerList, setCustomerList] = useState([]);
  const [bookingList, setBookingList] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [reasonTypes, setReasonTypes] = useState([]);

  const [formData, setFormData] = useState({
    custID: "",
    bookingID: "",
    description: "",
    status: "",
    reasonID: "",
    reasonType: "",
  });

  // 🔹 Fetch reasons from AfterServiceLeads
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const res = await axios.get(`${API_BASE}AfterServiceLeads`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data)) {
          const formattedReasons = res.data.map((r) => ({
            value: r.ID,
            label: r.Reason,
            reasonType: r.ReasonType,
          }));

          // Extract unique ReasonTypes
          const uniqueTypes = [
            ...new Set(res.data.map((r) => r.ReasonType).filter(Boolean)),
          ].map((type) => ({
            value: type,
            label: type,
          }));

          setReasons(formattedReasons);
          setReasonTypes(uniqueTypes);
        } else {
          setReasons([]);
          setReasonTypes([]);
        }
      } catch (err) {
        console.error("Failed to load reasons", err);
        Swal.fire("Error", "Unable to load reasons", "error");
      }
    };

    fetchReasons();
  }, [token]);

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Fetch Customers
  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const res = await axios.get(`${API_BASE}customer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && Array.isArray(res.data.data)) {
          setCustomerList(res.data.data);
        } else {
          setCustomerList([]);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        Swal.fire("Error", "Unable to load customer list", "error");
      }
    };
    fetchAllCustomers();
  }, [token]);

  // 🔹 Fetch Bookings by Customer ID
  const fetchBookingsByCustomer = async (custID) => {
    if (!custID) {
      setBookingList([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        const filtered = res.data.filter(
          (booking) => booking.CustID === custID
        );
        setBookingList(filtered);
      } else {
        setBookingList([]);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      Swal.fire("Error", "Unable to load booking list", "error");
    }
  };

  // 🔹 Handle form submit (Add / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        custID: Number(formData.custID),
        bookingID: Number(formData.bookingID),
        description: formData.description,
        status: Number(formData.status),
        reasonId: Number(formData.reasonID),
        reasonType: formData.reasonType,
      };

      if (isEditing) {
        await axios.put(
          `${API_BASE}Tickets/UpdateTicket?TicketID=${TicketID}`,
          payload,
          { headers }
        );
        Swal.fire("Updated", "Ticket updated successfully", "success").then(
          () => navigate("/tickets")
        );
      } else {
        await axios.post(`${API_BASE}Tickets`, payload, { headers });
        Swal.fire("Success", "Ticket added successfully", "success").then(() =>
          navigate("/tickets")
        );
      }
    } catch (error) {
      console.error("Ticket save failed:", error);
      Swal.fire("Error", "Failed to save ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <form className="row g-3" onSubmit={handleSubmit}>
          {/* 🔹 Customer Name */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Customer Name <span className="text-danger-600">*</span>
            </label>
            <Select
              name="custID"
              options={customerList.map((customer) => ({
                value: customer.CustID,
                label: `${customer.FullName} (${customer.PhoneNumber})`,
              }))}
              placeholder="Search or select a customer..."
              value={
                formData.custID
                  ? {
                    value: formData.custID,
                    label:
                      customerList.find(
                        (c) => c.CustID === Number(formData.custID)
                      )?.FullName || "Selected",
                  }
                  : null
              }
              onChange={(selected) => {
                const selectedID = selected?.value || "";
                setFormData((prev) => ({
                  ...prev,
                  custID: selectedID,
                  bookingID: "",
                }));
                fetchBookingsByCustomer(selectedID);
              }}
              isSearchable
              classNamePrefix="react-select"
            />
            <FormError error={errors.CustomerName} />
          </div>

          {/* 🔹 Booking Track ID */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Booking Track ID <span className="text-danger-600">*</span>
            </label>
            <Select
              name="bookingID"
              options={bookingList.map((booking) => ({
                value: booking.BookingID,
                label: booking.BookingTrackID,
              }))}
              placeholder={
                bookingList.length
                  ? "Select Booking Track ID"
                  : "No bookings found"
              }
              value={
                formData.bookingID
                  ? {
                    value: formData.bookingID,
                    label:
                      bookingList.find(
                        (b) => b.BookingID === Number(formData.bookingID)
                      )?.BookingTrackID || "Selected",
                  }
                  : null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  bookingID: selected?.value || "",
                }))
              }
              isSearchable
              isDisabled={!bookingList.length}
              classNamePrefix="react-select"
            />
            <FormError error={errors.BookingTrackID} />
          </div>

          {/* 🔹 Reason Type Dropdown */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Reason Type <span className="text-danger-600">*</span>
            </label>
            <Select
              name="reasonType"
              options={reasonTypes}
              placeholder={
                reasonTypes.length
                  ? "Select a reason type"
                  : "No types available"
              }
              value={
                formData.reasonType
                  ? reasonTypes.find(
                    (t) => t.value === formData.reasonType
                  ) || null
                  : null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  reasonType: selected?.value || "",
                }))
              }
              isSearchable
              classNamePrefix="react-select"
            />
            <FormError error={errors.ReasonType} />
          </div>

          {/* 🔹 Reason Dropdown */}
          <div className="col-md-6 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Reason <span className="text-danger-600">*</span>
            </label>

            <Select
              name="reasonID"
              options={
                formData.reasonType
                  ? reasons.filter(
                    (r) =>
                      r.reasonType?.toLowerCase() ===
                      formData.reasonType.toLowerCase()
                  )
                  : reasons
              }
              placeholder={
                formData.reasonType
                  ? "Select a reason for this type"
                  : "Select a reason type first"
              }
              value={
                formData.reasonID
                  ? reasons.find((r) => r.value === formData.reasonID)
                  : null
              }
              onChange={(selected) =>
                setFormData((prev) => ({
                  ...prev,
                  reasonID: selected?.value || "",
                }))
              }
              isSearchable
              classNamePrefix="react-select"
              isDisabled={!formData.reasonType}
            />
            <FormError error={errors.Reason} />
          </div>


          {/* 🔹 Description */}
          <div className="col-12 mt-2">
            <label className="form-label text-sm fw-semibold text-primary-light mb-8">
              Description
            </label>
            <textarea
              name="description"
              className="form-control"
              placeholder="Enter description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
            <FormError error={errors.Description} />
          </div>

          {/* 🔹 Buttons */}
          <div className="d-flex justify-content-center gap-3 my-80">
            <Link
              to="/tickets"
              className="btn btn-secondary radius-8 px-14 py-6 text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : isEditing
                  ? "Update Ticket"
                  : "Save Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketsAddLayer;
