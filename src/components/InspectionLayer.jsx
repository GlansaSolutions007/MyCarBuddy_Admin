import React, { useState } from "react";

function InspectionLayer() {
  const [formData, setFormData] = useState({
    technicianStartedDateTime: "",
    technicianReachedDateTime: "",
    inspectionStartedDateTime: "",
    inspectionCompletedDateTime: "",
  });

  const [inspectionChecklist, setInspectionChecklist] = useState([
    {
      id: 1,
      category: "Exterior",
      inspectionName: "Check vehicle body condition",
      remark: "",
      technicianName: "Rajesh Kumar",
      dateTime: "",
      completed: false,
    },
    {
      id: 2,
      category: "Engine",
      inspectionName: "Check engine oil level",
      remark: "",
      technicianName: "Rajesh Kumar",
      dateTime: "",
      completed: false,
    },
    {
      id: 3,
      category: "Tyres",
      inspectionName: "Check tyre pressure and condition",
      remark: "",
      technicianName: "Rajesh Kumar",
      dateTime: "",
      completed: false,
    },
    {
      id: 4,
      category: "Brakes",
      inspectionName: "Check brake condition",
      remark: "",
      technicianName: "Rajesh Kumar",
      dateTime: "",
      completed: false,
    },
  ]);

  const handleTimelineChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChecklistChange = (id, field, value) => {
    setInspectionChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const inspectionData = {
      timeline: formData,
      checklist: inspectionChecklist,
    };

    console.log("Inspection Data:", inspectionData);
  };

  return (
    <div className="container-fluid py-3">

      <form onSubmit={handleSubmit}>
        {/* Inspection Timeline */}
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-header bg-white">
            <h6 className="mb-0">Inspection Timeline</h6>
          </div>

          <div className="card-body">
            {/* Technician Started Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Technician Started Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="technicianStartedDateTime"
                  value={formData.technicianStartedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Technician Reached Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Technician Reached Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="technicianReachedDateTime"
                  value={formData.technicianReachedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Inspection Start Date & Time */}
            <div className="row align-items-center mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Inspection Start Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="inspectionStartedDateTime"
                  value={formData.inspectionStartedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Checklist */}
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-header bg-white">
            <h6 className="mb-0">Inspection Checklist</h6>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "60px" }}>#</th>
                    <th style={{ width: "100px" }}>Check</th>
                    <th>Category</th>
                    <th>Inspection Name</th>
                    <th>Remark</th>
                    <th>Technician Name</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>

                <tbody>
                  {inspectionChecklist.map((item, index) => (
                    <tr key={item.id}>
                      {/* Serial Number */}
                      <td>{index + 1}</td>

                      {/* Checkbox */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={item.completed}
                          onChange={(e) =>
                            handleChecklistChange(
                              item.id,
                              "completed",
                              e.target.checked
                            )
                          }
                        />
                      </td>

                      {/* Category */}
                      <td>
                        <span className="fw-semibold">
                          {item.category}
                        </span>
                      </td>

                      {/* Inspection Name */}
                      <td>{item.inspectionName}</td>

                      {/* Remark */}
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter remark"
                          value={item.remark}
                          onChange={(e) =>
                            handleChecklistChange(
                              item.id,
                              "remark",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Technician Name */}
                      <td>{item.technicianName}</td>

                      {/* Date & Time */}
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={item.dateTime}
                          onChange={(e) =>
                            handleChecklistChange(
                              item.id,
                              "dateTime",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inspection Completion */}
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-0">
                  Inspection Completion Date & Time
                </label>
              </div>

              <div className="col-md-8">
                <input
                  type="datetime-local"
                  name="inspectionCompletedDateTime"
                  value={formData.inspectionCompletedDateTime}
                  onChange={handleTimelineChange}
                  className="form-control"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-end mt-3">
              <button
                type="submit"
                className="btn btn-primary-600 px-4"
              >
                Submit Inspection
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default InspectionLayer;