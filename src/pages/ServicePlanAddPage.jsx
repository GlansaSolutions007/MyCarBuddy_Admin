import { useEffect, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ServicePlanAddLayer from "../components/ServicePlanAddLayer";

const ServicePlanAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Service Plan");
  return (
    
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
         <Breadcrumb title={pageTitle} />
        <ServicePlanAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default ServicePlanAddPage;
