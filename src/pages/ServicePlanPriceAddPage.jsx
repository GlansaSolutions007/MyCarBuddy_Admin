import { useEffect, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanPriceAddLayer from "../components/ServicePlanPriceAddLayer";

const ServicePlanPriceAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Service Package Price");
  return (
    
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
         <Breadcrumb title={pageTitle} />
        <ServicePlanPriceAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default ServicePlanPriceAddPage;
