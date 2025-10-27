import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TelecalerAssignTicketLayer from "../components/TelecalerAssignTicketLayer";

const TelecalerAssignTicketPage = () => {
  const [pageTitle, setPageTitle] = useState("Assign Tickets");

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />

        {/* TelecalerAssignTicketLayer */}
        <TelecalerAssignTicketLayer />
      </MasterLayout>
    </>
  );
};

export default TelecalerAssignTicketPage;
