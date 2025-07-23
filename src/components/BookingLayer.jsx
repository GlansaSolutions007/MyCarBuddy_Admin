import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from "axios";

const BookingLayer = () => {
  const [bookings, setBookings] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    fechTechnicians();
    fetchDummyData();
  }, []);

  const fetchDummyData = () => {
    const dummyStates = [
      { StateID: 1, StateName: "Telangana" },
      { StateID: 2, StateName: "Andhra Pradesh" },
    ];

    const dummyCities = [
      { CityID: 1, CityName: "Hyderabad", StateID: 1 },
      { CityID: 2, CityName: "Vijayawada", StateID: 2 },
    ];

    const dummyBookings = [
      {
        BookingID: "BK1001",
        BookingPrice: 1499,
        FullName: "Ramesh Kumar",
        PhoneNumber: "9876543210",
        StateID: 1,
        CityID: 1,
        IsActive: true,
        DealerID: 101,
        AssignedTechnician: null,
      },
      {
        BookingID: "BK1002",
        BookingPrice: 999,
        FullName: "Sita Devi",
        PhoneNumber: "9123456789",
        StateID: 2,
        CityID: 2,
        IsActive: false,
        DealerID: 102,
        AssignedTechnician: null,
      },
    ];

    // const dummyTechnicians = [
    //   { value: 1, label: "Rajesh - Tech1" },
    //   { value: 2, label: "Sneha - Tech2" },
    //   { value: 3, label: "Aman - Tech3" },
    // ];

    setStates(dummyStates);
    setCities(dummyCities);
    // setTechnicians(dummyTechnicians);
    setBookings(dummyBookings);
  };

  const fechTechnicians = async () => {
  try {
    const res = await axios.get(`${API_BASE}TechniciansDetails`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setTechnicians(
      res.data.jsonResult.map(t => ({
        value: t.TechID,
        label: `${t.FullName} (${t.PhoneNumber})`
      }))
    );
    console.log(res.data.jsonResult);
  } catch (error) {
    console.error("Failed to load technicians", error);
  }
};

  const handleAssignClick = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnician(null);
    setAssignModalOpen(true);
  };

  const handleAssignConfirm = () => {
    if (selectedTechnician && selectedBooking) {
      const updated = bookings.map((b) =>
        b.BookingID === selectedBooking.BookingID
          ? { ...b, AssignedTechnician: selectedTechnician }
          : b
      );
      setBookings(updated);
      setAssignModalOpen(false);
    }
  };

  const columns = [
    { name: "S.No", selector: (_, index) => index + 1, width: "80px" },
    { name: "BookingID", selector: (row) => row.BookingID },
    { name: "BookingPrice", selector: (row) => `₹${row.BookingPrice}` },
    { name: "Customer Name", selector: (row) => row.FullName },
    { name: "Phone Number", selector: (row) => row.PhoneNumber },
    {
      name: "State",
      selector: (row) => states.find((s) => s.StateID === row.StateID)?.StateName || "",
    },
    {
      name: "City",
      selector: (row) => cities.find((c) => c.CityID === row.CityID)?.CityName || "",
    },
    {
      name: "Status",
      selector: (row) =>
        row.IsActive ? (
          <span className="badge bg-success">Active</span>
        ) : (
          <span className="badge bg-secondary">Inactive</span>
        ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center">
          {/* <Link
            to={`/edit-booking/${row.BookingID}`}
            className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="Edit"
          >
            <Icon icon="lucide:edit" />
          </Link> */}
          <Link
            to={`/view-booking/${row.BookingID}`}
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View"
          >
            <Icon icon="lucide:eye" />
          </Link>
           <Link
            onClick={() => handleAssignClick(row.BookingID)}
             className="w-32-px h-32-px bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center"
            title="View"
          >
             <Icon icon="mdi:account-cog-outline" />
          </Link>
          {/* <button
            className="btn btn-warning btn-sm"
            onClick={() => handleAssignClick(row)}
          >
            {row.AssignedTechnician?.label || "Assign"}
          </button> */}
        </div>
      ),
    },
  ];

  const filteredBookings = bookings.filter((booking) =>
    booking.FullName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="card overflow-hidden p-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <form className="navbar-search">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </form>
          </div>
          <DataTable
            columns={columns}
            data={filteredBookings}
            pagination
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Bookings available"
          />
        </div>
      </div>

      {/* Assign Technician Modal */}
      {assignModalOpen && (
        <div className="modal fade show d-block" style={{ background: "#00000080" }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Assign Technician</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAssignModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <Select
                  options={technicians}
                  value={selectedTechnician}
                  onChange={(val) => setSelectedTechnician(val)}
                  placeholder="Select Technician"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignConfirm}
                  disabled={!selectedTechnician}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingLayer;
