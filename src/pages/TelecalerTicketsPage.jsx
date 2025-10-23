import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TelecalerTickets from "../components/TelecalerTicketLayer";

const BookingViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Telecaler Tickets' />

        {/* BookingViewLayer */}
        <TelecalerTickets />
      </MasterLayout>
    </>
  );
};

export default BookingViewPage;
