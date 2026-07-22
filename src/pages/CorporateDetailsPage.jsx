import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CorporateDetailsLayer from "../components/CorporateDetailsLayer";

function CorporateDetailsPage() {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Corporate Details" />
        <CorporateDetailsLayer />
      </MasterLayout>
    </>
  );
}

export default CorporateDetailsPage;
