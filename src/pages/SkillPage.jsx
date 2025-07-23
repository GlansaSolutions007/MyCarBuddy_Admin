import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import SkillLayer from "../components/SkillLayer";

const SkillPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Skill' />

        {/* BookingTimeSlotLayer */}
        <SkillLayer />
      </MasterLayout>
    </>
  );
};

export default SkillPage;
