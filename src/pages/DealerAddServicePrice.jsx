import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AddDealerServicePriceLayer from "../components/AddDealerServicePriceLayer";
import { useState } from "react";

const DealerServicePricePage = () => {
    const [pageTitle, setPageTitle] = useState("Add -Dealer Service Price");
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />

        {/* VoiceGeneratorLayer */}
        <AddDealerServicePriceLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default DealerServicePricePage;
