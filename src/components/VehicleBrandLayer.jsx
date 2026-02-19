import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors
import { usePermissions } from "../context/PermissionContext";

const VehicleBrandLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    BrandID: 0,
    BrandName: "",
    BrandLogoImage: null,
    IsActive: true,
    Status: 1
  });
  const [brand, setBrand] = useState([]);
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");
  const token = localStorage.getItem('token');
  const API_BASE = `${import.meta.env.VITE_APIURL}VehicleBrands`;
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBrand();
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
    }

    setFormData((prev) => ({
      ...prev,
      BrandLogoImage: file, // Corrected key
    }));
  };

  /**
   * Fetches the list of Brand from the API.
   * Updates the Brand with the fetched data.
   */
  const fetchBrand = async () => {
    try {
      // Make a GET request to the Brand endpoint
      const res = await axios.get(`${API_BASE}/GetVehicleBrands`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.data.status) {
        throw new Error(res.data.message);
      }

      // Update the Brand with the fetched Brand data
      setBrand(res.data.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load Brand", error);
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

    const requiredFields = ["BrandID", "IsActive"];


    // ✅ Show alert and stop if it's an insert and no logo file provided
    if (!formData.BrandID && !formData.BrandLogoImage) {
      Swal.fire({
        icon: "warning",
        title: "Brand Logo Required",
        text: "Please upload a brand logo before submitting.",
      });
      return;
    }

    // ✅ Only validate logo if it's an insert
    if (!formData.BrandID && !formData.BrandLogoImage) {
      requiredFields.push("BrandLogoImage");
    }

    const validationErrors = validate(formData, requiredFields);
    console.log(formData);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
      });

      form.append("Status", 1);
      if (formData.BrandID) {
        form.append("ModifiedBy", localStorage.getItem("userId"));
      } else {
        form.append("CreatedBy", localStorage.getItem("userId"));
      }


      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      setIsSubmitting(true);
      let res;
      if (formData.BrandID) {
        // Update
        res = await axios.put(`${API_BASE}/UpdateVehicleBrand`, form, { headers });
      } else {
        // Insert
        res = await axios.post(`${API_BASE}/InsertVehicleBrand`, form, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire("Success", res.data.message, "success");
      } else {
        Swal.fire("Error", res.data.message || "Failed to save brand", "error");
      }

      setFormData({
        BrandID: "",
        BrandName: "",
        BrandLogoImage: null,
        IsActive: true,
      });
      setImagePreviewUrl("");
      fetchBrand();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to save brand", "error");
      console.error("Submit failed", error);
    } finally {
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
        Swal.fire('Deleted!', 'The Brand has been deleted.', 'success');
        fetchStates();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire('Error!', 'Something went wrong.', 'error');
      }
    }
  };

  const handleEdit = (row) => {
    setFormData({
      BrandID: row.BrandID,
      BrandName: row.BrandName,
      IsActive: row.IsActive,
      BrandLogoImage: row.BrandLogo, // reset file input
    });
    console.log(formData);

    if (row.BrandLogo) {
      setImagePreviewUrl(`${import.meta.env.VITE_APIURL_IMAGE}${row.BrandLogo}`);
      console.log(imagePreviewUrl);
    } else {
      setImagePreviewUrl("");
    }
  };

  const columns = [
    {
      name: "Brand ID",
      selector: (row) => row.BrandID,
      sortable: true,
    },
    {
      name: "Brand Logo",
      selector: (row) => (
        <img
          src={`${import.meta.env.VITE_APIURL_IMAGE}${row.BrandLogo}`}
          alt="Brand Logo"
          style={{ width: 50, height: 50, objectFit: "contain" }}
        />
      ),
      sortable: true,
    },
    {
      name: "Brand Name",
      selector: (row) => row.BrandName,
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
    ...(hasPermission("vehiclebrand_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div>
          {hasPermission("vehiclebrand_edit") && (
          <Link
            onClick={() => handleEdit(row)}
            className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:edit' />
          </Link>
          )}
          {/* {hasPermission("vehiclebrand_delete") && (
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
     { (hasPermission("vehiclebrand_add") || hasPermission("vehiclebrand_update")) && (
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
                  Brand Name <span className='text-danger'>*</span>
                </label>
                <input
                  type="text"
                  name="BrandName"
                  className={`form-control ${errors.BrandName ? "is-invalid" : ""}`}
                  placeholder="Enter Brand Name"
                  value={formData.BrandName}
                  onChange={handleChange}
                />
                <FormError error={errors.BrandName} />
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
                {/* {formData.BrandID ? "Update Brand" : "Add Brand"} */}
                {isSubmitting ? "Saving..." : formData.BrandID ? "Update Brand" : "Add Brand"}
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
            data={brand}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Brand available"
            defaultSortField="BrandID"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleBrandLayer;
