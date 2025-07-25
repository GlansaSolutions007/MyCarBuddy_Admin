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

const ServicePlanAddLayer = ({ setPageTitle }) => {
  const { PackageID } = useParams();
  const isEditing = Boolean(PackageID);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [includes, setIncludes] = useState([]);
  const [selectedIncludes, setSelectedIncludes] = useState([]);
  const { errors, validate, clearAllErrors } = useFormError();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [packageImagePreview, setPackageImagePreview] = useState(null);
const [bannerPreviews, setBannerPreviews] = useState([]);
  
const [formData, setFormData] = useState({
  PackageID: "",
  PackageName: "",
  CategoryID: "",
  SubCategoryID: "",
  IncludeID: [],
  IncludePrices: "",
  TotalPrice:0.00,
  IsActive: true,
  PackageImage: null,
  BannerImages: [],
});

  useEffect(() => {
    setPageTitle(isEditing ? "Edit - Service Plan" : "Add - Service Plan");
    fetchCategories();
    fetchSubCategories();
    fetchIncludes();

    if (isEditing) {
      fetchPlanPackage();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}Category`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}SubCategory1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load sub categories", error);
    }
  };

  const fetchIncludes = async () => {
    try {
      const res = await axios.get(`${API_BASE}Includes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncludes(res.data.data);
    } catch (error) {
      console.error("Failed to load includes", error);
    }
  };
const urlToFile = async (url, filename) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], filename, { type: blob.type });
  return file;
};

