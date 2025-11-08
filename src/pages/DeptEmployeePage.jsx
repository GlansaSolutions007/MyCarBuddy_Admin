import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DepartmentTicketsLayer from "../components/DepartmentTicketsLayer";

const DeptEmployeePage = () => {
  const { deptId } = useParams();

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Department Employees' />

        {/* TicketDepartmentLayer */}
        <DepartmentTicketsLayer deptId={deptId} />
      </MasterLayout>
    </>
  );
};

export default DeptEmployeePage;