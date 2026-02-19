import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";

const API_REASON = `${import.meta.env.VITE_APIURL}AfterServiceLeads`;

export default function ReasonLayer() {
  const [reasons, setReasons] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ID: "",
    Reason: "",
    ReasonType: "",
    IsActive: true,
  });

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    try {
      const res = await axios.get(API_REASON);
      setReasons(res.data);
    } catch (err) {
      console.error("Failed to load reasons", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({
      ...prev,
      [name]: name === "IsActive" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["ID"]);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      if (formData.ID) {
        // Update existing reason
        await axios.put(API_REASON, formData);
      } else {
        // Remove ID for new record
        const { ID, ...payload } = formData;
        await axios.post(API_REASON, payload);
      }

      // Reset form

      Swal.fire("Success", `Reason ${formData.ID ? "updated" : "created"} successfully`, "success");
      setIsLoading(false);
      setFormData({ ID: "", Reason: "", IsActive: true });
      fetchReasons();
    } catch (err) {
      console.error("Save failed", err);
    }
  };
  const handleEdit = (row) => setFormData(row);

  const handleDelete = async (id, reason) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Delete reason "${reason}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (confirm.isConfirmed) {
      await axios.delete(`${API_REASON}/${id}`);
      fetchReasons();
    }
  };

  const columns = [
    { name: "Reason", selector: (row) => row.Reason, sortable: true, width: "220px", wrap:true },
    {
      name: "Created Date",
      selector: (row) =>
        new Date(row.CreatedDate).toLocaleDateString("en-GB"),
      sortable: true,
      width: "150px",
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        // Color mapping like sample code
        const colorMap = {
          Active: "#28A745",   // Green
          Inactive: "#E34242", // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            {/* Colored Dot */}
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            {/* Status Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      sortable: true,
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <button
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
            onClick={() => handleEdit(row)}
          >
            <Icon icon="lucide:edit" />
          </button>
          {/* <button
            className="btn btn-sm btn-danger"
            onClick={() => handleDelete(row.ID, row.Reason)}
          >
            <Icon icon="mingcute:delete-2-line" />
          </button> */}
        </>
      ),
    },
  ];

  return (
    <div className='row gy-4 mt-2'>
      {/* Form Section */}
      <div className='col-xxl-4 col-lg-4 '>
        <div className="card p-3">
          {/* <h5>{formData.ID ? "Edit Reason" : "Add Reason"}</h5> */}
          <form onSubmit={handleSubmit}>
            <div className="mb-20">
              <label
                htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'
              >Reason</label>
              <input
                name="Reason"
                value={formData.Reason}
                onChange={handleChange}
                className={`form-control ${errors.Reason ? "is-invalid" : ""}`}
              />
              <FormError error={errors.Reason} />
            </div>

            <div className="mb-20">
              <label
                htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'
              >Reason Type</label>
              <select
                name="ReasonType"
                value={formData.ReasonType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Cancel">Cancel</option>
                <option value="ServiceComplaint">Service Complaint</option>
                <option value="Refund">Refund</option>
                <option value="OverTime">OverTime</option>
                <option value="OverTime">Rating</option>
                {/* <option value="TicketReasons">TicketReasons</option> */}
                <option value="Booking">Booking</option>
                <option value="Payment">Payment</option>
                <option value="Service">Service</option>
                <option value="App">App</option>
                <option value="Other ">Other </option>
              </select>
              <FormError error={errors.ReasonType} />
            </div>

            <div className="mb-20">
              <label
                htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'
              >Status</label>
              <select
                name="IsActive"
                value={formData.IsActive ? "true" : "false"}
                onChange={handleChange}
                className="form-select"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" disabled={isLoading}>
              {isLoading ? "Saving..." : formData.ID ? "Update" : "Save"}
            </button>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className='col-xxl-8 col-lg-8'>
        <div className='chat-main card overflow-hidden'>
          <DataTable
            columns={columns}
            data={reasons}
            pagination
            highlightOnHover
            striped
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
}
