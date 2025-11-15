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
    SubCategoryID: "0",
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
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredIncludes, setFilteredIncludes] = useState([]);

  useEffect(() => {
    fetchIncludes();
    fetchCategories();
    fetchSubCategories();
    fetchSkills();
  }, []);

  useEffect(() => {
    let filtered = includes;

    if (selectedCategory && selectedCategory.value !== null) {
      filtered = filtered.filter(inc => inc.CategoryID === selectedCategory.value);
    }

    if (searchText.trim() !== "") {
      filtered = filtered.filter(inc =>
        inc.IncludeName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredIncludes(filtered);
  }, [includes, selectedCategory, searchText]);

  const fetchIncludes = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Sort latest added on top (assuming CreatedDate or IncludeID can be used)
      const sortedIncludes = res.data.data.sort((a, b) => b.IncludeID - a.IncludeID);
      setIncludes(sortedIncludes);
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
      setCategories(res.data);
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
        formData.SubCategoryID = 0;
        const { IncludeID, ...payload } = formData;
        res = await axios.post(API_BASE, payload, { headers });
      }
      const data = res.data;
      if (data.status) {
        Swal.fire(
          "Success",
          data.message || "Include saved successfully",
          "success"
        );
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
      CategoryID: include.CategoryID,
      SubCategoryID: include.SubCategoryID,
      SkillID: include.SkillID
    });
  };

  const columns = [
    { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "Include Name", selector: (row) => row.IncludeName },
    { name: "Price", selector: (row) => `₹ ${parseFloat(row.IncludePrice).toFixed(2)}` },
    { name: "Description", selector: (row) => row.Description },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        const colorMap = {
          Active: "#28A745",   // Green
          Inactive: "#DC3545", // Red
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            {/* Colored Dot */}
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            {/* Status Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
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

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.CategoryID === formData.CategoryID
  );

  return (
    <div className="row gy-4 mt-2">
      <div className="col-xxl-4 col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className="form" noValidate>
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


              <div className='mb-10 d-none'>
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
        <div className="card mb-24">
          <div className="card-body p-24">
            <div className="row gy-4">
              <div className="col-md-6">
                <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                  Search Includes
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by include name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-sm fw-semibold text-primary-light mb-8">
                  Filter by Category
                </label>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={[
                    { value: null, label: "All Categories" },
                    ...categories
                      .sort((a, b) => (b.IsActive === a.IsActive ? 0 : b.IsActive ? 1 : -1))
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
                      }))
                  ]}
                  classNamePrefix="react-select"
                  isClearable
                />
              </div>
            </div>
          </div>
        </div>
        <div className="chat-main card overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredIncludes}
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
