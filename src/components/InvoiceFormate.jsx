import React from "react";

const InvoiceFormate = ({
  invoiceNo = "INV-20251206-004",
  invoiceDate = "07/12/2025",
  customerName = "Mr. Jagadeesh Prathipati",
  phone = "91 9515916339",
  regNo = "TS04UD7969",
  carDetails = "Indica Vista VX (DIESEL)",
  address = "3-8-239 Zaheerpura Street, Khammam, Telangana",
  bookingId = "MYCAR122025004",
  bookingDate = "29/11/2025",
  timeSlot = "07:00 PM - 08:00 PM",
  items = [],
  subtotal = 25350,
  cgst = 2281.5,
  sgst = 2281.5,
  grandTotal = 29913,
}) => {
  return (
    <div className="container my-4">
      <div className="border p-4">

        {/* ---------- HEADER ---------- */}
        <div className="row mb-3">
          <div className="col-md-8">
            <h5 className="fw-bold mb-1">TAX INVOICE</h5>
            <div className="fw-semibold text-uppercase">
              Glansa Solutions Private Limited
            </div>
            <div className="small text-muted">
              Unit #B1, Second Floor Spaces & More Business Park,<br />
              Madhapur, Hyderabad, Telangana - 500081
            </div>
            <div className="small mt-1">
              <strong>GST No:</strong> 36AALCG7387E1Z6
            </div>
          </div>

          <div className="col-md-4 text-end">
            <div><strong>Invoice No:</strong> {invoiceNo}</div>
            <div><strong>Date:</strong> {invoiceDate}</div>
          </div>
        </div>

        <hr />

        {/* ---------- CUSTOMER + BOOKING ---------- */}
        <div className="row mb-3 small">
          <div className="col-md-6">
            <div><strong>Customer Name:</strong> {customerName}</div>
            <div><strong>Phone:</strong> {phone}</div>
            <div><strong>Registration No:</strong> {regNo}</div>
            <div><strong>Car:</strong> {carDetails}</div>
            <div><strong>Address:</strong> {address}</div>
          </div>

          <div className="col-md-6">
            <div><strong>Booking Track ID:</strong> {bookingId}</div>
            <div><strong>Booking Date:</strong> {bookingDate}</div>
            <div><strong>Time Slot:</strong> {timeSlot}</div>
            <div><strong>Booking Method:</strong> DM</div>
          </div>
        </div>

        {/* ---------- TABLE ---------- */}
        <div className="table-responsive">
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-secondary text-center">
              <tr>
                <th>S.No</th>
                <th className="text-start">Service / Item</th>
                <th>Qty</th>
                <th>Taxable Amount</th>
                <th>GST %</th>
                <th>GST Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No Items
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td>{item.name}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-end">₹{item.amount}</td>
                    <td className="text-center">{item.gstPercent}%</td>
                    <td className="text-end">₹{item.gstAmount}</td>
                    <td className="text-end fw-semibold">
                      ₹{item.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- TOTALS ---------- */}
        <div className="row justify-content-end">
          <div className="col-md-5">
            <table className="table table-bordered table-sm">
              <tbody>
                <tr>
                  <td>Service Charges</td>
                  <td className="text-end">₹{subtotal}</td>
                </tr>
                <tr>
                  <td>CGST (9%)</td>
                  <td className="text-end">₹{cgst}</td>
                </tr>
                <tr>
                  <td>SGST (9%)</td>
                  <td className="text-end">₹{sgst}</td>
                </tr>
                <tr className="table-secondary fw-bold">
                  <td>Grand Total</td>
                  <td className="text-end">₹{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <div className="small mt-3">
          <strong>Amount in Words:</strong>{" "}
          Twenty-Nine Thousand Nine Hundred Thirteen Rupees Only
        </div>

        <ul className="small mt-2 ps-3">
          <li>
            Any dispute with respect to the invoice must be reported within 48
            hours.
          </li>
          <li>
            This is a system generated invoice and does not require signature.
          </li>
        </ul>

      </div>
    </div>
  );
};

export default InvoiceFormate;
