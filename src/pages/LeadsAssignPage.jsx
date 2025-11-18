import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadsAssignLayer from "../components/LeadsAssignLayer";

const LeadsAssignPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Leads' />

        {/* LeadsAssignLayer */}
        <LeadsAssignLayer />
      </MasterLayout>
    </>
  );
};

export default LeadsAssignPage;
