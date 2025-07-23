import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceCategoriesLayer from "../components/ServiceCategoriesLayer";

const ServiceCategoriesPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Categories' />

        {/* ServiceCategoriesLayer */}
        <ServiceCategoriesLayer />
      </MasterLayout>
    </>
  );
};

export default ServiceCategoriesPage;
