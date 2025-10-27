import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeTicketViewLayer from "../components/EmployeeTicketViewLayer";

const EmployeeTicketsPage = () => {
  const [pageTitle, setPageTitle] = useState("My Tickets");

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />

        {/* EmployeeTicketViewLayer */}
        <EmployeeTicketViewLayer />
      </MasterLayout>
    </>
  );
};

export default EmployeeTicketsPage;
