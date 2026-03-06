# health+ - Mobile Health Monitoring Application

health+ is a comprehensive web-based health monitoring application designed specifically for patients managing chronic conditions such as hypertension, diabetes, and heart disease.

## 🌟 Features

### 1. **User Authentication & Profile Management**
- Secure user registration and login using Firebase Authentication
- Personal health profile with:
  - Full name
  - Age
  - Sex
  - Medical conditions (Hypertension, Diabetes, Heart Disease, Other)

### 2. **Health Data Tracking**
- Easy-to-use input forms for recording:
  - Blood Pressure (Systolic/Diastolic)
  - Heart Rate
  - Blood Sugar Level
  - Body Weight
  - Timestamp and optional notes for each measurement

### 3. **Interactive Dashboard**
- Real-time display of latest health metrics
- Visual analytics with Chart.js:
  - Blood pressure trends
  - Heart rate monitoring
  - Blood sugar tracking
  - Weight progression
- Quick overview cards showing current vital signs
- Enhanced charts with detailed tooltips and accurate timestamps

### 3.5. **🤖 AI-Powered Daily Insights** ⭐ NEW!
- Intelligent analysis of your health data
- Personalized recommendations based on your vitals
- Real-time assessment of:
  - Blood pressure status and trends
  - Heart rate evaluation
  - Blood sugar monitoring with variability analysis
  - Weight trend patterns
  - Overall health score (0-100%)
  - Tracking consistency evaluation
- Clinical guideline-based categorization
- Urgent alerts for dangerous vital signs
- Pattern recognition across multiple readings
- Evidence-based, actionable recommendations
- See [AI_INSIGHTS_GUIDE.md](AI_INSIGHTS_GUIDE.md) for detailed documentation

### 4. **Smart Reminders & Notifications**
- Create custom reminders for:
  - Medication intake
  - Vital sign measurements
  - Doctor appointments
  - Exercise routines
- Set specific date/time for each reminder
- Mark reminders as complete or delete them
- Visual notification system

### 5. **Health Education**
- Curated health tips organized by category:
  - Blood pressure management
  - Diabetes care
  - Heart health
  - General wellness
  - Healthy eating
  - Medication management
- Evidence-based recommendations and best practices

### 6. **Mobile-First Design**
- Responsive layout optimized for mobile devices
- Touch-friendly interface
- Works seamlessly on smartphones, tablets, and desktops

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase
  - Firebase Authentication (user management)
  - Cloud Firestore (database)
  - Firebase Analytics
- **UI Framework:** Bootstrap 4
- **Charts:** Chart.js
- **Icons:** Font Awesome

## 📂 Project Structure

```
lifecare-master/
├── index.html              # Landing page
├── login.html              # User login page
├── register.html           # User registration page
├── dashboard.html          # Main application dashboard
├── css/
│   ├── bootstrap.min.css   # Bootstrap styles
│   ├── custom.css          # Custom styles
│   └── ...
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── dashboard.js        # Dashboard functionality
│   └── ...
└── images/                 # Image assets
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Firebase services)
- A Firebase project (already configured in the code)

### Installation

1. **Download or clone the repository**
   ```bash
   git clone <repository-url>
   cd lifecare-master
   ```

2. **Serve the application**
   
   You can use any local web server. Here are a few options:

   **Option 1: Using Python**
   ```bash
   # Python 3
   python -m http.server 8000
   ```

   **Option 2: Using Node.js (http-server)**
   ```bash
   npm install -g http-server
   http-server -p 8000
   ```

   **Option 3: Using VS Code Live Server**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Open in browser**
   Navigate to `http://localhost:8000` (or the port you configured)

### First Time Setup

1. Visit the landing page at `index.html`
2. Click "Sign Up" or go to `register.html`
3. Fill in your personal information:
   - Full name
   - Age
   - Sex
   - Email
   - Medical condition(s)
   - Password
4. Click "Create Account"
5. You'll be automatically redirected to the dashboard

## 📱 How to Use

### Recording Health Data
1. Navigate to the "Add Data" tab
2. Enter your current measurements
3. Add the date/time of measurement
4. Optionally add notes
5. Click "Save Health Data"

### Viewing Trends
1. The "Overview" tab displays:
   - Latest vital signs in card format
   - Historical trends in interactive charts
   - Hover over chart points for detailed values

### Setting Reminders
1. Go to the "Reminders" tab
2. Click "+ Add Reminder"
3. Select reminder type
4. Enter title and date/time
5. Optionally add notes
6. Click "Save Reminder"
7. Mark reminders as complete or delete them as needed

### Learning Health Tips
1. Visit the "Health Tips" tab
2. Browse categorized health information
3. Read personalized recommendations for your condition

## 🔐 Security & Privacy

- All user authentication is handled securely through Firebase
- Passwords are encrypted and never stored in plain text
- Health data is stored in Firestore with user-specific access rules
- Data is transmitted over secure HTTPS connections
- Only you can access your personal health information

## 🔧 Firebase Configuration

The application is pre-configured with Firebase. If you need to use your own Firebase project:

1. Create a Firebase project at https://firebase.google.com
2. Enable Authentication (Email/Password) and Firestore
3. Update `js/firebase-config.js` with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 📊 Data Structure

### Users Collection
```javascript
{
  fullName: "John Doe",
  age: 45,
  sex: "male",
  email: "john@example.com",
  conditions: ["hypertension", "diabetes"],
  createdAt: "2026-02-22T10:00:00.000Z"
}
```

### Health Data Collection
```javascript
{
  userId: "user_id",
  timestamp: "2026-02-22T10:00:00.000Z",
  bloodPressure: {
    systolic: 120,
    diastolic: 80
  },
  heartRate: 72,
  bloodSugar: 95,
  weight: 70.5,
  notes: "Feeling good today",
  createdAt: "2026-02-22T10:00:00.000Z"
}
```

### Reminders Collection
```javascript
{
  userId: "user_id",
  type: "medication",
  title: "Take blood pressure medication",
  dateTime: "2026-02-22T14:00:00.000Z",
  notes: "After lunch",
  completed: false,
  createdAt: "2026-02-22T10:00:00.000Z"
}
```

## 🎯 Browser Support

- Chrome (recommended) - Latest
- Firefox - Latest
- Safari - Latest
- Edge - Latest
- Mobile browsers - iOS Safari, Chrome Mobile

## 📝 Future Enhancements

Potential features for future versions:
- Export health data to PDF/CSV
- Share reports with healthcare providers
- Integration with wearable devices
- Medication database with drug interactions
- Telemedicine appointment scheduling
- Emergency contact alerts
- Multi-language support
- Dark mode

## 🤝 Support

For questions or issues, please contact: info@healthplus.com

## 📄 License

This project is provided as-is for educational and personal health management purposes.

---

**Remember:** health+ is a personal health tracking tool and should not replace professional medical advice. Always consult with your healthcare provider for medical decisions.
