🏙️ Civic Reporter - Complete Project Documentation
> **An AI-powered civic complaint system** that revolutionizes how citizens report urban infrastructure issues. Upload a photo, AI auto-detects the problem, generates formal complaints, routes to appropriate authorities, and tracks resolution status in real-time.
---
📚 Table of Contents
Project Overview
Problem Statement & Solution
Tech Stack
System Architecture
Key Features
Installation & Setup
Project Structure
Backend Deep Dive
Frontend Deep Dive
Database Schema
API Documentation
Authentication & Authorization
AI Integration
Workflow & User Journey
---
Project Overview
Civic Reporter is a full-stack web application that bridges the gap between citizens and municipal authorities. It simplifies the process of reporting civic issues (potholes, garbage, broken streetlights, drainage problems, etc.) by leveraging AI to auto-detect problems from images, generate formal complaint letters, intelligently route complaints to the correct authority, and provide real-time tracking.
Core Purpose
For Citizens: Report issues effortlessly with just a photo and location
For Authorities: Receive complaints with AI-verified details, proper formatting, and geographic context
For Admins: Manage, verify, and update complaint status with complete audit trails
---
Problem Statement & Solution
❌ The Problem
Citizens observe civic issues daily (potholes, broken streetlights, garbage dumps), but reporting is complex and discouraging:
No standardized way to report
Formal letters need to be drafted manually
Unclear which authority to contact
No tracking mechanism
Low accountability
✅ Our Solution
Photo Upload → Citizen takes a photo + drops a map pin
AI Analysis → Gemini Vision API detects problem type, severity, confidence
Auto-Generation → AI generates formal complaint letter with proper addressing
Authority Detection → System identifies correct authority (Gram Panchayat, Municipal Council, or Corporation) based on location
Complaint Submission → Complaint is saved to database with timeline tracking
Citizen Engagement → Other citizens can upvote complaints to increase priority
Admin Dashboard → Admins can verify, add after-images, mark as resolved, add remarks
Notifications → Citizens get real-time updates about status changes
---
Tech Stack
Frontend
Layer	Technology
Framework	React 19.2.4 with Vite 8.0.1
Styling	Tailwind CSS 4.2.2
Maps	Google Maps API + @react-google-maps/api
Animations	Framer Motion 12.38.0
UI Components	Lucide React Icons, React Hot Toast
State Management	React Context API
Authentication	Firebase Auth (Email/Password)
Database (Client)	Firebase Firestore
HTTP Client	Axios 1.14.0
PDF Generation	html2pdf.js
Charts	Recharts 3.8.1
Router	React Router DOM 7.13.2
Backend
Layer	Technology
Runtime	Node.js (ES Modules)
Framework	Express.js 5.2.1
Database	MongoDB 7.1.1 with Mongoose 9.3.2
Authentication	Firebase Admin SDK 13.8.0
AI/ML	Google Generative AI (Gemini 2.5 Flash)
Image Storage	Cloudinary 1.41.3 with Multer
File Upload	multer 2.1.1, multer-storage-cloudinary
HTTP Client	Axios 1.13.6
Middleware	CORS 2.8.6
Environment	dotenv 17.3.1
Infrastructure & Services
Component	Service
Authentication	Firebase Authentication
Database	MongoDB Atlas (Cloud)
Storage	Cloudinary (Image CDN)
Geolocation	Nominatim (OpenStreetMap - Free)
AI/Vision	Google Gemini 2.5 Flash API
Maps	Google Maps API
Frontend Deployment	Vercel
Backend Deployment	Render
---
System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      USER LAYER                              │
│  Citizens | Admins | Municipal Officers                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                      │
│  ┌──────────────────────────────────────────────────────────┐
│  │ Pages: Home, Submit, Dashboard, Details, Admin, Auth     │
│  │ Components: Navbar, ComplaintCard, Maps, Modals          │
│  │ Context: AuthContext (Firebase)                           │
│  │ Services: API calls via Axios with Firebase Tokens       │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                    ↓ (RESTful API)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                         │
│  ┌──────────────────────────────────────────────────────────┐
│  │ Routes:                                                   │
│  │  • /api/complaints → CRUD, upvote, status updates        │
│  │  • /api/ai → Image analysis, translation                 │
│  │  • /api/upload → Cloudinary image uploads                │
│  │  • /api/authority → Geocoding, authority detection       │
│  │  • /api/users → User management, role promotion          │
│  │  • /api/notifications → Complaint updates                │
│  ├──────────────────────────────────────────────────────────┤
│  │ Middleware:                                               │
│  │  • authMiddleware → Verify Firebase ID token             │
│  │  • adminMiddleware → Check for admin role                │
│  │  • multer + cloudinary → Image upload & storage          │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
          ↓               ↓               ↓
    ┌─────────┐    ┌──────────────┐    ┌────────────┐
    │ MongoDB │    │ Firebase     │    │ Cloudinary │
    │ (Data)  │    │ (Auth/Users) │    │ (Images)   │
    └─────────┘    └──────────────┘    └────────────┘
