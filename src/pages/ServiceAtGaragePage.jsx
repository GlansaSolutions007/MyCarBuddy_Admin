import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceAtGarageLayer from "../components/ServiceAtGarageLayer";

const ServiceAtGaragePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service At Garage' />

        {/* ServiceAtGarageLayer */}
        <ServiceAtGarageLayer />
      </MasterLayout>
    </>
  );
};

export default ServiceAtGaragePage;

