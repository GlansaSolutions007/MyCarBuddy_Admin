import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeLayer = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`);
      setEmployees(res.data);
    } catch (error) {
      console.error("Failed to load dealers", error);
    }
  };

  const columns = [
    {
      name: "Employee ID",
      selector: (row) => row.Id,
    },
    {
      name: "Full Name",
      selector: (row) => row.Name,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
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
        <>
          <Link
            to={`/edit-employee/${row.Id}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
        </>
      ),
    },
  ];

  return (
    <div className="row ">
      <div className="col-12">
        <div className="card ">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center flex-wrap gap-3">
              <form className="navbar-search">
                <input
                  type="text"
                  className="bg-base  w-auto form-control "
                  name="search"
                  // value={searchText}
                  // onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search"
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
            </div>
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
          <div className="card-body">
            <DataTable
              className="rounded-3 "
              // title="Employees"
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
    </div>
  );
};

export default EmployeeLayer;
