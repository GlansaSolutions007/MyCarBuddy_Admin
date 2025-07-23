import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingTimeSlotLayer from "../components/BookingTimeSlotLayer";

const BookingTimeSlotPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Booking TimeSlot' />

        {/* BookingTimeSlotLayer */}
        <BookingTimeSlotLayer />
      </MasterLayout>
    </>
  );
};

export default BookingTimeSlotPage;
