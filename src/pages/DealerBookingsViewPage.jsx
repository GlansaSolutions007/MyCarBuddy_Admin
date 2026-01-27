import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerBookingsView from "../components/DealerBookingsView"

const DealerBookingsViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dealer Booking View' />

        {/* DealerBookingsView */}
        <DealerBookingsView />
      </MasterLayout>
    </>
  );
};

export default DealerBookingsViewPage;
