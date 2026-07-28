import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceAtHomeLayer from "../components/ServiceAtHomeLayer";

const ServiceAtHomePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service At Home' />

        {/* ServiceAtHomeLayer */}
        <ServiceAtHomeLayer />
      </MasterLayout>
    </>
  );
};

export default ServiceAtHomePage;

