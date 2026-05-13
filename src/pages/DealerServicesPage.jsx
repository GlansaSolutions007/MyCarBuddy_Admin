import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerServicesLayer from "../components/DealerServicesLayer";

const DealerServicesPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='All Services' />

        {/* DealerServicesLayer */}
        <DealerServicesLayer />
      </MasterLayout>
    </>
  );
};

export default DealerServicesPage;
