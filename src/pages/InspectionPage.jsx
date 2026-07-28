import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import InspectionLayer from "../components/InspectionLayer"

const InspectionPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Inspection' />

        {/* InspectionLayer */}
        <InspectionLayer />
      </MasterLayout>
    </>
  );
};

export default InspectionPage;

