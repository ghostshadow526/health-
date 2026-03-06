# 🚀 Quick Start Guide - Running health+

## Easiest Method (Double-Click)

Simply **double-click** the `START.bat` file in this folder!

Your browser will automatically open to: `http://localhost:8000`

---

## Alternative Methods

### Method 1: PowerShell Script
```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

### Method 2: Python (if installed)
```powershell
python -m http.server 8000
```

### Method 3: Node.js (if installed)
```powershell
npx http-server -p 8000
```

---

## First Time Setup

1. **Start the server** using any method above
2. **Open browser** to: http://localhost:8000
3. **Click "Sign Up"** to create an account
4. **Fill in your health profile**:
   - Name, age, sex
   - Medical conditions
   - Email and password
5. **Start tracking** your health!

---

## Using the Application

### Adding Health Data
1. Login to your dashboard
2. Go to **"Add Data"** tab
3. Enter your vital signs:
   - Blood Pressure (e.g., 120/80)
   - Heart Rate (e.g., 72)
   - Blood Sugar (e.g., 95)
   - Weight (e.g., 70.5)
4. Click **"Save Health Data"**

### Viewing AI Insights
1. Return to **"Overview"** tab
2. See your personalized AI health insights
3. Review interactive charts showing trends
4. Read recommendations tailored to your data

### Setting Reminders
1. Go to **"Reminders"** tab
2. Click **"+ Add Reminder"**
3. Choose type (medication, measurement, appointment)
4. Set date/time
5. Save!

### Learning
1. Visit **"Health Tips"** tab
2. Browse health education content
3. Learn best practices for your condition

---

## Stopping the Server

Press **Ctrl+C** in the PowerShell window, or simply close the window.

---

## Troubleshooting

**Problem: Port 8000 already in use**
- Solution: Change the port number in `start-server.ps1` (line 4)
- Or kill the process using port 8000

**Problem: Browser doesn't open automatically**
- Solution: Manually open your browser and go to: http://localhost:8000

**Problem: Files not loading**
- Solution: Make sure you're in the correct folder when running the server
- The server must be run from the `lifecare-master` directory

**Problem: Firebase errors**
- Solution: Check your internet connection
- Verify Firebase configuration in `js/firebase-config.js`

---

## What's Inside

- 📱 **Mobile Health Monitoring App**
- 🤖 **AI-Powered Daily Insights**
- 📊 **Interactive Health Charts**
- ⏰ **Smart Reminders System**
- 📚 **Health Education Tips**
- 🔐 **Secure Firebase Backend**

---

## Support

For detailed documentation, see:
- [HEALTH_PLUS_README.md](HEALTH_PLUS_README.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Quick setup guide
- [AI_INSIGHTS_GUIDE.md](AI_INSIGHTS_GUIDE.md) - AI features explained

---

**Enjoy tracking your health with health+!** 💚
