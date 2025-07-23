import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import VehicleFuelLayer from "../components/VehicleFuelLayer";

const FuelPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Fuel' />

        {/* VehicleFuelLayer */}
        <VehicleFuelLayer />
      </MasterLayout>
    </>
  );
};

export default FuelPage;
