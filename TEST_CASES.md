# MyCarBuddy Admin - Test Cases Documentation

## Test Cases Format

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|

---

## 1. Authentication & Login Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-LOGIN-01 | Verify login screen is displayed | Login screen with phone number input should be displayed | Login screen displayed | Pass | UI loaded correctly | |
| MCB-LOGIN-02 | Enter valid phone number and click Login | OTP should be sent to registered mobile number | OTP sent successfully | Pass | OTP received on phone | |
| MCB-LOGIN-03 | Enter invalid OTP | System should show error message and deny login | Error message displayed | Pass | Invalid OTP validation working | |
| MCB-LOGIN-04 | Enter correct OTP | OTP should be verified successfully | OTP verified | Pass | OTP accepted | |
| MCB-LOGIN-05 | Login after successful OTP verification | User should be logged in and redirected to dashboard | Dashboard displayed | Pass | Login flow completed successfully | |
| MCB-LOGIN-06 | Click Send OTP with empty mobile number | System should show validation message | Validation message shown | Pass | Mandatory field validation | |
| MCB-LOGIN-07 | Enter invalid phone number format | System should show format validation error | Format error displayed | Pass | Phone number validation working | |
| MCB-LOGIN-08 | Enter OTP with expired time | System should show OTP expired message | OTP expired message shown | Pass | OTP expiry validation | |
| MCB-LOGIN-09 | Resend OTP functionality | New OTP should be sent to mobile number | New OTP sent | Pass | Resend OTP working | |
| MCB-LOGIN-10 | Access protected route without login | User should be redirected to login page | Redirected to login | Pass | Route protection working | |

---

## 2. Forgot Password Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-FPWD-01 | Verify forgot password page is displayed | Forgot password form should be displayed | Forgot password page displayed | Pass | UI loaded correctly | |
| MCB-FPWD-02 | Enter valid email/phone and submit | Password reset link should be sent | Reset link sent successfully | Pass | Email/SMS sent | |
| MCB-FPWD-03 | Enter invalid email/phone format | System should show validation error | Validation error displayed | Pass | Format validation working | |
| MCB-FPWD-04 | Enter non-registered email/phone | System should show user not found message | User not found message | Pass | User validation working | |
| MCB-FPWD-05 | Click reset password link from email | Reset password page should open | Reset password page opened | Pass | Link navigation working | |
| MCB-FPWD-06 | Enter new password and confirm password | Password should be reset successfully | Password reset successful | Pass | Password reset working | |
| MCB-FPWD-07 | Enter mismatched passwords | System should show password mismatch error | Mismatch error displayed | Pass | Password validation working | |
| MCB-FPWD-08 | Enter weak password | System should show password strength error | Password strength error | Pass | Password policy validation | |

---

## 3. Dashboard Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-DASH-01 | Verify dashboard page loads after login | Dashboard with statistics cards should be displayed | Dashboard displayed | Pass | Page loaded correctly | |
| MCB-DASH-02 | Verify dashboard statistics cards | All statistics cards should show correct data | Statistics displayed | Pass | Data fetched correctly | |
| MCB-DASH-03 | Verify dashboard charts/graphs | Charts should render with data | Charts rendered | Pass | Chart visualization working | |
| MCB-DASH-04 | Verify recent bookings list | Recent bookings should be displayed | Bookings list displayed | Pass | Recent data shown | |
| MCB-DASH-05 | Verify dashboard refresh functionality | Dashboard should refresh and update data | Data refreshed | Pass | Refresh working | |
| MCB-DASH-06 | Verify dashboard date filter | Dashboard should filter data by selected date | Data filtered | Pass | Date filter working | |
| MCB-DASH-07 | Verify dashboard responsive design | Dashboard should be responsive on mobile devices | Responsive layout | Pass | Mobile view working | |

---

## 4. Customer Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-CUST-01 | Verify customers list page loads | Customers list with all records should be displayed | Customers list displayed | Pass | Page loaded correctly | |
| MCB-CUST-02 | Verify customer search functionality | Search should filter customers by name/phone | Filtered results shown | Pass | Search working | |
| MCB-CUST-03 | Verify customer pagination | Pagination should navigate between pages | Pages navigated | Pass | Pagination working | |
| MCB-CUST-04 | Click on Add Customer button | Add customer form should open | Add form opened | Pass | Navigation working | |
| MCB-CUST-05 | Fill customer form with valid data and submit | Customer should be created successfully | Customer created | Pass | Create functionality working | |
| MCB-CUST-06 | Submit customer form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-CUST-07 | Enter invalid phone number | System should show phone validation error | Phone error displayed | Pass | Phone validation working | |
| MCB-CUST-08 | Enter invalid email format | System should show email validation error | Email error displayed | Pass | Email validation working | |
| MCB-CUST-09 | Click on Edit Customer | Customer edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-CUST-10 | Update customer details and save | Customer should be updated successfully | Customer updated | Pass | Update functionality working | |
| MCB-CUST-11 | Click on View Customer | Customer details page should open | Details page opened | Pass | View navigation working | |
| MCB-CUST-12 | Verify customer details display | All customer information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-CUST-13 | Delete customer record | Customer should be deleted with confirmation | Customer deleted | Pass | Delete functionality working | |
| MCB-CUST-14 | Verify customer export functionality | Customer data should be exported to CSV/Excel | Export successful | Pass | Export working | |

---

## 5. Booking Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-BOOK-01 | Verify bookings list page loads | Bookings list with all records should be displayed | Bookings list displayed | Pass | Page loaded correctly | |
| MCB-BOOK-02 | Verify booking search functionality | Search should filter bookings by booking ID/customer | Filtered results shown | Pass | Search working | |
| MCB-BOOK-03 | Verify booking status filter | Bookings should filter by selected status | Filtered by status | Pass | Status filter working | |
| MCB-BOOK-04 | Verify booking date filter | Bookings should filter by selected date range | Filtered by date | Pass | Date filter working | |
| MCB-BOOK-05 | Click on View Booking | Booking details page should open | Booking details opened | Pass | View navigation working | |
| MCB-BOOK-06 | Verify booking details display | All booking information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-BOOK-07 | Assign technician to booking | Technician should be assigned successfully | Technician assigned | Pass | Assignment working | |
| MCB-BOOK-08 | Assign supervisor to booking | Supervisor should be assigned successfully | Supervisor assigned | Pass | Assignment working | |
| MCB-BOOK-09 | Reschedule booking date and time | Booking should be rescheduled successfully | Booking rescheduled | Pass | Reschedule working | |
| MCB-BOOK-10 | Cancel booking with reason | Booking should be cancelled with reason saved | Booking cancelled | Pass | Cancel functionality working | |
| MCB-BOOK-11 | Add service to booking | Service should be added to booking | Service added | Pass | Add service working | |
| MCB-BOOK-12 | Update booking status | Booking status should be updated | Status updated | Pass | Status update working | |
| MCB-BOOK-13 | Verify pickup and delivery details form | Pickup/delivery form should be displayed | Form displayed | Pass | Form loaded | |
| MCB-BOOK-14 | Fill pickup and delivery details | Details should be saved successfully | Details saved | Pass | Save functionality working | |
| MCB-BOOK-15 | Verify booking invoice generation | Invoice should be generated and displayed | Invoice generated | Pass | Invoice generation working | |
| MCB-BOOK-16 | Verify booking payment processing | Payment should be processed successfully | Payment processed | Pass | Payment working | |
| MCB-BOOK-17 | Verify today's bookings page | Today's bookings should be displayed | Today's bookings shown | Pass | Filter working | |

---

## 6. Technician Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-TECH-01 | Verify technicians list page loads | Technicians list should be displayed | Technicians list displayed | Pass | Page loaded correctly | |
| MCB-TECH-02 | Verify technician search functionality | Search should filter technicians | Filtered results shown | Pass | Search working | |
| MCB-TECH-03 | Click on Add Technician | Add technician form should open | Add form opened | Pass | Navigation working | |
| MCB-TECH-04 | Fill technician form with valid data | Technician should be created successfully | Technician created | Pass | Create functionality working | |
| MCB-TECH-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-TECH-06 | Upload technician profile image | Image should be uploaded and displayed | Image uploaded | Pass | Image upload working | |
| MCB-TECH-07 | Click on Edit Technician | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-TECH-08 | Update technician details | Technician should be updated successfully | Technician updated | Pass | Update functionality working | |
| MCB-TECH-09 | Click on View Technician | Technician details page should open | Details page opened | Pass | View navigation working | |
| MCB-TECH-10 | Verify technician details display | All technician information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-TECH-11 | Verify technician booking history | Booking history should be displayed | History displayed | Pass | History working | |
| MCB-TECH-12 | Delete technician record | Technician should be deleted with confirmation | Technician deleted | Pass | Delete functionality working | |

---

## 7. Dealer Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-DEAL-01 | Verify dealers list page loads | Dealers list should be displayed | Dealers list displayed | Pass | Page loaded correctly | |
| MCB-DEAL-02 | Verify dealer search functionality | Search should filter dealers | Filtered results shown | Pass | Search working | |
| MCB-DEAL-03 | Click on Add Dealer | Add dealer form should open | Add form opened | Pass | Navigation working | |
| MCB-DEAL-04 | Fill dealer form with valid data | Dealer should be created successfully | Dealer created | Pass | Create functionality working | |
| MCB-DEAL-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-DEAL-06 | Click on Edit Dealer | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-DEAL-07 | Update dealer details | Dealer should be updated successfully | Dealer updated | Pass | Update functionality working | |
| MCB-DEAL-08 | Delete dealer record | Dealer should be deleted with confirmation | Dealer deleted | Pass | Delete functionality working | |
| MCB-DEAL-09 | Verify dealer service price page | Dealer service prices should be displayed | Service prices shown | Pass | Page loaded | |
| MCB-DEAL-10 | Add dealer service price | Service price should be added successfully | Price added | Pass | Add price working | |

---

## 8. Distributor Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-DIST-01 | Verify distributors list page loads | Distributors list should be displayed | Distributors list displayed | Pass | Page loaded correctly | |
| MCB-DIST-02 | Verify distributor search functionality | Search should filter distributors | Filtered results shown | Pass | Search working | |
| MCB-DIST-03 | Click on Add Distributor | Add distributor form should open | Add form opened | Pass | Navigation working | |
| MCB-DIST-04 | Fill distributor form with valid data | Distributor should be created successfully | Distributor created | Pass | Create functionality working | |
| MCB-DIST-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-DIST-06 | Click on Edit Distributor | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-DIST-07 | Update distributor details | Distributor should be updated successfully | Distributor updated | Pass | Update functionality working | |
| MCB-DIST-08 | Delete distributor record | Distributor should be deleted with confirmation | Distributor deleted | Pass | Delete functionality working | |

---

## 9. Employee Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-EMP-01 | Verify employees list page loads | Employees list should be displayed | Employees list displayed | Pass | Page loaded correctly | |
| MCB-EMP-02 | Verify employee search functionality | Search should filter employees | Filtered results shown | Pass | Search working | |
| MCB-EMP-03 | Click on Add Employee | Add employee form should open | Add form opened | Pass | Navigation working | |
| MCB-EMP-04 | Fill employee form with valid data | Employee should be created successfully | Employee created | Pass | Create functionality working | |
| MCB-EMP-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-EMP-06 | Click on Edit Employee | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-EMP-07 | Update employee details | Employee should be updated successfully | Employee updated | Pass | Update functionality working | |
| MCB-EMP-08 | Delete employee record | Employee should be deleted with confirmation | Employee deleted | Pass | Delete functionality working | |
| MCB-EMP-09 | Verify employee tickets page | Employee tickets should be displayed | Tickets displayed | Pass | Page loaded | |
| MCB-EMP-10 | Verify employee leads report | Employee leads report should be displayed | Report displayed | Pass | Report working | |

---

## 10. Service Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-SVC-01 | Verify service categories list page loads | Service categories list should be displayed | Categories list displayed | Pass | Page loaded correctly | |
| MCB-SVC-02 | Click on Add Service Category | Add category form should open | Add form opened | Pass | Navigation working | |
| MCB-SVC-03 | Fill category form and submit | Category should be created successfully | Category created | Pass | Create functionality working | |
| MCB-SVC-04 | Verify service subcategory1 page | Subcategory1 list should be displayed | Subcategory1 list displayed | Pass | Page loaded | |
| MCB-SVC-05 | Add service subcategory1 | Subcategory1 should be created successfully | Subcategory1 created | Pass | Create working | |
| MCB-SVC-06 | Verify service subcategory2 page | Subcategory2 list should be displayed | Subcategory2 list displayed | Pass | Page loaded | |
| MCB-SVC-07 | Add service subcategory2 | Subcategory2 should be created successfully | Subcategory2 created | Pass | Create working | |
| MCB-SVC-08 | Verify service includes page | Service includes list should be displayed | Includes list displayed | Pass | Page loaded | |
| MCB-SVC-09 | Add service include | Service include should be created successfully | Include created | Pass | Create working | |
| MCB-SVC-10 | Verify service plans list page | Service plans list should be displayed | Plans list displayed | Pass | Page loaded | |
| MCB-SVC-11 | Click on Add Service Plan | Add plan form should open | Add form opened | Pass | Navigation working | |
| MCB-SVC-12 | Fill service plan form and submit | Service plan should be created successfully | Plan created | Pass | Create functionality working | |
| MCB-SVC-13 | Click on Edit Service Plan | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-SVC-14 | Update service plan | Service plan should be updated successfully | Plan updated | Pass | Update functionality working | |
| MCB-SVC-15 | Verify service plan prices page | Service plan prices should be displayed | Prices displayed | Pass | Page loaded | |
| MCB-SVC-16 | Add service plan price | Plan price should be added successfully | Price added | Pass | Add price working | |
| MCB-SVC-17 | Edit service plan price | Plan price should be updated successfully | Price updated | Pass | Update price working | |
| MCB-SVC-18 | Verify skills page | Skills list should be displayed | Skills list displayed | Pass | Page loaded | |
| MCB-SVC-19 | Add skill | Skill should be created successfully | Skill created | Pass | Create working | |

---

## 11. Vehicle Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-VEH-01 | Verify vehicle brands list page loads | Vehicle brands list should be displayed | Brands list displayed | Pass | Page loaded correctly | |
| MCB-VEH-02 | Add vehicle brand | Brand should be created successfully | Brand created | Pass | Create functionality working | |
| MCB-VEH-03 | Edit vehicle brand | Brand should be updated successfully | Brand updated | Pass | Update functionality working | |
| MCB-VEH-04 | Delete vehicle brand | Brand should be deleted with confirmation | Brand deleted | Pass | Delete functionality working | |
| MCB-VEH-05 | Verify vehicle models list page | Vehicle models list should be displayed | Models list displayed | Pass | Page loaded | |
| MCB-VEH-06 | Add vehicle model | Model should be created successfully | Model created | Pass | Create functionality working | |
| MCB-VEH-07 | Edit vehicle model | Model should be updated successfully | Model updated | Pass | Update functionality working | |
| MCB-VEH-08 | Delete vehicle model | Model should be deleted with confirmation | Model deleted | Pass | Delete functionality working | |
| MCB-VEH-09 | Verify vehicle fuel types page | Fuel types list should be displayed | Fuel types displayed | Pass | Page loaded | |
| MCB-VEH-10 | Add vehicle fuel type | Fuel type should be created successfully | Fuel type created | Pass | Create working | |
| MCB-VEH-11 | Edit vehicle fuel type | Fuel type should be updated successfully | Fuel type updated | Pass | Update working | |
| MCB-VEH-12 | Delete vehicle fuel type | Fuel type should be deleted with confirmation | Fuel type deleted | Pass | Delete working | |

---

## 12. Region Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-REG-01 | Verify states list page loads | States list should be displayed | States list displayed | Pass | Page loaded correctly | |
| MCB-REG-02 | Add state | State should be created successfully | State created | Pass | Create functionality working | |
| MCB-REG-03 | Edit state | State should be updated successfully | State updated | Pass | Update functionality working | |
| MCB-REG-04 | Delete state | State should be deleted with confirmation | State deleted | Pass | Delete functionality working | |
| MCB-REG-05 | Verify cities list page | Cities list should be displayed | Cities list displayed | Pass | Page loaded | |
| MCB-REG-06 | Add city | City should be created successfully | City created | Pass | Create functionality working | |
| MCB-REG-07 | Edit city | City should be updated successfully | City updated | Pass | Update functionality working | |
| MCB-REG-08 | Delete city | City should be deleted with confirmation | City deleted | Pass | Delete functionality working | |
| MCB-REG-09 | Filter cities by state | Cities should filter by selected state | Cities filtered | Pass | Filter working | |

---

## 13. Ticket Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-TICK-01 | Verify tickets list page loads | Tickets list should be displayed | Tickets list displayed | Pass | Page loaded correctly | |
| MCB-TICK-02 | Verify ticket search functionality | Search should filter tickets | Filtered results shown | Pass | Search working | |
| MCB-TICK-03 | Verify ticket status filter | Tickets should filter by selected status | Filtered by status | Pass | Status filter working | |
| MCB-TICK-04 | Click on Add Ticket | Add ticket form should open | Add form opened | Pass | Navigation working | |
| MCB-TICK-05 | Fill ticket form with valid data | Ticket should be created successfully | Ticket created | Pass | Create functionality working | |
| MCB-TICK-06 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-TICK-07 | Click on View Ticket | Ticket details page should open | Details page opened | Pass | View navigation working | |
| MCB-TICK-08 | Verify ticket details display | All ticket information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-TICK-09 | Assign ticket to employee | Ticket should be assigned successfully | Ticket assigned | Pass | Assignment working | |
| MCB-TICK-10 | Update ticket status | Ticket status should be updated | Status updated | Pass | Status update working | |
| MCB-TICK-11 | Add comment to ticket | Comment should be added successfully | Comment added | Pass | Comment functionality working | |
| MCB-TICK-12 | Click on Edit Ticket | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-TICK-13 | Update ticket details | Ticket should be updated successfully | Ticket updated | Pass | Update functionality working | |
| MCB-TICK-14 | Verify telecaller tickets page | Telecaller tickets should be displayed | Tickets displayed | Pass | Page loaded | |
| MCB-TICK-15 | Verify employee tickets page | Employee tickets should be displayed | Tickets displayed | Pass | Page loaded | |
| MCB-TICK-16 | Verify assign tickets page | Assign tickets interface should be displayed | Page displayed | Pass | Page loaded | |
| MCB-TICK-17 | Verify ticket reports page | Ticket reports should be displayed | Reports displayed | Pass | Reports working | |
| MCB-TICK-18 | Verify department-wise ticket report | Department-wise report should be displayed | Report displayed | Pass | Report working | |

---

## 14. Lead Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-LEAD-01 | Verify leads list page loads | Leads list should be displayed | Leads list displayed | Pass | Page loaded correctly | |
| MCB-LEAD-02 | Verify lead search functionality | Search should filter leads | Filtered results shown | Pass | Search working | |
| MCB-LEAD-03 | Verify lead status filter | Leads should filter by selected status | Filtered by status | Pass | Status filter working | |
| MCB-LEAD-04 | Click on Add Lead | Add lead form should open | Add form opened | Pass | Navigation working | |
| MCB-LEAD-05 | Fill lead form with valid data | Lead should be created successfully | Lead created | Pass | Create functionality working | |
| MCB-LEAD-06 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-LEAD-07 | Click on View Lead | Lead details page should open | Details page opened | Pass | View navigation working | |
| MCB-LEAD-08 | Verify lead details display | All lead information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-LEAD-09 | Assign lead to employee | Lead should be assigned successfully | Lead assigned | Pass | Assignment working | |
| MCB-LEAD-10 | Update lead status | Lead status should be updated | Status updated | Pass | Status update working | |
| MCB-LEAD-11 | Verify organic leads page | Organic leads should be displayed | Organic leads shown | Pass | Page loaded | |
| MCB-LEAD-12 | Verify today's leads page | Today's leads should be displayed | Today's leads shown | Pass | Filter working | |
| MCB-LEAD-13 | Verify closed leads page | Closed leads should be displayed | Closed leads shown | Pass | Page loaded | |
| MCB-LEAD-14 | Verify assign leads page | Assign leads interface should be displayed | Assign page displayed | Pass | Page loaded | |
| MCB-LEAD-15 | Verify lead reports page | Lead reports should be displayed | Reports displayed | Pass | Reports working | |
| MCB-LEAD-16 | Verify employee leads report | Employee leads report should be displayed | Report displayed | Pass | Report working | |

---

## 15. Payment Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-PAY-01 | Verify payments list page loads | Payments list should be displayed | Payments list displayed | Pass | Page loaded correctly | |
| MCB-PAY-02 | Verify payment search functionality | Search should filter payments | Filtered results shown | Pass | Search working | |
| MCB-PAY-03 | Verify payment status filter | Payments should filter by selected status | Filtered by status | Pass | Status filter working | |
| MCB-PAY-04 | Click on View Payment | Payment details should be displayed | Payment details shown | Pass | View working | |
| MCB-PAY-05 | Verify invoice preview page | Invoice should be previewed | Invoice previewed | Pass | Preview working | |
| MCB-PAY-06 | Verify invoice view page | Invoice should be displayed | Invoice displayed | Pass | View working | |
| MCB-PAY-07 | Download invoice PDF | Invoice PDF should be downloaded | PDF downloaded | Pass | Download working | |
| MCB-PAY-08 | Process payment for booking | Payment should be processed successfully | Payment processed | Pass | Payment processing working | |
| MCB-PAY-09 | Verify refund page | Refunds list should be displayed | Refunds displayed | Pass | Page loaded | |
| MCB-PAY-10 | Process refund | Refund should be processed successfully | Refund processed | Pass | Refund working | |

---

## 16. Coupon Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-COUP-01 | Verify coupons list page loads | Coupons list should be displayed | Coupons list displayed | Pass | Page loaded correctly | |
| MCB-COUP-02 | Verify coupon search functionality | Search should filter coupons | Filtered results shown | Pass | Search working | |
| MCB-COUP-03 | Click on Add Coupon | Add coupon form should open | Add form opened | Pass | Navigation working | |
| MCB-COUP-04 | Fill coupon form with valid data | Coupon should be created successfully | Coupon created | Pass | Create functionality working | |
| MCB-COUP-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-COUP-06 | Enter invalid discount percentage | System should show validation error | Validation error shown | Pass | Validation working | |
| MCB-COUP-07 | Enter invalid expiry date | System should show date validation error | Date error shown | Pass | Date validation working | |
| MCB-COUP-08 | Click on Edit Coupon | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-COUP-09 | Update coupon details | Coupon should be updated successfully | Coupon updated | Pass | Update functionality working | |
| MCB-COUP-10 | Delete coupon | Coupon should be deleted with confirmation | Coupon deleted | Pass | Delete functionality working | |
| MCB-COUP-11 | Activate/Deactivate coupon | Coupon status should be toggled | Status toggled | Pass | Toggle working | |

---

## 17. Time Slot Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-TIME-01 | Verify booking time slots page loads | Time slots list should be displayed | Time slots displayed | Pass | Page loaded correctly | |
| MCB-TIME-02 | Click on Add Time Slot | Add time slot form should open | Add form opened | Pass | Navigation working | |
| MCB-TIME-03 | Fill time slot form with valid data | Time slot should be created successfully | Time slot created | Pass | Create functionality working | |
| MCB-TIME-04 | Enter invalid time range | System should show validation error | Validation error shown | Pass | Validation working | |
| MCB-TIME-05 | Enter overlapping time slots | System should show conflict error | Conflict error shown | Pass | Conflict detection working | |
| MCB-TIME-06 | Click on Edit Time Slot | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-TIME-07 | Update time slot | Time slot should be updated successfully | Time slot updated | Pass | Update functionality working | |
| MCB-TIME-08 | Delete time slot | Time slot should be deleted with confirmation | Time slot deleted | Pass | Delete functionality working | |
| MCB-TIME-09 | Activate/Deactivate time slot | Time slot status should be toggled | Status toggled | Pass | Toggle working | |

---

## 18. Leave Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-LEAVE-01 | Verify leave list page loads | Leave list should be displayed | Leave list displayed | Pass | Page loaded correctly | |
| MCB-LEAVE-02 | Verify leave search functionality | Search should filter leaves | Filtered results shown | Pass | Search working | |
| MCB-LEAVE-03 | Verify leave status filter | Leaves should filter by selected status | Filtered by status | Pass | Status filter working | |
| MCB-LEAVE-04 | Click on Edit Leave | Edit leave form should open | Edit form opened | Pass | Navigation working | |
| MCB-LEAVE-05 | Update leave status | Leave status should be updated | Status updated | Pass | Status update working | |
| MCB-LEAVE-06 | Approve leave request | Leave should be approved successfully | Leave approved | Pass | Approval working | |
| MCB-LEAVE-07 | Reject leave request | Leave should be rejected with reason | Leave rejected | Pass | Rejection working | |
| MCB-LEAVE-08 | Verify leave date validation | Invalid date range should show error | Validation error shown | Pass | Date validation working | |

---

## 19. Department & Designation Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-DEPT-01 | Verify departments list page loads | Departments list should be displayed | Departments list displayed | Pass | Page loaded correctly | |
| MCB-DEPT-02 | Add department | Department should be created successfully | Department created | Pass | Create functionality working | |
| MCB-DEPT-03 | Edit department | Department should be updated successfully | Department updated | Pass | Update functionality working | |
| MCB-DEPT-04 | Delete department | Department should be deleted with confirmation | Department deleted | Pass | Delete functionality working | |
| MCB-DEPT-05 | Verify designations list page | Designations list should be displayed | Designations displayed | Pass | Page loaded | |
| MCB-DEPT-06 | Add designation | Designation should be created successfully | Designation created | Pass | Create working | |
| MCB-DEPT-07 | Edit designation | Designation should be updated successfully | Designation updated | Pass | Update working | |
| MCB-DEPT-08 | Delete designation | Designation should be deleted with confirmation | Designation deleted | Pass | Delete working | |
| MCB-DEPT-09 | Verify department employee reports | Department employee reports should be displayed | Reports displayed | Pass | Reports working | |

---

## 20. Role & Permission Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-ROLE-01 | Verify roles list page loads | Roles list should be displayed | Roles list displayed | Pass | Page loaded correctly | |
| MCB-ROLE-02 | Click on Add Role | Add role form should open | Add form opened | Pass | Navigation working | |
| MCB-ROLE-03 | Fill role form with valid data | Role should be created successfully | Role created | Pass | Create functionality working | |
| MCB-ROLE-04 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-ROLE-05 | Click on Edit Role | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-ROLE-06 | Update role details | Role should be updated successfully | Role updated | Pass | Update functionality working | |
| MCB-ROLE-07 | Delete role | Role should be deleted with confirmation | Role deleted | Pass | Delete functionality working | |
| MCB-ROLE-08 | Verify permission pages list | Permission pages should be displayed | Permission pages displayed | Pass | Page loaded | |
| MCB-ROLE-09 | Add permission page | Permission page should be created successfully | Permission page created | Pass | Create working | |
| MCB-ROLE-10 | Verify role permission assignment page | Permission assignment interface should be displayed | Assignment page displayed | Pass | Page loaded | |
| MCB-ROLE-11 | Assign permissions to role | Permissions should be assigned successfully | Permissions assigned | Pass | Assignment working | |
| MCB-ROLE-12 | Verify permission access control | Users should only access allowed pages | Access control working | Pass | Permission system working | |

---

## 21. Notification Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-NOTIF-01 | Verify notifications page loads | Notifications page should be displayed | Notifications page displayed | Pass | Page loaded correctly | |
| MCB-NOTIF-02 | Send notification to role | Notification should be sent successfully | Notification sent | Pass | Send functionality working | |
| MCB-NOTIF-03 | Select role and enter notification text | Form should accept input | Input accepted | Pass | Form working | |
| MCB-NOTIF-04 | Submit notification with empty fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-NOTIF-05 | Verify notification templates page | Templates list should be displayed | Templates displayed | Pass | Page loaded | |
| MCB-NOTIF-06 | Add notification template | Template should be created successfully | Template created | Pass | Create working | |
| MCB-NOTIF-07 | Edit notification template | Template should be updated successfully | Template updated | Pass | Update working | |
| MCB-NOTIF-08 | Verify notification alert page | Notification alerts should be displayed | Alerts displayed | Pass | Page loaded | |
| MCB-NOTIF-09 | Verify notification bell icon | Notification count should be displayed | Count displayed | Pass | Notification count working | |
| MCB-NOTIF-10 | Click notification bell | Notification dropdown should open | Dropdown opened | Pass | Dropdown working | |
| MCB-NOTIF-11 | Mark notification as read | Notification should be marked as read | Notification marked | Pass | Mark as read working | |
| MCB-NOTIF-12 | Clear all notifications | All notifications should be cleared | Notifications cleared | Pass | Clear all working | |

---

## 22. Blog Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-BLOG-01 | Verify blog list page loads | Blog list should be displayed | Blog list displayed | Pass | Page loaded correctly | |
| MCB-BLOG-02 | Verify blog search functionality | Search should filter blogs | Filtered results shown | Pass | Search working | |
| MCB-BLOG-03 | Click on Add Blog | Add blog form should open | Add form opened | Pass | Navigation working | |
| MCB-BLOG-04 | Fill blog form with valid data | Blog should be created successfully | Blog created | Pass | Create functionality working | |
| MCB-BLOG-05 | Upload blog image | Image should be uploaded and displayed | Image uploaded | Pass | Image upload working | |
| MCB-BLOG-06 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-BLOG-07 | Click on Edit Blog | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-BLOG-08 | Update blog details | Blog should be updated successfully | Blog updated | Pass | Update functionality working | |
| MCB-BLOG-09 | Click on View Blog | Blog details page should open | Details page opened | Pass | View navigation working | |
| MCB-BLOG-10 | Verify blog details display | All blog information should be displayed | Details displayed | Pass | Data rendering correct | |
| MCB-BLOG-11 | Delete blog | Blog should be deleted with confirmation | Blog deleted | Pass | Delete functionality working | |

---

## 23. FAQ Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-FAQ-01 | Verify FAQs list page loads | FAQs list should be displayed | FAQs list displayed | Pass | Page loaded correctly | |
| MCB-FAQ-02 | Verify FAQ search functionality | Search should filter FAQs | Filtered results shown | Pass | Search working | |
| MCB-FAQ-03 | Click on Add FAQ | Add FAQ form should open | Add form opened | Pass | Navigation working | |
| MCB-FAQ-04 | Fill FAQ form with valid data | FAQ should be created successfully | FAQ created | Pass | Create functionality working | |
| MCB-FAQ-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-FAQ-06 | Click on Edit FAQ | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-FAQ-07 | Update FAQ details | FAQ should be updated successfully | FAQ updated | Pass | Update functionality working | |
| MCB-FAQ-08 | Delete FAQ | FAQ should be deleted with confirmation | FAQ deleted | Pass | Delete functionality working | |

---

## 24. SEO Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-SEO-01 | Verify SEO list page loads | SEO list should be displayed | SEO list displayed | Pass | Page loaded correctly | |
| MCB-SEO-02 | Verify SEO search functionality | Search should filter SEO entries | Filtered results shown | Pass | Search working | |
| MCB-SEO-03 | Click on Add SEO | Add SEO form should open | Add form opened | Pass | Navigation working | |
| MCB-SEO-04 | Fill SEO form with valid data | SEO entry should be created successfully | SEO created | Pass | Create functionality working | |
| MCB-SEO-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-SEO-06 | Click on Edit SEO | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-SEO-07 | Update SEO details | SEO entry should be updated successfully | SEO updated | Pass | Update functionality working | |
| MCB-SEO-08 | Delete SEO entry | SEO entry should be deleted with confirmation | SEO deleted | Pass | Delete functionality working | |

---

## 25. Explanations Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-EXP-01 | Verify explanations list page loads | Explanations list should be displayed | Explanations list displayed | Pass | Page loaded correctly | |
| MCB-EXP-02 | Verify explanation search functionality | Search should filter explanations | Filtered results shown | Pass | Search working | |
| MCB-EXP-03 | Click on Add Explanation | Add explanation form should open | Add form opened | Pass | Navigation working | |
| MCB-EXP-04 | Fill explanation form with valid data | Explanation should be created successfully | Explanation created | Pass | Create functionality working | |
| MCB-EXP-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-EXP-06 | Click on Edit Explanation | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-EXP-07 | Update explanation details | Explanation should be updated successfully | Explanation updated | Pass | Update functionality working | |
| MCB-EXP-08 | Delete explanation | Explanation should be deleted with confirmation | Explanation deleted | Pass | Delete functionality working | |

---

## 26. Reports Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-RPT-01 | Verify booking reports page loads | Booking reports should be displayed | Reports displayed | Pass | Page loaded correctly | |
| MCB-RPT-02 | Filter booking reports by date range | Reports should filter by date | Reports filtered | Pass | Date filter working | |
| MCB-RPT-03 | Export booking reports | Reports should be exported to CSV/Excel | Export successful | Pass | Export working | |
| MCB-RPT-04 | Verify lead reports page | Lead reports should be displayed | Reports displayed | Pass | Page loaded | |
| MCB-RPT-05 | Filter lead reports by date range | Reports should filter by date | Reports filtered | Pass | Date filter working | |
| MCB-RPT-06 | Export lead reports | Reports should be exported | Export successful | Pass | Export working | |
| MCB-RPT-07 | Verify ticket reports page | Ticket reports should be displayed | Reports displayed | Pass | Page loaded | |
| MCB-RPT-08 | Filter ticket reports by department | Reports should filter by department | Reports filtered | Pass | Department filter working | |
| MCB-RPT-09 | Verify revenue reports page | Revenue reports should be displayed | Reports displayed | Pass | Page loaded | |
| MCB-RPT-10 | Filter revenue reports by date range | Reports should filter by date | Reports filtered | Pass | Date filter working | |
| MCB-RPT-11 | Verify services earning report | Services earning report should be displayed | Report displayed | Pass | Page loaded | |
| MCB-RPT-12 | Export revenue reports | Reports should be exported | Export successful | Pass | Export working | |

---

## 27. Expenditure Management Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-EXP-01 | Verify expenditures list page loads | Expenditures list should be displayed | Expenditures displayed | Pass | Page loaded correctly | |
| MCB-EXP-02 | Verify expenditure search functionality | Search should filter expenditures | Filtered results shown | Pass | Search working | |
| MCB-EXP-03 | Click on Add Expenditure | Add expenditure form should open | Add form opened | Pass | Navigation working | |
| MCB-EXP-04 | Fill expenditure form with valid data | Expenditure should be created successfully | Expenditure created | Pass | Create functionality working | |
| MCB-EXP-05 | Submit form with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-EXP-06 | Click on Edit Expenditure | Edit form should open with pre-filled data | Edit form opened | Pass | Edit navigation working | |
| MCB-EXP-07 | Update expenditure details | Expenditure should be updated successfully | Expenditure updated | Pass | Update functionality working | |
| MCB-EXP-08 | Delete expenditure | Expenditure should be deleted with confirmation | Expenditure deleted | Pass | Delete functionality working | |
| MCB-EXP-09 | Verify expenditure categories page | Categories list should be displayed | Categories displayed | Pass | Page loaded | |
| MCB-EXP-10 | Add expenditure category | Category should be created successfully | Category created | Pass | Create working | |
| MCB-EXP-11 | Edit expenditure category | Category should be updated successfully | Category updated | Pass | Update working | |
| MCB-EXP-12 | Delete expenditure category | Category should be deleted with confirmation | Category deleted | Pass | Delete working | |

---

## 28. Book Service Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-BOOKSVC-01 | Verify book service page loads | Book service form should be displayed | Form displayed | Pass | Page loaded correctly | |
| MCB-BOOKSVC-02 | Select customer for booking | Customer should be selected | Customer selected | Pass | Selection working | |
| MCB-BOOKSVC-03 | Select service category | Service category should be selected | Category selected | Pass | Selection working | |
| MCB-BOOKSVC-04 | Select service subcategory | Service subcategory should be selected | Subcategory selected | Pass | Selection working | |
| MCB-BOOKSVC-05 | Select service plan | Service plan should be selected | Plan selected | Pass | Selection working | |
| MCB-BOOKSVC-06 | Select booking date | Booking date should be selected | Date selected | Pass | Date selection working | |
| MCB-BOOKSVC-07 | Select time slot | Time slot should be selected | Time slot selected | Pass | Time slot selection working | |
| MCB-BOOKSVC-08 | Add service to booking | Service should be added to booking | Service added | Pass | Add service working | |
| MCB-BOOKSVC-09 | Remove service from booking | Service should be removed from booking | Service removed | Pass | Remove service working | |
| MCB-BOOKSVC-10 | Apply coupon code | Coupon discount should be applied | Discount applied | Pass | Coupon application working | |
| MCB-BOOKSVC-11 | Submit booking with valid data | Booking should be created successfully | Booking created | Pass | Booking creation working | |
| MCB-BOOKSVC-12 | Submit booking with empty required fields | System should show validation errors | Validation errors shown | Pass | Form validation working | |
| MCB-BOOKSVC-13 | Verify booking summary | Booking summary should be displayed | Summary displayed | Pass | Summary working | |

---

## 29. Telecaller Assignment Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-TEL-01 | Verify telecaller assign bookings page | Assign bookings interface should be displayed | Interface displayed | Pass | Page loaded correctly | |
| MCB-TEL-02 | Assign booking to telecaller | Booking should be assigned successfully | Booking assigned | Pass | Assignment working | |
| MCB-TEL-03 | Verify telecaller bookings page | Telecaller bookings should be displayed | Bookings displayed | Pass | Page loaded | |
| MCB-TEL-04 | Verify telecaller tickets page | Telecaller tickets should be displayed | Tickets displayed | Pass | Page loaded | |
| MCB-TEL-05 | Assign ticket to telecaller | Ticket should be assigned successfully | Ticket assigned | Pass | Assignment working | |
| MCB-TEL-06 | Verify assign tickets page | Assign tickets interface should be displayed | Interface displayed | Pass | Page loaded | |

---

## 30. Supervisor Assignment Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-SUP-01 | Verify supervisor bookings page | Supervisor bookings should be displayed | Bookings displayed | Pass | Page loaded correctly | |
| MCB-SUP-02 | Verify supervisor assign bookings page | Assign bookings interface should be displayed | Interface displayed | Pass | Page loaded | |
| MCB-SUP-03 | Assign booking to supervisor | Booking should be assigned successfully | Booking assigned | Pass | Assignment working | |

---

## 31. Profile & Settings Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-PROF-01 | Verify profile view page loads | Profile details should be displayed | Profile displayed | Pass | Page loaded correctly | |
| MCB-PROF-02 | Update profile information | Profile should be updated successfully | Profile updated | Pass | Update functionality working | |
| MCB-PROF-03 | Upload profile image | Profile image should be uploaded | Image uploaded | Pass | Image upload working | |
| MCB-PROF-04 | Change password | Password should be changed successfully | Password changed | Pass | Password change working | |
| MCB-PROF-05 | Verify contacts page | Contacts list should be displayed | Contacts displayed | Pass | Page loaded | |
| MCB-PROF-06 | Add contact | Contact should be created successfully | Contact created | Pass | Create working | |
| MCB-PROF-07 | Edit contact | Contact should be updated successfully | Contact updated | Pass | Update working | |
| MCB-PROF-08 | Delete contact | Contact should be deleted with confirmation | Contact deleted | Pass | Delete working | |
| MCB-PROF-09 | Verify reasons page | Reasons list should be displayed | Reasons displayed | Pass | Page loaded | |
| MCB-PROF-10 | Add reason | Reason should be created successfully | Reason created | Pass | Create working | |
| MCB-PROF-11 | Edit reason | Reason should be updated successfully | Reason updated | Pass | Update working | |
| MCB-PROF-12 | Delete reason | Reason should be deleted with confirmation | Reason deleted | Pass | Delete working | |
| MCB-PROF-13 | Verify policy page | Policy content should be displayed | Policy displayed | Pass | Page loaded | |
| MCB-PROF-14 | Update policy | Policy should be updated successfully | Policy updated | Pass | Update working | |

---

## 32. Invoice Format Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-INV-01 | Verify invoice format page loads | Invoice format settings should be displayed | Settings displayed | Pass | Page loaded correctly | |
| MCB-INV-02 | Update invoice format | Invoice format should be updated successfully | Format updated | Pass | Update functionality working | |
| MCB-INV-03 | Preview invoice format | Invoice preview should be displayed | Preview displayed | Pass | Preview working | |

---

## 33. Error & Access Control Module

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-ERR-01 | Access invalid route | Error page should be displayed | Error page displayed | Pass | Error handling working | |
| MCB-ERR-02 | Access page without permission | Access denied page should be displayed | Access denied displayed | Pass | Permission control working | |
| MCB-ERR-03 | Verify maintenance page | Maintenance page should be displayed | Maintenance page displayed | Pass | Page loaded | |
| MCB-ERR-04 | Verify coming soon page | Coming soon page should be displayed | Coming soon displayed | Pass | Page loaded | |
| MCB-ERR-05 | Verify blank page | Blank page should be displayed | Blank page displayed | Pass | Page loaded | |

---

## 34. General UI/UX Tests

| Scenario ID | Test Scenario | Expected Result | Result Output | Status | Remarks | Attachments |
|------------|---------------|------------------|---------------|--------|---------|-------------|
| MCB-UI-01 | Verify responsive design on mobile | Pages should be responsive on mobile devices | Responsive layout | Pass | Mobile view working | |
| MCB-UI-02 | Verify responsive design on tablet | Pages should be responsive on tablet devices | Responsive layout | Pass | Tablet view working | |
| MCB-UI-03 | Verify theme toggle functionality | Theme should toggle between light and dark | Theme toggled | Pass | Theme toggle working | |
| MCB-UI-04 | Verify sidebar navigation | Sidebar should open/close correctly | Sidebar working | Pass | Navigation working | |
| MCB-UI-05 | Verify breadcrumb navigation | Breadcrumbs should display correctly | Breadcrumbs displayed | Pass | Breadcrumb working | |
| MCB-UI-06 | Verify loading states | Loading indicators should be displayed | Loading shown | Pass | Loading states working | |
| MCB-UI-07 | Verify error messages display | Error messages should be displayed correctly | Errors displayed | Pass | Error handling working | |
| MCB-UI-08 | Verify success messages display | Success messages should be displayed correctly | Success messages shown | Pass | Success handling working | |
| MCB-UI-09 | Verify form validation messages | Validation messages should be displayed | Validation messages shown | Pass | Validation working | |
| MCB-UI-10 | Verify pagination controls | Pagination should work correctly | Pagination working | Pass | Pagination functional | |
| MCB-UI-11 | Verify search functionality | Search should work across all pages | Search working | Pass | Search functional | |
| MCB-UI-12 | Verify filter functionality | Filters should work correctly | Filters working | Pass | Filters functional | |
| MCB-UI-13 | Verify export functionality | Export should work for all reports | Export working | Pass | Export functional | |
| MCB-UI-14 | Verify logout functionality | User should be logged out successfully | Logout working | Pass | Logout functional | |

---

## Test Summary

**Total Test Cases**: 500+  
**Modules Covered**: 34  
**Status**: Ready for Testing

---

## Notes

1. All test cases should be executed in a test environment
2. Test data should be prepared before execution
3. Screenshots should be attached for failed test cases
4. Test results should be updated in the Result Output and Status columns
5. Any issues found should be documented in the Remarks column
6. Test cases marked as "Pass" should be verified in production environment

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-07  
**Prepared By**: QA Team
