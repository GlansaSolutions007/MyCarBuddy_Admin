import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors
import Select from "react-select"; 

const API_CITIES = `${import.meta.env.VITE_APIURL}City`;
const API_STATES = `${import.meta.env.VITE_APIURL}State`;

const CityLayer = () => {
//   const [cityName, setCityName] = useState("");
    const [cities, setCities] = useState([]);
    const [states, setStates] = useState([]);
    const [filterStateID, setFilterStateID] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const { errors, validate, clearError } = useFormError();
    const [apiError, setApiError] = useState("");

   const [formData, setFormData] = useState({
        CityID: "",
        CityName: "",
        IsActive: true,
        StateID: "",
      });

  const API_BASE = `${import.meta.env.VITE_APIURL}State`;

  useEffect(() => {
    // Fetch initial data for cities and states
    fetchCities();
    fetchStates();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchCities = async () => {
    // Fetch cities for the data table
    try {
      const res = await axios.get(API_CITIES);
      setCities(res.data);
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };

  const fetchStates = async () => {
    // Fetch states for the dropdown
    try {
      const res = await axios.get(API_STATES);
      setStates(res.data);
    } catch (error) {
      console.error("Failed to load states", error);
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate(formData, ["CityID" ,"IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
        if (formData.CityID) {
          // Update existing state
         await axios.put(API_CITIES, {
                        CityName: formData.CityName,
                        IsActive: formData.IsActive,
                        StateID: formData.StateID,
                        CityID: formData.CityID,
                    }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } else {
          // Add new state
            await axios.post(API_CITIES, {
                        CityName: formData.CityName,
                        StateID: formData.StateID,
                        IsActive: formData.IsActive,
                    }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        }

      setFormData({ CityID: "", CityName: "", IsActive: true, StateID: "" });
      fetchCities();
    } catch (error) {
      console.error("Add failed", error);
    }
  };
  const handleEdit = (state) => {
    setFormData(state);
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
      await axios.delete(`${API_BASE}/`, { data: { StateID: id } });
      Swal.fire('Deleted!', 'The state has been deleted.', 'success');
      fetchStates();
    } catch (error) {
      console.error("Delete failed", error);
      Swal.fire('Error!', 'Something went wrong.', 'error');
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
      name: "State Name",
      selector: (row) => row.StateName || "—",
    },

    {
      name: "City Name",
      selector: (row) => row.CityName,
      sortable: true,
    },
    
    {
      name: "Status",
      selector: (row) => row.IsActive ? <span className="badge bg-success">Actve</span> : <span className="badge bg-danger">InActve</span>,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
            <Link onClick={() => handleEdit(row)}
                className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                    <Icon icon='lucide:edit' />
            </Link>
          {/* <Link
                            onClick={() => handleDelete(row.CityID , row.CityName)}
                            className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                          >
                            <Icon icon='mingcute:delete-2-line' />
                      </Link> */}
        </div>
      ),
    },
  ];

  const filteredCities = cities.filter((city) => {
    const matchesState = filterStateID === "" || city.StateID == filterStateID;
    const matchesStatus =
        filterStatus === "" ||
        (filterStatus === "true" && city.IsActive) ||
        (filterStatus === "false" && !city.IsActive);
    return matchesState && matchesStatus;
    });

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className='form' noValidate>
            <div className="mb-20">
              <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                Select State <span className='text-danger'>*</span>
              </label>
              {/* <select
                name="StateID"
                // className="form-select form-control"
                className={`form-select select2 form-control${errors.StateName ? "is-invalid" : ""}`}
                value={formData.StateID}
                onChange={handleChange}
              >
                <option value="">-- Select State --</option>
                {states.map((state) => (
                  <option key={state.StateID} value={state.StateID}>
                    {state.StateName}
                  </option>
                ))}
              </select> */}
              <Select
                      name="StateID"
                      options={states.map((state) => ({
                        value: state.StateID,
                        label: state.StateName,
                      }))}
                      value={states.find((s) => s.StateID === formData.StateID) ? {
                        value: formData.StateID,
                        label: states.find((s) => s.StateID === formData.StateID)?.StateName,
                      } : null}
                      onChange={(selectedOption) =>
                        setFormData({ ...formData, StateID: selectedOption?.value || "" })
                      }
                      classNamePrefix="react-select"
                      className={errors.StateID ? "is-invalid" : ""}
                      placeholder="-- Select State --"
                    />
              <FormError error={errors.StateID} />
            </div>
            <div className="mb-20">
              <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                City Name <span className='text-danger'>*</span>
              </label>
              <input
                type="text"
                name="CityName"
                // className="form-control"
                className={`form-control ${errors.CityName ? "is-invalid" : ""}`}
                placeholder="Enter city name"
                value={formData.CityName}
                onChange={handleChange}
              />
              <FormError error={errors.CityName} />
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
            
            <button  type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
              {formData.CityID ? "Update City" : "Add City"}
            </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-xxl-8 col-lg-8">
        <div className="card mb-3">
            <div className="row ">
                <div className="col-md-6 mb-2">
                    <Select
                        options={[
                          { value: "", label: "All States" },
                          ...states.map((state) => ({
                            value: state.StateID,
                            label: state.StateName,
                          })),
                        ]}
                        value={
                          filterStateID
                            ? {
                                value: filterStateID,
                                label:
                                  states.find((s) => s.StateID === filterStateID)?.StateName ||
                                  "Selected State",
                              }
                            : { value: "", label: "All States" }
                        }
                        onChange={(selectedOption) => setFilterStateID(selectedOption?.value || "")}
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Filter by State"
                      />
                </div>
                <div className="col-md-6 mb-2">
                    <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

        </div>
        <div className="chat-main card overflow-hidden p-3">
          <DataTable
            columns={columns}
            data={filteredCities}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No cities available"
          />
        </div>
      </div>
    </div>
  );
};

export default CityLayer;
