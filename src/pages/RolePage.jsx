import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import RoleLayer from "../components/RoleLayer";

const RolePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Role' />

        {/* VoiceGeneratorLayer */}
        <RoleLayer />
      </MasterLayout>
    </>
  );
};

export default RolePage;
