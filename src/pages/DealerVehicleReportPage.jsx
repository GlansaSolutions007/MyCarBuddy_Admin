import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerVehicleReportLayer from "../components/DealerVehicleReportLayer";

const DealerVehicleReportPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Vehicle Report' />

        {/* DealerVehicleReport */}
        <DealerVehicleReportLayer />
      </MasterLayout>
    </>
  );
};

export default DealerVehicleReportPage;