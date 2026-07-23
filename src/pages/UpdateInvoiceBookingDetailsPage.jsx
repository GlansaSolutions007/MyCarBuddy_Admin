import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import UpdateInvoiceBookingDetailsLayer from "../components/UpdateInvoiceBookingDetailsLayer";

const UpdateInvoiceBookingDetailsPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Bookings - Update Invoice Details" />
        <UpdateInvoiceBookingDetailsLayer />
      </MasterLayout>
    </>
  );
};

export default UpdateInvoiceBookingDetailsPage;

