import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import PaymentListLayer from "../components/PaymentListLayer";

const PaymentListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Payments' />

        {/* IncludesLayer */}
        <PaymentListLayer />
      </MasterLayout>
    </>
  );
};

export default PaymentListPage;
