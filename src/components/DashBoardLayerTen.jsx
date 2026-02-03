import UnitCountSeven from "./child/UnitCountSeven";
import IncomeVsExpense from "./child/IncomeVsExpense";
import UsersChart from "./child/UsersChart";
import TopSuppliers from "./child/TopSuppliers";
import TopCustomer from "./child/TopCustomer";
import OverallReport from "./child/OverallReport";
import PurchaseAndSales from "./child/PurchaseAndSales";
import RecentTransactions from "./child/RecentTransactions";
import TodaysBookings from "./child/TodaysBookings";
import RevenueReportCharts from "./child/RevenueReportCharts";
import DealerDashboardLayer from "./DealerDashboardLayer";
import SupportDashboardLayer from "./SupportDashboardLayer";

const DashBoardLayerTen = () => {
  const role = localStorage.getItem("role");
  const employeeDataRaw = localStorage.getItem("employeeData");
  let employeeData = null;
  try {
    employeeData = employeeDataRaw ? JSON.parse(employeeDataRaw) : null;
  } catch (err) {
    console.warn("Failed to parse employeeData:", err);
    employeeData = null;
  }
  const departmentName = Array.isArray(employeeData)
    ? (employeeData[0]?.DepartmentName || employeeData[0]?.departmentName || "").trim()
    : (employeeData?.DepartmentName || employeeData?.departmentName || "").trim();

  return (
    <div className="row gy-4">
      {/* UnitCountSeven */}
      {role !== "Dealer" && departmentName !== "Support" && <UnitCountSeven />}
      {role === "Dealer" && <DealerDashboardLayer />}
      {departmentName === "Support" && <SupportDashboardLayer />}

      {role === "Admin" && (
        <>
          {/* RevenueReportCharts */}
          <RevenueReportCharts />

          {/* IncomeVsExpense */}
          {/* <IncomeVsExpense /> */}

          {/* UsersChart */}
          {/* <UsersChart /> */}

          {/* TopSuppliers */}
          {/* <TopSuppliers /> */}

          {/* TopCustomer */}
          <TopCustomer />

          {/* OverallReport */}
          {/* <OverallReport /> */}

          {/* PurchaseAndSales */}
          {/* <PurchaseAndSales /> */}

          {/* RecentTransactions */}
          <RecentTransactions />

          {/* TodayBookingsLayer */}
          <TodaysBookings />
        </>
      )}
    </div>
  );
};

export default DashBoardLayerTen;
