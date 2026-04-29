import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const CustomerConfirmationDetailsAccordion = ({
  customerConfirmationImages,
  customerConfirmationRole,
  customerConfirmationDescription,
  apiImageBase,
}) => (
  <Accordion className="mb-3" defaultActiveKey="">
    <Accordion.Item eventKey="serviceImages">
      <Accordion.Header>
        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
          <Icon icon="mdi:image-multiple" width={20} height={20} />
          Customer Confirmation Details
        </h6>
      </Accordion.Header>

      <Accordion.Body>
        {customerConfirmationImages.length > 0 ? (
          <div className="table-responsive">
            <table
              className="table table-bordered table-hover align-middle mb-0"
              style={{ fontSize: "0.875rem", textAlign: "center" }}
            >
              <thead
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <tr>
                  <th
                    className="text-nowrap py-2 px-3 fw-bold"
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    S.No
                  </th>
                  <th
                    className="text-nowrap py-2 px-3 fw-bold"
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Confirm At
                  </th>
                  <th
                    className="text-nowrap py-2 px-3 fw-bold"
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Confirm Role
                  </th>
                  <th
                    className="py-2 px-3 fw-bold"
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                      minWidth: "260px",
                    }}
                  >
                    Confirm Description
                  </th>
                  <th
                    className="text-nowrap py-2 px-3 fw-bold"
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    Image
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerConfirmationImages.map((img, idx) => (
                  <tr key={img.ImageID ?? idx}>
                    <td className="py-2 px-3">{idx + 1}</td>
                    <td className="py-2 px-3 text-nowrap">
                      {img.UploadedAt
                        ? new Date(img.UploadedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-2 px-3">{customerConfirmationRole}</td>
                    <td
                      className="py-2 px-3 text-start"
                      style={{
                        whiteSpace: "pre-wrap",
                        minWidth: "260px",
                      }}
                    >
                      {customerConfirmationDescription}
                    </td>
                    <td className="py-2 px-3">
                      <img
                        src={`${apiImageBase}${img.ImageURL}`}
                        alt="Customer Confirmation"
                        className="rounded border"
                        style={{
                          height: "45px",
                          width: "45px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          window.open(`${apiImageBase}${img.ImageURL}`, "_blank")
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0 text-center py-4">
            No customer confirmation images uploaded.
          </p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  </Accordion>
);

export default CustomerConfirmationDetailsAccordion;
