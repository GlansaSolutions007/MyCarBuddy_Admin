import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerProfileLayer from "../components/DealerProfileLayer";

const DealerProfilePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Profile' />

        {/* DealerProfileLayer */}
        <DealerProfileLayer />
      </MasterLayout>
    </>
  );
};

export default DealerProfilePage;