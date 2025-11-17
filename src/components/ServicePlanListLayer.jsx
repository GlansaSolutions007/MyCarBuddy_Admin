import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { usePermissions } from "../context/PermissionContext";

const ServicePlanListLayer = () => {
  const { hasPermission } = usePermissions();
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredPlans, setFilteredPlans] = useState([]);
  const API_BASE = `${import.meta.env.VITE_APIURL}PlanPackage`;
  const CATEGORY_API = `${import.meta.env.VITE_APIURL}Category`;
  const token = localStorage.getItem("token");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchPlans();
    fetchCategories();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_BASE}/GetPlanPackagesDetails`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlans(res.data);
    } catch (error) {
      console.error("Failed to load service plans", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(CATEGORY_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  useEffect(() => {
    let filtered = plans;
    if (searchText) {
      filtered = filtered.filter((plan) =>
        plan.PackageName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((plan) => plan.CategoryName === selectedCategory);
    }
    setFilteredPlans(filtered);
  }, [plans, searchText, selectedCategory]);

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
        await axios.delete(`${API_BASE}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { PlanID: id },
        });
        Swal.fire("Deleted!", "The plan has been deleted.", "success");
        fetchPlans();
      } catch (error) {
        console.error("Delete failed", error);
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
    },
    {
      name: "Plan Name",
      selector: (row) => row.PackageName,
    },
    {
      name: "Category",
      selector: (row) => row.CategoryName,
    },
    {
      name: "SubCategory1",
      selector: (row) => row.SubCategoryName,
    },
    // {
    //   name: "SubCategory2",
    //   selector: (row) => row.SubCategoryName2,
    // },
    // {
    //   name: "Price",
    //   selector: (row) => `₹${row.includePrices.toFixed(2)}`,
    // },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        // Color mapping (same pattern as your sample code)
        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Red
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
    },
    ...(hasPermission("serviceplans_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div>
          {hasPermission("serviceplans_edit") && (
          <Link
            to={`/edit-service-package/${row.PackageID}`}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
          )}
          {/* {hasPermission("serviceplans_delete") && (
          <button
            onClick={() => handleDelete(row.PlanID, row.PlanName)}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="mingcute:delete-2-line" />
          </button>
          )} */}
        </div>
      ),
    },
     ]
    : []),
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="chat-main card overflow-hidden p-3">
          <div className='card-header border-bottom bg-base pt-0 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between'>
            <div className='d-flex align-items-center flex-wrap gap-3'>
              <form className='navbar-search d-flex align-items-center gap-2'>
                <input
                  type='text'
                  className='bg-base w-auto form-control'
                  name='search'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder='Search by Plan Name'
                />
                <Icon icon='ion:search-outline' className='icon' />
              </form>
              <select
                className="form-select  w-auto form-control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryName}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>
            {hasPermission("serviceplans_add") && (
            <Link
              to={"/add-service-package"}
              className='btn btn-primary-600 radius-8 px-14 py-6 text-sm'
            >
              <Icon
                icon='ic:baseline-plus'
                className='icon text-xl line-height-1'
              />
              Add Packages
            </Link>
            )}
          </div>
          <DataTable
            columns={columns}
            data={filteredPlans}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No plans available"
          />
        </div>
      </div>

    </div>
  );
};

export default ServicePlanListLayer;