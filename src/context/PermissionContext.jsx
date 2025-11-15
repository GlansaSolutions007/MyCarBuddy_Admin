import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const PermissionContext = createContext();

export const PermissionProvider = ({
  userId,
  roleId,
  role,      // 👈 add this prop (e.g. "Admin", "Manager")
  token,
  children,
}) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_APIURL;

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        if (!userId || !token || !roleId) return;

        // 👇 If Admin, no need to fetch permissions
        if (role === "Admin") {
          setPermissions([]); // empty, since Admin can do everything
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE}rolehaspermissions/id?roleId=${roleId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data && Array.isArray(response.data)) {
          const activePermissions = response.data.filter((p) => p.IsActive);
          setPermissions(activePermissions);
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId, roleId, role, token, API_BASE]);

  /**
   * ✅ Check if user has a specific permission
   * Automatically returns true if user is Admin
   */
  const hasPermission = (permissionName) => {
    if (role === "Admin") return true; // 👈 bypass for Admin
    // alert(permissionName)
    return permissions.some((p) => p.name === permissionName && p.IsActive);
  };

  /**
   * ✅ Get all active permissions for a specific page
   * Returns all if Admin
   */
  const getPagePermissions = (pageName) => {
    if (role === "Admin") return "ALL";
    return permissions.filter((p) => p.page === pageName && p.IsActive);
  };

  return (
    <PermissionContext.Provider
      value={{ permissions, hasPermission, getPagePermissions, loading }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
