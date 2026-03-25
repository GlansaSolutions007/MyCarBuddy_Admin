import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BasicInformationLayer from "../components/BasicInformationLayer";

const BasicInformationPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Customer Details' />

        {/* BasicInformationLayer */}
        <BasicInformationLayer />
      </MasterLayout>
    </>
  );
};

export default BasicInformationPage;

