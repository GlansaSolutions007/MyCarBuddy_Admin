import React from "react";
import Breadcrumb from "../components/Breadcrumb";
import PermissionLayer from "../components/PermissionLayer";
import MasterLayout from "../masterLayout/MasterLayout";

const PermissionPage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Permission Pages" />
      <PermissionLayer />
    </MasterLayout>
  );
};

export default PermissionPage;
