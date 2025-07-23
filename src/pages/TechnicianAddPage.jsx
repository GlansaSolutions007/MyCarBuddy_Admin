import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TechniciansAddLayer from "../components/TechniciansAddLayer";

const TechnicianAddPage = () => {
const [pageTitle, setPageTitle] = useState("Add - Technicians");
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />

        {/* TechniciansAddLayer */}
        <TechniciansAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default TechnicianAddPage;
