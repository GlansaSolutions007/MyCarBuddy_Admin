import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadReportsLayer from "../components/LeadReportsLayer";

const LeadReportsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Lead Reports' />

        {/* LeadReportsLayer */}
        <LeadReportsLayer />

      </MasterLayout>
    </>
  );
};

export default LeadReportsPage;


