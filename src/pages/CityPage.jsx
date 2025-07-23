import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CityLayer from "../components/CityLayer";

const CityPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='City' />

        {/* VoiceGeneratorLayer */}
        <CityLayer />
      </MasterLayout>
    </>
  );
};

export default CityPage;
