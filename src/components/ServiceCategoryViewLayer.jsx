import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const ServiceCategoryViewLayer = () => {
  const { CategoryID } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategory();
  }, [CategoryID]);

  const fetchCategory = async () => {
    try {
      const res = await axios.get(`${API_BASE}Category/${CategoryID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categoryData = Array.isArray(res.data) ? res.data[0] : res.data;
      setCategory(categoryData || null);
    } catch (error) {
      console.error("Error fetching category:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <p>Loading category details...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-5">
        <p>Category not found</p>
      </div>
    );
  }

  return (
    <div className="row gy-4 mt-3">
      <div className="col-lg-12">
        <div className="card h-100">
          <div className="card-body p-24">
            <h6 className="text-xl mb-16 border-bottom pb-2">Service Category Details</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Category ID:</strong> {category.CategoryID || "N/A"}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Category Name:</strong> {category.CategoryName || "N/A"}
              </div>
              <div className="col-md-12 mb-3">
                <strong>Description:</strong> {category.Description || "N/A"}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Status:</strong>{" "}
                <span className={category.IsActive ? "text-success" : "text-danger"}>
                  {category.IsActive ? "Active" : "Inactive"}
                </span>
              </div>
              {category.IconImage && (
                <div className="col-md-6 mb-3">
                  <strong>Icon Image:</strong>
                  <br />
                  <img
                    src={`${API_IMAGE}${category.IconImage}`}
                    alt="Icon"
                    style={{ maxWidth: "100px", maxHeight: "100px", marginTop: "10px" }}
                  />
                </div>
              )}
              {category.ThumbnailImage && (
                <div className="col-md-6 mb-3">
                  <strong>Thumbnail Image:</strong>
                  <br />
                  <img
                    src={`${API_IMAGE}${category.ThumbnailImage}`}
                    alt="Thumbnail"
                    style={{ maxWidth: "200px", maxHeight: "200px", marginTop: "10px" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryViewLayer;
