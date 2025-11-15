# TODO: Integrate Facebook Leads API in LeadsLayer.jsx

- [x] Update fetchLeads function to fetch data from `/api/ServiceLeads/FacebookLeads` instead of dummy data
- [x] Modify columns array: Remove S.No. column, update selectors to use FullName, PhoneNumber, CreatedDate, Email, City, LeadStatus, remove Description column
- [x] Update filteredLeads filter logic to search in FullName, PhoneNumber, Email, City, LeadStatus
- [x] Adjust date formatting and filtering to use CreatedDate
- [x] Update status cell rendering to use LeadStatus
- [x] Update status filter options to match LeadStatus values (CREATED, CONTACTED, etc.)
- [x] Add Action column with link to update lead page using lead Id
