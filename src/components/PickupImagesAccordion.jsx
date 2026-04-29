import { Icon } from "@iconify/react";
import Accordion from "react-bootstrap/Accordion";

const PickupImagesAccordion = ({ serviceImages, apiImageBase }) => {
  const pickupImages =
    serviceImages?.filter((item) => item.ImageUploadType === "Pickup") || [];

  return (
    <Accordion className="mb-3">
      <Accordion.Item eventKey="pickupImages">
        <Accordion.Header>
          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
            <Icon icon="mdi:car-arrow-right" width={20} height={20} />
            Pickup Images
          </h6>
        </Accordion.Header>

        <Accordion.Body>
          {pickupImages.length > 0 ? (
            <div className="row g-3">
              {pickupImages.map((img, idx) => (
                <div className="col-lg-2 col-md-3 col-4" key={img.ImageID ?? idx}>
                  <img
                    src={`${apiImageBase}${img.ImageURL}`}
                    alt="Pickup"
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
              No pickup images uploaded.
            </p>
          )}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default PickupImagesAccordion;
