import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import FaqsAddLayer from "../components/FaqsAddLayer";

const FaqsAddPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        
        <Breadcrumb title='Add FAQs' />

        {/* FaqsAddLayer */}
        <FaqsAddLayer />

      </MasterLayout>
    </>
  );
};

export default FaqsAddPage;
