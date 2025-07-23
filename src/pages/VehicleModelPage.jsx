import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import VehicleModelLayer from "../components/VehicleModelLayer";

const VehicleModelPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Vehicle Model' />

        {/* vehicleModelLayer */}
        <VehicleModelLayer />
      </MasterLayout>
    </>
  );
};

export default VehicleModelPage;
