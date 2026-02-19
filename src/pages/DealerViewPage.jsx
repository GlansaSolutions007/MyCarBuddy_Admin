import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerViewLayer from "../components/DealerViewLayer";

const DealerViewPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Dealer View" />
        <DealerViewLayer />
      </MasterLayout>
    </>
  );
};

export default DealerViewPage;
