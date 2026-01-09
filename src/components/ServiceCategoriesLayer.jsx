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
import { usePermissions } from "../context/PermissionContext";

const ServiceCategoriesLayer = () => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    CategoryID: "",
    CategoryName: "",
    Description: "",
    IconImage1: "",
    ThumbnailImage1: "",
    IsActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const UserId = localStorage.getItem("userId");

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawThumbnailFile, setRawThumbnailFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}Category`;
  const token = localStorage.getItem("token");

  const iconInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["CategoryID", "IsActive"]);
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
      setIsLoading(true);
      if (formData.CategoryID) {
        form.append("ModifiedBy", UserId);
        res = await axios.put(`${API_BASE}/UpdateCategory`, form, { headers });
      } else {
        form.append("CreatedBy", UserId);
        res = await axios.post(`${API_BASE}/AddCategory`, form, { headers });
      }

      const data = res.data;
      if (data.status) {
        Swal.fire("Success", data.message, "success");
      } else {
        Swal.fire("Error", data.message || "Failed to save category", "error");
      }

      setFormData({ CategoryID: "", CategoryName: "", Description: "", IsActive: true });
      setIconFile(null);
      setIconPreview("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      fetchCategories();
      setIsLoading(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    } catch (error) {
      setIsLoading(false);
      Swal.fire("Error", error.response?.data?.message || "Save failed", "error");
    }
  };

  const handleEdit = (row) => {
    setFormData({
      CategoryID: row.CategoryID,
      CategoryName: row.CategoryName,
      Description: row.Description,
      IsActive: row.IsActive,
      IconImage1: row.IconImage,
      ThumbnailImage1: row.ThumbnailImage,
    });
    if (row.IconImage) {
      setIconPreview(`${import.meta.env.VITE_APIURL_IMAGE}${row.IconImage}`);
    }
    if (row.ThumbnailImage) {
      setThumbnailPreview(`${import.meta.env.VITE_APIURL_IMAGE}${row.ThumbnailImage}`);
    }
  };

  const columns = [
    // { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "Category ID", selector: (row) => row.CategoryID, sortable: true, },
    { name: "Icon Image", selector: (row) => <img src={`${import.meta.env.VITE_APIURL_IMAGE}${row.IconImage}`} alt="" />, sortable: true, },
    { name: "Thumbnail Image", selector: (row) => <img src={`${import.meta.env.VITE_APIURL_IMAGE}${row.ThumbnailImage}`} alt="" />, sortable: true, },
    { name: "Category Name", selector: (row) => row.CategoryName, sortable: true, },
    { name: "Description", selector: (row) => row.Description, sortable: true, },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        // Colors same style as sample
        const colorMap = {
          Active: "#28A745",   // Green
          Inactive: "#E34242", // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span
            className="d-flex align-items-center"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
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
      sortable: true,
    },
    ...(hasPermission("servicecategory_edit")
    ? [
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
    ]
    : []),
  ];

  return (
    <>
      <div className="row gy-4 mt-2">
        { (hasPermission("servicecategory_add") || hasPermission("servicecategory_edit")) && (
        <div className="col-xxl-4 col-lg-4">
          <div className="card h-100 p-0">
            <div className="card-body p-24">
              <form onSubmit={handleSubmit} className="form" noValidate>
                <div className="mb-10">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Category Name <span className='text-danger-600'>*</span></label>
                  <input
                    type="text"
                    name="CategoryName"
                    className={`form-control ${errors.CategoryName ? "is-invalid" : ""}`}
                    placeholder="Enter Category Name"
                    value={formData.CategoryName}
                    onChange={handleChange}
                  />
                  <FormError error={errors.CategoryName} />
                </div>

                <div className="mb-10">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Description <span className='text-danger-600'>*</span></label>
                  <textarea
                    name="Description"
                    className={`form-control ${errors.Description ? "is-invalid" : ""}`}
                    value={formData.Description}
                    onChange={handleChange}
                  />
                  <FormError error={errors.Description} />
                </div>

                <div className="mb-3">
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Icon Image (40x40) <span className='text-danger-600'>*</span></label>
                  <input
                    ref={iconInputRef}
                    type="file"
                    name="IconImage1"
                    className={`form-control ${errors.IconImage1 ? "is-invalid" : ""}`}
                    accept="image/*"
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
                  <label className='text-sm fw-semibold text-primary-light mb-8'>Thumbnail Image <span className='text-danger-600'>*</span></label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    name="ThumbnailImage1"
                    className={`form-control ${errors.ThumbnailImage1 ? "is-invalid" : ""}`}
                    accept="image/*"
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

                <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" disabled={isLoading}>
                  {isLoading ? "Loading..." : formData.CategoryID ? "Update Category" : "Add Category"}
                </button>
              </form>
            </div>
          </div>
        </div>
        )}

        <div className="col-xxl-8 col-lg-8">
          <div className="chat-main card overflow-hidden">
            <DataTable
              columns={columns}
              data={categories}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No Service Categories available"
            />
          </div>
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

export default ServiceCategoriesLayer;
