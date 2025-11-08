import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SupervisorAssignBookingLayer from "../components/SupervisorAssignBookingLayer";

const SupervisorAssignBookingPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Assign Supervisor' />

        {/* BookingViewLayer */}
        <SupervisorAssignBookingLayer />
      </MasterLayout>
    </>
  );
};

export default SupervisorAssignBookingPage;
