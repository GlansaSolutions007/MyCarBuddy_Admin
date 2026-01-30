import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerReportLayer from "../components/DealerReportLayer";

const DealerReportPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dealer Report' />

        {/* DealerReportLayer */}
        <DealerReportLayer />
      </MasterLayout>
    </>
  );
};

export default DealerReportPage;