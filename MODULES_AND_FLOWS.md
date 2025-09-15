# Modules & Flows – MyCarBuddy Admin

This guide maps each feature module to its Pages, Components (Layers), Routes, and API calls, with the typical user flow.

Legend:
- Page = wrapper using `MasterLayout` + `Breadcrumb`
- Layer = main component implementing logic/UI
- Route = path in `src/App.jsx`
- API = endpoints from `API_REFERENCE.md`

## Dashboard
- Page: `HomePageTen.jsx`
- Layer: `DashBoardLayerTen.jsx`
- Route: `/dashboard`
- Flow: Load dashboard metrics -> render cards, charts, tables.

## Roles & Permissions
- Page: `RolePage.jsx`, `RolePermissionPage.jsx`
- Layer: `RoleLayer.jsx`, `RolePermissionLayer.jsx`
- Routes: `/roles`, `/role-permission/:roleId`
- APIs: Roles, Roles/:id, Roles permissions
- Flow: View roles -> add/edit -> open permission page -> save permissions.

## Employees (Admin Users)
- Pages: `EmployeePage.jsx`, `EmployeeAddPage.jsx`
- Layers: `EmployeeLayer.jsx`, `EmployeeAddLayer.jsx`
- Routes: `/employees`, `/add-employee`, `/edit-employee/:EmployeeID`
- APIs: Employees, Employees/:id, Roles
- Flow: List -> search -> add/edit -> upload profile image -> save -> return to list.

## States & Cities
- Pages: `StatePage.jsx`, `CityPage.jsx`
- Layers: `StateLayer.jsx`, `CityLayer.jsx`
- Routes: `/states`, `/cities`
- APIs: State, City
- Flow: List -> add/edit -> toggle status.

## Distributors & Dealers
- Pages: `DistributorPage.jsx`, `DealerPage.jsx`, `DealerAddPage.jsx`
- Layers: `DistributorLayer.jsx`, `DealerLayer.jsx`, `DealerAddLayer.jsx`
- Routes: `/distributors`, `/dealers`, `/add-dealers`, `/edit-dealers/:DealerID`
- APIs: Distributor, Dealer (multipart for images)
- Flow: View lists -> add/edit dealer -> select state/city -> upload image -> save.

## Technicians
- Pages: `TechnicianPage.jsx`, `TechnicianAddPage.jsx`, `TechnicianViewPage.jsx`
- Layers: `TechnicianLayer.jsx`, `TechniciansAddLayer.jsx`, `TechnicianViewLayer.jsx`
- Routes: `/technicians`, `/technicians/add`, `/edit-technicians/:TechnicianID`, `/view-technician/:TechnicianID`
- APIs: Technicians, Technicians/:id, TechniciansDetails
- Flow: Manage technicians (profile, skills, documents) -> upload docs -> save -> view profile.

## Vehicles (Fuel, Brand, Model)
- Pages: `FuelPage.jsx`, `VehicleBrandPage.jsx`, `VehicleModelPage.jsx`
- Layers: `VehicleFuelLayer.jsx`, `VehicleBrandLayer.jsx`, `VehicleModelLayer.jsx`
- Routes: `/vehicle-fuel`, `/vehicle-brand`, `/vehicle-model`
- APIs: VehicleFuel, VehicleBrand (multipart), VehicleModel
- Flow: Add/update fuel types, brands (with images), models.

## Customers
- Pages: `CustomerPage.jsx`, `CustomerAddPage.jsx`, `CustomerViewPage.jsx`
- Layers: `CustomerLayer.jsx`, `CustomerAddLayer.jsx`, `CustomerViewLayer.jsx`
- Routes: `/customers`, `/add-customer`, `/edit-customer/:CustomerID`, `/view-customer/:CustomerID`
- APIs: Customer, Customer/:id
- Flow: List -> add/edit -> view details with map embed.

## Bookings
- Pages: `BookingPage.jsx`, `BookingViewPage.jsx`
- Layers: `BookingLayer.jsx`, `BookingViewLayer.jsx`
- Routes: `/bookings`, `/view-booking/:bookingId`
- APIs: Bookings, Bookings/assign-technician, TechniciansDetails
- Flow: Poll bookings every 15s -> view booking -> assign technician -> status updates.

