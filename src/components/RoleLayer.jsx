import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors

const RoleLayer = () => {
  const [formData, setFormData] = useState({
    RoleID: "",
    RoleName: "",
    // Description: "",
    IsActive: true,
  });
  const [roles, setRoles] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const API_BASE = `${import.meta.env.VITE_APIURL}Roles`;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRoles();
  }, []);

  /**
   * Handles a change event for a form input.
   * Updates the formData state with the changed value.
   * @param {object} e - The event object.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Fetches the list of roles from the API.
   * Updates the state with the fetched data.
   */
  const fetchRoles = async () => {
    try {
      // Make a GET request to the Role endpoint
      const res = await axios.get(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // Update the state with the fetched roles data
      setRoles(res.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load roles", error);
    }
  };

  /**
   * Handles a submit event for the form.
   * Validates the form data using the validate function.
   * If the form data is valid, makes a PUT or POST request to the API
   * to create or update a role.
   * If the request is successful, fetches the list of roles from the API.
   * If the request fails, logs an error message.
   * @param {object} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate(formData, ["RoleID", "IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      };

      if (formData.RoleID) {
        // Update existing role
        res = await axios.put(API_BASE, {
          name: formData.RoleName,
          IsActive: formData.IsActive,
          id: formData.RoleID,
        }, { headers });
      } else {
        // Add new role
        res = await axios.post(API_BASE, {
          name: formData.RoleName,
          IsActive: formData.IsActive,
        }, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire({
          title: 'Success',
          text: 'Role added successfully',
          icon: 'success',
          customClass: {
            container: 'my-swal-container', // for the wrapper
            popup: 'my-swal-popup',         // main dialog box
            confirmButton: 'my-confirm-btn',
            cancelButton: 'my-cancel-btn',
          }
        });
        // Show success message
      } else {
        Swal.fire({
          title: 'Error',
          text: res.data.message || 'Failed to add role',
          icon: 'error',
          customClass: {
            container: 'my-swal-container', // for the wrapper
            popup: 'my-swal-popup',         // main dialog box
            confirmButton: 'my-confirm-btn',
            cancelButton: 'my-cancel-btn',
          }
        });
      }

      // Reset the form data
      setFormData({ RoleID: "", RoleName: "", Description: "", IsActive: true });
      // Fetch the list of roles from the API
      fetchRoles();
    } catch (error) {
      // Log an error message if the request fails
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add role',
        icon: 'error',
        customClass: {
          container: 'my-swal-container', // for the wrapper
          popup: 'my-swal-popup',         // main dialog box
          confirmButton: 'my-confirm-btn',
          cancelButton: 'my-cancel-btn',
        }
      });
      console.error("Add failed", error);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `delete ${name}`,
      customClass: {
        container: 'delete-container', // for the wrapper
        popup: 'my-swal-popup',         // main dialog box
        confirmButton: 'my-confirm-btn',
        cancelButton: 'my-cancel-btn',
      }
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/`, { data: { RoleID: id } });
        Swal.fire('Deleted!', 'The role has been deleted.', 'success');
        fetchRoles();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire('Error!', 'Something went wrong.', 'error');
      }
    }
  };

  const handleEdit = (role) => {
    setFormData({
      RoleID: role.id,
      RoleName: role.name,
      IsActive: role.IsActive,
    });
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Role Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        // Color mapping like your sample code
        const colorMap = {
          Active: "#28A745",   // Green
          Inactive: "#E34242", // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            {/* Dot */}
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            {/* Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link
            onClick={() => handleEdit(row)}
            className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:edit' />
          </Link>
          {/* permission add*/}
          <Link
            to={`/role-permission/${row.id}`}
            className='w-32-px h-32-px me-8 bg-primary-focus text-primary-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:key' />
          </Link>
          {/* <Link
                  onClick={() => handleDelete(row.RoleID , row.RoleName)}
                  className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='mingcute:delete-2-line' />
            </Link> */}
        </div>
      ),
    },
  ];

  return (
    <div className='row gy-4 mt-2 rounded-3'>
      <div className='col-xxl-4 col-lg-4 '>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <form onSubmit={handleSubmit} className='form' noValidate>
              <div className='mb-10'>
                <label
                  htmlFor='roleName'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Role Name <span className='text-danger'>*</span>
                </label>
                <input
                  type="text"
                  name="RoleName"
                  className={`form-control ${errors.RoleName ? "is-invalid" : ""}`}
                  placeholder="Enter role name"
                  value={formData.RoleName}
                  onChange={handleChange}
                />
                <FormError error={errors.RoleName} />
              </div>

              <div className='mb-20'>
                <label
                  htmlFor='status'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Status
                </label>
                <select
                  name="IsActive"
                  className="form-select form-control"
                  value={formData.IsActive ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={handleSubmit}>
                {formData.RoleID ? "Update Role" : "Add Role"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className='col-xxl-8 col-lg-8'>
        <div className='chat-main card overflow-hidden'>
          <DataTable
            columns={columns}
            data={roles}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No roles available"
            defaultSortField="RoleID"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default RoleLayer;
