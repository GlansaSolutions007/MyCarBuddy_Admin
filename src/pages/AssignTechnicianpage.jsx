import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AssignTechnicianLayer from "../components/AssignTechnicianLayer";

const AssignTechnicianPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Technician' />

        {/* AssignTechnicianLayer */}
        <AssignTechnicianLayer />
      </MasterLayout>
    </>
  );
};

export default AssignTechnicianPage;