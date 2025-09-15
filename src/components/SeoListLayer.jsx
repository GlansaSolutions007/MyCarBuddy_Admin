import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import axios from "axios";

const SeoListLayer = () => {
  const API_BASE = `${import.meta.env.VITE_APIURL}Seometa`;
  const [seoList, setSeoList] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const token = localStorage.getItem("token");

  const fetchSeo = async () => {
    try {
      const res = await axios.get(`${API_BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSeoList(res.data);
    } catch (error) {
      console.error("Failed to load SEO data", error);
    }
  };

  useEffect(() => {
    fetchSeo();
  }, []);

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Custom cell renderer for keywords with show more/less
  const KeywordsCell = ({ row }) => {
    const keywordsArray = row.seo_keywords ? row.seo_keywords.split(",").map(k => k.trim()) : [];
    const isExpanded = expandedRows.has(row.seo_id);
    const limit = 5;

    if (keywordsArray.length <= limit) {
      return <span>{row.seo_keywords}</span>;
    }

    const displayedKeywords = isExpanded ? keywordsArray : keywordsArray.slice(0, limit);

    return (
      <span>
        {displayedKeywords.join(", ")}
        {" "}
        <button
          onClick={() => toggleRowExpansion(row.seo_id)}
          style={{ color: "blue", cursor: "pointer", background: "none", border: "none", padding: 0, fontSize: "inherit" }}
          aria-label={isExpanded ? "Show less keywords" : "Show more keywords"}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </span>
    );
  };

  // Columns definition
  const columns = [
    {
      name: "Page",
      selector: (row) => row.page_slug,
      sortable: true,
      wrap: true,
    },
    {
      name: "Title",
      selector: (row) => row.seo_title,
      sortable: true,
      wrap: true,
    },
    {
      name: "Description",
      selector: (row) => row.seo_description,
      sortable: false,
      wrap: true,
    },
    {
      name: "Keywords",
      cell: (row) => <KeywordsCell row={row} />,
      sortable: false,
      wrap: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Link
            to={`/edit-seo/${row.seo_id}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>

        <div className="chat-main card overflow-hidden p-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <div className="d-flex align-items-center flex-wrap gap-3"></div>
            <Link to="/add-seo" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
              <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
              Add Seo
            </Link>
          </div>
          <DataTable
            columns={columns}
            data={seoList}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Seo available"
          />
        </div>
      </div>
    </div>
  );
};

export default SeoListLayer;
