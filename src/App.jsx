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

import Contacts from "./pages/Contacts"
import DealerServiceP from "./pages/DealerServicePrice";
import TicketsPage from "./pages/TicketsPage";
import TicketsAddPage from "./pages/TicketsAddPage"
import RefundPage from "./pages/RefundPage";
import TelecalerAssigningPage from "./pages/TelecalerAssignBookingPage";
import TelecalerTicketsPage from "./pages/TelecalerTicketsPage";
import TelecalerBookingPage from "./pages/TelecalerBookingPage";
import TelecalerAssignTicketPage from "./pages/TelecalerAssignTicketPage";
import EmployeeTicketsPage from "./pages/EmployeeTicketsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DesignationsPage from "./pages/DesignationsPage";



function App() {
  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>

        <Route exact path='/sign-in' element={<SignInPage />} />
        <Route exact path='/' element={<SignInPage />} />
        <Route exact path='*' element={<ErrorPage />} />
        <Route exact path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route exact path='/reset-password' element={<SignInPage />} />
        <Route exact path='/reset-password/:token' element={<ResetPasswordPage />} />

        <Route element={<PrivateRoute />}>
          <Route exact path='/index' element={<HomePageTen />} />
          <Route exact path='/dashboard' element={<HomePageTen />} />
          <Route exact path='/states' element={<StatePage />} />
          <Route exact path='/cities' element={<CityPage />} />
          <Route exact path='/distributors' element={<DistributorPage />} />
          <Route exact path='/dealers' element={<DealerPage />} />
          <Route exact path='/add-dealers' element={<DealerAddPage />} />
          <Route exact path='/edit-dealers/:DealerID' element={<DealerAddPage />} />

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

          <Route exact path='/service-category' element={<ServiceCategoriesPage />} />
          <Route exact path='/service-subcategory1' element={<ServiceSubCategories1Page />} />
          <Route exact path='/service-subcategory2' element={<ServiceSubCategories2Page />} />

          <Route exact path='/service-includes' element={<IncludesPage />} />

          <Route exact path='/service-plans' element={<ServicePlanListPage />} />
          <Route exact path='/add-service-package' element={<ServicePlanAddPage />} />
          <Route exact path='/edit-service-package/:PackageID' element={<ServicePlanAddPage />} />

          <Route exact path='/service-plan-prices' element={<ServicePlanPriceListPage />} />
          <Route exact path='/add-service-plan-price' element={<ServicePlanPriceAddPage />} />
          <Route exact path='/edit-service-plan-price/:PlanPackagePriceID' element={<ServicePlanPriceEditPage />} />

          <Route path="/view-booking/:bookingId" element={<BookingViewPage />} />
          {/* <Route path="/booking/assign-technician/:bookingId" element={<AssignTechnician />} /> */}

          <Route exact path='/payments' element={<PaymentListPage />} />
          <Route exact path='/invoice-preview/:PaymentID' element={<InvoicePreviewPage />} />

          <Route exact path='/tickets' element={<TicketsPage />} />


          <Route exact path='/booking-time-slot' element={<BookingTimeSlotPage />} />

          <Route exact path='/coupons' element={<CouponPage />} />

          <Route exact path='/skills' element={<SkillPage />} />

          <Route exact path='/leave-list' element={<LeaveListPage />} />
          <Route exact path='/leave-edit/:LeaveID' element={<LeaveEditPage />} />
          <Route exact path='/notification-templates' element={<NotificationTemplatesPage />} />
          <Route exact path='/reason' element={<ReasonPage />} />
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
          <Route exact path="/view-profile" element={<ViewProfilePage />} />
          <Route exact path="/role-permission/:roleId" element={<RolePermissionPage />} />
          <Route exact path="/employees" element={<EmployeePage />} />
          <Route exact path="/add-employee" element={<EmployeeAddPage />} />
          <Route exact path="/edit-employee/:EmployeeID" element={<EmployeeAddPage />} />
          <Route exact path="/notifications" element={<NotificationPage />} />
          <Route exact path='/todays-booking' element={<TodaysBookingPage />} />
        </Route>


        {/* //extra  pages */}

        <Route exact path='/testimonials' element={<TestimonialsPage />} />
        <Route exact path='/coming-soon' element={<ComingSoonPage />} />
        <Route exact path='/access-denied' element={<AccessDeniedPage />} />
        <Route exact path='/maintenance' element={<MaintenancePage />} />
        <Route exact path='/blank-page' element={<BlankPagePage />} />


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

        <Route exact path="/contacts" element={<Contacts />} />


        <Route exact path="/DealerServicePrice" element={<DealerServiceP />} />

        <Route exact path='/add-tickets' element={<TicketsAddPage />} />

        <Route exact path='/edit-tickets/:TicketID' element={<TicketsAddPage />} />


        <Route exact path='/refunds' element={<RefundPage />} />

        <Route exact path='/telecaler-Assign-bookings' element={<TelecalerAssigningPage />} />

        <Route exact path='/telecaler-bookings' element={<TelecalerBookingPage />} />

        <Route exact path='/telecaler-tickets' element={<TelecalerTicketsPage />} />

        <Route exact path='/telecaler-assign-tickets' element={<TelecalerAssignTicketPage />} />

        <Route exact path='/employee-tickets' element={<EmployeeTicketsPage />} />

        <Route exact path='/departments' element={<DepartmentsPage />} />

        <Route exact path='/designations' element={<DesignationsPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
