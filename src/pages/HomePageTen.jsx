import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DashBoardLayerTen from "../components/DashBoardLayerTen";

const HomePageTen = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title='Dashboard' />

        {/* DashBoardLayerTen */}
        <DashBoardLayerTen />
      </MasterLayout>
    </>
  );
};

export default HomePageTen;
