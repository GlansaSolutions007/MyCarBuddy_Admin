import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_APIURL;

const TicketInnerLayer = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const normalizedTicketId = String(ticketId ?? "").trim();
  const token = localStorage.getItem("token");

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [assignedToEmp, setAssignedToEmp] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const history = ticket?.TrackingHistory;
  const currentStatus = history?.[0]?.StatusName?.toLowerCase() || "";
  const isDisabled = ["cancelled", "closed"].includes(currentStatus);
  const role = localStorage.getItem("role");
  const isEmployee = role === "Employee";
   const userDetails = JSON.parse(localStorage.getItem("employeeData"));

  // 🔹 Fetch ticket details
  const fetchTicket = async () => {
    setLoading(true);
    setError("");
    try {
      if (!normalizedTicketId) {
        setError("Invalid ticket id");
        setTicket(null);
        setLoading(false);
        return;
      }

      const url = `${API_BASE}Tickets/ticketid?TicketId=${encodeURIComponent(
        normalizedTicketId
      )}`;
      const headers = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      let res;
      try {
        res = await axios.get(url, headers);
      } catch {
        res = await axios.get(url);
      }

      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!data) {
        setError("Ticket not found.");
      } else {
        setTicket(data);
        if (typeof data.Status === "number")
          setSelectedStatus(String(data.Status));

        // Get assigned employee ID
        if (
          Array.isArray(data.assigned_to_emp) &&
          data.assigned_to_emp.length > 0
        ) {
          setAssignedToEmp(data.assigned_to_emp[0].assigned_to_emp);
        } else if (data.assigned_to_emp) {
          setAssignedToEmp(data.assigned_to_emp);
        }
      }
    } catch (err) {
      console.error("Failed to load ticket", err);
      setError("Failed to load ticket. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // 🔹 Handle Submit Status (with Description & Files)
  const handleSubmitStatus = async () => {
    if (!ticket) return;

    if (selectedStatus === "") {
      Swal.fire({
        icon: "warning",
        title: "Select status",
        text: "Please choose a status.",
      });
      return;
    }

    try {
      // ✅ Use FormData for both text and files
      const formData = new FormData();
      formData.append(
        "TicketTrackId",
        ticket.TicketTrackId || ticket.TicketId || ticket.TicketID
      );
      formData.append("Status", selectedStatus);
      formData.append("Description", statusDescription);
      formData.append("Assigned_to", assignedToEmp || "");

      // ✅ Add all selected files
      selectedFiles.forEach((file) => {
        formData.append("Files", file);
      });

      const headers = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      await axios.put(`${API_BASE}Tickets`, formData, headers);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Ticket status updated successfully.",
      });

      fetchTicket();
      setStatusDescription("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Status update failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
      });
    }
  };

  // const handleAccept = async () => {
  //   try {
  //     await axios.put(
  //       `${API_BASE}Tickets/${normalizedTicketId}/accept`,
  //       {},
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     Swal.fire("Success", "Ticket accepted successfully", "success");
  //     fetchTicket(); // Refresh ticket data
  //   } catch (error) {
  //     console.error("Failed to accept ticket:", error);
  //     Swal.fire("Error", "Failed to accept ticket", "error");
  //   }
  // };

  // const handleReject = async () => {
  //   const { value: reason } = await Swal.fire({
  //     title: "Reject Ticket",
  //     input: "textarea",
  //     inputLabel: "Reason for rejection",
  //     inputPlaceholder: "Enter the reason for rejecting this ticket...",
  //     inputValidator: (value) => {
  //       if (!value) {
  //         return "You need to provide a reason!";
  //       }
  //     },
  //     showCancelButton: true,
  //     confirmButtonText: "Reject",
  //     confirmButtonColor: "#dc3545",
  //   });

  //   if (reason) {
  //     try {
  //       await axios.put(
  //         `${API_BASE}Tickets/${normalizedTicketId}/reject`,
  //         { reason },
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );
  //       Swal.fire("Success", "Ticket rejected successfully", "success");
  //       fetchTicket(); // Refresh ticket data
  //     } catch (error) {
  //       console.error("Failed to reject ticket:", error);
  //       Swal.fire("Error", "Failed to reject ticket", "error");
  //     }
  //   }
  // };

  const handleForward = async () => {
    const { value: reason } = await Swal.fire({
      title: "Forward Ticket",
      input: "textarea",
      inputLabel: "Reason for forwarding",
      inputPlaceholder: "Enter the reason for forwarding this ticket...",
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
      showCancelButton: true,
      confirmButtonText: "Confirm Forward",
      confirmButtonColor: "#007bff",
    });

    if (reason) {
      try {
        const formData = new FormData();
        formData.append(
          "TicketTrackId",
          ticket.TicketTrackId || ticket.TicketId || ticket.TicketID
        );
        formData.append("Status", 7); // Forward status
        formData.append("Description", reason);

        const headers = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        await axios.put(`${API_BASE}Tickets`, formData, headers);

        Swal.fire("Success", "Ticket forwarded successfully", "success");
        navigate("/tickets");
      } catch (error) {
        console.error("Failed to forward ticket:", error);
        Swal.fire("Error", "Failed to forward ticket", "error");
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Unable to download the file. Please try again.",
      });
    }
  };

  return (
    <div className="row gy-4 mt-3">
      {/* ------------------ Left: Customer Info ------------------ */}
      <div className="col-lg-4">
        <div className="user-grid-card pt-3 border radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            <h6 className="text-xl mb-16 border-bottom pb-2">Customer Info</h6>

            <div className="text-center border-bottom pb-16">
              <img
                src={
                  ticket?.BookingDetails?.ProfileImage
                    ? `${import.meta.env.VITE_APIURL_IMAGE}${
                        ticket.BookingDetails.ProfileImage
                      }`
                    : "/assets/images/user-grid/user-grid-img14.png"
                }
                alt="customer"
                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
              />
              <h6 className="mb-0 mt-16">{ticket?.CustomerName || "N/A"}</h6>
              <span className="text-secondary-light">
                {ticket?.CustomerPhone || "-"}
              </span>
            </div>

            <div className="mt-24">
              <ul>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Email
                  </span>
                  <span className="w-70 text-secondary-light fw-medium text-break">
                    : {ticket?.CustomerEmail || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Ticket ID
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {ticket?.TicketTrackId || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Created
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    :{" "}
                    {ticket?.TicketCreatedDate
                      ? new Date(ticket.TicketCreatedDate).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          }
                        )
                      : "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Description
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {ticket?.TicketDescription || "-"}
                  </span>
                </li>
              </ul>

              <div className="d-flex gap-2 mt-3">
                <Link
                  to="/tickets"
                  className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                >
                  <Icon icon="mdi:arrow-left" className="fs-5" />
                  Back
                </Link>
                {isEmployee && (
                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                    onClick={handleForward}
                  >
                    <Icon icon="mdi:arrow-right" className="fs-5" />
                    Forward
                  </button>
                )}
                {/* <button className="btn btn-success btn-sm" onClick={handleAccept}>
                  <Icon icon="mdi:check" className="me-1" /> Accept
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleReject}>
                  <Icon icon="mdi:close" className="me-1" /> Reject
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ Middle: Booking Details ------------------ */}
      <div className="col-lg-5">
        <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            {loading ? (
              <p>Loading ticket...</p>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : ticket ? (
              <>
                {/* Update Status */}
                <h6 className="text-xl mb-16 border-bottom pb-2">
                  Update Status
                </h6>
                <div
                  className={`p-3 border radius-16 ${
                    isDisabled ? "bg-light-subtle" : "bg-light"
                  }`}
                >
                  <div className="row g-3 align-items-start">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-primary-light">
                        Status
                      </label>
                      <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={isDisabled}
                      >
                        <option value="">Select status</option>
                        {[
                          { value: 1, label: "UnderReview" },
                          { value: 2, label: "Awaiting" },
                          { value: 3, label: "Resolved" },
                          ...((role === "Admin" || userDetails?.Is_Head === 1)
                          ? [
                              { value: 4, label: "Closed" },
                              { value: 5, label: "Cancelled" },
                              { value: 6, label: "Reopened" },
                            ]
                          : []),
                        ].map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description Second */}
                    <div className="col-md-8">
                      <label className="form-label fw-semibold text-primary-light">
                        Description
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="Add a description"
                        value={statusDescription}
                        maxLength={200}
                        onChange={(e) => setStatusDescription(e.target.value)}
                        disabled={isDisabled}
                      />
                      <small
                        className="text-secondary-light text-sm"
                        style={{ display: "block", textAlign: "right" }}
                      >
                        {statusDescription.length}/200 characters
                      </small>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-3 gap-10">
                    <button
                      className="btn btn-secondary px-20 btn-sm"
                      onClick={() =>
                        document.getElementById("file-input").click()
                      }
                    >
                      Upload Docs/Images
                    </button>
                    <input
                      type="file"
                      id="file-input"
                      multiple
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <button
                      className="btn btn-primary-600 px-20 btn-sm"
                      onClick={handleSubmitStatus}
                      disabled={isDisabled}
                    >
                      Submit
                    </button>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3">
                      <h6>Selected Files:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="border rounded"
                            style={{
                              width: "100px",
                              height: "100px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: file.type.startsWith("image/")
                                ? "8px"
                                : "0",
                            }}
                          >
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : file.type === "application/pdf" ? (
                              <div className="text-center">
                                <Icon
                                  icon="mdi:file-pdf"
                                  width={80}
                                  height={80}
                                  color="#dc3545"
                                />
                              </div>
                            ) : file.type ===
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                              file.type === "application/msword" ? (
                              <div className="text-center">
                                <Icon
                                  icon="mdi:file-word"
                                  width={80}
                                  height={80}
                                  color="#007bff"
                                />
                              </div>
                            ) : (
                              <div className="text-center">
                                <Icon
                                  icon="mdi:file-document"
                                  width={80}
                                  height={80}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Accordion Sections --- */}
                <Accordion defaultActiveKey="0" className="mt-3">
                  {/* Booking Details */}
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Booking Details</Accordion.Header>
                    <Accordion.Body>
                      <div className="row mb-3 text-md">
                        <div className="col-sm-6 mb-10">
                          <strong>Booking ID:</strong>{" "}
                          {ticket.BookingDetails?.BookingTrackID || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Date:</strong>{" "}
                          {ticket.BookingDetails?.BookingDate || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Time Slot:</strong>{" "}
                          {ticket.BookingDetails?.TimeSlot || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Status:</strong>{" "}
                          {ticket.BookingDetails?.BookingStatus || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Technician:</strong>{" "}
                          {ticket.BookingDetails?.TechFullName || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Tech Phone:</strong>{" "}
                          {ticket.BookingDetails?.TechPhoneNumber || "-"}
                        </div>
                        <div className="col-sm-6 mb-10">
                          <strong>Vehicle Number:</strong>{" "}
                          {ticket.BookingDetails?.VehicleNumber || "-"}
                        </div>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Technician Tracking */}
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Technician Tracking</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.TechnicianTracking?.length > 0 ? (
                        <ul className="list-unstyled mb-0 text-md">
                          {ticket.BookingDetails.TechnicianTracking.map(
                            (track, idx) => {
                              // Helper to format date and time clearly
                              const formatDate = (dateStr) => {
                                if (!dateStr) return "-";
                                const date = new Date(dateStr);
                                return date.toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                });
                              };

                              return (
                                <li
                                  key={idx}
                                  className="mb-3 p-3 border rounded-3 bg-light"
                                >
                                  <div>
                                    <strong>🚗 Journey Started:</strong>{" "}
                                    <span className="text-secondary-light">
                                      {formatDate(track.JourneyStartedAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>📍 Reached At:</strong>{" "}
                                    <span className="text-secondary-light">
                                      {formatDate(track.ReachedAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>🧰 Service Started:</strong>{" "}
                                    <span className="text-secondary-light">
                                      {formatDate(track.ServiceStartedAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>✅ Service Ended:</strong>{" "}
                                    <span className="text-secondary-light">
                                      {formatDate(track.ServiceEndedAt)}
                                    </span>
                                  </div>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      ) : (
                        <p className="text-secondary-light mb-0">
                          No tracking data available.
                        </p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Payments */}
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>Payments</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.Payments?.length > 0 ? (
                        <ul className="list-unstyled mb-0 text-md">
                          {ticket.BookingDetails.Payments.map((p, idx) => (
                            <li key={idx} className="mb-2">
                              <div>
                                <strong>Transaction ID:</strong>{" "}
                                {p.TransactionID}
                              </div>
                              <div>
                                <strong>Amount Paid:</strong> ₹{p.AmountPaid}
                              </div>
                              <div>
                                <strong>Status:</strong> {p.PaymentStatus}
                              </div>
                              <div>
                                <strong>Invoice:</strong>{" "}
                                <a
                                  href={p.FolderPath}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View PDF
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-secondary-light mb-0">
                          No payments available.
                        </p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>

                  {/* Packages */}
                  <Accordion.Item eventKey="3">
                    <Accordion.Header>Packages</Accordion.Header>
                    <Accordion.Body>
                      {ticket.BookingDetails?.Packages?.length > 0 ? (
                        ticket.BookingDetails.Packages.map((pkg, idx) => (
                          <div key={idx} className="mb-3">
                            <h6 className="fw-semibold mb-2">
                              {pkg.PackageName}
                            </h6>
                            <div className="text-md mb-2">
                              <strong>Category:</strong>{" "}
                              {pkg.Category?.CategoryName || "-"}
                            </div>
                            <ul className="ms-3 text-md">
                              {pkg.Category?.SubCategories?.map((sub) => (
                                <li key={sub.SubCategoryID}>
                                  <strong>{sub.SubCategoryName}</strong>
                                  <ul>
                                    {sub.Includes?.map((inc) => (
                                      <li key={inc.IncludeID}>
                                        {inc.IncludeName}
                                      </li>
                                    ))}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p className="text-secondary-light mb-0">
                          No package data available.
                        </p>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                {/* Ticket Description */}
                {/* <h6 className="text-md fw-semibold text-primary-light mt-3 mb-2">
                  Ticket Description
                </h6>
                <p className="text-secondary-light mb-0 text-md">
                  {ticket.TicketDescription || "-"}
                </p> */}
              </>
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------ Right: Timeline ------------------ */}
      <div className="col-lg-3">
        <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            <h6 className="text-xl mb-16 border-bottom pb-2">Timeline</h6>

            {ticket?.TrackingHistory && ticket.TrackingHistory.length > 0 ? (
              <ul className="mb-0 list-unstyled ps-0">
                {ticket.TrackingHistory.slice()
                  .reverse()
                  .map((item, idx) => (
                    <li
                      key={idx}
                      className="mb-3 pb-3 border-bottom border-dashed last:border-0"
                    >
                      <div className="d-flex align-items-start gap-3">
                        <span
                          className={`badge rounded-pill px-3 py-2 fw-semibold ${
                            item.Status === 1
                              ? "bg-info text-white"        
                              : item.Status === 2
                              ? "bg-warning text-dark"      
                              : item.Status === 3
                              ? "bg-success text-white"     
                              : item.Status === 4
                              ? "bg-secondary text-white"  
                              : item.Status === 5
                              ? "bg-danger text-white"      
                              : item.Status === 6
                              ? "bg-primary text-white"   
                              : "bg-light text-dark"     
                          }`}
                        >
                          {item.StatusName}
                        </span>
                        <div>
                          <div className="text-sm text-secondary-light fw-medium">
                            {item.StatusDate
                              ? new Date(item.StatusDate).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )
                              : "-"}
                          </div>
                          <div className="text-sm text-secondary-light">
                            {item.StatusDescription || "-"}
                          </div>
                        </div>
                      </div>

                      {/* 🔽 Show attachments below description */}
                      {item.FilePath && (
                        <div className="mt-2">
                          {/* Use bootstrap grid to make attachments take full timeline width — 3 cols per row */}
                          <div className="row row-cols-3 g-2 w-100 bg-light p-2 rounded">
                            {item.FilePath.split(",").map((rawName, i) => {
                              const fileName = rawName.trim();
                              if (!fileName) return null;
                              const fileUrl = `${
                                import.meta.env.VITE_APIURL_IMAGE
                              }TicketDocuments/${fileName}`;
                              const isImage =
                                /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                                  fileName
                                );
                              const isPDF = /\.pdf$/i.test(fileName);
                              const isWord = /\.(doc|docx)$/i.test(fileName);

                              return (
                                <div key={i} className="col">
                                  <div className="border rounded bg-white text-center h-100 d-flex flex-column">
                                    {/* view in new tab */}
                                    {isImage ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="d-block"
                                      >
                                        <img
                                          src={fileUrl}
                                          alt={fileName}
                                          className="img-thumbnail"
                                          style={{
                                            width: "100%",
                                            height: "80px",
                                            objectFit: "cover",
                                          }}
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="d-flex align-items-center justify-content-center bg-light border rounded"
                                        style={{
                                          width: "100%",
                                          height: "80px",
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                      >
                                        {isPDF ? (
                                          <Icon
                                            icon="mdi:file-pdf"
                                            width={90}
                                            height={90}
                                            color="#dc3545"
                                          />
                                        ) : isWord ? (
                                          <Icon
                                            icon="mdi:file-word"
                                            width={90}
                                            height={90}
                                            color="#007bff"
                                          />
                                        ) : (
                                          <Icon
                                            icon="mdi:file-document"
                                            width={90}
                                            height={90}
                                          />
                                        )}
                                      </a>
                                    )}

                                    {/* <div className="mt-0">
                                      <button
                                        onClick={() =>
                                          handleDownload(fileUrl, fileName)
                                        }
                                        className="btn btn-secondary btn-sm d-inline-flex align-items-center justify-content-center"
                                        style={{
                                          width: "50px",
                                          height: "20px",
                                        }}
                                        title="Download"
                                      >
                                        <i className="bi bi-download text-white" />
                                      </button>
                                    </div> */}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 🧩 Show customer-uploaded files only under Pending status */}
                      {item.StatusName === "Pending" &&
                        ticket?.FilePath &&
                        ticket.FilePath.length > 0 && (
                          <div className="mt-3">
                            <h6 className="fw-semibold text-sm mb-2">
                              Customer Attachments:
                            </h6>

                            <div className="row row-cols-3 g-2 w-100 bg-light rounded">
                              {ticket.FilePath.split(",").map((rawName, i) => {
                                const fileName = rawName.trim();
                                if (!fileName) return null;
                                const fileUrl = `${
                                  import.meta.env.VITE_APIURL_IMAGE
                                }TicketDocuments/${fileName}`;
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                                    fileName
                                  );
                                const isPDF = /\.pdf$/i.test(fileName);
                                const isWord = /\.(doc|docx)$/i.test(fileName);

                                return (
                                  <div key={i} className="col">
                                    <div className="border rounded bg-white text-center h-100 d-flex flex-column">
                                      {isImage ? (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="d-block"
                                        >
                                          <img
                                            src={fileUrl}
                                            alt={fileName}
                                            className="img-thumbnail"
                                            style={{
                                              width: "100%",
                                              height: "80px",
                                              objectFit: "cover",
                                            }}
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="d-flex align-items-center justify-content-center bg-light border rounded"
                                          style={{
                                            width: "100%",
                                            height: "80px",
                                            textDecoration: "none",
                                            color: "inherit",
                                          }}
                                        >
                                          {isPDF ? (
                                            <Icon
                                              icon="mdi:file-pdf"
                                              width={90}
                                              height={90}
                                              color="#dc3545"
                                            />
                                          ) : isWord ? (
                                            <Icon
                                              icon="mdi:file-word"
                                              width={90}
                                              height={90}
                                              color="#007bff"
                                            />
                                          ) : (
                                            <Icon
                                              icon="mdi:file-document"
                                              width={90}
                                              height={90}
                                            />
                                          )}
                                        </a>
                                      )}

                                      {/* <div className="mt-0">
                                        <button
                                          onClick={() =>
                                            handleDownload(fileUrl, fileName)
                                          }
                                          className="btn btn-secondary btn-sm d-inline-flex align-items-center justify-content-center"
                                          style={{
                                            width: "50px",
                                            height: "20px",
                                          }}
                                          title="Download"
                                        >
                                          <i className="bi bi-download text-white" />
                                        </button>
                                      </div> */}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-secondary-light mb-0">No timeline available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketInnerLayer;
