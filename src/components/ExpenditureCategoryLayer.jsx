import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import axios from "axios";
import { usePermissions } from "../context/PermissionContext";

const ExpenditureCategoryLayer = () => {
  const { hasPermission } = usePermissions();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    ExpenseCategoryID: "",
    CategoryName: "",
    IsActive: true,
  });

  const { errors, validate, clearError } = useFormError();

  const API_BASE = `${import.meta.env.VITE_APIURL}Expenditure`;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------------- FETCH ----------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // ---------------- CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, ["ExpenseCategoryID"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      if (formData.ExpenseCategoryID) {
        // UPDATE
        const payload = {
          expenseCategoryID: formData.ExpenseCategoryID,
          categoryName: formData.CategoryName,
          isActive: formData.IsActive,
          modifiedBy: userId,
        };

        await axios.put(API_BASE, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // CREATE
        const payload = {
          categoryName: formData.CategoryName,
          createdBy: userId,
        };

        await axios.post(API_BASE, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      Swal.fire(
        "Success",
        `Expenditure Category ${
          formData.ExpenseCategoryID ? "updated" : "added"
        } successfully`,
        "success"
      );

      fetchCategories();
      setFormData({
        ExpenseCategoryID: "",
        CategoryName: "",
        IsActive: true,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (row) => {
    setFormData({
      ExpenseCategoryID: row.ExpenseCategoryID,
      CategoryName: row.CategoryName,
      IsActive: row.IsActive,
    });
  };
// ---------------- DELETE ----------------
const handleDelete = async (row) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This category will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    await axios.delete(`${API_BASE}/${row.ExpenseCategoryID}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    Swal.fire("Deleted!", "Category deleted successfully.", "success");
    fetchCategories();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Failed to delete category", "error");
  }
};

  // ---------------- TABLE ----------------
  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Category Name",
      selector: (row) => row.CategoryName,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";
        const color = row.IsActive ? "#28A745" : "#E34242";

        return (
          <span
            className="d-flex align-items-center"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
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
    },
    ...(hasPermission("expenditurecat_edit") ||
hasPermission("expenditurecat_delete")
  ? [
      {
        name: "Actions",
        cell: (row) => (
          <div className="d-flex gap-2">
            {hasPermission("expenditurecat_edit") && (
              <button
                onClick={() => handleEdit(row)}
                className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
              >
                <Icon icon="lucide:edit" />
              </button>
            )}

            {hasPermission("expenditurecat_delete") && (
              <button
                onClick={() => handleDelete(row)}
                className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
              >
                <Icon icon="lucide:trash-2" />
              </button>
            )}
          </div>
        ),
      },
    ]
  : []),
  ];

  // ---------------- UI ----------------
  return (
    <div className="row gy-4 mt-2">
      {(hasPermission("expenditure_category_add") ||
        hasPermission("expenditure_category_edit")) && (
        <div className="col-lg-4">
          <div className="card h-100 p-0">
            <div className="card-body p-24">
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Category Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="CategoryName"
                    className={`form-control ${
                      errors.CategoryName ? "is-invalid" : ""
                    }`}
                    placeholder="Enter category name"
                    value={formData.CategoryName}
                    onChange={handleChange}
                  />
                  <FormError error={errors.CategoryName} />
                </div>

                <div className="mb-10">
                  <label className="text-sm fw-semibold text-primary-light mb-8">
                    Status
                  </label>
                  <select
                    className="form-select form-control"
                    value={formData.IsActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        IsActive: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              {(hasPermission("expenditurecat_add") || hasPermission("expenditurecat_edit")) && (
                <button
                  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
                  type="submit"
                >
                  {formData.ExpenseCategoryID
                    ? "Update Category"
                    : "Add Category"}
                </button>
              )}
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="col-lg-8">
        <div className="card overflow-hidden">
          <div className="card-body">
            <DataTable
              columns={columns}
              data={categories}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No categories found"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenditureCategoryLayer;
