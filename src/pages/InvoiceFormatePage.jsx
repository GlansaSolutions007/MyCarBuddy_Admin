import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import InvoiceFormate from "../components/InvoiceFormate";
const InvoiceFormatePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Invoice Formate' />

        {/* InvoiceFormate */}
        <InvoiceFormate />
      </MasterLayout>
    </>
  );
};

export default InvoiceFormatePage;
