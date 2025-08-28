import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import PolicyLayer from "../components/PolicyLayer";

const PolicyPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Policy' />

        {/* BookingViewLayer */}
        <PolicyLayer />
      </MasterLayout>
    </>
  );
};

export default PolicyPage;
