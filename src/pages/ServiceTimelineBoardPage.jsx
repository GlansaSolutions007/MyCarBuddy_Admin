import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServiceTimelineBoard from "../components/ServiceTimelineBoard";

const ServiceTimelineBoardPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Service Timeline Board" />
      <div className="overflow-x-auto scroll-sm pb-8">
        <ServiceTimelineBoard />
      </div>
    </MasterLayout>
  );
};

export default ServiceTimelineBoardPage;

