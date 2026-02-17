// import { useEffect, useState } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import { Icon } from "@iconify/react";
// import { Link } from "react-router-dom";
// import DataTable from "react-data-table-component";
// import { usePermissions } from "../context/PermissionContext";
// import * as XLSX from "xlsx";

// const API_BASE = import.meta.env.VITE_APIURL;

// const OrganicLeadsLayer = () => {
//   const { hasPermission } = usePermissions();
//   const employeeData = JSON.parse(localStorage.getItem("employeeData"));
//   const roleName = employeeData?.RoleName;
//   const role = localStorage.getItem("role");
//   const [leads, setLeads] = useState([]);
//   const [searchText, setSearchText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [dateType, setDateType] = useState("created"); // "created" | "updated"
//   const [platformFilter, setPlatformFilter] = useState("All");
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   const [pageNumber, setPageNumber] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [totalRows, setTotalRows] = useState(0);
//   const [allLeads, setAllLeads] = useState([]); // stored chunks
//   const [chunkPage, setChunkPage] = useState(1); // API chunk page
//   const CHUNK_SIZE = 50;

//   console.log("Employee Data:", allLeads);

//   useEffect(() => {
//     fetchLeads(1);
//   }, []);

//   const fetchLeads = async (page = 1) => {
//     setLoading(true);
//     try {
//       let url;

//       if (role === "Admin") {
//         url = `${API_BASE}ServiceLeads/FacebookLeads?pageNumber=${page}&pageSize=50`;
//       } else {
//         url = `${API_BASE}ServiceLeads/FacebookLeads?pageNumber=${page}&pageSize=50&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
//       }

//       const res = await fetch(url);
//       const data = await res.json();

//       const newData = data.data || data;

//       setAllLeads(prev => [...prev, ...newData]); // append chunk
//       setTotalRows(data.totalCount || 0);

//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBulkUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setUploading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const res = await axios.post(`${API_BASE}Leads/UploadExcel`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (p) => {
//           const percent = Math.round((p.loaded / p.total) * 100);
//           setUploadProgress(percent);
//         },
//       });

