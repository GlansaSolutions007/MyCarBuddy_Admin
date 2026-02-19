import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors
import { usePermissions } from "../context/PermissionContext";

const StateLayer = () => {
  const { hasPermission } = usePermissions();
    const [formData, setFormData] = useState({
      StateID: "",
      StateName: "",
      IsActive: true,
    });
  const [states, setStates] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const API_BASE = `${import.meta.env.VITE_APIURL}State`;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStates();
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
   * Fetches the list of states from the API.
   * Updates the state with the fetched data.
   */
  const fetchStates = async () => {
    try {
      // Make a GET request to the State endpoint
      const res = await axios.get(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // Update the state with the fetched states data
      setStates(res.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load states", error);
    }
  };

  /**
   * Handles a submit event for the form.
   * Validates the form data using the validate function.
   * If the form data is valid, makes a PUT or POST request to the API
   * to create or update a state.
   * If the request is successful, fetches the list of states from the API.
   * If the request fails, logs an error message.
   * @param {object} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate(formData, ["StateID", "IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      let res;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      };

      if (formData.StateID) {
        // Update existing state
        res = await axios.put(API_BASE, {
          StateName: formData.StateName,
          IsActive: formData.IsActive,
          StateID: formData.StateID,
        }, { headers });
      } else {
        // Add new state
        res = await axios.post(API_BASE, {
          StateName: formData.StateName,
          IsActive: formData.IsActive,
        }, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire({
          title: 'Success',
          text: 'State added successfully',
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
          text: res.data.message || 'Failed to add state',
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
      setFormData({ StateID: "", StateName: "", IsActive: true });
      // Fetch the list of states from the API
      fetchStates();
    } catch (error) {
      // Log an error message if the request fails
      Swal.fire({
        title: 'Error',
        text: error.response.data.message || 'Failed to add state',
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
        await axios.delete(`${API_BASE}/`, { data: { StateID: id } });
        Swal.fire('Deleted!', 'The state has been deleted.', 'success');
        fetchStates();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire('Error!', 'Something went wrong.', 'error');
      }
    }
  };

  const handleEdit = (state) => {
    setFormData(state);
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "State Name",
      selector: (row) => row.StateName,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Actve" : "InActve";

        // Color mapping
        const colorMap = {
          Actve: "#28A745",     // Green
          InActve: "#E34242",   // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      // width: "150px",
    },
    ...(hasPermission("state_edit")
    ? [
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
          {/* <Link
                  onClick={() => handleDelete(row.StateID , row.StateName)}
                  className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='mingcute:delete-2-line' />
            </Link> */}
        </div>
      ),
    },
    ]
    : []),
  ];

  return (
    <div className='row gy-4 mt-2'>
      {hasPermission("state_add") && (
      <div className='col-xxl-4 col-lg-4 '>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <form onSubmit={handleSubmit} className='form' noValidate>
              <div className='mb-10'>
                <label
                  htmlFor='format'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  State Name <span className='text-danger'>*</span>
                </label>
                <input
                  type="text"
                  name="StateName"
                  className={`form-control ${errors.StateName ? "is-invalid" : ""}`}
                  placeholder="Enter state name"
                  value={formData.StateName}
                  onChange={handleChange}
                />
                <FormError error={errors.StateName} />
              </div>
              <div className='mb-20'>
                <label
                  htmlFor='format'
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
                  <option value="false">InActive</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                {formData.StateID ? "Update State" : "Add State"}
              </button>
            </form>
          </div>
        </div>
      </div>
      )}
      <div className='col-xxl-8 col-lg-8'>
        <div className='chat-main card overflow-hidden'>
          <DataTable
            columns={columns}
            data={states}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No states available"
            defaultSortField="StateID"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default StateLayer;
