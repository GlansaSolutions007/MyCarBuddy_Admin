import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ViewLeadLayer from "../components/ViewLeadLayer";

const ViewLeadPage = () => {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("id");
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_BASE = import.meta.env.VITE_APIURL;

  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  const fetchLead = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}ServiceLeads/FacebookLeads`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const foundLead = data.find((l) => l.Id === leadId);
      if (foundLead) {
        setLead(foundLead);
      } else {
        setError("Lead not found.");
      }
    } catch (err) {
      setError("Failed to fetch lead. Please try again.");
      console.error("Error fetching lead:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title='View Lead' />

        {/* ViewLeadLayer */}
        <div className="row gy-4">
          <div className="col-lg-12">
            <div className="card h-100">
              <div className="card-body p-24">
                {loading ? (
                  <div>Loading lead...</div>
                ) : error ? (
                  <div className="alert alert-danger">{error}</div>
                ) : (
                  <ViewLeadLayer lead={lead} />
                )}
              </div>
            </div>
          </div>
        </div>

      </MasterLayout>
    </>
  );
};

export default ViewLeadPage;
