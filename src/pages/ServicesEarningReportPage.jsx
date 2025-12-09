import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicesEarningReport from "../components/ServicesEarningReport";
const ServicesEarningReportPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service / Spare Part Earnings Report
' />

        {/* ServicesEarningReport */}
        <ServicesEarningReport />
      </MasterLayout>
    </>
  );
};

export default ServicesEarningReportPage;
