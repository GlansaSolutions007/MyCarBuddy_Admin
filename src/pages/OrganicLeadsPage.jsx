import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import OrganicLeadsLayer from "../components/OrganicLeadsLayer";

const OrganicLeadsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Organic Leads' />

        {/* OrganicLeadsLayer */}
        <OrganicLeadsLayer />

      </MasterLayout>
    </>
  );
};

export default OrganicLeadsPage;



