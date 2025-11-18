import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const LeadViewLayer = () => {
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callAnswered, setCallAnswered] = useState(""); // "Ans" or "Not Ans"
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("");
  const [descriptionNotes, setDescriptionNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  // Dummy data for lead
  const dummyLead = {
    Id: leadId,
    FullName: "John Doe",
    PhoneNumber: "+1234567890",
    Email: "john.doe@example.com",
    City: "New York",
    LeadStatus: "CREATED",
    CreatedDate: "2023-10-01T10:00:00Z",
    Description: "Interested in car servicing",
    TrackingHistory: [
      {
        StatusName: "CREATED",
        StatusDate: "2023-10-01T10:00:00Z",
        StatusDescription: "Lead created from Facebook",
        EmployeeName: "System",
      },
      {
        StatusName: "CONTACTED",
        StatusDate: "2023-10-02T14:30:00Z",
        StatusDescription: "Called the customer and discussed services",
        EmployeeName: "Jane Smith",
      },
    ],
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  // Simulate fetching lead
  const fetchLead = async () => {
    setLoading(true);
    setError("");
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setLead(dummyLead);
    } catch (err) {
      console.error("Failed to load lead", err);
      setError("Failed to load lead. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit Status
  const handleSubmitStatus = async () => {
    if (!lead) return;

    if (callAnswered === "") {
      Swal.fire({
        icon: "warning",
        title: "Select call status",
        text: "Please select whether the call was answered or not.",
      });
      return;
    }

    let statusDescription = "";
    let statusName = "";

    if (callAnswered === "Not Ans") {
      if (!followUpStatus) {
        Swal.fire({
          icon: "warning",
          title: "Select follow-up status",
          text: "Please select a follow-up status.",
        });
        return;
      }
      statusName = "NOT ANSWERED";
      statusDescription = `Follow-up Status: ${followUpStatus}, Notes: ${descriptionNotes}, Follow-up Date: ${followUpDate || "Not set"}`;
    } else if (callAnswered === "Ans") {
      if (!callOutcome) {
        Swal.fire({
          icon: "warning",
          title: "Select call outcome",
          text: "Please select a call outcome.",
        });
        return;
      }
      statusName = "CONTACTED";
      statusDescription = `Outcome: ${callOutcome}, Notes: ${discussionNotes}, Next Action: ${nextAction}${nextAction === "Follow-up Needed" ? `, Follow-up Date: ${nextFollowUpDate || "Not set"}` : ""}`;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update dummy data
      const newHistoryEntry = {
        StatusName: statusName,
        StatusDate: new Date().toISOString(),
        StatusDescription: statusDescription,
        EmployeeName: "Current User", // In real app, get from auth
      };

      setLead(prev => ({
        ...prev,
        LeadStatus: statusName,
        TrackingHistory: [...prev.TrackingHistory, newHistoryEntry],
      }));

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Lead status updated successfully.",
      });

      // Reset form
      setCallAnswered("");
      setFollowUpDate("");
      setFollowUpStatus("");
      setDescriptionNotes("");
      setCallOutcome("");
      setDiscussionNotes("");
      setNextAction("");
      setNextFollowUpDate("");
    } catch (err) {
      console.error("Status update failed", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status. Please try again.",
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
                src="/assets/images/user-grid/user-grid-img14.png"
                alt="customer"
                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
              />
              <h6 className="mb-0 mt-16">{lead?.FullName || "N/A"}</h6>
              <span className="text-secondary-light">
                {lead?.PhoneNumber || "-"}
              </span>
            </div>

            <div className="mt-24">
              <ul>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Email
                  </span>
                  <span className="w-70 text-secondary-light fw-medium text-break">
                    : {lead?.Email || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    City
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {lead?.City || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">
                    Created
                  </span>
                  <span className="w-70 text-secondary-light fw-medium">
                    :{" "}
                    {lead?.CreatedDate
                      ? new Date(lead.CreatedDate).toLocaleString(
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
                    : {lead?.Description || "-"}
                  </span>
                </li>
              </ul>
              <div className="d-flex gap-2 mt-3">
                <Link
                  to="/leads"
                  className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                >
                  <Icon icon="mdi:arrow-left" className="fs-5" />
                  Back
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------ Middle: Update Status ------------------ */}
      <div className="col-lg-5">
        <div className="user-grid-card border pt-3 radius-16 overflow-hidden bg-base h-100">
          <div className="pb-24 ms-16 mb-24 me-16">
            {loading ? (
              <p>Loading lead...</p>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : lead ? (
              <>
                {/* Update Status */}
                <h6 className="text-xl mb-16 border-bottom pb-2">
                  Update Status
                </h6>
                <div className="p-3 border radius-16 bg-light">
                  {/* Call Answered Radio Buttons */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-primary-light">
                      Call Status
                    </label>
                    <div className="d-flex justify-content-around px-3 py-2">
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="callAnswered"
                          id="callAnswered"
                          value="Ans"
                          checked={callAnswered === "Ans"}
                          onChange={(e) => setCallAnswered(e.target.value)}
                        />
                        <label className="form-check-label ms-1" htmlFor="callAnswered">
                          Call Answered
                        </label>
                      </div>
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="callAnswered"
                          id="callNotAnswered"
                          value="Not Ans"
                          checked={callAnswered === "Not Ans"}
                          onChange={(e) => setCallAnswered(e.target.value)}
                        />
                        <label className="form-check-label ms-1" htmlFor="callNotAnswered">
                          Call Not Answered
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Fields based on Call Status */}
                  {callAnswered === "Not Ans" && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary-light">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary-light">
                          Follow-up Status
                        </label>
                        <select
                          className="form-select"
                          value={followUpStatus}
                          onChange={(e) => setFollowUpStatus(e.target.value)}
                        >
                          <option value="">Select status</option>
                          <option value="Not Reachable">Not Reachable</option>
                          <option value="Busy">Busy</option>
                          <option value="Switched Off">Switched Off</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary-light">
                          Description / Notes
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Add notes"
                          value={descriptionNotes}
                          maxLength={200}
                          onChange={(e) => setDescriptionNotes(e.target.value)}
                        />
                        <small
                          className="text-secondary-light text-sm"
                          style={{ display: "block", textAlign: "right" }}
                        >
                          {descriptionNotes.length}/200 characters
                        </small>
                      </div>
                    </div>
                  )}

                  {callAnswered === "Ans" && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary-light">
                          Call Outcome / Discussion Result
                        </label>
                        <select
                          className="form-select"
                          value={callOutcome}
                          onChange={(e) => setCallOutcome(e.target.value)}
                        >
                          <option value="">Select outcome</option>
                          <option value="Interested">Interested</option>
                          <option value="Not Interested">Not Interested</option>
                          <option value="Need More Info">Need More Info</option>
                          <option value="Send Details">Send Details</option>
                          <option value="Schedule Meeting">Schedule Meeting</option>
                          <option value="Price Issue">Price Issue</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary-light">
                          Discussion Notes
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Add discussion notes"
                          value={discussionNotes}
                          maxLength={200}
                          onChange={(e) => setDiscussionNotes(e.target.value)}
                        />
                        <small
                          className="text-secondary-light text-sm"
                          style={{ display: "block", textAlign: "right" }}
                        >
                          {discussionNotes.length}/200 characters
                        </small>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary-light">
                          Next Action
                        </label>
                        <select
                          className="form-select"
                          value={nextAction}
                          onChange={(e) => setNextAction(e.target.value)}
                        >
                          <option value="">Select action</option>
                          <option value="Follow-up Needed">Follow-up Needed</option>
                          <option value="Send Quotation">Send Quotation</option>
                          <option value="Schedule Meeting">Schedule Meeting</option>
                          <option value="Close Lead">Close Lead</option>
                          <option value="Convert to Customer">Convert to Customer</option>
                        </select>
                      </div>
                      {nextAction === "Follow-up Needed" && (
                        <div className="col-12">
                          <label className="form-label fw-semibold text-primary-light">
                            Next Follow-up Date
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={nextFollowUpDate}
                            onChange={(e) => setNextFollowUpDate(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-end mt-3 gap-10">
                    <button
                      className="btn btn-primary-600 px-20 btn-sm"
                      onClick={handleSubmitStatus}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------ Right: Timeline ------------------ */}
      <div className="col-lg-3">
        <div
          className="user-grid-card border pt-3 radius-16 bg-base d-flex flex-column w-100"
          style={{ height: "810px" }}
        >
          <div className="pb-24 ms-16 mb-24 me-16 flex-grow-1 d-flex flex-column">
            <h6 className="text-xl mb-16 border-bottom pb-2">Timeline</h6>
            <div
              className="flex-grow-1 overflow-auto pe-0"
              style={{ maxHeight: "725px", scrollbarWidth: "thin" }}
            >
              {lead?.TrackingHistory && lead.TrackingHistory.length > 0 ? (
                <ul className="mb-0 list-unstyled ps-0">
                  {lead.TrackingHistory.map((item, idx) => (
                    <li
                      key={idx}
                      className="mb-3 pb-3 border-bottom border-dashed last:border-0"
                    >
                      <div className="d-flex align-items-start gap-3">
                        <span
                          className={`badge rounded-pill px-3 py-2 fw-semibold text-white ${
                            item.StatusName === "CREATED"
                              ? "bg-secondary"
                              : item.StatusName === "CONTACTED"
                              ? "bg-info"
                              : item.StatusName === "QUALIFIED"
                              ? "bg-warning text-dark"
                              : item.StatusName === "CLOSED"
                              ? "bg-success"
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
                          <div className="text-sm text-secondary-light">
                            {item.EmployeeName || "-"}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary-light mb-0">
                  No timeline available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadViewLayer;
