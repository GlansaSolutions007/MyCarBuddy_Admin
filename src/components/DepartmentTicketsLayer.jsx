import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import PropTypes from "prop-types";

const API_BASE = import.meta.env.VITE_APIURL;

const DepartmentTicketsLayer = ({ deptId }) => {
  DepartmentTicketsLayer.propTypes = {
    deptId: PropTypes.string,
  };
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentStats, setDepartmentStats] = useState({
    departmentName: "Support Department",
    totalEmployees: 0,
    totalTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployees();
  }, [deptId]);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter((emp) =>
      emp.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.PhoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(emp.Id).includes(searchTerm)
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}Tickets/EmployeeId`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data)) {
        // Filter to show only employees from the specified department and exclude null EmployeeId
        const departmentEmployees = res.data.filter(item =>
          item.EmployeeId !== null && (deptId ? item.DepartmentName === deptId : item.DepartmentName === "Support Department")
        );

        // Map the data to match the component's expected structure
        const employeesWithTickets = departmentEmployees.map((item) => ({
          Id: item.EmployeeId,
          Name: item.EmployeeName,
          PhoneNumber: item.PhoneNumber,
          RoleName: item.RoleName,
          DepartmentName: item.DepartmentName,
          totalTickets: item.TotalTickets,
          pendingTickets: item.PendingCount + item.UnderReviewCount + item.AwaitingCount + item.ReopenedCount,
          resolvedTickets: item.ResolvedCount + item.ClosedCount + item.CancelledCount,
        }));
        employeesWithTickets.sort((a, b) => b.totalTickets - a.totalTickets);

        // Calculate department stats
        const totalEmployees = employeesWithTickets.length;
        const totalTickets = employeesWithTickets.reduce((sum, emp) => sum + emp.totalTickets, 0);
        const pendingTickets = employeesWithTickets.reduce((sum, emp) => sum + emp.pendingTickets, 0);
        const resolvedTickets = employeesWithTickets.reduce((sum, emp) => sum + emp.resolvedTickets, 0);

        setDepartmentStats({
          departmentName: deptId || "Support Department",
          totalEmployees,
          totalTickets,
          pendingTickets,
          resolvedTickets,
        });

        setEmployees(employeesWithTickets);
        setFilteredEmployees(employeesWithTickets);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error("Failed to load employees", error);
      setError("Failed to load employees. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    // { name: "Employee Name", selector: (row) => row.Name, sortable: true, cell: (row) => <span className="fw-bold">{row.Name}</span>, },
    { name: "Employee Name", selector: (row) => row.Name, sortable: true, cell: (row) => {
        const formattedName = row.Name ? row.Name.replace(/\b\w/g, (char) => char.toUpperCase()) : "N/A";
        return <span className="fw-bold">{formattedName}</span>;
      },
    },
    // { name: "Emp ID", selector: (row) => row.Id, sortable: true },
    { name: "Designation", selector: (row) => row.RoleName || "N/A", sortable: true },
    { name: "Phone Number", selector: (row) => row.PhoneNumber },
    { name: "Total Tickets", selector: (row) => row.totalTickets, sortable: true },
    { name: "Pending Tickets", selector: (row) => row.pendingTickets, sortable: true },
    { name: "Resolved Tickets", selector: (row) => row.resolvedTickets, sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link to={`/view-employee-report/${row.Id}`} className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'>
            <Icon icon='lucide:eye' />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="row position-relative">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            {/* Department Stats */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="card bg-body-secondary border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Department : </span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{departmentStats.departmentName}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-primary-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Employee : </span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{departmentStats.totalEmployees}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-info-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Tickets : </span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{departmentStats.totalTickets}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-warning-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Pending : </span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{departmentStats.pendingTickets}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-success-subtle border-0 shadow-sm">
                  <div className="card-body py-1 d-flex justify-content-between">
                    <span className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>Resolved : </span>
                    <p className="card-text mb-0 fw-bold" style={{ fontSize: '14px' }}>{departmentStats.resolvedTickets}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center flex-wrap gap-3">
                <form className="navbar-search">
                  <input
                    type="text"
                    className="bg-base w-auto form-control"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon icon="ion:search-outline" className="icon" />
                </form>
              </div>
            </div>
          </div>

          <div className="card-body">
            {error ? (
              <div className="alert alert-danger m-3">{error}</div>
            ) : (
              <DataTable
                className="rounded-3"
                columns={columns}
                data={filteredEmployees}
                progressPending={loading}
                pagination
                responsive
                highlightOnHover
                pointerOnHover
                noDataComponent={
                  <div className="text-center py-4">
                    <Icon icon="lucide:users" size={48} className="text-muted mb-3" />
                    <p className="text-muted">No employees found</p>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentTicketsLayer;
