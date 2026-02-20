import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Icon } from "@iconify/react";

const API_BASE = import.meta.env.VITE_APIURL;
const API_IMAGE = import.meta.env.VITE_APIURL_IMAGE;

const DealerViewLayer = () => {
  const { DealerID } = useParams();
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDealer();
  }, [DealerID]);

  const fetchDealer = async () => {
    try {
      const res = await axios.get(`${API_BASE}Dealer/${DealerID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dealerData = Array.isArray(res.data) ? res.data[0] : res.data;
      setDealer(dealerData || null);
    } catch (error) {
      console.error("Error fetching dealer:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <p>Loading dealer details...</p>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="text-center py-5">
        <p>Dealer not found</p>
      </div>
    );
  }

  return (
    <div className="row gy-4 mt-3">
      <div className="col-lg-4">
        <div className="user-grid-card border radius-16 overflow-hidden bg-base h-100">
          <div className="p-3 text-center">
            <img
              src="/assets/images/user-grid/user-grid-img13.png"
              alt={dealer.FullName || "Dealer"}
              className="border border-2 border-white w-150-px h-150-px rounded-circle object-fit-cover"
              style={{ width: "150px", height: "150px" }}
            />
            <h5 className="mt-3 mb-1">{dealer.FullName || "N/A"}</h5>
            <span className="text-muted">{dealer.Email || "No email"}</span>
          </div>
          <div className="p-3">
            <h6 className="text-primary mb-3">Dealer Information</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <strong>Dealer ID:</strong> {dealer.DealerID || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Email:</strong> {dealer.Email || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Phone:</strong> {dealer.PhoneNumber || "N/A"}
              </li>
              <li className="mb-2">
                <strong>City:</strong> {dealer.CityName || "N/A"}
              </li>
              <li className="mb-2">
                <strong>State:</strong> {dealer.StateName || "N/A"}
              </li>
              <li className="mb-2">
                <strong>Status:</strong>{" "}
                <span className={dealer.IsActive ? "text-success" : "text-danger"}>
                  {dealer.IsActive ? "Active" : "Inactive"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card h-100">
          <div className="card-body p-24">
            <h6 className="text-xl mb-16 border-bottom pb-2">Additional Details</h6>
            <div className="row">
              {dealer.Address && (
                <div className="col-md-12 mb-3">
                  <strong>Address:</strong> {dealer.Address}
                </div>
              )}
              {dealer.Pincode && (
                <div className="col-md-6 mb-3">
                  <strong>Pincode:</strong> {dealer.Pincode}
                </div>
              )}
              {dealer.DistributorName && (
                <div className="col-md-6 mb-3">
                  <strong>Distributor:</strong> {dealer.DistributorName}
                </div>
              )}
              {dealer.CreatedDate && (
                <div className="col-md-6 mb-3">
                  <strong>Created Date:</strong>{" "}
                  {new Date(dealer.CreatedDate).toLocaleString("en-GB")}
                </div>
              )}
              {dealer.ModifiedDate && (
                <div className="col-md-6 mb-3">
                  <strong>Modified Date:</strong>{" "}
                  {new Date(dealer.ModifiedDate).toLocaleString("en-GB")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerViewLayer;
