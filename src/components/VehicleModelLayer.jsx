import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import Select from 'react-select';
import { usePermissions } from "../context/PermissionContext";

const VehicleModelLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    ModelID: "",
    BrandID: "",
    ModelName: "",
    // VehicleType: "",
    FuelTypeID: "",
    VehicleImages1: null,
    IsActive: true,
  });

  const [model, setModel] = useState([]);
  const [brand, setBrand] = useState([]);
  const [vehicleType, setVehicleType] = useState([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [search, setSearch] = useState("");
  const { errors, validate } = useFormError();
  const token = localStorage.getItem('token');
  const API_BASE = `${import.meta.env.VITE_APIURL}VehicleModels`;
  const API_Brand = `${import.meta.env.VITE_APIURL}VehicleBrands`;
  const API_VehicleType = `${import.meta.env.VITE_APIURL}FuelTypes`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterBrandID, setFilterBrandID] = useState("");

  useEffect(() => {
    fetchModel();
    fetchBrand();
    fetchVehicleType();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, VehicleImages1: file }));
    }
  };

  const fetchModel = async () => {
    try {
      const res = await axios.get(`${API_BASE}/GetListVehicleModel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModel(res.data.data);
    } catch (error) {
      console.error("Failed to load models", error);
    }
  };

  const fetchBrand = async () => {
    try {
      const res = await axios.get(`${API_Brand}/GetVehicleBrands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrand(res.data.data);
    } catch (error) {
      console.error("Failed to load brands", error);
    }
  };



  const fetchVehicleType = async () => {
    try {
      const res = await axios.get(`${API_VehicleType}/GetFuelTypes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicleType(res.data.data);
    } catch (error) {
      console.error("Failed to load vehicle types", error);
    }
  };
  const fuelTypeOptions = vehicleType.map((v) => ({
    value: v.FuelTypeID,
    label: v.FuelTypeName,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // 🔵 Start loading

    const requiredFields = ["ModelID", "IsActive"];
    if (!formData.ModelID && !formData.VehicleImages1) {
      Swal.fire({ icon: "warning", title: "Image Required", text: "Upload vehicle image." });
      return;
    }
    if (!formData.ModelID) requiredFields.push("VehicleImages1");

    const validationErrors = validate(formData, requiredFields);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
      });
      form.append("Status", 1);
      form.append(formData.ModelID ? "ModifiedBy" : "CreatedBy", localStorage.getItem("userId"));

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };
      const res = formData.ModelID
        ? await axios.put(`${API_BASE}/UpdateVehicleModel`, form, { headers })
        : await axios.post(`${API_BASE}/InsertVehicleModel`, form, { headers });

      Swal.fire(res.data.status ? "Success" : "Error", res.data.message, res.data.status ? "success" : "error");

      setFormData({ ModelID: "", BrandID: "", ModelName: "", FuelTypeID: "", VehicleImages1: null, IsActive: true });
      setImagePreviewUrl("");
      fetchModel();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Submit failed", "error");
    }
    finally {
      setIsSubmitting(false); // ✅ Reset button
    }
  };

  const handleEdit = (row) => {
    setFormData({
      ModelID: row.ModelID || "",
      BrandID: row.BrandID || "",
      ModelName: row.ModelName || "",
      FuelTypeID: row.FuelTypeID || "",
      IsActive: row.IsActive ?? true,
      VehicleImages1: row.VehicleImage || null, // Reset to null, don't put the URL string here
    });

    // Set preview only if image exists
    if (row.VehicleImage && typeof row.VehicleImage === "string") {
      const cleanedImagePath = row.VehicleImage.startsWith("/") ? row.VehicleImage.substring(1) : row.VehicleImage;
      setImagePreviewUrl(`${import.meta.env.VITE_APIURL_IMAGE}${encodeURI(cleanedImagePath)}`);
    } else {
      setImagePreviewUrl("");
    }

    console.log(formData);
  };


  const columns = [
    { name: "Model ID", selector: (row) => row.ModelID, sortable: true, },
    {
      name: "Image", 
      selector: (row) => <img
        src={`${import.meta.env.VITE_APIURL_IMAGE}${row.VehicleImage}`}
        alt="Brand Logo"
        style={{ width: 50, height: 50, objectFit: "contain" }}
      />,
      sortable: true,
    },
    { name: "Model Name", selector: (row) => row.ModelName, sortable: true, },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Red
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
      // width: "150px",
      sortable: true,
    },
    ...(hasPermission("vehiclemodel_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div>
          {hasPermission("vehiclemodel_edit") && (
          <Link
            onClick={() => handleEdit(row)}
            className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:edit' />
          </Link>
          )}
          {/* {hasPermission("vehiclemodel_delete") && (
          <Link
            onClick={() => handleDelete(row.StateID , row.StateName)}
            className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
            >
            <Icon icon='mingcute:delete-2-line' />
          </Link>
          )} */}
        </div>
      ),
    },
      ]
    : []),
  ];

  const filteredModel = model.filter((item) => {
    const matchesSearch = search.trim() === "" || item.ModelName.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = filterBrandID === "" || item.BrandID == filterBrandID;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className='row gy-4 mt-2'>
      { (hasPermission("vehiclemodel_add") || hasPermission("vehiclemodel_update")) && (
      <div className='col-xxl-4 col-lg-4'>
        <div className='card h-100'>
          <div className='card-body'>
            <form onSubmit={handleSubmit} className='form' noValidate>
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

              <div className='mb-3'>
                <label
                  htmlFor='format'
                  className='text-sm fw-semibold text-primary-light mb-8'
                >
                  Model Name <span className='text-danger'>*</span>
                </label>
                <input
                  type="text"
                  name="ModelName"
                  className={`form-control ${errors.ModelName ? "is-invalid" : ""}`}
                  placeholder="Enter Model Name"
                  value={formData.ModelName}
                  onChange={handleChange}
                />
                <FormError error={errors.ModelName} />
              </div>

              <div className='mb-3'>
                <label className='text-sm fw-semibold text-primary-light mb-8'>Brand <span className='text-danger'>*</span></label>
                <Select
                  name="BrandID"
                  options={brand.filter(b => b.IsActive === true).map((b) => ({ value: b.BrandID, label: b.BrandName }))}
                  value={brand.find(b => b.BrandID === formData.BrandID) ? { value: formData.BrandID, label: brand.find(b => b.BrandID === formData.BrandID)?.BrandName } : null}
                  onChange={(selected) => setFormData({ ...formData, BrandID: selected?.value || "" })}
                  classNamePrefix="react-select"
                  className={errors.BrandID ? "is-invalid" : ""}
                  placeholder="-- Select Brand --"
                />
                <FormError error={errors.BrandID} />
              </div>

              <div className='mb-3'>
                <label className='text-sm fw-semibold text-primary-light mb-8'>Vehicle Type <span className='text-danger'>*</span></label>
                <Select
                  name="FuelTypeID"
                  options={fuelTypeOptions}
                  value={
                    fuelTypeOptions.find(
                      (option) => String(option.value) === String(formData.FuelTypeID)
                    ) || null
                  }
                  onChange={(selected) =>
                    setFormData({ ...formData, FuelTypeID: selected?.value || "" })
                  }
                  classNamePrefix="react-select"
                  className={errors.FuelTypeID ? "is-invalid" : ""}
                  placeholder="-- Select Fuel Type --"
                />
                <FormError error={errors.FuelTypeID} />
              </div>

              <div className='mb-3'>
                <label className='text-sm fw-semibold text-primary-light mb-8'>Status</label>
                <select className="form-select form-control" value={formData.IsActive ? "true" : "false"} onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "true" })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button
                type='submit'
                className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : formData.ModelID
                    ? "Update Model"
                    : "Add Model"}
              </button>
            </form>
          </div>
        </div>
      </div>
      )}
      <div className='col-xxl-8 col-lg-8'>
        <div className="row ">
          <div className="col-md-6 mb-2">
            <Select
              options={[
                { value: "", label: "All Brands" },
                ...brand.map((state) => ({
                  value: state.BrandID,
                  label: state.BrandName,
                })),
              ]}
              value={
                filterBrandID
                  ? {
                    value: filterBrandID,
                    label:
                      brand.find((s) => s.BrandID === filterBrandID)?.BrandName ||
                      "Selected Brand",
                  }
                  : { value: "", label: "All Brands" }
              }
              onChange={(selectedOption) => setFilterBrandID(selectedOption?.value || "")}
              className="basic-single"
              classNamePrefix="react-select"
              placeholder="Filter by Brand"
            />
          </div>
          <div className="col-md-6 mb-2">
            <input type='text' className='form-control mb-2' placeholder='Search Model...' value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className='chat-main card overflow-hidden'>

          <DataTable
            columns={columns}
            data={filteredModel}
            pagination
            highlightOnHover
            responsive
            striped
            noDataComponent="No Model Found"
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleModelLayer;
