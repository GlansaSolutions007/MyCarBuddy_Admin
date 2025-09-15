import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError";
import FormError from "./FormError";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeLayer = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employees`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployees(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}Roles`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setRoles(res.data);
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  };

  const handleDelete = async (employeeId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}Employees/${employeeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        Swal.fire(
          'Deleted!',
          'Employee has been deleted.',
          'success'
        );
        fetchEmployees();
      } catch (error) {
        Swal.fire(
          'Error!',
          'Failed to delete employee.',
          'error'
        );
      }
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
    },
    {
      name: "Profile Image",
      cell: (row) => (
        <div className="d-flex align-items-center">
          {row.ProfileImage ? (
            <img 
              src={row.ProfileImage} 
              alt="Profile" 
              className="rounded-circle me-3"
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          ) : (
            <div className="rounded-circle me-3 bg-secondary d-flex align-items-center justify-content-center text-white"
                 style={{ width: '40px', height: '40px' }}>
              <Icon icon="lucide:user" />
            </div>
          )}
        </div>
      ),
      width: "120px",
    },
    {
      name: "Full Name",
      selector: (row) => row.FullName,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
      sortable: true,
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber,
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => {
        const role = roles.find(r => r.RoleID === row.RoleID);
        return role ? role.RoleName : "N/A";
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
      width: "100px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Link 
            to={`/edit-employee/${row.EmployeeID}`}
            className='w-32-px h-32-px me-8 bg-primary-focus text-primary-main rounded-circle d-inline-flex align-items-center justify-content-center'
            title="Edit Employee"
          >
            <Icon icon='lucide:edit' />
          </Link>
          <button
            onClick={() => handleDelete(row.EmployeeID)}
            className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0'
            title="Delete Employee"
          >
            <Icon icon='lucide:trash-2' />
          </button>
        </div>
      ),
      width: "120px",
    },
  ];

  const filteredEmployees = employees.filter((employee) =>
    employee.FullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">Employee Management</h5>
            <Link to="/add-employee" className="btn btn-primary">
              <Icon icon="lucide:plus" className="me-2" />
              Add Employee
            </Link>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <Icon icon="lucide:search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employees..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DataTable
              title="Employees"
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
    </div>
  );
};

export default EmployeeLayer;
