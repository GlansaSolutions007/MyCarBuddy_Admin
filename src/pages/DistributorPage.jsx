import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DistributorLayer from "../components/DistributorLayer";

const DistributorPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Distributor' />

        {/* VoiceGeneratorLayer */}
        <DistributorLayer />
      </MasterLayout>
    </>
  );
};

export default DistributorPage;
