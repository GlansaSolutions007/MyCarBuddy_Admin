import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadViewOnlyLayer from "../components/LeadViewOnlyLayer";

const LeadViewOnlyPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Lead View (Read Only)" />
        <LeadViewOnlyLayer />
      </MasterLayout>
    </>
  );
};

export default LeadViewOnlyPage;
