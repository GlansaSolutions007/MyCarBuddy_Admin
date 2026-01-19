import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = import.meta.env.VITE_APIURL;

const CustomerLayer = () => {
  const { hasPermission } = usePermissions();
  const [customers, setCustomers] = useState([]);
  const token = localStorage.getItem('token');
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE}Customer`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setCustomers(res.data.data);
    } catch (error) {
      console.error("Failed to load customers", error);
    }
  };

  // Table columns
  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Full Name",
      selector: (row) => row.FullName,
      sortable: true,
      width: "200px"
    },
    {
      name: "Email",
      selector: (row) => row.Email,
      sortable: true,
      wrap: true,
      width: "200px"
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNumber,
      sortable: true,
      width: "150px"
    },
    {
      name: "Status",
      cell: (row) => {
        // Determine status text
        let status = row.IsDelete === 1
          ? "Inactive"
          : row.IsActive
            ? "Active"
            : "Inactive";

        // Color map like your sample
        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Red (same for deleted or inactive)
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
      sortable: true,
      width: "150px",
    },
    ...(hasPermission("viewcustomer_view")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <>
          <Link
            to={`/view-customer/${row.CustID}`}
            className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'
          >
            <Icon icon='lucide:eye' />
          </Link>
        </>
      ),
    },
      ]
    : []),
  ];

  // Search filter
  const filteredCustomers = customers.filter((customer) =>
    customer.FullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase())
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
                  className='bg-base w-auto form-control'
                  name='search'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search'
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>
            </div>

            {/* Uncomment if Add Customer button needed */}
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
