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
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [faqList, setFaqList] = useState([{ question: "", answer: "" }]);
  const [explanationList, setExplanationList] = useState([{ title: "", details: "" }]);
  const [reviewList, setReviewList] = useState([{ title: "", description: "" }]);



  const [formData, setFormData] = useState({
    PackageID: "",
    PackageName: "",
    CategoryID: "",
    SubCategoryID: "",
    IncludeID: [],
    IncludePrices: "",
    Total_Offer_Price: 0.00,
    Default_Price: 0.00,
    IsActive: true,
    PackageImage: null,
    BannerImages: [],
    EstimatedDurationMinutes: 0
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
      setCategories(res.data);
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

      const includeIdArray = res.data[0].IncludeID
        ? res.data[0].IncludeID.split(",").map((id) => parseInt(id))
        : [];

      const bannerURLs = res.data[0].BannerImage
        ? res.data[0].BannerImage.split(",").map((imgPath) => `${API_IMAGE}${imgPath.trim()}`)
        : [];

      const bannerFiles = await Promise.all(
        bannerURLs.map((url, index) =>
          urlToFile(url, `banner_${index}.${url.split(".").pop()}`)
        )
      );

      let packageImageFile = null;
      if (res.data[0].PackageImage) {
        const packageImageUrl = `${API_IMAGE}${res.data[0].PackageImage}`;
        const ext = res.data[0].PackageImage.split(".").pop().split("?")[0];
        packageImageFile = await urlToFile(packageImageUrl, `package.${ext}`);
      }


      setFormData({
        PackageID: res.data[0].PackageID,
        PackageName: res.data[0].PackageName,
        CategoryID: res.data[0].CategoryID,
        SubCategoryID: res.data[0].SubCategoryID,
        IncludeID: includeIdArray,
        IncludePrices: res.data[0].IncludePrices,
        Total_Offer_Price: res.data[0].Total_Offer_Price,
        Default_Price: res.data[0].Default_Price,
        IsActive: res.data[0].IsActive,
        PackageImage: packageImageFile,
        BannerImages: bannerFiles,
        EstimatedDurationMinutes: res.data[0].EstimatedDurationMinutes
      });

      console.log("Fetched Plan Package:", res.data);

      setPackageImagePreview(res.data[0].PackageImage ? `${API_IMAGE}${res.data[0].PackageImage}` : null);
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
      payload.append("Default_Price", formData.Default_Price);
      payload.append("TotalPrice", formData.Total_Offer_Price);
      payload.append("IsActive", formData.IsActive);
      payload.append("PackageImage", formData.PackageImage);
      payload.append("IncludeID", formData.IncludeID.join(","));
      formData.BannerImages.forEach((file) => payload.append("BannerImages", file));
      payload.append("EstimatedDurationMinutes", formData.EstimatedDurationMinutes);


      if (isEditing) {
        payload.append("PackageID", formData.PackageID);
        payload.append("ModifiedBy", '0');

      }
      else {
        payload.append("CreatedBy", '0');
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
    .filter((inc) => inc.CategoryID === formData.CategoryID)
    .filter((inc) => inc.IsActive) // Only active includes
    .filter((inc) =>
      inc.IncludeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  return (
    <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>

        {showInfoPanel && (
          <div
            className="w-100 bg-light border rounded d-flex justify-content-center align-items-center gap-3 p-3 mb-3 shadow-sm"
            style={{ minHeight: "70px" }}
          >
            <button
              type="button"
              className="btn btn-primary radius-8 px-14 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm"
              onClick={() => setActivePanel("faq")}
            >
              <i className="bi bi-question-circle-fill"></i>
              FAQ’s
            </button>

            <button
              type="button"
              className="btn btn-success radius-8 px-14 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm"
              onClick={() => setActivePanel("explanation")}
            >
              <i className="bi bi-info-circle-fill"></i>
              Explanations
            </button>

            <button
              type="button"
              className="btn btn-warning radius-8 px-14 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm text-dark"
              onClick={() => setActivePanel("reviews")}
            >
              <i className="bi bi-star-fill"></i>
              Reviews
            </button>
          </div>

        )}




        {!activePanel ? (
          // === Default form section ===
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
                <div className='mb-10'>
                  <label className='form-label text-sm fw-semibold text-primary-light mb-8'>
                    Category <span className='text-danger-600'>*</span>
                  </label>
                  <Select
                    name='CategoryID'
                    options={categories
                      .sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1)) // Sort active first
                      .map((c) => ({
                        value: c.CategoryID,
                        label: (
                          <span>
                            {c.CategoryName}{" "}
                            <span style={{ color: c.IsActive ? "green" : "red" }}>
                              ({c.IsActive ? "Active" : "Inactive"})
                            </span>
                          </span>
                        ),
                        name: c.CategoryName,
                        status: c.IsActive,
                      }))}
                    value={
                      formData.CategoryID
                        ? {
                          value: formData.CategoryID,
                          label: (
                            <span>
                              {
                                categories.find((c) => c.CategoryID === formData.CategoryID)
                                  ?.CategoryName
                              }{" "}
                              <span
                                style={{
                                  color: categories.find(
                                    (c) => c.CategoryID === formData.CategoryID
                                  )?.IsActive
                                    ? "green"
                                    : "red",
                                }}
                              >
                                (
                                {categories.find(
                                  (c) => c.CategoryID === formData.CategoryID
                                )?.IsActive
                                  ? "Active"
                                  : "Inactive"}
                                )
                              </span>
                            </span>
                          ),
                        }
                        : null
                    }
                    onChange={(selected) =>
                      handleChange({
                        target: { name: "CategoryID", value: selected?.value || "" },
                      })
                    }
                    classNamePrefix="react-select"
                  />
                  <FormError error={errors.CategoryID} />
                </div>

              </div>

              <div className='col-sm-6 mt-2'>
                <div className='mb-10'>
                  <label className='form-label text-sm fw-semibold text-primary-light mb-8'>
                    Sub Category <span className='text-danger-600'>*</span>
                  </label>
                  <Select
                    name='SubCategoryID'
                    options={filteredSubCategories
                      .sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1)) // Sort: active first
                      .map((c) => ({
                        value: c.SubCategoryID,
                        label: (
                          <span>
                            {c.SubCategoryName}{" "}
                            <span style={{ color: c.IsActive ? "green" : "red" }}>
                              ({c.IsActive ? "Active" : "Inactive"})
                            </span>
                          </span>
                        ),
                      }))}
                    value={
                      formData.SubCategoryID
                        ? {
                          value: formData.SubCategoryID,
                          label: (
                            <span>
                              {
                                subCategories.find(
                                  (c) => c.SubCategoryID === formData.SubCategoryID
                                )?.SubCategoryName
                              }{" "}
                              <span
                                style={{
                                  color: subCategories.find(
                                    (c) => c.SubCategoryID === formData.SubCategoryID
                                  )?.IsActive
                                    ? "green"
                                    : "red",
                                }}
                              >
                                (
                                {subCategories.find(
                                  (c) => c.SubCategoryID === formData.SubCategoryID
                                )?.IsActive
                                  ? "Active"
                                  : "Inactive"}
                                )
                              </span>
                            </span>
                          ),
                        }
                        : null
                    }
                    onChange={(selected) =>
                      handleChange({
                        target: { name: "SubCategoryID", value: selected?.value || "" },
                      })
                    }
                    classNamePrefix="react-select"
                  />
                  <FormError error={errors.SubCategoryID} />
                </div>
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

              <div className="col-md-6">
                <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  name="EstimatedDurationMinutes"
                  className="form-control"
                  value={formData.EstimatedDurationMinutes}
                  onChange={handleChange}
                  min="60"
                />
                <FormError error={errors.EstimatedDurationMinutes} />
              </div>


              <div className="col-md-6">
                <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Regular Price</label>
                <input
                  type="number"
                  name="Default_Price"
                  className="form-control"
                  value={formData.Default_Price}
                  onChange={handleChange}
                />
                <FormError error={errors.Default_Price} />
              </div>

              <div className="col-md-6">
                <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Offer Price</label>
                <input
                  type="number"
                  name="Total_Offer_Price"
                  className="form-control"
                  value={formData.Total_Offer_Price}
                  onChange={handleChange}
                />
                <FormError error={errors.Total_Offer_Price} />
              </div>


              <div className="col-md-6">
                {/* <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                  Show Info Panel
                </label>
                <div className="form-check d-flex align-items-center mt-2">
                  <input
                    type="checkbox"
                    id="showInfoPanel"
                    checked={showInfoPanel}
                    onChange={(e) => setShowInfoPanel(e.target.checked)}
                    className="form-check-input me-2"
                    style={{ width: "18px", height: "18px" }}
                  />
                  <label
                    htmlFor="showInfoPanel"
                    className="form-check-label fw-medium text-dark"
                    style={{ marginTop: "2px" }}
                  >
                    Enable
                  </label>
                </div> */}
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
                          <input type='text' name='search' placeholder='Search' value={searchTerm}
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
                <button
                  type="button"
                  className="btn btn-secondary radius-8 px-14 py-6"
                  onClick={() => navigate("/service-plans")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (

          <>

            {/* === Panel view === */}
            < div className="text-center py-4 px-3">
              <h5 className="mb-4 text-capitalize">
                {activePanel === "faq" && "FAQ Section"}
                {activePanel === "explanation" && "Explanation Section"}
                {activePanel === "reviews" && "Reviews Section"}
              </h5>

              <div className="row justify-content-center">
                <div className="col-md-8 text-start">

                  {/* === Render Multiple Items === */}
                  {(activePanel === "faq" ? faqList : activePanel === "explanation" ? explanationList : reviewList)
                    .map((item, index) => (
                      <div key={index} className="border rounded-3 p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-semibold mb-0">#{index + 1}</h6>
                          {index > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 px-10 py-2 radius-8"
                              onClick={() => {
                                if (activePanel === "faq")
                                  setFaqList(faqList.filter((_, i) => i !== index));
                                else if (activePanel === "explanation")
                                  setExplanationList(explanationList.filter((_, i) => i !== index));
                                else setReviewList(reviewList.filter((_, i) => i !== index));
                              }}
                            >
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          )}
                        </div>

                        {/* Question / Title Input */}
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            {activePanel === "faq"
                              ? "Question"
                              : activePanel === "explanation"
                                ? "Title"
                                : "Review Title"}
                          </label>
                          <input
                            type="text"
                            className="form-control radius-8"
                            placeholder={
                              activePanel === "faq"
                                ? "Enter question"
                                : activePanel === "explanation"
                                  ? "Enter explanation title"
                                  : "Enter review title"
                            }
                            value={
                              activePanel === "faq"
                                ? item.question
                                : activePanel === "explanation"
                                  ? item.title
                                  : item.title
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (activePanel === "faq") {
                                const updated = [...faqList];
                                updated[index].question = value;
                                setFaqList(updated);
                              } else if (activePanel === "explanation") {
                                const updated = [...explanationList];
                                updated[index].title = value;
                                setExplanationList(updated);
                              } else {
                                const updated = [...reviewList];
                                updated[index].title = value;
                                setReviewList(updated);
                              }
                            }}
                          />
                        </div>

                        {/* Answer / Details Input */}
                        <div>
                          <label className="form-label fw-semibold">
                            {activePanel === "faq"
                              ? "Answer"
                              : activePanel === "explanation"
                                ? "Details"
                                : "Description"}
                          </label>
                          <textarea
                            rows={3}
                            className="form-control radius-8"
                            placeholder={
                              activePanel === "faq"
                                ? "Enter answer"
                                : activePanel === "explanation"
                                  ? "Enter details"
                                  : "Enter review description"
                            }
                            value={
                              activePanel === "faq"
                                ? item.answer
                                : activePanel === "explanation"
                                  ? item.details
                                  : item.description
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (activePanel === "faq") {
                                const updated = [...faqList];
                                updated[index].answer = value;
                                setFaqList(updated);
                              } else if (activePanel === "explanation") {
                                const updated = [...explanationList];
                                updated[index].details = value;
                                setExplanationList(updated);
                              } else {
                                const updated = [...reviewList];
                                updated[index].description = value;
                                setReviewList(updated);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}

                  {/* === Add More Button === */}
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2 mt-2 px-10 py-2 radius-8"
                    onClick={() => {
                      if (activePanel === "faq")
                        setFaqList([...faqList, { question: "", answer: "" }]);
                      else if (activePanel === "explanation")
                        setExplanationList([...explanationList, { title: "", details: "" }]);
                      else setReviewList([...reviewList, { title: "", description: "" }]);
                    }}
                  >
                    <i className="bi bi-plus-circle"></i> Add New
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-center gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-primary-600 radius-8 px-14 py-6 d-flex align-items-center gap-2"
                  onClick={() => {
                    console.log({
                      faqs: faqList,
                      explanations: explanationList,
                      reviews: reviewList,
                    });
                    Swal.fire("Saved!", "Data stored locally for now.", "success");
                  }}
                >
                  <i className="bi bi-check-circle"></i>
                  Save {activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary radius-8 px-14 py-6 d-flex align-items-center gap-2"
                  onClick={() => setActivePanel(null)}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

      </div >
    </div >
  );
};

export default ServicePlanAddLayer;
