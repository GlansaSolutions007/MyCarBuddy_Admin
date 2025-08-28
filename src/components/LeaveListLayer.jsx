import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";

const LeaveListLayer = () => {
  const [leaves, setLeaves] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filterTechnicianID, setFilterTechnicianID] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeaves();
    // fetchTechnicians();
  }, []);

  const fetchLeaves = async () => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}LeaveRequest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLeaves(res.data);
  };

  const fetchTechnicians = async () => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}Technician`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTechnicians(res.data);
  };

  const filteredLeaves = leaves.filter((leave) => {
    return (
      (!filterTechnicianID || leave.TechID === filterTechnicianID) &&
      (!filterStatus || leave.Status === filterStatus)
    );
  });

  const columns = [
    { name: "Technician", selector: row => row.TechnicianName },
    { name: "From", selector: row => row.FromDate },
    { name: "To", selector: row => row.ToDate },
    { name: "Reason", selector: row => row.LeaveReason },
    { name: "Status", selector: row => (
      <>
        {row.Status === 0 && <span className="badge bg-warning">Pending</span>}
        {row.Status === 1 && <span className="badge bg-success">Approved</span>}
        {row.Status === 2 && <span className="badge bg-danger">Rejected</span>}
      </>
    )},
    {
      name: "Actions",
      cell: (row) => (
        <Link to={`/leave-edit/${row.LeaveId}`} className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center">
          <Icon icon="lucide:edit" />
        </Link>
      )
    }
  ];

  return (
    <div className="container mt-4">
      <div className="row mb-3">
        <div className="col-md-6">
          <select className="form-select" value={filterTechnicianID} onChange={(e) => setFilterTechnicianID(e.target.value)}>
            <option value="">All Technicians</option>
            {technicians.map(tech => (
              <option key={tech.TechID} value={tech.TechID}>{tech.FullName}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="0">Pending</option>
            <option value="1">Approved</option>
            <option value="2">Rejected</option>
          </select>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredLeaves}
        pagination
        highlightOnHover
        striped
      />
    </div>
  );
};

export default LeaveListLayer;
