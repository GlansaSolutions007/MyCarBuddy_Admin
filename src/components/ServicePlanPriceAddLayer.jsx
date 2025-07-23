import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const ServicePlanPriceAddLayer = ({ setPageTitle }) => {
  const { PlanPackagePriceID } = useParams();
  const isEditing = Boolean(PlanPackagePriceID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { errors, validate } = useFormError();
  const [filteredModels, setFilteredModels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [formData, setFormData] = useState({
  BrandID: "",
  ModelID: "",
  FuelTypeID: "",
  PackageID: "",
  Description: "",
  Serv_Reg_Price: "",
  Serv_Off_Price: "",
  EstimatedDurationMinutes: "",
  ImageURL: null,
  IsActive: true,
});
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    setPageTitle(isEditing ? "Edit Plan Price" : "Add Plan Price");
    fetchOptions();

    if (isEditing) {
      fetchPlanPrice();
    }
  }, []);

  useEffect(() => {
  if (formData.BrandID) {
    const modelsForBrand = models.filter((m) => m.BrandID === formData.BrandID);
    setFilteredModels(modelsForBrand);
  }
}, [models, formData.BrandID]);

  const fetchOptions = async () => {
    try {
      const [brandRes, modelRes, fuelRes, planRes] = await Promise.all([
        axios.get(`${API_BASE}VehicleBrands/GetVehicleBrands`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}VehicleModels/GetListVehicleModel`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}FuelTypes/GetFuelTypes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}PlanPackage/GetPlanPackagesDetails`, { headers: { Authorization: `Bearer ${token}` } }),

      ]);
      setBrands(brandRes.data.data);
      setModels(modelRes.data.data);
      setFuelTypes(fuelRes.data.data);
      setPlans(planRes.data);
      console.log(planRes.data);
    } catch (error) {
      console.error("Failed to load options", error);
    }
  };

  const fetchPlanPrice = async () => {
    try {
      const res = await axios.get(`${API_BASE}PlanPackagePrice?planpackagepriceid=${PlanPackagePriceID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      console.log("data", data);
      setFormData(data);
      if (data.ImageURL) {
        setImagePreview(`${import.meta.env.VITE_APIURL_IMAGE}${data.ImageURL}`);
      }
    } catch (error) {
      console.error("Failed to load plan price", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "IsActive" ? value === "true" : value,
      }));
    }
  };

 const handleSelectChange = (selected, field) => {
  const value = selected ? selected.value : "";

  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));

  if (field === "BrandID") {
    // Reset ModelID when brand changes
    setFormData((prev) => ({ ...prev, ModelID: "" }));

    // Filter models for selected brand
    const modelsForBrand = models.filter((m) => m.BrandID === value);
    setFilteredModels(modelsForBrand);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      for (const key in formData) {
        payload.append(key, formData[key]);
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      if (isEditing) {
        await axios.put(`${API_BASE}PlanPackagePrice/UpdatePlanPackagePrice`, payload, { headers });
      } else {
        
        await axios.post(`${API_BASE}PlanPackagePrice/AddPlanPackagePrice`, payload, { headers });
      }

      Swal.fire("Success", `Plan Price ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/service-plan-prices");
    } catch (error) {
      console.error("Submit failed", error);
      Swal.fire("Error", "Failed to save plan price", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>
        <form onSubmit={handleSubmit} className="row g-3">
    <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Brand</label>
            <Select
                options={brands
                .filter((b) => b.IsActive)
                .map((b) => ({ value: b.BrandID, label: b.BrandName }))}
                value={
                brands.find((b) => b.BrandID === formData.BrandID) && {
                    value: formData.BrandID,
                    label: brands.find((b) => b.BrandID === formData.BrandID)?.BrandName,
                }
                }
                onChange={(selected) => handleSelectChange(selected, "BrandID")}
                className="basic-single"
                classNamePrefix="react-select"
            />
            <FormError error={errors.BrandID} />
            </div>

            <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Model</label>
            <Select
                options={filteredModels
                .filter((m) => m.IsActive)
                .map((m) => ({ value: m.ModelID, label: m.ModelName }))}
                value={
                filteredModels.find((m) => m.ModelID === formData.ModelID) && {
                    value: formData.ModelID,
                    label: filteredModels.find((m) => m.ModelID === formData.ModelID)?.ModelName,
                }
                }
                onChange={(selected) => handleSelectChange(selected, "ModelID")}
                className="basic-single"
                classNamePrefix="react-select"
                isDisabled={!formData.BrandID}
            />
            <FormError error={errors.ModelID} />
            </div>

            <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Fuel Type</label>
            <Select
                options={fuelTypes
                .filter((f) => f.IsActive)
                .map((f) => ({ value: f.FuelTypeID, label: f.FuelTypeName }))}
                value={
                fuelTypes.find((f) => f.FuelTypeID === formData.FuelTypeID) && {
                    value: formData.FuelTypeID,
                    label: fuelTypes.find((f) => f.FuelTypeID === formData.FuelTypeID)?.FuelTypeName,
                }
                }
                onChange={(selected) => handleSelectChange(selected, "FuelTypeID")}
                className={` basic-single ${errors.FuelTypeID ? "is-invalid" : ""}`}
                classNamePrefix="react-select"
            />
            <FormError error={errors.FuelTypeID} />
            </div>


          <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Service Plan</label>
            <Select
              options={plans.filter((p) => p.isActive).map((p) => ({ value: p.packageID, label: p.packageName }))}
              value={plans.find((p) => p.packageID === formData.PackageID) && {
                value: formData.PackageID,
                label: plans.find((p) => p.packageID === formData.PackageID)?.packageName,
              }}
              className="basic-single"
                        classNamePrefix="react-select"
             onChange={(selected) => handleSelectChange(selected, "PackageID")}
            />
            <FormError error={errors.packageID} />
          </div>

          <div className="col-md-12">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Description</label>
            <textarea
              name="Description"
              className="form-control"
              value={formData.Description}
              onChange={handleChange}
            />
            <FormError error={errors.Description} />
          </div>

         <div className="col-md-6">
  <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Regular Price</label>
  <input
    type="number"
    name="Serv_Reg_Price"
    className="form-control"
    value={formData.Serv_Reg_Price}
    onChange={handleChange}
  />
  <FormError error={errors.Serv_Reg_Price} />
</div>

<div className="col-md-6">
  <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Offer Price</label>
  <input
    type="number"
    name="Serv_Off_Price"
    className="form-control"
    value={formData.Serv_Off_Price}
    onChange={handleChange}
  />
  <FormError error={errors.Serv_Off_Price} />
</div>


          <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Estimated Duration (Minutes)</label>
            <input
              type="number"
              name="EstimatedDurationMinutes"
              className="form-control"
              value={formData.EstimatedDurationMinutes}
              onChange={handleChange}
            />
            <FormError error={errors.EstimatedDurationMinutes} />
          </div>

          <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Upload Image</label>
            <input
              type="file"
              name="ImageURL"
              className={`form-control ${errors.ImageURL ? "is-invalid" : ""}`}
              accept="image/*"
              onChange={handleChange}
            />
           {imagePreview ? (
              <img src={imagePreview} alt="Preview" style={{ height: 80 }} />
            ) : (
              formData.ImageURL && (
                <img
                  src={`${import.meta.env.VITE_APIURL_IMAGE}${formData.ImageURL}`}
                  alt="Preview"
                  style={{ height: 80 }}
                />
              )
            )}
            <FormError error={errors.ImageURL} />
          </div>

          <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Status</label>
            <select
              name="IsActive"
              className="form-select"
              value={formData.IsActive ? "true" : "false"}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="col-12 text-center mt-4">
             <button type='submit' className='btn btn-primary-600 radius-8 px-14 py-6 text-sm mt-3'>
                {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Save"} Price
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicePlanPriceAddLayer;
