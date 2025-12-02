import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ExplanationsAddLayer from "../components/ExplanationsAddLayer";

const ExplanationsAddPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        
        <Breadcrumb title='Add Explanation' />

        {/* ExplanationsAddLayer */}
        <ExplanationsAddLayer />

      </MasterLayout>
    </>
  );
};

export default ExplanationsAddPage;
