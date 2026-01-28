import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerPaymentsLayer from "../components/DealerPaymentsLayer";

const DealerPaymentsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dealer Expenditures' />

        {/* DealerPaymentsLayer */}
        <DealerPaymentsLayer />
      </MasterLayout>
    </>
  );
};

export default DealerPaymentsPage;