const fetchPlanPackage = async () => {
  try {
    const res = await axios.get(`${API_BASE}PlanPackage/GetPlanPackageDetailsByID/${PackageID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const includeIdArray = res.data.includeID
      ? res.data.includeID.split(",").map((id) => parseInt(id))
      : [];

   const bannerURLs = res.data.bannerImage
  ? res.data.bannerImage.split(",").map((imgPath) => `${API_IMAGE}${imgPath.trim()}`)
  : [];

    //  console.log("includeIdArray", res.data.bannerImage);

    // 👇 Convert banner URLs to File objects
    const bannerFiles = await Promise.all(
      bannerURLs.map((url, index) =>
        urlToFile(url, `banner_${index}.${url.split(".").pop()}`)
      )
    );

      let packageImageFile = null;
        if (res.data.packageImage) {
          const packageImageUrl = `${API_IMAGE}${res.data.packageImage}`;
          const ext = res.data.packageImage.split(".").pop().split("?")[0];
          packageImageFile = await urlToFile(packageImageUrl, `package.${ext}`);
        }


     setFormData({
      PackageID: res.data.packageID,
      PackageName: res.data.packageName,
      CategoryID: res.data.categoryID,
      SubCategoryID: res.data.subCategoryID,
      IncludeID: includeIdArray,
      IncludePrices: res.data.includePrices,
      TotalPrice: res.data.totalPrice,
      IsActive: res.data.isActive,
      PackageImage: packageImageFile, // ✅ binary file
      BannerImages: bannerFiles,      // ✅ binary files
    });

    setPackageImagePreview(res.data.packageImage ? `${API_IMAGE}${res.data.packageImage}` : null);
    setBannerPreviews(bannerURLs);
   
    setSelectedIncludes(includeIdArray);
  } catch (error) {
    console.error("Failed to load plan package", error);
  }
};


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
    setFormData((prev) => ({ ...prev, PackageImage: file }));
    setPackageImagePreview(URL.createObjectURL(file));
  }
};
const handleBannerImagesChange = (e) => {
  const files = Array.from(e.target.files);
  const newPreviews = files.map((f) => URL.createObjectURL(f));

  setFormData((prev) => ({
    ...prev,
    BannerImages: [...prev.BannerImages, ...files],
  }));
  setBannerPreviews((prev) => [...prev, ...newPreviews]);
};

const handleRemoveBanner = (index) => {
  setFormData((prev) => {
    const updatedFiles = [...prev.BannerImages];
    updatedFiles.splice(index, 1);
    return { ...prev, BannerImages: updatedFiles };
  });

  setBannerPreviews((prev) => {
    const updatedPreviews = [...prev];
    updatedPreviews.splice(index, 1);
    return updatedPreviews;
  });
};


const handleIncludeChange = (id) => {
  setSelectedIncludes((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
  setFormData((prev) => ({
    ...prev,
    IncludeID: prev.IncludeID.includes(id)
      ? prev.IncludeID.filter((i) => i !== id)
      : [...prev.IncludeID, id],
  }));
};
  const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate(formData, ["PackageID", "IncludePrices"]);
  console.log(validationErrors);
  if (Object.keys(validationErrors).length > 0) return;

  setIsSubmitting(true);
  try {
    const payload = new FormData();
    payload.append("PackageName", formData.PackageName);
    payload.append("CategoryID", formData.CategoryID);
    payload.append("SubCategoryID", formData.SubCategoryID);
    // payload.append("IncludePrices", formData.IncludePrices);
    payload.append("TotalPrice", formData.TotalPrice);
    payload.append("IsActive", formData.IsActive);
    payload.append("PackageImage", formData.PackageImage);
    payload.append("IncludeID", formData.IncludeID.join(","));
    formData.BannerImages.forEach((file) => payload.append("BannerImages", file));
    
    if(isEditing){
      payload.append("PackageID", formData.PackageID);
    }

    const endpoint = isEditing
      ? `${API_BASE}PlanPackage/UpdatePlanPackage`
      : `${API_BASE}PlanPackage/InsertPlanPackage`;

    await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    //confirmation swal
   Swal.fire({
          title: "Success",
          text: `Package ${isEditing ? "updated" : "added"} successfully!`,
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
             navigate("/service-plans");
          }
        });

   
  } catch (err) {
    console.error("Submit failed", err);
    Swal.fire("Error", "Failed to save Plan", "error");
  } finally {
    setIsSubmitting(false);
  }
};

const filteredSubCategories = subCategories.filter(
  (sub) => sub.CategoryID === formData.CategoryID
);
const activeCategories = categories.filter((c) => c.IsActive);

const filteredIncludes = includes
  .filter((inc) => inc.IsActive) // Only active includes
  .filter((inc) =>
    inc.IncludeName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">
          <div className='row'>
            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Package Name <span className='text-danger-600'>*</span></label>
              <input
                type='text'
                name='PackageName'
                className='form-control radius-8'
                value={formData.PackageName}
                onChange={handleChange}
                placeholder='Enter Package Name'
              />
              <FormError error={errors.PackageName} />
            </div>

            <div className='col-sm-6 mt-2'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Category <span className='text-danger-600'>*</span></label>
              <Select
                  name='CategoryID'
                  options={activeCategories.map((c) => ({
                    value: c.CategoryID,
                    label: c.CategoryName,
                  }))}
                  value={
                    formData.CategoryID
                      ? {
                          value: formData.CategoryID,
                          label: activeCategories.find(
                            (c) => c.CategoryID === formData.CategoryID
                          )?.CategoryName,
                        }
                      : null
                  }
                  onChange={(selected) =>
                    handleChange({ target: { name: "CategoryID", value: selected?.value || "" } })
                  }
                  classNamePrefix="react-select"
                  placeholder="-- Select Category --"
                />

              <FormError error={errors.CategoryID} />
            </div>

            <div className='col-sm-6 mt-2'>
                <label className='form-label text-sm fw-semibold text-primary-light mb-8'>
                  Sub Category <span className='text-danger-600'>*</span>
                </label>
                <Select
                    name='SubCategoryID'
                    options={filteredSubCategories.map((c) => ({
                      value: c.SubCategoryID,
                      label: c.SubCategoryName,
                    }))}
                    value={
                      formData.SubCategoryID
                        ? {
                            value: formData.SubCategoryID,
                            label: filteredSubCategories.find(
                              (c) => c.SubCategoryID === formData.SubCategoryID
                            )?.SubCategoryName,
                          }
                        : null
                    }
                    onChange={(selected) =>
                      handleChange({ target: { name: "SubCategoryID", value: selected?.value || "" } })
                    }
                    classNamePrefix="react-select"
                    placeholder="-- Select Subcategory --"
                    isDisabled={!formData.CategoryID}
                  />

                <FormError error={errors.SubCategoryID} />
              </div>


            <div className='col-sm-6 mt-2 d-none'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Price <span className='text-danger-600'>*</span></label>
              <input
                type='text'
                name='TotalPrice'
                className='form-control radius-8'
                value={formData.TotalPrice }
                onChange={handleChange}
                placeholder='Enter Price'
              />
              <FormError error={errors.TotalPrice } />
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

            <div className='col-sm-6 mt-2'>
          <label className='form-label fw-semibold text-primary-light'>Package Image</label>
          <input type='file' accept='image/*' className='form-control' onChange={handleImageChange} />
          {packageImagePreview && (
            <div className='mt-2'>
              <img src={packageImagePreview} alt='Preview' width={120} className='rounded' />
            </div>
          )}
        </div>

<div className='col-sm-6 mt-2'>
  <label className='form-label fw-semibold text-primary-light'>Banner Images</label>
  <input
    type='file'
    accept='image/*'
    className='form-control'
    multiple
    onChange={handleBannerImagesChange}
  />

  {bannerPreviews.length > 0 && (
    <div className='mt-2 d-flex gap-2 flex-wrap'>
      {bannerPreviews.map((src, idx) => (
        <div key={idx} className='position-relative'>
          <img
            src={src}
            alt={`Banner ${idx}`}
            width={100}
            className='rounded border'
            style={{ objectFit: "cover", height: 70 }}
          />
          <button
            type='button'
            className='btn btn-sm btn-danger position-absolute top-0 end-0 p-1'
            onClick={() => handleRemoveBanner(idx)}
            style={{ transform: "translate(30%, -30%)", borderRadius: "50%" }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}
</div>



            <div className='col-12 mt-4'>
  <div className="row">
    {/* Unselected Includes */}
    <div className="col-md-6">
       <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Available Includes</label>
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '12px',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {/* //search includes */}
         <div className='col-auto mb-3'>
             <form className='navbar-search'>
                          <input type='text' name='search' placeholder='Search'   value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
                          <Icon icon='ion:search-outline' className='icon' />
             </form>
         </div>
        {filteredIncludes
          .filter((include) => !selectedIncludes.includes(include.IncludeID))
          .map((include) => (
            <div key={include.IncludeID} className="form-check mb-2">
              <div class="form-check style-check d-flex align-items-center">
                <input class="form-check-input border border-neutral-300" type="checkbox" id={`include-${include.IncludeID}`}
                checked={false}
                onChange={() => handleIncludeChange(include.IncludeID)} />
                <label class="form-check-label" htmlFor={`include-${include.IncludeID}`}> {include.IncludeName}</label>
              </div>
            </div>
          ))}
        {includes.filter((i) => !selectedIncludes.includes(i.IncludeID)).length === 0 && (
          <div className="text-muted text-sm">All includes selected</div>
        )}
      </div>
    </div>

    {/* Selected Includes */}
    <div className="col-md-6">
      <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Selected Includes</label>
      <div
        style={{
          border: '1px solid #4caf50',
          borderRadius: '8px',
          padding: '12px',
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#f9fff9',
        }}
      >
        {includes
          .filter((include) => selectedIncludes.includes(include.IncludeID))
          .map((include) => (
            <div key={include.IncludeID} className="form-check mb-2">

             <div class="form-check style-check d-flex align-items-center">
                <input class="form-check-input border border-neutral-300" type="checkbox" id={`include-${include.IncludeID}`}
                checked={true}
                onChange={() => handleIncludeChange(include.IncludeID)} />
                <label class="form-check-label" for="remeber" htmlFor={`include-${include.IncludeID}`}> {include.IncludeName}</label>
              </div>
            </div>
          ))}
        {selectedIncludes.length === 0 && (
          <div className="text-muted text-sm">No includes selected</div>
        )}
      </div>
    </div>
  </div>
</div>

            <div className='d-flex justify-content-center gap-3 mt-24'>
              <button type='submit' className='btn btn-primary-600 radius-8 px-14 py-6 ' disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Save"} Plan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicePlanAddLayer;
