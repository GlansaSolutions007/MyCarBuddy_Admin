import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import { usePermissions } from "../context/PermissionContext";

const DepartmentsLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    id: "", // frontend internal id, mapped to API
    departmentName: "",
    isActive: true,
  });
  
  const [departments, setDepartments] = useState([]);
  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}Departments`;
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      const formattedData = apiData.map((dept) => ({
        id: dept.id || dept.DeptId, // normalize key
        departmentName: dept.departmentName || dept.DepartmentName,
        isActive: dept.isActive || dept.IsActive,
      }));
      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  // Add or update department
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, ["id"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      let res;
      if (formData.id) {
        // UPDATE department
        res = await axios.put(
          API_BASE,
          {
            deptId: formData.id,
            departmentName: formData.departmentName,
            modifiedBy: username,
            isActive: formData.isActive,
          },
          { headers }
        );
      } else {
        // CREATE department
        res = await axios.post(
          API_BASE,
          {
            departmentName: formData.departmentName,
            createdBy: username,
            isActive: formData.isActive,
          },
          { headers }
        );
      }

      if (res.data.status || res.status === 200) {
        Swal.fire({
          title: "Success",
          text: formData.id
            ? "Department updated successfully"
            : "Department added successfully",
          icon: "success",
        });
        setFormData({ id: "", departmentName: "", isActive: true });
        fetchDepartments();
      } else {
        Swal.fire({
          title: "Error",
          text: res.data.message || "Operation failed",
          icon: "error",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to perform department operation",
        icon: "error",
      });
      console.error("Operation failed", error);
    }
  };

  const handleEdit = (dept) => {
    setFormData({
      id: dept.id,
      departmentName: dept.departmentName,
      isActive: dept.isActive,
    });
  };

  const columns = [
    { name: "S.No", selector: (_, i) => i + 1, width: "80px" },
    { name: "Department Name", selector: (row) => row.departmentName, sortable: true },
    {
      name: "Status",
      selector: (row) =>
        row.isActive ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>,
    },
    ...(hasPermission("department_edit")
    ? [
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
      ]
    : []),
  ];

  return (
    <div className="row gy-4 mt-2">
      {hasPermission("department_add") && (
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Department Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="departmentName"
                  className={`form-control ${errors.departmentName ? "is-invalid" : ""}`}
                  placeholder="Enter department name"
                  value={formData.departmentName}
                  onChange={handleChange}
                />
                <FormError error={errors.departmentName} />
              </div>
              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8">Status</label>
                <select
                  name="isActive"
                  className="form-select form-control"
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                {formData.id ? "Update Department" : "Add Department"}
              </button>
            </form>
          </div>
        </div>
      </div>
      )}

      <div className="col-xxl-8 col-lg-8">
        <div className="chat-main card overflow-hidden">
          <DataTable
            columns={columns}
            data={departments}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No departments available"
          />
        </div>
      </div>
    </div>
  );
};

export default DepartmentsLayer;
