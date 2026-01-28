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

const DashBoardLayerTen = () => {
  const role = localStorage.getItem("role");

  return (
    <div className="row gy-4">
      {/* UnitCountSeven */}
      {role !== "Dealer" && <UnitCountSeven />}
      {role === "Dealer" && <DealerDashboardLayer />}

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
