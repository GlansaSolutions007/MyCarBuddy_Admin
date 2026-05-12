import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceInspectionRequestLayer from "../components/ServiceInspectionRequestLayer";

const ServiceInspectionRequestPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Inspection Form" />
      <ServiceInspectionRequestLayer />
    </MasterLayout>
  );
};

export default ServiceInspectionRequestPage;