```
---
Key Features
🎯 For Citizens
One-Click Reporting: Take a photo, drop a pin, AI does the rest
AI-Generated Letters: Formal, properly formatted complaint letters auto-generated
Authority Detection: System identifies correct authority automatically
Multi-Language Support: View complaint letters in 13+ Indian languages
Upvote System: Increase priority of critical issues
Real-Time Tracking: Monitor complaint status (Pending → In Progress → Resolved)
Timeline View: See all updates and admin remarks with timestamps
Anonymous Option: Report without creating account (if enabled)
PDF Export: Download complaint letter as PDF
👨‍💼 For Admins
Complaint Dashboard: All complaints in one place
Severity Filtering: View by High/Medium/Low priority
Map View: Visual geographic distribution of issues
Status Management: Update complaint status with timeline tracking
After-Image Upload: Add proof of resolution
Verification Controls: Mark complaints as Verified/Suspicious/Rejected
Admin Remarks: Add notes visible to citizens
User Management: Promote/demote users, manage admin requests
Analytics Dashboard: Charts showing status distribution, severity breakdown
Batch Operations: Manage multiple complaints efficiently
PDF Report Generation: Export complaints with details
🔐 Security Features
Firebase Authentication: Email/password signup & login
ID Token Verification: Every API request requires valid Firebase token
Role-Based Access Control (RBAC):
Citizens: Can submit and view their complaints
Admins: Can manage all complaints, users, and settings
Admin Promotion Flow: Citizens can request admin access, existing admins approve
Firestore User Profiles: Central record of user roles and permissions
📍 Geographic Intelligence
GPS Location Detection: Auto-detect user's location (with permission)
Reverse Geocoding: Convert coordinates to structured address via Nominatim
Authority Detection Logic:
Match location against dataset of Municipal Corporations (cities)
Match against Municipal Councils
Fallback to Gram Panchayat for villages
Confidence scoring (30-95%)
Manual Override: Users can manually select authority type if auto-detection fails
---
Installation & Setup
Prerequisites
Node.js 16+ and npm/yarn
MongoDB Atlas account (or local MongoDB)
Firebase project with Auth & Firestore enabled
Google Cloud project (for Gemini AI & Maps APIs)
Cloudinary account (for image storage)
Backend Setup
Clone and Install
```bash
cd backend
npm install
```
Create `.env` file
```env
# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/civic-reporter

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/...

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=5000
NODE_ENV=production
```
Download Firebase Service Account Key
Go to Firebase Console → Project Settings → Service Accounts
Generate new private key
Save as `serviceAccountKey.json` in backend folder
Or populate `.env` with individual fields
Start Backend Server
```bash
npm start
# Server runs on http://localhost:5000
```
Frontend Setup
Clone and Install
```bash
cd frontend
npm install
```
Create `.env.local` file
```env
# Firebase Client Config (public keys)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=civic-reporter.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=civic-reporter
VITE_FIREBASE_STORAGE_BUCKET=civic-reporter.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=G-ABC...

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# Backend API
VITE_API_URL=http://localhost:5000/api
```
Start Frontend Dev Server
```bash
npm run dev
# Runs on http://localhost:5173
```
Build for Production
```bash
npm run build
npm run preview
```
---
Project Structure
```
civic-reporter/
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   ├── cloudinary.js             # Cloudinary config
│   │   └── firebaseAdmin.js          # Firebase Admin SDK
│   │
│   ├── middleware/
│   │   └── auth.js                  # Firebase token verification + role checking
│   │
│   ├── models/
│   │   ├── Complaint.js             # MongoDB complaint schema + validation
│   │   └── Notification.js          # User notification schema
│   │
│   ├── routes/
│   │   ├── complaint.js             # GET/POST/PATCH complaints
│   │   ├── ai.js                    # Gemini analysis & translation
│   │   ├── authority.js             # Geocoding & authority detection
│   │   ├── upload.js                # Cloudinary image upload
│   │   ├── users.js                 # User management & RBAC
│   │   └── notification.js          # Notification CRUD
│   │
│   ├── data/
│   │   └── authorityData.js         # Municipal corporations, councils, villages
│   │
│   ├── server.js                    # Express app setup & route mounting
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation with auth
│   │   │   ├── ComplaintCard.jsx    # Reusable complaint display card
│   │   │   ├── UploadBox.jsx        # Drag-drop image upload
│   │   │   ├── Loader.jsx           # Loading spinner
│   │   │   ├── StatusTracker.jsx    # Complaint timeline display
│   │   │   ├── FAB.jsx              # Floating action button (Submit)
│   │   │   ├── ProtectedRoute.jsx   # Auth guard for routes
│   │   │   └── Admin/
│   │   │       └── PDFReport.jsx    # PDF generation for complaints
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page with features
│   │   │   ├── Login.jsx            # Email/password login
│   │   │   ├── Signup.jsx           # User registration
│   │   │   ├── Submit.jsx           # Main complaint submission flow
│   │   │   ├── Dashboard.jsx        # Map view of all complaints
│   │   │   ├── Details.jsx          # Single complaint details
│   │   │   ├── MyComplaints.jsx     # User's submitted complaints
│   │   │   └── Admin.jsx            # Admin control panel
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Firebase auth state + user data
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + API calls
│   │   │
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase client config
│   │   │
│   │   ├── hooks/
│   │   │   └── useLocation.js       # Browser geolocation hook
│   │   │
│   │   ├── utils/
│   │   │   └── departments.js       # Department mapping utilities
│   │   │
│   │   ├── App.jsx                  # Main app component with routing
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.css                  # Global styles
│   │   └── index.css                # Base styles
│   │
│   ├── public/                      # Static assets
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── eslint.config.js             # ESLint rules
│   └── .env.local                   # Environment variables
│
├── firestore.rules                  # Firestore security rules (if using)
├── README.md                        # Quick start guide
└── COMPREHENSIVE_README.md          # This file
```
---
Backend Deep Dive
Server Entry Point (`server.js`)
```javascript
// Initializes Express app, sets up DNS, loads environment variables,
// connects to MongoDB, and mounts all routes

Key Setup:
- DNS: Uses Cloudflare (1.1.1.1) and Google (8.8.8.8) for reliability
- CORS: Enabled for cross-origin requests from frontend
- JSON Parsing: All requests parsed as JSON
- Route Mounting:
  - /api/ai → AI analysis & translation
  - /api/complaints → Complaint CRUD & interactions
  - /api/upload → Image upload to Cloudinary
  - /api/authority → Authority detection & geocoding
  - /api/users → User & admin management
  - /api/notifications → Notification CRUD
