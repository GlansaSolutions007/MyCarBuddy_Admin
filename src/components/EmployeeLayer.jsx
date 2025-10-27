import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors

const EmployeeLayer = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ DeptId: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const { errors, validate, clearError } = useFormError();
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_APIURL;

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter((emp) =>
      emp.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.PhoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.RoleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.Id).includes(searchTerm)
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`);
      setEmployees(res.data || []);
      setFilteredEmployees(res.data || []);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const apiData = res.data?.data || [];
      const formattedData = apiData
        .filter((dept) => dept.isActive === true || dept.IsActive === true)
        .map((dept) => ({
          id: dept.id || dept.DeptId,
          departmentName: dept.departmentName || dept.DepartmentName,
        }));
      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  const handleCheckboxChange = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((empId) => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.Id));
    }
    setSelectAll(!selectAll);
  };

  const handleAssignClick = () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Employees Selected",
        text: "Please select at least one employee to assign.",
      });
      return;
    }
    setShowPopup(true);
  };

  const handleFormChange = (e) => {
    setFormData({ DeptId: e.target.value });
    clearError("DeptId");
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["DeptId"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const payload = {
        employeeIds: selectedEmployees,
        deptId: parseInt(formData.DeptId),
      };
      await axios.post(`${API_BASE}Employee/BulkAssign`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        icon: "success",
        title: "Assigned Successfully",
        text: "Employees assigned to department successfully.",
      });

      setShowPopup(false);
      setFormData({ DeptId: "" });
      setSelectedEmployees([]);
      setSelectAll(false);
      fetchEmployees();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.response?.data?.message || "Failed to assign department.",
      });
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setFormData({ DeptId: "" });
  };

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          className="form-check-input cursor-pointer"
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedEmployees.includes(row.Id)}
          onChange={() => handleCheckboxChange(row.Id)}
          className="form-check-input cursor-pointer"
        />
      ),
      width: "60px",
      center: true,
    },
    { name: "Employee ID", selector: (row) => row.Id, sortable: true },
    { name: "Full Name", selector: (row) => row.Name, sortable: true },
    { name: "Email", selector: (row) => row.Email, sortable: true },
    { name: "Phone Number", selector: (row) => row.PhoneNumber },
    { name: "Role Name", selector: (row) => row.RoleName },
    { name: "Department Name", selector: (row) => row.DepartmentName },
    {
      name: "Status",
      selector: (row) =>
        row.Status ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
    },
  ];

  return (
    <div className="row position-relative">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center flex-wrap gap-3">
              <form className="navbar-search">
                <input
                  type="text"
                  className="bg-base w-auto form-control"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleAssignClick}
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                Assign Department
              </button>
              <Link
                to="/add-employee"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                Add Employee
              </Link>
            </div>
          </div>

          <div className="card-body">
            <DataTable
              className="rounded-3"
              columns={columns}
              data={filteredEmployees}
              pagination
              responsive
              highlightOnHover
              pointerOnHover
              noDataComponent={
                <div className="text-center py-4">
                  <Icon icon="lucide:users" size={48} className="text-muted mb-3" />
                  <p className="text-muted">No employees found</p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {showPopup && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 backdrop-blur-sm"
            style={{ zIndex: 1040 }}
            onClick={handleCancel}
          />
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 shadow-lg"
            style={{
              zIndex: 1050,
              width: "460px",
              maxWidth: "90%",
              padding: "2rem",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
              <h5 className="fw-semibold mb-0 text-primary-600 d-flex align-items-center">
                <Icon icon="mdi:account-cog" className="me-2" />
                Assign Department
              </h5>
              <button className="btn-close" onClick={handleCancel}></button>
            </div>

            <form onSubmit={handleConfirmAssign}>
              <div className="mb-10">
                <label className="form-label fw-semibold text-secondary mb-2">
                  Select Department <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.DeptId ? "is-invalid" : ""}`}
                  value={formData.DeptId}
                  onChange={handleFormChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                <FormError error={errors.DeptId} />
              </div>

              <div className="alert alert-light border mt-3" role="alert">
                Assigning to <strong>{selectedEmployees.length}</strong> selected employee
                {selectedEmployees.length > 1 ? "s" : ""}.
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ padding: "0.25rem 1.5rem", fontSize: "0.875rem" }} // reduced height
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-600 d-flex align-items-center justify-content-center gap-2"
                  style={{ padding: "0.25rem 1.5rem", fontSize: "0.875rem" }}
                >
                  <Icon icon="mdi:check-circle-outline" className="text-base line-height-1" />
                  <span>Assign</span>
                </button>
              </div>

            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeLayer;
