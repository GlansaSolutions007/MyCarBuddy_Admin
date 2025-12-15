import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ClosedLeadsLayer from "../components/ClosedLeadsLayer"

const ClosedLeadsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Closed Leads' />

        {/* ClosedLeadsLayer */}
        <ClosedLeadsLayer />
      </MasterLayout>
    </>
  );
};

export default ClosedLeadsPage;
