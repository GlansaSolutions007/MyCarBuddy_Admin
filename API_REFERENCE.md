# API Reference – MyCarBuddy Admin

Format: Base URL is `import.meta.env.VITE_APIURL` (must end with `/`). All protected requests include header: `Authorization: Bearer <token>`.

Note: This reference reflects current frontend usage patterns. Backend may vary slightly; adjust field names accordingly.

## Conventions
- List endpoints typically return arrays or `{ data: [...] }`.
- Single resource endpoints return the entity.
- Create/Update may return `{ status: true }` or `{ success: true }`.
- Multipart is used when uploading images/files.

---

## Authentication
- POST `{VITE_APIURL}Auth/login`
- POST `{VITE_APIURL}Auth/forgot-password`
- POST `{VITE_APIURL}Auth/reset-password`

## Roles & Permissions
- GET `{VITE_APIURL}Roles`
- GET `{VITE_APIURL}Roles/:id`
- POST `{VITE_APIURL}Roles`
- PUT `{VITE_APIURL}Roles`
- DELETE `{VITE_APIURL}Roles/:id`
- GET `{VITE_APIURL}Roles/:roleId/permissions`
- POST `{VITE_APIURL}Roles/:roleId/permissions`

## Users / Employees (Admin Users)
- GET `{VITE_APIURL}Employees`
- GET `{VITE_APIURL}Employees/:id`
- POST `{VITE_APIURL}Employees` (multipart: ProfileImage)
- PUT `{VITE_APIURL}Employees/:id` (multipart)
- DELETE `{VITE_APIURL}Employees/:id`

## States
- GET `{VITE_APIURL}State`
- GET `{VITE_APIURL}State/:id`
- POST `{VITE_APIURL}State`
- PUT `{VITE_APIURL}State/:id`
- DELETE `{VITE_APIURL}State/:id`

## Cities
- GET `{VITE_APIURL}City`
- GET `{VITE_APIURL}City/:id`
- POST `{VITE_APIURL}City`
- PUT `{VITE_APIURL}City/:id`
- DELETE `{VITE_APIURL}City/:id`

## Distributors
- GET `{VITE_APIURL}Distributor`
- GET `{VITE_APIURL}Distributor/:id`
- POST `{VITE_APIURL}Distributor`
- PUT `{VITE_APIURL}Distributor/:id`
- DELETE `{VITE_APIURL}Distributor/:id`

## Dealers
- GET `{VITE_APIURL}Dealer`
- GET `{VITE_APIURL}Dealer/:id`
- POST `{VITE_APIURL}Dealer` (multipart: ProfileImage)
- PUT `{VITE_APIURL}Dealer/:id` (multipart)
- DELETE `{VITE_APIURL}Dealer/:id`

## Technicians
- GET `{VITE_APIURL}Technicians`
- GET `{VITE_APIURL}Technicians/:id`
- POST `{VITE_APIURL}Technicians` (multipart; documents supported)
- PUT `{VITE_APIURL}Technicians/:id` (multipart)
- DELETE `{VITE_APIURL}Technicians/:id`
- GET `{VITE_APIURL}TechniciansDetails` (for dropdown in bookings)

## Vehicles
### Fuel
- GET `{VITE_APIURL}VehicleFuel`
- POST `{VITE_APIURL}VehicleFuel`
- PUT `{VITE_APIURL}VehicleFuel/:id`
- DELETE `{VITE_APIURL}VehicleFuel/:id`

### Brand
- GET `{VITE_APIURL}VehicleBrand`
- POST `{VITE_APIURL}VehicleBrand` (multipart: image)
- PUT `{VITE_APIURL}VehicleBrand/:id` (multipart)
- DELETE `{VITE_APIURL}VehicleBrand/:id`

### Model
- GET `{VITE_APIURL}VehicleModel`
- POST `{VITE_APIURL}VehicleModel`
- PUT `{VITE_APIURL}VehicleModel/:id`
- DELETE `{VITE_APIURL}VehicleModel/:id`

## Customers
- GET `{VITE_APIURL}Customer`
- GET `{VITE_APIURL}Customer/:id`
- POST `{VITE_APIURL}Customer`
- PUT `{VITE_APIURL}Customer/:id`
- DELETE `{VITE_APIURL}Customer/:id`

## Bookings
- GET `{VITE_APIURL}Bookings`
- GET `{VITE_APIURL}Bookings/:id`
- PUT `{VITE_APIURL}Bookings/assign-technician` (payload: BookingID, TechID)
- Other status/change endpoints as per backend

