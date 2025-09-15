import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const ServicePlanPriceAddLayer11 = ({ setPageTitle }) => {
  const { PlanPackagePriceID } = useParams();
  const isEditing = Boolean(PlanPackagePriceID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { errors, validate } = useFormError();
  const [filteredModels, setFilteredModels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [formData, setFormData] = useState({
  BrandID: "",
  PackageID: "",
  IsActive: true,
});
const [priceEntries, setPriceEntries] = useState([]);
const [brandFuelTypes, setBrandFuelTypes] = useState([]);
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

    // Fetch fuel types for the selected brand
    fetchFuelTypesForBrand(formData.BrandID);
  }
}, [models, formData.BrandID]);

  const fetchFuelTypesForBrand = async (brandId) => {
    try {
      // Assuming there's an API endpoint to get fuel types by brand
      const res = await axios.get(`${API_BASE}VehicleBrands/GetFuelTypesByBrand?brandId=${brandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fuelTypesForBrand = res.data.data || res.data;
      setBrandFuelTypes(fuelTypesForBrand);

      // Initialize price entries for each model-fuel type combination
      const modelsForBrand = models.filter((m) => m.BrandID === brandId);
      const initialEntries = [];

      modelsForBrand.forEach(model => {
        fuelTypesForBrand.forEach(fuelType => {
          initialEntries.push({
            ModelID: model.ModelID,
            ModelName: model.ModelName,
            FuelTypeID: fuelType.FuelTypeID,
            FuelTypeName: fuelType.FuelTypeName,
            Serv_Reg_Price: "",
            Serv_Off_Price: "",
          });
        });
      });

      setPriceEntries(initialEntries);
    } catch (error) {
      console.error("Failed to load fuel types for brand", error);
      // Fallback: if API doesn't exist, use all fuel types
      setBrandFuelTypes(fuelTypes);
      const modelsForBrand = models.filter((m) => m.BrandID === brandId);
      const initialEntries = [];

      modelsForBrand.forEach(model => {
        fuelTypes.forEach(fuelType => {
          initialEntries.push({
            ModelID: model.ModelID,
            ModelName: model.ModelName,
            FuelTypeID: fuelType.FuelTypeID,
            FuelTypeName: fuelType.FuelTypeName,
            Serv_Reg_Price: "",
            Serv_Off_Price: "",
          });
        });
      });

      setPriceEntries(initialEntries);
    }
  };

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
      // First, fetch the specific price record to get brand and package info
      const res = await axios.get(`${API_BASE}PlanPackagePrice/planpackagepriceid?planpackagepriceid=${PlanPackagePriceID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data[0];
      console.log("data", data);

      // Set basic form data
      setFormData({
        PlanPriceID: data.PlanPriceID,
        BrandID: data.BrandID,
        PackageID: data.PackageID,
        IsActive: data.IsActive,
      });

      // Fetch all prices for this brand and package combination
      const allPricesRes = await axios.get(`${API_BASE}PlanPackagePrice/GetPricesByBrandAndPackage?brandId=${data.BrandID}&packageId=${data.PackageID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const existingPrices = allPricesRes.data.data || allPricesRes.data || [];

      // Get models and fuel types for the brand
      const modelsForBrand = models.filter((m) => m.BrandID === data.BrandID);
      const fuelTypesForBrand = brandFuelTypes.length > 0 ? brandFuelTypes : fuelTypes;

      // Create price entries with existing data
      const priceEntriesWithData = [];

      modelsForBrand.forEach(model => {
        fuelTypesForBrand.forEach(fuelType => {
          const existingPrice = existingPrices.find(
            (p) => p.ModelID === model.ModelID && p.FuelTypeID === fuelType.FuelTypeID
          );

          priceEntriesWithData.push({
            ModelID: model.ModelID,
            ModelName: model.ModelName,
            FuelTypeID: fuelType.FuelTypeID,
            FuelTypeName: fuelType.FuelTypeName,
            Serv_Reg_Price: existingPrice ? existingPrice.Serv_Reg_Price : "",
            Serv_Off_Price: existingPrice ? existingPrice.Serv_Off_Price : "",
            PlanPriceID: existingPrice ? existingPrice.PlanPriceID : null,
          });
        });
      });

      setPriceEntries(priceEntriesWithData);

      if (data.ImageURL) {
        setImagePreview(`${import.meta.env.VITE_APIURL_IMAGE}${data.ImageURL}`);
      }
    } catch (error) {
      console.error("Failed to load plan price", error);
      // Fallback: try to load basic data
      try {
        const res = await axios.get(`${API_BASE}PlanPackagePrice/planpackagepriceid?planpackagepriceid=${PlanPackagePriceID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data[0];
        setFormData({
          PlanPriceID: data.PlanPriceID,
          BrandID: data.BrandID,
          PackageID: data.PackageID,
          IsActive: data.IsActive,
        });
      } catch (fallbackError) {
        console.error("Fallback fetch also failed", fallbackError);
      }
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

  const handlePriceChange = (fuelTypeId, field, value, modelId) => {
    setPriceEntries(prev => {
      // Check if entry exists for fuelTypeId and modelId
      const existingIndex = prev.findIndex(
        (entry) => entry.FuelTypeID === fuelTypeId && entry.ModelID === modelId
      );
      if (existingIndex !== -1) {
        // Update existing entry
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          [field]: value,
        };
        return updated;
      } else {
        // Add new entry
        return [
          ...prev,
          {
            FuelTypeID: fuelTypeId,
            ModelID: modelId,
            Serv_Reg_Price: field === "Serv_Reg_Price" ? value : "",
            Serv_Off_Price: field === "Serv_Off_Price" ? value : "",
            FuelTypeName: brandFuelTypes.find((f) => f.FuelTypeID === fuelTypeId)?.FuelTypeName || "",
            ModelName: filteredModels.find((m) => m.ModelID === modelId)?.ModelName || "",
          },
        ];
      }
    });
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

    // Validate basic form data
    if (!formData.BrandID || !formData.PackageID) {
      Swal.fire("Validation Error", "Please select Brand and Package", "warning");
      return;
    }

    // Validate price entries
    const invalidEntries = priceEntries.filter(entry =>
      !entry.Serv_Reg_Price || parseFloat(entry.Serv_Off_Price) > parseFloat(entry.Serv_Reg_Price)
    );

    if (invalidEntries.length > 0) {
      Swal.fire("Validation Error", "Please check prices for all fuel types. Offer price should be less than or equal to regular price.", "warning");
      return;
    }

    setIsSubmitting(true);
    const errors = [];
    const successes = [];

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      // Loop through each price entry and submit
      for (const entry of priceEntries) {
        try {
          const payload = new FormData();
          payload.append("BrandID", formData.BrandID);
          payload.append("ModelID", entry.ModelID);
          payload.append("PackageID", formData.PackageID);
          payload.append("FuelTypeID", entry.FuelTypeID);
          payload.append("Serv_Reg_Price", entry.Serv_Reg_Price);
          payload.append("Serv_Off_Price", entry.Serv_Off_Price);
          payload.append("IsActive", formData.IsActive);

          if (isEditing) {
            payload.append("ModifiedBy", userId);
            await axios.put(`${API_BASE}PlanPackagePrice/UpdatePlanPackagePrice`, payload, { headers });
          } else {
            await axios.post(`${API_BASE}PlanPackagePrice/AddPlanPackagePrice`, payload, { headers });
          }

          successes.push(`${entry.ModelName} - ${entry.FuelTypeName}`);
        } catch (error) {
          console.error(`Failed to submit for ${entry.ModelName} - ${entry.FuelTypeName}:`, error);
          errors.push(`${entry.ModelName} - ${entry.FuelTypeName}: ${error.response?.data?.error || "Unknown error"}`);
        }
      }

      // Show results
      if (errors.length === 0) {
        Swal.fire({
          title: "Success",
          text: `All package prices ${isEditing ? "updated" : "added"} successfully!`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/service-plan-prices");
          }
        });
      } else {
        const errorMessage = `Some entries failed:\n${errors.join('\n')}\n\nSuccessful: ${successes.length} entries`;
        Swal.fire({
          title: "Partial Success",
          text: errorMessage,
          icon: "warning",
          confirmButtonText: "OK",
        });
      }

    } catch (error) {
      console.error("Submit failed", error);
      Swal.fire("Error", "Failed to submit", "error");
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
          {/* Package Selection */}
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

          {/* Brand Selection */}
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

          {/* Status */}
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

          {/* Fuel Types Table - Show only after brand is selected */}
          {formData.BrandID && priceEntries.length > 0 && (
            <div className="col-12 mt-4">
              <h6 className="text-primary mb-3">Set Prices for Models and Fuel Types</h6>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Model Name</th>
                      <th>Fuel Type</th>
                      <th>Regular Price</th>
                      <th>Offer Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => (
                      brandFuelTypes.map((fuelType) => {
                        const entry = priceEntries.find(
                          (e) => e.FuelTypeID === fuelType.FuelTypeID && e.ModelID === model.ModelID
                        ) || {
                          FuelTypeID: fuelType.FuelTypeID,
                          FuelTypeName: fuelType.FuelTypeName,
                          ModelID: model.ModelID,
                          ModelName: model.ModelName,
                          Serv_Reg_Price: "",
                          Serv_Off_Price: "",
                        };
                        return (
                          <tr key={`${model.ModelID}-${fuelType.FuelTypeID}`}>
                            <td className="fw-semibold">{model.ModelName}</td>
                            <td className="fw-semibold">{fuelType.FuelTypeName}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Enter regular price"
                                value={entry.Serv_Reg_Price}
                                onChange={(e) => handlePriceChange(fuelType.FuelTypeID, "Serv_Reg_Price", e.target.value, model.ModelID)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Enter offer price"
                                value={entry.Serv_Off_Price}
                                onChange={(e) => handlePriceChange(fuelType.FuelTypeID, "Serv_Off_Price", e.target.value, model.ModelID)}
                                required
                              />
                            </td>
                          </tr>
                        );
                      })
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="col-12 text-center mt-4">
            <button
              type='submit'
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm mt-3'
              disabled={isSubmitting || !formData.BrandID || !formData.PackageID || priceEntries.length === 0}
            >
              {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Save"} Prices
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicePlanPriceAddLayer11;
