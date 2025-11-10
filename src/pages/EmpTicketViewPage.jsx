import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeTicketReportLayer from "../components/EmployeeTicketReportLayer";

const EmpTicketViewPage = () => {
  const { id } = useParams(); 

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Employee Report' />

        {/* EmployeeTicketReportLayer */}
        <EmployeeTicketReportLayer employeeId={id} />
      </MasterLayout>
    </>
  );
};

export default EmpTicketViewPage;
