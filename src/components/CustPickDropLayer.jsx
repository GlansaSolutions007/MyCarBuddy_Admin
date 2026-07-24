import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import { Icon } from "@iconify/react";

const CustPickDropLayer = ({ show, onHide, onSubmit, dealerOptions }) => {
  const [action, setAction] = useState("pick");
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const handleSubmit = () => {
    if (!selectedDealer) {
      alert("Please select a garage");
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }

    onSubmit({
      action: action,
      dealer: selectedDealer.value,
      date: selectedDate,
      time: selectedTime,
      userId: localStorage.getItem("userId"),
    });

    onHide();
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: "52px",
      padding: "4px 8px",
      borderRadius: "10px",
      borderColor: "#dee2e6",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#0d6efd",
      },
    }),

    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      className="custom-pick-drop-modal"
    >
      {/* Modal Header */}
      <Modal.Header className="border-0 px-5 pt-4 pb-2 justify-content-center">
        <Modal.Title className="fw-bold modal-heading text-center">
          Customer Pickup / Drop
        </Modal.Title>
      </Modal.Header>

      {/* Modal Body */}
      <Modal.Body className="px-5 py-4">
        <Form>
          {/* Action Type Selection */}
          <Form.Label className="text-muted small fw-bold text-uppercase mb-3">
            Select Action Type
          </Form.Label>

          <Row className="g-4 mb-5">
            {/* Drop */}
            <Col xs={6}>
              <div
                onClick={() => setAction("drop")}
                className={`action-card ${
                  action === "drop" ? "active-action-card" : ""
                }`}
              >
                <Icon
                  icon="mdi:car-key"
                  width="34"
                  className={action === "drop" ? "text-primary" : "text-muted"}
                />

                <div
                  className={`fw-bold mt-2 ${
                    action === "drop" ? "text-primary" : ""
                  }`}
                >
                  Drop
                </div>

                <small className="text-muted mt-1">
                  Customer drops off the car at the dealer
                </small>
              </div>
            </Col>
            {/* Pickup */}
            <Col xs={6}>
              <div
                onClick={() => setAction("pick")}
                className={`action-card ${
                  action === "pick" ? "active-action-card" : ""
                }`}
              >
                <Icon
                  icon="mdi:truck-delivery-outline"
                  width="34"
                  className={action === "pick" ? "text-primary" : "text-muted"}
                />

                <div
                  className={`fw-bold mt-2 ${
                    action === "pick" ? "text-primary" : ""
                  }`}
                >
                  Pickup
                </div>

                <small className="text-muted mt-1">
                  Customer picks up the car from the dealer
                </small>
              </div>
            </Col>
          </Row>

          {/* Garage Selection */}
          <Form.Group className="mb-3">
            <Form.Label className="text-muted small fw-bold text-uppercase mb-2">
              Select Garage / Dealer
            </Form.Label>

            <Select
              value={selectedDealer}
              onChange={setSelectedDealer}
              options={dealerOptions}
              placeholder="Search for a garage..."
              styles={selectStyles}
              isClearable
            />
          </Form.Group>
          {/* Date and Time Selection */}
          <Row className="g-3 mt-3">
            {/* Date */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="text-muted small fw-bold text-uppercase mb-2">
                  Select Date
                </Form.Label>

                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="custom-date-time-input"
                />
              </Form.Group>
            </Col>

            {/* Time */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="text-muted small fw-bold text-uppercase mb-2">
                  Select Time
                </Form.Label>

                <Form.Control
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="custom-date-time-input"
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      {/* Modal Footer */}
      <Modal.Footer className="border-0 px-5 pb-4 pt-2 justify-content-center">
        <Button
          variant="light"
          onClick={onHide}
          className="px-4 py-2 me-3 cancel-btn"
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          className="px-4 py-2 fw-bold confirm-btn"
          disabled={!selectedDealer || !selectedDate || !selectedTime}
        >
          Confirm {action === "pick" ? "Pickup" : "Drop"}
        </Button>
      </Modal.Footer>

      {/* Custom Styles */}
      <style>{`

    /* Modal Width */
    .custom-pick-drop-modal .modal-dialog {
      max-width: 650px;
    }

    /* Modal Container */
    .custom-pick-drop-modal .modal-content {
      min-height: 450px;
      border: none;
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }

    /* Modal Heading */
    .modal-heading {
      font-size: 19px;
      color: #212529;
    }

    /* Pickup / Drop Cards */
    .action-card {
      min-height: 105px;
      padding: 18px 14px;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease-in-out;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      background-color: #ffffff;
    }

    /* Hover Effect */
    .action-card:hover {
      border-color: #0d6efd;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(13, 110, 253, 0.10);
    }

    /* Selected Action */
    .active-action-card {
      border: 2px solid #0d6efd !important;
      background-color: #f0f7ff;
      box-shadow: 0 6px 20px rgba(13, 110, 253, 0.12);
    }
      .custom-date-time-input {
        height: 52px;
        border-radius: 10px;
        border: 1px solid #dee2e6;
        padding: 10px 14px;
        box-shadow: none;
      }

      .custom-date-time-input:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
      }

    /* Center Footer Buttons */
    .custom-pick-drop-modal .modal-footer {
      justify-content: center !important;
      padding-bottom: 30px;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    /* Cancel Button */
    .cancel-btn {
      border-radius: 8px;
      min-width: 100px;
    }

    /* Confirm Button */
    .confirm-btn {
      border-radius: 8px;
      min-width: 160px;
    }

  `}</style>
    </Modal>
  );
};

export default CustPickDropLayer;
