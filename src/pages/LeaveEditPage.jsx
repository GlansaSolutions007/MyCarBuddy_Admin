import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeaveEditLayer from "../components/LeaveEditLayer";

const LeaveEditPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Leave Request' />

        {/* BookingTimeSlotLayer */}
        <LeaveEditLayer />
      </MasterLayout>
    </>
  );
};

export default LeaveEditPage;
