import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const RolePermissionLayer = () => {
  const { roleId } = useParams();
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [roleId]);

  // Load both permissions and role permissions
  const loadData = async () => {
    try {
      // Always load permissions first
      const permissionsRes = await axios.get(`${API_BASE}Permission`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const permissions = permissionsRes.data;
      setAllPermissions(permissions);

      // Group permissions by page
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.page]) {
          acc[perm.page] = {
            page: perm.page,
            permissions: {},
          };
        }
        const permType = perm.name.split("_")[1] || perm.name;
        acc[perm.page].permissions[permType] = perm;
        return acc;
      }, {});
      setGroupedPermissions(grouped);

      // Try to fetch role permissions separately
      try {
        const rolePermsRes = await axios.get(
          `${API_BASE}rolehaspermissions/id?roleId=${roleId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const rolePermissions = rolePermsRes.data;

        // Preselect role permissions
        const selectedMap = {};
        rolePermissions.forEach((rp) => {
          const perm = permissions.find((p) => p.id === rp.permission_id);
          if (perm) {
            const permType = perm.name.split("_")[1] || perm.name;
            selectedMap[`${perm.page}_${permType}`] = rp.permission_id;
          }
        });
        setSelectedPermissions(selectedMap);
      } catch {
        console.warn(
          "⚠️ Role permissions failed, showing only all permissions"
        );
        // Don’t block UI here, just leave all checkboxes unselected
      }
    } catch (error) {
      console.error("Failed to load permissions", error);
      Swal.fire("Error", "Failed to load permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox toggle
  const handlePermissionChange = (page, permType, permissionId, checked) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [`${page}_${permType}`]: checked ? permissionId : null,
    }));
  };

  // Save updated permissions
  const handleSubmit = async () => {
    try {
      const permissionIds = Object.values(selectedPermissions).filter(
        (id) => id !== null
      );

      if (permissionIds.length === 0) {
        Swal.fire(
          "Warning",
          "Please select at least one permission",
          "warning"
        );
        return;
      }

      await Promise.all(
        permissionIds.map((permissionId) =>
          axios.post(
            `${API_BASE}rolehaspermissions`,
            {
              permission_id: permissionId,
              role_id: roleId,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      Swal.fire("Success", "Permissions updated successfully", "success").then(
        () => {
          navigate("/roles");
        }
      );
    } catch (error) {
      console.error("Failed to update permissions", error);
      Swal.fire("Error", "Failed to update permissions", "error");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="table-responsive rounded-3">
            <table className="table table-hover align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th className="text-center">Page</th>
                  <th className="text-center">View</th>
                  <th className="text-center">Add</th>
                  <th className="text-center">Edit</th>
                  <th className="text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedPermissions).map((pageData, index) => (
                  <tr key={index} className="align-middle">
                    <td className="fw-bold text-center">{pageData.page}</td>
                    {["view", "add", "edit", "delete"].map((permType) => {
                      const permission = pageData.permissions[permType];
                      return (
                        <td key={permType}>
                          <div className="form-switch d-flex justify-content-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={
                                selectedPermissions[
                                  `${pageData.page}_${permType}`
                                ]
                                  ? true
                                  : false
                              }
                              onChange={(e) => {
                                if (permission) {
                                  handlePermissionChange(
                                    pageData.page,
                                    permType,
                                    permission.id,
                                    e.target.checked
                                  );
                                }
                              }}
                              disabled={!permission} // disable if no such permission exists
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-center gap-3 mb-12">
            <button
              className="btn btn-primary px-5 py-2"
              onClick={handleSubmit}
            >
              Save Permissions
            </button>
            <button
              type="button"
              className="btn btn-secondary px-5 py-2"
              onClick={() => navigate("/roles")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionLayer;
