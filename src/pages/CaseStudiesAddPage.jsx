import { useEffect, useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CaseStudiesAddLayer from "../components/CaseStudiesAddLayer";

const CaseStudiesAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Service Plan");
  return (
    
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
         <Breadcrumb title={pageTitle} />
        <CaseStudiesAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default CaseStudiesAddPage;
