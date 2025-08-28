import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SeoAddLayer from "../components/SeoAddLayer";

const SeoAddPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Seo Add' />

        {/* BookingTimeSlotLayer */}
        <SeoAddLayer />
      </MasterLayout>
    </>
  );
};

export default SeoAddPage;
