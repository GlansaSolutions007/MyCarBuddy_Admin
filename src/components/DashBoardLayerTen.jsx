import UnitCountSeven from "./child/UnitCountSeven";
import IncomeVsExpense from "./child/IncomeVsExpense";
import UsersChart from "./child/UsersChart";
import TopSuppliers from "./child/TopSuppliers";
import TopCustomer from "./child/TopCustomer";
import OverallReport from "./child/OverallReport";
import PurchaseAndSales from "./child/PurchaseAndSales";
import RecentTransactions from "./child/RecentTransactions";
import TodaysBookings from "./child/TodaysBookings";

const DashBoardLayerTen = () => {
  return (
    <div className='row gy-4'>
      {/* UnitCountSeven */}
      <UnitCountSeven />

      {/* IncomeVsExpense */}
      <IncomeVsExpense />

      {/* TodayBookingsLayer */}
      <TodaysBookings />

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
    </div>
  );
};

export default DashBoardLayerTen;
