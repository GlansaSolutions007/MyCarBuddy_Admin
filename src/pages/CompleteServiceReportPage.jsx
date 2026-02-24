import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CompleteServiceRportLayer from "../components/CompleteServiceReportLayer";

function CompleteServiceReportPage() {
  return (
     <>
          {/* MasterLayout */}
          <MasterLayout>
            {/* Breadcrumb */}
            <Breadcrumb title='Complete Service Report' />
    
            {/* CompleteServiceReportLayer */}
            <CompleteServiceRportLayer />
          </MasterLayout>
        </>
  )
}

export default CompleteServiceReportPage;