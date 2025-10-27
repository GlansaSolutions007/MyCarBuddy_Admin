import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DesignationsLayer from "../components/DesignationsLayer";

const StatePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Designations' />

        {/* VoiceGeneratorLayer */}
        <DesignationsLayer />
      </MasterLayout>
    </>
  );
};

export default StatePage;
