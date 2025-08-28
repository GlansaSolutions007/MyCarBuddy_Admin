import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import axios from "axios";


// Dummy SEO data (replace with API fetch)

const SeoListLayer = () => {
const API_BASE = `${import.meta.env.VITE_APIURL}Seometa`;
  const [seoList, setSeoList] = useState([]);
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
    // Replace with API fetch if needed
    // setSeoList(initialSEOData);
    fetchSeo();
  }, []);

  // Columns definition
  const columns = [
    {
      name: "Page",
      selector: row => row.page_slug,
      sortable: true,
      wrap: true
    },
    {
      name: "Title",
      selector: row => row.seo_title,
      sortable: true,
      wrap: true
    },
    {
      name: "Description",
      selector: row => row.seo_description,
      sortable: false,
      wrap: true
    },
    {
      name: "Keywords",
      selector: row => row.seo_keywords,
      sortable: false,
      wrap: true
    },
    // {
    //   name: "SEO Score",
    //   selector: row => row.seo_score,
    //   sortable: true,
    //   cell: row => (
    //     <div className={`progress`} style={{ height: "8px" }}>
    //       <div
    //         className={`progress-bar ${row.seo_score >= 80 ? "bg-success" : row.seo_score >= 50 ? "bg-warning" : "bg-danger"}`}
    //         style={{ width: `${row.seo_score}%` }}
    //         title={`SEO Score: ${row.seo_score}`}
    //       ></div>
    //     </div>
    //   )
    // },
    // {
    //   name: "Readability",
    //   selector: row => row.readability_score,
    //   sortable: true,
    //   cell: row => (
    //     <div className={`progress`} style={{ height: "8px" }}>
    //       <div
    //         className={`progress-bar ${row.readability_score >= 80 ? "bg-success" : row.readability_score >= 50 ? "bg-warning" : "bg-danger"}`}
    //         style={{ width: `${row.readability_score}%` }}
    //         title={`Readability: ${row.readability_score}`}
    //       ></div>
    //     </div>
    //   )
    // },
    {
      name: "Actions",
      cell: row => (
        <div className="d-flex gap-2">
          <Link to={`/edit-seo/${row.seo_id}`}
                                 className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                                 >
                                     <Icon icon='lucide:edit' />
                 </Link>
        </div>
      )
    }
  ];

  return (

        <div className="row gy-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5></h5>
             
            </div>
    
            <div className="chat-main card overflow-hidden p-3">
              <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
                <div className='d-flex align-items-center flex-wrap gap-3'>
    
    
                </div>
                {/* <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={() => { resetForm(); clearAllErrors();  setShowModal(true); }}>
                    Add Distributor
                </button> */}
                <Link
                  to='/add-seo'
                  className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
                >
                  <Icon
                    icon='ic:baseline-plus'
                    className='icon text-xl line-height-1'
                  />
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
