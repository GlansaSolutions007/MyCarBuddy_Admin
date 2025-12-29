import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import InvoiceViewLayer from "../components/InvoiceViewLayer";

const InvoiceViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Invoice View' />

        {/* InvoiceViewLayer */}
        <InvoiceViewLayer />
      </MasterLayout>
    </>
  );
};

export default InvoiceViewPage;

