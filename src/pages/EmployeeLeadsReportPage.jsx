import { useParams, useLocation } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import EmployeeLeadsReportLayer from "../components/EmployeeLeadsReportLayer";

const EmployeeLeadsReportPage = () => {
  const { employeeId } = useParams();
  const location = useLocation();

  // Parse query parameters from URL search
  const searchParams = new URLSearchParams(location.search);
  const initialFromDate = searchParams.get("fromDate") || "";
  const initialToDate = searchParams.get("toDate") || "";

  return (
    <>
      <MasterLayout>

        <Breadcrumb title="Employee Lead Report" />

        {/* EmployeeLeadsReportLayer */}
        <EmployeeLeadsReportLayer
          employeeId={employeeId}
          initialFromDate={initialFromDate}
          initialToDate={initialToDate}
        />

      </MasterLayout>
    </>
  );
};

export default EmployeeLeadsReportPage;

