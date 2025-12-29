import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const InvoiceViewLayer = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}Bookings/BookingId?Id=${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBookingData(res.data[0]);
    } catch (error) {
      console.error("Error fetching booking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return "—";
    return timeSlot;
  };

  // Convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };
    
    let words = '';
    let numInt = Math.floor(num);
    
    if (numInt >= 10000000) {
      words += convertHundreds(Math.floor(numInt / 10000000)) + 'Crore ';
      numInt %= 10000000;
    }
    if (numInt >= 100000) {
      words += convertHundreds(Math.floor(numInt / 100000)) + 'Lakh ';
      numInt %= 100000;
    }
    if (numInt >= 1000) {
      words += convertHundreds(Math.floor(numInt / 1000)) + 'Thousand ';
      numInt %= 1000;
    }
    if (numInt > 0) {
      words += convertHundreds(numInt);
    }
    
    return words.trim() + ' Rupees Only';
  };

  // Combine all items (Packages + BookingAddOns)
  const getAllItems = () => {
    const items = [];
    let serialNumber = 1;

    // Add Packages if they exist
    if (bookingData?.Packages && Array.isArray(bookingData.Packages)) {
      bookingData.Packages.forEach((pkg) => {
        items.push({
          ...pkg,
          ServiceName: pkg.PackageName,
          ServicePrice: pkg.PackagePrice || pkg.Default_Price || 0,
          GSTPercent: 18, // Default GST for packages
          GSTPrice: ((pkg.PackagePrice || pkg.Default_Price || 0) * 18) / 100,
          TotalPrice: (pkg.PackagePrice || pkg.Default_Price || 0) * 1.18,
          ServiceType: "Package",
          Includes: pkg.Category?.SubCategories?.[0]?.Includes || [],
          serialNumber: serialNumber++,
        });
      });
    }

    // Add BookingAddOns
    if (bookingData?.BookingAddOns && Array.isArray(bookingData.BookingAddOns)) {
      bookingData.BookingAddOns.forEach((addon) => {
        items.push({
          ...addon,
          serialNumber: serialNumber++,
        });
      });
    }

    return items;
  };

  // Calculate totals
  const calculateTotals = () => {
    const items = getAllItems();
    if (items.length === 0) return { taxable: 0, gst: 0, labourCharges: 0, cgst: 0, sgst: 0, total: 0 };

    let taxableTotal = 0;
    let gstTotal = 0;
    let labourChargesTotal = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const taxable = Number(item.ServicePrice || 0);
      const gst = Number(item.GSTPrice || 0);
      const labourCharges = Number(item.LabourCharges || 0);
      const total = Number(item.TotalPrice || taxable + gst + labourCharges);

      taxableTotal += taxable;
      gstTotal += gst;
      labourChargesTotal += labourCharges;
      grandTotal += total;
    });

    // Add booking-level labour charges if available
    if (bookingData?.LabourCharges) {
      labourChargesTotal += Number(bookingData.LabourCharges || 0);
      grandTotal += Number(bookingData.LabourCharges || 0);
    }

    // Calculate CGST and SGST (9% each of taxable amount)
    // For items with 18% GST, split equally (9% each)
    // For other GST rates, calculate proportionally
    const cgst = gstTotal / 2; // Split total GST equally for CGST and SGST
    const sgst = gstTotal / 2;

    return {
      taxable: taxableTotal,
      gst: gstTotal,
      cgst: cgst,
      sgst: sgst,
      labourCharges: labourChargesTotal,
      total: grandTotal,
    };
  };

  const totals = calculateTotals();

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="alert alert-danger">
        Booking data not found.
      </div>
    );
  }

  const invoiceNumber = bookingData.Payments?.[0]?.InvoiceNumber || `INV-${bookingData.BookingID}`;
  const invoiceDate = bookingData.Payments?.[0]?.CreatedDate 
    ? formatDate(bookingData.Payments[0].CreatedDate)
    : formatDate(new Date());

  return (
    <div className="container-fluid p-4">
      {/* Print Button */}
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          <Icon icon="mdi:arrow-left" className="me-2" />
          Back
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Icon icon="mdi:printer" className="me-2" />
          Print Invoice
        </button>
      </div>

      {/* Invoice Container */}
      <div className="invoice-container bg-white p-0 shadow-sm" style={{ maxWidth: "210mm", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
        {/* Teal Header */}
        <div style={{ backgroundColor: "#0d9488", padding: "20px", color: "white" }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3" style={{ flex: "1" }}>
              <img 
                src="/assets/images/MyCarBuddy-Logo1.webp" 
                alt="My Car Buddy Logo" 
                style={{ height: "60px", width: "auto", maxWidth: "auto" }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />

            </div>
            <div className="text-end" style={{ flex: "0 0 auto" }}>
              <h4 className="fw-bold mb-1" style={{ fontSize: "20px", color: "white", textTransform: "uppercase" }}>
                TAX INVOICE
              </h4>
              <div style={{ fontSize: "13px", color: "white", opacity: "0.95" }}>
                <div><strong>Invoice No:</strong> {invoiceNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Details Section */}
        <div style={{ padding: "20px", backgroundColor: "white" }}>
          <p className="mb-1" style={{ fontSize: "12px", lineHeight: "1.6", color: "#333", fontWeight: "500" }}>
            Glansa Solutions Private Limited.
          </p>
          <p className="mb-1" style={{ fontSize: "11px", lineHeight: "1.6", color: "#333" }}>
            Unit #B1, Second Floor Spaces & More Business Park, Madhapur #3
            <br />
            D.No# 1-89/A/8, C/2, Vittal Rao Nagar Rd, Madhapur, Hyderabad India, 500081
            <br />
            <strong>GST No.:</strong> 36AALCG7387E1Z6
          </p>
        </div>

        {/* Customer & Booking Details Table */}
        <div style={{ padding: "0 20px 20px 20px", backgroundColor: "white" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", width: "30%", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Customer Name
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", width: "70%" }}>
                  {bookingData.CustomerName ? `Mr. ${bookingData.CustomerName}` : "—"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Phone
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                  {bookingData.PhoneNumber ? `91 ${bookingData.PhoneNumber}` : "—"}
                </td>
              </tr>
              {bookingData.VehicleNumber && (
                <tr>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                    Registration No
                  </td>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                    {bookingData.VehicleNumber}
                  </td>
                </tr>
              )}
              {(bookingData.BrandName || bookingData.FuelTypeName) && (
                <tr>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                    Car Brand & Fuel
                  </td>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                    {[bookingData.BrandName, bookingData.ModelName, bookingData.FuelTypeName]
                      .filter(Boolean)
                      .join(" ")}
                    {bookingData.FuelTypeName && ` (${bookingData.FuelTypeName})`}
                  </td>
                </tr>
              )}
              {bookingData.FullAddress && (
                <tr>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                    Address
                  </td>
                  <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                    {bookingData.FullAddress}
                    {bookingData.CityName && ` ${bookingData.CityName}`}
                    {bookingData.StateName && `, ${bookingData.StateName}`}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Estimation Invoice Generate Date
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                  {invoiceDate}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Booking Track ID
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                  {bookingData.BookingTrackID || "—"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Booking Date
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                  {formatDate(bookingData.BookingDate)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6", fontWeight: "600", backgroundColor: "#f8f9fa" }}>
                  Time Slot
                </td>
                <td style={{ padding: "6px 10px", border: "1px solid #dee2e6" }}>
                  {formatTimeSlot(bookingData.TimeSlot)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Services Table */}
        <div style={{ padding: "0 20px 20px 20px", backgroundColor: "white" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", border: "1px solid #dee2e6" }}>
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th style={{ width: "5%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold", backgroundColor: "#e9ecef" }}>S.no</th>
                <th style={{ width: "40%", padding: "10px 8px", border: "1px solid #dee2e6", fontWeight: "bold", backgroundColor: "#e9ecef" }}>Package Details</th>
                <th style={{ width: "8%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold", backgroundColor: "#e9ecef" }}>Qty</th>
                <th style={{ width: "12%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#e9ecef" }}>Taxable Amount</th>
                <th style={{ width: "8%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "bold", backgroundColor: "#e9ecef" }}>GST %</th>
                <th style={{ width: "12%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#e9ecef" }}>GST Amount</th>
                <th style={{ width: "15%", padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", backgroundColor: "#e9ecef" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {getAllItems().length > 0 ? (
                getAllItems().map((item) => {
                  const hasIncludes = item.Includes && Array.isArray(item.Includes) && item.Includes.length > 0;
                  const taxableAmount = Number(item.ServicePrice || 0);
                  const gstPercent = Number(item.GSTPercent || 0);
                  const gstAmount = Number(item.GSTPrice || 0);
                  const labourCharges = Number(item.LabourCharges || 0);
                  const total = Number(item.TotalPrice || taxableAmount + gstAmount + labourCharges);
                  const quantity = Number(item.Quantity || 1);

                  return (
                    <React.Fragment key={item.AddOnID || item.PackageID || item.serialNumber}>
                      <tr style={{ backgroundColor: "white" }}>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", verticalAlign: "middle" }}>{item.serialNumber}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", verticalAlign: "top" }}>
                          <div>
                            <strong style={{ fontSize: "12px", color: "#333" }}>{item.ServiceName || "—"}</strong>
                            {hasIncludes && (
                              <ul className="mb-0 mt-2 ps-3" style={{ fontSize: "10px", color: "#666", lineHeight: "1.6", listStyleType: "disc" }}>
                                {item.Includes.map((inc, incIdx) => (
                                  <li key={inc.IncludeID || inc.id || incIdx} style={{ marginBottom: "3px" }}>
                                    {inc.IncludeName || inc.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", verticalAlign: "middle" }}>{quantity}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", verticalAlign: "middle" }}>₹{taxableAmount.toFixed(2)}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "center", verticalAlign: "middle" }}>{gstPercent}%</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", verticalAlign: "middle" }}>₹{gstAmount.toFixed(2)}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #dee2e6", textAlign: "right", verticalAlign: "middle", fontWeight: "600" }}>₹{total.toFixed(2)}</td>
                      </tr>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No services found
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                <td colSpan="3" style={{ padding: "12px 10px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", fontSize: "12px" }}>
                  <strong>Grand Total:</strong>
                </td>
                <td style={{ padding: "12px 10px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", fontSize: "12px" }}>₹{totals.taxable.toFixed(2)}</td>
                <td style={{ padding: "12px 10px", border: "1px solid #dee2e6" }}></td>
                <td style={{ padding: "12px 10px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", fontSize: "12px" }}>₹{totals.gst.toFixed(2)}</td>
                <td style={{ padding: "12px 10px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", fontSize: "13px", color: "#0d6efd" }}>₹{totals.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Summary Section */}
        <div style={{ padding: "0 20px 20px 20px", backgroundColor: "white" }}>
          <h6 className="mb-3" style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>
            Payment Summary
          </h6>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", fontWeight: "600", width: "70%" }}>
                  Service Charges
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", textAlign: "right", width: "30%" }}>
                  ₹{totals.taxable.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  CGST 9%
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", textAlign: "right" }}>
                  ₹{totals.cgst.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  SGST 9%
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", textAlign: "right" }}>
                  ₹{totals.sgst.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", fontWeight: "600" }}>
                  Labour Charges
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #dee2e6", textAlign: "right" }}>
                  ₹{totals.labourCharges.toFixed(2)}
                </td>
              </tr>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <td style={{ padding: "10px", border: "1px solid #dee2e6", fontWeight: "bold", fontSize: "13px" }}>
                  Grand Total
                </td>
                <td style={{ padding: "10px", border: "1px solid #dee2e6", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>
                  ₹{totals.total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in Words */}
          <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "4px" }}>
            <p className="mb-0" style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>
              <strong>AMOUNT IN WORDS:</strong> {numberToWords(totals.total)}
            </p>
          </div>

          {/* Terms & Conditions */}
          <div style={{ marginTop: "20px" }}>
            <h6 className="mb-2" style={{ fontSize: "13px", fontWeight: "bold", color: "#333" }}>
              TERMS & CONDITIONS
            </h6>
            <ul style={{ marginBottom: "0", paddingLeft: "20px", fontSize: "11px", color: "#555", lineHeight: "1.8" }}>
              <li>Any dispute with respect to the invoice is to be reported back within 48 hours of receipt of invoice.</li>
              <li>This is a system generated invoice and does not require signatures.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px", backgroundColor: "white", borderTop: "1px solid #dee2e6", textAlign: "center" }}>
          <p className="mb-1" style={{ fontSize: "11px", color: "#666" }}>Thank you for choosing MY CAR BUDDY SERVICE EXPERT</p>
          <p className="mb-0" style={{ fontSize: "10px", color: "#999" }}>This is a computer-generated invoice.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          body {
            background: white !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceViewLayer;

