import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import Select from "react-select";
import { usePermissions } from "../context/PermissionContext";
const API_BASE = `${import.meta.env.VITE_APIURL}`;

const ExpenditureLayer = () => {
  const { hasPermission } = usePermissions();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const fileRef = useRef(null);

  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  const [formData, setFormData] = useState({
    expenseID: "",
    expenseDate: "",
    expenseCategoryID: "",
    amount: "",
    paymentMode: "",
    dealerID: "",
    technicianID: "",
    bookingID: "",
    referenceNo: "",
    notes: "",
    billPath: "",
    status: "",
    isActive: true,
  });

  /* ---------------- FETCH INITIAL DATA ---------------- */

  useEffect(() => {
    fetchExpenses();
    fetchExpenseCategories();
    fetchDealers();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    let data = expenses;
    if (selectedCategory) {
      data = data.filter((e) => e.ExpenseCategoryID === selectedCategory);
    }
    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      data = data.filter(
        (e) =>
          e.ReferenceNo?.toLowerCase().includes(text) ||
          e.Notes?.toLowerCase().includes(text) ||
          String(e.Amount).includes(text)
      );
    }
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter((e) => new Date(e.ExpenseDate) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((e) => new Date(e.ExpenseDate) <= to);
    }
    if (paymentModeFilter) {
      data = data.filter((e) => e.PaymentMode === paymentModeFilter);
    }
    if (paymentStatusFilter) {
      data = data.filter((e) => e.Status === paymentStatusFilter);
    }
    setFilteredExpenses(data);
  }, [
    expenses,
    searchText,
    selectedCategory,
    fromDate,
    toDate,
    paymentModeFilter,
    paymentStatusFilter,
  ]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}Expenditure/Expenditures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  };

  const fetchExpenseCategories = async () => {
    const res = await axios.get(`${API_BASE}Expenditure`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setExpenseCategories(res.data || []);
  };

  const fetchDealers = async () => {
    const res = await axios.get(`${API_BASE}Dealer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDealers(res.data || []);
  };

  const fetchTechnicians = async () => {
    const res = await axios.get(
      `${API_BASE}TechniciansDetails?role=Admin&userId=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setTechnicians(res.data?.jsonResult || []);
  };

  /* ---------------- FORM HANDLERS ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      billPath: `${file.name}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const basePayload = {
        expenseDate: new Date(formData.expenseDate).toISOString(),
        expenseCategoryID: Number(formData.expenseCategoryID),
        amount: Number(formData.amount),
        paymentMode: formData.paymentMode,
        dealerID: formData.dealerID ? Number(formData.dealerID) : null,
        technicianID: formData.technicianID
          ? Number(formData.technicianID)
          : null,
        bookingID: formData.bookingID ? Number(formData.bookingID) : null,
        referenceNo: formData.referenceNo,
        notes: formData.notes,
        billPath: formData.billPath,
        status: formData.status,
        isActive: formData.isActive,
      };

      if (formData.expenseID) {
        // ✅ PUT (UPDATE)
        const updatePayload = {
          ...basePayload,
          expenseID: Number(formData.expenseID),
          modifiedBy: Number(userId),
        };

        await axios.put(`${API_BASE}Expenditure/Expenditure`, updatePayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        Swal.fire("Success", "Expense updated successfully", "success");
      } else {
        // ✅ POST (ADD)
        const createPayload = {
          ...basePayload,
          createdBy: Number(userId),
        };
        await axios.post(`${API_BASE}Expenditure/Expenditure`, createPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        Swal.fire("Success", "Expense added successfully", "success");
      }
      fetchExpenses();
      resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save expense", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      expenseID: "",
      expenseDate: "",
      expenseCategoryID: "",
      amount: "",
      paymentMode: "",
      dealerID: "",
      technicianID: "",
      bookingID: "",
      referenceNo: "",
      notes: "",
      billPath: "",
      status: "",
      isActive: true,
    });

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleEdit = (row) => {
    setFormData({
      expenseID: row.ExpenseID,
      expenseDate: row.ExpenseDate?.split("T")[0],
      expenseCategoryID: row.ExpenseCategoryID,
      amount: row.Amount,
      paymentMode: row.PaymentMode,
      dealerID: row.DealerID,
      technicianID: row.TechnicianID,
      bookingID: row.BookingID,
      referenceNo: row.ReferenceNo,
      notes: row.Notes,
      status: row.Status,
      isActive: row.IsActive,
    });
  };

  const handleDelete = async (expenseID) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This expense will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axios.delete(`${API_BASE}Expenditure/expenditure/${expenseID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      Swal.fire("Deleted!", "Expense deleted successfully", "success");
      fetchExpenses();
    } catch (error) {
      console.error("Delete error:", error?.response?.data || error);
      Swal.fire(
        "Error",
        error?.response?.data?.title || "Failed to delete expense",
        "error"
      );
    }
  };
  /* ---------------- TABLE ---------------- */

  const columns = [
    { name: "S.No", selector: (_, i) => i + 1, width: "70px", sortable: true, },
    { name: "Date", selector: (r) => r.ExpenseDate?.split("T")[0], sortable: true, },
    {
      name: "Category",
      selector: (r) =>
        expenseCategories.find(
          (c) => c.ExpenseCategoryID === r.ExpenseCategoryID
        )?.CategoryName || "-",
        sortable: true,
    },
    { name: "Description", selector: (r) => r.Notes || "-", sortable: true, },
    { name: "Amount", selector: (r) => `₹ ${r.Amount}`, sortable: true, },
    { name: "Payment", selector: (r) => r.PaymentMode || "-", sortable: true, },
    {
      name: "Docs",
      center: true,
      cell: (r) =>
        r.BillPath ? (
          <button
            className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle border-0 d-inline-flex align-items-center justify-content-center"
            title="View Bill"
            onClick={() =>
              window.open( `${import.meta.env.VITE_APIURL_IMAGE}${r.BillPath}`, "_blank")
            }
          >
            <Icon icon="lucide:file-text" />
          </button>
        ) : (
          <span className="text-muted">-</span>
        ),
        width: "70px",
        sortable: true,
    },
    {
      name: "Status",
      cell: (r) => (
        <span
          style={{
            color:
              r.Status === "Paid"
                ? "green"
                : r.Status === "Pending"
                ? "orange"
                : "gray",
            fontWeight: 600,
          }}
        >
          {r.Status || "-"}
        </span>
      ),
      sortable: true,
    },
    ...(hasPermission("expenditures_edit") ||
    hasPermission("expenditures_delete")
      ? [
          {
            name: "Actions",
            cell: (row) => (
              <div className="d-flex">
                {hasPermission("expenditures_edit") && (
                  <button
                    onClick={() => handleEdit(row)}
                    className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle border-0 d-inline-flex align-items-center justify-content-center"
                  >
                    <Icon icon="lucide:edit" />
                  </button>
                )}

                {hasPermission("expenditures_delete") && (
                  <button
                    onClick={() => handleDelete(row.ExpenseID)}
                    className="w-32-px h-32-px bg-danger-focus text-danger-main rounded-circle border-0 d-inline-flex align-items-center justify-content-center"
                  >
                    <Icon icon="lucide:trash-2" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  /* ---------------- UI ---------------- */

  return (
    <div className="row gy-4 mt-2">
      {/* LEFT FORM */}
      <div className="col-lg-4">
        <div className="card p-24">
          <form onSubmit={handleSubmit}>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Expense Category <span className="text-danger">*</span>
              </label>
              <select
                name="expenseCategoryID"
                className="form-select form-control"
                value={formData.expenseCategoryID}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {expenseCategories.map((c) => (
                  <option key={c.ExpenseCategoryID} value={c.ExpenseCategoryID}>
                    {c.CategoryName} ({c.IsActive ? "Active" : "Inactive"})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Expanse Date
              </label>
              <input
                type="date"
                name="expenseDate"
                className="form-control mb-10"
                value={formData.expenseDate}
                onChange={handleChange}
              />
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Enter Amount
              </label>
              <input
                type="number"
                name="amount"
                className="form-control mb-10"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Select Payment Mode
              </label>
              <select
                name="paymentMode"
                className="form-select mb-10"
                value={formData.paymentMode}
                onChange={handleChange}
              >
                <option value="">Payment Mode</option>
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            {/* <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Dealer
              </label>
              <select
                name="dealerID"
                className="form-select form-control"
                value={formData.dealerID}
                onChange={handleChange}
              >
                <option value="">Select Dealer</option>
                {dealers.map((d) => (
                  <option key={d.DealerID} value={d.DealerID}>
                    {d.FullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Technician
              </label>
              <select
                name="technicianID"
                className="form-select form-control"
                value={formData.technicianID}
                onChange={handleChange}
              >
                <option value="">Select Technician</option>
                {technicians.map((t) => (
                  <option key={t.TechID} value={t.TechID}>
                    {t.TechnicianName} ({t.DealerName})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Enter Booking ID
              </label>
              <input
                type="text"
                name="bookingID"
                className="form-control mb-10"
                placeholder="Booking ID"
                onChange={handleChange}
              />
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Enter Reference Number
              </label>
              <input
                type="text"
                name="referenceNo"
                className="form-control mb-10"
                placeholder="Reference No"
                onChange={handleChange}
              />
            </div> */}
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Enter Description
              </label>
              <textarea
                name="notes"
                className="form-control mb-10"
                placeholder="Notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Upload Document
              </label>
              <input
                type="file"
                ref={fileRef}
                className="form-control mb-10"
                onChange={handleFileChange}
              />
            </div>
            <div className="mb-10">
              <label className="text-sm fw-semibold text-primary-light mb-0">
                Select Status
              </label>
              <select
                name="status"
                className="form-select mb-10"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="">Status</option>
                <option>Paid</option>
                <option>Pending</option>
              </select>
            </div>
            {(hasPermission("expenditures_add") ||
              hasPermission("expenditures_edit")) && (
              <button className="btn btn-primary-600 radius-8 px-14 py-6 text-sm">
                {isSubmitting
                  ? "Saving..."
                  : formData.expenseID
                  ? "Update Expense"
                  : "Add Expense"}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT TABLE */}
      <div className="col-lg-8">
        <div className="card mb-24">
          <div className="card-body p-24">
            <div className="row gy-4">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Amount / notes"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <select
                  className="form-select form-control"
                  value={selectedCategory || ""}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Filter by Expense Category</option>
                  {expenseCategories.map((c) => (
                    <option
                      key={c.ExpenseCategoryID}
                      value={c.ExpenseCategoryID}
                    >
                      {c.CategoryName}
                    </option>
                  ))}
                </select>
              </div>
              {/* Date From */}
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              {/* Payment Mode */}
              <div className="col-md-3">
                <select
                  className="form-select form-control"
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                >
                  <option value="">Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="col-md-3">
                <select
                  className="form-select form-control"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <option value="">Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <DataTable
            columns={columns}
            data={filteredExpenses}
            pagination
            highlightOnHover
            striped
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenditureLayer;
