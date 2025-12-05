import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadsLayer from "../components/LeadsLayer"

const LeadsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Social Leads' />

        {/* LeadsLayer */}
        <LeadsLayer />
      </MasterLayout>
    </>
  );
};

export default LeadsPage;
