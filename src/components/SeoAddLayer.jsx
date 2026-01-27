import { useState, useEffect } from "react";
// import { Helmet } from "react-helmet-async";
import { fleschKincaid } from "flesch-kincaid";
import axios from "axios";
import { useParams ,useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Select from "react-select";
import useFormError from "../hook/useFormError";
import FormError from "../components/FormError";
import { usePermissions } from "../context/PermissionContext";

const SeoAddLayer = () => {
  const { hasPermission } = usePermissions();
  const API_BASE = `${import.meta.env.VITE_APIURL}Seometa`;
  const PACKAGE_API_BASE = `${import.meta.env.VITE_APIURL}PlanPackage`;
  const CATEGORY_API_BASE = `${import.meta.env.VITE_APIURL}Category`;
  const { errors, validate, clearAllErrors } = useFormError();
  const token = localStorage.getItem("token");
  const { seoid } = useParams(); // seoid will come from route like /seo-edit/:seoid
const navigate = useNavigate();

  const [seoData, setSeoData] = useState({
    seo_id: null,
    page_slug: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    content: "",
    seo_score: 0,
    readability_score: 0,
    pageSpeedScore: null
  });

  const [keywordsArray, setKeywordsArray] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [packages, setPackages] = useState([]);
  const [category, setCategory] = useState([]);

  const [factorScores, setFactorScores] = useState({
    title: 0,
    description: 0,
    keywords: 0,
    contentLength: 0,
    readability: 0,
    pageSpeed: 0
  });

  // Helper: get color based on score
  const getColor = (score) => {
    if (score >= 80) return "bg-success"; // green
    if (score >= 50) return "bg-warning"; // yellow
    return "bg-danger"; // red
  };

  // Fetch packages data
  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${PACKAGE_API_BASE}/GetPlanPackagesDetails`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to load packages", error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);


  const fetchCategory = async () => {
    try {
      const res = await axios.get(`${CATEGORY_API_BASE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategory(res.data);
    } catch (error) {
      console.error("Failed to load packages", error);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, []);


  useEffect(() => {
  if (seoid) {
    axios.get(`${API_BASE}/seo_id?seoid=${seoid}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      if (res.data) {
        const keywordsStr = res.data[0].seo_keywords || "";
        const keywordsArr = keywordsStr.split(",").map(k => k.trim()).filter(k => k);
        setSeoData({
          seo_id: res.data[0].seo_id || null,
          page_slug: res.data[0].page_slug || "",
          seo_title: res.data[0].seo_title || "",
          seo_description: res.data[0].seo_description || "",
          seo_keywords: keywordsStr,
          content: res.data[0].content || "",
          seo_score: res.data[0].seo_score || 0,
          readability_score: res.data[0].readability_score || 0,
          pageSpeedScore: res.data[0].pageSpeedScore || null
        });
        setKeywordsArray(keywordsArr);
      }
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Error loading SEO data',
        text: err.response?.data?.message || 'Something went wrong',
      });
    });
  }
}, [seoid]);

  // Handle input change
  const handleChange = (e) => {
    setSeoData({ ...seoData, [e.target.name]: e.target.value });
  };

  // Handle Select change
  const handleSelectChange = (selectedOption, fieldName) => {
    setSeoData({ ...seoData, [fieldName]: selectedOption ? selectedOption.value : "" });
  };

  // Get all page options (static + packages)
  const getPageOptions = () => [
    { value: "home", label: "Home" },
    { value: "services", label: "Services" },
    { value: "about", label: "About Us" },
    { value: "contact", label: "Contact Us" },
    { value: "blog", label: "Blog" },
    ...packages.map((pkg) => ({
      value: pkg.PackageName.toLowerCase().replace(/\s+/g, '-'),
      label: pkg.PackageName
    })),
    ...category.map((ctg) => ({
      value: ctg.CategoryName.toLowerCase().replace(/\s+/g, '-'),
      label: ctg.CategoryName
    }))
  ];

  // Add keyword
  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (trimmed && !keywordsArray.includes(trimmed)) {
      setKeywordsArray([...keywordsArray, trimmed]);
      setNewKeyword("");
    }
  };

  // Add bulk keywords
  const addBulkKeywords = () => {
    if (!bulkKeywords.trim()) return;

    // Split by commas, newlines, or other common separators
    const newKeywords = bulkKeywords
      .split(/[,;\n\r]/)
      .map(k => k.trim())
      .filter(k => k && !keywordsArray.includes(k));

    if (newKeywords.length > 0) {
      setKeywordsArray([...keywordsArray, ...newKeywords]);
      setBulkKeywords("");
      Swal.fire({
        title: 'Success',
        text: `Added ${newKeywords.length} new keyword(s)`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        title: 'Info',
        text: 'No new keywords to add or all keywords already exist',
        icon: 'info'
      });
    }
  };

  // Remove keyword
  const removeKeyword = (index) => {
    setKeywordsArray(keywordsArray.filter((_, i) => i !== index));
  };

  // Handle Enter key for adding keyword
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  // Helper to count syllables roughly
  const countSyllables = (word) => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  // Calculate readability using Flesch-Kincaid
  const calculateReadability = (text) => {
    const words = text.trim().split(/\s+/).length || 1;
    const sentences = text.split(/[.!?]/).filter(Boolean).length || 1;
    const syllables = text
      .toLowerCase()
      .split(/\s+/)
      .reduce((sum, word) => sum + countSyllables(word), 0);

    return fleschKincaid({ word: words, sentence: sentences, syllable: syllables });
  };

  // Update seo_keywords when keywordsArray changes
  useEffect(() => {
    setSeoData(prev => ({ ...prev, seo_keywords: keywordsArray.join(", ") }));
  }, [keywordsArray]);

  // SEO Analysis
  useEffect(() => {
    const keywords = keywordsArray;
    let totalScore = 0;
    let factors = {};

    // Title
    let titleScore = 0;
    if (seoData.seo_title.length >= 50 && seoData.seo_title.length <= 60) titleScore = 20;
    else if (seoData.seo_title.length >= 30) titleScore = 10;
    factors.title = titleScore;
    totalScore += titleScore;

    // Description
    let descScore = 0;
    if (seoData.seo_description.length >= 120 && seoData.seo_description.length <= 160) descScore = 20;
    else if (seoData.seo_description.length >= 50) descScore = 10;
    factors.description = descScore;
    totalScore += descScore;

    // Keywords
    let keywordScore = 0;
    if (keywords.length >= 1) {
      keywordScore = 10; // Base score for having keywords
      if (keywords.some(k => seoData.content.includes(k))) keywordScore = 20; // Full score when keywords are in content
    }
    factors.keywords = keywordScore;
    totalScore += keywordScore;

    // Content length
    let contentScore = 0;
    if (seoData.content.length > 300) contentScore = 20;
    else if (seoData.content.length > 150) contentScore = 10;
    factors.contentLength = contentScore;
    totalScore += contentScore;

    // Readability
    const readabilityScore = seoData.content ? calculateReadability(seoData.content) : 0;
    let readScore = 0;
    if (readabilityScore >= 60) readScore = 20;
    factors.readability = readScore;
    totalScore += readScore;

    setSeoData(prev => ({ ...prev, seo_score: totalScore, readability_score: readabilityScore }));
    setFactorScores(factors);

  }, [seoData.seo_title, seoData.seo_description, keywordsArray, seoData.content]);

const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    let res;
 
    const validationErrors = validate(seoData, ["seo_id", "content" ,"seo_score" ,"pageSpeedScore"]);
    console.log(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

      setLoading(true);
    try {
      if(!seoData.seo_id){
       res = await axios.post(API_BASE, {
        page_slug: seoData.page_slug,
        seo_title: seoData.seo_title,
        seo_description: seoData.seo_description,
        seo_keywords: seoData.seo_keywords,
        content: seoData.content,
        seo_score: seoData.seo_score,
      }, { headers: { Authorization: `Bearer ${token}` } });
    }else{
       res = await axios.put(API_BASE, {
        seo_id: seoData.seo_id,
        page_slug: seoData.page_slug,
        seo_title: seoData.seo_title,
        seo_description: seoData.seo_description,
        seo_keywords: seoData.seo_keywords,
        content: seoData.content,
        seo_score: seoData.seo_score,
      }, { headers: { Authorization: `Bearer ${token}` } });
    }
    console.log(res.data);
     if(res.data.status){
      Swal.fire({
        title: 'Success',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/seo");
        }
      });
     }else{
      Swal.fire({
        title: 'Error',
        text: res.data.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
     }
    } catch (err) {
      console.error("Submission error", err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Something went wrong',
        icon: 'error',
        confirmButtonText: 'OK'
      });

    } finally {
      setLoading(false);
      clearAllErrors();
    }
  };



  return (
     <div className='card h-100 p-0 radius-12 overflow-hidden mt-3'>
      <div className='card-body p-20'>

        <div className="mb-3">
            <label className="form-label">SEO page <span className="text-danger">*</span></label>
            <Select
              options={getPageOptions()}
              value={
                seoData.page_slug
                  ? getPageOptions().find(option => option.value === seoData.page_slug)
                  : null
              }
              onChange={(selectedOption) => handleSelectChange(selectedOption, "page_slug")}
              className="basic-single"
              classNamePrefix="react-select"
              placeholder="Select page"
              isSearchable={true}
              isClearable={true}
            />
             <FormError error={errors.Email} /> 
        </div>

      <div className="mb-3">
        <label className="form-label">SEO Title <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control"
          name="seo_title"
          value={seoData.seo_title}
          onChange={handleChange}
          placeholder="Enter SEO title"
        />
        <div className={`progress mt-1`} style={{ height: "8px" }}>
          <div
            className={`progress-bar ${getColor(factorScores.title * 5)}`}
            style={{ width: `${factorScores.title * 5}%` }}
            title="Title length: optimal 50-60 chars"
          ></div>
        </div>
        <FormError error={errors.seo_title} />
      </div>

      <div className="mb-3">
        <label className="form-label">Meta Description <span className="text-danger">*</span></label>
        <textarea
          className="form-control"
          name="seo_description"
          value={seoData.seo_description}
          onChange={handleChange}
          placeholder="Enter meta description"
        ></textarea>
        <div className={`progress mt-1`} style={{ height: "8px" }}>
          <div
            className={`progress-bar ${getColor(factorScores.description * 5)}`}
            style={{ width: `${factorScores.description * 5}%` }}
            title="Meta description length: optimal 120-160 chars"
          ></div>
        </div>
        <FormError error={errors.seo_description} />
      </div>

      <div className="mb-3">
        <label className="form-label">Focus Keywords <span className="text-danger">*</span></label>
        {!isBulkMode ? (
          <>
            <div className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a keyword and press Enter or click +"
              />
              <button type="button" className="btn btn-outline-primary py-2" onClick={addKeyword}>+</button>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {keywordsArray.map((keyword, index) => (
                <span key={index} className="badge bg-primary d-flex align-items-center gap-1">
                  {keyword}
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    style={{ fontSize: "10px" }}
                    onClick={() => removeKeyword(index)}
                    aria-label="Remove keyword"
                  ></button>
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <textarea
              className="form-control mb-2"
              rows={5}
              value={bulkKeywords}
              onChange={(e) => setBulkKeywords(e.target.value)}
              placeholder="Paste multiple keywords separated by commas, semicolons, or new lines"
            />
            <button type="button" className="btn btn-outline-primary py-2 mb-2" onClick={addBulkKeywords}>
              Add Keywords
            </button>
          </>
        )}
        <button
          type="button"
          className="btn btn-link text-primary p-0"
          onClick={() => setIsBulkMode(!isBulkMode)}
        >
          {isBulkMode ? "Switch to Single Keyword Mode" : "Switch to Bulk Add Mode"}
        </button>
        <div className={`progress mt-1`} style={{ height: "8px" }}>
          <div
            className={`progress-bar ${getColor(factorScores.keywords * 5)}`}
            style={{ width: `${factorScores.keywords * 5}%` }}
            title="Keywords present in content"
          ></div>
        </div>
        <FormError error={errors.seo_keywords} />
      </div>

      
      <div className="mb-3">
        <strong>Total SEO Score:</strong> {seoData.seo_score} / 100
      </div>
      {hasPermission("seo_add") && (
        <button className="btn btn-primary-600 btn-sm d-flex align-items-center justify-content-center gap-1" onClick={(e) => handleSubmit(e)} disabled={loading}>
          {loading ? "Saving..." : (seoData.seo_id ? "Update SEO" : "Add SEO")}
        </button>
      )}
    </div>
    </div>
  );
};

export default SeoAddLayer;
