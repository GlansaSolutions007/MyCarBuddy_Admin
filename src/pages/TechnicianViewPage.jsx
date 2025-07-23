import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TechnicianViewLayer from "../components/TechnicianViewLayer";

const TechnicianViewPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Technician View' />

        {/* TechnicianViewLayer */}
        <TechnicianViewLayer />
      </MasterLayout>
    </>
  );
};

export default TechnicianViewPage;
