# Hospital Management System - Deployment Information

## 🚀 Live Application URLs

### Frontend (Netlify)
- **URL**: https://visionary-brigadeiros-5fc1fd.netlify.app
- **Status**: ✅ Active
- **Framework**: Next.js with Tailwind CSS
- **Features**: Patient management, Room assignment, Real-time dashboard

### Backend API (Railway)
- **URL**: https://web-production-68a4f3.up.railway.app
- **Health Check**: https://web-production-68a4f3.up.railway.app/health
- **Status**: ⚠️ Currently Down (Needs Redeployment)
- **Framework**: Node.js/Express with MongoDB Atlas
- **Features**: RESTful API, JWT authentication, Socket.IO

### Repository
- **GitHub**: https://github.com/Divyansh0404/hospital-management
- **Status**: ✅ Updated with live URLs

## 🔐 Admin Credentials

**Personal Admin Account:**
```
Email: divyanshrustagi@gmail.com
Username: Divyansh97
Password: [Secure Password Set]
Role: Administrator
Employee ID: ADM001
```

**Setup Scripts Available:**
- `node scripts/setup-admin.js` - Interactive admin creation
- `node scripts/create-local-admin.js` - Quick local admin setup
- `./scripts/create-personal-admin.sh` - Bash script for admin creation

## 📊 System Status

| Service | URL | Status | Features |
|---------|-----|--------|----------|
| Frontend | [Netlify App](https://visionary-brigadeiros-5fc1fd.netlify.app) | ✅ Online | Patient & Room Management |
| Backend | [Railway API](https://web-production-68a4f3.up.railway.app) | ⚠️ Down | REST API & Authentication |
| Database | MongoDB Atlas | ✅ Connected | Patient & Room Data |

## 🏥 Available Features

- ✅ **Patient Management**: Add, view, update patients with active/past patient separation
- ✅ **Room Assignment**: Assign patients to available rooms
- ✅ **Enhanced Authentication**: Secure login with JWT tokens and "Remember Me" functionality
- ✅ **Real-time Updates**: Live room status via Socket.IO
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Patient History**: Separate tabs for active and discharged patients
- ✅ **Medical Records**: Track admission dates, discharge dates, and patient status
- ✅ **Smooth Navigation**: Client-side routing for seamless page transitions
- ✅ **Session Persistence**: Remember login state across browser sessions
- ✅ **Admin Account Management**: Personal admin account with full privileges
- ✅ **Clean UI**: Removed test credentials from login page for production use

## 🛠 Technical Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, Radix UI
**Backend**: Node.js, Express, MongoDB, Socket.IO
**Deployment**: Netlify (Frontend) + Railway (Backend)
**Database**: MongoDB Atlas (Cloud)

## 📈 Interview Demo Points

1. **Full-Stack Development**: Modern React/Node.js architecture with TypeScript
2. **Database Design**: MongoDB with proper schemas and relationships
3. **Enhanced Authentication**: JWT-based security with session persistence and "Remember Me"
4. **Real-time Features**: Socket.IO for live updates
5. **Responsive UI**: Modern design with Tailwind CSS and Radix UI components
6. **API Design**: RESTful endpoints with proper error handling
7. **Deployment**: Production deployment on cloud platforms (Netlify + Railway)
8. **User Experience**: Tabbed interface, smooth navigation, and clean login flow
9. **Data Management**: Patient history tracking with admission/discharge dates
10. **Security**: Personal admin accounts, secure password handling, token management
11. **Developer Experience**: TypeScript, modern React patterns, organized project structure

## 🛠 Admin Setup Scripts

### Available Scripts:
1. **Interactive Setup**: `node scripts/setup-admin.js`
   - Full interactive admin account creation
   - Password confirmation and validation
   - Cleanup guidance

2. **Quick Local Setup**: `node scripts/create-local-admin.js`
   - Pre-configured with your credentials
   - Works with local development server
   - Fast admin account creation

3. **Bash Script**: `./scripts/create-personal-admin.sh`
   - Shell-based admin creation
   - Cross-platform compatibility
   - Direct API interaction

4. **Test Cleanup**: `node scripts/cleanup-test-accounts.js [token]`
   - Removes test accounts from database
   - MongoDB cleanup commands
   - Requires admin authentication

---

*Last Updated: October 17, 2025*
*Enhanced with personal admin setup and improved authentication*
