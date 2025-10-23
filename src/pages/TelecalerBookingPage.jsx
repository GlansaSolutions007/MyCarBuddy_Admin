import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TelecalerBookingLayer from "../components/TelecalerBookingLayer";

const TelecalerBookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Telecaler Bookings' />

        {/* BookingViewLayer */}
        <TelecalerBookingLayer />
      </MasterLayout>
    </>
  );
};

export default TelecalerBookingPage;
