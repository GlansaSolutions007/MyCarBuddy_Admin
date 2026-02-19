import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import useFormError from "../hook/useFormError";
import FormError from "./FormError";
import axios from "axios";
import { usePermissions } from "../context/PermissionContext";

const SkillLayer = () => {
  const { hasPermission } = usePermissions();
  const [skills, setSkills] = useState([]);
  const [formData, setFormData] = useState({
    SkillID: "",
    SkillName: "",
    Description: "",
    IsActive: true,
  });
  const { errors, validate, clearError } = useFormError();
  const API_BASE = `${import.meta.env.VITE_APIURL}Skills`;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchSkill();
  }, []);

  const fetchSkill = () => {
    const res = axios.get(API_BASE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    res.then((res) => {
      setSkills(res.data);
    })
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(formData, ["SkillID"]);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      let res;
      if (formData.SkillID) {
        const payload = {
          ...formData,
          ModifiedBy: userId,
        };
        res = axios.put(API_BASE, formData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        const { SkillID, ...rest } = formData;
        const payload = {
          ...rest,
          CreatedBy: userId,
        };
        res = axios.post(API_BASE, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

      }
      Swal.fire({
        title: "Success",
        text: `Skill ${formData.SkillID ? "updated" : "added"} successfully`,
        icon: "success",
      });

      fetchSkill();
      setFormData({ SkillID: "", SkillName: "", IsActive: true, Description: "" });

    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
      })
    }
  };

  const handleEdit = (skill) => {
    setFormData(skill);
  };

  const columns = [
    {
      name: "S.No",
      selector: (_, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Skill Name",
      selector: (row) => row.SkillName,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        const colorMap = {
          Active: "#28A745",    // Green
          Inactive: "#E34242",  // Red
        };

        const color = colorMap[status] || "#6c757d";

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
    ...(hasPermission("skills_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex">
          <button
            onClick={() => handleEdit(row)}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </button>
        </div>
      ),
    },
      ]
    : []),
  ];

  return (
    <div className="row gy-4 mt-2">
    { (hasPermission("skills_add") || hasPermission("skills_edit")) && (
      <div className="col-lg-4">
        <div className="card h-100 p-0">
          <div className="card-body p-24">
            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Skill Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="SkillName"
                  className={`form-control ${errors.SkillName ? "is-invalid" : ""}`}
                  placeholder="Enter skill name"
                  value={formData.SkillName}
                  onChange={handleChange}
                />
                <FormError error={errors.SkillName} />
              </div>
              {/* Description */}
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Description
                </label>
                <textarea
                  name="Description"
                  className="form-control"
                  placeholder="Enter description"
                  value={formData.Description}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="mb-10">
                <label className="text-sm fw-semibold text-primary-light mb-8">
                  Status
                </label>
                <select
                  name="IsActive"
                  className="form-select form-control"
                  value={formData.IsActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({ ...formData, IsActive: e.target.value === "true" })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" type="submit">
                {formData.SkillID ? "Update Skill" : "Add Skill"}
              </button>
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
              data={skills}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent="No skills found"
              defaultSortField="SkillID"
              defaultSortAsc={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillLayer;
