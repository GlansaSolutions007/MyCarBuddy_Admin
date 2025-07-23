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
    fetchTechnicians();
  }, []);

  const fetchLeaves = async () => {
    // const res = await axios.get(`${import.meta.env.VITE_APIURL}TechnicianLeave`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    const res = [
      {
        "TechnicianID": 1,
        "TechnicianName": "John Doe",
        "LeaveFrom": "2023-05-01",
        "LeaveTo": "2023-05-05",
        "Reason": "Personal",
        "Status": "Pending",
        "LeaveID": 1
    },
    {
        "TechnicianID": 1,
        "TechnicianName": "John Doe",
        "LeaveFrom": "2023-05-01",
        "LeaveTo": "2023-05-05",
        "Reason": "Personal",
        "Status": "Approved",
        "LeaveID": 2
    },
    {
        "TechnicianID": 1,
        "TechnicianName": "John Doe",
        "LeaveFrom": "2023-05-01",
        "LeaveTo": "2023-05-05",
        "Reason": "Personal",
        "Status": "Rejected",
        "LeaveID": 3
    }
    
  ]
    setLeaves(res);
  };

  const fetchTechnicians = async () => {
    const res = await axios.get(`${import.meta.env.VITE_APIURL}Technician`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTechnicians(res.data.data);
  };

  const filteredLeaves = leaves.filter((leave) => {
    const matchTech = !filterTechnicianID || leave.TechnicianID === filterTechnicianID;
    const matchStatus = !filterStatus || leave.Status === filterStatus;
    return matchTech && matchStatus;
  });

  const columns = [
    { name: "Technician", selector: row => row.TechnicianName },
    { name: "From", selector: row => row.LeaveFrom },
    { name: "To", selector: row => row.LeaveTo },
    { name: "Reason", selector: row => row.Reason },
    { name: "Status", selector: row => row.Status },
    {
      name: "Actions",
      cell: (row) => (
        <Link to={`/leave-edit/${row.LeaveID}`} className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center">
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
              <option key={tech.TechnicianID} value={tech.TechnicianID}>{tech.FullName}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
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
