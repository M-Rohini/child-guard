📖 PROJECT NAME: Child-Guard

🧩 ABOUT THE PROJECT
Child-Guard is a comprehensive web application designed to protect children from abuse and provide immediate support through digital tools such as AI-based journaling, professional directories, and emergency resources.

🌟 KEY FEATURES
- 🔐 Role-based Secure Authentication (Child, Parent, Professional)
- 📝 AI-Powered Journal System with Risk Detection
- 📊 Child Safety Assessment Tool
- 👥 Verified Professional Directory (Doctors, Counselors, Lawyers)
- 🏠 Safe Shelter Finder
- 🤖 24/7 Smart Chatbot with POCSO Info
- 🚨 Emergency Helpline Access

🛠️ TECH STACK
Frontend:
- HTML5, CSS3, JavaScript (ES6+)
- Responsive Design (Mobile-First)

Backend:
- Node.js, Express.js
- MongoDB with Mongoose
- JWT Authentication, bcryptjs for Security

🔒 SECURITY
- JWT Token-based Authentication
- Role-based Access Control
- Secure Password Hashing
- Input Validation & Sanitization
- CORS Configuration

📁 PROJECT STRUCTURE
child-guard/
├── data/                # JSON data files
├── scripts/             # Database seeding
├── routes/              # Express routes
├── controllers/         # Business logic
├── css/                 # Stylesheets
├── js/                  # Frontend scripts
├── server.js            # Main server file
├── package.json         # Dependencies
└── .env                 # Environment variables

🎯 MAIN PAGES
Public:
- index.html – Landing Page
- login.html – User Login
- signup.html – Registration
- resources.html – Child Safety Resources
- contact.html – Support Page

Protected (Login Required):
- dashboard.html – User Dashboard
- journal.html – Secure Journal
- assessment.html – Safety Assessment
- professionals.html – Find Experts
- shelters.html – Safe Shelter Information

🚀 SETUP INSTRUCTIONS
1. Install Node.js and MongoDB
2. Clone Repository:
   git clone https://github.com/your-username/child-guard.git
3. Navigate:
   cd child-guard
4. Install Dependencies:
   npm install
5. Configure `.env` file:
   MONGODB_URI=mongodb://localhost:27017/childguard
   JWT_SECRET=your_secret_key
   PORT=5000
6. Seed Database:
   node scripts/seedProfessionals.js
   node scripts/seedShelters.js
7. Run Application:
   npm start

🌐 LOCAL ACCESS
Frontend: http://localhost:5500  
Backend:  http://localhost:5000

🔧 API ENDPOINTS
- POST /api/auth/signup — Register
- POST /api/auth/login — Login
- POST /api/journal/entry — Submit Journal Entry
- POST /api/assessment/submit — Submit Safety Assessment
- GET /api/professionals — List Professionals
- GET /api/shelters — List Shelters
- POST /api/chat/db-response — Chatbot Interaction

👥 USER ROLES
Child: Journal, Assessment, Emergency Access  
Parent: Child Features + Professional & Shelter Access  
Professional: Specialized Resource Access

📞 EMERGENCY CONTACTS
🚨 Police: 100  
🆘 Childline: 1098  
👩 Women Helpline: 181  
🏥 Ambulance: 108  

📄 LICENSE
Licensed under the MIT License.

🛡️ "Protecting Children, Empowering Communities"
Built with ❤️ for a Safer Tomorrow
