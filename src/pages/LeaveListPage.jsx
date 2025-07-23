import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeaveListLayer from "../components/LeaveListLayer";

const LeaveListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Leave Request' />

        {/* BookingTimeSlotLayer */}
        <LeaveListLayer />
      </MasterLayout>
    </>
  );
};

export default LeaveListPage;
