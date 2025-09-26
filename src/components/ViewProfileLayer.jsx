import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";

const ViewProfileLayer = () => {
  const baseURL = import.meta.env.VITE_APIURL;
  const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    AdminID: 2, // fixed ID for now
    FullName: "",
    PasswordHash: "",
    confirmPassword: "",
    ProfileImage1: "",
  });

  const [imagePreview, setImagePreview] = useState(
    "/assets/images/user-grid/user-grid-img13.png" // default placeholder
  );
  const [file, setFile] = useState(null);

  // Fetch admin details
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await axios.get(
          `${baseURL}Auth/adminid?adminid=${formData.AdminID}`
        );
        const data = res.data[0];

        setFormData({
          AdminID: data.AdminID,
          FullName: data.FullName,
          Email: data.Email,
          PasswordHash: "", // don’t pre-fill password
          ProfileImage1: data.ProfileImage,
        });

        // show old image if available
        if (data.ProfileImage) {
          setImagePreview(`${API_IMAGE}${data.ProfileImage}`);
        }
      } catch (err) {
        console.error("Error fetching admin:", err);
      }
    };

    fetchAdmin();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Image upload preview
  const readURL = (input) => {
    if (input.target.files && input.target.files[0]) {
      setFile(input.target.files[0]);
      const reader = new FileReader();
      reader.onload = (e) => {
        // Show preview of newly uploaded image
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(input.target.files[0]);
    }
  };

  // Save / Update Admin
  const handleSave = async () => {
    if (formData.PasswordHash !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match!",
      });
      return;
    }

    try {
      const payload = new FormData();
      payload.append("AdminID", formData.AdminID);
      payload.append("FullName", formData.FullName);
      payload.append("PasswordHash", formData.PasswordHash);
      if (file) {
        payload.append("ProfileImage1", file);
      }

      const res = await axios.put(`${baseURL}Auth/update-admin`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = res.data;
      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully!",
        }).then(() => {
          navigate("/dashboard"); // redirect after success
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Update failed!",
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Update failed!",
      });
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-12">
        <div className="card h-100">
          <div className="card-body p-24">
            <div className="tab-content" id="pills-tabContent">
              <div
                className="tab-pane fade show active"
                id="pills-edit-profile"
                role="tabpanel"
              >
                <h6 className="text-md text-primary-light mb-16">
                  Profile Image
                </h6>

                {/* Upload Image Start */}
                <div className="mb-24 mt-16 justify-content-center d-flex">
                  <div className="avatar-upload">
                    <div className="avatar-edit position-absolute bottom-0 end-0 me-24 mt-16 z-1 cursor-pointer">
                      <input
                        type="file"
                        id="imageUpload"
                        accept=".png, .jpg, .jpeg"
                        hidden
                        onChange={readURL}
                      />
                      <label
                        htmlFor="imageUpload"
                        className="w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle"
                      >
                        <Icon icon="solar:camera-outline" className="icon" />
                      </label>
                    </div>
                    <div className="avatar-preview">
                      <div
                        id="imagePreview"
                        style={{
                          backgroundImage: `url(${imagePreview})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Upload Image End */}

                <form>
                  <div className="row">
                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Full Name <span className="text-danger-600">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control radius-8"
                          name="FullName"
                          value={formData.FullName}
                          onChange={handleChange}
                          placeholder="Enter Full Name"
                        />
                      </div>
                    </div>

                    <div className="col-sm-6 mt-2">
                      <div className="mb-20">
                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Email <span className="text-danger-600">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control radius-8"
                          name="Email"
                          value={formData.Email}
                          onChange={handleChange}
                          placeholder="Enter email"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Password
                        </label>
                        <input
                          type="password"
                          className="form-control radius-8"
                          name="PasswordHash"
                          value={formData.PasswordHash}
                          onChange={handleChange}
                          placeholder="Enter password"
                        />
                      </div>
                    </div>

                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          className="form-control radius-8"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <Link
                      to="/dashboard"
                      type="button"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                    >
                      Cancel
                    </Link>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfileLayer;
