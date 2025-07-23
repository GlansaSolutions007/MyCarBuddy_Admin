import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CouponLayer from "../components/CouponLayer";

const CouponPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Coupons' />

        {/* BookingTimeSlotLayer */}
        <CouponLayer />
      </MasterLayout>
    </>
  );
};

export default CouponPage;
