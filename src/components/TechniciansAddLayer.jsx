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

const TechniciansAddLayer = ({ setPageTitle }) => {
  const { TechnicianID } = useParams();
  const isEditing = Boolean(TechnicianID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [TechID, setTechID] = useState("");
  const [skills, setSkills] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    DealerID: "",
    DistributorID: "",
    FullName: "",
    PhoneNumber: "",
    Email: "",
    PasswordHash: "",
    ConfirmPassword: "",
    AddressLine1: "",
    AddressLine2: "",
    StateID: "",
    CityID: "",
    Pincode: "",
    ProfileImageFile: null,
    Documents: [],
    SkillID: [], // ✅ New field
    IsActive: true,
    Status: 1,
    CreatedBy: 1,
  });

  useEffect(() => {
    setPageTitle(isEditing ? "Edit - Technician" : "Add - Technician");
    fetchStates();
    fetchCities();
    fetchSkills();
    // fetchDealers();

    fetchDistributors();

    if (isEditing) {
      fetchTechnician();
    }
  }, []);

  const fetchTechnician = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}TechniciansDetails/technicianid?technicianid=${TechnicianID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data.data[0];
      console.log("Fetched Technician:", data);

      // Update image preview from backend image
      if (data.ProfileImage) {
        setImagePreviewUrl(`${API_IMAGE}${data.ProfileImage}`); // if backend URL is relative
      }

      setFormData((prev) => ({
        ...prev,
        TechID: data.TechID ?? "",
        DistributorID: data.DistributorID ?? "",
        DealerID: data.DealerID ?? "",
        FullName: data.TechnicianName ?? "",
        PhoneNumber: data.PhoneNumber ?? "",
        Email: data.Email ?? "",
        PasswordHash: data.PasswordHash ?? "",
        ConfirmPassword: data.PasswordHash ?? "",
        AddressLine1: data.AddressLine1 ?? "",
        AddressLine2: data.AddressLine2 ?? "",
        StateID: data.StateID ?? "",
        CityID: data.CityID ?? "",
        Pincode: data.Pincode ?? "",
        ProfileImageFile: data.ProfileImage, // we don't set the file here, just use preview URL
        Documents: [], // No documents coming from API?
        IsActive: data.IsActive ?? true,
        Status: data.Status ?? 1,
      }));

      if (data.Documents) {
        try {
          const parsedDocs = JSON.parse(data.Documents);

          const formattedDocs = parsedDocs.map((doc) => ({
            type: doc.DocuTypeID?.toString() || "",
            file: null,
            fileName: doc.DocumentURL?.replace(/\\/g, "/") || "", // fix the slashes
          }));

          setFormData((prev) => ({
            ...prev,
            Documents: formattedDocs,
          }));
        } catch (err) {
          console.error("Failed to parse Documents JSON:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch technician", err);
      Swal.fire("Error", "Failed to load technician data", "error");
    }
  };

  const fetchStates = async () => {
    const res = await axios.get(`${API_BASE}State`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStates(res.data);
  };

  const fetchCities = async () => {
    const res = await axios.get(`${API_BASE}City`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCities(res.data);
  };
  const fetchDealers = async (distributorId = null) => {
    try {
      const res = await axios.get(`${API_BASE}Dealer`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let dealerList = res.data;

      if (distributorId) {
        dealerList = dealerList.filter(
          (dealer) => dealer.DistributorID === Number(distributorId)
        );
      }

      setDealers(dealerList);
    } catch (err) {
      console.error("Failed to fetch dealers", err);
    }
  };

  const fetchDistributors = async () => {
    const res = await axios.get(`${API_BASE}Distributors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDistributors(res.data);
  };

  const fetchSkills = async () => {
    const res = await axios.get(`${API_BASE}Skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSkills(res.data);
  };
  const documentTypes = ["Aadhar Card", "PAN Card", "Driving License", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "IsActive" ? value === "true" : value,
    }));
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
      ProfileImageFile: e.target.files[0],
    }));
  };

  const handleDocumentUpload = (index, type, file) => {
    const updatedDocs = [...formData.Documents];
    updatedDocs[index] = { type, file };
    setFormData((prev) => ({ ...prev, Documents: updatedDocs }));
  };

  const addDocumentField = () => {
    setFormData((prev) => ({
      ...prev,
      Documents: [...prev.Documents, { type: "", file: null }],
    }));
  };

  const removeDocumentField = (index) => {
    const updatedDocs = formData.Documents.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, Documents: updatedDocs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, [
      "TechID",
      "ConfirmPassword",
      "IsActive",
      "Status",
      "AddressLine2",
    ]);

    if (!formData.ProfileImageFile && !isEditing) {
      Swal.fire("Required", "Please upload a profile image", "warning");
      return;
    }

    if (formData.PasswordHash !== formData.ConfirmPassword) {
      validationErrors.ConfirmPassword = "Passwords do not match";
    }
    console.log(validationErrors);
    console.log(formData);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const form = new FormData();

      // Append all simple fields (skip file & confirm password)
      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== "Documents" &&
          key !== "ConfirmPassword" &&
          key !== "ProfileImageFile"
        ) {
          if (value !== null && value !== undefined) {
            form.append(key, value);
          }
        }
      });

      // Profile Image
      if (formData.ProfileImageFile) {
        form.append("ProfileImageFile", formData.ProfileImageFile);
      }

      // Prepare document metadata array
      const documentMeta = formData.Documents.map((doc) => ({
        DocTypeID: parseInt(doc.type),
      }));

      // Append each document file
      formData.Documents.forEach((doc) => {
        if (doc.file) {
          form.append("DocumentFiles", doc.file); // creates DocumentFiles[] on backend
        }
      });

      // if (formData.SkillIDs.length > 0) {
      //   form.append("SkillID", formData.SkillIDs.join(","));
      // }

      // Append the JSON metadata array
      form.append("DocumentsJson", JSON.stringify(documentMeta));

      // If editing, include TechID explicitly
      if (isEditing) {
        form.append("TechID", formData.TechID);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEditing) {
        await axios.put(
          `${API_BASE}TechniciansDetails/UpdateTechnicians`,
          form,
          config
        );
      } else {
        await axios.post(
          `${API_BASE}TechniciansDetails/InsertTechnicians`,
          form,
          config
        );
      }

      Swal.fire(
        "Success",
        `Technician ${isEditing ? "updated" : "added"} successfully!`,
        "success"
      );
      navigate("/technicians");
    } catch (err) {
      console.error("Submit failed", err);
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to save technician",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDistributorChange = (selected) => {
    const distributorId = selected?.value || "";
    setFormData((prev) => ({
      ...prev,
      DistributorID: distributorId,
      DealerID: "",
    }));
    fetchDealers(distributorId);
  };

  return (
    <div className="card h-100 p-0 radius-12 overflow-hidden mt-3">
      <div className="card-body p-20">
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="row g-3"
        >
          <div className="row">
            <div className="mb-24 mt-16 justify-content-center d-flex">
              <div className="avatar-upload">
                <div className="avatar-edit position-absolute bottom-0 end-0 me-24 mt-16 z-1 cursor-pointer">
                  <input
                    type="file"
                    id="imageUpload"
                    accept=".png, .jpg, .jpeg"
                    hidden
                    onChange={handleImageChange}
                  />
                  <label
                    htmlFor="imageUpload"
                    className="w-32-px h-32-px d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle"
                  >
                    <Icon icon="solar:camera-outline" className="icon"></Icon>
                  </label>
                </div>
                <div className="avatar-preview">
                  <div
                    id="imagePreview"
                    style={{
                      backgroundImage: imagePreviewUrl
                        ? `url(${imagePreviewUrl})`
                        : "",
                    }}
                  ></div>
                </div>
              </div>
              {errors.BrandLogo && <FormError error={errors.BrandLogo} />}
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="FullName"
                className="form-control radius-8"
                value={formData.FullName}
                onChange={handleChange}
                placeholder="Enter Full Name"
              />
              <FormError error={errors.FullName} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="Email"
                className="form-control radius-8"
                value={formData.Email}
                onChange={handleChange}
                placeholder="Enter Email"
              />
              <FormError error={errors.Email} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="PhoneNumber"
                className="form-control radius-8"
                value={formData.PhoneNumber}
                onChange={handleChange}
                placeholder="Enter Phone Number"
              />
              <FormError error={errors.PhoneNumber} />
            </div>
            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Skills <span className="text-danger">*</span>
              </label>
              <Select
                name="SkillID"
                isMulti
                options={skills.map((s) => ({
                  value: s.SkillID,
                  label: s.SkillName,
                }))}
                value={skills
                  .filter((s) => formData.SkillID.includes(s.SkillID))
                  .map((s) => ({
                    value: s.SkillID,
                    label: s.SkillName,
                  }))}
                onChange={(selectedOptions) =>
                  setFormData((prev) => ({
                    ...prev,
                    SkillID: selectedOptions.map((opt) => opt.value),
                  }))
                }
                classNamePrefix="react-select"
              />
              <FormError error={errors.SkillID} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Distributor <span className="text-danger">*</span>
              </label>
              <Select
                name="DistributorID"
                options={distributors.map((d) => ({
                  value: d.DistributorID,
                  label: d.FullName,
                }))}
                value={
                  formData.DistributorID
                    ? {
                        value: formData.DistributorID,
                        label: distributors.find(
                          (d) => d.DistributorID === formData.DistributorID
                        )?.FullName,
                      }
                    : null
                }
                onChange={handleDistributorChange}
                classNamePrefix="react-select"
              />
              <FormError error={errors.DistributorID} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Dealer <span className="text-danger">*</span>
              </label>
              <Select
                name="DealerID"
                options={dealers.map((d) => ({
                  value: d.DealerID,
                  label: d.FullName,
                }))}
                value={
                  formData.DealerID
                    ? {
                        value: formData.DealerID,
                        label: dealers.find(
                          (d) => d.DealerID === formData.DealerID
                        )?.FullName,
                      }
                    : null
                }
                onChange={(selected) =>
                  handleChange({
                    target: { name: "DealerID", value: selected?.value || "" },
                  })
                }
                classNamePrefix="react-select"
              />
              <FormError error={errors.DealerID} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Password <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="PasswordHash"
                  className="form-control radius-8"
                  value={formData.PasswordHash}
                  onChange={handleChange}
                  placeholder="Enter Password"
                />
                <Icon
                  icon={
                    showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"
                  }
                  className="position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              </div>
              <FormError error={errors.PasswordHash} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="ConfirmPassword"
                className="form-control radius-8"
                value={formData.ConfirmPassword || ""}
                onChange={handleChange}
                placeholder="Confirm Password"
              />
              <FormError error={errors.ConfirmPassword} />
            </div>
            {/* <div className='col-md-12 mt-2'></div> */}

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                State <span className="text-danger">*</span>
              </label>
              <Select
                name="StateID"
                options={states.map((s) => ({
                  value: s.StateID,
                  label: s.StateName,
                }))}
                value={
                  formData.StateID
                    ? {
                        value: formData.StateID,
                        label: states.find(
                          (s) => s.StateID === formData.StateID
                        )?.StateName,
                      }
                    : null
                }
                onChange={(selected) =>
                  handleChange({
                    target: { name: "StateID", value: selected?.value || "" },
                  })
                }
                classNamePrefix="react-select"
              />
              <FormError error={errors.StateID} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                City <span className="text-danger">*</span>
              </label>
              <Select
                name="CityID"
                options={cities
                  .filter((c) => c.StateID === formData.StateID)
                  .map((c) => ({ value: c.CityID, label: c.CityName }))}
                value={
                  formData.CityID
                    ? {
                        value: formData.CityID,
                        label: cities.find((c) => c.CityID === formData.CityID)
                          ?.CityName,
                      }
                    : null
                }
                onChange={(selected) =>
                  handleChange({
                    target: { name: "CityID", value: selected?.value || "" },
                  })
                }
                classNamePrefix="react-select"
              />
              <FormError error={errors.CityID} />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Address Line 1 <span className="text-danger">*</span>
              </label>
              <textarea
                rows="2"
                name="AddressLine1"
                className="form-control radius-8"
                value={formData.AddressLine1}
                onChange={handleChange}
                placeholder="Enter Address Line 1"
              />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Address Line 2
              </label>
              <textarea
                rows="2"
                name="AddressLine2"
                className="form-control radius-8"
                value={formData.AddressLine2}
                onChange={handleChange}
                placeholder="Enter Address Line 2"
              />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Pincode <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="Pincode"
                className="form-control radius-8"
                value={formData.Pincode}
                onChange={handleChange}
                placeholder="Enter Pincode"
              />
            </div>

            <div className="col-sm-6 mt-2">
              <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                Status
              </label>
              <select
                name="IsActive"
                className="form-select radius-8"
                value={formData.IsActive ? "true" : "false"}
                onChange={handleChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              {/* type hidden status 1 */}
              <input
                type="hidden"
                name="Status"
                value={formData.Status ? "1" : "1"}
                onChange={handleChange}
              />
            </div>

            {/* <div className="col-md-12">
        <label>Profile Image</label>
        <input
          type="file"
          onChange={handleProfileImage}
          accept="image/*"
          className="form-control"
        />
      </div> */}

            <div className="col-md-12 mt-3">
              <h6>Upload Documents</h6>
              {formData.Documents.map((doc, index) => {
                const selectedTypeLabel = documentTypes[parseInt(doc.type) - 1]; // show label

                return (
                  <div className="row mb-2 align-items-center" key={index}>
                    <div className="col-md-3">
                      <select
                        className="form-select radius-8"
                        value={doc.type}
                        onChange={(e) =>
                          handleDocumentUpload(index, e.target.value, doc.file)
                        }
                      >
                        <option value="">Select Document Type</option>
                        {documentTypes.map((type, i) => (
                          <option value={i + 1} key={i}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleDocumentUpload(
                            index,
                            doc.type,
                            e.target.files[0]
                          )
                        }
                      />
                      {doc.fileName && (
                        <small className="text-muted mt-1 d-block">
                          Existing:{" "}
                          <a
                            href={`${API_IMAGE}${doc.fileName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600"
                          >
                            {doc.fileName.toLowerCase().endsWith(".pdf")
                              ? "View PDF"
                              : "View Image"}
                          </a>
                        </small>
                      )}
                    </div>

                    <div className="col-md-3">
                      {doc.fileName &&
                        (doc.fileName.toLowerCase().endsWith(".pdf") ? (
                          <Icon
                            icon="mdi:file-pdf-box"
                            width={32}
                            className="text-danger"
                          />
                        ) : (
                          <img
                            src={`${API_BASE}${doc.fileName}`}
                            alt="doc"
                            style={{
                              height: 40,
                              width: 40,
                              objectFit: "cover",
                            }}
                            className="rounded"
                          />
                        ))}
                      {selectedTypeLabel && (
                        <div className="mt-1 text-muted text-xs">
                          {selectedTypeLabel}
                        </div>
                      )}
                    </div>

                    <div className="col-md-2">
                      <button
                        type="button"
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                        onClick={() => removeDocumentField(index)}
                      >
                        <Icon icon="mingcute:delete-2-line" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                onClick={addDocumentField}
              >
                Add Document
              </button>
            </div>

            <div className="d-flex justify-content-center gap-3 mt-24">
              <button
                type="submit"
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"}{" "}
                Technician
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechniciansAddLayer;
