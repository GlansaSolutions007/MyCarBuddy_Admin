import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import { usePermissions } from "../context/PermissionContext";

const DesignationLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    id: "",
    designationName: "",
    departmentId: "",
    isHead: false,
    level: "",
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const { errors, validate } = useFormError();

  const API_BASE_DESIGNATIONS = `${import.meta.env.VITE_APIURL}Designations`;
  const API_BASE_DEPARTMENTS = `${import.meta.env.VITE_APIURL}Departments`;
  const token = localStorage.getItem("token");

  // ------------------ Load Data ------------------
  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
  }, []);

  // ------------------ Handle Input ------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ------------------ Fetch Departments ------------------
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(API_BASE_DEPARTMENTS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      const formattedData = apiData.map((dept) => ({
        id: dept.id || dept.DeptId,
        departmentName: dept.departmentName || dept.DepartmentName,
      }));

      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  // ------------------ Fetch Designations ------------------
  const fetchDesignations = async () => {
    try {
      const res = await axios.get(API_BASE_DESIGNATIONS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      const formattedData = apiData.map((d) => ({
        id: d.Id,
        departmentId: d.DeptId,
        designationName: d.Designation_name,
        departmentName: d.DepartmentName,
        level: d.Level,
        isHead:
          d.Is_Head === 1 ||
          d.Is_Head === "1" ||
          d.is_Head === 1 ||
          d.is_Head === "1" ||
          d.IsHead === true ||
          d.isHead === true,
      }));

      setDesignations(formattedData);
    } catch (error) {
      console.error("Failed to load designations", error);
    }
  };

  // ------------------ Submit Form ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, ["id"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        deptId: parseInt(formData.departmentId),
        designation_name: formData.designationName,
        level: parseInt(formData.level),
        is_Head: formData.isHead ? 1 : 0,
      };

      let res;
      if (formData.id) {
        // Update
        res = await axios.put(
          API_BASE_DESIGNATIONS,
          { ...payload, id: parseInt(formData.id) },
          { headers }
        );
      } else {
        // Add
        res = await axios.post(API_BASE_DESIGNATIONS, payload, { headers });
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

  // ------------------ Edit Designation ------------------
  const handleEdit = (designation) => {
    setFormData({
      id: designation.id,
      designationName: designation.designationName,
      departmentId: designation.departmentId,
      isHead: designation.isHead,
      level: designation.level,
    });
  };

  // ------------------ Table Columns ------------------
  const columns = [
    { name: "S.No", selector: (_, i) => i + 1, width: "80px", sortable: true, },
    {
      name: "Designation",
      cell: (row) => (
        <div className="d-flex align-items-center gap-2">
          <input
            type="checkbox"
            checked={!!row.isHead}
            readOnly
            disabled
            className="form-check-input cursor-pointer"
          />
          <span>{row.designationName}</span>
        </div>
      ),
      sortable: true,
      width: "150px"
    },
    {
      name: "Department",
      selector: (row) => row.departmentName || "N/A",
      sortable: true,
      width: "150px"
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
      width: "150px"
    },
    ...(hasPermission("designation_edit")
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

  // ------------------ Render ------------------
  return (
    <div className="row gy-4 mt-2">
      {/* ---------- Form Section ---------- */}
      {hasPermission("designation_add") && (
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
                  className={`form-select ${
                    errors.departmentId ? "is-invalid" : ""
                  }`}
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
                  className={`form-control ${
                    errors.designationName ? "is-invalid" : ""
                  }`}
                  placeholder="Enter designation name"
                  value={formData.designationName}
                  onChange={handleChange}
                />
                <FormError error={errors.designationName} />
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
                  className="form-check-label text-sm fw-semibold text-primary-light cursor-pointer ms-4"
                  htmlFor="isHeadCheckbox"
                >
                  Is Head of Department
                </label>
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
      )}

      {/* ---------- Table Section ---------- */}
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
            defaultSortField="id"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DesignationLayer;
