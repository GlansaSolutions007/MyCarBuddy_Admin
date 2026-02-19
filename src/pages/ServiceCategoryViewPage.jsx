import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceCategoryViewLayer from "../components/ServiceCategoryViewLayer";

const ServiceCategoryViewPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Service Category View" />
        <ServiceCategoryViewLayer />
      </MasterLayout>
    </>
  );
};

export default ServiceCategoryViewPage;