- Port: 5000 (or PORT env variable)
```
Database Configuration (`config/db.js`)
```javascript
// Connects to MongoDB using Mongoose
// Uses MONGO_URI from .env
// Connection pooling handled automatically
```
Firebase Admin Config (`config/firebaseAdmin.js`)
```javascript
// Initializes Firebase Admin SDK for backend
// Used for:
// - ID token verification (from frontend)
// - Firestore user collection queries (for roles)
// - Firebase Auth operations (custom claims, user management)
```
Authentication Middleware (`middleware/auth.js`)
`authMiddleware`
Protects all protected routes:
Extracts JWT from `Authorization: Bearer <token>` header
Verifies token using Firebase Admin SDK
Queries Firestore `users` collection to get user's role
Attaches `req.user` with `{ uid, email, role, name }`
Next middleware called or 401 returned if invalid
`adminMiddleware`
Checks if authenticated user has admin role:
Verifies `req.user.role === 'admin'`
Returns 403 if user is not admin
Next middleware called if authorized
---
Complaint Model (`models/Complaint.js`)
```javascript
complaintSchema = {
  // Image & Content
  imageUrl: String,                    // Cloudinary URL (required)
  afterImageUrl: String,               // After-resolution image
  
  // AI Detected Information
  problemType: String,                 // pothole, garbage, streetlight, drainage, other
  severity: Enum(["Low", "Medium", "High"]),
  confidence: Number,                  // 0-1 from AI confidence
  description: String,                 // AI-generated brief description
  formalLetter: String,                // AI-generated formal complaint letter
  hindiDescription: String,            // Optional Hindi description
  
  // User Information
  userId: String,                      // Firebase UID (from auth context)
  userName: String,                    // Display name (default: "Anonymous")
  
  // Authority Information (AI Detected)
  department: String,                  // e.g., "Municipal Department"
  authorityType: Enum([                // gram_panchayat, municipal_council, or
    "gram_panchayat",                  //   municipal_corporation
    "municipal_council",
    "municipal_corporation"
  ]),
  authorityBody: String,               // Full authority name
  translatedLetter: String,            // Translated formal letter
  translatedLanguage: String,          // Language code (hi, mr, ta, etc.)
  
  // Geographic Information
  location: {
    lat: Number,
    lng: Number,
    address: String                    // Reverse geocoded address
  },
  
  // Status Tracking
  status: Enum(["Pending", "In Progress", "Resolved"]), // Workflow state
  upvotes: Number,                     // Upvote count
  upvotedBy: [String],                 // Array of user UIDs who upvoted
  
  // Timeline (Audit Trail)
  timeline: [{
    status: String,                    // Status at this point in time
    updatedBy: String,                 // Name of user who made update
    remarks: String,                   // Update notes or remark
    timestamp: Date                    // When update happened
  }],
  
  // Verification
  verificationStatus: Enum([           // AI or admin verification result
    "Pending",
    "Verified",
    "Suspicious",
    "Rejected"
  ]),
  verificationConfidence: Number,      // Confidence in verification (0-1)
  
  // Metadata
  createdAt: Date,                     // Auto timestamp
  
  // Virtual Fields (not stored)
  locationArray: [lat, lng]            // For map rendering
}

Pre-Save Hook:
- If new complaint, auto-add initial "Pending" entry to timeline
- Records that complaint was "logged into the system"
```
Notification Model (`models/Notification.js`)
```javascript
notificationSchema = {
  userId: String,                      // Firebase UID of recipient
  message: String,                     // Notification text
  type: String,                        // 'status_update' or 'admin_remark'
  complaintId: String,                 // Link to complaint
  read: Boolean,                       // Read status (default: false)
  createdAt: Date                      // Auto timestamp
}
```
---
API Routes
Complaints Routes (`routes/complaint.js`)
Method	Endpoint	Auth	Admin	Purpose
GET	`/`	❌	❌	Get all complaints (sorted by recency)
GET	`/:id`	❌	❌	Get single complaint by ID
GET	`/user/:userId`	❌	❌	Get user's submitted complaints
POST	`/`	✅	❌	Create new complaint
PATCH	`/:id`	✅	✅	Update complaint (admin only)
PATCH	`/:id/upvote`	✅	❌	Toggle upvote on complaint
Key Features:
GET `/`: Returns all complaints sorted by date (newest first), transforms data for map rendering
GET `/user/:userId`: Used in "My Complaints" page
POST `/`: Auth required; auto-fills location if provided; saves with initial "Pending" timeline entry
PATCH `/:id`: Admin-only; updates status and creates timeline entry; notifies user if status changed
PATCH `/:id/upvote`: Auth required; each user can upvote once; tracks upvoters to prevent duplicates
---
AI Routes (`routes/ai.js`)
Method	Endpoint	Auth	Purpose
POST	`/analyze`	❌	Analyze image and generate complaint
POST	`/translate`	❌	Translate formal letter to target language
POST `/analyze` - Main AI Processing
```
Input:
{
  imageUrl: "https://...",           // Cloudinary image URL
  userName: "John Doe" (optional),   // Complainant name
  locationAddress: "Delhi" (optional), // Location name
  authorityInfo: {...}               // Authority context
}

Process:
1. Fetch image from Cloudinary URL, convert to base64
2. Call Google Gemini 2.5 Flash with vision capabilities
3. Use detailed prompt:
   - Strict rules: only detect CLEAR problems
   - Ignore shadows, lighting artifacts, unclear patterns
   - Categorize: pothole, garbage, streetlight, drainage, other, None
   - Output: JSON with {problemType, severity, confidence, description, formalLetter}
4. Parse JSON response, handle markdown formatting
5. Calculate priority: (severityScore × 10)
   - High = 3 → priority 30
   - Medium = 2 → priority 20
   - Low = 1 → priority 10

Output:
{
  problemType: "pothole",
  severity: "High",
  description: "Large pothole visible on main road",
  formalLetter: "To, The Municipal Commissioner, ...",
  priority: 30,
  confidence: 0.92,
  imageUrl: "https://..."
}

Retry Logic:
- If Gemini returns 503 error, retry up to 3 times with 2-second delay
- Falls back to generic response if all attempts fail
```
POST `/translate` - Letter Translation
```
Input:
{
  text: "formal letter text...",
  targetLanguage: "hi" // hi, mr, ta, te, kn, ml, bn, gu, pa, or, as, ur
}

Uses Gemini API to translate the formal letter to target language
Output: Translated letter text
```
---
Authority Routes (`routes/authority.js`)
Method	Endpoint	Purpose
POST	`/detect`	Detect authority based on coordinates
POST `/detect` - Authority Detection Algorithm
```
Input: { lat, lng }

Algorithm:
1. Reverse Geocode (Nominatim)
   - Call OpenStreetMap's free Nominatim service
   - Get structured address components:
     - village, town, city, suburb, district, state, country
     - placeType, placeClass, displayName

2. Authority Detection Strategy (in priority order)
   a) Match city/town/suburb/village against Municipal Corporations dataset
      - If found → return "municipal_corporation", confidence 95%
   b) Match against Municipal Councils dataset
      - If found → return "municipal_council", confidence 90%
   c) Check for village keywords (village, hamlet, gaon, etc.)
      - If found → return "gram_panchayat", confidence 70%
   d) Check for urban keywords (city, town, sector, etc.)
      - If found → return "municipal_council", confidence 60%
   e) Fallback → return "gram_panchayat", confidence 30%

3. Generate Letter Header
   - Based on authority type and address components
   - Format for Gram Panchayat: "To, The Sarpanch, Gram Panchayat [name], Taluka [name], District [name]"
   - Format for Municipal Council: "To, The Chief Officer, Municipal Council [name], District [name]"
   - Format for Corporation: "To, The Municipal Commissioner, Municipal Corporation [name]"

Output:
{
  authorityType: "municipal_corporation",
  authorityTitle: "The Municipal Commissioner",
  authorityBody: "Municipal Corporation Mumbai",
  letterHeader: "To, The Municipal Commissioner, ...",
  confidence: 95,
  detectionMethod: "dataset_corporation",
  address: {...}  // Structured address from geocoding
}
```
Key Data:
`authorityData.js` contains:
100+ Municipal Corporation entries (major cities)
60+ Municipal Council entries (smaller towns)
Keywords for village vs urban classification
---
Upload Routes (`routes/upload.js`)
Method	Endpoint	Purpose
POST	`/`	Upload image to Cloudinary
POST `/` - Image Upload
```
Input: multipart/form-data with image file

