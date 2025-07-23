import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const CustomerAddLayer = ({ setPageTitle }) => {
  const { CustomerID } = useParams();
  const isEditing = Boolean(CustomerID);
    setPageTitle(isEditing ? "Edit - Customer" : "Add - Customer");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, clearAllErrors } = useFormError();
     const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    TechID: "",
    DealerID: 3, // Default to 3 for testing
    FullName: "fdgdfvfd",
    PhoneNumber: "",
    Email: "",
    PasswordHash: "",
    ConfirmPassword: "",
    AddressLine1: "",
    AddressLine2: "",
    StateID: "",
    CityID: "",
    Pincode: "",
    ProfileImage: null,
    Documents: [], // [{type: 'Aadhar', file: File}]
    IsActive: true,
    Status: 1,
  });

  useEffect(() => {
    setPageTitle(isEditing ? "Edit - Technician" : "Add - Technician");
    fetchStates();
    fetchCities();

    if (isEditing) {
      fetchTechnician();
    }
  }, []);

  const fetchTechnician = async () => {
    try {
      const res = await axios.get(`${API_BASE}Technicians/${TechnicianID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFormData({ ...res.data, ConfirmPassword: res.data.PasswordHash });
    } catch (err) {
      console.error("Failed to fetch technician", err);
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
      ProfileImage: e.target.files[0],
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
    const validationErrors = validate(formData, ["TechID", "IsActive" ,"DealerID" ,"Documents",]);
    console.log(validationErrors);

    if (formData.PasswordHash !== formData.ConfirmPassword) {
      validationErrors.ConfirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) return;

    try {
    //   const confirm = await Swal.fire({
    //     title: "Are you sure?",
    //     text: isEditing ? "Update technician details?" : "Add new technician?",
    //     icon: "question",
    //     showCancelButton: true,
    //     confirmButtonText: "Yes",
    //   });

    //   if (!confirm.isConfirmed) return;

      const { ConfirmPassword,TechID, ...payload } = formData;

      if (isEditing) {
        await axios.put(`${API_BASE}TechniciansDetails/InsertTechnicians`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        await axios.post(`${API_BASE}TechniciansDetails/InsertTechnicians`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      Swal.fire("Success", `Technician ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/technicians");

    } catch (err) {
      console.error("Submit failed", err);
      Swal.fire("Error", "Failed to save technician", "error");
    }
  };

  return (
    <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">
          <div className='row'>
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

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Full Name *</label>
              <input
                type='text'
                name='FullName'
                className='form-control radius-8'
                value={formData.FullName}
                onChange={handleChange}
                placeholder='Enter Full Name'
              />
              <FormError error={errors.FullName} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Email *</label>
              <input
                type='email'
                name='Email'
                className='form-control radius-8'
                value={formData.Email}
                onChange={handleChange}
                placeholder='Enter Email'
              />
              <FormError error={errors.Email} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Phone Number</label>
              <input
                type='text'
                name='PhoneNumber'
                className='form-control radius-8'
                value={formData.PhoneNumber}
                onChange={handleChange}
                placeholder="Enter Phone Number"
              />
              <FormError error={errors.PhoneNumber} />
            </div>

            <div className='col-sm-6'>  </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Password</label>
              <div className='position-relative'>
                <input
                  type={showPassword ? "text" : "password"}
                  name='PasswordHash'
                  className='form-control radius-8'
                  value={formData.PasswordHash}
                  onChange={handleChange}
                  placeholder='Enter Password'
                />
                <Icon
                  icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                  className='position-absolute end-0 top-50 translate-middle-y me-16 cursor-pointer'
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              </div>
              <FormError error={errors.PasswordHash} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name='ConfirmPassword'
                className='form-control radius-8'
                value={formData.ConfirmPassword}
                onChange={handleChange}
                placeholder='Confirm Password'
              />
              <FormError error={errors.ConfirmPassword} />
            </div>
            {/* <div className='col-md-12 mt-2'></div> */}

            
 
            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>State</label>
              <Select
                name='StateID'
                options={states.map((s) => ({ value: s.StateID, label: s.StateName }))}
                value={
                  formData.StateID
                    ? {
                        value: formData.StateID,
                        label: states.find((s) => s.StateID === formData.StateID)?.StateName,
                      }
                    : null
                }
                onChange={(selected) => handleChange({ target: { name: "StateID", value: selected?.value || "" } })}
                classNamePrefix="react-select"
              />
              <FormError error={errors.StateID} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>City</label>
              <Select
                name='CityID'
                options={cities
                  .filter((c) => c.StateID === formData.StateID)
                  .map((c) => ({ value: c.CityID, label: c.CityName }))}
                value={
                  formData.CityID
                    ? {
                        value: formData.CityID,
                        label: cities.find((c) => c.CityID === formData.CityID)?.CityName,
                      }
                    : null
                }
                onChange={(selected) => handleChange({ target: { name: "CityID", value: selected?.value || "" } })}
                classNamePrefix="react-select"
              />
              <FormError error={errors.CityID} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Address Line 1</label>
              <textarea
                rows='2'
                name='AddressLine1'
                className='form-control radius-8'
                value={formData.AddressLine1}
                onChange={handleChange}
                placeholder='Enter Address Line 1'
              />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Address Line 2</label>
              <textarea
                rows='2'
                name='AddressLine2'
                className='form-control radius-8'
                value={formData.AddressLine2}
                onChange={handleChange}
                placeholder='Enter Address Line 2'
              />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Pincode</label>
              <input
                type='text'
                name='Pincode'
                className='form-control radius-8'
                value={formData.Pincode}
                onChange={handleChange}
                placeholder='Enter Pincode'
              />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Status</label>
              <select
                name='IsActive'
                className='form-select radius-8'
                value={formData.IsActive ? "true" : "false"}
                onChange={handleChange}
              >
                <option value='true'>Active</option>
                <option value='false'>Inactive</option>
              </select>
            </div>

     
            <div className='d-flex justify-content-center gap-3 mt-24'>
              <button type='submit' className='btn btn-primary-600 radius-8 px-14 py-6 '>
                {isEditing ? "Update" : "Save"} Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerAddLayer;
