import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingReportSortingLayer from "../components/BookingReportSortingLayer";

const BookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Sorted Bookings' />

        {/* BookingLayer */}
        <BookingReportSortingLayer />
      </MasterLayout>
    </>
  );
};

export default BookingPage;
