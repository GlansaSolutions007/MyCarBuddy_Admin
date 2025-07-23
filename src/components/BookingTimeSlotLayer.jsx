import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";

const BookingTimeSlotLayer = () => {
  const [formData, setFormData] = useState({
    TimeSlotID: "",
    StartTime: "",
    EndTime: "",
    IsActive: true,
  });
  const [timeSlots, setTimeSlots] = useState([]);
  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}BookingTimeSlot`; // Replace with your actual endpoint

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchTimeSlots = async () => {
    // Replace this with actual API call
    setTimeSlots([
      { TimeSlotID: 1, StartTime: "10:00", EndTime: "12:00", IsActive: true },
      { TimeSlotID: 2, StartTime: "14:00", EndTime: "16:00", IsActive: false },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["StartTime", "EndTime"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      // Dummy handling — replace with actual POST/PUT
      const isEdit = !!formData.TimeSlotID;
      if (isEdit) {
        const updated = timeSlots.map((slot) =>
          slot.TimeSlotID === formData.TimeSlotID ? formData : slot
        );
        setTimeSlots(updated);
      } else {
        const newSlot = {
          ...formData,
          TimeSlotID: Math.floor(Math.random() * 1000 + 100), // Random ID for dummy
        };
        setTimeSlots([...timeSlots, newSlot]);
      }

      Swal.fire({
        title: "Success",
        text: `Time Slot ${isEdit ? "updated" : "added"} successfully`,
        icon: "success",
      });

      setFormData({ TimeSlotID: "", StartTime: "", EndTime: "", IsActive: true });
    } catch (error) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  const handleEdit = (slot) => {
    setFormData(slot);
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
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
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-danger">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <Link
          onClick={() => handleEdit(row)}
          className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
        >
          <Icon icon="lucide:edit" />
        </Link>
      ),
    },
  ];

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Start Time <span className="text-danger">*</span>
                </label>
                <input
                  type="time"
                  name="StartTime"
                  className={`form-control ${errors.StartTime ? "is-invalid" : ""}`}
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
                  className={`form-control ${errors.EndTime ? "is-invalid" : ""}`}
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
                  name="IsActive"
                  className="form-select"
                  value={formData.IsActive ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                {formData.TimeSlotID ? "Update Time Slot" : "Add Time Slot"}
              </button>
            </form>
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
