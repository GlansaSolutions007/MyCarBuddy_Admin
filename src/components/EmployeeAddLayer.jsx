import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const EmployeeAddLayer = ({ setPageTitle }) => {
  const { EmployeeID } = useParams();
  const isEditing = Boolean(EmployeeID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [roles, setRoles] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supervisorRoleId, setSupervisorRoleId] = useState(null);
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [allDesignations, setAllDesignations] = useState([]);


  const [formData, setFormData] = useState({
    Id: 0,
    Name: "",
    Email: "",
    PhoneNumber: "",
    Password: "",
    ConfirmPassword: "",
    RoleId: 0,
    RoleName: "",
    DealerIds: [],
    DealerNames: [],
    CreatedBy: 1,
    Status: true,
    ProfileImage1: null,
    City: "",
    DeptId: "",
    ReportingTo: "",
    DesignationName: "",
  });

  useEffect(() => {
    setPageTitle(isEditing ? "Edit Employee" : "Add Employee");
    fetchRoles();
    fetchCities();
    fetchDepartments();
    fetchEmployees();
    fetchDesignations();
  }, [EmployeeID, isEditing, setPageTitle]);


  if (designations.length > 0) {
    console.log("Designations :", designations);
  }


  useEffect(() => {
    if (isEditing && roles.length > 0) {
      fetchEmployee();
    }
  }, [isEditing, roles]);

  useEffect(() => {
    if (formData.RoleId === supervisorRoleId && supervisorRoleId !== null) {
      fetchDealers();
    } else {
      setDealers([]);
      setFormData((prev) => ({
        ...prev,
        DealerIds: [],
        DealerNames: [],
      }));
    }
  }, [formData.RoleId, supervisorRoleId]);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee/Id?Id=${EmployeeID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employee = res.data[0];

      setFormData((prev) => {
        const currentRole = roles.find((role) => role.id === employee.RoleId);
        if (currentRole && currentRole.name === "Supervisor") {
          setSupervisorRoleId(currentRole.id);
        }

        const employeeDealerIds = Array.isArray(employee.DealerIds)
          ? employee.DealerIds
          : employee.DealerIds
            ? employee.DealerIds.split(",").map(Number)
            : [];
        const employeeDealerNames = Array.isArray(employee.DealerNames)
          ? employee.DealerNames
          : employee.DealerNames
            ? employee.DealerNames.split(",")
            : [];

        const updatedFormData = {
          ...prev,
          ...employee,
          ConfirmPassword: employee.Password || "",
          ProfileImage1: employee.ProfileImage || null,
          DealerIds: employeeDealerIds,
          DealerNames: employeeDealerNames,
          City: employee.City || "",
        };

        if (employee.ProfileImage) {
          setImagePreviewUrl(employee.ProfileImage);
        }
        return updatedFormData;
      });
    } catch (err) {
      console.error("Failed to fetch employee", err);
      Swal.fire("Error", "Failed to fetch employee details", "error");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}Roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
      const supervisorRole = res.data.find(
        (role) => role.name === "Supervisor"
      );
      if (supervisorRole) {
        setSupervisorRoleId(supervisorRole.id);
      } else {
        setSupervisorRoleId(null);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  useEffect(() => {
    // Set default "Employee" role if adding a new employee
    if (!isEditing && roles.length > 0) {
      const defaultRole = roles.find((role) => role.name === "Employee");
      if (defaultRole) {
        setFormData((prev) => ({
          ...prev,
          RoleId: defaultRole.id,
          RoleName: defaultRole.name,
        }));
      }
    }
  }, [roles, isEditing]);

  const fetchDealers = async () => {
    try {
      const res = await axios.get(`${API_BASE}Dealer`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedDealers = res.data.map((dealer, index) => ({
        value: dealer.DealerID,
        label: `${index + 1}. ${dealer.FullName}`,
        rawData: dealer,
      }));

      setDealers(formattedDealers);
    } catch (error) {
      console.error("Failed to load dealers", error);
      Swal.fire("Error", "Failed to load dealers", "error");
    }
  };

  const fetchCities = async () => {
    try {
      const res = await axios.get(`${API_BASE}City`);
      const formattedCities = res.data.map((city) => ({
        value: city.CityID,
        label: city.CityName,
      }));
      setCities(formattedCities);
    } catch (error) {
      console.error("Failed to load cities", error);
      Swal.fire("Error", "Failed to load cities", "error");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearAllErrors();
  };

  const handleRoleChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      RoleId: selectedOption ? selectedOption.value : 0,
      RoleName: selectedOption ? selectedOption.label : "",
      DealerIds: [],
      DealerNames: [],
    }));
    clearAllErrors();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("Error", "Image size should be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, ProfileImage1: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validationFieldsToExclude = [
        "Id",
        "ModifiedBy",
        "ModifiedDate",
        "ProfileImage1",
        "DealerNames",
        "RoleName",
        "Designation_Id",
        "Reporting_To",
        "ReportingTo",
        "DesignationName"
      ];
      let currentErrors = validate(formData, validationFieldsToExclude);

      if (
        formData.RoleId === supervisorRoleId &&
        formData.DealerIds.length === 0
      ) {
        currentErrors.DealerIds =
          "At least one dealer is required for Supervisor role.";
      }

      if (Object.keys(currentErrors).length > 0) {
        console.log("Validation Errors:", currentErrors);
        errors.setErrors(currentErrors);
        setIsSubmitting(false);
        return;
      }

      if (formData.Password !== formData.ConfirmPassword) {
        setFormData((prev) => ({ ...prev, ConfirmPassword: "" }));
        Swal.fire("Error", "Passwords do not match", "error");
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "ProfileImage1") {
          if (value instanceof File) {
            formDataToSend.append(key, value);
          }
        } else if (key === "DealerIds") {
          value.forEach((id) => formDataToSend.append("DealerIds", id));
        } else if (value !== null) {
          formDataToSend.append(key, value);
        }
      });

      let res;
      if (isEditing) {
        res = await axios.put(`${API_BASE}Employee`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        res = await axios.post(`${API_BASE}Employee`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing
            ? "Employee updated successfully"
            : "Employee added successfully",
        });
        navigate("/employees");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data?.message || "Operation failed",
        });
      }
    } catch (error) {
      console.error("Error saving employee", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save employee",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}Departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];
      // Format it for react-select
      const formattedData = apiData
        .filter((dept) => dept.IsActive) // only show active ones
        .map((dept) => ({
          value: dept.DeptId, // store DeptId internally
          label: dept.DepartmentName, // show only DepartmentName
        }));

      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to load departments", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedEmployees = res.data.map((emp) => ({
        value: emp.Id,
        label: emp.Name,
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error("Failed to load employees", error);
      Swal.fire("Error", "Failed to load employees", "error");
    }
  };

  // ------------------ Fetch Designations ------------------
  const fetchDesignations = async () => {
    try {
      const res = await axios.get(`${API_BASE}Designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiData = res.data?.data || [];

      // Store both complete and formatted lists
      setAllDesignations(apiData);

      // Initially, show all (or none if you prefer)
      const formattedDesignations =
        apiData.map((item) => ({
          value: item.Id,
          label: item.Designation_name,
          deptId: item.DeptId,
        })) || [];

      setDesignations(formattedDesignations);
    } catch (error) {
      console.error("Failed to load designations", error);
    }
  };

  useEffect(() => {
    if (formData.DeptId && allDesignations.length > 0) {
      const filtered = allDesignations
        .filter((d) => d.DeptId === formData.DeptId)
        .map((d) => ({
          value: d.Id,
          label: d.Designation_name,
        }));
      setDesignations(filtered);
    } else {
      setDesignations([]);
    }

    // Reset selected designation when department changes
    setFormData((prev) => ({
      ...prev,
      DesignationName: "",
    }));
  }, [formData.DeptId, allDesignations]);

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Profile Image */}
                <div className="col-12 mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      {imagePreviewUrl ? (
                        <img
                          src={
                            imagePreviewUrl.startsWith("data")
                              ? imagePreviewUrl
                              : API_IMAGE + imagePreviewUrl
                          }
                          alt="Profile Preview"
                          className="rounded-circle"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                          style={{ width: "100px", height: "100px" }}
                        >
                          <Icon
                            icon="lucide:user"
                            width="48"
                            height="48"
                            className="text-muted"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                        Profile Image
                      </label>
                      <input
                        type="file"
                        className="form-control radius-8"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <small className="text-muted">
                        Recommended size: 300x300px, Max size: 5MB
                      </small>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Full Name <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control radius-8 ${errors.Name ? "is-invalid" : ""
                      }`}
                    name="Name"
                    value={formData.Name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  <FormError error={errors.Name} />
                </div>

                {/* Email */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Email <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control radius-8 ${errors.Email ? "is-invalid" : ""
                      }`}
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  <FormError error={errors.Email} />
                </div>

                {/* Phone Number */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Phone Number <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control radius-8 ${errors.PhoneNumber ? "is-invalid" : ""
                      }`}
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                  <FormError error={errors.PhoneNumber} />
                </div>

                {/* City */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    City <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={cities.find(
                      (option) => option.label === formData.City
                    )}
                    onChange={(selectedOption) =>
                      setFormData((prev) => ({
                        ...prev,
                        City: selectedOption ? selectedOption.label : "",
                      }))
                    }
                    options={cities}
                    placeholder="Select City"
                    classNamePrefix="react-select"
                    className={errors.City ? "is-invalid" : ""}
                    isClearable
                  />
                  <FormError error={errors.City} />
                </div>

                {/* Department */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Department <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={departments.find(
                      (option) => option.value === formData.DeptId
                    )}
                    onChange={(selectedOption) =>
                      setFormData((prev) => ({
                        ...prev,
                        DeptId: selectedOption ? selectedOption.value : "",
                      }))
                    }
                    options={departments}
                    placeholder="Select Department"
                    classNamePrefix="react-select"
                    className={errors.DeptId ? "is-invalid" : ""}
                    isClearable
                  />
                  <FormError error={errors.DeptId} />
                </div>

                {/* Designations */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Designation <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={designations.find(
                      (option) => option.value === formData.DesignationName
                    )}
                    onChange={(selectedOption) =>
                      setFormData((prev) => ({
                        ...prev,
                        DesignationName: selectedOption ? selectedOption.value : "",
                      }))
                    }
                    options={designations}
                    placeholder="Select Designation"
                    classNamePrefix="react-select"
                    className={errors.DesignationName ? "is-invalid" : ""}
                    isClearable
                  />
                  <FormError error={errors.DesignationName} />
                </div>

                {/* Role */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Role <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={roleOptions.find(
                      (option) => option.value === formData.RoleId
                    )}
                    onChange={handleRoleChange}
                    options={roleOptions}
                    placeholder="Select role"
                    classNamePrefix="react-select"
                    isClearable
                    className={errors.RoleId ? "is-invalid" : ""}
                  />
                  <FormError error={errors.RoleId} />
                </div>

                {/* Reporting To */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Reporting To <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={employees.find((option) => option.value === formData.ReportingTo)}
                    onChange={(selectedOption) =>
                      setFormData((prev) => ({
                        ...prev,
                        ReportingTo: selectedOption ? selectedOption.value : "",
                      }))
                    }
                    options={employees}
                    placeholder="Select Reporting Person"
                    classNamePrefix="react-select"
                    className={errors.ReportingTo ? "is-invalid" : ""}
                    isClearable
                  />
                  <FormError error={errors.ReportingTo} />
                </div>

                {/* Dealer Multi-Select */}
                {formData.RoleId === supervisorRoleId && (
                  <div className="col-sm-6 mt-2">
                    <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                      Dealer(s) <span className="text-danger-600">*</span>
                    </label>
                    <Select
                      value={dealers
                        .map((d) => ({
                          ...d,
                          label: d.label.split(". ")[1],
                        }))
                        .filter((d) => formData.DealerIds.includes(d.value))}
                      onChange={(selectedOptions) => {
                        const selectedDealerIds = selectedOptions
                          ? selectedOptions.map((option) => option.value)
                          : [];
                        const selectedDealerNames = selectedOptions
                          ? selectedOptions.map((option) => option.label)
                          : [];

                        setFormData((prev) => ({
                          ...prev,
                          DealerIds: selectedDealerIds,
                          DealerNames: selectedDealerNames,
                        }));
                        clearAllErrors();
                      }}
                      options={dealers.map((d) => ({
                        ...d,
                        label: d.label.split(". ")[1],
                      }))}
                      placeholder="Select Dealer(s)"
                      classNamePrefix="react-select"
                      className={errors.DealerIds ? "is-invalid" : ""}
                      isMulti
                      closeMenuOnSelect={false}
                    />
                    <FormError error={errors.DealerIds} />
                  </div>
                )}

                {/* Password */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    {isEditing ? "New Password" : "Password"}{" "}
                    <span className="text-danger-600">*</span>
                  </label>

                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="Password"
                      className={`form-control radius-8 ${errors.Password ? "is-invalid" : ""}`}
                      value={formData.Password}
                      onChange={handleChange}
                      placeholder={
                        isEditing
                          ? "Leave blank to keep current"
                          : "Enter password"
                      }
                    />

                    <Icon
                      icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                      className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer text-primary-light"
                      width="22"
                      height="22"
                      onClick={() => setShowPassword((prev) => !prev)}
                    />
                  </div>
                  <FormError error={errors.Password} />
                </div>

                {/* Confirm Password */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Confirm Password <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control radius-8 ${errors.ConfirmPassword ? "is-invalid" : ""
                      }`}
                    name="ConfirmPassword"
                    value={formData.ConfirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                  <FormError error={errors.ConfirmPassword} />
                </div>

                {/* Status */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Status
                  </label>
                  <select
                    name="Status"
                    className="form-select radius-8"
                    value={formData.Status ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        Status: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="d-flex justify-content-center gap-3 mt-24">
                <button
                  type="submit"
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary radius-8 px-14 py-6 text-sm"
                  onClick={() => navigate("/employees")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAddLayer;

