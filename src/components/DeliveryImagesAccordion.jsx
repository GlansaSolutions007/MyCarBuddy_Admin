import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const DeliveryImagesAccordion = ({ serviceImages, apiImageBase }) => {
  const deliveryImages =
    serviceImages?.filter((item) => item.ImageUploadType === "Delivery") || [];

  return (
    <Accordion className="mb-3">
      <Accordion.Item eventKey="deliveryImages">
        <Accordion.Header>
          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
            <Icon icon="mdi:car-arrow-left" width={20} height={20} />
            Delivery Images
          </h6>
        </Accordion.Header>

        <Accordion.Body>
          {deliveryImages.length > 0 ? (
            <div className="row g-3">
              {deliveryImages.map((img, idx) => (
                <div className="col-lg-2 col-md-3 col-4" key={img.ImageID ?? idx}>
                  <img
                    src={`${apiImageBase}${img.ImageURL}`}
                    alt="Delivery"
                    className="img-fluid rounded border"
                    style={{
                      height: "100px",
                      width: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      window.open(`${apiImageBase}${img.ImageURL}`, "_blank")
                    }
                  />

                  <div
                    className="text-muted text-center mt-1"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {img.UploadedAt
                      ? new Date(img.UploadedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0 text-center py-4">
              No delivery images uploaded.
            </p>
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default DeliveryImagesAccordion;
