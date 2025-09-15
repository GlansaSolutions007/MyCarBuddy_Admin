import React, { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeAddLayer from "../components/EmployeeAddLayer";

const EmployeeAddPage = () => {
  const [pageTitle, setPageTitle] = useState("Add - Employee");
  return (
    <>
      <MasterLayout>
        <Breadcrumb title={pageTitle} />
        <EmployeeAddLayer setPageTitle={setPageTitle} />
      </MasterLayout>
    </>
  );
};

export default EmployeeAddPage;
