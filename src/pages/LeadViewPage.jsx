import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadViewLayer from "../components/LeadViewLayer";

const LeadViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Lead View' />

        {/* LeadViewLayer */}
        <LeadViewLayer />
      </MasterLayout>
    </>
  );
};

export default LeadViewPage;