## Services (Categories, Subcategories, Includes, Plans, Prices)
- Pages: `ServiceCategoriesPage.jsx`, `ServiceSubCategories1Page.jsx`, `ServiceSubCategories2Page.jsx`, `IncludesPage.jsx`, `ServicePlanListPage.jsx`, `ServicePlanAddPage.jsx`, `ServicePlanPriceListPage.jsx`, `ServicePlanPriceAddPage.jsx`
- Layers: `ServiceCategoriesLayer.jsx`, `ServiceSubCategories1Layer.jsx`, `ServiceSubCategories2Layer.jsx`, `IncludesLayer.jsx`, `ServicePlanListLayer.jsx`, `ServicePlanAddLayer.jsx`, `ServicePlanPriceListLayer.jsx`, `ServicePlanPriceAddLayer.jsx`
- Routes: `/service-category`, `/service-subcategory1`, `/service-subcategory2`, `/service-includes`, `/service-plans`, `/add-service-package`, `/edit-service-package/:PackageID`, `/service-plan-prices`, `/add-service-plan-price`, `/edit-service-plan-price/:PlanPackagePriceID`
- APIs: ServiceCategory, SubCategory1, SubCategory2, ServiceIncludes, ServicePlans (multipart), ServicePlanPrices
- Flow: Create taxonomy -> add plans -> add plan prices -> manage includes.

## Coupons
- Page: `CouponPage.jsx`
- Layer: `CouponLayer.jsx`
- Route: `/coupons`
- APIs: Coupons
- Flow: List/add/edit coupons.

## Skills, Leave
- Pages: `SkillPage.jsx`, `LeaveListPage.jsx`, `LeaveEditPage.jsx`
- Layers: `SkillLayer.jsx`, `LeaveListLayer.jsx`, `LeaveEditLayer.jsx`
- Routes: `/skills`, `/leave-list`, `/leave-edit/:LeaveID`
- APIs: Skills, Leave
- Flow: Manage skills and leave records.

## Notifications & Templates
- Page: `NotificationTemplatesPage.jsx`
- Layer: `NotificationTemplatesLayer.jsx`
- Route: `/notification-templates`
- APIs: NotificationTemplates, Push/register (FCM)
- Flow: Manage templates -> register FCM token -> send notifications (via backend).

## Reasons & Policy
- Pages: `ReasonPage.jsx`, `PolicyPage.jsx`
- Layers: `ReasonLayer.jsx`, `PolicyLayer.jsx`
- Routes: `/reason`, `/policy`
- APIs: Reason, Policy
- Flow: CRUD for reasons and policy content.

## SEO
- Pages: `SeoPage.jsx`, `SeoAddPage.jsx`
- Layers: `SeoListLayer.jsx` (if used), `SeoAddLayer.jsx`
- Routes: `/seo`, `/add-seo`, `/edit-seo/:seoid`
- APIs: Seo
- Flow: List SEO entries -> add/edit -> save.

## Blog
- Pages: `BlogPage.jsx`, `AddBlogPage.jsx`, `BlogDetailsPage.jsx`
- Layers: `BlogLayer.jsx`, `AddBlogLayer.jsx`
- Routes: `/blog`, `/add-blog`, `/edit-blog/:BlogID`, `/blog-details/:BlogID`
- APIs: Blog (multipart for images)
- Flow: List -> add/edit -> view details.

## Payments & Invoices
- Pages: `PaymentListPage.jsx`, `InvoicePreviewPage.jsx`, `InvoiceListPage.jsx`
- Layers: `PaymentListLayer.jsx`, `InvoicePreviewLayer.jsx`
- Routes: `/payments`, `/invoice-preview/:PaymentID`
- APIs: Payments
- Flow: View payments -> preview invoice.

## Booking Time Slots
- Page: `BookingTimeSlotPage.jsx`
- Layer: `BookingTimeSlotLayer.jsx`
- Route: `/booking-time-slot`
- APIs: BookingTimeSlots
- Flow: Manage available time slots.

---

## Common Flow Pattern (Create/Edit)
1. Navigate to list page (e.g., `/dealers`).
2. Click Add -> navigates to add page (e.g., `/add-dealers`).
3. Fill form; validation via `useFormError` and `FormError`.
4. Submit -> Axios request with `Authorization` header.
5. On success -> Swal success -> navigate back to list.
6. On error -> Swal error.

## UX/Styling Conventions
- Labels: `form-label text-sm fw-semibold text-primary-light mb-8`
- Inputs: `form-control radius-8`
- Select (react-select): `classNamePrefix="react-select"`
- Buttons primary: `btn btn-primary-600 radius-8 px-14 py-6 text-sm`
- Button group: `d-flex justify-content-center gap-3 mt-24`

## Polling/Realtime
- Bookings poll with `setInterval(fetchBookings, 15000)` and cleanup on unmount.

## Maps/Embeds
- Customer/Technician/Booking views embed Google Map with coordinates.

---

For endpoint details, see `API_REFERENCE.md`. For setup and environment, see `PROJECT_DOCUMENTATION.md`.
