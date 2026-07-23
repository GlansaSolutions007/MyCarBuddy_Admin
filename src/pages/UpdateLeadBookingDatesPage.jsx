import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import UpdateLeadBookingDatesLayer from "../components/UpdateLeadBookingDatesLayer";

const UpdateLeadBookingDatesPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Leads - Update Booking Dates" />
        <UpdateLeadBookingDatesLayer />
      </MasterLayout>
    </>
  );
};

export default UpdateLeadBookingDatesPage;

