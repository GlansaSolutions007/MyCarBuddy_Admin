import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanPriceListLayer from "../components/ServicePlanPriceListLayer";

const ServicePlanPriceListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Plan Prices' />

        {/* IncludesLayer */}
        <ServicePlanPriceListLayer />
      </MasterLayout>
    </>
  );
};

export default ServicePlanPriceListPage;
