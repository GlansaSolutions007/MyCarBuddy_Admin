import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DeptWiseTicketReport from "../components/DeptWiseTicketReport";

const DeptWiseTicketReportPage = () => {

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Ticket Reports' />

        {/* DeptWiseTicketReport */}
        <DeptWiseTicketReport />
      </MasterLayout>
    </>
  );
};

export default DeptWiseTicketReportPage;
