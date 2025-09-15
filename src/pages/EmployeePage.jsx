import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeLayer from "../components/EmployeeLayer";

const EmployeePage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Employees' />
        <EmployeeLayer />
      </MasterLayout>
    </>
  );
};

export default EmployeePage;
