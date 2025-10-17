# Hospital Management System - Admin Account Creation

## Quick Admin Creation (Replace with your details)

```bash
curl -X POST https://web-production-68a4f3.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username_here",
    "email": "your_email@example.com", 
    "password": "your_secure_password_here",
    "firstName": "Your",
    "lastName": "Name", 
    "employeeId": "ADMIN001",
    "department": "Administration",
    "role": "Admin",
    "phone": "123-456-7890",
    "shift": "Day"
  }'
```

## Example Admin Creation

```bash
curl -X POST https://web-production-68a4f3.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hospitaladmin",
    "email": "admin@medcare.com",
    "password": "SecureAdmin123!",
    "firstName": "Hospital",
    "lastName": "Administrator",
    "employeeId": "ADMIN001",
    "department": "Administration", 
    "role": "Admin",
    "phone": "555-0123",
    "shift": "Day"
  }'
```

## Admin Permissions
Admin accounts have full access to:
- ✅ Create, read, update, delete patients
- ✅ Create, read, update, delete rooms
- ✅ Create, read, update, delete users
- ✅ Create, read, update, delete reports
- ✅ Create, read, update, delete settings

## Login Credentials
After creation, you can login with:
- Email: your_email@example.com
- Password: your_secure_password_here