import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeLayer = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`);
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((empId) => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp.Id));
    }
    setSelectAll(!selectAll);
  };

  // Handle Assign button click
  const handleAssignClick = () => {
    setShowPopup(true);
  };

  // Handle Confirm Assign
  const handleConfirmAssign = () => {
    alert("Assigned successfully!");
    setShowPopup(false);
  };

  // Handle Cancel
  const handleCancel = () => {
    setShowPopup(false);
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
    {
      name: "Employee ID",
      selector: (row) => row.Id,
      sortable: true,
    },
    {
      name: "Full Name",
      selector: (row) => row.Name,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
      sortable: true,
    },
    {
      name: "Phone Number",
      selector: (row) => row.PhoneNumber,
    },
    {
      name: "Role Name",
      selector: (row) => row.RoleName,
    },
    {
      name: "Status",
      selector: (row) =>
        row.Status ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <Link
          to={`/edit-employee/${row.Id}`}
          className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
        >
          <Icon icon="lucide:edit" />
        </Link>
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
                <Icon
                  icon="ic:baseline-plus"
                  className="icon text-xl line-height-1"
                />
                Assign Department
              </button>
              <Link
                to="/add-employee"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                <Icon
                  icon="ic:baseline-plus"
                  className="icon text-xl line-height-1"
                />
                Add Employee
              </Link>
            </div>
          </div>

          <div className="card-body">
            <DataTable
              className="rounded-3"
              columns={columns}
              data={employees}
              pagination
              responsive
              highlightOnHover
              pointerOnHover
              noDataComponent={
                <div className="text-center py-4">
                  <Icon
                    icon="lucide:users"
                    size={48}
                    className="text-muted mb-3"
                  />
                  <p className="text-muted">No employees found</p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* === Blue Popup Modal === */}
      {showPopup && (
        <>
          {/* Overlay */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1040 }}
            onClick={handleCancel}
          ></div>

          {/* Centered Blue Box */}
          <div
            className="position-fixed top-50 start-50 translate-middle bg-primary text-white p-5 rounded-4 shadow-lg text-center"
            style={{ zIndex: 1050, width: "400px" }}
          >
            <h5 className="mb-4 fw-semibold">Assign Department</h5>
            <p className="mb-4 text-light">
              Are you sure you want to assign the selected employees?
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-light text-primary fw-semibold px-4 py-2"
                onClick={handleConfirmAssign}
              >
                Assign
              </button>
              <button
                className="btn btn-outline-light px-4 py-2"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeLayer;
