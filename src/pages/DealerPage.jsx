import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerLayer from "../components/DealerLayer";

const DealerPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dealer' />

        {/* VoiceGeneratorLayer */}
        <DealerLayer />
      </MasterLayout>
    </>
  );
};

export default DealerPage;
