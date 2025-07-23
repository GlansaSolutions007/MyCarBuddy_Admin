import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceSubCategories2Layer from "../components/ServiceSubCategories2Layer";

const ServiceSubCategories2Page = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Sub Categories2' />

        {/* ServiceSubCategories2Layer */}
        <ServiceSubCategories2Layer />
      </MasterLayout>
    </>
  );
};

export default ServiceSubCategories2Page;
