import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import Modal from "react-modal";
import Select from 'react-select';

const ServiceSubCategories1Layer = () => {
  const [formData, setFormData] = useState({
    SubCategoryID: "",
    CategoryID: "",
    SubCategoryName: "",
    Description: "",
    IsActive: true,
    IconImage1: "",
    ThumbnailImage1: "",
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filterCategoryID, setFilterCategoryID] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawThumbnailFile, setRawThumbnailFile] = useState(null);

  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}SubCategory1`;
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId");

  const iconInputRef = useRef(null);
const thumbnailInputRef = useRef(null);

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
  }, []);

  const fetchSubCategories = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSubCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load sub categories", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APIURL}Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "icon") {
      setFormData((prev) => ({ ...prev, IconImage1: file }));
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, ThumbnailImage1: file }));
      setRawThumbnailFile(file);
      setCropModalOpen(true);
    }
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropSave = async () => {
    const croppedBlob = await getCroppedImg(URL.createObjectURL(rawThumbnailFile), croppedAreaPixels);
    setThumbnailFile(new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" }));
    setThumbnailPreview(URL.createObjectURL(croppedBlob));
    setCropModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["SubCategoryID", "IsActive"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });
      if (iconFile) form.append("IconImage1", iconFile);
      if (thumbnailFile) form.append("ThumbnailImage1", thumbnailFile);

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      let res;
      if (formData.SubCategoryID) {
        form.append("ModifiedBy", UserId);
        res = await axios.put(`${API_BASE}/UpdateSubCategory1`, form, { headers });
      } else {
        form.append("CreatedBy", UserId);
        res = await axios.post(`${API_BASE}/AddSubCategory1`, form, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire("Success", `Sub Category ${formData.SubCategoryID ? "updated" : "added"} successfully.`, "success");
      } else {
        Swal.fire("Error", data.message || "Failed to save category", "error");
      }

      setFormData({ SubCategoryID: "", CategoryID: "", SubCategoryName: "", Description: "", IsActive: true });
      setIconFile(null);
      setIconPreview("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      fetchSubCategories();
      if (iconInputRef.current) iconInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Save failed", "error");
    }
  };

  const handleEdit = (row) => {
    setFormData({
      SubCategoryID: row.SubCategoryID || "",
      CategoryID: row.CategoryID || "",
      SubCategoryName: row.SubCategoryName || "",
      Description: row.Description || "",
      IsActive: row.IsActive ?? true,
      IconImage1: row.IconImage || "",
      ThumbnailImage1: row.ThumbnailImage || "",
    });
    if (row.IconImage) {
      setIconPreview(`${import.meta.env.VITE_APIURL_IMAGE}CategoryIcon/${row.IconImage}`);
    }
    if (row.ThumbnailImage) {
      setThumbnailPreview(`${import.meta.env.VITE_APIURL_IMAGE}CategoryThumbnail/${row.ThumbnailImage}`);
    }
  };

  const filtredSubCategories = subCategories.filter((sub) => {
    const matchesSearch = sub.SubCategoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategoryID || sub.CategoryID === filterCategoryID;
    const matchesStatus = filterStatus === "" || String(sub.IsActive) === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    { name: "Sub Category ID", selector: (row) => row.SubCategoryID },
    { name: "Sub Category Name", selector: (row) => row.SubCategoryName },
    { name: "Category Name", selector: (row) => row.CategoryName },
    { name: "Description", selector: (row) => row.Description },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-danger">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <Link
          onClick={() => handleEdit(row)}
          className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
        >
          <Icon icon="lucide:edit" />
        </Link>
      ),
    },
  ];

  return (
    <>
      <div className="row gy-4 mt-2">
        <div className="col-xxl-4 col-lg-4">
          <div className="card h-100 p-0">
            <div className="card-body p-24">
              <form onSubmit={handleSubmit} className="form" noValidate>
                <div className="mb-10">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Sub Category Name <span className='text-danger'>*</span></label>
                  <input
                    type="text"
                    name="SubCategoryName"
                    className={`form-control ${errors.SubCategoryName ? "is-invalid" : ""}`}
                    placeholder="Enter Sub Category Name"
                    value={formData.SubCategoryName}
                    onChange={handleChange}
                  />
                  <FormError error={errors.SubCategoryName} />
                </div>

                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Category <span className="text-danger">*</span>
                  </label>
                  <Select
                    name="CategoryID"
                    options={categories.map((c) => ({ value: c.CategoryID, label: c.CategoryName }))}
                    value={
                      categories.find((option) => option.CategoryID === formData.CategoryID)
                        ? {
                            value: formData.CategoryID,
                            label: categories.find((c) => c.CategoryID === formData.CategoryID)?.CategoryName,
                          }
                        : null
                    }
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        CategoryID: selected?.value || "",
                      }))
                    }
                    classNamePrefix="react-select"
                    placeholder="-- Select Category --"
                  />
                  <FormError error={errors.CategoryID} />
                </div>

                <div className="mb-10">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Description <span className='text-danger'>*</span></label>
                  <textarea
                    name="Description"
                    className={`form-control ${errors.Description ? "is-invalid" : ""}`}
                    value={formData.Description}
                    onChange={handleChange}
                  />
                  <FormError error={errors.Description} />
                </div>

                <div className="mb-3">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Icon Image (40x40) <span className='text-danger'>*</span></label>
                  <input
                    ref={iconInputRef}
                    type="file"
                    name="IconImage1"
                    accept="image/*"
                    className={`form-control ${errors.IconImage1 ? "is-invalid" : ""}`}
                    onChange={(e) => handleImageChange(e, "icon")}
                  />
                  <FormError error={errors.IconImage1} />
                  {iconPreview && (
                    <div className="mt-2">
                      <img src={iconPreview} alt="Icon" style={{ width: 40, height: 40, objectFit: "contain" }} />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Thumbnail Image <span className='text-danger'>*</span></label>
                  <input
                      ref={thumbnailInputRef}
                      type="file"
                      name="ThumbnailImage1"
                      accept="image/*"
                      className={`form-control ${errors.ThumbnailImage1 ? "is-invalid" : ""}`}
                      onChange={(e) => handleImageChange(e, "thumbnail")}
                    />
                    <FormError error={errors.ThumbnailImage1} />
                  {thumbnailPreview && (
                    <div className="mt-2">
                      <img src={thumbnailPreview} alt="Thumbnail" style={{ width: 120, height: 80 }} />
                    </div>
                  )}
                </div>

                <div className="mb-20">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Status</label>
                  <select
                    name="IsActive"
                    className="form-select form-control"
                    value={formData.IsActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, IsActive: e.target.value === "true" })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                  {formData.SubCategoryID ? "Update Category" : "Add Category"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xxl-8 col-lg-8">
          <div className="row mb-3">
            <div className="col-md-6">
              <Select
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.filter((b) => b.IsActive).map((c) => ({ value: c.CategoryID, label: c.CategoryName })),
                ]}
                value={
                  filterCategoryID
                    ? {
                        value: filterCategoryID,
                        label:
                          categories.find((c) => c.CategoryID === filterCategoryID)?.CategoryName ||
                          "Selected Category",
                      }
                    : { value: "", label: "All Categories" }
                }
                onChange={(selectedOption) => setFilterCategoryID(selectedOption?.value || "")}
                classNamePrefix="react-select"
                placeholder="Filter by Category"
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search Sub Category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <DataTable
            columns={columns}
            data={filtredSubCategories}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Service Categories available"
          />
        </div>
      </div>

      {/* Crop Modal */}
      <Modal isOpen={cropModalOpen} onRequestClose={() => setCropModalOpen(false)} contentLabel="Crop Image">
        <div style={{ position: "relative", width: "100%", height: 300 }}>
          <Cropper
            image={rawThumbnailFile ? URL.createObjectURL(rawThumbnailFile) : null}
            crop={crop}
            zoom={zoom}
            aspect={3 / 2}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="mt-3 text-end">
          <button onClick={handleCropSave} className="btn btn-primary me-2">Save</button>
          <button onClick={() => setCropModalOpen(false)} className="btn btn-secondary">Cancel</button>
        </div>
      </Modal>
    </>
  );
};

export default ServiceSubCategories1Layer;
