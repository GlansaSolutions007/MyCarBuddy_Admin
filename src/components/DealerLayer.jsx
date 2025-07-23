import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from 'sweetalert2';
import Select from 'react-select';
import useFormError from "../hook/useFormError"; // form errors
import FormError from "./FormError"; // form errors

const API_BASE = import.meta.env.VITE_APIURL;

const DealerLayer = () => {
  const [dealers, setDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchDealers();
    fetchDistributors();
    fetchStates();
    fetchCities();
  }, []);

  // Fetch dealers, distributors, states, and cities start
    const fetchDealers = async () => {
        try {
            const res = await axios.get(`${API_BASE}Dealer`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
            setDealers(res.data);
        } catch (error) {
            console.error("Failed to load dealers", error);
        }
    };
  const fetchDistributors = async () => {
      try {
        const res = await axios.get(`${API_BASE}Distributors`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
        setDistributors(res.data);
      } catch (error) {
        console.error("Failed to load dealers", error);
      }
    };
  
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE}State`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
        setStates(res.data);
      } catch (error) {
        console.error("Failed to load dealers", error);
      }
    };
  
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${API_BASE}City`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } 
        });
        setCities(res.data);
      } catch (error) {
        console.error("Failed to load dealers", error);
      }
    };

// Fetch dealers, distributors, states, and cities end



  const columns = [
    {
      name: "Dealer ID",
      selector: (row) => row.DealerID,
    },
    {
      name: "Full Name",
      selector: (row) => row.FullName,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber,
    },
    {
      name: "State",
      selector: (row) => states.find((s) => s.StateID === row.StateID)?.StateName || "",
    },
    {
      name: "City",
      selector: (row) => cities.find((c) => c.CityID === row.CityID)?.CityName || "",
    },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
        <Link to={`/edit-dealers/${row.DealerID}`}
                        className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                        >
                            <Icon icon='lucide:edit' />
        </Link>
        </>
      ),
    },
  ];

  const filteredDealers = dealers.filter((dealers) =>
    dealers.name?.toLowerCase().includes(searchText.toLowerCase())
  || dealers.email?.toLowerCase().includes(searchText.toLowerCase())
  || dealers.phoneNumber?.toLowerCase().includes(searchText.toLowerCase())
  || states.find((s) => s.StateID === dealers.StateID)?.StateName?.toLowerCase().includes(searchText.toLowerCase())
  || cities.find((c) => c.CityID === dealers.CityID)?.CityName?.toLowerCase().includes(searchText.toLowerCase())

  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
         
        </div>

        <div className="chat-main card overflow-hidden p-3">
          <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
            <div className='d-flex align-items-center flex-wrap gap-3'>


              <form className='navbar-search'>
                <input
                  type='text'
                  className='bg-base  w-auto form-control '
                  name='search'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search'
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>

            </div>
            {/* <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" onClick={() => { resetForm(); clearAllErrors();  setShowModal(true); }}>
                Add Distributor
            </button> */}
            <Link
              to='/add-dealers'
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
            >
              <Icon
                icon='ic:baseline-plus'
                className='icon text-xl line-height-1'
              />
              Add Dealer
            </Link>
          </div>
          <DataTable
            columns={columns}
            data={filteredDealers}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No dealers available"
          />
        </div>
      </div>


    </div>
  );
};

export default DealerLayer;
