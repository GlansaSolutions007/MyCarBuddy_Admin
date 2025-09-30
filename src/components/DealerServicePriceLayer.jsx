import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;

const DealerServicePrice = () => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_BASE}Contact`);
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to load dealers", error);
    }
  };

  const columns = [
    {
      name: "S No.",
      selector: (_, index) => index + 1,
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.Name,
    },
    {
      name: "Email",
      selector: (row) => row.Email,
    },
    {
      name: "Phone Number",
      selector: (row) => row.PhoneNumber,
    },
    {
      name: "Subject",
      selector: (row) => row.Subject,
    },
    {
      name: "Message",
      selector: (row) => row.Message,
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="chat-main card overflow-hidden p-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <div className="d-flex align-items-center flex-wrap gap-3">
              {/* Add search/filter here later if needed */}
            </div>
            <Link
              to={"/add-dealer-service-price"}
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
            >
              <Icon
                icon="ic:baseline-plus"
                className="icon text-xl line-height-1"
              />
              Add Service Prices
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={contacts}
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

export default DealerServicePrice;
