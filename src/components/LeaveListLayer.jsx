import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { usePermissions } from "../context/PermissionContext";


const LeaveListLayer = () => {
  const { hasPermission } = usePermissions();
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
    { name: "Technician", selector: row => row.TechnicianName, sortable: true, },
    { name: "From", selector: row => row.FromDate, sortable: true, },
    { name: "To", selector: row => row.ToDate, sortable: true, },
    { name: "Reason", selector: row => row.LeaveReason, sortable: true, },
    {
      name: "Status",
      cell: (row) => {
        // Convert numeric status to text
        const statusMap = {
          0: "Pending",
          1: "Approved",
          2: "Rejected",
        };

        const status = statusMap[row.Status] ?? "-";

        // Colors similar to sample code
        const colorMap = {
          Pending: "#F57C00",   // Orange
          Approved: "#28A745",  // Green
          Rejected: "#E34242",  // Red
          "-": "#BFBFBF",       // Grey
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            {/* Dot */}
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>

            {/* Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      sortable: true,
    },
    ...(hasPermission("leavelist_edit")
    ? [
    {
      name: "Actions",
      cell: (row) => (
        <Link to={`/leave-edit/${row.LeaveId}`} className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center">
          <Icon icon="lucide:edit" />
        </Link>
      )
    }
      ]
    : []),
  ];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5></h5>
      </div>
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
