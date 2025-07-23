import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_APIURL;

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState({
    CouponCode: "",
    Description: "",
    DiscountType: "percentage",
    DiscountValue: "",
    MinBookingAmount: "",
    StartDate: "",
    ExpiryDate: "",
    UsageLimit: "",
    IsActive: true,
  });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    setCoupons([
      {
        CouponCode: "NEW50",
        Description: "50% off for first time users",
        DiscountType: "percentage",
        DiscountValue: 50,
        MinBookingAmount: 500,
        StartDate: "2025-07-01",
        ExpiryDate: "2025-07-31",
        UsageLimit: 100,
        UsedCount: 10,
        IsActive: true,
      },
      {
        CouponCode: "SAVE200",
        Description: "Flat ₹200 off on bookings above ₹1000",
        DiscountType: "amount",
        DiscountValue: 200,
        MinBookingAmount: 1000,
        StartDate: "2025-07-10",
        ExpiryDate: "2025-08-10",
        UsageLimit: 50,
        UsedCount: 5,
        IsActive: false,
      },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      const updated = [...coupons];
      updated[editIndex] = { ...formData, UsedCount: coupons[editIndex].UsedCount || 0 };
      setCoupons(updated);
    } else {
      setCoupons([...coupons, { ...formData, UsedCount: 0 }]);
    }
    setFormData({
      CouponCode: "",
      Description: "",
      DiscountType: "percentage",
      DiscountValue: "",
      MinBookingAmount: "",
      StartDate: "",
      ExpiryDate: "",
      UsageLimit: "",
      IsActive: true,
    });
    setEditIndex(null);
  };

  const handleEdit = (coupon, index) => {
    setFormData(coupon);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = [...coupons];
        updated.splice(index, 1);
        setCoupons(updated);
        Swal.fire("Deleted!", "Coupon deleted.", "success");
      }
    });
  };

  const columns = [
    { name: "Code", selector: (row) => row.CouponCode, sortable: true },
    { name: "Description", selector: (row) => row.Description },
    {
      name: "Discount",
      selector: (row) =>
        row.DiscountType === "percentage"
          ? `${row.DiscountValue}%`
          : `₹${row.DiscountValue}`,
    },
    { name: "Min Amount", selector: (row) => `₹${row.MinBookingAmount}` },
    { name: "Expiry", selector: (row) => row.ExpiryDate },
    {
      name: "Active",
      cell: (row, index) => (
        <input
          type="checkbox"
          checked={row.IsActive}
          onChange={() => {
            const updated = [...coupons];
            updated[index].IsActive = !updated[index].IsActive;
            setCoupons(updated);
          }}
        />
      ),
    },
    {
      name: "Actions",
      cell: (row, index) => (
        <div className="d-flex gap-2">
         
            <Link
                    onClick={() => handleEdit(row)}
                    className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  >
                    <Icon icon="lucide:edit" />
            </Link>
            <Link 
                    onClick={() => handleDelete(index)}
                    className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  >
                    <Icon icon="mingcute:delete-2-line" />
            </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="row gy-4 mt-2">
      <div className="col-lg-4">
        <div className="card p-3">
          {/* <h5>{editIndex !== null ? "Edit Coupon" : "Add Coupon"}</h5> */}
          <form onSubmit={handleSubmit}>
            {[
              ["CouponCode", "Coupon Code"],
              ["Description", "Description"],
              ["DiscountValue", "Discount Value"],
              ["MinBookingAmount", "Min Booking Amount"],
              ["StartDate", "Start Date", "date"],
              ["ExpiryDate", "Expiry Date", "date"],
              ["UsageLimit", "Usage Limit"],
            ].map(([name, label, type = "text"]) => (
              <div className="mb-3" key={name}>
                <label className="text-sm fw-semibold text-primary-light mb-8 d-block">{label}</label>
                <input
                  type={type}
                  className="form-control"
                  name={name}
                  value={formData[name]}
                  onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                  required
                />
              </div>
            ))}

            <div className="mb-3">
              <label className="text-sm fw-semibold text-primary-light mb-8 d-block">Discount Type</label>
              <select
                className="form-select"
                value={formData.DiscountType}
                onChange={(e) => setFormData({ ...formData, DiscountType: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formData.IsActive}
                onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
              />
              <label className="form-check-label">Active</label>
            </div> */}

            <button  className="btn btn-primary-600 radius-8 px-14 py-6 text-sm" type="submit">
              {editIndex !== null ? "Update" : "Add"} Coupon
            </button>
          </form>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card p-3">
          <DataTable
            columns={columns}
            data={coupons}
            pagination
            striped
            highlightOnHover
            persistTableHead
          />
        </div>
      </div>
    </div>
  );
};

export default CouponsPage;
