import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors
import { usePermissions } from "../context/PermissionContext";

const VehicleFuelLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    FuelTypeID: "",
    FuelTypeName: "",
    FuelImage1: null,
    IsActive: true,
  });
  const [fuelTypes, setFuelTypes] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const token = localStorage.getItem('token');
  const API_BASE = `${import.meta.env.VITE_APIURL}FuelTypes`;
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFuelTypes();
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({
        ...prev,
        FuelImage1: file,
      }));
    }
  };


  /**
   * Fetches the list of FuelTypes from the API.
   * Updates the FuelTypes with the fetched data.
   */
  const fetchFuelTypes = async () => {
    try {
      // Make a GET request to the FuelTypes endpoint
      const res = await axios.get(`${API_BASE}/GetFuelTypes`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // Update the FuelTypes with the fetched states data
      setFuelTypes(res.data.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load FuelTypes", error);
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

    // ✅ Show alert and stop if it's an insert and no logo file provided
    if (!formData.FuelTypeID && !formData.FuelImage1) {
      Swal.fire({
        icon: "warning",
        title: "Brand Logo Required",
        text: "Please upload a brand logo before submitting.",
      });
      return;
    }

    const requiredFields = ["FuelTypeID", "IsActive"];
    if (!formData.FuelTypeID && !formData.FuelImage1) {
      requiredFields.push("FuelImage");
    }

    const validationErrors = validate(formData, requiredFields);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          form.append(key, value);
        }
      });

      //status append
      form.append("Status", 1);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      let res;
      if (formData.FuelTypeID) {
        // Add ModifiedBy if needed
        form.append("ModifiedBy", localStorage.getItem("userId") || "1");
        res = await axios.put(`${API_BASE}/UpdateFuelType`, form, { headers });
      } else {
        form.append("CreatedBy", localStorage.getItem("userId") || "1");
        res = await axios.post(`${API_BASE}/InsertFuelType`, form, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire("Success", res.data.message, "success");
      } else {
        Swal.fire("Error", res.data.message || "Failed to save FuelType", "error");
      }

      setFormData({ FuelTypeID: "", FuelTypeName: "", FuelImage1: null, IsActive: true });
      setImagePreviewUrl("");
      fetchFuelTypes();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to save FuelType", "error");
      console.error("Submit failed", error);
    }
    finally {
      setIsSubmitting(false);
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
        Swal.fire('Deleted!', 'The FuelType has been deleted.', 'success');
        fetchStates();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire('Error!', 'Something went wrong.', 'error');
      }
    }
  };

  const handleEdit = (row) => {
    const cleanedImagePath = row.FuelImage?.startsWith("/")
      ? row.FuelImage.substring(1)
      : row.FuelImage;
    const encodedPath = encodeURI(cleanedImagePath);
    const fullImageUrl = `${import.meta.env.VITE_APIURL_IMAGE}${encodedPath}`;

    setFormData({
      FuelTypeID: row.FuelTypeID,
      FuelTypeName: row.FuelTypeName,
      FuelImage1: row.FuelImage,
      IsActive: row.IsActive,
    });

    setImagePreviewUrl(fullImageUrl);
    console.log("Preview URL set to:", fullImageUrl);
  };


  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Fuel Image",
      selector: (row) => <img src={`${import.meta.env.VITE_APIURL_IMAGE}${row.FuelImage?.startsWith("/")
        ? row.FuelImage.substring(1)
        : row.FuelImage}`} alt="Brand Logo" />,
        sortable: true,
    },
    {
      name: "Fuel Name",
      selector: (row) => row.FuelTypeName,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Actve" : "InActve";

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
      sortable: true,
      // width: "150px",
    },
    ...(hasPermission("vehiclefuel_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div>
          {hasPermission("vehiclefuel_edit") && (
          <Link
            onClick={() => handleEdit(row)}
            className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:edit' />
          </Link>
          )}
          {/* {hasPermission("vehiclefuel_delete") && (
          <Link
                  onClick={() => handleDelete(row.StateID , row.StateName)}
                  className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='mingcute:delete-2-line' />
          </Link>
          )} */}
        </div>
      ),
    },
      ]
    : []),
  ];

  return (
    <div className='row gy-4 mt-2'>
      { (hasPermission("vehiclefuel_add") || hasPermission("vehiclefuel_update")) && (
      <div className='col-xxl-4 col-lg-4 '>
        <div className='card h-100 p-0'>
          <div className='card-body p-24'>
            <form onSubmit={handleSubmit} className='form' noValidate>
              <div className='mb-24 mt-16 justify-content-center d-flex'>
                <div className='avatar-upload'>
                  <div className='avatar-edit position-absolute bottom-0 end-0 me-24 mt-16 z-1 cursor-pointer'>
                    <input
                      type='file'
                      id='imageUpload'
                      accept='.png, .jpg, .jpeg'
                      hidden
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor='imageUpload'
                      className='w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle'
                    >
                      <Icon
                        icon='solar:camera-outline'
                        className='icon'
                      ></Icon>
                    </label>
                  </div>
                  <div className='avatar-preview'>
                    <div
                      id='imagePreview'
                      style={{
                        backgroundImage: imagePreviewUrl
                          ? `url(${imagePreviewUrl})`
                          : "",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className='mb-10'>
                <label
                  htmlFor='format'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Fuel Type Name <span className='text-danger'>*</span>
                </label>
                <input
                  type="text"
                  name="FuelTypeName"
                  className={`form-control ${errors.FuelTypeName ? "is-invalid" : ""}`}
                  placeholder="Enter Fuel Type name"
                  value={formData.FuelTypeName}
                  onChange={handleChange}
                />
                <FormError error={errors.FuelTypeName} />
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
              <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : formData.FuelTypeID ? "Update Fuel" : "Add Fuel"}
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
            data={fuelTypes}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Fuel Type available"
            defaultSortField="FuelTypeID"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleFuelLayer;
