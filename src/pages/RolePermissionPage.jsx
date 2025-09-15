import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import RolePermissionLayer from "../components/RolePermissionLayer";

const RolePage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Role Permission' />

        {/* VoiceGeneratorLayer */}
        <RolePermissionLayer />
      </MasterLayout>
    </>
  );
};

export default RolePage;
