import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeTicketReportLayer from "../components/EmployeeTicketReportLayer";

const EmpTicketViewPage = () => {
  const { id } = useParams(); // Get employee ID from URL

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Employee View' />

        {/* TicketDeptEmpView */}
        <EmployeeTicketReportLayer employeeId={id} />
      </MasterLayout>
    </>
  );
};

export default EmpTicketViewPage;
