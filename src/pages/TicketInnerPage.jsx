import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TicketInnerLayer from "../components/TicketInnerLayer";

const TicketInnerPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Ticket View' />
        <TicketInnerLayer />
      </MasterLayout>
    </>
  );
};

export default TicketInnerPage;


