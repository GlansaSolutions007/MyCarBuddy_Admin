import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors

const PermissionLayer = () => {
    const [formData, setFormData] = useState({
      PermissionID: "",
      page: "",
      name: "",
      IsActive: true,
    });
  const [permissions, setPermissions] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const API_BASE = `${import.meta.env.VITE_APIURL}Permission`;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPermissions();
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
   * Fetches the list of permissions from the API.
   * Updates the state with the fetched data.
   */
  const fetchPermissions = async () => {
    try {
      // Make a GET request to the Permission endpoint
      const res = await axios.get(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // Update the state with the fetched permissions data
      setPermissions(res.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load permissions", error);
    }
  };

  /**
   * Handles a submit event for the form.
   * Validates the form data using the validate function.
   * If the form data is valid, makes a PUT or POST request to the API
   * to create or update a permission.
   * If the request is successful, fetches the list of permissions from the API.
   * If the request fails, logs an error message.
   * @param {object} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate(formData, ["PermissionID" ,"IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      };

      if (formData.PermissionID) {
        // Update existing permission
        res = await axios.put(API_BASE, {
          page: formData.page,
          name: formData.name,
          IsActive: formData.IsActive,
          id: formData.PermissionID,
        }, { headers });
      } else {
        // Add new permission
        res = await axios.post(API_BASE, {
          page: formData.page,
          name: formData.name,
          IsActive: formData.IsActive,
        }, { headers });
      }

        const data = res.data;
        if (data.status) {
          Swal.fire({
            title: 'Success',
            text: 'Permission added successfully',
            icon: 'success',
            customClass: {
              container: 'my-swal-container', // for the wrapper
              popup: 'my-swal-popup',         // main dialog box
              confirmButton: 'my-confirm-btn',
              cancelButton: 'my-cancel-btn',
            }
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: res.data.message || 'Failed to add permission',
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
      setFormData({ PermissionID: "", page: "", name: "", IsActive: true });
      // Fetch the list of permissions from the API
      fetchPermissions();
    } catch (error) {
      // Log an error message if the request fails
      Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Failed to add permission',
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

  const handleDelete = async (id , name) => {
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
      await axios.delete(`${API_BASE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      Swal.fire('Deleted!', 'The permission has been deleted.', 'success');
      fetchPermissions();
    } catch (error) {
      console.error("Delete failed", error);
      Swal.fire('Error!', 'Something went wrong.', 'error');
    }
  }
};

  const handleEdit = (permission) => {
    setFormData({
      PermissionID: permission.id,
      page: permission.page,
      name: permission.name,
      IsActive: permission.IsActive,
    });
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
    },
    {
      name: "Page",
      selector: (row) => row.page,
      sortable: true,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.IsActive ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>,
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
            <Link
                  onClick={() => handleDelete(row.id , row.name)}
                  className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='mingcute:delete-2-line' />
            </Link>
        </div>
      ),
    },
  ];

  return (
    <div className='row gy-4 mt-2'>
      <div className='col-xxl-4 col-lg-4 '>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <form onSubmit={handleSubmit} className='form' noValidate>
              <div className='mb-10'>
                <label
                  htmlFor='page'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Page <span className='text-danger'>*</span>
                </label>
                <input
                      type="text"
                      name="page"
                      className={`form-control ${errors.page ? "is-invalid" : ""}`}
                      placeholder="Enter page"
                      value={formData.page}
                      onChange={handleChange}
                      />
                <FormError error={errors.page} />
              </div>

              <div className='mb-10'>
                <label
                  htmlFor='name'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Name <span className='text-danger'>*</span>
                </label>
                <input
                      type="text"
                      name="name"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="Enter name"
                      value={formData.name}
                      onChange={handleChange}
                      />
                <FormError error={errors.name} />
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
              <button  type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={handleSubmit}>
                  {formData.PermissionID ? "Update Permission" : "Add Permission"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className='col-xxl-8 col-lg-8'>
        <div className='chat-main card overflow-hidden'>
            <DataTable
                columns={columns}
                data={permissions}
                pagination
                highlightOnHover
                responsive
                striped
                persistTableHead
                noDataComponent="No permissions available"
            />
        </div>
      </div>
    </div>
  );
};

export default PermissionLayer;
