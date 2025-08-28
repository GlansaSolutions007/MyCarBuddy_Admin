import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SeoListLayer from "../components/SeoListLayer";

const SeoPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Seo' />

        {/* BookingTimeSlotLayer */}
        <SeoListLayer />
      </MasterLayout>
    </>
  );
};

export default SeoPage;
