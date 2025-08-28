import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ReasonLayer from "../components/ReasonLayer";

const ReasonPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Reason' />

        {/* AvatarLayer */}
        <ReasonLayer />
      </MasterLayout>
    </>
  );
};

export default ReasonPage;
