import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceIntakeListLayer from "../components/ServiceIntakeListLayer";

const ServiceIntakeListPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Inspection List" />
      <ServiceIntakeListLayer />
    </MasterLayout>
  );
};

export default ServiceIntakeListPage;
