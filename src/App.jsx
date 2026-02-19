import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MarketplaceDetailsPage from "./pages/MarketplaceDetailsPage";
import MarketplacePage from "./pages/MarketplacePage";
import NotificationAlertPage from "./pages/NotificationAlertPage";
import NotificationPage from "./pages/NotificationPage";
import SignInPage from "./pages/SignInPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import HomePageTen from "./pages/HomePageTen";
import BlogPage from "./pages/BlogPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import AddBlogPage from "./pages/AddBlogPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlankPagePage from "./pages/BlankPagePage";
import TodaysBookingPage from "./pages/TodaysBookingPage";

//my pages

import PrivateRoute from "./components/PrivateRoute";
import StatePage from "./pages/StatePage";
import CityPage from "./pages/CityPage";
import DistributorPage from "./pages/DistributorPage";
import DealerPage from "./pages/DealerPage";
import DealerAddPage from "./pages/DealerAddPage";
import DealerViewPage from "./pages/DealerViewPage";
import TechnicianPage from "./pages/TechnicianPage";
import TechnicianAddPage from "./pages/TechnicianAddPage";
import TechnicianViewPage from "./pages/TechnicianViewPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FuelPage from "./pages/FuelPage";
import VehicleModelPage from "./pages/VehicleModelPage";
import VehicleBrandPage from "./pages/VehicleBrandPage";
import CustomerPage from "./pages/CustomerPage";
import CustomerAddPage from "./pages/CustomerAddPage";
import CustomerViewPage from "./pages/CustomerViewPage";
import BookingPage from "./pages/BookingPage";
import BookingViewPage from "./pages/BookingViewPage";
import ServiceCategoriesPage from "./pages/ServiceCategoriesPage";
import ServiceSubCategories1Page from "./pages/ServiceSubCategories1Page";
import ServiceSubCategories2Page from "./pages/ServiceSubCategories2Page";
import IncludesPage from "./pages/IncludesPage";
import ServicePlanListPage from "./pages/ServicePlanListPage";
import ServicePlanAddPage from "./pages/ServicePlanAddPage";
import ServicePlanPriceListPage from "./pages/ServicePlanPriceListPage";
import ServicePlanPriceAddPage from "./pages/ServicePlanPriceAddPage";
import ServicePlanPriceEditPage from "./pages/ServicePlanPriceEditPage";
import PaymentListPage from "./pages/PaymentListPage";
import InvoicePreviewPage from "./pages/InvoicePreviewPage";
import InvoiceViewPage from "./pages/InvoiceViewPage";
import BookingTimeSlotPage from "./pages/BookingTimeSlotPage";
import CouponPage from "./pages/CouponPage";
import SkillPage from "./pages/SkillPage";
import LeaveListPage from "./pages/LeaveListPage";
import LeaveEditPage from "./pages/LeaveEditPage";
import NotificationTemplatesPage from "./pages/NotificationTemplatesPage";
import ReasonPage from "./pages/ReasonPage";
import PolicyPage from "./pages/PolicyPage";
import SeoPage from "./pages/SeoPage";
import SeoAddPage from "./pages/SeoAddPage";
import RolePage from "./pages/RolePage";
import RolePermissionPage from "./pages/RolePermissionPage";
import PermissionPage from "./pages/PermissionPage";
import EmployeePage from "./pages/EmployeePage";
import EmployeeAddPage from "./pages/EmployeeAddPage";
import EmployeeViewPage from "./pages/EmployeeViewPage";

