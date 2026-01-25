import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AssignSupervisorArea from "../components/AssignSupervisorArea";

const AssignSupervisorAreaPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Area' />

        {/* AssignSupervisorArea */}
        <AssignSupervisorArea />
      </MasterLayout>
    </>
  );
};

export default AssignSupervisorAreaPage;
