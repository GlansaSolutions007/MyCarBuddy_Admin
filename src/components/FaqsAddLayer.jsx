import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";
import { useSearchParams, useNavigate } from "react-router-dom";

const FaqsAddLayer = () => {
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
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faqType, setFaqType] = useState("package");

  const API_BASE = `${import.meta.env.VITE_APIURL}`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      const packagesData = await fetchAllPackages();
      const categoriesData = await fetchAllCategories();

      if (isEditMode) {
        await fetchFaq(editId, packagesData, categoriesData);
      }
    };
    loadData();
  }, [isEditMode, editId]);

  useEffect(() => {
    if (!isEditMode) {
      setFaqs([]);
      setSelectedCategory(null);
      setSelectedPackage(null);
    }
  }, [faqType, isEditMode]);

  const fetchAllPackages = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}PlanPackage/GetPlanPackagesDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
       const packagesData = res.data
      .filter((pkg) => pkg.IsActive === true)
      .map((pkg) => ({
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
      const categoriesData = res.data
      .filter((cat) => cat.IsActive === true)
      .map((cat) => ({
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

  const fetchFaq = async (id, packagesData, categoriesData) => {
    try {
      const res = await axios.get(`${API_BASE}FAQS?Id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const faq = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!faq) {
        Swal.fire("Error", "No FAQ found", "error");
        return;
      }

      setQuestion(faq.Question);
      setAnswer(faq.Answer);

      // Identify FAQ belongs to category or package
      if (faq.Type === "category") {
        setFaqType("category");

        const match = categoriesData.find(
          (c) => Number(c.value) === Number(faq.PackageID)
        );

        setSelectedCategory(match || null);
        setSelectedPackage(null);
      } else if (faq.Type === "package") {
        setFaqType("package");

        const match = packagesData.find(
          (p) => Number(p.value) === Number(faq.PackageID)
        );

        setSelectedPackage(match || null);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Failed to load FAQ", error);
      Swal.fire("Error", "Failed to load FAQ", "error");
    }
  };

  const handleAddFaq = () => {
    if (
      faqType === "category" &&
      (!selectedCategory || !question.trim() || !answer.trim())
    ) {
      Swal.fire("Error", "Please fill category, question, and answer", "error");
      return;
    }
    if (
      faqType === "package" &&
      (!selectedPackage || !question.trim() || !answer.trim())
    ) {
      Swal.fire("Error", "Please fill package, question, and answer", "error");
      return;
    }
    const newFaq = {
      faqType,
      categoryId: selectedCategory?.value || null,
      categoryName: selectedCategory?.label || "",
      packageId: selectedPackage?.value || null,
      packageName: selectedPackage?.label || "",
      question: question.trim(),
      answer: answer.trim(),
    };
    setFaqs([...faqs, newFaq]);
    setQuestion("");
    setAnswer("");
    setSelectedCategory(null);
    setSelectedPackage(null);
  };

  const handleRemoveFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleSaveFaqs = async () => {
    if (faqs.length === 0) {
      Swal.fire("Error", "No FAQs to save", "error");
      return;
    }

    setLoading(true);

    try {
      const grouped = faqs.reduce((acc, faq) => {
        const key =
          faq.faqType === "category"
            ? `cat-${faq.categoryId}`
            : `pkg-${faq.packageId}`;

        if (!acc[key]) {
          acc[key] = {
            faqType: faq.faqType,
            id: faq.faqType === "category" ? faq.categoryId : faq.packageId,
            faqs: [],
          };
        }

        acc[key].faqs.push({
          question: faq.question,
          answer: faq.answer,
        });

        return acc;
      }, {});

      for (const key in grouped) {
        const group = grouped[key];
        // FINAL PAYLOAD FORMAT EXPECTED BY API
        const payload = {
          type: group.faqType, // "category" or "package"
          packageID: group.id, // categoryID OR packageID
          faQs: group.faqs,
        };

        await axios.post(`${API_BASE}FAQS`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      Swal.fire("Success", "FAQs saved successfully", "success");
      setFaqs([]);
      setSelectedCategory(null);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Failed to save FAQs", error);
      Swal.fire("Error", "Failed to save FAQs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFaq = async () => {
    if (
      (faqType === "package" && !selectedPackage) ||
      (faqType === "category" && !selectedCategory) ||
      !question.trim() ||
      !answer.trim()
    ) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: parseInt(editId),
        question: question.trim(),
        answer: answer.trim(),
        type: faqType,
        packageID:
          faqType === "package"
            ? selectedPackage?.value
            : selectedCategory?.value,
      };

      await axios.put(`${API_BASE}FAQS`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "FAQ updated successfully", "success");
      navigate("/faqs");
    } catch (error) {
      console.error("Failed to update FAQ", error);
      Swal.fire("Error", "Failed to update FAQ", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      name: faqType === "category" ? "Category" : "Package",
      selector: (row) =>
        faqType === "category" ? row.categoryName : row.packageName,
      sortable: true,
      width: "20%",
    },
    {
      name: "Question",
      selector: (row) => row.question,
      wrap: true,
      width: "30%",
      sortable: true,
    },
    {
      name: "Explanation",
      selector: (row) => row.answer,
      wrap: true,
      width: "40%",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row, index) => (
        <button
          className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
          onClick={() => handleRemoveFaq(index)}
        >
          <Icon icon="mingcute:delete-2-line" />
        </button>
      ),
      width: "10%",
      sortable: true,
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
                      name="faqType"
                      value="category"
                      checked={faqType === "category"}
                      onChange={(e) => setFaqType(e.target.value)}
                      className="form-check-input"
                      style={{ accentColor: "black" }}
                    />
                    Add FAQ for Category
                  </label>
                  <label className="form-label d-flex align-items-center gap-2 col-6">
                    <input
                      type="radio"
                      name="faqType"
                      value="package"
                      checked={faqType === "package"}
                      onChange={(e) => setFaqType(e.target.value)}
                      className="form-check-input"
                    />
                    Add FAQ for Package
                  </label>
                </div>
              </div>
              {faqType === "category" && (
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

              {faqType === "package" && (
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
                  placeholder="Enter answer"
                />
              </div>
              {!isEditMode && hasPermission("faqs_add") && (
                <div className="col-12 d-flex justify-content-end mb-10">
                  <button
                    className="btn btn-primary radius-8 px-14 py-2 d-flex align-items-center"
                    onClick={handleAddFaq}
                  >
                    <Icon icon="ic:baseline-plus" />
                    Add
                  </button>
                </div>
              )}
              {isEditMode && hasPermission("faqs_edit") && (
                <div className="col-12 d-flex justify-content-center mb-10">
                  <button
                    className="btn btn-primary-600 radius-8 px-10 py-4 d-flex align-items-center gap-2"
                    onClick={handleUpdateFaq}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update FAQ"}
                  </button>
                </div>
              )}
            </div>
            {!isEditMode && (
              <>
                <hr />
                <DataTable
                  columns={columns}
                  data={faqs}
                  pagination
                  highlightOnHover
                  responsive
                  striped
                  persistTableHead
                  noDataComponent="No FAQs added yet"
                />
                {faqs.length > 0 && (
                  <div className="d-flex justify-content-center mt-3">
                    {hasPermission("faqs_add") && (
                      <button
                        className="btn btn-primary-600 radius-8 px-10 py-4 d-flex align-items-center gap-2"
                        onClick={handleSaveFaqs}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save FAQs"}
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

export default FaqsAddLayer;
