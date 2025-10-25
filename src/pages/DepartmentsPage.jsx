import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DepartmentsLayer from "../components/DepartmentsLayer";

const StatePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Departments' />

        {/* VoiceGeneratorLayer */}
        <DepartmentsLayer />
      </MasterLayout>
    </>
  );
};

export default StatePage;
