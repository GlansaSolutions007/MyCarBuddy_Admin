import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import RefundLayer from "../components/RefundLayer";

const RefundPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Refunds' />

        {/* BookingLayer */}
        <RefundLayer />
      </MasterLayout>
    </>
  );
};

export default RefundPage;
