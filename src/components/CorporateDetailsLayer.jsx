import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;

const CorporateDetailsLayer = () => {
  const [corporateContacts, setCorporateContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companySizeFilter, setCompanySizeFilter] = useState("all");

  useEffect(() => {
    fetchCorporateContacts();
  }, []);

  const fetchCorporateContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}Contact/GetCorporateContactForm`);
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      setCorporateContacts(data);
    } catch (error) {
      console.error("Failed to load corporate contact details", error);
      setCorporateContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const companySizeOptions = useMemo(() => {
    const sizes = corporateContacts
      .map((item) => item.CompanySize)
      .filter(Boolean)
      .sort();
    return [...new Set(sizes)];
  }, [corporateContacts]);

  const filteredContacts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return corporateContacts.filter((row) => {
      const searchValue = [
        row.CompanyName,
        row.ContactPerson,
        row.BusinessEmail,
        row.PhoneNumber,
        row.CompanySize,
        row.ServicesRequired,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchValue.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? row.IsActive : !row.IsActive);
      const matchesCompanySize =
        companySizeFilter === "all" || row.CompanySize === companySizeFilter;

      return matchesSearch && matchesStatus && matchesCompanySize;
    });
  }, [corporateContacts, searchText, statusFilter, companySizeFilter]);

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setCompanySizeFilter("all");
  };

  const columns = useMemo(
    () => [
      {
        name: "S No.",
        selector: (_, index) => index + 1,
        width: "90px",
        sortable: true,
      },
      {
        name: "Company Name",
        selector: (row) => row.CompanyName || "-",
        sortable: true,
        wrap: true,
      },
      {
        name: "Contact Person",
        selector: (row) => row.ContactPerson || "-",
        sortable: true,
        wrap: true,
      },
      {
        name: "Business Email",
        selector: (row) => row.BusinessEmail || "-",
        sortable: true,
        wrap: true,
      },
      {
        name: "Phone Number",
        selector: (row) => row.PhoneNumber || "-",
        sortable: true,
      },
      {
        name: "Company Size",
        selector: (row) => row.CompanySize || "-",
        sortable: true,
      },
      {
        name: "Services Required",
        selector: (row) => row.ServicesRequired || "-",
        sortable: true,
        wrap: true,
      },
      {
        name: "Created Date",
        selector: (row) => formatDate(row.CreatedDate),
        sortable: true,
        wrap: true,
      },
      {
        name: "Status",
        selector: (row) => (row.IsActive ? "Active" : "Inactive"),
        sortable: true,
      },
    ],
    [],
  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="chat-main card overflow-hidden p-3">
          <div className="d-flex flex-wrap gap-3 mb-3">
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: "280px" }}
              placeholder="Search company, person, email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <select
              className="form-select"
              style={{ maxWidth: "180px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="form-select"
              style={{ maxWidth: "220px" }}
              value={companySizeFilter}
              onChange={(e) => setCompanySizeFilter(e.target.value)}
            >
              <option value="all">All Company Sizes</option>
              {companySizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredContacts}
            progressPending={loading}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No corporate details available"
            defaultSortField="Id"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CorporateDetailsLayer;
