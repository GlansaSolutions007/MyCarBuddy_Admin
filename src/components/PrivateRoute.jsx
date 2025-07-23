// components/PrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/sign-in" />;
};

export default PrivateRoute;