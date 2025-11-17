import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import IncludesLayer from "../components/IncludesLayer";

const IncludesPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Service Includes' />

        {/* IncludesLayer */}
        <IncludesLayer />
      </MasterLayout>
    </>
  );
};

export default IncludesPage;
