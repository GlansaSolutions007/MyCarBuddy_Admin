import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";
import { useSearchParams, useNavigate } from "react-router-dom";

const ExplanationsAddLayer = () => {
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [explanationType, setExplanationType] = useState("category");

  const API_BASE = `${import.meta.env.VITE_APIURL}`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      await fetchAllCategories();
      const packagesData = await fetchAllPackages();
      if (isEditMode) {
        fetchExplanation(editId, packagesData);
      }
    };
    loadData();
  }, [isEditMode, editId]);

  useEffect(() => {
    setExplanations([]);
    setSelectedCategory(null);
    setSelectedPackage(null);
  }, [explanationType]);

  const fetchAllPackages = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}PlanPackage/GetPlanPackagesDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const packagesData = res.data.map((pkg) => ({
        value: pkg.PackageID,
        label: pkg.PackageName,
      }));
      setPackages(packagesData);
      return packagesData;
    } catch (error) {
      console.error("Failed to load all packages", error);
      return [];
    }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}Category`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoriesData = res.data.map((cat) => ({
        value: cat.CategoryID,
        label: cat.CategoryName,
      }));
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error("Failed to load all categories", error);
      return [];
    }
  };

  const fetchExplanation = async (id, packagesData) => {
    try {
      const res = await axios.get(`${API_BASE}Explanations?Id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const explanation = Array.isArray(res.data) ? res.data[0] : res.data;

      if (!explanation) {
        Swal.fire("Error", "No Explanation found", "error");
        return;
      }

      setSelectedPackage({
        value: explanation.PackageID,
        label: packagesData.find((p) => p.value === explanation.PackageID)?.label || "",
      });

      setQuestion(explanation.Question);
      setAnswer(explanation.Explanation);
    } catch (error) {
      console.error("Failed to load Explanation", error);
      Swal.fire("Error", "Failed to load Explanation", "error");
    }
  };

  const handleAddExplanation = () => {
    if (
      explanationType === "category" &&
      (!selectedCategory || !question.trim() || !answer.trim())
    ) {
      Swal.fire("Error", "Please fill category, question, and explanation", "error");
      return;
    }
    if (
      explanationType === "package" &&
      (!selectedPackage || !question.trim() || !answer.trim())
    ) {
      Swal.fire("Error", "Please fill package, question, and explanation", "error");
      return;
    }
    const newExplanation = {
      explanationType,
      categoryId: selectedCategory?.value || null,
      categoryName: selectedCategory?.label || "",
      packageId: selectedPackage?.value || null,
      packageName: selectedPackage?.label || "",
      question: question.trim(),
      answer: answer.trim(),
    };
    setExplanations([...explanations, newExplanation]);
    setQuestion("");
    setAnswer("");
    setSelectedCategory(null);
    setSelectedPackage(null);
  };

  const handleRemoveExplanation = (index) => {
    setExplanations(explanations.filter((_, i) => i !== index));
  };

  const handleSaveExplanations = async () => {
    if (explanations.length === 0) {
      Swal.fire("Error", "No Explanations to save", "error");
      return;
    }

    setLoading(true);

    try {
      // Group by each row's own type and ID
      const grouped = explanations.reduce((acc, explanation) => {
        const key =
          explanation.explanationType === "category"
            ? `cat-${explanation.categoryId}`
            : `pkg-${explanation.packageId}`;

        if (!acc[key]) {
          acc[key] = {
            explanationType: explanation.explanationType,
            id: explanation.explanationType === "category" ? explanation.categoryId : explanation.packageId,
            explanations: [],
          };
        }

        acc[key].explanations.push({
          question: explanation.question,
          explanation: explanation.answer,
        });

        return acc;
      }, {});

      // Send API call group-wise
      for (const key in grouped) {
        const group = grouped[key];

        const payload =
          group.explanationType === "category"
            ? { categoryID: group.id, explanations: group.explanations }
            : { packageID: group.id, explanations: group.explanations };

        await axios.post(`${API_BASE}Explanations`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Swal.fire("Success", "Explanations saved successfully", "success");
      setExplanations([]);
      setSelectedCategory(null);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Failed to save Explanations", error);
      Swal.fire("Error", "Failed to save Explanations", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExplanation = async () => {
    if (!selectedPackage || !question.trim() || !answer.trim()) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: parseInt(editId),
        question: question.trim(),
        explanation: answer.trim(),
        packageID: selectedPackage.value,
      };

      await axios.put(`${API_BASE}Explanations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Explanation updated successfully", "success");
      navigate("/explanations");
    } catch (error) {
      console.error("Failed to update Explanation", error);
      Swal.fire("Error", "Failed to update Explanation", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: explanationType === "category" ? "Category" : "Package",
      selector: (row) =>
        explanationType === "category" ? row.categoryName : row.packageName,
      sortable: true,
      width: "20%",
    },
    {
      name: "Question",
      selector: (row) => row.question,
      wrap: true,
      width: "30%",
    },
    {
      name: "Explanation",
      selector: (row) => row.answer,
      wrap: true,
      width: "40%",
    },
    {
      name: "Actions",
      cell: (row, index) => (
        <button
          className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
          onClick={() => handleRemoveExplanation(index)}
        >
          <Icon icon="mingcute:delete-2-line" />
        </button>
      ),
      width: "10%",
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="d-flex">
                  <label className="form-label d-flex align-items-center gap-2 col-6">
                    <input
                      type="radio"
                      name="explanationType"
                      value="category"
                      checked={explanationType === "category"}
                      onChange={(e) => setExplanationType(e.target.value)}
                      className="form-check-input"
                      style={{ accentColor: "black" }}
                    />
                    Add Explanation for Category
                  </label>
                  <label className="form-label d-flex align-items-center gap-2 col-6">
                    <input
                      type="radio"
                      name="explanationType"
                      value="package"
                      checked={explanationType === "package"}
                      onChange={(e) => setExplanationType(e.target.value)}
                      className="form-check-input"
                    />
                    Add Explanation for Package
                  </label>
                </div>
              </div>
              {explanationType === "category" && (
                <div className="col-md-12">
                  <label className="form-label">Select Category</label>
                  <Select
                    options={categories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="Type to search and select category"
                    isSearchable={true}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              {explanationType === "package" && (
                <div className="col-md-12">
                  <label className="form-label">Select Package</label>
                  <Select
                    options={packages}
                    value={selectedPackage}
                    onChange={setSelectedPackage}
                    placeholder="Type to search and select package"
                    isSearchable={true}
                    className="react-select-container text-sm"
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              <div className="col-12">
                <label className="form-label">Question</label>
                <input
                  type="text"
                  className="form-control"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter question"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Explanation</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter explanation"
                />
              </div>
              {!isEditMode && hasPermission("explanations_add") && (
                <div className="col-12 d-flex justify-content-end mb-10">
                  <button
                    className="btn btn-primary radius-8 px-14 py-2 d-flex align-items-center"
                    onClick={handleAddExplanation}
                  >
                    <Icon icon="ic:baseline-plus" />
                    Add
                  </button>
                </div>
              )}
              {isEditMode && hasPermission("explanations_edit") && (
                <div className="col-12 d-flex justify-content-center mb-10">
                  <button
                    className="btn btn-primary-600 radius-8 px-10 py-4 d-flex align-items-center gap-2"
                    onClick={handleUpdateExplanation}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Explanation"}
                  </button>
                </div>
              )}
            </div>
            {!isEditMode && (
              <>
                <hr />
                <DataTable
                  columns={columns}
                  data={explanations}
                  pagination
                  highlightOnHover
                  responsive
                  striped
                  persistTableHead
                  noDataComponent="No Explanations added yet"
                />
                {explanations.length > 0 && (
                  <div className="d-flex justify-content-center mt-3">
                    {hasPermission("explanations_add") && (
                      <button
                        className="btn btn-primary-600 radius-8 px-10 py-4 d-flex align-items-center gap-2"
                        onClick={handleSaveExplanations}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Explanations"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationsAddLayer;
