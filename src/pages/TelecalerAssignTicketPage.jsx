import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TelecalerAssignTicketLayer from "../components/TelecalerAssignTicketLayer";

const TelecalerAssignTicketPage = () => {

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Assign Tickets" />

        {/* TelecalerAssignTicketLayer */}
        <TelecalerAssignTicketLayer />
      </MasterLayout>
    </>
  );
};

export default TelecalerAssignTicketPage;
