// import { useEffect, useState } from "react";
// import axios from "axios";
// import DataTable from "react-data-table-component";
// import { Icon } from "@iconify/react";
// import { Link } from "react-router-dom";

// const API_BASE = import.meta.env.VITE_APIURL;

// const TodayLeadsLayer = () => {
//   const [leads, setLeads] = useState([]);
//   const [filteredLeads, setFilteredLeads] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [totalRows, setTotalRows] = useState(0);
//   const [allLeads, setAllLeads] = useState([]);
//   const [serverPage, setServerPage] = useState(1);



//   // Assuming employee id is stored or retrieved from token or localStorage
//   const userId = localStorage.getItem("userId");
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     fetchChunk(1);
//   }, []);

//   useEffect(() => {
//     const filtered = leads.filter((lead) => {
//       // filter by searchable fields: FullName, PhoneNumber, Email, City, Leadcreateddate, AssignedDate
//       const term = searchTerm.toLowerCase();
//       return (
//         (lead.FullName && lead.FullName.toLowerCase().includes(term)) ||
//         (lead.PhoneNumber && lead.PhoneNumber.toLowerCase().includes(term)) ||
//         (lead.Email && lead.Email.toLowerCase().includes(term)) ||
//         (lead.City && lead.City.toLowerCase().includes(term)) ||
//         (lead.AssignedDate && lead.AssignedDate.toLowerCase().includes(term)) ||
//         (lead.Leadcreateddate &&
//           lead.Leadcreateddate.toLowerCase().includes(term))
//       );
//     });
//     setFilteredLeads(filtered);
//   }, [searchTerm, allLeads]);

//   const fetchChunk = async (pageNumber) => {
//     try {
//       setLoading(true);

//       const url = `${API_BASE}Leads/TodayAssignedFollowUpLeads?EmpId=${userId}&PageNumber=${pageNumber}&PageSize=100`;

//       const res = await axios.get(url, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (res.data && Array.isArray(res.data.data)) {
//         setAllLeads(prev => [...prev, ...res.data.data]); // append
//         setTotalRows(res.data.totalCount);
//       }

//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };


//   // Format date helper to show nicer dates (like DD-MM-YYYY)
//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     const d = new Date(dateStr);
//     if (isNaN(d)) return "";
//     const day = String(d.getDate()).padStart(2, "0");
//     const month = String(d.getMonth() + 1).padStart(2, "0");
//     const year = d.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   const columns = [
//     {
//       name: "Assigning Date",
//       selector: (row) => formatDate(row.AssignedDate),
//       sortable: true,
//       width: "150px",
//     },
//     {
//       name: "Lead ID",
//       selector: (row) =>
//         (
//           <Link to={`/lead-view/${row.LeadId}`} className="text-primary">
//             {row.LeadId}
//           </Link>
//         ) || "-",
//       sortable: true,
//       width: "150px",
//     },
//     {
//       name: "Full Name",
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
//       name: "Status",
//       selector: (row) => row.Status || "-",
//       sortable: true,
//       wrap: true,
//       width: "180px",
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
//       selector: (row) => formatDate(row.Leadcreateddate),
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
//       name: "Next FollowUp",
//       selector: (row) => row.NextFollowUp_Date || "-",
//       sortable: true,
//       wrap: true,
//       width: "150px",
//     },
//     {
//       name: "Action",
//       cell: (row) => (
//         <Link
//           to={`/lead-view/${row.LeadId}`}
//           className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
//           title="View"
//         >
//           <Icon icon="lucide:eye" />
//         </Link>
//       ),
//       ignoreRowClick: true,
//       allowOverflow: true,
//       button: true,
//     },
//   ];

//   const displayLeads = allLeads.slice(
//     (page - 1) * pageSize,
//     page * pageSize
//   );


//   return (
//     <div className="row gy-4">
//       <div className="col-12">
//         <div className="card p-3">
//           <div className="card-header d-flex justify-content-between align-items-center mb-3">
//             <form className="navbar-search" style={{ width: "300px" }}>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="Search leads"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </form>
//           </div>

//           <DataTable
//             columns={columns}
//             data={displayLeads}
//             progressPending={loading}
//             paginationServer
//             pagination
//             paginationPerPage={pageSize}
//             paginationTotalRows={totalRows}
//             paginationRowsPerPageOptions={[10, 25, 50]}
//             onChangePage={(newPage) => {
//               setPage(newPage);

//               const neededRecords = newPage * pageSize;
//               const totalLoaded = allLeads.length;

//               // If clicked page needs more records
//               if (neededRecords > totalLoaded && totalLoaded < totalRows) {

