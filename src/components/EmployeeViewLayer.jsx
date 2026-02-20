import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const EmployeeViewLayer = () => {
  const { EmployeeID } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployee();
  }, [EmployeeID]);

  const fetchEmployee = async () => {
    try {
      const res = await axios.get(`${API_BASE}Employee/${EmployeeID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployee(res.data?.[0] || res.data || null);
    } catch (error) {
      console.error("Error fetching employee:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <p>Loading employee details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-5">
        <p>Employee not found</p>
      </div>
    );
  }

  return (
    <div className="row gy-4 mt-3">
      <div className="col-lg-4">
        <div className="user-grid-card border radius-16 overflow-hidden bg-base h-100">
          <div className="p-3 text-center">
            <img
              src="/assets/images/user-grid/user-grid-img13.png"
              alt={employee.Name || "Employee"}
              className="border border-2 border-white w-150-px h-150-px rounded-circle object-fit-cover"
              style={{ width: "150px", height: "150px" }}
            />
            <h5 className="mt-3 mb-1">{employee.Name || "N/A"}</h5>
            <span className="text-muted">{employee.Email || "No email"}</span>
          </div>
          <div className="p-3">
            <h6 className="text-primary mb-3">Employee Information</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <strong>Employee ID:</strong> {employee.Id || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Email:</strong> {employee.Email || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Phone:</strong> {employee.PhoneNumber || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Role:</strong> {employee.RoleName || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Department:</strong> {employee.DepartmentName || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Status:</strong>{" "}
                <span className={employee.IsActive ? "text-success" : "text-danger"}>
                  {employee.IsActive ? "Active" : "Inactive"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card h-100">
          <div className="card-body p-24">
            <h6 className="text-xl mb-16 border-bottom pb-2">Additional Details</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong>Designation:</strong> {employee.DesignationName || "N/A"}
              </div>
              <div className="col-md-6 mb-3">
                <strong>Created Date:</strong>{" "}
                {employee.CreatedDate
                  ? new Date(employee.CreatedDate).toLocaleString("en-GB")
                  : "N/A"}
              </div>
              {employee.ModifiedDate && (
                <div className="col-md-6 mb-3">
                  <strong>Modified Date:</strong>{" "}
                  {new Date(employee.ModifiedDate).toLocaleString("en-GB")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeViewLayer;
