import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";

const API_TEMPLATE = `${import.meta.env.VITE_APIURL}NotificationTemplate`;

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [formData, setFormData] = useState({
    TemplateID: "",
    TemplateName: "",
    TemplateType: "Message",
    Subject: "",
    Body: "",
    IsActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(API_TEMPLATE);
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["TemplateID"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      if (formData.TemplateID) {
        await axios.put(API_TEMPLATE, formData);
      } else {
        await axios.post(API_TEMPLATE, formData);
      }
      setFormData({
        TemplateID: "",
        TemplateName: "",
        TemplateType: "Message",
        Subject: "",
        Body: "",
        IsActive: true,
      });
      fetchTemplates();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleEdit = (row) => setFormData(row);

  const handleDelete = async (id, name) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Delete template "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (confirm.isConfirmed) {
      await axios.delete(`${API_TEMPLATE}/${id}`);
      fetchTemplates();
    }
  };

  const columns = [
    { name: "Name", selector: (row) => row.TemplateName, sortable: true },
    { name: "Type", selector: (row) => row.TemplateType, sortable: true, },
    { name: "Status", selector: (row) => row.IsActive ? "Active" : "Inactive", sortable: true, },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <button className="btn btn-sm btn-success me-1" onClick={() => handleEdit(row)}>
            <Icon icon="lucide:edit" />
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.TemplateID, row.TemplateName)}>
            <Icon icon="mingcute:delete-2-line" />
          </button>
        </>
      ),
    },
  ];

  return (
     <div className="row gy-4 mt-2">
        <div className="col-xxl-4 col-lg-4">
        <div className="card p-3">
         
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'>Name</label>
              <input
                name="TemplateName"
                value={formData.TemplateName}
                onChange={handleChange}
                className={`form-control ${errors.TemplateName ? "is-invalid" : ""}`}
              />
              <FormError error={errors.TemplateName} />
            </div>

            <div className="mb-2">
              <label htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'>Type</label>
              <select
                name="TemplateType"
                value={formData.TemplateType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Message">Message</option>
                <option value="Email">Email</option>
              </select>
            </div>

            {formData.TemplateType === "Email" && (
              <div className="mb-20">
                <label htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'>Subject</label>
                <input
                  name="Subject"
                  value={formData.Subject}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            )}

            <div className="mb-20">
              <label htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'>Body</label>
              <textarea
                name="Body"
                value={formData.Body}
                onChange={handleChange}
                className="form-control"
                rows={4}
              />
            </div>

            <div className="mb-20">
              <label htmlFor='format'
                className='text-sm fw-semibold text-primary-light mb-8'>Status</label>
              <select
                name="IsActive"
                value={formData.IsActive ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "true" })}
                className="form-select"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
              {formData.TemplateID ? "Update" : "Add"}
            </button>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="col-md-8">
       <div className="chat-main card overflow-hidden p-3">
          <DataTable
            columns={columns}
            data={templates}
            pagination
            highlightOnHover
            striped
          />
        </div>
      </div>
    </div>
  );
}
