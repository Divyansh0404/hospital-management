# Hospital Management System

A modern, full-stack hospital management application built with Next.js, Node.js, and MongoDB.

## Features

- 🏥 Patient Management (Admit, Discharge, Transfer)
- 🏠 Room Management (Assignment, Status Tracking)
- 👥 User Authentication & Role-based Access
- 📊 Real-time Dashboard with Statistics
- 🔔 Live Notifications via Socket.IO
- 📱 Responsive Design with Modern UI

## Tech Stack

**Frontend:**
- Next.js 15.2.4
- TypeScript
- Tailwind CSS
- Radix UI Components
- Socket.IO Client

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO Server
- RESTful API

## Demo Credentials

- **Email**: test@hospital.com
- **Password**: test123

## Live Demo

- **Frontend**: [Hospital Management System](https://visionary-brigadeiros-5fc1fd.netlify.app)
- **API**: [Backend API](https://web-production-68a4f3.up.railway.app)
- **GitHub**: [Source Code](https://github.com/Divyansh0404/hospital-management)

## API Endpoints

- **Health Check**: `GET /health`
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`
- **Patients**: `GET /api/patients`, `POST /api/patients`, `PUT /api/patients/:id`
- **Rooms**: `GET /api/rooms`, `POST /api/rooms`, `PUT /api/rooms/:id`
- **Room Assignment**: `POST /api/patients/:id/assign-room`

## Deployment

**Frontend (Netlify):**
- URL: https://visionary-brigadeiros-5fc1fd.netlify.app
- Framework: Next.js with Tailwind CSS
- Features: Patient management, room assignment, real-time updates

**Backend (Railway):**
- URL: https://web-production-68a4f3.up.railway.app
- Framework: Node.js/Express with MongoDB Atlas
- Features: RESTful API, JWT authentication, Socket.IO

**Database:**
- MongoDB Atlas (Cloud)
- Collections: Users, Patients, Rooms
- Real-time data synchronization

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Divyansh0404/hospital-management.git
   cd hospital-management
   ```

2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

3. Set up environment variables (create `.env` files)

4. Run development servers:
   ```bash
   # Frontend (port 3000)
   npm run dev
   
   # Backend (port 3001)
   cd backend && npm start
   ```

## Contact

**Divyansh Rustagi**  
📧 dr9743@srmist.edu.in  
🔗 [GitHub](https://github.com/Divyansh0404)  
💼 [LinkedIn](https://linkedin.com/in/divyansh-rustagi) *(Add your LinkedIn)*
