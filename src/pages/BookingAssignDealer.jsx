import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingDealerAssign from "../components/BookingDealerAssign";

const CityPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dealer Assigning' />

        {/* VoiceGeneratorLayer */}
        <BookingDealerAssign />
      </MasterLayout>
    </>
  );
};

export default CityPage;
