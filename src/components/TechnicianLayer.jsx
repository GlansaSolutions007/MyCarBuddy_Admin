import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const TechnicianLayer = () => {
  const { hasPermission } = usePermissions();
  const [technicians, setTechnicians] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');




  useEffect(() => {
    fechTechnicians();
    // fetchDealers();
    // fetchDistributors();

  }, []);

  const fechTechnicians = async () => {
    try {
      const res = await axios.get(`${API_BASE}TechniciansDetails?role=${role}&userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTechnicians(res.data.jsonResult);
    } catch (error) {
      console.error("Failed to load technicians", error);
    }
  };

  // const fetchDealers = async () => {
  //   try {
  //     const res = await axios.get(`${API_BASE}Dealers`, {
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });
  //     setDealers(res.data);
  //   } catch (error) {
  //     console.error("Failed to load dealers", error);
  //   }
  // };

  // const fetchDistributors = async () => {
  //   try {
  //     const res = await axios.get(`${API_BASE}Distributors`, {
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });
  //     setDistributors(res.data);
  //   } catch (error) {
  //     console.error("Failed to load distributors", error);
  //   }
  // };


  const columns = [
    { name: "Tech ID", selector: (row) => row.TechID },
    { name: "Full Name", selector: (row) => row.TechnicianName },
    { name: "Email", selector: (row) => row.Email },
    { name: "Phone", selector: (row) => row.PhoneNumber },
    // {
    //   name: "State",
    //   selector: (row) => row.StateName,
    // },
    // {
    //   name: "City",
    //   selector: (row) => row.CityName,
    // },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Grey (same as bg-secondary)
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      // width: "140px",
    },
    {
      name: "Actions",
      cell: (row) => (
       <div>
         <Link to={`/edit-technicians/${row.TechID}`} className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'>
          <Icon icon='lucide:edit' />
        </Link>
         <Link to={`/view-technician/${row.TechID}`}
                                className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                                >
                                    <Icon icon='lucide:eye' />
                </Link>
       </div>
      ),
    },
  ];

  const filteredTechnicians = technicians.filter((t) =>
    t.TechnicianName?.toLowerCase().includes(searchText.toLowerCase())
    // t.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
    // t.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
    // states.find((s) => s.StateID === t.StateID)?.StateName?.toLowerCase().includes(searchText.toLowerCase()) ||
    // cities.find((c) => c.CityID === t.CityID)?.CityName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="chat-main card overflow-hidden p-3">
          <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
            <form className='navbar-search'>
              <input
                type='text'
                className='bg-base w-auto form-control'
                name='search'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Search'
              />
              <Icon icon='ion:search-outline' className='icon' />
            </form>
      {hasPermission("technicians_add") && (
            <Link
              to='/technicians/add'
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
            >
              <Icon icon='ic:baseline-plus' className='icon text-xl line-height-1' />
              Add Technician
            </Link>
      )}
          </div>

          <DataTable
            columns={columns}
            data={filteredTechnicians}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No technicians available"
          />
        </div>
      </div>
    </div>
  );
};

export default TechnicianLayer;
