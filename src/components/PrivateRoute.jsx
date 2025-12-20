// // components/PrivateRoute.jsx
// import { Navigate, Outlet } from "react-router-dom";

// const PrivateRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? <Outlet /> : <Navigate to="/sign-in" />;
// };

// export default PrivateRoute;


// components/PrivateRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "../context/PermissionContext";

const PrivateRoute = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // e.g., "Admin" or "User"
  const { hasPermission, loading } = usePermissions();
  const location = useLocation();

  // 🚫 Not logged in → redirect
  if (!token) {
    return <Navigate to="/sign-in" />;
  }
  
  // ✅ Public routes that don't need protection
  const path = location.pathname.replace(/^\/+/, "");
  const basePath = path.split("/")[0];
  const publicPaths = ["access-denied", "sign-in", "forgot-password", "reset-password"];
  if (publicPaths.includes(basePath)) {
    return <Outlet />;
  }
  if (loading) return <Outlet />;
  // ✅ Admins can access everything
  if (role?.toLowerCase() === "admin") {
    return <Outlet />;
  }

  // 🔑 Determine permission key
  const permissionMap = {
    "add-": "_add",
    "edit-": "_edit",
    "view-": "_view",
    "delete-": "_delete",
  };

  let permissionKey = `${basePath}_view`; // default key

  // Detect type of action from path
  for (const [prefix, suffix] of Object.entries(permissionMap)) {
    if (basePath.startsWith(prefix)) {
      const moduleName = basePath.replace(prefix, "");
      permissionKey = `${moduleName}${suffix}`;
      break;
    }
  }
  permissionKey = permissionKey.replace(/-/g, "");

  // 🚫 If missing permission → redirect to Access Denied
  if (!hasPermission(permissionKey)) {
    return <Navigate to="/access-denied" state={{ from: location }} replace />;
  }

  // ✅ Allow access
  return <Outlet />;
};

export default PrivateRoute;
