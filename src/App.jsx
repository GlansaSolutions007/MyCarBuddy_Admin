import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePageOne from "./pages/HomePageOne";
import HomePageTwo from "./pages/HomePageTwo";
import HomePageThree from "./pages/HomePageThree";
import HomePageFour from "./pages/HomePageFour";
import HomePageFive from "./pages/HomePageFive";
import HomePageSix from "./pages/HomePageSix";
import HomePageSeven from "./pages/HomePageSeven";
import EmailPage from "./pages/EmailPage";
import AddUserPage from "./pages/AddUserPage";
import AlertPage from "./pages/AlertPage";
import AssignRolePage from "./pages/AssignRolePage";
import AvatarPage from "./pages/AvatarPage";
import BadgesPage from "./pages/BadgesPage";
import ButtonPage from "./pages/ButtonPage";
import CalendarMainPage from "./pages/CalendarMainPage";
import CardPage from "./pages/CardPage";
import CarouselPage from "./pages/CarouselPage";
import ChatMessagePage from "./pages/ChatMessagePage";
import ChatProfilePage from "./pages/ChatProfilePage";
import CodeGeneratorNewPage from "./pages/CodeGeneratorNewPage";
import CodeGeneratorPage from "./pages/CodeGeneratorPage";
import ColorsPage from "./pages/ColorsPage";
import ColumnChartPage from "./pages/ColumnChartPage";
import CompanyPage from "./pages/CompanyPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import DropdownPage from "./pages/DropdownPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FormLayoutPage from "./pages/FormLayoutPage";
import FormValidationPage from "./pages/FormValidationPage";
import FormPage from "./pages/FormPage";
import GalleryPage from "./pages/GalleryPage";
import ImageGeneratorPage from "./pages/ImageGeneratorPage";
import ImageUploadPage from "./pages/ImageUploadPage";
import InvoiceAddPage from "./pages/InvoiceAddPage";
import InvoiceEditPage from "./pages/InvoiceEditPage";
import InvoiceListPage from "./pages/InvoiceListPage";

import KanbanPage from "./pages/KanbanPage";
import LanguagePage from "./pages/LanguagePage";
import LineChartPage from "./pages/LineChartPage";
import ListPage from "./pages/ListPage";
import MarketplaceDetailsPage from "./pages/MarketplaceDetailsPage";
import MarketplacePage from "./pages/MarketplacePage";
import NotificationAlertPage from "./pages/NotificationAlertPage";
import NotificationPage from "./pages/NotificationPage";
import PaginationPage from "./pages/PaginationPage";
import PaymentGatewayPage from "./pages/PaymentGatewayPage";
import PieChartPage from "./pages/PieChartPage";
import PortfolioPage from "./pages/PortfolioPage";
import PricingPage from "./pages/PricingPage";
import ProgressPage from "./pages/ProgressPage";
import RadioPage from "./pages/RadioPage";
import RoleAccessPage from "./pages/RoleAccessPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import StarRatingPage from "./pages/StarRatingPage";
import StarredPage from "./pages/StarredPage";
import SwitchPage from "./pages/SwitchPage";
import TableBasicPage from "./pages/TableBasicPage";
import TableDataPage from "./pages/TableDataPage";
import TabsPage from "./pages/TabsPage";
import TagsPage from "./pages/TagsPage";
import TermsConditionPage from "./pages/TermsConditionPage";
import TextGeneratorPage from "./pages/TextGeneratorPage";
import ThemePage from "./pages/ThemePage";
import TooltipPage from "./pages/TooltipPage";
import TypographyPage from "./pages/TypographyPage";
import UsersGridPage from "./pages/UsersGridPage";
import UsersListPage from "./pages/UsersListPage";
import ViewDetailsPage from "./pages/ViewDetailsPage";
import VideoGeneratorPage from "./pages/VideoGeneratorPage";
import VideosPage from "./pages/VideosPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import VoiceGeneratorPage from "./pages/VoiceGeneratorPage";
import WalletPage from "./pages/WalletPage";
import WidgetsPage from "./pages/WidgetsPage";
import WizardPage from "./pages/WizardPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import TextGeneratorNewPage from "./pages/TextGeneratorNewPage";
import HomePageEight from "./pages/HomePageEight";
import HomePageNine from "./pages/HomePageNine";
import HomePageTen from "./pages/HomePageTen";
import HomePageEleven from "./pages/HomePageEleven";
import GalleryGridPage from "./pages/GalleryGridPage";
import GalleryMasonryPage from "./pages/GalleryMasonryPage";
import GalleryHoverPage from "./pages/GalleryHoverPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailsPage from "./pages/BlogDetailsPage";
import AddBlogPage from "./pages/AddBlogPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlankPagePage from "./pages/BlankPagePage";



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
import BookingAssignDealer from "./pages/BookingAssignDealer"


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
          <Route exact path="/booking-dealer-assign/:bookingId" element={<BookingAssignDealer />} />
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

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
