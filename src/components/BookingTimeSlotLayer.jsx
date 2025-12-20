import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import { usePermissions } from "../context/PermissionContext";

const BookingTimeSlotLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    TsID: "",
    StartTime: "",
    EndTime: "",
    Status: true,
  });

  const [timeSlots, setTimeSlots] = useState([]);
  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}TimeSlot`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${API_BASE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTimeSlots(
        response.data.map((slot) => ({
          ...slot,
          TsID: slot.TsID,
          StartTime: slot.startTime || slot.StartTime,
          EndTime: slot.endTime || slot.EndTime,
          Status: slot.status ?? slot.Status,
        }))
      );
    } catch (err) {
      console.error("Error fetching timeslots:", err);
      Swal.fire("Error", "Failed to fetch time slots", "error");
    }
  };

  //  Validation: Ensure 1-hour minimum and no overlapping
  const isTimeConflict = (newStart, newEnd, existingSlots, editingID = null) => {
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const newStartMin = toMinutes(newStart);
    const newEndMin = toMinutes(newEnd);

    // Check minimum 1 hour duration
    if (newEndMin - newStartMin < 60) {
      return { error: true, message: "Minimum slot duration should be 1 hour" };
    }

    // Check overlap with existing slots (skip same ID while editing)
    for (const slot of existingSlots) {
      if (editingID && String(slot.TsID) === String(editingID)) continue;

      const existingStart = toMinutes(slot.StartTime);
      const existingEnd = toMinutes(slot.EndTime);

      const isOverlap =
        (newStartMin >= existingStart && newStartMin < existingEnd) ||
        (newEndMin > existingStart && newEndMin <= existingEnd) ||
        (newStartMin <= existingStart && newEndMin >= existingEnd);

      if (isOverlap) {
        return {
          error: true,
          message: `Conflicts with existing slot ${slot.StartTime} to ${slot.EndTime}`,
        };
      }
    }

    return { error: false };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, [
      "TsID",
      "Status",
      "StartTime",
      "EndTime",
    ]);

    if (Object.keys(validationErrors).length > 0) return;

    const isEdit = !!formData.TsID;

    // Conflict check
    const conflictCheck = isTimeConflict(
      formData.StartTime,
      formData.EndTime,
      timeSlots,
      formData.TsID
    );

    if (conflictCheck.error) {
      Swal.fire("Error", conflictCheck.message, "warning");
      return;
    }

    const addSeconds = (timeStr) =>
      timeStr?.length === 5 ? timeStr + ":00" : timeStr;

    const payload = {
      startTime: addSeconds(formData.StartTime),
      endTime: addSeconds(formData.EndTime),
      status: formData.Status,
    };

    try {
      if (isEdit) {
        payload.TsID = formData.TsID;
        await axios.put(`${API_BASE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Updated", "Time slot updated successfully", "success");
      } else {
        await axios.post(`${API_BASE}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Created", "Time slot added successfully", "success");
      }

      setFormData({
        TsID: "",
        StartTime: "",
        EndTime: "",
        Status: true,
      });

      fetchTimeSlots();
    } catch (err) {
      console.error("POST/PUT Error:", err.response?.data || err.message);
      Swal.fire(
        "Error",
        err.response?.data?.title || "Failed to save time slot",
        "error"
      );
    }
  };

  const handleDelete = async (TsID) => {
    if (!TsID) {
      Swal.fire("Error", "Invalid TimeSlot ID", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete?",
      text: "Are you sure you want to delete this time slot?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/${TsID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Deleted!", "Time slot deleted", "success");
        fetchTimeSlots();
      } catch (err) {
        Swal.fire("Error", "Failed to delete time slot", "error");
      }
    }
  };

  const handleEdit = (slot) => {
    setFormData({
      TsID: slot.TsID,
      StartTime: slot.StartTime || "",
      EndTime: slot.EndTime || "",
      Status: slot.Status,
    });
  };

  const columns = [
    {
      name: "S.No",
      selector: (row) => row.TsID,
      width: "80px",
    },
    {
      name: "Start Time",
      selector: (row) => row.StartTime,
    },
    {
      name: "End Time",
      selector: (row) => row.EndTime,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.Status ? "Active" : "Inactive";

        // Color map (same structure as sample code)
        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            {/* Dot Indicator */}
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            {/* Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission("bookingtimeslot_edit") && (
          <Link
            onClick={() => handleEdit(row)}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
          )}
          {hasPermission("bookingtimeslot_delete") && (
          <Link
            onClick={() => handleDelete(row.TsID)}
            className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:trash" />
          </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            { (hasPermission("bookingtimeslot_add") || hasPermission("bookingtimeslot_edit")) && (
            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Start Time <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  name="StartTime"
                  className={`form-control ${errors.StartTime ? "is-invalid" : ""
                    }`}
                  value={formData.StartTime}
                  onChange={handleChange}
                />
                <FormError error={errors.StartTime} />
              </div>

              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  End Time <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  name="EndTime"
                  className={`form-control ${errors.EndTime ? "is-invalid" : ""
                    }`}
                  value={formData.EndTime}
                  onChange={handleChange}
                />
                <FormError error={errors.EndTime} />
              </div>

              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Status
                </label>
                <select
                  name="Status"
                  className="form-select"
                  value={formData.Status ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Status: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                {formData.TsID ? "Update Time Slot" : "Add Time Slot"}
              </button>
            </form>
            )}
          </div>
        </div>
      </div>

      <div className="col-xxl-8 col-lg-8">
        <div className="chat-main card overflow-hidden">
          <DataTable
            columns={columns}
            data={timeSlots}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No time slots available"
          />
        </div>
      </div>
    </div>
  );
};

export default BookingTimeSlotLayer;
