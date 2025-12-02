import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ExplanationsLayer from "../components/ExplanationsLayer";

const ExplanationsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        
        <Breadcrumb title='Explanations' />

        {/* ExplanationsLayer */}
        <ExplanationsLayer />

      </MasterLayout>
    </>
  );
};

export default ExplanationsPage;
