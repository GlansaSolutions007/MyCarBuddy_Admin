import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CompanyInformationLayer from "../components/CompanyInformationLayer";

function CompanyInformationPage() {
  return (
     <>
          {/* MasterLayout */}
          <MasterLayout>
            {/* Breadcrumb */}
            <Breadcrumb title='Company Information' />
    
            {/* ContactsLayer */}
            <CompanyInformationLayer />
          </MasterLayout>
        </>
  )
}

export default CompanyInformationPage;