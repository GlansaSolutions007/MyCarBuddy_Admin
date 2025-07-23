import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const ServicePlanPriceListLayer = () => {
  const [plans, setPlans] = useState([]);
  const [searchText, setSearchText] = useState("");
  const API_BASE = `${import.meta.env.VITE_APIURL}PlanPackagePrice`;
  const IMAGE_BASE = `${import.meta.env.VITE_APIURL_IMAGE}`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlanPrice();
  }, []);

  const fetchPlanPrice = async () => {
    try {
      const res = await axios.get(`${API_BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     setPlans(res.data.data)
    } catch (error) {
      console.error("Failed to load service plans", error);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete ${name}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/Delete`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { PlanPriceID: id },
        });
        Swal.fire("Deleted!", "The plan price has been deleted.", "success");
        fetchPlans();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const columns = [
    // { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "Package ID", selector: (row) => row.PlanPriceID },

    // { name: "Plan ID", selector: (row) => row.PlanId },
    { name: "Brand", selector: (row) => row.BrandName },
    { name: "Model", selector: (row) => row.ModelName },
    { name: "Fuel Type", selector: (row) => row.FuelTypeName },
    // { name: "Description", selector: (row) => row.Description },
    {
      name: "Price",
      selector: (row) => `₹${row.Serv_Off_Price?.toFixed(2)}`,
    },
    {
      name: "Duration",
      selector: (row) => `${row.EstimatedDurationMinutes} mins`,
    },
    {
      name: "Image",
      cell: (row) =>
        row.ImageURL ? (
          <img
            src={`${IMAGE_BASE}${row.ImageURL.replace(/\s/g, "%20")}`}
            alt="plan"
            style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          "No Image"
        ),
    },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-danger">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link
            to={`/edit-service-plan-price/${row.PlanPriceID}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
          {/* <button
            onClick={() => handleDelete(row.PlanPriceID, row.PlanId)}
            className="btn btn-sm btn-outline-danger"
          >
            <Icon icon="mingcute:delete-2-line" />
          </button> */}
        </div>
      ),
    },
  ];

  const filteredPlans = plans.filter((plan) =>
    // plan.PlanId.toLowerCase().includes(searchText.toLowerCase())
    plan.BrandName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
        </div>

        <div className="chat-main card overflow-hidden p-3">
          <div className="card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
            <div className="d-flex align-items-center flex-wrap gap-3">
              {/* Optional Search */}
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
            <Link
              to={"/add-service-plan-price"}
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
            >
              <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
              Add Package Price
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={filteredPlans}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No service plan prices available"
          />
        </div>
      </div>
    </div>
  );
};

export default ServicePlanPriceListLayer;
