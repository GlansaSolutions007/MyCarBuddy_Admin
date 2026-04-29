import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";
import DataTable from "react-data-table-component";

const InspectionChecklistAccordion = ({ inspectionResults, inspectionColumns }) => (
  <Accordion className="mb-3" defaultActiveKey="">
    <Accordion.Item eventKey="detailedInspection">
      <Accordion.Header>
        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
          <Icon icon="mdi:clipboard-list-outline" width={20} height={20} />
          Inspection Result Checklist
        </h6>
      </Accordion.Header>
      <Accordion.Body>
        {inspectionResults && inspectionResults.length > 0 ? (
          <div className="border rounded">
            <DataTable
              columns={inspectionColumns}
              data={inspectionResults}
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

export default InspectionChecklistAccordion;
