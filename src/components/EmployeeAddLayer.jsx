import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const EmployeeAddLayer = ({ setPageTitle }) => {
  const { EmployeeID } = useParams();
  const isEditing = Boolean(EmployeeID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    EmployeeID: "",
    FullName: "",
    Email: "",
    PhoneNumber: "",
    PasswordHash: "",
    ConfirmPassword: "",
    RoleID: "",
    ProfileImage: null,
    IsActive: true,
  });

  useEffect(() => {
    setPageTitle(isEditing ? "Edit Employee" : "Add Employee");
    fetchRoles();

    if (isEditing) {
      fetchEmployee();
    }
  }, []);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employees/${EmployeeID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const employee = res.data;
      setFormData({
        ...employee,
        ConfirmPassword: employee.PasswordHash || "",
        ProfileImage: null,
      });
      if (employee.ProfileImage) {
        setImagePreviewUrl(employee.ProfileImage);
      }
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
    } catch (err) {
      console.error("Failed to fetch roles", err);
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
      RoleID: selectedOption ? selectedOption.value : "",
    }));
    clearAllErrors();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire("Error", "Image size should be less than 5MB", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      setFormData((prev) => ({
        ...prev,
        ProfileImage: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      const validationErrors = validate(formData, ["EmployeeID"]);
      if (Object.keys(validationErrors).length > 0) {
        setIsSubmitting(false);
        return;
      }

      // Check if passwords match
      if (formData.PasswordHash !== formData.ConfirmPassword) {
        setFormData((prev) => ({ ...prev, ConfirmPassword: "" }));
        Swal.fire("Error", "Passwords do not match", "error");
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("FullName", formData.FullName);
      formDataToSend.append("Email", formData.Email);
      formDataToSend.append("PhoneNumber", formData.PhoneNumber);
      formDataToSend.append("PasswordHash", formData.PasswordHash);
      formDataToSend.append("RoleID", formData.RoleID);
      formDataToSend.append("IsActive", formData.IsActive);
      
      if (formData.ProfileImage) {
        formDataToSend.append("ProfileImage", formData.ProfileImage);
      }

      let res;
      if (isEditing) {
        res = await axios.put(`${API_BASE}Employees/${EmployeeID}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        res = await axios.post(`${API_BASE}Employees`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (res.data.status || res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing ? "Employee updated successfully" : "Employee added successfully",
        });
        navigate("/employees");
      } else {
        throw new Error(res.data.message || "Operation failed");
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
    value: role.RoleID,
    label: role.RoleName,
  }));

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              {isEditing ? "Edit Employee" : "Add New Employee"}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Profile Image */}
                <div className="col-12 mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Profile Preview"
                          className="rounded-circle"
                          style={{ width: "100px", height: "100px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                          style={{ width: "100px", height: "100px" }}
                        >
                          <Icon icon="lucide:user" size={48} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="form-label text-sm fw-semibold text-primary-light mb-8">Profile Image</label>
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
                    className={`form-control radius-8 ${errors.FullName ? "is-invalid" : ""}`}
                    name="FullName"
                    value={formData.FullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  <FormError error={errors.FullName} />
                </div>

                {/* Email */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Email <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control radius-8 ${errors.Email ? "is-invalid" : ""}`}
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
                    className={`form-control radius-8 ${errors.PhoneNumber ? "is-invalid" : ""}`}
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                  <FormError error={errors.PhoneNumber} />
                </div>

                {/* Role */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Role <span className="text-danger-600">*</span>
                  </label>
                  <Select
                    value={roleOptions.find(option => option.value === formData.RoleID)}
                    onChange={handleRoleChange}
                    options={roleOptions}
                    placeholder="Select role"
                    className={errors.RoleID ? "is-invalid" : ""}
                    classNamePrefix="react-select"
                    isClearable
                  />
                  <FormError error={errors.RoleID} />
                </div>

                {/* Password */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    {isEditing ? "New Password" : "Password"} <span className="text-danger-600">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control radius-8 ${errors.PasswordHash ? "is-invalid" : ""}`}
                      name="PasswordHash"
                      value={formData.PasswordHash}
                      onChange={handleChange}
                      placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} />
                    </button>
                  </div>
                  <FormError error={errors.PasswordHash} />
                </div>

                {/* Confirm Password */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                    Confirm Password <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control radius-8 ${errors.ConfirmPassword ? "is-invalid" : ""}`}
                    name="ConfirmPassword"
                    value={formData.ConfirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                  <FormError error={errors.ConfirmPassword} />
                </div>

                {/* Status */}
                <div className="col-sm-6 mt-2">
                  <label className="form-label text-sm fw-semibold text-primary-light mb-8">Status</label>
                  <select
                    name="IsActive"
                    className="form-select radius-8"
                    value={formData.IsActive ? "true" : "false"}
                    onChange={handleChange}
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
                  {isSubmitting ? "Saving..." : isEditing ? "Update Employee" : "Save Employee"}
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