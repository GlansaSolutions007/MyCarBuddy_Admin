import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import DealerAddLayer from "../components/DealerAddLayer";

const DealerAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Dealers");
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />
        <DealerAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default DealerAddPage;
