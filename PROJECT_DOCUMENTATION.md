# MyCarBuddy Admin – Project Documentation

## Overview
MyCarBuddy Admin is a React 18 + Vite application for managing platform data (users, bookings, technicians, services, SEO, roles/permissions, etc.). It uses Axios for API calls, React Router v6 for routing, and a component-per-page layout with a shared `MasterLayout`.

## Tech Stack
- React 18, Vite 6
- React Router v6
- Axios
- SweetAlert2
- React Select, React Data Table Component
- Bootstrap CSS (project theme styles)
- ESLint 9 (recommended configs)

## Quick Start
1. Install dependencies
```bash
npm install
```
2. Run locally
```bash
npm run dev
```
3. Build for production
```bash
npm run build
```
4. Preview production build
```bash
npm run preview
```

## Environment
Create `.env` files in project root. Example (adjust values):
```bash
# API base url (trailing slash required)
VITE_APIURL=https://api.mycarsbuddy.com/api/

# Optional – Firebase etc.
# VITE_FIREBASE_API_KEY=...
```
Notes:
- Use `import.meta.env.VITE_*` to read environment variables.
- Do not hardcode API URLs in components.

## Scripts
- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run preview` – Preview build
- `npm run lint` – Lint all files

## Project Structure (high level)
```
src/
  components/        # Reusable UI + feature layers
  pages/             # Page wrappers that use MasterLayout + Breadcrumb
  masterLayout/      # Shared layout
  hook/              # Custom hooks
  services/          # API/services
  utils/             # Utilities
  App.jsx            # Routes
  main.jsx           # App bootstrap
public/              # Static assets served by Vite
```

## Routing
- Routing is declared in `src/App.jsx` using React Router v6.
- Public routes: `/sign-in`, `/forgot-password`, errors.
- Protected routes (wrapped by `PrivateRoute`): dashboard, masters, bookings, etc.

Example protected route group:
```jsx
<Route element={<PrivateRoute />}>
  <Route path='/dashboard' element={<HomePageTen />} />
  <Route path='/customers' element={<CustomerPage />} />
  ...
</Route>
```

## Authentication
- `PrivateRoute` checks `localStorage.getItem("token")`. If absent, redirects to `/sign-in`.
- Token is sent in Authorization headers: `Bearer <token>`.

## Employees Module (New)
- List: `src/components/EmployeeLayer.jsx`
- Add/Edit Form: `src/components/EmployeeAddLayer.jsx`
- Pages: `src/pages/EmployeePage.jsx`, `src/pages/EmployeeAddPage.jsx`

Expected API endpoints:
- `GET   {VITE_APIURL}Employees`
- `GET   {VITE_APIURL}Employees/:id`
- `POST  {VITE_APIURL}Employees` (multipart for profile image)
- `PUT   {VITE_APIURL}Employees/:id` (multipart)
- `DELETE{VITE_APIURL}Employees/:id`
- `GET   {VITE_APIURL}Roles` (for Role dropdown)

Routes to add in `App.jsx` inside the protected group:
```jsx
import EmployeePage from "./pages/EmployeePage";
import EmployeeAddPage from "./pages/EmployeeAddPage";

<Route path='/employees' element={<EmployeePage />} />
<Route path='/add-employee' element={<EmployeeAddPage />} />
<Route path='/edit-employee/:EmployeeID' element={<EmployeeAddPage />} />
```

Form fields:
- Full Name, Email, Phone, Password, Confirm Password, Role, Profile Image, Status
- Consistent styling with other forms (`radius-8`, label styles, centered action buttons)

## Common Feature Patterns
- Pages wrap a `Layer` component inside `MasterLayout` + `Breadcrumb`.
- CRUD Layers use Axios with `Authorization: Bearer <token>`.
- Lists use `react-data-table-component` with search, pagination.
- Forms use `useFormError` hook and `FormError` component.
- Media uploads: use `FormData` and `multipart/form-data` headers.

## Code Style & Linting
- ESLint is configured in `eslint.config.js`.
- Prefer meaningful names, guard clauses, minimal nesting.
- Avoid committing console logs; use toasts/Swal for UX messaging.

## Deployment Notes
- Build output in `dist/`.
- Ensure correct `VITE_APIURL` for the target environment.
- Static assets under `public/` are copied as-is.

## Troubleshooting
- Blank page after login: verify token exists and routes are correct.
- 401/403 errors: ensure token is valid and Authorization header present.
- Missing styles: confirm `index.html` includes theme CSS and Vite serves `/src/main.jsx`.
- File uploads failing: check `multipart/form-data` headers and backend size limits.

## Security Considerations
- Do not store secrets in the repo or client-side.
- Prefer HTTPS-only API endpoints.
- Consider httpOnly cookies for tokens if backend supports it.

## Documentation Reference
- **Project TODO**: See `PROJECT_TODO.md` for overall project task tracking and status
- **API Reference**: See `API_REFERENCE.md` for complete endpoint documentation
- **API Testing**: See `API_TESTING_GUIDE.md` for API connectivity testing procedures
- **Modules & Flows**: See `MODULES_AND_FLOWS.md` for page/component/route mappings and user flows
- **Employee Module**: See `EMPLOYEE_TODO.md` for specific implementation details

## Roadmap / TODO
- ✅ Add Employees routes to `App.jsx` (completed)
- ✅ Create comprehensive project documentation (completed)
- Integrate menu entry in `MasterLayout` sidebar for Employees
- Add unit tests for critical forms and lists
- Centralize API service wrapper & error handling

---
Maintainers: Glansa / CarBuddy Admin Team
