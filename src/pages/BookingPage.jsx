import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingLayer from "../components/BookingLayer";

const BookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Bookings' />

        {/* BookingLayer */}
        <BookingLayer />
      </MasterLayout>
    </>
  );
};

export default BookingPage;
