import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";

const FaqsAddLayer = () => {
  const { hasPermission } = usePermissions();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = `${import.meta.env.VITE_APIURL}`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAllPackages();
  }, []);

  const fetchAllPackages = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}PlanPackage/GetPlanPackagesDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPackages(
        res.data.map((pkg) => ({
          value: pkg.PackageID,
          label: pkg.PackageName,
        }))
      );
    } catch (error) {
      console.error("Failed to load all packages", error);
    }
  };

  const handleAddFaq = () => {
    if (!selectedPackage || !question.trim() || !explanation.trim()) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }
    const newFaq = {
      packageId: selectedPackage.value,
      packageName: selectedPackage.label,
      question: question.trim(),
      explanation: explanation.trim(),
    };
    setFaqs([...faqs, newFaq]);
    setQuestion("");
    setExplanation("");
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
          acc[packageId] = {
            packageName: faq.packageName,
            faqs: [],
          };
        }
        acc[packageId].faqs.push({
          question: faq.question,
          explanation: faq.explanation,
        });
        return acc;
      }, {});

      // Convert to array format
      const payload = Object.values(groupedFaqs);

      // Assuming there's an API endpoint like /Faqs/AddFaqs
      // For now, placeholder
      // await axios.post(`${API_BASE}Faqs/AddFaqs`, payload, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      console.log("Saving FAQs:", payload);
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
      selector: (row) => row.explanation,
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
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Enter explanation"
                />
              </div>
              {hasPermission("faqs_add") && (
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
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqsAddLayer;
