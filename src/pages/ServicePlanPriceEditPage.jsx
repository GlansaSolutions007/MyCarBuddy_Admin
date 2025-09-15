import { useEffect, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanPriceEditLayer from "../components/ServicePlanPriceEditLayer";

const ServicePlanPriceEditPage = () => {
  const [pageTitle, setPageTitle] = useState("Edit - Service Package Price");

  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />
        <ServicePlanPriceEditLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default ServicePlanPriceEditPage;
