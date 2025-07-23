import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingViewLayer from "../components/BookingViewLayer";

const BookingViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Booking View' />

        {/* BookingViewLayer */}
        <BookingViewLayer />
      </MasterLayout>
    </>
  );
};

export default BookingViewPage;
