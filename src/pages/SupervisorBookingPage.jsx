import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SupervisorBookingLayer from "../components/SupervisorBookingLayer";

const SupervisorBookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Supervisor Bookings' />

        {/* BookingViewLayer */}
        <SupervisorBookingLayer />
      </MasterLayout>
    </>
  );
};

export default SupervisorBookingPage;