//                 // Calculate correct server page directly
//                 const requiredServerPage = Math.ceil(neededRecords / 100);

//                 fetchChunk(requiredServerPage);
//                 setServerPage(requiredServerPage);
//               }
//             }}
//             onChangeRowsPerPage={(newSize, page) => {
//               setPageSize(newSize);
//               setPage(page);
//             }}
//           />

//         </div>
//       </div>
//     </div>
//   );
// };

// export default TodayLeadsLayer;

///////////////////////////////////////////////////////

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APIURL;

const TodayLeadsLayer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [allLeads, setAllLeads] = useState([]); // This will act as our master cache

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [callOutcome, setCallOutcome] = useState("");

  const fetchChunk = async (pageNumber, search = "") => {
    try {
      setLoading(true);

      let url = `${API_BASE}Leads/TodayAssignedFollowUpLeads?EmpId=${userId}&PageNumber=${pageNumber}&PageSize=100`;

      // ✅ Only append searchText if search is not empty
      if (search && search.trim() !== "") {
        const encodedSearch = encodeURIComponent(search.trim());
        url += `&SearchText=${encodedSearch}`;
      }
      if (callOutcome && callOutcome !== "") {
        url += `&Status=${callOutcome}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data.data)) {
        const count = res.data.totalCount;
        setTotalRows(count);

        setAllLeads(() => {
          let updated = new Array(count).fill(null);
          const startAt = (pageNumber - 1) * 100;

          res.data.data.forEach((item, index) => {
            updated[startAt + index] = item;
          });

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine which records to show in the table
  const displayLeads = useMemo(() => {
    let data = allLeads;

    // SLICE logic for pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const slice = allLeads.slice(start, end);

    // If we are on a page that isn't loaded yet, return empty objects 
    // This prevents "No records to display" and shows the loader instead
    return slice.map(item => item || {});
  }, [allLeads, page, pageSize, searchTerm]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const columns = [
    {
      name: "Assigning Date",
      selector: (row) => formatDate(row.AssignedDate),
      sortable: true,
      // width: "150px",
    },
    {
      name: "Lead ID",
      cell: (row) =>
        row.LeadId ? (
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
              to={`/lead-view/${row.LeadId}`}
              className="text-primary fw-semibold d-flex align-items-center"
              style={{ textDecoration: "none" }}
            >
              {row.LeadId}
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
        ) : (
          "-"
        ),
      sortable: true,
      width: "130px",
    },
    {
      name: "Full Name",
      selector: (row) => row.FullName || "-",
      sortable: true,
      wrap: true,
      width: "180px",
    },
    {
      name: "Phone Number",
      selector: (row) => row.PhoneNumber || "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "Status",
      selector: (row) => row.Status || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: "Email",
      selector: (row) => row.Email || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: "Created Date",
      selector: (row) => formatDate(row.Leadcreateddate),
      sortable: true,
      width: "150px",
    },
    {
      name: "City",
      selector: (row) => row.City || "-",
      sortable: true,
      width: "180px",
    },
    {
      name: "Next FollowUp",
      selector: (row) => row.NextFollowUp_Date || "-",
      sortable: true,
      width: "150px",
    },
    {
      name: "Action",
      cell: (row) => row.LeadId && (
        <Link
          to={`/lead-view/${row.LeadId}`}
          className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
          title="View"
        >
          <Icon icon="lucide:eye" />
        </Link>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm, callOutcome);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    setAllLeads([]);
    fetchChunk(1, debouncedSearch);
  }, [debouncedSearch, callOutcome]);

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card p-3">
          <div className="card-header d-flex justify-content-between align-items-center mb-3">
            <form className="navbar-search" style={{ width: "300px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search leads ID, Name, Phone, Email, Status"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
            </form>
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
          </div>

          <DataTable
            columns={columns}
            data={displayLeads}
            progressPending={loading && displayLeads.every(item => !item.LeadId)}
            paginationServer
            pagination
            paginationPerPage={pageSize}
            paginationTotalRows={searchTerm ? displayLeads.length : totalRows}
            paginationRowsPerPageOptions={[10, 25, 50]}
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
            onChangePage={(newPage) => {
              setPage(newPage);

              // Calculate if the data for the new page exists in our master array
              const startIndex = (newPage - 1) * pageSize;
              if (!allLeads[startIndex]) {
                const requiredServerPage = Math.ceil((newPage * pageSize) / 100);
                fetchChunk(requiredServerPage, searchTerm);
              }
            }}
            onChangeRowsPerPage={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            persistTableHead
          />
        </div>
      </div>
    </div>
  );
};

export default TodayLeadsLayer;