import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import RevenueReports from "../components/RevenueReports";

const RevenueReporstPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Revenue Reports' />

        {/* RevenueReports */}
        <RevenueReports />
      </MasterLayout>
    </>
  );
};

export default RevenueReporstPage;