Process:
1. Multer middleware stores file temporarily
2. Upload to Cloudinary using their SDK
3. Return secure CDN URL

Output:
{
  imageUrl: "https://res.cloudinary.com/civic/image/upload/v123/abc.jpg"
}
```
---
Users Routes (`routes/users.js`)
Method	Endpoint	Auth	Admin	Purpose
GET	`/`	✅	✅	Get all users
PUT	`/promote/:uid`	✅	✅	Promote user to admin
PUT	`/demote/:uid`	✅	✅	Demote admin to citizen
POST	`/request-admin`	✅	❌	Request admin access
GET	`/admin-requests`	✅	✅	Get pending admin requests
Key Operations:
GET `/`: Returns all users from Firestore
POST `/request-admin`: Creates pending request in `adminRequests` collection
PUT `/promote/:uid`: Updates role to "admin", sets Firebase custom claims
PUT `/demote/:uid`: Updates role to "citizen", prevents self-demotion
---
Notifications Routes (`routes/notification.js`)
Handles notification CRUD operations for user updates.
---
Frontend Deep Dive
Architecture Overview
The frontend is a React SPA using:
Context API for global authentication state
React Router for page navigation
Axios with Firebase token interceptor for API calls
Framer Motion for page transitions and animations
Tailwind CSS for styling
Google Maps API for geographic visualization
Authentication Flow (`context/AuthContext.jsx`)
```javascript
// Global auth state manager using React Context

Key Functionality:
1. Listen to Firebase Auth state changes
   - onAuthStateChanged: Triggered on login, logout, page refresh

2. Fetch Firestore user document
   - Get user role (citizen vs admin)
   - Cache in context for instant access

3. Signup function
   - Create Firebase Auth user (email/password)
   - Create Firestore user doc with role: 'citizen' (force default)
   - Return user data

4. Login function
   - Sign in with Firebase Auth
   - Fetch Firestore user doc
   - Get Firebase ID token (auto-refreshed)

5. Logout function
   - Sign out from Firebase
   - Clear local state

6. Helper: getIdToken()
   - Returns current user's Firebase ID token
   - Token is sent in every API request as "Authorization: Bearer <token>"

7. Helper: refreshUserData()
   - Manually refresh Firestore user doc (useful after role changes)

Context exports:
{
  user: Firebase Auth user object,
  userData: { uid, name, email, role, ... },
  loading: boolean (auth state resolving),
  signup: async (name, email, password) => userData,
  login: async (email, password) => userData,
  logout: async () => void,
  getIdToken: async () => token,
  refreshUserData: async () => void
}
```
Axios API Service (`services/api.js`)
```javascript
// Central API client with Firebase token interceptor

