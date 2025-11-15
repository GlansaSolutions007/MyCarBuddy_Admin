import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { usePermissions } from "../context/PermissionContext";
const API_BASE = import.meta.env.VITE_APIURL;

const DealerLayer = () => {
  const { hasPermission } = usePermissions();
  const [dealers, setDealers] = useState([]);
  const [searchText, setSearchText] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDealers();
  }, []);

  // Fetch Dealers
  const fetchDealers = async () => {
    const url =
      role === "Admin"
        ? `${API_BASE}Dealer`
        : `${API_BASE}Dealer?role=${role}&DistributorID=${userId}`;
    try {
      const res = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setDealers(res.data);
    } catch (error) {
      console.error("Failed to load dealers", error);
    }
  };

  // DataTable Columns
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
      name: "City",
      selector: (row) => row.CityName,
    },
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
      // width: "150px",
    },
     ...(hasPermission("dealers_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <Link
          to={`/edit-dealers/${row.DealerID}`}
          className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
        >
          <Icon icon="lucide:edit" />
        </Link>
      ),
    },
    ]
    : []),
  ];

  // Search Filtering
  const filteredDealers = dealers.filter((dealer) => {

    return (
      dealer.FullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      dealer.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
      dealer.PhoneNumber?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* <h5>Dealers</h5> */}
        </div>

        <div className="chat-main card overflow-hidden p-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <form className="navbar-search">
              <input
                type="text"
                className="bg-base w-auto form-control"
                name="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search"
              />
              <Icon icon="ion:search-outline" className="icon" />
            </form>
          {hasPermission("dealers_add") && (
          <Link
                  to="/add-dealers"
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                >
                  <Icon
                    icon="ic:baseline-plus"
                    className="icon text-xl line-height-1"
                  />
                  Add Dealer
                </Link>
          )}
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
