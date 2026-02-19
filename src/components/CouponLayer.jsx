import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import axios from "axios";
import { usePermissions } from "../context/PermissionContext";

const API_BASE = "https://api.mycarsbuddy.com/api/Coupons";

const CouponsPage = () => {
  const { hasPermission } = usePermissions();
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState({
    CouponID: null,
    CouponCode: "",
    Description: "",
    DiscountType: "percentage",
    DiscountValue: "",
    StartDate: "",
    ExpiryDate: "",
    MaxDisAmount: "0",
    MinBookingAmount: "0",
    UsageLimit: "",
    IsActive: true,
  });
  const [editIndex, setEditIndex] = useState(null);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(API_BASE);
      const formatted = res.data.map((item) => ({
        CouponID: item.CouponID,
        CouponCode: item.Code,
        Description: item.Description,
        DiscountType: item.DiscountType,
        DiscountValue: item.DiscountValue,
        StartDate: item.ValidFrom?.substring(0, 10),
        ExpiryDate: item.ValidTill?.substring(0, 10),
        UsageLimit: item.MaxUsagePerUser,
        UsedCount: item.UsedCount || 0,
        IsActive: !!item.IsActive,
        MaxDisAmount: item.MaxDisAmount,
        MinBookingAmount: item.MinBookingAmount,
      }));
      setCoupons(formatted);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      code: formData.CouponCode,
      description: formData.Description,
      discountType: formData.DiscountType,
      discountValue: Number(formData.DiscountValue),
      validFrom: formData.StartDate,
      validTill: formData.ExpiryDate,
      maxUsagePerUser: Number(formData.UsageLimit),
      isActive: formData.IsActive,
      MaxDisAmount: Number(formData.MaxDisAmount),
      MinBookingAmount: Number(formData.MinBookingAmount),
      ...(editIndex !== null
        ? { couponID: formData.CouponID, modifiedBy: 1 }
        : { createdBy: 1 }),
    };

    try {
      if (editIndex !== null) {
        await axios.put(API_BASE, payload);
        Swal.fire("Updated!", "Coupon updated successfully.", "success");
      } else {
        await axios.post(API_BASE, payload);
        Swal.fire("Created!", "Coupon created successfully.", "success");
      }

      setFormData({
        CouponID: null,
        CouponCode: "",
        Description: "",
        DiscountType: "percentage",
        MaxDisAmount: "0",
        MinBookingAmount: "0",
        DiscountValue: "",
        StartDate: "",
        ExpiryDate: "",
        UsageLimit: "",
        IsActive: true,
      });
      setEditIndex(null);
      fetchCoupons();
    } catch (err) {
      Swal.fire("Error", "Operation failed!", "error");
      console.error(err);
    }
  };

  const handleEdit = (coupon, index) => {
    console.log(coupon);
    setFormData(coupon);
    setEditIndex(index);
  };

  const columns = [
    { name: "Code", selector: (row) => row.CouponCode, sortable: true , width: "120px", wrap:true},
    { name: "Description", selector: (row) => row.Description, sortable: true, width: "200px", wrap:true },
    {
      name: "Discount",
      selector: (row) =>
        row.DiscountType === "percentage"
          ? `${row.DiscountValue}%`
          : `₹${row.DiscountValue}`,
      sortable: true,
      width: "120px",
    },
    { name: "Expiry", selector: (row) => row.ExpiryDate, sortable: true, width: "150px",},
    { name: "Max Usage", selector: (row) => row.UsageLimit,sortable: true, width: "130px",},
    {
      name: "Active",
      cell: (row) => {
        const status = row.IsActive ? "Active" : "Inactive";

        // Color map (same style as your sample)
        const colorMap = {
          Active: "#28A745",     // Green
          Inactive: "#E34242",   // Red
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

            {/* Status Text */}
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row, index) => (
        <div className="d-flex gap-2">
          {hasPermission("coupons_edit") && (
          <Link
            onClick={() => handleEdit(row, index)}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
          >
            <Icon icon="lucide:edit" />
          </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="row gy-4 mt-2">
      <div className="col-lg-4">
        <div className="card p-3">
          { (hasPermission("coupons_add") || hasPermission("coupons_edit")) && (
          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                Discount Type
              </label>
              <select
                className="form-select"
                value={formData.DiscountType}
                onChange={(e) =>
                  setFormData({ ...formData, DiscountType: e.target.value })
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount (₹)</option>
              </select>
            </div>

            {[
              ["CouponCode", "Coupon Code"],
              ["Description", "Description"],
              ["DiscountValue", "Discount Value"],
              ["MaxDisAmount", "Max Discount Amount"],
              ["MinBookingAmount", "Min Order Value"],
              ["StartDate", "Start Date", "date"],
              ["ExpiryDate", "Expiry Date", "date"],
              ["UsageLimit", "Usage Limit"],
            ].map(([name, label, type = "text"]) => (
              <div className="mb-3" key={name}>
                <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                  {label}
                </label>
                <input
                  type={type}
                  className="form-control"
                  name={name}
                  value={formData[name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [name]: e.target.value })
                  }
                  required
                />
              </div>
            ))}

            {/* Discount Type Dropdown */}


            {/* ✅ Status Dropdown */}
            <div className="mb-3">
              <label className="text-sm fw-semibold text-primary-light mb-8 d-block">
                Status
              </label>
              <select
                className="form-select"
                value={formData.IsActive ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    IsActive: e.target.value === "true",
                  })
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button
              className="btn btn-primary-600 radius-8 px-14 py-6 text-sm"
              type="submit"
            >
              {editIndex !== null ? "Update" : "Add"} Coupon
            </button>
          </form>
          )}
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
            defaultSortField="CouponID"
            defaultSortAsc={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CouponsPage;
