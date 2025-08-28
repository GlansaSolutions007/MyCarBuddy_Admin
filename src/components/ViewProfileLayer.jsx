import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";

const ViewProfileLayer = () => {
  const [formData, setFormData] = useState({
    AdminID: 2, // fixed ID for now
    FullName: "",
    PasswordHash: "",
    ProfileImage1: "",
  });
  const [imagePreview, setImagePreview] = useState(
    "assets/images/user-grid/user-grid-img13.png"
  );
  const [file, setFile] = useState(null);

  // Fetch admin details
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch(`/api/Auth/adminid?adminid=${formData.AdminID}`);
        const data = await res.json();

        setFormData({
          AdminID: data.AdminID,
          FullName: data.FullName,
          PasswordHash: "", // don’t pre-fill password
          ProfileImage1: data.ProfileImage1,
        });

        if (data.ProfileImage1) {
          setImagePreview(data.ProfileImage1);
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
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(input.target.files[0]);
    }
  };

  // Save / Update Admin
  const handleSave = async () => {
    try {
      const payload = new FormData();
      payload.append("AdminID", formData.AdminID);
      payload.append("FullName", formData.FullName);
      payload.append("PasswordHash", formData.PasswordHash);
      if (file) {
        payload.append("ProfileImage1", file);
      }

      const res = await fetch("/api/Auth/update-admin", {
        method: "POST",
        body: payload,
      });

      const result = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert(result.message || "Update failed!");
      }
    } catch (err) {
      console.error("Update error:", err);
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
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <button
                      type="button"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                    >
                      Cancel
                    </button>
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
