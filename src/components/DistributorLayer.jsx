import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import Select from 'react-select';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors

const API_BASE = import.meta.env.VITE_APIURL;

const DistributorLayer = () => {
  const [distributors, setDistributors] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearError , clearAllErrors } = useFormError();
  const [apiError, setApiError] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [formData, setFormData] = useState({
    DistributorID: "",
    FullName: "",
    GSTNumber: "",
    PhoneNumber: "",
    Email: "",
    PasswordHash: "",
    ConfirmPassword: "",
    StateID: "",
    CityID: "",
    Address: "",
    IsActive: true,
  });

  useEffect(() => {
    fetchDistributors();
    fetchStates();
    fetchCities();
  }, []);

  useEffect(() => {
  if (formData.StateID) {
    const citiesInState = cities.filter(c => c.StateID === formData.StateID);
    setFilteredCities(citiesInState);
  } else {
    setFilteredCities([]);
  }
}, [formData.StateID, cities]);

  /**
   * Fetch the list of distributors from the API.
   * Updates the state with the fetched data.
   */
  const fetchDistributors = async () => {
    try {
      // Make a GET request to the Distributors endpoint
      const res = await axios.get(`${API_BASE}Distributors`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } 
      });
      // Update the state with the fetched distributors data
      setDistributors(res.data);
    } catch (error) {
      // Log an error message if the request fails
      console.error("Failed to load dealers", error);
    }
  };
  
    /**
     * Fetch the list of states from the API.
     * Updates the state with the fetched data.
     */
    const fetchStates = async () => {
      try {
        // Make a GET request to the State endpoint
        const res = await axios.get(`${API_BASE}State`, {
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
     * Fetch the list of cities from the API.
     * Updates the state with the fetched data.
     */
    const fetchCities = async () => {
      try {
        // Make a GET request to the City endpoint
        const res = await axios.get(`${API_BASE}City`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
        // Update the state with the fetched cities data
        setCities(res.data);
      } catch (error) {
        // Log an error message if the request fails
        console.error("Failed to load cities", error);
      }
    };

  /**
   * Handles a change event for a form input.
   * Updates the formData state with the changed value.
   * @param {object} e - The event object.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update the formData state with the changed value
    // If the input is a checkbox, cast the value to a boolean
    setFormData((prev) => ({
      ...prev,
      [name]: name === "IsActive" ? value === "true" : value,
    }));
  };

  /**
   * Handles a submit event for the form.
   * Validates the form data using the validate function.
   * If the form data is valid, makes a PUT or POST request to the API
   * to create or update a distributor.
   * If the request is successful, fetches the list of distributors from the API.
   * If the request fails, logs an error message.
   */
  const handleSubmit = async () => {
    
    // Validate the form data
    const validationErrors = validate(formData, ["DistributorID" ,"IsActive" ]);

    // Check if password and confirm password match
    if (formData.PasswordHash !== formData.ConfirmPassword) {
      validationErrors.ConfirmPassword = "Passwords do not match";
    }
    
    if (Object.keys(validationErrors).length > 0) return; // If the form data is invalid, do nothing
    
    try {
      let res;
      // Make a PUT or POST request to the API
      if (formData.DistributorID) {
        res = await axios.put(`${API_BASE}Distributors`, formData , {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
      } else {
        const { DistributorID, ConfirmPassword, ...newFormData } = formData;
        res = await axios.post(`${API_BASE}Distributors`, newFormData ,{
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
      }
      console.log("Submit successful", res);

      //add swal confirmation
      Swal.fire({
        icon: "success",
        title: "Success",
        text: res.data.message || "Distributor saved successfully",
      });


      // Fetch the list of distributors from the API
      fetchDistributors();
      // Close the modal
      setShowModal(false);
      // Reset the form
      resetForm();
    } catch (err) {
      // Log an error message if the request fails
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response.data.message,  
      });
      console.error("Submit failed", err);
    }
  };

 const handleEdit = (data) => {
  setFormData({
    ...data,
    ConfirmPassword: data.PasswordHash || "", // ensure both are in sync
  });
  setShowModal(true);
};

  const resetForm = () => {
    setFormData({
      DistributorID: "",
      GSTNumber: "",
      FullName: "",
      PhoneNumber: "",
      Email: "",
      PasswordHash: "",
      StateID: "",
      CityID: "",
      Address: "",
      IsActive: true,
    });
    clearError('');
    setApiError("");
  };

  const columns = [
    // {
    //   name: "S.No",
    //   selector: (_, index) => index + 1,
    //   width: "80px",
    // },
    {
      name: "Distributor ID",
      selector: (row) => row.DistributorID,
    },
    {
      name: "Full Name",
      selector: (row) => row.FullName,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber,
    },
    {
      name: "State",
      selector: (row) => states.find((s) => s.StateID === row.StateID)?.StateName || "",
    },
    {
      name: "City",
      selector: (row) => cities.find((c) => c.CityID === row.CityID)?.CityName || "",
    },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
        <Link onClick={() => handleEdit(row)}
                        className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                        >
                            <Icon icon='lucide:edit' />
        </Link>
        </>
      ),
    },
  ];

  const filteredDistributors = distributors.filter((distributor) =>
    distributor.name?.toLowerCase().includes(searchText.toLowerCase())
  || distributor.email?.toLowerCase().includes(searchText.toLowerCase())
  || distributor.phoneNumber?.toLowerCase().includes(searchText.toLowerCase())
  || states.find((s) => s.StateID === distributor.StateID)?.StateName?.toLowerCase().includes(searchText.toLowerCase())
  || cities.find((c) => c.CityID === distributor.CityID)?.CityName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
         
        </div>

        <div className="chat-main card overflow-hidden p-3">
          <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
            <div className='d-flex align-items-center flex-wrap gap-3'>


              <form className='navbar-search'>
                <input
                  type='text'
                  className='bg-base  w-auto form-control '
                  name='search'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search'
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>

            </div>
            <Link
              onClick={() => { resetForm(); clearAllErrors();  setShowModal(true); }}
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
            >
              <Icon
                icon='ic:baseline-plus'
                className='icon text-xl line-height-1'
              />
              Add Distributor
            </Link>
          </div>
          <DataTable
            columns={columns}
            data={filteredDistributors}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No distributors available"
          />
        </div>
      </div>

      {/* Modal */}
            {showModal && (
            <div className="modal fade show d-block" style={{ background: "#00000080" }}>
                <div className="modal-dialog modal-lg"> {/* wider modal for two-column layout */}
                <div className="modal-content">
                    <div className="modal-header">
                    <h6 className="modal-title">
                        {formData.DistributorID ? "Edit" : "Add"} Distributor
                    </h6>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowModal(false)}
                    />
                    </div>

                    <div className="modal-body">
                    <div className="row mb-10">
                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Full Name <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="FullName"
                            className={`form-control ${errors.GSTNumber ? "is-invalid" : ""}`}
                            placeholder="Enter full name"
                            value={formData.FullName}
                            onChange={handleChange}
                        />
                        <FormError error={errors.FullName} />
                        </div>

                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            GST Number <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="GSTNumber"
                            className={`form-control ${errors.GSTNumber ? "is-invalid" : ""}`}
                            placeholder="Enter GST number"
                            value={formData.GSTNumber}
                            onChange={handleChange}
                        />
                        <FormError error={errors.GSTNumber} />
                        </div>
                    </div>

                    <div className="row mb-10">
                      <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Phone Number <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="PhoneNumber"
                            className={`form-control ${errors.GSTNumber ? "is-invalid" : ""}`}
                            placeholder="Enter phone number"
                            value={formData.PhoneNumber}
                            onChange={handleChange}
                        />
                        <FormError error={errors.PhoneNumber} />
                        </div>

                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Email <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="email"
                            name="Email"
                            className={`form-control ${errors.GSTNumber ? "is-invalid" : ""}`}
                            placeholder="Enter email"
                            value={formData.Email}
                            onChange={handleChange}
                        />
                        <FormError error={errors.Email} />
                        </div>
                        
                        
                    </div>

                    <div className="row mb-10">
                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                             Password <span className="text-danger-600">*</span>
                        </label>
                        <div className="position-relative mt-1">
                            <div className="icon-field">
                              <span className="icon top-50 translate-middle-y">
                                <Icon icon="solar:lock-password-outline" />
                              </span>
                              <input
                                type={showPassword ? "text" : "password"}
                                name="PasswordHash"
                                value={formData.PasswordHash}
                                onChange={handleChange}
                                className={`form-control  bg-neutral-50 radius-12`}
                                placeholder="Enter password"
                              />
                              {/* 👁️ Eye Icon */}
                              <span
                                className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-secondary-light"
                                onClick={() => setShowPassword((prev) => !prev)}
                              >
                                <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} />
                              </span>
                            </div>
                            <FormError error={errors.PasswordHash} />
                          </div>

                        </div>

                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Confirm Password <span className="text-danger-600">*</span>
                        </label>
                        <div className="position-relative mt-1">
                            <div className="icon-field">
                              <span className="icon top-50 translate-middle-y">
                                <Icon icon="solar:lock-password-outline" />
                              </span>
                              <input
                                type={showPassword ? "text" : "password"}
                                name="ConfirmPassword"
                                value={formData.ConfirmPassword}
                                onChange={handleChange}
                                className={`form-control  bg-neutral-50 radius-12 `}
                                placeholder="Enter password"
                              />
                              {/* 👁️ Eye Icon */}
                              <span
                                className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-secondary-light"
                                onClick={() => setShowPassword((prev) => !prev)}
                              >
                                <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} />
                              </span>
                            </div>
                            <FormError error={errors.ConfirmPassword} />
                          </div>

                        </div>
                    </div>

                    <div className="row mb-10">
                        <div className="col-6">
                          <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            State <span className="text-danger-600">*</span>
                          </label>
                          <Select
                              name="StateID"
                              options={states.sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1))
                                  .map((state) => ({
                                  value: state.StateID,
                                  label: (
                                    <span>
                                      {state.StateName}{" "}
                                      <span style={{ color: state.IsActive ? "green" : "red" }}>
                                        ({state.IsActive ? "Active" : "Inactive"})
                                      </span>
                                    </span>
                                  ),
                                  name: state.StateName,
                                  status: state.IsActive,
                                }))}
                              value={
                                formData.StateID
                                  ? {
                                      value: formData.StateID,
                                      label:
                                        states.find((s) => s.StateID === formData.StateID)?.StateName ||
                                        "Select State",
                                    }
                                  : null
                              }
                              onChange={(selectedOption) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  StateID: selectedOption?.value || "",
                                  CityID: "", // ⬅️ This clears the City when State changes
                                }))
                              }
                              classNamePrefix="react-select"
                              placeholder="Select State"
                            />

                          <FormError error={errors.StateID} />
                        </div>

                        <div className="col-6">
                          <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            City <span className="text-danger-600">*</span>
                          </label>
                          <Select
                            name="CityID"
                            options={filteredCities.map((c) => ({
                              value: c.CityID,
                              label: c.CityName,
                            }))}
                            value={
                              formData.CityID
                                ? {
                                    value: formData.CityID,
                                    label:
                                      cities.find((c) => c.CityID === formData.CityID)?.CityName ||
                                      "Select City",
                                  }
                                : null
                            }
                            onChange={(selectedOption) =>
                              handleChange({ target: { name: "CityID", value: selectedOption?.value || "" } })
                            }
                            classNamePrefix="react-select"
                            placeholder="Select City"
                          />
                          <FormError error={errors.CityID} />
                        </div>
                      </div>

                    <div className="row mb-10">
                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Address 
                        </label>
                        <input
                            type="text"
                            name="Address"
                            className="form-control"
                            placeholder="Enter address"
                            value={formData.Address}
                            onChange={handleChange}
                        />
                        </div>

                        <div className="col-6">
                        <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                            Status
                        </label>
                        <select
                            name="IsActive"
                            className="form-select form-control"
                            value={formData.IsActive ? "true" : "false"}
                            onChange={handleChange}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        </div>
                    </div>
                    </div>

                    <div className="modal-footer">
                    <button className="btn btn-secondary-600 radius-8 px-14 py-6 text-sm" onClick={() => setShowModal(false)}>
                        Cancel
                    </button>
                    <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={handleSubmit}>
                        {formData.DistributorID ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}


    </div>
  );
};

export default DistributorLayer;