import Contacts from "./pages/Contacts"
import DealerServiceP from "./pages/DealerServicePrice";
import TicketsPage from "./pages/TicketsPage";
import TicketInnerPage from "./pages/TicketInnerPage";
import TicketsAddPage from "./pages/TicketsAddPage"
import RefundPage from "./pages/RefundPage";
import TelecalerAssigningPage from "./pages/TelecalerAssignBookingPage";
import TelecalerTicketsPage from "./pages/TelecalerTicketsPage";
import TelecalerBookingPage from "./pages/TelecalerBookingPage";
import TelecalerAssignTicketPage from "./pages/TelecalerAssignTicketPage";
import EmployeeTicketsPage from "./pages/EmployeeTicketsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DesignationsPage from "./pages/DesignationsPage";
import SupervisorBookingPage from "./pages/SupervisorBookingPage";
import SupervisorAssignBookingPage from "./pages/SupervisorAssignBookingPage";
import DeptEmployeePage from "./pages/DeptEmployeePage";
import EmpTicketViewPage from "./pages/EmpTicketViewPage";
import DeptWiseTicketReportPage from "./pages/DeptWiseTicketReportPage";
import LeadsPage from "./pages/LeadsPage";
import AddLeadPage from "./pages/AddLeadPage";
import OrganicLeadsPage from "./pages/OrganicLeadsPage";
import FaqsPage from "./pages/FaqsPage";
import FaqsAddPage from "./pages/FaqsAddPage";
import LeadsAssignPage from "./pages/LeadsAssignPage";
import LeadViewPage from "./pages/LeadViewPage";
import LeadViewOnlyPage from "./pages/LeadViewOnlyPage";
import LeadReportsPage from "./pages/LeadReportsPage";
import BookingReportPage from "./pages/BookingReportPage"
import EmployeeLeadsReportPage from "./pages/EmployeeLeadsReportPage";
import TodayLeadsPage from "./pages/TodayLeadsPage";
import BookServicesPage from "./pages/BookSevicesPage";
import ExplanationsPage from "./pages/ExplanationsPage";
import ExplanationsAddPage from "./pages/ExplanationsAddPage";
import ServicesEarningReportPage from "./pages/ServicesEarningReportPage";
import ClosedLeadsPage from "./pages/ClosedLeadsPage";
import RevenueReporstPage from "./pages/RevenueReportsPage";
import BookingReportsSortingPage from "./pages/BookingReportsSortingPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import CaseStudiesAddPage from "./pages/CaseStudiesAddPage";
import CompanyInformationPage from "./pages/CompanyInformationPage";
import ExpenditurePage from "./pages/ExpenditurePage";
import ExpenditureCategoryPage from "./pages/ExpenditureCategoryPage";
import AreaPage from "./pages/AreaPage";
import DealerBookingsViewPage from "./pages/DealerBookingsViewPage";
import AssignSupervisorAreaPage from "./pages/AssignSupervisorAreaPage";
import DealerPaymentsPage from "./pages/DealerPaymentsPage";
import DealerReportPage from "./pages/DealerRepportPage";
import NoInternetModal from "./components/NoInternetModal";

