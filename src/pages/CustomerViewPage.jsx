import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CustomerViewLayer from "../components/CustomerViewLayer";

const CustomerViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Customer View' />

        {/* CustomerLayer */}
        <CustomerViewLayer />
      </MasterLayout>
    </>
  );
};

export default CustomerViewPage;
