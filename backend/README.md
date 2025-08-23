# Hospital Management System API Documentation

## Overview
This is the backend API for the Hospital Management System. It provides endpoints for managing patients, rooms, and authentication.

## Base URL
```
http://localhost:3001/api
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
```
**Access:** Admin only
**Body:**
```json
{
  "username": "john_doe",
  "email": "john@hospital.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "employeeId": "EMP001",
  "department": "ICU",
  "phone": "+1234567890",
  "role": "Doctor",
  "shift": "Morning"
}
```

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

#### Get Profile
```
GET /api/auth/profile
```
**Access:** Private

#### Update Profile
```
PUT /api/auth/profile
```
**Access:** Private

#### Change Password
```
PUT /api/auth/change-password
```
**Access:** Private

### Patient Endpoints

#### Create Patient
```
POST /api/patients
```
**Access:** Admin, Doctor, Nurse
**Body:**
```json
{
  "name": "Jane Smith",
  "age": 35,
  "condition": "Critical",
  "contactNumber": "+1234567890",
  "emergencyContact": {
    "name": "John Smith",
    "phone": "+1234567891",
    "relationship": "Spouse"
  },
  "medicalHistory": "No known allergies",
  "allergies": ["Penicillin"],
  "currentMedication": [
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "Daily"
    }
  ]
}
```

#### Get All Patients
```
GET /api/patients?page=1&limit=10&status=Admitted&condition=Critical&sortBy=priority&sortOrder=asc
```
**Access:** Private

#### Get Patient by ID
```
GET /api/patients/:id
```
**Access:** Private

#### Update Patient
```
PUT /api/patients/:id
```
**Access:** Admin, Doctor, Nurse

#### Discharge Patient
```
POST /api/patients/:id/discharge
```
**Access:** Admin, Doctor

#### Assign Room to Patient
```
POST /api/patients/:id/assign-room
```
**Access:** Admin, Doctor, Nurse
**Body:**
```json
{
  "roomId": "room_id_here"
}
```

#### Get Patients by Priority
```
GET /api/patients/priority?unassignedOnly=true
```
**Access:** Private

#### Auto-allocate Rooms
```
POST /api/patients/auto-allocate
```
**Access:** Admin, Doctor, Nurse

#### Get Patient Statistics
```
GET /api/patients/stats
```
**Access:** Private

### Room Endpoints

#### Create Room
```
POST /api/rooms
```
**Access:** Admin only
**Body:**
```json
{
  "roomNumber": "ICU-101",
  "type": "ICU",
  "floor": 1,
  "capacity": 1,
  "dailyRate": 500.00,
  "amenities": ["AC", "TV", "WiFi"],
  "equipment": [
    {
      "name": "Ventilator",
      "status": "Working"
    }
  ]
}
```

#### Get All Rooms
```
GET /api/rooms?page=1&limit=10&type=ICU&status=Available&floor=1&available=true
```
**Access:** Private

#### Get Room by ID
```
GET /api/rooms/:id
```
**Access:** Private

#### Update Room
```
PUT /api/rooms/:id
```
**Access:** Admin only

#### Delete Room
```
DELETE /api/rooms/:id
```
**Access:** Admin only

#### Assign Patient to Room
```
POST /api/rooms/:id/assign
```
**Access:** Admin, Doctor, Nurse
**Body:**
```json
{
  "patientId": "patient_id_here"
}
```

#### Release Room
```
POST /api/rooms/:id/release
```
**Access:** Admin, Doctor, Nurse

#### Get Available Rooms
```
GET /api/rooms/available?type=ICU&floor=1
```
**Access:** Private

#### Set Room Status
```
PUT /api/rooms/:id/status
```
**Access:** Admin, Staff, Nurse
**Body:**
```json
{
  "status": "Maintenance",
  "notes": "Air conditioning needs repair"
}
```

#### Get Room Statistics
```
GET /api/rooms/stats
```
**Access:** Private

#### Get Transfer Suggestions
```
GET /api/rooms/transfer-suggestions
```
**Access:** Admin, Doctor

### Dashboard Statistics
```
GET /api/stats
```
**Access:** Public (optional auth)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

## Socket.IO Events

### Real-time Events
- `patientAdmitted` - New patient admitted
- `patientUpdated` - Patient information updated
- `patientDischarged` - Patient discharged
- `roomAssigned` - Patient assigned to room
- `roomReleased` - Room released
- `roomStatusChanged` - Room status changed
- `autoAllocationComplete` - Auto-allocation completed

### Connection Events
- `connected` - Client connected to server
- `join-room` - Join room for updates
- `leave-room` - Leave room

## Error Codes
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Invalid or missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `500` - Internal Server Error

## Environment Variables
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
SOCKET_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12
```
