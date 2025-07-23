import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceSubCategories1Layer from "../components/ServiceSubCategories1Layer";

const ServiceSubCategories1Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Sub Categories1' />

        {/* ServiceSubCategories1Layer */}
        <ServiceSubCategories1Layer />
      </MasterLayout>
    </>
  );
};

export default ServiceSubCategories1Page;
