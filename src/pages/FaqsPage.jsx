import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import FaqsLayer from "../components/FaqsLayer";

const FaqsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        
        <Breadcrumb title='FAQs Page' />

        {/* FaqsLayer */}
        <FaqsLayer />

      </MasterLayout>
    </>
  );
};

export default FaqsPage;
