import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingTimeSlotLayer from "../components/BookingTimeSlotLayer";

const BookingTimeSlotPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Booking Time Slot' />

        {/* BookingTimeSlotLayer */}
        <BookingTimeSlotLayer />
      </MasterLayout>
    </>
  );
};

export default BookingTimeSlotPage;
