import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import axios from "axios";
import { usePermissions } from "../context/PermissionContext";

const CompanyInformationLayer = () => {
  const { hasPermission } = usePermissions();
  const [infoList, setInfoList] = useState([]);
  const [formData, setFormData] = useState({
    Id: "",
    Type: "",
    Description: "",
    IsActive: true,
  });

  const { errors, validate, clearError } = useFormError();
  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE}CompanyInfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Accessing res.data.data based on your provided JSON structure
      if (res.data && res.data.status) {
        setInfoList(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate Type and Description
    const validationErrors = validate(formData, ["Id"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      if (formData.Id) {
        // UPDATE
        const payload = {
          ...formData,
          ModifiedBy: userId,
        };
        await axios.put(`${API_BASE}CompanyInfo/UpdateCompanyInfo`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // ADD
        const { Id, ...rest } = formData;
        const payload = {
          ...rest,
          CreatedBy: userId,
        };
        await axios.post(`${API_BASE}CompanyInfo/InsertCompanyInfo`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      Swal.fire({
        title: "Success",
        text: `Information ${formData.Id ? "updated" : "added"} successfully`,
        icon: "success",
      });

      fetchCompanyInfo();
      setFormData({ Id: "", Type: "", Description: "", IsActive: true });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    }
  };

  const handleEdit = (info) => {
    setFormData({
      Id: info.Id,
      Type: info.Type,
      Description: info.Description,
      IsActive: info.IsActive,
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This information will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}CompanyInfo/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire({
        title: "Deleted!",
        text: "Information deleted successfully.",
        icon: "success",
      });

      fetchCompanyInfo(); // reload list
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to delete information",
        icon: "error",
      });
    }
  };


  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "70px",
    },
    {
      name: "Type",
      selector: (row) => row.Type,
      sortable: true,
      width: "150px",
    },
    {
      name: "Description",
      selector: (row) => row.Description,
      sortable: true,
      wrap: true, // Allows text to wrap for long addresses
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";
        const color = row.IsActive ? "#28A745" : "#E34242";

        return (
          <span className="d-flex align-items-center" style={{ fontSize: "13px", fontWeight: 500 }}>
            <span
              className="rounded-circle d-inline-block me-1"
              style={{ width: "8px", height: "8px", backgroundColor: color }}
            ></span>
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
    },
    ...(hasPermission("company_info_edit") // Update permission key as per your system
      ? [
        {
          name: "Actions",
          width: "100px",
          cell: (row) => (
            <div className="d-flex">
              <button
                onClick={() => handleEdit(row)}
                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
              >
                <Icon icon="lucide:edit" />
              </button>

              {/* <button
                onClick={() => handleDelete(row.Id)}
                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
              >
                <Icon icon="mingcute:delete-2-line" />
              </button> */}
            </div>
          ),
        },
      ]
      : []),
  ];

  return (
    <div className="row gy-4 mt-2">
      {(hasPermission("company_info_add") || hasPermission("company_info_edit")) && (
        <div className="col-lg-4">
          <div className="card h-100 p-0">
            <div className="card-body p-24">
              <h6 className="mb-24">{formData.Id ? "Edit" : "Add"} Company Information</h6>
              <form onSubmit={handleSubmit} className="form" noValidate>
                {/* Information Type */}
                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Information Type <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="Type"
                    className={`form-control ${errors.Type ? "is-invalid" : ""}`}
                    placeholder="e.g. Address, Phone, Email"
                    value={formData.Type}
                    onChange={handleChange}
                  />
                  <FormError error={errors.Type} />
                </div>

                {/* Description */}
                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    name="Description"
                    className={`form-control ${errors.Description ? "is-invalid" : ""}`}
                    placeholder="Enter details..."
                    rows="4"
                    value={formData.Description}
                    onChange={handleChange}
                  ></textarea>
                  <FormError error={errors.Description} />
                </div>

                {/* Status */}
                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Status
                  </label>
                  <select
                    name="IsActive"
                    className="form-select form-control"
                    value={formData.IsActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, IsActive: e.target.value === "true" })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" type="submit">
                  {formData.Id ? "Update Information" : "Add Information"}
                </button>

                {formData.Id && (
                  <button
                    type="button"
                    className="btn btn-secondary radius-8 px-14 py-6 text-sm ms-2"
                    onClick={() => setFormData({ Id: "", Type: "", Description: "", IsActive: true })}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      <div className={hasPermission("company_info_add") || hasPermission("company_info_edit") ? "col-lg-8" : "col-lg-12"}>
        <div className="card overflow-hidden">
          <div className="card-body">
            <DataTable
              columns={columns}
              data={infoList}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No information found"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInformationLayer;