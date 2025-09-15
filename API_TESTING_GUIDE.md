# API Testing Guide - Employee Management System

## 🎯 **Purpose**
This guide helps test and verify API connectivity for the Employee Management System in MyCarBuddy Admin.

## 🔧 **Prerequisites**
1. Development server running (`npm run dev`)
2. Backend API server accessible
3. Valid authentication token in localStorage
4. Environment variable `VITE_APIURL` properly configured

## 📋 **API Endpoints to Test**

### **1. Employee Endpoints**
Base URL: `{VITE_APIURL}Employees`

#### **1.1 Get All Employees**
- **Method**: `GET`
- **URL**: `{VITE_APIURL}Employees`
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: Array of employee objects
- **Test URL**: `/employees` (Employee list page)

#### **1.2 Get Single Employee**
- **Method**: `GET`
- **URL**: `{VITE_APIURL}Employees/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: Single employee object
- **Test URL**: `/edit-employee/{id}`

#### **1.3 Create Employee**
- **Method**: `POST`
- **URL**: `{VITE_APIURL}Employees`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Expected Response**: Success message with created employee
- **Test URL**: `/add-employee` (Submit form)

#### **1.4 Update Employee**
- **Method**: `PUT`
- **URL**: `{VITE_APIURL}Employees/{id}`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Expected Response**: Success message with updated employee
- **Test URL**: `/edit-employee/{id}` (Submit form)

#### **1.5 Delete Employee**
- **Method**: `DELETE`
- **URL**: `{VITE_APIURL}Employees/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: Success message
- **Test**: Click delete button on employee list

### **2. Roles Endpoint**
Base URL: `{VITE_APIURL}Roles`

#### **2.1 Get All Roles**
- **Method**: `GET`
- **URL**: `{VITE_APIURL}Roles`
- **Headers**: `Authorization: Bearer <token>`
- **Expected Response**: Array of role objects
- **Test**: Open add/edit employee page (role dropdown)

## 🧪 **Manual Testing Steps**

### **Step 1: Environment Check**
```javascript
// Open browser console and check:
console.log('API Base URL:', import.meta.env.VITE_APIURL);
console.log('Auth Token:', localStorage.getItem('token'));
```

### **Step 2: Test Employee List Page**
1. Navigate to `http://localhost:5173/employees`
2. Check browser console for API errors
3. Verify employee list loads or shows "No employees found"
4. Test search functionality

### **Step 3: Test Add Employee Page**
1. Navigate to `http://localhost:5173/add-employee`
2. Check if roles dropdown loads
3. Test form validation
4. Try submitting form with valid data

### **Step 4: Test Edit Employee Page**
1. Navigate to `http://localhost:5173/edit-employee/1` (replace 1 with actual ID)
2. Check if employee data loads
3. Verify form is pre-populated
4. Test form submission

### **Step 5: Test Delete Functionality**
1. Go to employee list page
2. Click delete button on any employee
3. Confirm deletion in popup
4. Verify employee is removed from list

## 🔍 **Debug API Issues**

### **Common Issues & Solutions**

#### **1. CORS Errors**
```
Access to XMLHttpRequest at 'API_URL' from origin 'localhost:5173' has been blocked by CORS
```
**Solution**: Backend needs to allow CORS for localhost:5173

#### **2. 401 Unauthorized**
```
401 Unauthorized - Invalid token
```
**Solutions**:
- Check if token exists: `localStorage.getItem('token')`
- Login again to get fresh token
- Verify token format is correct

#### **3. 404 Not Found**
```
404 Not Found - API endpoint not found
```
**Solutions**:
- Check `VITE_APIURL` environment variable
- Verify API endpoint URL is correct
- Ensure backend server is running

#### **4. 500 Internal Server Error**
```
500 Internal Server Error
```
**Solutions**:
- Check backend server logs
- Verify database connection
- Check API request format

### **Network Tab Analysis**
1. Open Browser DevTools → Network tab
2. Navigate to employee pages
3. Check API requests:
   - **Status codes**: 200 (success), 401 (unauthorized), 404 (not found), 500 (server error)
   - **Request headers**: Authorization header present
   - **Response data**: Valid JSON structure

## 📊 **Testing Checklist**

### **Basic Connectivity**
- [ ] Environment variables configured
- [ ] Authentication token available
- [ ] Backend server accessible
- [ ] CORS properly configured

### **Employee List Page**
- [ ] GET /Employees endpoint responds
- [ ] Employee list displays correctly
- [ ] Search functionality works
- [ ] No console errors

### **Add Employee Page**
- [ ] GET /Roles endpoint responds
- [ ] Role dropdown populates
- [ ] Form validation works
- [ ] POST /Employees works with valid data
- [ ] Image upload works (if applicable)
- [ ] Success redirect to list page

### **Edit Employee Page**
- [ ] GET /Employees/{id} endpoint responds
- [ ] Form pre-populates with employee data
- [ ] PUT /Employees/{id} works with updates
- [ ] Success redirect to list page

### **Delete Employee**
- [ ] DELETE /Employees/{id} endpoint responds
- [ ] Confirmation dialog appears
- [ ] Employee removed from list after deletion
- [ ] Success message displays

## 🚨 **Troubleshooting Commands**

### **Check Environment**
```bash
# Check if VITE_APIURL is set
echo $VITE_APIURL

# Or create .env file with:
VITE_APIURL=https://your-api-url.com/api/
```

### **Manual API Testing with cURL**
```bash
# Test GET Employees
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "{VITE_APIURL}Employees"

# Test GET Roles  
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "{VITE_APIURL}Roles"
```

## 📝 **Expected API Response Formats**

### **Employees Response**
```json
[
  {
    "EmployeeID": 1,
    "FullName": "John Doe",
    "Email": "john@example.com",
    "PhoneNumber": "1234567890",
    "RoleID": 1,
    "ProfileImage": "path/to/image.jpg",
    "IsActive": true,
    "CreatedDate": "2024-01-01T00:00:00Z"
  }
]
```

### **Roles Response**
```json
[
  {
    "RoleID": 1,
    "RoleName": "Admin"
  },
  {
    "RoleID": 2,
    "RoleName": "Manager"
  }
]
```

## ✅ **Success Criteria**
- All API endpoints respond without errors
- Employee list loads and displays data
- Add employee form submits successfully
- Edit employee form loads and updates data
- Delete employee functionality works
- Role dropdown populates correctly
- No console errors during normal operation

---
**Next Steps**: Once API connectivity is verified, proceed to comprehensive CRUD testing and UI/UX validation.
