import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanPriceListLayer from "../components/ServicePlanPriceListLayer";

const ServicePlanPriceListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Plan Price' />

        {/* IncludesLayer */}
        <ServicePlanPriceListLayer />
      </MasterLayout>
    </>
  );
};

export default ServicePlanPriceListPage;
