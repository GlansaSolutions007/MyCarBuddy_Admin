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
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = `${import.meta.env.VITE_APIURL}`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadData = async () => {
      const packagesData = await fetchAllPackages();
      if (isEditMode) {
        fetchFaq(editId, packagesData);
      }
    };
    loadData();
  }, [isEditMode, editId]);

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

  const fetchFaq = async (id, packagesData) => {
    try {
      const res = await axios.get(`${API_BASE}FAQS?Id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const faq = Array.isArray(res.data) ? res.data[0] : res.data;

      if (!faq) {
        Swal.fire("Error", "No FAQ found", "error");
        return;
      }

      setSelectedPackage({
        value: faq.PackageID,
        label: packagesData.find((p) => p.value === faq.PackageID)?.label || "",
      });

      setQuestion(faq.Question);
      setAnswer(faq.Answer);
    } catch (error) {
      console.error("Failed to load FAQ", error);
      Swal.fire("Error", "Failed to load FAQ", "error");
    }
  };

  const handleAddFaq = () => {
    if (!selectedPackage || !question.trim() || !answer.trim()) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }
    const newFaq = {
      packageId: selectedPackage.value,
      packageName: selectedPackage.label,
      question: question.trim(),
      answer: answer.trim(),
    };
    setFaqs([...faqs, newFaq]);
    setQuestion("");
    setAnswer("");
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
      // Group FAQs by packageId
      const groupedFaqs = faqs.reduce((acc, faq) => {
        const packageId = faq.packageId;
        if (!acc[packageId]) {
          acc[packageId] = [];
        }
        acc[packageId].push({
          question: faq.question,
          answer: faq.answer,
        });
        return acc;
      }, {});

      // Send POST for each package
      for (const packageId in groupedFaqs) {
        const payload = {
          packageID: parseInt(packageId),
          faQs: groupedFaqs[packageId],
        };
        await axios.post(`${API_BASE}FAQS`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      console.log("Saving FAQs completed");
      Swal.fire("Success", "FAQs saved successfully", "success");
      setFaqs([]);
      setSelectedPackage(null);
    } catch (error) {
      console.error("Failed to save FAQs", error);
      Swal.fire("Error", "Failed to save FAQs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFaq = async () => {
    if (!selectedPackage || !question.trim() || !answer.trim()) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: parseInt(editId),
        question: question.trim(),
        answer: answer.trim(),
        packageID: selectedPackage.value,
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
      name: "Package",
      selector: (row) => row.packageName,
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
          onClick={() => handleRemoveFaq(index)}
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
              <div className="col-md-12">
                <label className="form-label">Package</label>
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
