import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import GarageWiseEarningReport from "../components/GarageWiseEarningReport";
const GarageWiseEarningReportPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Garage Wise Earning Report' />

        {/* GarageWiseEarningReport */}
        <GarageWiseEarningReport />
      </MasterLayout>
    </>
  );
};

export default GarageWiseEarningReportPage;
