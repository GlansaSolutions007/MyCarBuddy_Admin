import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeViewLayer from "../components/EmployeeViewLayer";

const EmployeeViewPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Employee View" />
        <EmployeeViewLayer />
      </MasterLayout>
    </>
  );
};

export default EmployeeViewPage;
