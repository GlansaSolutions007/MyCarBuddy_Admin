import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanListLayer from "../components/ServicePlanListLayer";

const ServicePlanListPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Packages' />

        {/* IncludesLayer */}
        <ServicePlanListLayer />
      </MasterLayout>
    </>
  );
};

export default ServicePlanListPage;
