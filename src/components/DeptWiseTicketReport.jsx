import { useEffect, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";

const API_BASE = import.meta.env.VITE_APIURL;

const DeptWiseTicketReport = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Filter departments based on search term
    const filtered = departments.filter((dept) =>
      dept.DepartmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(dept.Id).includes(searchTerm)
    );
    setFilteredDepartments(filtered);
  }, [searchTerm, departments]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}Tickets/DepartmentId`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && Array.isArray(res.data)) {
        // Filter out Admin Department and HR Department
        const filteredData = res.data.filter(dept =>
          dept.DepartmentName !== "Admin Department" && dept.DepartmentName !== "HR Department"
        );

        const departmentsWithStats = filteredData.map((dept) => ({
          Id: dept.DeptId,
          DepartmentName: dept.DepartmentName,
          totalTickets: dept.TotalTickets,
          pendingTickets: dept.PendingCount,
          underReviewTickets: dept.UnderReviewCount,
          awaitingTickets: dept.AwaitingCount,
          resolvedTickets: dept.ResolvedCount,
          closedTickets: dept.ClosedCount,
          cancelledTickets: dept.CancelledCount,
          reopenedTickets: dept.ReopenedCount,
          forwardTickets: dept.ForwardCount,
        }));
        departmentsWithStats.sort((a, b) => b.totalTickets - a.totalTickets);

        setDepartments(departmentsWithStats);
        setFilteredDepartments(departmentsWithStats);
      } else {
        setDepartments([]);
        setFilteredDepartments([]);
      }
    } catch (error) {
      console.error("Failed to load departments", error);
      setError("Failed to load departments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { name: "Department Name", selector: (row) => row.DepartmentName, sortable: true, cell: (row) => <span className="fw-bold">{row.DepartmentName}</span> },
    { name: "Dept ID", selector: (row) => row.Id, sortable: true },
    { name: "Total Tickets", selector: (row) => row.totalTickets, sortable: true },
    { name: "Pending", selector: (row) => row.pendingTickets, sortable: true },
    { name: "Resolved", selector: (row) => row.resolvedTickets, sortable: true },
    { name: "Under Review", selector: (row) => row.underReviewTickets, sortable: true },
    { name: "Awaiting", selector: (row) => row.awaitingTickets, sortable: true },
    { name: "Closed", selector: (row) => row.closedTickets, sortable: true },
    { name: "Cancelled", selector: (row) => row.cancelledTickets, sortable: true },
    { name: "Reopened", selector: (row) => row.reopenedTickets, sortable: true },
    { name: "Forward", selector: (row) => row.forwardTickets, sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Link to={`/dept-employee-reports/${encodeURIComponent(row.DepartmentName)}`} className='w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center'>
            <Icon icon='lucide:eye' />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3"></div>
        <div className="card overflow-hidden p-3">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <form className="navbar-search">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Departments"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
            </div>
          </div>
          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredDepartments}
              progressPending={loading}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
              noDataComponent={
                loading ? "Loading departments..." : "No departments available"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptWiseTicketReport;
