import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CustomerAddLayer from "../components/CustomerAddLayer"; 

const CustomerAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Customers");
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title={pageTitle} />
        <CustomerAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default CustomerAddPage;
