import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TodayLeadsLayer from "../components/TodayLeadsLayer";

const TodayLeadsPage = () => {

  return (
    <>
      <MasterLayout>

        <Breadcrumb title="Today Assigned Lead" />

        {/* TodayLeadsLayer */}
        <TodayLeadsLayer/>

      </MasterLayout>
    </>
  );
};

export default TodayLeadsPage;