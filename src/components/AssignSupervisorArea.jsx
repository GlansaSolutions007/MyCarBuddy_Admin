import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import Select from "react-select";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;
const API_AREAS = `${API_BASE}Area/GetArea`;
const API_ASSIGN_AREAS = `${API_BASE}Area/AssignAreasToSupervisor`;
const API_GET_AREA_WISE_SUPERVISOR = `${API_BASE}Area/GetAreaWiseSupervisor`;
const token = localStorage.getItem("token");
const userId = Number(localStorage.getItem("userId")) || 0;

const AssignSupervisorArea = () => {
  const [areas, setAreas] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [areaWiseSupervisors, setAreaWiseSupervisors] = useState([]);
  const [filterAreaId, setFilterAreaId] = useState("");
  const [filterSupervisorId, setFilterSupervisorId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { errors, validate } = useFormError();

  useEffect(() => {
    fetchAreas();
    fetchSupervisors();
    fetchAreaWiseSupervisors();
  }, []);

  const fetchAreas = async () => {
    try {
      const res = await axios.get(API_AREAS);
      const mappedAreas = res.data.data.map((item) => ({
        value: item.AreaId,
        label: `${item.AreaName} (${item.CityName}, ${item.StateName})`,
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
      console.error("Failed to load areas", error);
      setAreas([]);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const employees = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const supervisorList = employees
        .filter((emp) => {
          const department = emp.DepartmentName?.trim().toLowerCase();
          const role = emp.RoleName?.trim().toLowerCase();
          return (
            department === "supervisor" &&
            (role === "supervisor" || role === "supervisor head")
          );
        })
        .map((emp) => ({
          value: emp.Id,
          label: `${emp.Name} (${emp.PhoneNumber || "N/A"})`,
        }));

      setSupervisors(supervisorList);
    } catch (error) {
      console.error("Failed to fetch supervisors:", error);
      setSupervisors([]);
    }
  };

  const fetchAreaWiseSupervisors = async () => {
    try {
      const res = await axios.get(API_GET_AREA_WISE_SUPERVISOR, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || [];
      setAreaWiseSupervisors(data);
    } catch (error) {
      console.error("Failed to load area-wise supervisors", error);
      setAreaWiseSupervisors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedArea) {
      Swal.fire("Error", "Please select an area", "error");
      return;
    }

    if (!selectedSupervisors || selectedSupervisors.length === 0) {
      Swal.fire("Error", "Please select at least one supervisor", "error");
      return;
    }

    try {
      // Call API for each selected supervisor
      const promises = selectedSupervisors.map((supervisor) =>
        axios.post(
          API_ASSIGN_AREAS,
          {
            areaIds: [selectedArea.value],
            supervisorId: supervisor.value,
            assignedBy: userId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      await Promise.all(promises);

      Swal.fire(
        "Success",
        `Area assigned to ${selectedSupervisors.length} supervisor(s) successfully`,
        "success"
      );
      
      // Reset form
      setSelectedArea(null);
      setSelectedSupervisors([]);
      
      // Refresh area-wise supervisor data
      fetchAreaWiseSupervisors();
    } catch (error) {
      console.error("Failed to assign areas:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to assign areas to supervisor",
        "error"
      );
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
      width: "200px",
    },
    {
      name: "Supervisor Name",
      selector: (row) => row.SupervisorName || "—",
      sortable: true,
      width: "200px",
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "InActive";
        const colorMap = {
          Active: "#28A745",
          InActive: "#E34242",
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
      width: "120px",
    },
    {
      name: "Created Date",
      selector: (row) => {
        if (!row.CreatedDate) return "—";
        const date = new Date(row.CreatedDate);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
      sortable: true,
      width: "150px",
    },
  ];

  const filteredData = areaWiseSupervisors.filter((item) => {
    const matchesArea =
      filterAreaId === "" || item.AreaId == filterAreaId;
    const matchesSupervisor =
      filterSupervisorId === "" || item.SupervisorId == filterSupervisorId;
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "true" && item.IsActive) ||
      (filterStatus === "false" && !item.IsActive);
    const matchesSearch =
      searchTerm === "" ||
      item.AreaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.SupervisorName?.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      matchesArea && matchesSupervisor && matchesStatus && matchesSearch
    );
  });

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                  Select Area <span className="text-danger">*</span>
                </label>
                <Select
                  options={areas}
                  value={selectedArea}
                  onChange={(selectedOption) => setSelectedArea(selectedOption)}
                  classNamePrefix="react-select"
                  className={errors.areaId ? "is-invalid" : ""}
                  placeholder="-- Select Area --"
                  isSearchable
                />
                <FormError error={errors.areaId} />
              </div>

              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                  Select Supervisor(s) <span className="text-danger">*</span>
                </label>
                <Select
                  isMulti
                  options={supervisors}
                  value={selectedSupervisors}
                  onChange={(selectedOptions) =>
                    setSelectedSupervisors(selectedOptions || [])
                  }
                  classNamePrefix="react-select"
                  className={errors.supervisorId ? "is-invalid" : ""}
                  placeholder="-- Select Supervisor(s) --"
                  isSearchable
                  closeMenuOnSelect={false}
                />
                <FormError error={errors.supervisorId} />
              </div>

              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              >
                Assign Area
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-xxl-8 col-lg-8">
        <div className="card mb-3">
          <div className="row">
            <div className="col-md-6 mb-2">
              <Select
                options={[
                  { value: "", label: "Select Area" },
                  ...areas.map((area) => ({
                    value: area.AreaID,
                    label: area.AreaName,
                  })),
                ]}
                value={
                  filterAreaId
                    ? {
                        value: filterAreaId,
                        label:
                          areas.find((a) => a.AreaID == filterAreaId)
                            ?.AreaName || "Selected Area",
                      }
                    : { value: "", label: "Select Area" }
                }
                onChange={(selectedOption) =>
                  setFilterAreaId(selectedOption?.value || "")
                }
                className="basic-single"
                classNamePrefix="react-select"
                placeholder="Filter by Area"
              />
            </div>
            <div className="col-md-6 mb-2">
              <Select
                options={[
                  { value: "", label: "Select Supervisor" },
                  ...supervisors.map((supervisor) => ({
                    value: supervisor.value,
                    label: supervisor.label,
                  })),
                ]}
                value={
                  filterSupervisorId
                    ? {
                        value: filterSupervisorId,
                        label:
                          supervisors.find(
                            (s) => s.value == filterSupervisorId
                          )?.label || "Selected Supervisor",
                      }
                    : { value: "", label: "Select Supervisor" }
                }
                onChange={(selectedOption) =>
                  setFilterSupervisorId(selectedOption?.value || "")
                }
                className="basic-single"
                classNamePrefix="react-select"
                placeholder="Filter by Supervisor"
              />
            </div>
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by Area Name or Supervisor Name"
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
                <option value="">Select Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="chat-main card overflow-hidden p-3">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No area-wise supervisor assignments available"
          />
        </div>
      </div>
    </div>
  );
};

export default AssignSupervisorArea;
