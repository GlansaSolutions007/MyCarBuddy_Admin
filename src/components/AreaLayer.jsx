import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors
import Select from "react-select";
import { usePermissions } from "../context/PermissionContext";
const createdBy = Number(localStorage.getItem("userId")) || 1;
const API_INSERT_AREA = `${import.meta.env.VITE_APIURL}Area/InsertArea`;
const API_UPDATE_AREA = `${import.meta.env.VITE_APIURL}Area/UpdateArea`;
const API_AREAS = `${import.meta.env.VITE_APIURL}Area/GetArea`;
const API_CITIES = `${import.meta.env.VITE_APIURL}City`;
const API_STATES = `${import.meta.env.VITE_APIURL}State`;

const AreaLayer = () => {
  const { hasPermission } = usePermissions();
  //   const [AreaName, setAreaName] = useState("");
  const [areas, setAreas] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [filterStateID, setFilterStateID] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCityID, setFilterCityID] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { errors, validate, clearError } = useFormError();
  const [apiError, setApiError] = useState("");

  const [formData, setFormData] = useState({
    CityID: "",
    AreaName: "",
    Pincode: "",
    IsActive: true,
    StateID: "",
  });

  useEffect(() => {
    // Fetch initial data for Areas cities and states
    fetchAreas();
    fetchCities();
    fetchStates();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchAreas = async () => {
    // Fetch Areas for the data table
    try {
      const res = await axios.get(API_AREAS);
      const mappedAreas = res.data.data.map((item) => ({
        AreaID: item.AreaId,
        AreaName: item.AreaName,
        StateID: item.StateId,
        StateName: item.StateName,
        CityID: item.CityId,
        CityName: item.CityName,
        Pincode: item.Pincode,
        IsActive: item.IsActive,
      }));

      setAreas(mappedAreas);
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };
  const fetchCities = async () => {
    // Fetch cities for the dropdown
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
    const validationErrors = validate(formData, [
      "StateID",
      "CityID",
      "AreaName",
      "Pincode",
    ]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      if (formData.AreaID) {
        // Update existing Area
        await axios.put(
          API_UPDATE_AREA,
          {
            areaId: Number(formData.AreaID), //
            areaName: formData.AreaName,
            stateId: Number(formData.StateID),
            cityId: Number(formData.CityID),
            pincode: formData.Pincode,
            isActive: formData.IsActive,
            modifiedBy: Number(localStorage.getItem("userId")),
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      } else {
        // Add new Area
        await axios.post(
          API_INSERT_AREA,
          {
            areaName: formData.AreaName,
            stateId: Number(formData.StateID),
            cityId: Number(formData.CityID),
            pincode: formData.Pincode,
            createdBy: Number(localStorage.getItem("userId")),
            isActive: formData.IsActive,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
      }

      Swal.fire(
        "Success",
        `Area ${formData.AreaID ? "updated" : "added"} successfully`,
        "success",
      );

      setFormData({
        AreaID: "",
        AreaName: "",
        CityID: "",
        CityName: "",
        Pincode: "",
        IsActive: true,
        StateID: "",
      });
      fetchAreas();
    } catch (error) {
      console.error("Add failed", error);
    }
  };
  //   const handleEdit = (state) => {
  //     setFormData(state);
  //   };
  const handleEdit = (row) => {
    setFormData({
      AreaID: row.AreaID,
      AreaName: row.AreaName,
      StateID: row.StateID,
      CityID: row.CityID,
      Pincode: row.Pincode,
      IsActive: row.IsActive,
    });
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: `delete ${name}`,
      customClass: {
        container: "delete-container", // for the wrapper
        popup: "my-swal-popup", // main dialog box
        confirmButton: "my-confirm-btn",
        cancelButton: "my-cancel-btn",
      },
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_APIURL}Area/DeleteArea`, {
          data: {
            areaId: id,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        Swal.fire("Deleted!", "The Area has been deleted.", "success");
        fetchAreas();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Area Name",
      selector: (row) => row.AreaName || "—",
      sortable: true,
      width: "150px",
    },
    {
      name: "City Name",
      selector: (row) => row.CityName,
      sortable: true,
      width: "150px",
    },
    {
      name: "State Name",
      selector: (row) => row.StateName || "—",
      sortable: true,
      width: "150px",
    },
    {
      name: "Pincode",
      selector: (row) => row.Pincode,
      sortable: true,
      width: "120px",
    },

    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Actve" : "InActve";

        const colorMap = {
          Actve: "#28A745", // Green
          InActve: "#E34242", // Red
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
    ...(hasPermission("area_edit")
      ? [
          {
            name: "Actions",
            cell: (row) => (
              <div>
                <Link
                  onClick={() => handleEdit(row)}
                  className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                >
                  <Icon icon="lucide:edit" />
                </Link>
                {/* <Link
                  onClick={() => handleDelete(row.AreaID, row.AreaName)}
                  className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                >
                  <Icon icon="mingcute:delete-2-line" />
                </Link> */}
              </div>
            ),
          },
        ]
      : []),
  ];

  const filteredAreas = areas.filter((area) => {
    const matchesState = filterStateID === "" || area.StateID == filterStateID;

    const matchesCity = filterCityID === "" || area.CityID == filterCityID;

    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "true" && area.IsActive) ||
      (filterStatus === "false" && !area.IsActive);

    const matchesSearch =
      searchTerm === "" ||
      area.AreaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.Pincode.toString().includes(searchTerm);

    return matchesState && matchesCity && matchesStatus && matchesSearch;
  });

  return (
    <div className="row gy-4 mt-2">
      {hasPermission("area_add") && (
        <div className="col-xxl-4 col-lg-4">
          <div className="card h-100 p-0">
            <div className="card-body p-24">
              <form onSubmit={handleSubmit} className="form" noValidate>
                <div className="mb-20">
                  <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                    Select State <span className="text-danger">*</span>
                  </label>
                  <Select
                    name="StateID"
                    options={states
                      .sort((a, b) =>
                        b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1,
                      )
                      .map((state) => ({
                        value: state.StateID,
                        label: (
                          <span>
                            {state.StateName}{" "}
                            <span
                              style={{
                                color: state.IsActive ? "green" : "red",
                              }}
                            >
                              ({state.IsActive ? "Active" : "Inactive"})
                            </span>
                          </span>
                        ),
                        name: state.StateName,
                        status: state.IsActive,
                      }))}
                    value={
                      states.find((s) => s.StateID === formData.StateID)
                        ? {
                            value: formData.StateID,
                            label: states.find(
                              (s) => s.StateID === formData.StateID,
                            )?.StateName,
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      setFormData({
                        ...formData,
                        StateID: selectedOption?.value || "",
                        CityID: "",
                      })
                    }
                    classNamePrefix="react-select"
                    className={errors.StateID ? "is-invalid" : ""}
                    placeholder="-- Select State --"
                  />
                  <FormError error={errors.StateID} />
                </div>

                <div className="mb-20">
                  <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                    Select City <span className="text-danger">*</span>
                  </label>
                  <Select
                    name="CityID"
                    options={cities
                      .filter((c) => c.StateID === formData.StateID)
                      .sort((a, b) =>
                        b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1,
                      )
                      .map((city) => ({
                        value: city.CityID,
                        label: (
                          <span>
                            {city.CityName}{" "}
                            <span
                              style={{ color: city.IsActive ? "green" : "red" }}
                            >
                              ({city.IsActive ? "Active" : "Inactive"})
                            </span>
                          </span>
                        ),
                      }))}
                    value={
                      cities.find((s) => s.CityID === formData.CityID)
                        ? {
                            value: formData.CityID,
                            label: cities.find(
                              (s) => s.CityID === formData.CityID,
                            )?.CityName,
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      setFormData({
                        ...formData,
                        CityID: selectedOption?.value || "",
                      })
                    }
                    classNamePrefix="react-select"
                    className={errors.CityID ? "is-invalid" : ""}
                    placeholder="-- Select City --"
                  />
                  <FormError error={errors.CityID} />
                </div>

                <div className="mb-20">
                  <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                    Area Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="AreaName"
                    // className="form-control"
                    className={`form-control ${errors.AreaName ? "is-invalid" : ""}`}
                    placeholder="Enter Area name"
                    value={formData.AreaName}
                    onChange={handleChange}
                  />
                  <FormError error={errors.AreaName} />
                </div>

                <div className="mb-20">
                  <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                    Pincode <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="Pincode"
                    // className="form-control"
                    className={`form-control ${errors.Pincode ? "is-invalid" : ""}`}
                    placeholder="Enter pincode"
                    value={formData.Pincode}
                    onChange={handleChange}
                  />
                  <FormError error={errors.Pincode} />
                </div>
                <div className="mb-20">
                  <label
                    htmlFor="format"
                    className="text-sm fw-semibold text-primary-light mb-8"
                  >
                    Status
                  </label>
                  <select
                    name="IsActive"
                    className="form-select form-control"
                    value={formData.IsActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        IsActive: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">InActive</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                >
                  {formData.AreaID ? "Update Area" : "Add Area"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="col-xxl-8 col-lg-8">
        <div className="card mb-3">
          <div className="row ">
            <div className="col-md-6 mb-2">
              <Select
                options={[
                  { value: "", label: "Select States" },
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
                          states.find((s) => s.StateID === filterStateID)
                            ?.StateName || "Selected State",
                      }
                    : { value: "", label: "Select State" }
                }
                onChange={(selectedOption) =>
                  setFilterStateID(selectedOption?.value || "")
                }
                className="basic-single"
                classNamePrefix="react-select"
                placeholder="Filter by State"
              />
            </div>
            <div className="col-md-6 mb-2">
              <Select
                options={[
                  { value: "", label: "Select City" },
                  ...cities.map((state) => ({
                    value: state.CityID,
                    label: state.CityName,
                  })),
                ]}
                value={
                  filterCityID
                    ? {
                        value: filterCityID,
                        label:
                          cities.find((s) => s.CityID === filterCityID)
                            ?.CityName || "Selected City",
                      }
                    : { value: "", label: "Select City" }
                }
                onChange={(selectedOption) =>
                  setFilterCityID(selectedOption?.value || "")
                }
                className="basic-single"
                classNamePrefix="react-select"
                placeholder="Filter by State"
              />
            </div>
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Area Name or Pincode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-2">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Select Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chat-main card overflow-hidden p-3">
          <DataTable
            columns={columns}
            data={filteredAreas}
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

export default AreaLayer;
