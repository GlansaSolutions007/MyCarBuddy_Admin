import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TicketsViewLayer from "../components/TicketsViewLayer";
const TicketsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Tickets' />

        {/* TicketsViewLayer */}
        <TicketsViewLayer />
      </MasterLayout>
    </>
  );
};

export default TicketsPage;