//       if (res.status === 200) {
//         Swal.fire("Success", "Bulk Upload Completed", "success");
//         setUploading(false);
//         setUploadProgress(0);
//         fetchLeads();
//       }
//     } catch (error) {
//       console.error(error);
//       Swal.fire("Error", "Bulk Upload Failed", "error");
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const exportToExcel = () => {
//     // Prepare data for export (exclude Action column)
//     const exportData = filteredLeads.map((lead) => ({
//       "Lead ID": lead.Id,
//       "Customer Name": lead.FullName || "-",
//       "Phone Number": lead.PhoneNumber || "-",
//       Email: lead.Email || "-",
//       "Created Date": lead.CreatedDate
//         ? new Date(lead.CreatedDate).toLocaleString("en-GB")
//         : "-",
//       City: lead.City || "-",
//       Platform: lead.Platform || "-",
//       "Lead Category":
//         lead.BookingAddOns?.filter((addon) => addon.IsUserClicked === true)
//           .map((addon) => addon.ServiceName)
//           .join(", ") || "-",
//       Description: lead.Description || "-",
//       "Updated Date": lead.Updated_At
//         ? new Date(lead.Updated_At).toLocaleString("en-GB")
//         : "-",
//       "Lead Status": lead.FollowUpStatus || "No FollowUp Yet",
//       "Next FollowUp": lead.NextFollowUp_Date || "-",
//       "Next Action": lead.NextAction || "-",
//     }));

//     // Create workbook and worksheet
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(exportData);

//     // Auto-size columns
//     const colWidths = [
//       { wch: 10 }, // Lead ID
//       { wch: 20 }, // Customer Name
//       { wch: 15 }, // Phone Number
//       { wch: 25 }, // Email
//       { wch: 15 }, // Created Date
//       { wch: 15 }, // City
//       { wch: 10 }, // Platform
//       { wch: 25 }, // Lead Category
//       { wch: 20 }, // Description
//       { wch: 15 }, // Updated Date
//       { wch: 15 }, // Lead Status
//       { wch: 15 }, // Next FollowUp
//       { wch: 15 }, // Next Action
//     ];
//     ws["!cols"] = colWidths;

//     // Add worksheet to workbook
//     XLSX.utils.book_append_sheet(wb, ws, "Organic Leads");

//     // Generate filename with timestamp
//     const now = new Date();
//     const timestamp = now
//       .toISOString()
//       .slice(0, 19)
//       .replace(/:/g, "")
//       .replace(/-/g, "")
//       .replace("T", "_");
//     const filename = `organic_leads_export_${timestamp}.xlsx`;

//     // Save file
//     XLSX.writeFile(wb, filename);
//   };

//   // DataTable Columns
//   const columns = [
//     {
//       name: "Lead ID",
//       selector: (row) => (
//         <Link to={`/lead-view/${row.Id}`} className="text-primary">
//           {row.Id}
//         </Link>
//       ),
//       sortable: true,
//       wrap: true,
//       width: "120px",
//     },
//     {
//       name: "Customer Name",
//       selector: (row) => row.FullName || "-",
//       sortable: true,
//       wrap: true,
//       width: "180px",
//     },
//     {
//       name: "Phone Number",
//       selector: (row) => row.PhoneNumber || "-",
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "Email",
//       selector: (row) => row.Email || "-",
//       sortable: true,
//       wrap: true,
//       width: "180px",
//     },
//     {
//       name: "Created Date",
//       selector: (row) => {
//         if (!row.CreatedDate) return "-";
//         const date = new Date(row.CreatedDate);
//         return date.toLocaleString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           second: "2-digit",
//           hour12: true,
//         });
//       },
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "City",
//       selector: (row) => row.City || "-",
//       sortable: true,
//       wrap: true,
//       width: "180px",
//     },
//     {
//       name: "Platform",
//       selector: (row) => row.Platform || "-",
//       sortable: true,
//       wrap: true,
//       width: "120px",
//     },
//     // {
//     //   name: "Lead Category",
//     //   cell: (row) => {
//     //     if (!row.BookingAddOns || row.BookingAddOns.length === 0) {
//     //       return <span>-</span>;
//     //     }
//     //     return (
//     //       <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
//     //         {row.BookingAddOns.map((addon) => (
//     //           <span
//     //             key={addon.AddOnId}
//     //             className={`  ${addon.Type === "Inspection" ? "" : ""}`}
//     //           >
//     //             {addon.ServiceName}
//     //           </span>
//     //         ))}
//     //       </div>
//     //     );
//     //   },
//     //   sortable: false,
//     //   wrap: true,
//     //   minWidth: "200px",
//     // },
//     {
//       name: "Lead Category",
//       cell: (row) => {
//         if (
//           !row.BookingAddOns ||
//           row.BookingAddOns.length === 0 ||
//           !row.BookingAddOns.some((addon) => addon.IsUserClicked === true)
//         ) {
//           return <span>-</span>;
//         }

//         return (
//           <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
//             {row.BookingAddOns.filter(
//               (addon) => addon.IsUserClicked === true,
//             ).map((addon) => (
//               <span key={addon.AddOnId}>{addon.ServiceName}</span>
//             ))}
//           </div>
//         );
//       },
//       sortable: true,
//       wrap: true,
//       minWidth: "200px",
//     },
//     {
//       name: "Description",
//       selector: (row) => row.Description || "-",
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "Updated Date",
//       selector: (row) => {
//         if (!row.Updated_At) return "-";
//         const date = new Date(row.Updated_At);
//         return date.toLocaleString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         });
//       },
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "Lead Status",
//       selector: (row) => row.FollowUpStatus || "No FollowUp Yet",
//       sortable: true,
//       wrap: true,
//       width: "180px",
//     },
//     {
//       name: "Next FollowUp",
//       selector: (row) => row.NextFollowUp_Date || "-",
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "Next Action",
//       selector: (row) => row.NextAction || "-",
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     ...(hasPermission("leadview_view")
//       ? [
//         {
//           name: "Action",
//           cell: (row) => (
//             <Link
//               to={`/lead-view/${row.Id}`}
//               className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
//               title="View"
//             >
//               <Icon icon="lucide:eye" />
//             </Link>
//           ),
//           ignoreRowClick: true,
//           allowOverflow: true,
//           button: true,
//         },
//       ]
//       : []),
//   ];

//   const dateField = dateType === "updated" ? "Updated_At" : "CreatedDate";

//   let filteredLeads = allLeads
//     .filter((lead) => {
//       const text = searchText.toLowerCase();

//       const leadDate = lead[dateField] ? new Date(lead[dateField]) : null;
//       const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
//       const to = toDate ? new Date(toDate + "T23:59:59") : null;

//       const dateMatch =
//         (!from || (leadDate && leadDate >= from)) &&
//         (!to || (leadDate && leadDate <= to));

//       const platformMatch =
//         platformFilter === "All" || lead.Platform === platformFilter;

//       return (
//         dateMatch &&
//         platformMatch &&
//         (lead.Id?.toString().toLowerCase().includes(text) ||
//           lead.FullName?.toLowerCase().includes(text) ||
//           lead.PhoneNumber?.toLowerCase().includes(text) ||
//           lead.Email?.toLowerCase().includes(text) ||
//           lead.City?.toLowerCase().includes(text) ||
//           lead.LeadStatus?.toLowerCase().includes(text))
//       );
//     })
//     .sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));

//   const handlePageChange = (page) => {
//     setPageNumber(page);

//     const requiredData = page * pageSize;
//     const lastApiPage = Math.ceil(totalRows / CHUNK_SIZE);
//     const lastUiPage = Math.ceil(totalRows / pageSize);

//     // ✅ USER CLICKED LAST UI PAGE
//     if (page === lastUiPage) {
//       if (chunkPage < lastApiPage) {
//         setChunkPage(lastApiPage);
//         fetchLeads(lastApiPage); // 🔥 direct last page call
//       }
//       return;
//     }

//     // ✅ NORMAL NEXT CHUNK LOAD
//     if (
//       requiredData > allLeads.length &&
//       allLeads.length < totalRows
//     ) {
//       const nextChunk = chunkPage + 1;
//       setChunkPage(nextChunk);
//       fetchLeads(nextChunk);
//     }
//   };


//   const handleRowsChange = (newSize, page) => {
//     setPageSize(newSize);
//     setPageNumber(page);

//     const requiredData = page * newSize;
//     const lastApiPage = Math.ceil(totalRows / CHUNK_SIZE);
//     const lastUiPage = Math.ceil(totalRows / newSize);

//     if (page === lastUiPage) {
//       if (chunkPage < lastApiPage) {
//         setChunkPage(lastApiPage);
//         fetchLeads(lastApiPage);
//       }
//       return;
//     }

//     if (
//       requiredData > allLeads.length &&
//       allLeads.length < totalRows
//     ) {
//       const nextChunk = chunkPage + 1;
//       setChunkPage(nextChunk);
//       fetchLeads(nextChunk);
//     }
//   };

//   return (
//     <div className="row gy-4">
//       <div className="col-12">
//         <div className="d-flex justify-content-between align-items-center mb-3"></div>
//         <div className="card overflow-hidden py-3">
//           <div className="card-header">
//             <div className="d-flex justify-content-between align-items-center mb-2">
//               <form className="navbar-search ">
//                 <input
//                   type="text"
//                   className="form-control w-auto"
//                   placeholder="Search Leads"
//                   value={searchText}
//                   onChange={(e) => setSearchText(e.target.value)}
//                 />
//                 <Icon icon="ion:search-outline" className="icon" />
//               </form>
//               <div className="d-flex gap-2 align-items-center">
//                 <div className="d-flex align-items-center gap-2">
//                   <label className="text-sm fw-semibold mb-0">Date Type:</label>
//                   <div className="position-relative d-inline-block">
//                     <select
//                       className="form-control radius-8 px-14 py-6 text-sm w-auto"
//                       value={dateType}
//                       onChange={(e) => {
//                         setDateType(e.target.value);
//                         setFromDate("");
//                         setToDate("");
//                       }}
//                       style={{
//                         appearance: "none",
//                         WebkitAppearance: "none",
//                         MozAppearance: "none",
//                         paddingRight: "30px",
//                       }}
//                     >
//                       <option value="created">Created Date</option>
//                       <option value="updated">Updated Date</option>
//                     </select>
//                     <i
//                       className="bi bi-chevron-down"
//                       style={{
//                         position: "absolute",
//                         right: "10px",
//                         top: "50%",
//                         transform: "translateY(-50%)",
//                         pointerEvents: "none",
//                         fontSize: "14px",
//                         color: "#555",
//                       }}
//                     />
//                   </div>
//                 </div>
//                 <label className="text-sm fw-semibold mb-0">From:</label>
//                 <input
//                   type="date"
//                   placeholder="DD-MM-YYYY"
//                   className="custom-date form-control radius-8 px-14 py-6 text-sm w-auto"
//                   value={fromDate}
//                   onChange={(e) => setFromDate(e.target.value)}
//                 />
//                 <label className="text-sm fw-semibold mb-0">To:</label>
//                 <input
//                   type="date"
//                   placeholder="DD-MM-YYYY"
//                   className="custom-date form-control radius-8 px-14 py-6 text-sm w-auto"
//                   value={toDate}
//                   onChange={(e) => setToDate(e.target.value)}
//                 />
//                 {/* <select
//                   className="form-control radius-8 px-14 py-6 text-sm w-auto"
//                   value={platformFilter}
//                   onChange={(e) => setPlatformFilter(e.target.value)}
//                 >
//                   <option value="All">All</option>
//                   <option value="Organic">Organic</option>
//                   <option value="Web">Web</option>
//                   <option value="App">App</option>
//                 </select> */}

//                 <div className="position-relative d-inline-block">
//                   <select
//                     className="form-control radius-8 px-14 py-6 text-sm w-auto"
//                     value={platformFilter}
//                     onChange={(e) => setPlatformFilter(e.target.value)}
//                     style={{
//                       appearance: "none",
//                       WebkitAppearance: "none",
//                       MozAppearance: "none",
//                       paddingRight: "30px", // space for arrow
//                     }}
//                   >
//                     <option value="All">All</option>
//                     <option value="Organic">Organic</option>
//                     <option value="Web">Web</option>
//                     <option value="App">App</option>
//                   </select>
//                   <i
//                     className="bi bi-chevron-down"
//                     style={{
//                       position: "absolute",
//                       right: "10px",
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       pointerEvents: "none",
//                       fontSize: "14px",
//                       color: "#555",
//                     }}
//                   ></i>
//                 </div>
//                 <input
//                   type="file"
//                   accept=".xlsx, .xls"
//                   id="organicUpload"
//                   style={{ display: "none" }}
//                   onChange={handleBulkUpload}
//                 />
//                 {/* Bulk Upload button */}
//                 {(role === "Admin" || roleName === "Telecaller Head") && (
//                   <button
//                     type="button"
//                     className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
//                     onClick={() =>
//                       document.getElementById("organicUpload").click()
//                     }
//                     disabled={uploading}
//                   >
//                     <Icon
//                       icon="mdi:upload"
//                       className="icon text-xl line-height-1"
//                     />
//                     Bulk Upload
//                   </button>
//                 )}
//                 {hasPermission("createlead_add") && (
//                   <Link
//                     to="/create-lead"
//                     className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
//                   >
//                     <Icon
//                       icon="ic:baseline-plus"
//                       className="icon text-xl line-height-1"
//                     />
//                     Add Lead
//                   </Link>
//                 )}
//                 <button
//                   className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
//                   onClick={exportToExcel}
//                   title="Export to Excel"
//                 >
//                   <Icon icon="mdi:microsoft-excel" width="22" height="22" />
//                 </button>
//               </div>
//             </div>
//           </div>
//           {uploading && (
//             <div className="m-3">Uploading {uploadProgress}%...</div>
//           )}
//           {error ? (
//             <div className="alert alert-danger m-3">{error}</div>
//           ) : (
//             <DataTable
//               columns={columns}
//               data={filteredLeads.slice(
//                 (pageNumber - 1) * pageSize,
//                 pageNumber * pageSize
//               )}
//               progressPending={loading}
//               pagination
//               paginationServer
//               paginationPerPage={pageSize}
//               paginationTotalRows={totalRows}
//               onChangePage={handlePageChange}
//               onChangeRowsPerPage={handleRowsChange}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrganicLeadsLayer;

////////////////////////////////////////////////////////////////////////////////

import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_APIURL;
const CHUNK_SIZE = 100; // Fetch 100 at a time as requested

const OrganicLeadsLayer = () => {
  const { hasPermission } = usePermissions();
  const employeeData = JSON.parse(localStorage.getItem("employeeData"));
  const roleName = employeeData?.RoleName;
  const role = localStorage.getItem("role");

  const [allLeads, setAllLeads] = useState([]); // Master cache 
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateType, setDateType] = useState("created");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [callOutcome, setCallOutcome] = useState("");
  const { status } = useParams();
  const decodedStatus = status ? decodeURIComponent(status) : "";

  // 1. Core Fetch Logic (Handles Chunking)
  const fetchLeadsChunk = useCallback(async (targetPage) => {
    // Determine which chunk of 100 is needed based on the page clicked
    const currentItemIndex = (targetPage - 1) * pageSize;
    const chunkIndex = Math.floor(currentItemIndex / CHUNK_SIZE) + 1;

    setLoading(true);
    try {
      let url;
      const queryParams = `pageNumber=${chunkIndex}&pageSize=${CHUNK_SIZE}`;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const newData = data.data || data;

      setTotalRows(data.totalCount || 0);

      // Save chunk into the master array at correct positions
      setAllLeads((prev) => {
        const updated = [...prev];
        const startAt = (chunkIndex - 1) * CHUNK_SIZE;
        newData.forEach((item, index) => {
          updated[startAt + index] = item;
        });
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [role, employeeData?.Id, employeeData?.RoleName, pageSize]);

  // 2. Initial load and Page Change listener
  useEffect(() => {
    if (isSearching) return;
    if (totalRows === 0 && allLeads.length === 0) return;

    const startItem = (pageNumber - 1) * pageSize;
    const endItem = pageNumber * pageSize;

    const slice = allLeads.slice(startItem, endItem).filter(Boolean);

    if (slice.length === 0) {
      fetchLeadsChunk(pageNumber);
    }
  }, [pageNumber, pageSize]);


  useEffect(() => {

    const delayDebounce = setTimeout(() => {

      if (
        searchText ||
        platformFilter !== "All" ||
        fromDate ||
        toDate ||
        callOutcome
      ) {
        setPageNumber(1);
        fetchSearchLeads(searchText, 1);
      } else {
        setIsSearching(false);
        setSearchResults([]);
        fetchLeadsChunk(1);
      }

    }, 400);

    return () => clearTimeout(delayDebounce);

  }, [searchText, platformFilter, fromDate, toDate, dateType, callOutcome]);

  // Reset logic when filters change
  useEffect(() => {
    setAllLeads([]);
    setTotalRows(0);
    setPageNumber(1);
  }, []);

  const handlePageChange = (page) => {
    setPageNumber(page);
    if (isSearching) {
      fetchSearchLeads(searchText, page);
    }
  };

  const handleRowsChange = (newSize) => {
    setPageSize(newSize);
    setAllLeads([]); // Reset cache to prevent indexing mismatch
    setPageNumber(1);
  };

  const filteredLeads = allLeads.filter(Boolean);

  const displayLeads = useMemo(() => {

    // ✅ SERVER SIDE SEARCH / FILTER MODE
    if (isSearching) {
      return searchResults;
    }

    // ✅ NORMAL CHUNK CACHE MODE
    return allLeads
      .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
      .filter(Boolean);

  }, [isSearching, searchResults, allLeads, pageNumber, pageSize]);


  // Columns Configuration (Preserved your design)
  const columns = [
    {
      name: "Lead ID",
      cell: (row) => (
        <div
          className="d-flex align-items-center gap-1"
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) => {
            const arrow = e.currentTarget.querySelector(".arrow-icon");
            if (arrow) arrow.style.transform = "translateX(8px)";
          }}
          onMouseLeave={(e) => {
            const arrow = e.currentTarget.querySelector(".arrow-icon");
            if (arrow) arrow.style.transform = "translateX(0px)";
          }}
        >
          <Link
            to={`/lead-view/${row.Id}`}
            className="text-primary fw-semibold d-flex align-items-center"
            style={{ textDecoration: "none" }}
          >
            {row.Id}
          </Link>

          <Icon
            icon="mdi:arrow-right"
            width="18"
            className="text-primary arrow-icon"
            style={{
              transition: "transform 0.3s ease",
            }}
          />
        </div>
      ),
      sortable: true,
      width: "150px",
    },
    { name: "Customer Name", selector: (row) => row.FullName || "-", sortable: true, wrap: true, width: "180px" },
    { name: "Phone Number", selector: (row) => row.PhoneNumber || "-", sortable: true, width: "150px" },
    { name: "Email", selector: (row) => row.Email || "-", sortable: true, wrap: true, width: "180px" },
    { name: "Lead Status", selector: (row) => row.FollowUpStatus || "No FollowUp Yet", width: "180px" },
    {
      name: "Created Date",
      selector: (row) => row.CreatedDate ? new Date(row.CreatedDate).toLocaleString("en-GB") : "-",
      sortable: true,
      width: "150px",
    },
    { name: "City", selector: (row) => row.City || "-", sortable: true, width: "180px" },
    { name: "Platform", selector: (row) => row.Platform || "-", width: "120px" },
    {
      name: "Lead Category",
      cell: (row) => {
        const clicked = row.BookingAddOns?.filter((addon) => addon.IsUserClicked === true);
        return clicked?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {clicked.map((addon) => <span key={addon.AddOnId}>{addon.ServiceName}</span>)}
          </div>
        ) : <span>-</span>;
      },
      minWidth: "200px",
    },
    ...(hasPermission("leadview_view") ? [
      {
        name: "Action",
        cell: (row) => (
          <Link to={`/lead-view/${row.Id}`} className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center">
            <Icon icon="lucide:eye" />
          </Link>
        ),
        button: true,
      },
    ] : []),
  ];

  // Excel Export Logic (Preserved)
  const exportToExcel = async () => {
    try {
      setLoading(true);

      let queryParams = "";

      // search text
      if (searchText) {
        queryParams += `&searchText=${encodeURIComponent(searchText)}`;
      }

      // platform filter
      if (platformFilter !== "All") {
        queryParams += `&platform=${platformFilter}`;
      }

      // date filters
      if (fromDate) {
        queryParams += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        queryParams += `&toDate=${toDate}`;
      }

      if (fromDate || toDate) {
        const apiDateType =
          dateType === "updated"
            ? "UpdatedDate"
            : "CreatedDate";

        queryParams += `&DateType=${apiDateType}`;
      }

      let url;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/ExportLeadsWithQuestions?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/ExportLeadsWithQuestions?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const response = await axios.get(url, {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `leads_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Excel export failed", "error");
    } finally {
      setLoading(false);
    }
  };


  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API_BASE}Leads/UploadExcel`, formData);
      Swal.fire("Success", "Bulk Upload Completed", "success");
      setAllLeads([]); // Clear cache to refresh data
      fetchLeadsChunk(1);
    } catch (err) {
      Swal.fire("Error", "Upload Failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const fetchSearchLeads = useCallback(async (text = "", page = 1) => {

    setLoading(true);
    setIsSearching(true);

    try {
      let queryParams = `pageNumber=${page}&pageSize=${CHUNK_SIZE}`;

      // ✅ search text
      if (text) {
        queryParams += `&searchText=${encodeURIComponent(text)}`;
      }

      // ✅ platform filter
      if (platformFilter !== "All") {
        queryParams += `&platform=${platformFilter}`;
      }

      if (callOutcome) {
        queryParams += `&Status=${encodeURIComponent(callOutcome)}`;
      }

      // ✅ NEW → Date Filters (SERVER SIDE)
      if (fromDate) {
        queryParams += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        queryParams += `&toDate=${toDate}`;
      }

      if (fromDate || toDate) {
        const apiDateType = dateType === "updated"
          ? "UpdatedDate"
          : "CreatedDate";

        queryParams += `&DateType=${apiDateType}`;
      }

      let url;

      if (role === "Admin") {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}`;
      } else {
        url = `${API_BASE}ServiceLeads/FacebookLeads?${queryParams}&EmployeeId=${employeeData?.Id}&RoleName=${employeeData?.RoleName}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      setSearchResults(data.data || data);
      setTotalRows(data.totalCount || 0);

    } catch (err) {
      console.error(err);
      setError("Search failed");
    } finally {
      setLoading(false);
    }

  }, [role, employeeData, platformFilter, fromDate, toDate, dateType]);

  useEffect(() => {
    if (decodedStatus) {
      setCallOutcome(decodedStatus);   // set dropdown
      setSearchText("");               // optional reset
      setPlatformFilter("All");        // optional reset
      setFromDate("");
      setToDate("");
      setPageNumber(1);
    } else {
      setCallOutcome("");
    }
  }, [decodedStatus]);


  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden py-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search ">
                <input
                  type="text"
                  className="form-control w-auto"
                  placeholder="Search Leads, Name, Phone, Email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
              <div className="d-flex gap-2 align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <label className="text-sm fw-semibold mb-0">
                      Lead Status:
                    </label>
                    <select
                      className="form-control radius-8 px-14 py-6 text-sm w-auto"
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="No Follow Up">No Follow Up</option>
                      <option value="Need More Info">Need More Info</option>
                      <option value="Converted to Customer">Converted to Customer</option>
                      <option value="Not Converted">Not Converted</option>
                      <option value="Not Having Car">Not Having Car</option>
                      <option value="Ringing But Not Responded">Ringing But Not Responded</option>
                      <option value="Busy">Busy</option>
                      <option value="Not Reachable">Not Reachable</option>
                      <option value="Switched Off">Switched Off</option>
                      <option value="Temporary Out of Service">Temporary Out of Service</option>
                      <option value="Number Does Not Exist">Number Does Not Exist</option>
                      <option value="DND">DND</option>
                    </select>
                  </div>
                  <label className="text-sm fw-semibold mb-0">Date Type:</label>
                  <div className="position-relative d-inline-block">
                    <select
                      className="form-control radius-8 px-14 py-6 text-sm w-auto"
                      value={dateType}
                      onChange={(e) => setDateType(e.target.value)}
                    >
                      <option value="created">Created Date</option>
                      <option value="updated">Updated Date</option>
                    </select>
                  </div>
                </div>
                <label className="text-sm fw-semibold mb-0">From:</label>
                <input type="date" className="form-control radius-8 px-14 py-6 text-sm w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <label className="text-sm fw-semibold mb-0">To:</label>
                <input type="date" className="form-control radius-8 px-14 py-6 text-sm w-auto" value={toDate} onChange={(e) => setToDate(e.target.value)} />

                <select className="form-control radius-8 px-14 py-6 text-sm w-auto" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Organic">Organic</option>
                  <option value="Web">Web</option>
                  <option value="App">App</option>
                </select>

                <input type="file" id="organicUpload" style={{ display: "none" }} onChange={handleBulkUpload} />

                {(role === "Admin" || roleName === "Telecaller Head") && (
                  <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={() => document.getElementById("organicUpload").click()} disabled={uploading}>
                    <Icon icon="mdi:upload" className="icon text-xl" /> Bulk Upload
                  </button>
                )}

                {hasPermission("createlead_add") && (
                  <Link to="/create-lead" className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                    <Icon icon="ic:baseline-plus" className="icon text-xl" /> Add Lead
                  </Link>
                )}

                <button className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center" onClick={exportToExcel}>
                  <Icon icon="mdi:microsoft-excel" width="22" height="22" />
                </button>
              </div>
            </div>
          </div>

          {uploading && <div className="m-3">Uploading...</div>}

          <DataTable
            columns={columns}
            data={displayLeads}
            progressPending={loading}
            pagination
            paginationServer
            paginationPerPage={pageSize}
            paginationTotalRows={totalRows}
            paginationDefaultPage={pageNumber}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default OrganicLeadsLayer; 