Configuration:
- Base URL: Backend API (http://localhost:5000/api for dev)
- Interceptor: Auto-attaches Firebase ID token to every request
  - Header: "Authorization: Bearer <firebase-id-token>"
  - Only if user is logged in

Key API Functions:
- uploadImage(file) → uploads to Cloudinary via backend
- analyzeImage(file, context) → sends to Gemini AI
- checkDuplicate(problemType, location) → checks for similar complaints
- createComplaint(data) → POST new complaint
- updateComplaint(id, data) → PATCH complaint
- getComplaints() → GET all complaints
- getComplaintById(id) → GET single complaint
- getComplaintsByUser(userId) → GET user's complaints
- upvoteComplaint(id) → PATCH upvote
- detectAuthority(lat, lng) → POST authority detection
- translateLetter(text, language) → POST translation
- getUsers() → GET all users (admin)
- promoteUser(uid) → PUT promote user
- demoteUser(uid) → PUT demote user
- requestAdminAccess() → POST admin request
- getAdminRequests() → GET pending requests
- approveAdminRequest(uid) → PUT approve
- rejectAdminRequest(uid) → DELETE reject
```
---
Pages
Home Page (`pages/Home.jsx`)
Landing page with project overview
Features showcase
Call-to-action buttons (Get Started, Login)
Hero section with animations
Feature cards explaining the system
Login Page (`pages/Login.jsx`)
Email/password login form
Firebase authentication
Redirect to dashboard on success
Link to signup page
Error handling with toast notifications
Signup Page (`pages/Signup.jsx`)
User registration form
Name, email, password inputs
Form validation
Firebase account creation
Firestore user document creation (role: citizen)
Auto-login after signup
Submit Page (`pages/Submit.jsx`)
The main complaint submission workflow - Multi-step process:
```
Step 1: Image Upload
├── Drag-drop or click to select image
├── Preview before upload
├── Validate file size & format

Step 2: AI Analysis
├── Upload to Cloudinary
├── Call Gemini API to analyze
├── Get: problemType, severity, description, formalLetter, confidence
├── Display preview of detected information
└── Allow user to modify if needed

Step 3: Location & Authority
├── Get user's GPS location (with permission prompt)
├── Reverse geocode to get address
├── Auto-detect authority (Gram Panchayat, Council, or Corporation)
├── Show detection confidence
├── Allow manual override
└── Auto-generate letter header with correct addressing

Step 4: Translation (Optional)
├── Dropdown with 13+ Indian languages
├── Call Gemini to translate formal letter
├── Display translated version
└── User can select which version to submit

Step 5: Final Review & Submit
├── Review all information
├── Add optional "After Image" URL
├── Submit to create complaint in MongoDB
├── Get complaint ID
└── Show success with PDF download option
```
Key Features:
Google Maps integration for marker placement
Location auto-detection with fallback
Authority type override for manual selection
Multi-language support with real-time translation
PDF export of formal letter
Progress tracking with step indicators
Toast notifications for errors/success
Dashboard Page (`pages/Dashboard.jsx`)
Interactive map view of all complaints
```
Layout:
┌──────────────────────────────────────┐
│ Filters: All | High | Medium | Low   │
├──────────────────────────────────────┤
│                                      │
│      Google Map with Markers         │
│      (color-coded by severity)       │
│                                      │
├──────────────────────────────────────┤
│ Stats: Pending | In Progress | Done  │
└──────────────────────────────────────┘

Features:
- Color markers: Red (High), Yellow (Medium), Green (Low)
- Click marker → Info window with complaint summary
- Filter buttons to show only certain severities
- Auto-zoom to fit all markers
- Real-time update of stats
- Responsive layout for mobile
```
Details Page (`pages/Details.jsx`)
Single complaint detailed view
```
Displays:
├── Image (before and after)
├── Problem type and severity
├── Formal complaint letter (with copy button)
├── Location on map
├── Timeline (Pending → In Progress → Resolved)
│  ├── Status update entries
│  ├── Admin remarks
│  └── Timestamps
├── Upvote button (toggle with user's status)
├── Upvote count
├── User information
├── Department information
├── Authority information

Admin Features (if logged in as admin):
├── Update status dropdown
├── Upload after image
├── Add verification status
├── Add admin remark modal
├── View user details
└── Export as PDF
```
MyComplaints Page (`pages/MyComplaints.jsx`)
Displays only complaints submitted by current user
Shows status, severity, date
Quick access to details page
Upvote count visible
Filter/sort options
Delete option (if not resolved)
Admin Page (`pages/Admin.jsx`)
Comprehensive admin control panel with 4 main tabs:
Tab 1: Dashboard
Stats cards: Total, Pending, In Progress, Resolved
Pie chart of status distribution
Bar chart of severity breakdown
Complaint list view (sortable by severity/date)
Modal for:
Marking as resolved (requires after-image URL)
Changing verification status
Adding admin remarks
Tab 2: Complaints Map
Full-screen Google Map
All complaints as markers (color-coded)
Click marker → Info window with quick actions
Zoom/pan to explore
Dark theme styling
Tab 3: Users Management
List of all users with roles
Promote/demote buttons
List of pending admin requests
Approve/reject admin request buttons
Search/filter users
Tab 4: Analytics (if applicable)
Complaint distribution charts
Timeline of submissions
Severity trends
Department breakdown
Export report as PDF
---
Components
Navbar (`components/Navbar.jsx`)
Logo/brand
Navigation links (Home, Dashboard, Submit, MyComplaints)
Admin panel link (if user is admin)
User menu (profile, logout)
Auth state display
Mobile hamburger menu
ComplaintCard (`components/ComplaintCard.jsx`)
Reusable card displaying complaint summary
Problem type icon
Severity badge (color-coded)
Location
Status indicator
Upvote count
Click to view details
Used in: Dashboard, MyComplaints
UploadBox (`components/UploadBox.jsx`)
Drag-drop file upload area
File validation
Progress indicator
Preview thumbnail
Clear/reset button
Loader (`components/Loader.jsx`)
Loading spinner animation
Used during API calls and data fetching
StatusTracker (`components/StatusTracker.jsx`)
Visual timeline of complaint status
Shows: Pending → In Progress → Resolved
Displays admin remarks at each step
Timestamp for each update
Current status highlighted
FAB (`components/FAB.jsx`)
Floating Action Button (fixed at bottom-right)
Links to submit page
Quick access to create new complaint
Only visible when logged in
ProtectedRoute (`components/ProtectedRoute.jsx`)
Route guard for authenticated pages
Redirects to login if not authenticated
Optional role check for admin pages
Prevents unauthorized access
PDFReport (`components/Admin/PDFReport.jsx`)
Generates PDF of complaint with all details
Downloads as PDF file
Includes images, letter, timeline
---
Hooks
useLocation (`hooks/useLocation.js`)
```javascript
Hook for browser geolocation

Features:
- detectLocation() → requests user permission, gets GPS coordinates
- Returns: { lat, lng, address, loading, error }
- Automatically updates when location changes
- Error handling for permission denied
- Fallback to default location (Delhi: 28.6139, 77.2090)
```
---
Utilities
departments.js
Maps issue types to departments
Suggests appropriate authority based on problem
Used during complaint creation
---
Database Schema
MongoDB Collections
1. complaints
```
{
  _id: ObjectId,
  imageUrl: String,
  afterImageUrl: String,
  problemType: String,
  severity: String,
  priority: Number,
  description: String,
  formalLetter: String,
  hindiDescription: String,
  userId: String,
  userName: String,
  department: String,
  authorityType: String,
  authorityBody: String,
  translatedLetter: String,
  translatedLanguage: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  status: String,
  upvotes: Number,
  upvotedBy: [String],
  timeline: [{
    status: String,
    updatedBy: String,
    remarks: String,
    timestamp: Date
  }],
  verificationStatus: String,
  verificationConfidence: Number,
  createdAt: Date
}

Indexes (recommended):
- userId (for quick lookup of user's complaints)
- status (for filtering by status)
- createdAt (for sorting by date)
- location (for geospatial queries)
```
2. notifications
```
{
  _id: ObjectId,
  userId: String,
  message: String,
  type: String,
  complaintId: String,
  read: Boolean,
  createdAt: Date
}

Indexes:
- userId (for user's notifications)
- read (for unread filter)
```
Firebase Firestore Collections
1. users
```
/users/{uid}
{
  uid: String,
  name: String,
  email: String,
  role: String, // 'citizen' or 'admin'
  createdAt: String (ISO),
  adminRequestStatus: String (optional), // 'pending', 'approved', 'rejected'
}
```
2. adminRequests (optional)
```
/adminRequests/{uid}
{
  uid: String,
  name: String,
  email: String,
  status: String, // 'pending', 'approved', 'rejected'
  requestedAt: String (ISO),
}
```
---
API Documentation
Base URL
Development: `http://localhost:5000/api`
Production: `https://civic-reporter.onrender.com/api`
Authentication
All protected endpoints require:
```
Authorization: Bearer <firebase-id-token>
```
Token obtained from Firebase client SDK and auto-added by Axios interceptor.
Error Responses
All errors return JSON:
```json
{
  "message": "Error description"
}
```
Complaint Endpoints
GET /complaints
Get all complaints
```
Response:
[
  {
    id: "...",
    problemType: "pothole",
    severity: "High",
    status: "Pending",
    location: [lat, lng],
    locationAddress: "...",
    upvotes: 5,
    createdAt: "2024-01-15T10:30:00Z",
    ...
  },
  ...
]
```
GET /complaints/:id
Get single complaint
```
Response:
{
  id: "...",
  imageUrl: "...",
  afterImageUrl: "...",
  problemType: "pothole",
  severity: "High",
  description: "...",
  formalLetter: "...",
  location: [lat, lng],
  status: "In Progress",
  upvotes: 10,
  upvotedBy: ["uid1", "uid2"],
  timeline: [
    {
      status: "Pending",
      updatedBy: "System",
      remarks: "Complaint logged into the system.",
      timestamp: "2024-01-15T10:30:00Z"
    },
    {
      status: "In Progress",
      updatedBy: "Admin Name",
      remarks: "Assigned to team",
      timestamp: "2024-01-16T09:00:00Z"
    }
  ],
  verificationStatus: "Verified",
  verificationConfidence: 0.95,
  ...
}
```
GET /complaints/user/:userId
Get user's complaints
```
Response: Same as GET /complaints but filtered by userId
```
POST /complaints
Create new complaint (Auth Required)
```
Input:
{
  imageUrl: "...",
  problemType: "pothole",
  severity: "High",
  description: "...",
  formalLetter: "...",
  hindiDescription: "..." (optional),
  userId: "..." (optional, from token),
  userName: "John Doe" (optional),
  location: {
    lat: 28.6139,
    lng: 77.2090,
    address: "Delhi"
  },
  department: "Municipal Department" (optional)
}

Response:
{
  id: "...",
  status: "Pending",
  createdAt: "2024-01-15T10:30:00Z",
  timeline: [
    {
      status: "Pending",
      updatedBy: "System",
      remarks: "Complaint logged into the system.",
      timestamp: "2024-01-15T10:30:00Z"
    }
  ],
  ...
}
```
PATCH /complaints/:id
Update complaint (Auth + Admin Required)
```
Input:
{
  status: "Resolved" (optional),
  verificationStatus: "Verified" (optional),
  adminRemarks: "..." (optional),
  afterImageUrl: "..." (optional),
  priority: 50 (optional)
}

Response:
{
  id: "...",
  status: "Resolved",
  timeline: [
    ...existing entries,
    {
      status: "Resolved",
      updatedBy: "Admin Name",
      remarks: "Status updated to Resolved",
      timestamp: "2024-01-17T14:20:00Z"
    }
  ],
  ...
}

Side Effects:
- If status changed: Create notification for citizen
- If admin remarks added: Create notification
- Timestamp entry added to timeline
```
PATCH /complaints/:id/upvote
Toggle upvote (Auth Required)
```
Response:
{
  id: "...",
  upvotes: 6,
  upvotedBy: ["uid1", "uid2", "uid3"],
  ...
}

Logic:
- First call: Add user to upvotedBy, increment upvotes
- Second call: Remove user from upvotedBy, decrement upvotes
```
AI Endpoints
POST /ai/analyze
Analyze image with Gemini AI
```
Input:
{
  imageUrl: "https://res.cloudinary.com/...",
  userName: "John Doe" (optional),
  locationAddress: "Delhi" (optional),
  authorityInfo: {
    authorityType: "municipal_corporation",
    letterHeader: "To, The Municipal Commissioner, ...",
    ...
  } (optional)
}

Response:
{
  problemType: "pothole",
  severity: "High",
  description: "Large pothole visible on the main road",
  formalLetter: "To, The Municipal Commissioner,\n\nSubject: Complaint...",
  confidence: 0.95,
  priority: 30,
  imageUrl: "..."
}
```
POST /ai/translate
Translate formal letter
```
Input:
{
  text: "Formal letter text...",
  targetLanguage: "hi" // or mr, ta, te, kn, ml, bn, gu, pa, or, as, ur
}

Response:
{
  translatedText: "अनुवादित पत्र..."
}
```
Authority Endpoints
POST /authority/detect
Detect authority from coordinates
```
Input:
{
  lat: 28.6139,
  lng: 77.2090
}

Response:
{
  authorityType: "municipal_corporation",
  authorityTitle: "The Municipal Commissioner",
  authorityBody: "Municipal Corporation Mumbai",
  letterHeader: "To, The Municipal Commissioner,\nMunicipal Corporation Mumbai,...",
  confidence: 95,
  detectionMethod: "dataset_corporation",
  address: {
    village: "",
    town: "",
    city: "Mumbai",
    suburb: "Bandra",
    district: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postcode: "400050",
    displayName: "..."
  }
}
```
Upload Endpoints
POST /upload
Upload image to Cloudinary
```
Input:
multipart/form-data with "image" field

Response:
{
  imageUrl: "https://res.cloudinary.com/civic/image/upload/v123/abc.jpg"
}
```
User Endpoints
GET /users
Get all users (Auth + Admin Required)
```
Response:
[
  {
    id: "uid1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    createdAt: "2024-01-01T..."
  },
  ...
]
```
PUT /users/promote/:uid
Promote user to admin (Auth + Admin Required)
```
Response:
{
  message: "User promoted to admin successfully"
}
```
PUT /users/demote/:uid
Demote admin to citizen (Auth + Admin Required)
```
Response:
{
  message: "User demoted to citizen successfully"
}
```
POST /users/request-admin
Request admin access (Auth Required)
```
Response:
{
  message: "Admin access request submitted successfully"
}

Side Effect:
- Creates document in adminRequests collection
- Updates user's adminRequestStatus to 'pending'
```
GET /users/admin-requests
Get pending admin requests (Auth + Admin Required)
```
Response:
[
  {
    id: "uid1",
    name: "John Doe",
    email: "john@example.com",
    status: "pending",
    requestedAt: "2024-01-15T..."
  },
  ...
]
```
---
Authentication & Authorization
Firebase Authentication
Flow:
```
1. User signs up with email/password
   ├── Firebase Auth creates user
   ├── Firestore user doc created (role: citizen)
   └── ID token issued

2. User logs in with email/password
   ├── Firebase Auth verifies credentials
   ├── ID token issued (auto-refreshed when expires)
   └── User data fetched from Firestore

3. Every API request includes token
   ├── Axios interceptor adds to Authorization header
   ├── Backend verifies token with Firebase Admin SDK
   ├── Token contains uid and email
   └── User role fetched from Firestore

4. User logs out
   └── Token cleared from local storage
```
Role-Based Access Control (RBAC)
Roles:
`citizen`: Default role, can submit complaints and upvote
`admin`: Can manage complaints, users, and verify issues
Permission Matrix:
Action	Citizen	Admin
View all complaints	✅	✅
Submit complaint	✅	✅
View own complaints	✅	✅
Update complaint status	❌	✅
Verify complaint	❌	✅
Add admin remark	❌	✅
Upload after image	❌	✅
View all users	❌	✅
Promote/demote users	❌	✅
Request admin access	✅	❌
Approve admin requests	❌	✅
Admin Promotion Flow:
```
1. Citizen clicks "Request Admin Access"
   ├── POST /users/request-admin
   ├── Creates entry in adminRequests collection
   └── adminRequestStatus: 'pending'

2. Admin reviews pending requests
   ├── GET /users/admin-requests
   └── Shows all pending approval requests

3. Admin approves/rejects request
   ├── PUT /users/promote/:uid or /users/demote/:uid
   ├── Firestore role updated to 'admin'
   ├── Firebase custom claims updated
   └── User must refresh to see admin access

4. On next login/token refresh
   ├── User sees admin panel
   └── Can access admin-protected routes
```
---
AI Integration
Google Gemini Vision API
Used for:
Image analysis and problem detection
Formal letter generation
Text translation
Key Parameters:
```javascript
Model: "gemini-2.5-flash"
Temperature: 0.2 (low for consistency)
Input: Image + detailed prompt
```
Image Analysis Prompt:
```
Strict rules:
- Only detect CLEAR problems
- Ignore shadows, lighting, reflections
- Recognize: pothole, garbage, streetlight, drainage, other
- If unsure → return "None"

Output JSON with:
- problemType
- severity (low, medium, high)
- confidence (0-1)
- description (2-3 lines)
- formalLetter (formatted complaint)
```
Confidence Scoring:
High severity + clear issue: 0.9+
Medium severity: 0.75
Low severity: 0.6
Fallback: 0.5
Error Handling:
503 Service Unavailable: Retry up to 3 times with 2-second delay
Parse errors: Return generic response
All failures: Graceful fallback with confidence 0
Translation
Supports 13 Indian Languages:
English (en)
Hindi (hi)
Marathi (mr)
Tamil (ta)
Telugu (te)
Kannada (kn)
Malayalam (ml)
Bengali (bn)
Gujarati (gu)
Punjabi (pa)
Odia (or)
Assamese (as)
Urdu (ur)
Translation Process:
```
1. User selects language in Submit flow
2. Click "Translate" button
3. Call POST /ai/translate with formal letter + language code
4. Gemini translates to target language
5. Display translated version (alongside English)
6. Submit with chosen language version
```
---
Workflow & User Journey
Citizen Journey: Reporting a Complaint
```
┌─────────────────────────────────────────────────────────┐
│ 1. HOME PAGE / LANDING                                  │
│    └─ Click "Get Started" or "Report Issue Now"         │
└─────────────────────────────────────────────────────────┘
                          ↓
                  [Not Logged In?]
                    ↓          ↓
              LOGIN / SIGNUP  OR  CONTINUE ANONYMOUS
                    ↓          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SUBMIT PAGE - STEP 1: UPLOAD IMAGE                  │
│    ├─ Drag-drop or click to select image               │
│    ├─ Preview image                                     │
│    └─ Click "Next"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SUBMIT PAGE - STEP 2: AI ANALYSIS                   │
│    ├─ Image uploaded to Cloudinary                      │
│    ├─ Gemini API analyzes:                              │
│    │   ├─ Problem type (pothole, garbage, etc)          │
│    │   ├─ Severity (Low/Medium/High)                    │
│    │   ├─ Description                                   │
│    │   └─ Formal complaint letter                       │
│    ├─ Display preview of detected info                  │
│    ├─ User can edit description/letter                  │
│    └─ Click "Next"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SUBMIT PAGE - STEP 3: LOCATION & AUTHORITY          │
│    ├─ Auto-detect user's GPS location                   │
│    │   (with permission prompt)                         │
│    ├─ Show on Google Map with marker                    │
│    ├─ Auto-detect authority:                            │
│    │   ├─ Reverse geocode coordinates                   │
│    │   ├─ Match against authority datasets              │
│    │   ├─ Show detected type + confidence               │
│    │   └─ Allow manual override                         │
│    ├─ Auto-generate letter header                       │
│    └─ Click "Next"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. SUBMIT PAGE - STEP 4: TRANSLATION (Optional)        │
│    ├─ English version displayed by default              │
│    ├─ Dropdown to select language                       │
│    ├─ Click "Translate" → Gemini translates             │
│    ├─ Display translated version                        │
│    └─ Click "Next"                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. SUBMIT PAGE - STEP 5: FINAL REVIEW                  │
│    ├─ Review all information:                           │
│    │   ├─ Image thumbnail                               │
│    │   ├─ Problem type + severity                       │
│    │   ├─ Description                                   │
│    │   ├─ Formal letter (full text)                     │
│    │   ├─ Location map                                  │
│    │   ├─ Authority info                                │
│    │   └─ Language selected                             │
│    ├─ Optional: Add after-image URL                     │
│    ├─ Click "Submit Complaint"                          │
│    └─ Loading...                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. COMPLAINT CREATED                                    │
│    ├─ Saved to MongoDB with:                            │
│    │   ├─ Status: "Pending"                             │
│    │   ├─ Timeline entry: System logged complaint       │
│    │   └─ All metadata                                  │
│    ├─ User redirected to Details page                   │
│    ├─ Show success toast                                │
│    ├─ Option to download PDF                            │
│    └─ Option to "View on Dashboard"                     │
└─────────────────────────────────────────────────────────┘
```
Citizen Journey: Tracking Complaint
```
┌─────────────────────────────────────────────────────────┐
│ User logs in → Clicks "My Complaints"                   │
│ ├─ Fetch GET /complaints/user/:userId                   │
│ └─ Display list of user's complaints                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Click complaint → View Details page                      │
│ ├─ Fetch GET /complaints/:id                            │
│ └─ Display full details + timeline                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ TIMELINE SHOWS:                                         │
│ ├─ 2024-01-15 10:30 AM: Pending                        │
│ │   "System logged into the system"                     │
│ │                                                       │
│ ├─ 2024-01-16 09:00 AM: In Progress                    │
│ │   "Team assigned. Survey scheduled."                  │
│ │   (Admin Name)                                        │
│ │                                                       │
│ └─ 2024-01-18 03:30 PM: Resolved                       │
│     "Pothole fixed and road resurfaced."                │
│     + After-image showing fix                           │
│     (Admin Name)                                        │
└─────────────────────────────────────────────────────────┘
```
Admin Journey: Managing Complaints
```
┌─────────────────────────────────────────────────────────┐
│ Admin logs in → Clicks "Admin Panel"                    │
│ (Must have role: 'admin' in Firestore)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAB 1: DASHBOARD                      │
│ ├─ Stats: 15 Total | 8 Pending | 5 In Progress | 2 Done│
│ ├─ Pie chart of status distribution                     │
│ ├─ Bar chart of severity breakdown                      │
│ ├─ List of all complaints (sorted by severity)          │
│ └─ Each row shows: ID, Type, Severity, Status, User    │
└─────────────────────────────────────────────────────────┘
                          ↓
              [Admin Actions on Complaints]
                    ↓           ↓
        ┌──────────────────────────────────┐
        │ Update Status:                   │
        │ Pending → In Progress (no modal) │
        │ In Progress → Resolved (modal)   │
        │                                  │
        │ Modal prompts for:               │
        │ - After image URL (optional)     │
        │ - Remark/note                    │
        │ - Click Submit                   │
        │                                  │
        │ Timeline entry created:          │
        │ "Status: Resolved, By: Admin..." │
        │ Notification sent to citizen     │
        └──────────────────────────────────┘
                    ↓
        ┌──────────────────────────────────┐
        │ Verify Complaint:                │
        │ - Manual verification check      │
        │ - Mark as Verified/Suspicious/   │
        │   Rejected                       │
        │ - Admin notes                    │
        │ - Timeline recorded              │
        └──────────────────────────────────┘
                    ↓
        ┌──────────────────────────────────┐
        │ Add Admin Remark:                │
        │ - Text input modal               │
        │ - Add to timeline                │
        │ - Notify citizen                 │
        │ - Visible on citizen's view      │
        └──────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAB 2: MAP VIEW                       │
│ ├─ Full-screen Google Map                              │
│ ├─ All complaints as color-coded markers               │
│ │  Red (High) | Yellow (Medium) | Green (Low)          │
│ ├─ Click marker → Info window with:                    │
│ │   ├─ Complaint type                                  │
│ │   ├─ Status                                          │
│ │   ├─ Quick action buttons                            │
│ │   └─ Link to full details                            │
│ └─ Zoom/pan to explore                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - TAB 3: USERS                          │
│ ├─ List all users:                                      │
│ │   ├─ Name, Email, Role, Join Date                    │
│ │   ├─ Promote to Admin button                         │
│ │   └─ (if admin) Demote button                        │
│ │                                                       │
│ └─ Admin Requests section:                             │
│    ├─ Show pending requests                            │
│    ├─ Name, Email, Request Date                        │
│    ├─ Approve button (promotes to admin)               │
│    └─ Reject button (declines request)                 │
└─────────────────────────────────────────────────────────┘
```
Admin Journey: User Management
```
┌─────────────────────────────────────────────────────────┐
│ Citizen clicks "Request Admin Access"                   │
│ ├─ Creates document in adminRequests                    │
│ ├─ Updates user doc: adminRequestStatus = 'pending'     │
│ └─ Toast: "Request submitted. Awaiting approval."       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Existing Admin views Admin Panel → Users tab            │
│ ├─ GETadmin-requests                                    │
│ ├─ Shows all pending requests                           │
│ └─ Sees: "John Doe (john@example.com) - Requested 1/15"│
└─────────────────────────────────────────────────────────┘
                          ↓
         ┌──────────────────────────────────┐
         │ Admin clicks "Approve"           │
         │ ├─ PUT /users/promote/:uid       │
         │ ├─ Updates Firestore role to... │
         │ │   'admin'                      │
         │ ├─ Sets Firebase custom claims   │
         │ └─ Toast: "User promoted"        │
         └──────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ John's next login/page refresh:                         │
│ ├─ AuthContext re-fetches user data                     │
│ ├─ Sees role: 'admin' in Firestore                      │
│ └─ Admin Panel link now visible                         │
└─────────────────────────────────────────────────────────┘
```
---
Deployment
Frontend (Vercel)
```
Build: npm run build
Output: dist/ folder
Deployment:
1. Push to GitHub
2. Connect Vercel to GitHub repo
3. Vercel auto-deploys on push
4. Runs npm run build → Deploys dist/

Environment Variables (in Vercel):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- ... (all VITE_ prefixed variables)
- VITE_GOOGLE_MAPS_API_KEY
- VITE_API_URL (backend URL)
```
Backend (Render or Heroku)
```
1. Push code to GitHub
2. Connect Render/Heroku to GitHub repo
3. Set environment variables in dashboard
4. Deploy triggers on push

Environment Variables:
- MONGO_URI
- GEMINI_API_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- ... (all Firebase config)
- PORT (default 5000)
- NODE_ENV=production
```
---
Key Technical Decisions
Why Gemini 2.5 Flash?
Fast vision processing (low latency)
Accurate image detection
Good pricing for production scale
Reliable JSON output
Why Nominatim for Reverse Geocoding?
Free (no API key required)
No rate limits for reasonable usage
Provides structured address components
Fallback when Google Maps unavailable
Why Firebase Auth + Firestore Users?
Firebase handles secure authentication
Firestore scales automatically
Real-time capabilities (for future features)
Role-based security rules possible
Why MongoDB for Complaints?
Flexible schema (useful for varied complaint types)
Excellent for timeline/nested documents
Geospatial queries support (future)
Cloud backup with Atlas
Why Context API instead of Redux?
Project scale doesn't justify Redux overhead
AuthContext is simple and sufficient
Easy for team to understand
---
Future Enhancement Ideas
Real-Time Updates
WebSocket for live dashboard updates
Push notifications for app
Advanced Analytics
Department performance dashboards
Time-to-resolution metrics
Geographic hotspots
Mobile App
React Native version
Offline complaint drafts
Camera integration
AI Improvements
Before/after image comparison
Seasonal trend detection
Automated priority adjustment
Gamification
Badges for active reporters
Leaderboards by city
Reward system
Multi-Language UI
Entire interface in regional languages
Not just complaint letter translation
Authority Integration
Direct API connection to municipal systems
Automated complaint filing
Status sync from authority systems
Video Uploads
Support video complaints
AI frame extraction and analysis
---
Troubleshooting
Common Issues
Issue: "Unauthorized: Token verification failed"
Solution: Ensure Firebase token is valid and not expired
Check Authorization header format: `Bearer <token>`
Verify Firebase Admin SDK configuration
Issue: "Image upload fails"
Solution: Check Cloudinary credentials in .env
Verify image file size < 25MB
Check CORS settings for Cloudinary
Issue: "Authority detection not working"
Solution: Nominatim may be rate limited
Add delay between requests
Fallback to manual selection works
Issue: "Gemini API returns error"
Solution: Check GEMINI_API_KEY validity
Verify API is enabled in Google Cloud Console
Check quota limits
System has automatic retry logic
Issue: "MongoDB connection fails"
Solution: Verify MONGO_URI string is correct
Check IP whitelist in MongoDB Atlas
Ensure network allows connections
---
Support & Contribution
For issues or feature requests:
Check existing issues on GitHub
Create detailed bug reports with:
Steps to reproduce
Expected vs actual behavior
Environment info (OS, browser, Node version)
For features, explain use case and value
---
License
This project is open source. Check LICENSE file for details.
---
Happy Reporting! 🚀
For questions or clarifications about any component, refer to the inline code comments and the specific file documentation above.