## Services
### Categories
- GET `{VITE_APIURL}ServiceCategory`
- POST `{VITE_APIURL}ServiceCategory`
- PUT `{VITE_APIURL}ServiceCategory/:id`
- DELETE `{VITE_APIURL}ServiceCategory/:id`

### SubCategories (Level 1)
- GET `{VITE_APIURL}ServiceSubCategory1`
- POST `{VITE_APIURL}ServiceSubCategory1`
- PUT `{VITE_APIURL}ServiceSubCategory1/:id`
- DELETE `{VITE_APIURL}ServiceSubCategory1/:id`

### SubCategories (Level 2)
- GET `{VITE_APIURL}ServiceSubCategory2`
- POST `{VITE_APIURL}ServiceSubCategory2`
- PUT `{VITE_APIURL}ServiceSubCategory2/:id`
- DELETE `{VITE_APIURL}ServiceSubCategory2/:id`

### Includes
- GET `{VITE_APIURL}ServiceIncludes`
- POST `{VITE_APIURL}ServiceIncludes`
- PUT `{VITE_APIURL}ServiceIncludes/:id`
- DELETE `{VITE_APIURL}ServiceIncludes/:id`

### Service Plans
- GET `{VITE_APIURL}ServicePlans`
- GET `{VITE_APIURL}ServicePlans/:id`
- POST `{VITE_APIURL}ServicePlans` (multipart: images allowed)
- PUT `{VITE_APIURL}ServicePlans/:id` (multipart)
- DELETE `{VITE_APIURL}ServicePlans/:id`

### Plan Prices
- GET `{VITE_APIURL}ServicePlanPrices`
- GET `{VITE_APIURL}ServicePlanPrices/:id`
- POST `{VITE_APIURL}ServicePlanPrices`
- PUT `{VITE_APIURL}ServicePlanPrices/:id`
- DELETE `{VITE_APIURL}ServicePlanPrices/:id`

## Coupons
- GET `{VITE_APIURL}Coupons`
- GET `{VITE_APIURL}Coupons/:id`
- POST `{VITE_APIURL}Coupons`
- PUT `{VITE_APIURL}Coupons/:id`
- DELETE `{VITE_APIURL}Coupons/:id`

## Skills
- GET `{VITE_APIURL}Skills`
- POST `{VITE_APIURL}Skills`
- PUT `{VITE_APIURL}Skills/:id`
- DELETE `{VITE_APIURL}Skills/:id`

## Leave
- GET `{VITE_APIURL}Leave`
- GET `{VITE_APIURL}Leave/:id`
- POST `{VITE_APIURL}Leave`
- PUT `{VITE_APIURL}Leave/:id`
- DELETE `{VITE_APIURL}Leave/:id`

## Notifications
- GET `{VITE_APIURL}NotificationTemplates`
- POST `{VITE_APIURL}NotificationTemplates`
- PUT `{VITE_APIURL}NotificationTemplates/:id`
- DELETE `{VITE_APIURL}NotificationTemplates/:id`
- POST `{VITE_APIURL}Push/register` (FCM registration)

## Reasons & Policy
- GET `{VITE_APIURL}Reason`
- POST `{VITE_APIURL}Reason`
- PUT `{VITE_APIURL}Reason/:id`
- DELETE `{VITE_APIURL}Reason/:id`
- GET `{VITE_APIURL}Policy`
- POST `{VITE_APIURL}Policy`
- PUT `{VITE_APIURL}Policy/:id`
- DELETE `{VITE_APIURL}Policy/:id`

## SEO
- GET `{VITE_APIURL}Seo`
- GET `{VITE_APIURL}Seo/:id`
- POST `{VITE_APIURL}Seo`
- PUT `{VITE_APIURL}Seo/:id`
- DELETE `{VITE_APIURL}Seo/:id`

## Blog
- GET `{VITE_APIURL}Blog`
- GET `{VITE_APIURL}Blog/:id`
- POST `{VITE_APIURL}Blog` (multipart if images)
- PUT `{VITE_APIURL}Blog/:id` (multipart)
- DELETE `{VITE_APIURL}Blog/:id`

## Payments
- GET `{VITE_APIURL}Payments`
- GET `{VITE_APIURL}Payments/:id`
- Other actions as per backend

## Booking Time Slots
- GET `{VITE_APIURL}BookingTimeSlots`
- POST `{VITE_APIURL}BookingTimeSlots`
- PUT `{VITE_APIURL}BookingTimeSlots/:id`
- DELETE `{VITE_APIURL}BookingTimeSlots/:id`

---

## Notes
- If an endpoint responds with `{ data: [...] }`, access via `res.data.data`.
- Some modules use `multipart/form-data` for image upload.
- For Google Maps embeds in views, coordinates are read from entity fields.