function App() {
  return (
    <BrowserRouter>
<NoInternetModal />
      <RouteScrollToTop />
      <Routes>

        <Route exact path='/sign-in' element={<SignInPage />} />
        <Route exact path='/' element={<SignInPage />} />
        <Route exact path='*' element={<ErrorPage />} />
        <Route exact path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route exact path='/reset-password' element={<SignInPage />} />
        <Route exact path='/reset-password/:token' element={<ResetPasswordPage />} />

        <Route exact path='/index' element={<HomePageTen />} />
        <Route exact path='/dashboard' element={<HomePageTen />} />
        <Route element={<PrivateRoute />}>

          <Route exact path='/states' element={<StatePage />} />
          <Route exact path='/cities' element={<CityPage />} />
          <Route exact path='/distributors' element={<DistributorPage />} />
          <Route exact path='/dealers' element={<DealerPage />} />
          <Route exact path='/add-dealers' element={<DealerAddPage />} />
          <Route exact path='/edit-dealers/:DealerID' element={<DealerAddPage />} />
          <Route exact path='/view-dealer/:DealerID' element={<DealerViewPage />} />

          <Route exact path='/technicians' element={<TechnicianPage />} />
          <Route exact path='/technicians/add' element={<TechnicianAddPage />} />
          <Route exact path='/edit-technicians/:TechnicianID' element={<TechnicianAddPage />} />
          <Route exact path='/view-technician/:TechnicianID' element={<TechnicianViewPage />} />

          <Route exact path='/vehicle-fuel' element={<FuelPage />} />
          <Route exact path='/vehicle-model' element={<VehicleModelPage />} />
          <Route exact path='/vehicle-brand' element={<VehicleBrandPage />} />

          <Route exact path='/customers' element={<CustomerPage />} />
          <Route exact path='/edit-customer/:CustomerID' element={<CustomerAddPage />} />
          <Route exact path='/add-customer' element={<CustomerAddPage />} />
          <Route exact path='/view-customer/:CustomerID' element={<CustomerViewPage />} />

          <Route exact path='/bookings' element={<BookingPage />} />
          <Route exact path='/edit-bookings/:BookingID' element={<BookingPage />} />
          <Route exact path='/edit-bookings/:Status' element={<BookingPage />} />

          <Route exact path='/service-category' element={<ServiceCategoriesPage />} />
          <Route exact path='/service-subcategory1' element={<ServiceSubCategories1Page />} />
          <Route exact path='/service-subcategory2' element={<ServiceSubCategories2Page />} />

          <Route exact path='/service-includes' element={<IncludesPage />} />

          <Route exact path='/service-plans' element={<ServicePlanListPage />} />
          <Route exact path='/add-service-package' element={<ServicePlanAddPage />} />
          <Route exact path='/edit-service-package/:PackageID' element={<ServicePlanAddPage />} />
          <Route exact path='/edit-case-studies/:PackageID' element={<CaseStudiesAddPage />} />
          <Route exact path='/add-case-studies' element={<CaseStudiesAddPage />} />

          <Route exact path='/service-plan-prices' element={<ServicePlanPriceListPage />} />
          <Route exact path='/add-service-plan-price' element={<ServicePlanPriceAddPage />} />
          <Route exact path='/edit-service-plan-price/:PlanPackagePriceID' element={<ServicePlanPriceEditPage />} />

          <Route path="/booking-view/:bookingId" element={<BookingViewPage />} />
          {/* <Route path="/booking/assign-technician/:bookingId" element={<AssignTechnician />} /> */}

          <Route exact path='/payments' element={<PaymentListPage />} />
          <Route exact path='/invoice-preview/:PaymentID' element={<InvoicePreviewPage />} />
          <Route exact path='/invoice-view/:bookingId' element={<InvoiceViewPage />} />

          <Route exact path='/tickets' element={<TicketsPage />} />
          <Route exact path='/tickets/:ticketId' element={<TicketInnerPage />} />

          <Route exact path='/booking-time-slot' element={<BookingTimeSlotPage />} />

          <Route exact path='/coupons' element={<CouponPage />} />

          <Route exact path='/skills' element={<SkillPage />} />

          <Route exact path='/leave-list' element={<LeaveListPage />} />
          <Route exact path='/leave-edit/:LeaveID' element={<LeaveEditPage />} />
          <Route exact path='/notification-templates' element={<NotificationTemplatesPage />} />
          <Route exact path='/reasons' element={<ReasonPage />} />
          <Route exact path='/policy' element={<PolicyPage />} />
          <Route exact path='/seo' element={<SeoPage />} />
          <Route exact path='/add-seo' element={<SeoAddPage />} />
          <Route exact path='/edit-seo/:seoid' element={<SeoAddPage />} />
          <Route exact path="/blog" element={<BlogPage />} />
          <Route exact path="/blog-details/:BlogID" element={<BlogDetailsPage />} />
          <Route exact path="/add-blog" element={<AddBlogPage />} />
          <Route exact path="/edit-blog/:BlogID" element={<AddBlogPage />} />
          <Route exact path="/roles" element={<RolePage />} />
          <Route exact path="/permission-pages" element={<PermissionPage />} />
          <Route exact path="/profile-view" element={<ViewProfilePage />} />
          <Route exact path="/role-permission/:roleId" element={<RolePermissionPage />} />
          <Route exact path="/employees" element={<EmployeePage />} />
          <Route exact path="/add-employee" element={<EmployeeAddPage />} />
          <Route exact path="/edit-employee/:EmployeeID" element={<EmployeeAddPage />} />
          <Route exact path="/view-employee/:EmployeeID" element={<EmployeeViewPage />} />
          <Route exact path="/notifications" element={<NotificationPage />} />
          <Route exact path='/todays-booking' element={<TodaysBookingPage />} />
          <Route exact path='/ticket-reports' element={<DeptWiseTicketReportPage />} />
          <Route exact path='/dept-employee-reports/:deptId' element={<DeptEmployeePage />} />
          <Route exact path='/view-employee-report/:id' element={<EmpTicketViewPage />} />
          <Route exact path='/leads' element={<LeadsPage />} />
          <Route exact path='/create-lead' element={<AddLeadPage />} />
          <Route exact path='/organic-leads' element={<OrganicLeadsPage />} />
          <Route path="/organic-leads/:status" element={<OrganicLeadsPage />} />
          <Route exact path='/departments' element={<DepartmentsPage />} />
          <Route exact path="/contacts" element={<Contacts />} />
          <Route exact path="/dealer-service-price" element={<DealerServiceP />} />
          <Route exact path='/add-tickets' element={<TicketsAddPage />} />
          <Route exact path='/edit-tickets/:TicketID' element={<TicketsAddPage />} />
          <Route exact path='/refunds' element={<RefundPage />} />
          <Route exact path='/telecaler-Assign-bookings' element={<TelecalerAssigningPage />} />
          <Route exact path='/telecaler-bookings' element={<TelecalerBookingPage />} />
          <Route exact path='/telecaler-tickets' element={<TelecalerTicketsPage />} />
          <Route exact path='/assign-tickets' element={<TelecalerAssignTicketPage />} />
          <Route exact path='/employee-tickets' element={<EmployeeTicketsPage />} />
          <Route exact path='/designations' element={<DesignationsPage />} />
          <Route exact path='/supervisor-bookings' element={<SupervisorBookingPage />} />
          <Route exact path='/supervisor-assign-bookings' element={<SupervisorAssignBookingPage />} />
          <Route exact path='/faqs' element={<FaqsPage />} />
          <Route exact path='/add-faqs' element={<FaqsAddPage />} />
          <Route exact path='/assign-leads' element={<LeadsAssignPage />} />
          <Route exact path='/lead-view/:leadId' element={<LeadViewPage />} />
          <Route exact path='/lead-view-only/:leadId' element={<LeadViewOnlyPage />} />
          <Route exact path='/lead-reports' element={<LeadReportsPage />} />
          <Route exact path="/emp-leads-report/:employeeId" element={<EmployeeLeadsReportPage />} />
          <Route exact path="/todays-lead" element={<TodayLeadsPage />} />
          <Route exact path="/closed-leads" element={<ClosedLeadsPage />} />
          <Route exact path="/book-service" element={<BookServicesPage />} />
          <Route exact path="/book-service/:Id" element={<BookServicesPage />} />
          <Route exact path='/booking-reports' element={<BookingReportPage/>} />
          <Route exact path='/explanations' element={<ExplanationsPage/>} />
          <Route exact path='/add-explanations' element={<ExplanationsAddPage/>} />
          <Route exact path='/services-earning-report' element={<ServicesEarningReportPage/>} />
          <Route exact path='/revenue-reports' element={<RevenueReporstPage/>} />
          <Route exact path='/case-studies' element={<CaseStudiesPage/>} />
          <Route exact path='/company-information' element={<CompanyInformationPage/>} />
          <Route exact path='/expenditures' element={<ExpenditurePage/>} />
          <Route exact path='/expenditure-cat' element={<ExpenditureCategoryPage/>} />
          <Route exact path='/areas' element={<AreaPage/>} />
           <Route exact path='/assign-area' element={<AssignSupervisorAreaPage/>} />
          <Route exact path='/dealer-booking-view/:Id' element={<DealerBookingsViewPage/>} />
          <Route exact path='/dealer-expenditure' element={<DealerPaymentsPage/>} />
          <Route exact path='/dealer-report' element={<DealerReportPage/>} />
          
        </Route>

        {/* //extra  pages */}

        <Route exact path='/testimonials' element={<TestimonialsPage />} />
        <Route exact path='/coming-soon' element={<ComingSoonPage />} />
        <Route exact path='/access-denied' element={<AccessDeniedPage />} />
        <Route exact path='/maintenance' element={<MaintenancePage />} />
        <Route exact path='/blank-page' element={<BlankPagePage />} />
        <Route path="/booking-sorting-page" element={<BookingReportsSortingPage />} />
        
        <Route
          exact
          path='/marketplace-details'
          element={<MarketplaceDetailsPage />}
        />
        <Route exact path='/marketplace' element={<MarketplacePage />} />
        <Route
          exact
          path='/notification-alert'
          element={<NotificationAlertPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
