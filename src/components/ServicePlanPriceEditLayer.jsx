import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const ServicePlanPriceEditLayer = ({ setPageTitle }) => {
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
  ImageURL: null,
  IsActive: true,
});
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const userId = localStorage.getItem("userId");

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
      const res = await axios.get(`${API_BASE}PlanPackagePrice/planpackagepriceid?planpackagepriceid=${PlanPackagePriceID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data[0];
      console.log("data", data);
      setFormData({
        PlanPriceID: data.PlanPriceID,
        BrandID: data.BrandID,
        ModelID: data.ModelID,
        FuelTypeID: data.FuelTypeID,
        PackageID: data.PackageID,
        Serv_Reg_Price: data.Serv_Reg_Price,
        Serv_Off_Price: data.Serv_Off_Price,
        ImageURL: data.ImageURL,
        IsActive: data.IsActive,
      });
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

   if (field === "PackageID") {
    const selectedPlan = plans.find((p) => p.PackageID === parseInt(value));
    if (selectedPlan) {
      const includePrices = selectedPlan.IncludePrices
        ?.split(",")
        .map((p) => parseFloat(p.trim())) || [];

      const totalPrice = includePrices.reduce((acc, val) => acc + val, 0);

      setFormData((prev) => ({
        ...prev,
        PackageID: parseInt(value),
        Serv_Reg_Price: totalPrice.toFixed(2),
        Description: selectedPlan.PackageName,
        IsActive: selectedPlan.IsActive,
        CategoryID: selectedPlan.CategoryID,
        SubCategoryID: selectedPlan.SubCategoryID,
      }));
    }
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["IsActive" , "ImageURL"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
if (parseFloat(formData.Serv_Off_Price) > parseFloat(formData.Serv_Reg_Price)) {
  Swal.fire("Validation Error", "Offer Price should be less than or equal to Regular Price.", "warning");
  return;
}
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
        payload.append("ModifiedBy", userId);
        await axios.put(`${API_BASE}PlanPackagePrice/UpdatePlanPackagePrice`, payload, { headers });
      } else {
        
        await axios.post(`${API_BASE}PlanPackagePrice/AddPlanPackagePrice`, payload, { headers });
      }

      
            Swal.fire({
              title: "Success",
              text: `Package price ${isEditing ? "updated" : "added"} successfully!`,
              icon: "success",
              confirmButtonText: "OK",
            }).then((result) => {
              if (result.isConfirmed) {
                 navigate("/service-plan-prices");
              }
            });
     
    } catch (error) {
      console.error("Submit failed", error);
      Swal.fire("Error", error.response.data.error || "Failed to submit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

//   const formattedModels = rawModels.map((model) => ({
//   ...model,
//   FuelTypeIDs: model.FuelTypeIDs
//     ? model.FuelTypeIDs.split(',').map((id) => parseInt(id.trim()))
//     : [],
// }));
// setFilteredModels(formattedModels);

const getFuelTypesByModel = () => {
  const selectedModel = models.find((m) => m.ModelID === formData.ModelID);
  if (!selectedModel) return [];

  return fuelTypes.filter((f) => selectedModel.FuelTypeID?.includes(f.FuelTypeID));
};

  return (
    <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>
        <form onSubmit={handleSubmit} className="row g-3">
    <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Brand</label>
            <Select
  options={brands.map((b) => ({
    value: b.BrandID,
    label: (
      <span>
        {b.BrandName}{" "}
        <span style={{ color: b.IsActive ? "green" : "red" }}>
          ({b.IsActive ? "Active" : "Inactive"})
        </span>
      </span>
    ),
  }))}
  value={
    formData.BrandID
      ? {
          value: formData.BrandID,
          label: (
            <span>
              {brands.find((b) => b.BrandID === formData.BrandID)?.BrandName}{" "}
              <span
                style={{
                  color: brands.find((b) => b.BrandID === formData.BrandID)?.IsActive
                    ? "green"
                    : "red",
                }}
              >
                (
                {brands.find((b) => b.BrandID === formData.BrandID)?.IsActive
                  ? "Active"
                  : "Inactive"}
                )
              </span>
            </span>
          ),
        }
      : null
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
  options={filteredModels.map((m) => ({
    value: m.ModelID,
    label: (
      <span>
        {m.ModelName}{" "}
        <span style={{ color: m.IsActive ? "green" : "red" }}>
          ({m.IsActive ? "Active" : "Inactive"})
        </span>
      </span>
    ),
  }))}
  value={
    formData.ModelID
      ? {
          value: formData.ModelID,
          label: (
            <span>
              {filteredModels.find((m) => m.ModelID === formData.ModelID)?.ModelName}{" "}
              <span
                style={{
                  color: filteredModels.find((m) => m.ModelID === formData.ModelID)
                    ?.IsActive
                    ? "green"
                    : "red",
                }}
              >
                (
                {filteredModels.find((m) => m.ModelID === formData.ModelID)?.IsActive
                  ? "Active"
                  : "Inactive"}
                )
              </span>
            </span>
          ),
        }
      : null
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
                options={fuelTypes.map((f) => ({
                  value: f.FuelTypeID,
                  label:  (
                    <span>
                      {f.FuelTypeName}{" "}
                      <span style={{ color: f.IsActive ? "green" : "red" }}>
                        ({f.IsActive ? "Active" : "Inactive"})
                      </span>
                    </span>
                  ),
                }))}

                value={fuelTypes
                  .map((f) => ({
                    value: f.FuelTypeID,
                    label: (
                      <span>
                        {f.FuelTypeName}{" "}
                        <span style={{ color: f.IsActive ? "green" : "red" }}>
                          ({f.IsActive ? "Active" : "Inactive"})
                        </span>
                      </span>
                    ),
                  }))
                  .find((option) => option.value === formData.FuelTypeID)}
                onChange={(selectedOption) =>
                  setFormData((prev) => ({
                    ...prev,
                    FuelTypeID: selectedOption ? selectedOption.value : "",
                  }))
                }
                classNamePrefix="react-select"
                className={errors.FuelTypeID ? "is-invalid" : ""}
              />


            <FormError error={errors.FuelTypeID} />
            </div>


          <div className="col-md-6">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Service Plan</label>
            <Select
              options={plans.filter((p) => p.IsActive).map((p) => ({ value: p.PackageID, label: p.PackageName }))}
              value={plans.find((p) => p.PackageID === formData.PackageID) && {
                value: formData.PackageID,
                label: plans.find((p) => p.PackageID === formData.PackageID)?.PackageName,
              }}
              className="basic-single"
                        classNamePrefix="react-select"
             onChange={(selected) => handleSelectChange(selected, "PackageID")}
            />
            <FormError error={errors.packageID} />
          </div>

          {/* <div className="col-md-12">
            <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Description</label>
            <textarea
              name="Description"
              className="form-control"
              value={formData.Description}
              onChange={handleChange}
            />
            <FormError error={errors.Description} />
          </div> */}

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


        

          {/* <div className="col-md-6">
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
          </div> */}

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

export default ServicePlanPriceEditLayer;
