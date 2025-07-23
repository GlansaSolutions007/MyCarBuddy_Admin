import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import VehicleBrandlLayer from "../components/VehicleBrandLayer";

const VehicleBrandPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Vehicle Brand' />

        {/* VehicleModelLayer */}
        <VehicleBrandlLayer />
      </MasterLayout>
    </>
  );
};

export default VehicleBrandPage;
