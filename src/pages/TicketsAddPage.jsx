import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TicketsAddLayer from "../components/TicketsAddLayer";

const DealerAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Tickets");
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />
        <TicketsAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default DealerAddPage;
