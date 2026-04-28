import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import DataTable from "react-data-table-component";
import { Link } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import axios from "axios";
import * as XLSX from "xlsx";
import { usePermissions } from "../context/PermissionContext";

const RefundLayer = () => {
  const { hasPermission } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [cachedBankDetails, setCachedBankDetails] = useState({});
  const [refundType, setRefundType] = useState("cash");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [highestRazorpayAmount, setHighestRazorpayAmount] = useState(0);
  const [hasRazorpayPayments, setHasRazorpayPayments] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_APIURL;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch bank details for all bookings
  useEffect(() => {
    if (bookings.length > 0) {
      bookings.forEach((booking) => {
        if (booking.CustID && !cachedBankDetails[booking.CustID]) {
          fetchCachedBankDetails(booking.CustID);
        }
      });
    }
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}Bookings?IsRefunded=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedBookings = res.data.sort(
        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
      );
      setBookings(sortedBookings);
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const fetchBankDetails = async (customerId) => {
    if (!customerId) return;
    setLoadingBankDetails(true);
    try {
      const res = await axios.get(
        `${API_BASE}Customer/get-customer-bank-details?customerId=${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data) {
        setBankDetails(res.data);
      } else {
        setBankDetails(null);
      }
    } catch (err) {
      console.error("Failed to fetch bank details", err);
      setBankDetails(null);
    } finally {
      setLoadingBankDetails(false);
    }
  };

  const fetchCachedBankDetails = async (customerId) => {
    if (!customerId) return null;
    if (cachedBankDetails[customerId]) {
      return cachedBankDetails[customerId];
    }
    try {
      const res = await axios.get(
        `${API_BASE}Customer/get-customer-bank-details?customerId=${customerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data) {
        setCachedBankDetails((prev) => ({
          ...prev,
          [customerId]: res.data,
        }));
        return res.data;
      }
    } catch (err) {
      console.error("Failed to fetch bank details", err);
    }
    return null;
  };

  const fetchPaymentHistory = async (bookingId) => {
  if (!bookingId) return;

  setLoadingPayments(true);

  try {
    const res = await axios.get(
      `${API_BASE}Bookings/BookingId?Id=${bookingId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.data && Array.isArray(res.data)) {
      setPaymentHistory(res.data);

      // ✅ Extract all payments from bookings
      const allPayments = res.data.flatMap((b) => b.Payments || []);

      // ✅ Filter Razorpay + not refunded
      const razorpayPayments = allPayments.filter(
        (p) => p.PaymentMode === "Razorpay" || p.PaymentMode === "RazorpayQR"
      );

      if (razorpayPayments.length > 0) {
        setHasRazorpayPayments(true);

          // ✅ Get highest payment OBJECT (not just amount)
        const highestPayment = razorpayPayments.reduce((prev, current) =>
          (current.AmountPaid || 0) > (prev.AmountPaid || 0)
            ? current
            : prev
        );


        console.log("Highest Razorpay payment:", highestPayment);
        setSelectedPaymentId(highestPayment.TransactionID); // Store PaymentID for refund reference


        // ✅ Get highest Razorpay payment
        const maxAmount = Math.max(
          ...razorpayPayments.map((p) => p.AmountPaid || 0)
        );

        setHighestRazorpayAmount(maxAmount);

        // 👉 business rule (you told earlier)
        if (maxAmount>0) {
          setRefundType("online");
        } else {
          setRefundType("bank"); // need bank details
        }
      } else {
        setHasRazorpayPayments(false);
        setHighestRazorpayAmount(0);
        setRefundType("cash");
      }
    }
  } catch (err) {
    console.error("Failed to fetch payment history", err);
    setPaymentHistory([]);
    setHasRazorpayPayments(false);
    setRefundType("cash");
  } finally {
    setLoadingPayments(false);
  }
};

  const handlePayNow = async (row) => {
    // const refundAmt = parseFloat(row.RefundAmount) || 0;

    // // If refund amount is 800 or below, do direct Razorpay refund
    // if (refundAmt <= 800) {
    //   const result = await Swal.fire({
    //     title: "Confirm Refund",
    //     text: `Refund amount is ₹${refundAmt.toFixed(2)}. This will be processed directly via Razorpay. Proceed?`,
    //     icon: "question",
    //     showCancelButton: true,
    //     confirmButtonText: "Yes, Refund",
    //     cancelButtonText: "Cancel",
    //   });

    //   if (!result.isConfirmed) return;

    //   try {
    //     const res = await axios.post(
    //       `${API_BASE}Refund/Refund`,
    //       {
    //         amount: refundAmt,
    //         bookingId: row.BookingID,
    //       },
    //       {
    //         headers: { Authorization: `Bearer ${token}` },
    //       }
    //     );

    //     if (res.data.success) {
    //       Swal.fire("Success", "Refund processed successfully via Razorpay!", "success");
    //       fetchBookings();
    //     } else {
    //       Swal.fire("Error", res.data.message || "Failed to process refund.", "error");
    //     }
    //   } catch (error) {
    //     console.error("Refund error:", error);
    //     Swal.fire("Error", "Failed to process refund via Razorpay.", "error");
    //   }
    //   return;
    // }

    // // If refund amount is more than 800, open modal for manual refund
    const refundAmt = parseFloat(row.RefundAmount) || 0;
    setSelectedRefund(row);
    setPaymentMode(null);
    setPaymentAmount(refundAmt.toString());
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setSelectedFiles([]);
    setBankDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fetchBankDetails(row.CustID);
    fetchPaymentHistory(row.BookingID);
    setPaymentModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return newFiles;
    });
  };

  const getFilePreview = (file) => {
    return URL.createObjectURL(file);
  };

  const isImageFile = (file) => {
    return file.type?.startsWith("image/");
  };

  const isPdfFile = (file) => {
    return file.type === "application/pdf";
  };

  const isExcelFile = (file) => {
    return (
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  };

  const isWordFile = (file) => {
    return (
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  };

  const isPaymentFormValid = () => {
    // Check if payment mode is selected
    // if (!refundType) return false;

    // Check if expense date is selected
    if (!expenseDate) return false;

    // Check if payment amount is valid
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return false;

    // Check if amount exceeds booking total
    const bookingTotalAmount = parseFloat(selectedRefund?.TotalPrice) || 0;
    if (amount > bookingTotalAmount) return false;

    // Check amount based on refund type
    if (refundType === "online") {
      if (amount > highestRazorpayAmount) return false;
    } else {
      const refundAmt = parseFloat(selectedRefund?.TotalPrice) || 0;
      if (amount > refundAmt) return false;
    }

    if(refundType === "Bank Transfer"){
      console.log("bankDetails", bankDetails);
      const bankDetail = bankDetails[0];
      if(!bankDetail.AccountNumber || !bankDetail.AccountHolderName || !bankDetail.BankName || !bankDetail.IFSC || !bankDetail.Branch) return false;
      if(!bankDetail.AccountNumber.trim() || !bankDetail.AccountHolderName.trim() || !bankDetail.BankName.trim() || !bankDetail.IFSC.trim() || !bankDetail.Branch.trim()) return false;
      if(!bankDetail.AccountNumber.trim() || !bankDetail.AccountHolderName.trim() || !bankDetail.BankName.trim() || !bankDetail.IFSC.trim() || !bankDetail.Branch.trim()) return false;
    }

    return true;
  };

  const handlePaymentSubmit = async () => {
    // if (!paymentMode) {
    //   Swal.fire("Error", "Please select payment mode", "error");
    //   return;
    // }

    if (!expenseDate) {
      Swal.fire("Error", "Please select expense date", "error");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Swal.fire("Error", "Please enter a valid payment amount", "error");
      return;
    }

    const bookingTotalAmount = parseFloat(selectedRefund.TotalPrice) || 0;
    const refundAmt = parseFloat(selectedRefund.RefundAmount) || 0;
    
    // Check if amount exceeds booking total
    if (amount > bookingTotalAmount) {
      Swal.fire(
        "Error",
        `Payment amount cannot exceed booking total amount ${formatCurrency(bookingTotalAmount)}`,
        "error"
      );
      return;
    }
    
    // Validate amount based on refund type
    if (refundType === "online") {
      if (amount > highestRazorpayAmount) {
        Swal.fire(
          "Error",
          `For online refund, amount cannot exceed highest Razorpay payment ${formatCurrency(highestRazorpayAmount)}`,
          "error"
        );
        return;
      }
    } else {
      if (amount > refundAmt) {
        Swal.fire(
          "Error",
          `Payment amount cannot exceed refund amount ${formatCurrency(refundAmt)}`,
          "error"
        );
        return;
      }
    }

    try {
      const formData = new FormData();

      formData.append("expenseDate", new Date(expenseDate).toISOString());
      formData.append("expenseCategoryID", 1);
      formData.append("amount", amount);
      formData.append("paymentMode", refundType);
      formData.append("dealerID", 0);
      formData.append("technicianID", 0);
      formData.append("bookingID", Number(selectedRefund.BookingID));
      formData.append("referenceNo", selectedRefund.BookingTrackID || "");
      formData.append("notes", "Customer Refund");
      formData.append("status", "Paid");
      formData.append("createdBy", Number(userId) || 0);
      formData.append("isActive", true);
      formData.append("addOnId", 0);

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("billPath", file);
        });
      }

      const response = await axios.post(
        `${API_BASE}Expenditure/Expenditure`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        // If refund type is online, call Razorpay refund API
        if (refundType === "online") {
          try {
            const razorpayResponse = await axios.post(
              `${API_BASE}Refund/Refund`,
              {
                amount: amount,
                bookingId: selectedRefund.BookingID,
                paymentId: selectedPaymentId, // Assuming you have PaymentID from payment history
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (razorpayResponse.data.success) {
              Swal.fire({
                icon: "success",
                title: "Refund Successful",
                text: `Online refund of ${formatCurrency(amount)} has been processed via Razorpay.`,
              });
            } else {
              Swal.fire({
                icon: "warning",
                title: "Partial Success",
                text: `Expenditure recorded but Razorpay refund failed: ${razorpayResponse.data.message || "Unknown error"}`,
              });
            }
          } catch (razorpayError) {
            console.error("Razorpay refund error:", razorpayError);
            Swal.fire({
              icon: "warning",
              title: "Partial Success",
              text: `Expenditure recorded but Razorpay refund failed. Please retry or process manually.`,
            });
          }
        } else {
          // For cash/bank transfer refunds
          Swal.fire({
            icon: "success",
            title: "Refund Recorded",
            text: `Refund of ${formatCurrency(amount)} has been recorded.`,
          });
        }

        await fetchBookings();

        setPaymentModalOpen(false);
        setSelectedRefund(null);
        setPaymentMode(null);
        setPaymentAmount("");
        setExpenseDate("");
        setSelectedFiles([]);
        setBankDetails(null);
        setRefundType("cash");
        setPaymentHistory([]);
        setHighestRazorpayAmount(0);
        setHasRazorpayPayments(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Refund submission error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          "Failed to submit refund. Please try again.",
        "error"
      );
    }
  };

  const getPaymentModeOptions = () => {
    if (refundType === "online") {
      return [
        { value: "Razorpay", label: "Razorpay (Online)" },
      ];
    } else {
      return [
        { value: "Cash", label: "Cash" },
        { value: "Bank Transfer", label: "Bank Transfer" },
      ];
    }
  };

  const columns = [
    {
      name: "Booking ID",
      selector: (row) => (
        <Link to={`/booking-view/${row.BookingID}`} className="text-primary">
          {row.BookingTrackID}
        </Link>
      ),
      sortable: true,
      width: "150px"
    },
    {
      name: "Booking Date",
      selector: (row) => {
        const rawDate = row.CreatedDate;
        if (!rawDate) return "-";
        const dateObj = new Date(rawDate);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const time = dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return (
          <>
          <div className="d-flex justify-content-center"> 
            <span className="fw-bold">{formattedDate}</span>
            </div>
             <span className="d-flex justify-content-center">{time}</span>
          </>
        );
      },
      sortField: "CreatedDate",
      width: "140px",
      sortable: true,
    },
    {
      name: "Cust. Name",
      selector: (row) => (
        <>
          <span className="fw-bold">{row.CustFullName}</span> <br />
          {row.CustPhoneNumber || ""}
        </>
      ),
      sortable: true,
      width: "150px"
    },
    {
      name: "Bank Details",
      cell: (row) => {
        const details = cachedBankDetails[row.CustID];

        if (!details) {
          return <small className="text-muted">—</small>;
        }

        const bankArray = Array.isArray(details) ? details : [details];
        if (bankArray.length === 0) {
          return <small className="text-muted">—</small>;
        }

        const bankInfo = bankArray[0];
        return (
          <div className="small">
            <div className="fw-semibold text-dark">{bankInfo.AccountHolderName || "—"}</div>
            <div className="text-muted">{bankInfo.BankName || "—"}</div>
            <div className="text-muted" style={{ fontSize: "11px" }}>
              {bankInfo.AccountNumber ? `${bankInfo.AccountNumber}` : "—"}
            </div>
          </div>
        );
      },
      width: "180px",
      sortable: false,
    },
    {
      name: "Booking Price",
      selector: (row) =>
        `₹${(row.TotalPrice - row.CouponAmount).toFixed(2)}`,
      sortable: true,
      width: "150px"
    },
    {
      name: "Refund Date",
      selector: (row) => {
        const rawDate = row.RefundedAt;
        if (!rawDate) return "-";
        const dateObj = new Date(rawDate);
        const formattedDate = dateObj.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const time = dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return (
          <>
          <div className="d-flex justify-content-center"> 
            <span className="fw-bold">{formattedDate}</span>
            </div>
             <span className="d-flex justify-content-center">{time}</span>
          </>
        );
      },
      sortField: "RefundedAt",
      width: "140px",
      sortable: true,
    },
    {
      name: "Refund Amount",
      selector: (row) => `₹${(row.RefundAmount ?? 0).toFixed(2)}`,
      sortable: true,
      width: "150px"
    },
    {
      name: "Pay. Status",
      cell: (row) => {
        const paymentStatus = row.PaymentStatus || "Pending";

        let status =
          paymentStatus.toLowerCase() === "success"
            ? "Paid"
            : paymentStatus;

        const colorMap = {
          Paid: "#28A745",
          Pending: "#F57C00",
          Failed: "#E34242",
          Cancelled: "#E34242",
        };

        const color = colorMap[status] || "#6c757d";

        return (
          <span className="fw-semibold d-flex align-items-center">
            <span
              className="rounded-circle d-inline-block me-1"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: color,
              }}
            ></span>
            <span style={{ color }}>{status}</span>
          </span>
        );
      },
      width: "150px",
      sortable: true,
    },
    {
      name: "Refund Status",
      selector: (row) => (
        <span className="fw-bold">{row.RefundStatus ?? "N/A"}</span>
      ),
      sortable: true,
      width: "150px"
    },
    ...(hasPermission("refunds_edit")
      ? [
          {
            name: "Actions",
            cell: (row) => (
              <div className="d-flex gap-2">
                <Link
                  to={`/booking-view/${row.BookingID}`}
                  className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                  title="View"
                >
                  <Icon icon="lucide:eye" />
                </Link>
                {row.IsRefunded == 0 && (
                  <button
                    className="w-32-px h-32-px bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                    onClick={() => handlePayNow(row)}
                    title="Pay Refund"
                  >
                    <Icon icon="mdi:cash-check" />
                  </button>
                )}
             
              </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            width: "120px",
          },
        ]
      : hasPermission("bookingview_view")
      ? [
          {
            name: "Actions",
            cell: (row) => (
              <Link
                to={`/booking-view/${row.BookingID}`}
                className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                title="View"
              >
                <Icon icon="lucide:eye" />
              </Link>
            ),
          },
        ]
      : []),
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.CustFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.CustPhoneNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.BookingTrackID?.toLowerCase().includes(searchText.toLowerCase());

    const bookingDate = new Date(booking.BookingDate);
    const matchesDate =
      (!startDate || bookingDate >= new Date(startDate)) &&
      (!endDate || bookingDate <= new Date(endDate));

    const price = booking.TotalPrice + booking.GSTAmount - booking.CouponAmount;
    const matchesPrice =
      (!minPrice || price >= parseFloat(minPrice)) &&
      (!maxPrice || price <= parseFloat(maxPrice));

    return matchesSearch && matchesDate && matchesPrice;
  });

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Refunds");
    XLSX.writeFile(workbook, "Refunds_Report.xlsx");
  };

  return (
    <div className="row gy-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5></h5>
        </div>
        <div className="card overflow-hidden p-3">
          <div className="card-header bg-white border-bottom-0">
            <div
              className="d-flex align-items-center flex-wrap gap-2"
              style={{
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {/* Search Input */}
              <form
                className="navbar-search flex-grow-1 flex-shrink-1 position-relative"
                style={{ minWidth: "180px" }}
              >
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    minWidth: "200px",
                    width: "100%",
                  }}
                />
                <Icon
                  icon="ion:search-outline"
                  className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                  width="20"
                  height="20"
                />
              </form>

              {/* Date Filters */}
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />
              <input
                type="date"
                placeholder="DD-MM-YYYY"
                className="form-control flex-shrink-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ minWidth: "130px", flex: "1 1 130px" }}
              />

              {/* Price Range */}
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ minWidth: "100px", flex: "1 1 100px" }}
              />
              <input
                type="number"
                className="form-control flex-shrink-0"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ minWidth: "100px", flex: "1 1 100px" }}
              />

              {/* Excel Export Button */}
              <button
                className="w-32-px h-32-px bg-info-focus text-info-main rounded-circle d-inline-flex align-items-center justify-content-center"
                onClick={exportToExcel}
              >
                <Icon icon="mdi:microsoft-excel" width="20" height="20" />
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredBookings}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100, filteredBookings.length]}
            highlightOnHover
            responsive
            striped
            persistTableHead
            noDataComponent="No Refunds available"
            defaultSortField="CreatedDate"
            defaultSortAsc={false}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedRefund && (
        <div
          className="modal fade show d-block"
          style={{ background: "#00000080" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "700px", width: "90%" }}
          >
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-center">
                <h6 className="modal-title">Process Refund</h6>
              </div>

              <div className="modal-body">


                {/* Bank Details */}
                <div className="mb-3 p-3 border rounded">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Icon icon="mdi:bank" />
                    Customer Bank Details
                  </h6>
                  {loadingBankDetails ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 mb-0 text-muted">Loading bank details...</p>
                    </div>
                  ) : bankDetails && (Array.isArray(bankDetails) ? bankDetails.length > 0 : true) ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Account Holder</th>
                            <th>Bank Name</th>
                            <th>Account Number</th>
                            <th>IFSC Code</th>
                            <th>Branch</th>
                            {/* <th>UPI ID</th> */}
                            {/* <th>Status</th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(bankDetails) ? bankDetails : [bankDetails]).map((detail, index) => (
                            <tr key={index}>
                              <td className="fw-semibold">{detail.AccountHolderName || "—"}</td>
                              <td>{detail.BankName || "—"}</td>
                              <td>{detail.AccountNumber || "—"}</td>
                              <td>{detail.IFSCCode || "—"}</td>
                              <td>{detail.Branch || "—"}</td>
                              {/* <td>{detail.UPIId || "—"}</td> */}
                              {/* <td>
                                <span className={`badge ${detail.IsActive ? 'bg-success' : 'bg-danger'}`}>
                                  {detail.IsActive ? 'Active' : 'Inactive'}
                                </span>
                              </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {(Array.isArray(bankDetails) ? bankDetails : [bankDetails]).map((detail, index) => (
                        <div key={index}>
                          <p className="text-muted mb-0">For bank transfer, please add bank details in the customer profile.</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted mb-0">No bank details found for this customer.</p>
                    </div>
                  )}
                </div>

                {/* Refund Type Selection */}
                {hasRazorpayPayments && (
                  <div className="mb-3 p-3 border rounded bg-light">
                    <label className="form-label fw-semibold mb-2">
                      Payment Type <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="refundTypeOnline"
                          value="online"
                          checked={refundType === "online"}
                          onChange={(e) => {
                            setRefundType(e.target.value);
                            setPaymentMode(null);
                            setPaymentAmount(Math.min(parseFloat(selectedRefund.RefundAmount) || 0, highestRazorpayAmount).toString());
                          }}
                        />
                        <label className="form-check-label" htmlFor="refundTypeOnline">
                          Through Razorpay
                          <br />
                          <small className="text-muted">
                            Max: {formatCurrency(highestRazorpayAmount)}
                          </small>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="refundTypeCash"
                          value="Bank Transfer"
                          checked={refundType === "Bank Transfer"}
                          onChange={(e) => {
                            setRefundType(e.target.value);
                            setPaymentMode(null);
                            setPaymentAmount((parseFloat(selectedRefund.RefundAmount) || 0).toString());
                          }}
                        />
                        <label className="form-check-label" htmlFor="refundTypeCash">
                        Through Bank Transfer
                          <br />
                          <small className="text-muted">
                            Max: {formatCurrency(parseFloat(selectedRefund.TotalPrice) || 0)}
                          </small>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Refund Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    {/* <label className="form-label fw-semibold">
                    Refund Mode <span className="text-danger">*</span>
                    </label>
                    <Select
                      options={getPaymentModeOptions()}
                      value={paymentMode}
                      onChange={(option) => setPaymentMode(option)}
                      placeholder="Select Payment Mode"
                      className="react-select-container"
                      classNamePrefix="react-select"
                    /> */}
                      <label className="form-label fw-semibold">
                  Refund Amount <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    max={Math.min(
                      selectedRefund.TotalPrice || 0,
                      refundType === "online" ? highestRazorpayAmount : selectedRefund.TotalPrice
                    )}
                  />
                  <small className="text-muted d-block">
                    {refundType === "online" 
                      ? `Max online refund: ${formatCurrency(highestRazorpayAmount)}`
                      : `Max cash/bank refund: ${formatCurrency(selectedRefund.TotalPrice)}`
                    }
                  </small> 
                  {parseFloat(paymentAmount) > (selectedRefund.TotalPrice || 0) && (
                    <small className="text-danger d-block mt-1">
                      ⚠ Payment amount cannot exceed booking total: {refundType === "online" ? formatCurrency(highestRazorpayAmount) : formatCurrency(selectedRefund.TotalPrice)}
                    </small>
                  )}
                  </div>
                  
                </div>

                {/* Payment Amount */}
                <div className="mb-3">
                
                  {/* <small className="text-muted d-block mt-1">
                    <strong>Booking Total Amount:</strong> {formatCurrency(selectedRefund.TotalPrice || 0)}
                  </small> */}
                 
                </div>

                {/* Document Upload */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Upload Documents (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">
                    Accepted formats: Images, PDF, Word, Excel
                  </small>
                </div>

                {/* Document Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Selected Documents Preview
                    </label>
                    <div
                      className="border rounded p-2"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      <div className="row g-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="col-md-6">
                            <div className="border rounded p-2 position-relative">
                              <button
                                type="button"
                                className="position-absolute"
                                onClick={() => handleRemoveFile(index)}
                                style={{
                                  top: "8px",
                                  right: "8px",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: "rgba(220, 53, 69, 0.9)",
                                  border: "none",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  zIndex: 10,
                                }}
                                title="Remove"
                              >
                                <Icon
                                  icon="mdi:close"
                                  style={{ fontSize: "16px" }}
                                />
                              </button>
                              {isImageFile(file) ? (
                                <img
                                  src={getFilePreview(file)}
                                  alt={file.name}
                                  style={{
                                    width: "100%",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              ) : isPdfFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-pdf-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#dc3545",
                                    }}
                                  />
                                </div>
                              ) : isExcelFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-excel-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#28a745",
                                    }}
                                  />
                                </div>
                              ) : isWordFile(file) ? (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-word-box"
                                    style={{
                                      fontSize: "48px",
                                      color: "#0078d4",
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ height: "80px" }}
                                >
                                  <Icon
                                    icon="mdi:file-document"
                                    style={{
                                      fontSize: "32px",
                                      color: "#6c757d",
                                    }}
                                  />
                                </div>
                              )}
                              <div className="mt-1">
                                <small
                                  className="text-truncate d-block"
                                  style={{ maxWidth: "100%" }}
                                  title={file.name}
                                >
                                  {file.name.length > 20
                                    ? `${file.name.substring(0, 20)}...`
                                    : file.name}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer d-flex justify-content-center">
                <button
                  className="btn btn-secondary me-2"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedRefund(null);
                    setPaymentMode(null);
                    setPaymentAmount("");
                    setExpenseDate("");
                    setSelectedFiles([]);
                    setBankDetails(null);
                    setRefundType("cash");
                    setPaymentHistory([]);
                    setHighestRazorpayAmount(0);
                    setHasRazorpayPayments(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary-600"
                  onClick={handlePaymentSubmit}
                  disabled={!isPaymentFormValid()}
                  title={!isPaymentFormValid() ? "Please fill all required fields correctly" : "Process refund"}
                >
                 Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundLayer;