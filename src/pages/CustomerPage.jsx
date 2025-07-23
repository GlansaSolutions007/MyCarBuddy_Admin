import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CustomerLayer from "../components/CustomerLayer";

const CustomerPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Customers' />

        {/* CustomerLayer */}
        <CustomerLayer />
      </MasterLayout>
    </>
  );
};

export default CustomerPage;
