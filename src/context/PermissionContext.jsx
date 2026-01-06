import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import axios from "axios";

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_APIURL;

  // Read from localStorage reactively
  const [authState, setAuthState] = useState(() => {
    return {
      userId: localStorage.getItem("userId"),
      roleId: localStorage.getItem("roleId"),
      role: localStorage.getItem("role"),
      token: localStorage.getItem("token"),
    };
  });

  // Use ref to track previous values without causing re-renders
  const prevAuthStateRef = useRef(authState);

  // Keep ref in sync with authState
  useEffect(() => {
    prevAuthStateRef.current = authState;
  }, [authState]);

  // Listen for localStorage changes (for login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const newState = {
        userId: localStorage.getItem("userId"),
        roleId: localStorage.getItem("roleId"),
        role: localStorage.getItem("role"),
        token: localStorage.getItem("token"),
      };
      prevAuthStateRef.current = newState;
      setAuthState(newState);
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Also check localStorage periodically (for same-tab updates)
    // This handles the case when localStorage is updated in the same tab
    const interval = setInterval(() => {
      const currentUserId = localStorage.getItem("userId");
      const currentRoleId = localStorage.getItem("roleId");
      const currentRole = localStorage.getItem("role");
      const currentToken = localStorage.getItem("token");

      const prev = prevAuthStateRef.current;
      if (
        currentUserId !== prev.userId ||
        currentRoleId !== prev.roleId ||
        currentRole !== prev.role ||
        currentToken !== prev.token
      ) {
        handleStorageChange();
      }
    }, 200); // Check every 200ms (optimized from 100ms)

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - interval runs once

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { userId, roleId, role, token } = authState;

        if (!userId || !token || !roleId) {
          setLoading(false);
          setPermissions([]);
          return;
        }

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
  }, [authState.userId, authState.roleId, authState.role, authState.token, API_BASE]);

  /**
   * ✅ Check if user has a specific permission
   * Automatically returns true if user is Admin
   */
  const hasPermission = (permissionName) => {
    if (authState.role === "Admin") return true; // 👈 bypass for Admin
    // alert(permissionName);
    return permissions.some((p) => p.name === permissionName && p.IsActive);
  };

  /**
   * ✅ Get all active permissions for a specific page
   * Returns all if Admin
   */
  const getPagePermissions = (pageName) => {
    if (authState.role === "Admin") return "ALL";
    return permissions.filter((p) => p.page === pageName && p.IsActive);
  };

  return (
    <PermissionContext.Provider
      value={{ permissions, hasPermission, getPagePermissions, loading, userId: authState.userId }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
