
import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";
import DataTable from "react-data-table-component";
const API_BASE = import.meta.env.VITE_APIURL;

const InspectionChecklistAccordion = ({ inspectionResults, inspectionColumns, bookingId }) => {
  
   // NEW: Hide entirely if no data
  if (!inspectionResults || inspectionResults.length === 0) {
    return null;
  }
  // 1. Safety check for columns (prevents the "not iterable" error)
  const safeColumns = Array.isArray(inspectionColumns) ? inspectionColumns : [];

  const handleDownloadChecklist = async () => {
    try {
      const response = await fetch(
        `${API_BASE}ServiceImages/InspectionChecklistPdf/${bookingId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Inspection_Checklist_${bookingId}.pdf`; // dynamic name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const dataWithSNo = (inspectionResults || []).map((item, index) => ({
    ...item,
    serialNumber: index + 1,
  }));

  // 3. Define the S.No column
  const columnsWithSNo = [
    {
      name: "S.No",
      selector: (row) => row.serialNumber,
      sortable: true,
      width: "80px",
    },
    ...safeColumns,
  ];

  return (
    <Accordion className="mb-3" defaultActiveKey="">
      <Accordion.Item eventKey="detailedInspection">
      <Accordion.Header>
  <div className="w-100 d-flex justify-content-between align-items-center">
    
    {/* Left side: Title */}
    <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
      <Icon icon="mdi:clipboard-list-outline" width={20} height={20} />
      Inspection Result Checklist
    </h6>

    {/* Right side: Button */}
    <button
      disabled={!bookingId}
      className="btn btn-press-effect btn-primary-600 btn-sm d-flex align-items-center gap-1"
      onClick={(e) => {
        e.stopPropagation(); // prevent accordion toggle
        handleDownloadChecklist();
      }}
    >
      <Icon icon="mdi:download" width={16} height={16} />
      Download Checklist
    </button>

  </div>
</Accordion.Header>
        <Accordion.Body>
          {dataWithSNo.length > 0 ? (
            <div className="border rounded">
              <DataTable
                columns={columnsWithSNo}
                data={dataWithSNo}
                pagination
                paginationPerPage={10}
                highlightOnHover
                responsive
                customStyles={{
                  headCells: {
                    style: {
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                    },
                  },
                  cells: {
                    style: {
                      fontSize: "0.875rem",
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-muted mb-0 text-center py-4">
              No inspection results checklist found for this booking.
            </p>
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default InspectionChecklistAccordion;