import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AreaLayer from "../components/AreaLayer";

const AreaPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Areas' />

        {/* AreaLayer */}
        <AreaLayer />
      </MasterLayout>
    </>
  );
};

export default AreaPage;
