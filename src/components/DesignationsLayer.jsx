import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";

const DesignationLayer = () => {
  const [formData, setFormData] = useState({
    id: "",
    designationName: "",
    departmentId: "",
    isHead: false,
    level: "",
    isActive: true,
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const { errors, validate } = useFormError();
  const API_BASE_DESIGNATIONS = `${import.meta.env.VITE_APIURL}Designations`;
  const API_BASE_DEPARTMENTS = `${import.meta.env.VITE_APIURL}Departments`;
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(API_BASE_DEPARTMENTS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      const formattedData = apiData.map((dept) => ({
        id: dept.id || dept.DeptId,
        departmentName: dept.departmentName || dept.DepartmentName,
        isActive: dept.isActive || dept.IsActive,
      }));
      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await axios.get(API_BASE_DESIGNATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      const formattedData = apiData.map((designation) => ({
        id: designation.id || designation.DesignationId,
        designationName: designation.designationName || designation.DesignationName,
        departmentId: designation.departmentId || designation.DepartmentId,
        departmentName: designation.departmentName || designation.DepartmentName,
        isHead: designation.isHead || designation.IsHead,
        level: designation.level || designation.Level,
        isActive: designation.isActive || designation.IsActive,
      }));
      setDesignations(formattedData);
    } catch (error) {
      console.error("Failed to load designations", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, ["id"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      let res;

      if (formData.id) {
        res = await axios.put(
          API_BASE_DESIGNATIONS,
          {
            designationId: formData.id,
            designationName: formData.designationName,
            departmentId: formData.departmentId,
            isHead: formData.isHead,
            level: formData.level,
            modifiedBy: username,
            isActive: formData.isActive,
          },
          { headers }
        );
      } else {
        res = await axios.post(
          API_BASE_DESIGNATIONS,
          {
            designationName: formData.designationName,
            departmentId: formData.departmentId,
            isHead: formData.isHead,
            level: formData.level,
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
            ? "Designation updated successfully"
            : "Designation added successfully",
          icon: "success",
        });
        setFormData({
          id: "",
          designationName: "",
          departmentId: "",
          isHead: false,
          level: "",
          isActive: true,
        });
        fetchDesignations();
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
        text:
          error.response?.data?.message ||
          "Failed to perform designation operation",
        icon: "error",
      });
      console.error("Operation failed", error);
    }
  };

  const handleEdit = (designation) => {
    setFormData({
      id: designation.id,
      designationName: designation.designationName,
      departmentId: designation.departmentId,
      isHead: designation.isHead,
      level: designation.level,
      isActive: designation.isActive,
    });
  };

  const columns = [
    { name: "S.No", selector: (_, i) => i + 1, width: "80px" },
    {
      name: "Designation Name",
      selector: (row) => row.designationName,
      sortable: true,
    },
    {
      name: "Department Name",
      selector: (row) => {
        const department = departments.find(
          (dept) => dept.id === row.departmentId
        );
        return department ? department.departmentName : "N/A";
      },
      sortable: true,
    },
    {
      name: "Is Head",
      cell: (row) => (
        <input type="checkbox" checked={row.isHead} readOnly disabled />
      ),
      sortable: true,
    },
    {
      name: "Level",
      selector: (row) => {
        const levelMap = {
          1: "Top",
          2: "HOD",
          3: "Mid",
          4: "Employee",
        };
        return levelMap[row.level] || row.level;
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) =>
        row.isActive ? (
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
            <form onSubmit={handleSubmit} noValidate>

              {/* Department Dropdown */}
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Department <span className="text-danger">*</span>
                </label>
                <select
                  name="departmentId"
                  className={`form-select ${errors.departmentId ? "is-invalid" : ""}`}
                  value={formData.departmentId}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                <FormError error={errors.departmentId} />
              </div>

              {/* Designation Name */}
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Designation Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="designationName"
                  className={`form-control ${errors.designationName ? "is-invalid" : ""}`}
                  placeholder="Enter designation name"
                  value={formData.designationName}
                  onChange={handleChange}
                />
                <FormError error={errors.designationName} />
              </div>

              {/* Is Head Checkbox */}
              <div className="flex items-center gap-2 my-3">
                <input
                  type="checkbox"
                  className="form-check-input cursor-pointer w-4 h-4 accent-primary"
                  id="isHeadCheckbox"
                  name="isHead"
                  checked={formData.isHead}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label text-sm fw-semibold text-primary-light flex items-center gap-1 cursor-pointer ms-4"
                  htmlFor="isHeadCheckbox"
                >
                  Is Head of Department
                </label>
              </div>

              {/* Level Dropdown */}
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Level <span className="text-danger">*</span>
                </label>
                <select
                  name="level"
                  className={`form-select ${errors.level ? "is-invalid" : ""}`}
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">Select Level</option>
                  <option value="1">1 - Top</option>
                  <option value="2">2 - HOD</option>
                  <option value="3">3 - Mid</option>
                  <option value="4">4 - Employee</option>
                </select>
                <FormError error={errors.level} />
              </div>

              {/* Status */}
              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Status
                </label>
                <select
                  name="isActive"
                  className="form-select form-control"
                  value={formData.isActive ? "true" : "false"}
                  onChange={handleChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                {formData.id ? "Update Designation" : "Add Designation"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-xxl-8 col-lg-8">
        <div className="chat-main card overflow-hidden">
          <DataTable
            columns={columns}
            data={designations}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No designations available"
          />
        </div>
      </div>
    </div>
  );
};

export default DesignationLayer;
