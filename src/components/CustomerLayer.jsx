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

const CustomerLayer = () => {
  const [customers, setCustomers] = useState([]);
  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");

  // useEffect(() => {
  //   fetchCustomers();

  // }, []);

  useEffect(() => {
  // Mock Data
  const mockData = [
    {
      CustID: 101,
      FullName: "Nagaraju K",
      PhoneNumber: "9876543210",
      // AlternateNumber: "9123456789",
      Email: "nagaraju@example.com",
      ProfileImage: "profile101.jpg",
      StateID: 2,
      CityID: 5,
      IsActive: true,
      Status: 1,
    },
  ];
  setCustomers(mockData);
}, []);

  // Fetch dealers, distributors, states, and cities start
    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${API_BASE}Customers`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
            setCustomers(res.data);
        } catch (error) {
            console.error("Failed to load dealers", error);
        }
    };

// Fetch dealers, distributors, states, and cities end



  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
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
    // {
    //   name: "State",
    //   selector: (row) => states.find((s) => s.StateID === row.StateID)?.StateName || "",
    // },
    // {
    //   name: "City",
    //   selector: (row) => cities.find((c) => c.CityID === row.CityID)?.CityName || "",
    // },
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
        <Link to={`/view-customer/${row.CustID}`}
                        className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
                        >
                            <Icon icon='lucide:eye' />
        </Link>
        </>
      ),
    },
  ];

  const filteredCustomers = customers.filter((customers) =>
    customers.FullName?.toLowerCase().includes(searchText.toLowerCase())
  || customers.Email?.toLowerCase().includes(searchText.toLowerCase())
  || customers.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase())

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
            {/* <Link
              to='/add-customer'
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
            >
              <Icon
                icon='ic:baseline-plus'
                className='icon text-xl line-height-1'
              />
              Add Customer
            </Link> */}
          </div>
          <DataTable
            columns={columns}
            data={filteredCustomers}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Customers available"
          />
        </div>
      </div>


    </div>
  );
};

export default CustomerLayer;
