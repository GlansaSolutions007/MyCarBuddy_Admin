import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AddLeadLayer from "../components/AddLeadLayer";

const AddLeadPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Add Lead' />

        {/* AddLeadLayer */}
        <AddLeadLayer />
      </MasterLayout>
    </>
  );
};

export default AddLeadPage;


AddLeadLayer