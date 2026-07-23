import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import LeadDropDatesPage from "./LeadDropDatesPage";

const LeadDropDatesUpdatePage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="Leads - Drop Dates Update" />
      <LeadDropDatesPage />
    </MasterLayout>
  );
};

export default LeadDropDatesUpdatePage;

