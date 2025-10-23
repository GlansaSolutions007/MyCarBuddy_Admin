import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TelecalerAssignBookingLayer from "../components/TelecalerAssignBookingLayer";

const BookingViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Bookings' />

        {/* BookingViewLayer */}
        <TelecalerAssignBookingLayer />
      </MasterLayout>
    </>
  );
};

export default BookingViewPage;
