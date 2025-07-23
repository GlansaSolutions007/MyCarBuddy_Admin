import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TechnicianLayer from "../components/TechnicianLayer";

const TechnicianPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Technician' />

        {/* VoiceGeneratorLayer */}
        <TechnicianLayer />
      </MasterLayout>
    </>
  );
};

export default TechnicianPage;
