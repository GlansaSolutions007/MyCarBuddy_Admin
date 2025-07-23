import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import Select from "react-select";

const IncludesLayer = () => {
  const [formData, setFormData] = useState({
    IncludeID: "",
    IncludeName: "",
    Description: "",
    IncludePrice: "",
    CategoryID: "",
    SubCategoryID: "",
    SkillID: "",
    IsActive: true,
  });

  const [includes, setIncludes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const { errors, validate } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}Includes`;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills , setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    fetchIncludes();
    fetchCategories();
    fetchSubCategories();
    fetchSkills();
  }, []);

  const fetchIncludes = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIncludes(res.data.data);
    } catch (error) {
      console.error("Failed to load includes", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APIURL}Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_APIURL}SubCategory1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSubCategories(res.data.data);
    } catch (error) {
      console.error("Failed to load sub categories", error);
    }
  };

  const fetchSkills = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}Skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSkills(res.data || []);
  } catch (error) {
    console.error("Failed to load skills", error);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["IncludeID", "IsActive"]);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      let res;
      if (formData.IncludeID) {
        formData.ModifiedBy = userId;
        // const { IncludeID, ...payload } = formData;
        res = await axios.put(API_BASE, formData, { headers });
      } else {
        formData.CreatedBy = userId;
        const { IncludeID, ...payload } = formData;
        res = await axios.post(API_BASE, payload, { headers });
      }
      const data = res.data;
      if (data.status) {
        Swal.fire("Success", "Include saved successfully", "success");
      } else {
        Swal.fire("Error", data.message || "Failed to save include", "error");
      }
      setFormData({
        IncludeID: "",
        IncludeName: "",
        Description: "",
        IncludePrice: "",
        IsActive: true,
      });
      fetchIncludes();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Save failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (include) => {
    setFormData({
      IncludeID: include.IncludeID,
      IncludeName: include.IncludeName,
      Description: include.Description,
      IncludePrice: include.IncludePrice,
      IsActive: include.IsActive,
    });
  };

  const columns = [
    { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "Include Name", selector: (row) => row.IncludeName },
    { name: "Price", selector: (row) => `₹ ${parseFloat(row.IncludePrice).toFixed(2)}` },
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
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className='mb-10'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Category <span className='text-danger-600'>*</span></label>
              <Select
                name='CategoryID'
                options={categories.map((c) => ({ value: c.CategoryID, label: c.CategoryName }))}
                value={
                  formData.CategoryID
                    ? {
                        value: formData.CategoryID,
                        label: categories.find((c) => c.CategoryID === formData.CategoryID)?.CategoryName,
                      }
                    : null
                }
                onChange={(selected) => handleChange({ target: { name: "CategoryID", value: selected?.value || "" } })}
                classNamePrefix="react-select"
              />
              <FormError error={errors.CategoryID} />
            </div>

            <div className='mb-10'>
              <label className='form-label text-sm fw-semibold text-primary-light mb-8'>Sub Category <span className='text-danger-600'>*</span></label>
              <Select
                name='SubCategoryID'
                options={subCategories.map((c) => ({ value: c.SubCategoryID, label: c.SubCategoryName }))}
                value={
                  formData.SubCategoryID
                    ? {
                        value: formData.SubCategoryID,
                        label: subCategories.find((c) => c.SubCategoryID === formData.SubCategoryID)?.SubCategoryName,
                      }
                    : null
                }
                onChange={(selected) => handleChange({ target: { name: "SubCategoryID", value: selected?.value || "" } })}
                classNamePrefix="react-select"
              />
              <FormError error={errors.SubCategoryID} />
            </div>

            <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Skills <span className="text-danger">*</span>
                </label>
                <Select
                    name="SkillID"
                    options={skills.map((c) => ({ value: c.SkillID, label: c.SkillName }))}
                    value={
                      formData.SkillID
                        ? {
                            value: formData.SkillID,
                            label: skills.find((c) => c.SkillID === formData.SkillID)?.SkillName,
                          }
                        : null
                    }
                    onChange={(selected) => handleChange({ target: { name: "SkillID", value: selected?.value || "" } })}
                    classNamePrefix="react-select"
                  />
                  <FormError error={errors.SkillID} />

              </div>

              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Include Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="IncludeName"
                  className={`form-control ${errors.IncludeName ? "is-invalid" : ""}`}
                  placeholder="Enter include name"
                  value={formData.IncludeName}
                  onChange={handleChange}
                />
                <FormError error={errors.IncludeName} />
              </div>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Price  <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="IncludePrice"
                  className={`form-control ${errors.IncludePrice ? "is-invalid" : ""}`}
                  placeholder="Enter price"
                  value={formData.IncludePrice}
                  onChange={handleChange}
                />
                <FormError error={errors.IncludePrice} />
              </div>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Description
                </label>
                <textarea
                  name="Description"
                  className={`form-control ${errors.Description ? "is-invalid" : ""}`}
                  value={formData.Description}
                  onChange={handleChange}
                ></textarea>
                <FormError error={errors.Description} />
              </div>
              <div className="mb-20">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Status
                </label>
                <select
                  name="IsActive"
                  className="form-select form-control"
                  value={formData.IsActive ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, IsActive: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                {isSubmitting ? "Saving..." : formData.IncludeID ? "Update Include" : "Add Include"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-xxl-8 col-lg-8">
        <div className="chat-main card overflow-hidden">
          <DataTable
            columns={columns}
            data={includes}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No includes available"
          />
        </div>
      </div>
    </div>
  );
};

export default IncludesLayer;
