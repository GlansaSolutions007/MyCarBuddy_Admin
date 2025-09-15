import React, { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import Swal from 'sweetalert2';

const API_BASE = import.meta.env.VITE_APIURL;

const RolePermissionLayer = () => {
  const { roleId } = useParams();
  const [allPermissions, setAllPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPermissions();
    fetchRolePermissions();
  }, [roleId]);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${API_BASE}Permission`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const permissions = res.data;
      setAllPermissions(permissions);

      // Group permissions by page
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.page]) {
          acc[perm.page] = {
            page: perm.page,
            permissions: {}
          };
        }
        // Extract permission type from name (e.g., "customer_add" -> "add")
        const permType = perm.name.split('_')[1] || perm.name;
        acc[perm.page].permissions[permType] = perm;
        return acc;
      }, {});

      setGroupedPermissions(grouped);
    } catch (error) {
      console.error("Failed to load permissions", error);
      Swal.fire('Error', 'Failed to load permissions', 'error');
    }
  };

  const fetchRolePermissions = async () => {
    try {
      // Assuming there's an API to get current role permissions
      // For now, we'll initialize as empty
      setSelectedPermissions({});
    } catch (error) {
      console.error("Failed to load role permissions", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (page, permType, permissionId, checked) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [`${page}_${permType}`]: checked ? permissionId : null
    }));
  };

  const handleSubmit = async () => {
    try {
      const permissionIds = Object.values(selectedPermissions).filter(id => id !== null);

      if (permissionIds.length === 0) {
        Swal.fire('Warning', 'Please select at least one permission', 'warning');
        return;
      }

      // Call rolehaspermissions API for each selected permission
      const promises = permissionIds.map(permissionId =>
        axios.post(`${API_BASE}rolehaspermissions`, {
          permission_id: permissionId,
          role_id: roleId
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(promises);

      Swal.fire('Success', 'Permissions updated successfully', 'success');
    } catch (error) {
      console.error("Failed to update permissions", error);
      Swal.fire('Error', 'Failed to update permissions', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm rounded-3 border-0">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Role Permissions</h5>
        </div>
        <div className="card-body p-4">
          <div className="table-responsive">
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
                    <td className="fw-bold text-start text-center">{pageData.page}</td>
                    {['view', 'add', 'edit', 'delete'].map(permType => (
                      <td key={permType}>
                        <div className='form-switch switch-primary d-flex justify-content-center'>
                          <input
                            className='form-check-input'
                            type='checkbox'
                            role='switch'
                            checked={selectedPermissions[`${pageData.page}_${permType}`] ? true : false}
                            onChange={(e) => {
                              const permission = pageData.permissions[permType];
                              if (permission) {
                                handlePermissionChange(
                                  pageData.page,
                                  permType,
                                  e.target.checked ? permission.id : null,
                                  e.target.checked
                                );
                              }
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-center mt-4">
            <button
              className="btn btn-primary px-5 py-2"
              onClick={handleSubmit}
            >
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RolePermissionLayer;
