import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import StateLayer from "../components/StateLayer";

const StatePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='State' />

        {/* VoiceGeneratorLayer */}
        <StateLayer />
      </MasterLayout>
    </>
  );
};

export default StatePage;
