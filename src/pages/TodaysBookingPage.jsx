import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TodayBookingsLayer from "../components/TodayBookingsLayer";
const TodaysBookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Today Bookings' />

        {/* TicketsViewLayer */}
        <TodayBookingsLayer />
      </MasterLayout>
    </>
  );
};

export default TodaysBookingPage;
