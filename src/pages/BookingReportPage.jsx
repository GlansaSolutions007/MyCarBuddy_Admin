import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BookingReportsLayer from "../components/BookingReportsLayer"

const DeptWiseTicketReportPage = () => {

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Booking Reports' />

        {/* DeptWiseTicketReport */}
        <BookingReportsLayer />
      </MasterLayout>
    </>
  );
};

export default DeptWiseTicketReportPage;
