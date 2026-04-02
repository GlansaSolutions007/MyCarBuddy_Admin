import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ForwardLeadsLayer from "../components/ForwardLeadsLayer";

const ForwardLeadsPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Forward Leads' />

        {/* ForwardLeadsLayer */}
        <ForwardLeadsLayer />
      </MasterLayout>
    </>
  );
};

export default ForwardLeadsPage;
