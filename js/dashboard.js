import { auth, db, signOut, onAuthStateChanged, doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, updateDoc } from './firebase-config.js';

// Access Chart.js from global scope (loaded via CDN)
const Chart = window.Chart;

let currentUser = null;
let bpChart, hrChart, bsChart, weightChart;

function showToast(type, title, message = '') {
   const container = document.getElementById('toast-container');
   if (!container) return;
   const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
   const toast = document.createElement('div');
   toast.className = `toast toast-${type}`;
   toast.innerHTML = `
      <i class="fa ${icons[type] || 'fa-info-circle'} toast-icon"></i>
      <div class="toast-body">
         <div class="toast-title">${title}</div>
         ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>`;
   container.appendChild(toast);
   setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
   }, 4000);
}
let allHealthRecords = []; // Store all records for filtering
let currentFilter = 7; // Default to 7 days

// Check authentication
onAuthStateChanged(auth, async (user) => {
   if (user) {
      currentUser = user;
      await loadUserProfile();
      await loadHealthData();
      await loadReminders();
      loadHealthTips();
   } else {
      window.location.href = 'login.html';
   }
});

// Load user profile
async function loadUserProfile() {
   try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
         const userData = userDoc.data();
         document.getElementById('userName').textContent = userData.fullName;
         const avatarEl = document.getElementById('userAvatar');
         if (avatarEl) avatarEl.textContent = userData.fullName.charAt(0).toUpperCase();
         document.getElementById('welcomeMessage').textContent = userData.fullName;
         const welcomeAvatarEl = document.getElementById('welcomeAvatar');
         if (welcomeAvatarEl) welcomeAvatarEl.textContent = userData.fullName.charAt(0).toUpperCase();
      }
   } catch (error) {
      console.error('Error loading profile:', error);
   }
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
   try {
      await signOut(auth);
      window.location.href = 'login.html';
   } catch (error) {
      console.error('Logout error:', error);
   }
});

// Tab navigation
document.querySelectorAll('.nav-link').forEach(tab => {
   tab.addEventListener('click', () => {
      // Update active tab
      document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding content
      const tabName = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(content => {
         content.style.display = 'none';
      });
      document.getElementById(`${tabName}-tab`).style.display = 'block';
   });
});

// Health Data Form Submission
const healthDataForm = document.getElementById('healthDataForm');
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
document.getElementById('measurementTime').value = now.toISOString().slice(0, 16);

healthDataForm.addEventListener('submit', async (e) => {
   e.preventDefault();

   const systolic = document.getElementById('systolic').value;
   const diastolic = document.getElementById('diastolic').value;
   const heartRate = document.getElementById('heartRate').value;
   const bloodSugar = document.getElementById('bloodSugar').value;
   const weight = document.getElementById('weight').value;
   const measurementTime = document.getElementById('measurementTime').value;
   const notes = document.getElementById('notes').value;

   if (!systolic && !diastolic && !heartRate && !bloodSugar && !weight) {
      showToast('warning', 'Nothing to save', 'Please enter at least one health metric.');
      return;
   }

   try {
      const healthData = {
         userId: currentUser.uid,
         timestamp: new Date(measurementTime).toISOString(),
         createdAt: new Date().toISOString()
      };

      if (systolic && diastolic) {
         healthData.bloodPressure = {
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic)
         };
      }
      if (heartRate) healthData.heartRate = parseInt(heartRate);
      if (bloodSugar) healthData.bloodSugar = parseInt(bloodSugar);
      if (weight) healthData.weight = parseFloat(weight);
      if (notes) healthData.notes = notes;

      await addDoc(collection(db, 'healthData'), healthData);

      const savedItems = [];
      if (systolic && diastolic) savedItems.push(`Blood pressure (${systolic}/${diastolic} mmHg)`);
      if (heartRate) savedItems.push(`Heart rate (${heartRate} bpm)`);
      if (bloodSugar) savedItems.push(`Blood sugar (${bloodSugar} mg/dL)`);
      if (weight) savedItems.push(`Weight (${weight} kg)`);
      showToast('success', 'Health data saved!', savedItems.join(' · '));
      healthDataForm.reset();
      document.getElementById('measurementTime').value = now.toISOString().slice(0, 16);
      
      // Reload data and switch to overview tab
      await loadHealthData();
      document.querySelector('.nav-link[data-tab="overview"]').click();
   } catch (error) {
      console.error('Error saving health data:', error);
      showToast('error', 'Save failed', 'Could not save health data. Please try again.');
   }
});

// Load and display health data
async function loadHealthData() {
   try {
      const q = query(
         collection(db, 'healthData'),
         where('userId', '==', currentUser.uid),
         orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const healthRecords = [];
      
      querySnapshot.forEach((doc) => {
         healthRecords.push({ id: doc.id, ...doc.data() });
      });

      allHealthRecords = healthRecords; // Store globally for filtering

      if (healthRecords.length > 0) {
         updateLatestStats(healthRecords[0]);
         generateAIInsights(healthRecords);
      } else {
         showNoDataInsights();
      }

      updateCharts(healthRecords);
   } catch (error) {
      console.error('Error loading health data:', error);
   }
}

// Filter chart data by time period
window.filterChartData = function(days) {
   // Update button states
   document.querySelectorAll('.btn-group .btn').forEach(btn => {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-default');
   });
   
   if (days === 7) {
      document.getElementById('filter7days').classList.remove('btn-default');
      document.getElementById('filter7days').classList.add('btn-primary');
      currentFilter = 7;
   } else if (days === 30) {
      document.getElementById('filter30days').classList.remove('btn-default');
      document.getElementById('filter30days').classList.add('btn-primary');
      currentFilter = 30;
   } else {
      document.getElementById('filterAll').classList.remove('btn-default');
      document.getElementById('filterAll').classList.add('btn-primary');
      currentFilter = 'all';
   }

   // Filter and update charts
   let filteredRecords = allHealthRecords;
   if (days !== 'all') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredRecords = allHealthRecords.filter(r => new Date(r.timestamp) >= cutoffDate);
   }
   
   updateCharts(filteredRecords);
};


// Update latest stats cards
function updateLatestStats(latestRecord) {
   if (latestRecord.bloodPressure) {
      document.getElementById('latestBP').textContent = 
         `${latestRecord.bloodPressure.systolic}/${latestRecord.bloodPressure.diastolic}`;
   }
   if (latestRecord.heartRate) {
      document.getElementById('latestHR').textContent = latestRecord.heartRate;
   }
   if (latestRecord.bloodSugar) {
      document.getElementById('latestBS').textContent = latestRecord.bloodSugar;
   }
   if (latestRecord.weight) {
      document.getElementById('latestWeight').textContent = latestRecord.weight.toFixed(1);
   }
}

// AI Insights Generation
function generateAIInsights(healthRecords) {
   const latestRecord = healthRecords[0];
   const insights = [];
   const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
   
   document.getElementById('insightsDate').textContent = `Insights for ${today}`;

   // Analyze Blood Pressure
   if (latestRecord.bloodPressure) {
      const { systolic, diastolic } = latestRecord.bloodPressure;
      const bpInsight = analyzeBP(systolic, diastolic, healthRecords);
      if (bpInsight) insights.push(bpInsight);
   }

   // Analyze Heart Rate
   if (latestRecord.heartRate) {
      const hrInsight = analyzeHeartRate(latestRecord.heartRate, healthRecords);
      if (hrInsight) insights.push(hrInsight);
   }

   // Analyze Blood Sugar
   if (latestRecord.bloodSugar) {
      const bsInsight = analyzeBloodSugar(latestRecord.bloodSugar, healthRecords);
      if (bsInsight) insights.push(bsInsight);
   }

   // Analyze Weight Trends
   if (latestRecord.weight && healthRecords.length >= 3) {
      const weightInsight = analyzeWeightTrend(healthRecords);
      if (weightInsight) insights.push(weightInsight);
   }

   // Check data consistency
   const consistencyInsight = analyzeConsistency(healthRecords);
   if (consistencyInsight) insights.push(consistencyInsight);

   // General health score
   const healthScore = calculateHealthScore(latestRecord);
   insights.unshift(healthScore);

   displayInsights(insights);
}

function analyzeBP(systolic, diastolic, records) {
   let status, icon, color, message, recommendation;

   // Determine BP category
   if (systolic < 120 && diastolic < 80) {
      status = 'Normal';
      icon = 'fa-check-circle';
      color = '#2ecc71';
      message = `Your blood pressure is ${systolic}/${diastolic} mmHg - within normal range!`;
      recommendation = 'Keep up the good work! Continue your healthy lifestyle habits.';
   } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      status = 'Elevated';
      icon = 'fa-exclamation-triangle';
      color = '#f39c12';
      message = `Your blood pressure is ${systolic}/${diastolic} mmHg - slightly elevated.`;
      recommendation = 'Consider reducing sodium intake and increasing physical activity. Monitor regularly.';
   } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
      status = 'High (Stage 1)';
      icon = 'fa-exclamation-circle';
      color = '#e67e22';
      message = `Your blood pressure is ${systolic}/${diastolic} mmHg - Stage 1 Hypertension.`;
      recommendation = 'Consult your doctor. Focus on lifestyle changes: reduce salt, exercise regularly, manage stress.';
   } else if (systolic >= 140 || diastolic >= 90) {
      status = 'High (Stage 2)';
      icon = 'fa-warning';
      color = '#e74c3c';
      message = `Your blood pressure is ${systolic}/${diastolic} mmHg - Stage 2 Hypertension.`;
      recommendation = '⚠️ Please consult your healthcare provider soon. Take medications as prescribed.';
   } else if (systolic >= 180 || diastolic >= 120) {
      status = 'Critical';
      icon = 'fa-ambulance';
      color = '#c0392b';
      message = `⚠️ URGENT: Your blood pressure is ${systolic}/${diastolic} mmHg - Hypertensive Crisis!`;
      recommendation = '🚨 Seek immediate medical attention! This requires urgent care.';
   }

   // Check for trends
   if (records.length >= 3) {
      const recentBPs = records.slice(0, 3).map(r => r.bloodPressure?.systolic).filter(Boolean);
      if (recentBPs.length >= 3) {
         const isIncreasing = recentBPs.every((val, i) => i === 0 || val > recentBPs[i - 1]);
         const isDecreasing = recentBPs.every((val, i) => i === 0 || val < recentBPs[i - 1]);
         
         if (isIncreasing) {
            recommendation += ' 📈 Trend Alert: Your BP has been increasing. Review your diet and stress levels.';
         } else if (isDecreasing) {
            recommendation += ' 📉 Great news! Your BP is trending downward. Keep up your healthy habits!';
         }
      }
   }

   return {
      title: `Blood Pressure: ${status}`,
      icon, color, message, recommendation
   };
}

function analyzeHeartRate(hr, records) {
   let status, icon, color, message, recommendation;

   if (hr >= 60 && hr <= 100) {
      status = 'Normal';
      icon = 'fa-heart';
      color = '#2ecc71';
      message = `Your heart rate is ${hr} bpm - perfectly normal!`;
      recommendation = 'Your heart is beating at a healthy resting rate.';
   } else if (hr > 100 && hr <= 120) {
      status = 'Elevated';
      icon = 'fa-heartbeat';
      color = '#f39c12';
      message = `Your heart rate is ${hr} bpm - slightly elevated.`;
      recommendation = 'This could be due to stress, caffeine, or recent activity. Monitor and relax if possible.';
   } else if (hr > 120) {
      status = 'High';
      icon = 'fa-warning';
      color = '#e74c3c';
      message = `Your heart rate is ${hr} bpm - higher than normal.`;
      recommendation = '⚠️ If persistent or with symptoms (chest pain, dizziness), consult your doctor immediately.';
   } else if (hr < 60 && hr >= 50) {
      status = 'Low';
      icon = 'fa-info-circle';
      color = '#3498db';
      message = `Your heart rate is ${hr} bpm - lower than average.`;
      recommendation = 'This is common in athletes. If you feel dizzy or weak, consult your doctor.';
   } else if (hr < 50) {
      status = 'Very Low';
      icon = 'fa-exclamation-triangle';
      color = '#e67e22';
      message = `Your heart rate is ${hr} bpm - quite low.`;
      recommendation = 'Unless you\'re a trained athlete, consult your healthcare provider about this.';
   }

   // Calculate average over last 7 days
   if (records.length >= 3) {
      const recentHRs = records.slice(0, 7).map(r => r.heartRate).filter(Boolean);
      if (recentHRs.length >= 3) {
         const avgHR = Math.round(recentHRs.reduce((a, b) => a + b, 0) / recentHRs.length);
         recommendation += ` Your 7-day average is ${avgHR} bpm.`;
      }
   }

   return {
      title: `Heart Rate: ${status}`,
      icon, color, message, recommendation
   };
}

function analyzeBloodSugar(bs, records) {
   let status, icon, color, message, recommendation;

   if (bs < 70) {
      status = 'Low (Hypoglycemia)';
      icon = 'fa-arrow-down';
      color = '#e74c3c';
      message = `Your blood sugar is ${bs} mg/dL - too low!`;
      recommendation = '⚠️ Eat something with sugar immediately (juice, candy). If symptoms persist, seek medical help.';
   } else if (bs >= 70 && bs <= 100) {
      status = 'Normal (Fasting)';
      icon = 'fa-check-circle';
      color = '#2ecc71';
      message = `Your blood sugar is ${bs} mg/dL - excellent!`;
      recommendation = 'Your glucose levels are well-controlled. Keep maintaining your healthy routine!';
   } else if (bs > 100 && bs <= 125) {
      status = 'Pre-Diabetic Range';
      icon = 'fa-exclamation-triangle';
      color = '#f39c12';
      message = `Your blood sugar is ${bs} mg/dL - slightly elevated.`;
      recommendation = 'Monitor closely. Focus on low-glycemic foods, regular exercise, and weight management.';
   } else if (bs > 125 && bs <= 180) {
      status = 'High';
      icon = 'fa-arrow-up';
      color = '#e67e22';
      message = `Your blood sugar is ${bs} mg/dL - higher than normal.`;
      recommendation = 'Take your diabetes medication as prescribed. Avoid sugary foods and drinks. Stay hydrated.';
   } else if (bs > 180) {
      status = 'Very High';
      icon = 'fa-warning';
      color = '#c0392b';
      message = `⚠️ Your blood sugar is ${bs} mg/dL - dangerously high!`;
      recommendation = '🚨 Contact your healthcare provider. Check ketones if diabetic. Drink water and take prescribed insulin.';
   }

   // Analyze variability
   if (records.length >= 5) {
      const recentBS = records.slice(0, 5).map(r => r.bloodSugar).filter(Boolean);
      if (recentBS.length >= 5) {
         const max = Math.max(...recentBS);
         const min = Math.min(...recentBS);
         const variability = max - min;
         
         if (variability > 50) {
            recommendation += ` 📊 Your glucose levels vary significantly (${variability} mg/dL range). Aim for more consistency.`;
         } else {
            recommendation += ` 📊 Your glucose levels are quite stable. Great control!`;
         }
      }
   }

   return {
      title: `Blood Sugar: ${status}`,
      icon, color, message, recommendation
   };
}

function analyzeWeightTrend(records) {
   const weights = records.slice(0, 10).map(r => r.weight).filter(Boolean);
   if (weights.length < 3) return null;

   const latestWeight = weights[0];
   const oldestWeight = weights[weights.length - 1];
   const weightChange = latestWeight - oldestWeight;
   const percentChange = ((weightChange / oldestWeight) * 100).toFixed(1);
   const daysSpan = Math.ceil((new Date(records[0].timestamp) - new Date(records[weights.length - 1].timestamp)) / (1000 * 60 * 60 * 24));

   let icon, color, message, recommendation;

   if (Math.abs(weightChange) < 0.5) {
      icon = 'fa-balance-scale';
      color = '#2ecc71';
      message = `Your weight is stable at ${latestWeight.toFixed(1)} kg.`;
      recommendation = 'Excellent! You\'re maintaining a steady weight.';
   } else if (weightChange > 0) {
      icon = 'fa-arrow-up';
      color = weightChange > 2 ? '#e67e22' : '#3498db';
      message = `You've gained ${Math.abs(weightChange).toFixed(1)} kg (${percentChange}%) over ${daysSpan} days.`;
      recommendation = weightChange > 2 
         ? 'Significant weight gain detected. Review your diet and physical activity. Consult your doctor if concerned.'
         : 'Slight weight increase. Monitor your calorie intake and stay active.';
   } else {
      icon = 'fa-arrow-down';
      color = weightChange < -2 ? '#f39c12' : '#2ecc71';
      message = `You've lost ${Math.abs(weightChange).toFixed(1)} kg (${Math.abs(percentChange)}%) over ${daysSpan} days.`;
      recommendation = weightChange < -2
         ? 'Significant weight loss. Ensure you\'re eating enough and consult your doctor if unintentional.'
         : 'Healthy weight loss! Keep up the good work with balanced diet and exercise.';
   }

   return {
      title: 'Weight Trend Analysis',
      icon, color, message, recommendation
   };
}

function analyzeConsistency(records) {
   const now = new Date();
   const daysSinceLastEntry = Math.ceil((now - new Date(records[0].timestamp)) / (1000 * 60 * 60 * 24));
   
   let icon, color, message, recommendation;

   if (daysSinceLastEntry === 0) {
      icon = 'fa-star';
      color = '#2ecc71';
      message = 'You\'re tracking your health today!';
      recommendation = '⭐ Excellent! Daily monitoring helps you stay on top of your health.';
   } else if (daysSinceLastEntry === 1) {
      icon = 'fa-calendar-check-o';
      color = '#3498db';
      message = 'Last entry was yesterday.';
      recommendation = '✅ Good consistency! Try to measure your vitals today.';
   } else if (daysSinceLastEntry <= 3) {
      icon = 'fa-calendar';
      color = '#f39c12';
      message = `It's been ${daysSinceLastEntry} days since your last entry.`;
      recommendation = '📅 Consider tracking more frequently for better health insights - daily is ideal!';
   } else {
      icon = 'fa-calendar-times-o';
      color = '#e74c3c';
      message = `Your last entry was ${daysSinceLastEntry} days ago.`;
      recommendation = '⚠️ Regular monitoring is crucial! Try to record your vitals at least 2-3 times per week.';
   }

   // Check entry frequency over last 30 days
   const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
   const recentEntries = records.filter(r => new Date(r.timestamp) >= thirtyDaysAgo).length;
   
   if (recentEntries >= 20) {
      recommendation += ' 🌟 Amazing dedication - you\'ve logged ' + recentEntries + ' times this month!';
   } else if (recentEntries >= 10) {
      recommendation += ' 👍 Good tracking - ' + recentEntries + ' entries this month. Aim for daily monitoring!';
   }

   return {
      title: 'Tracking Consistency',
      icon, color, message, recommendation
   };
}

function calculateHealthScore(latestRecord) {
   let score = 0;
   let maxScore = 0;
   const factors = [];

   // Blood Pressure Score (30 points)
   if (latestRecord.bloodPressure) {
      maxScore += 30;
      const { systolic, diastolic } = latestRecord.bloodPressure;
      
      if (systolic < 120 && diastolic < 80) {
         score += 30;
         factors.push('✓ Optimal blood pressure');
      } else if (systolic < 130 && diastolic < 85) {
         score += 20;
         factors.push('↑ Slightly elevated BP');
      } else if (systolic < 140 || diastolic < 90) {
         score += 10;
         factors.push('⚠ High blood pressure');
      } else {
         factors.push('✗ Very high blood pressure');
      }
   }

   // Heart Rate Score (25 points)
   if (latestRecord.heartRate) {
      maxScore += 25;
      const hr = latestRecord.heartRate;
      
      if (hr >= 60 && hr <= 100) {
         score += 25;
         factors.push('✓ Healthy heart rate');
      } else if (hr >= 50 && hr <= 110) {
         score += 15;
         factors.push('~ Acceptable heart rate');
      } else {
         score += 5;
         factors.push('⚠ Abnormal heart rate');
      }
   }

   // Blood Sugar Score (25 points)
   if (latestRecord.bloodSugar) {
      maxScore += 25;
      const bs = latestRecord.bloodSugar;
      
      if (bs >= 70 && bs <= 100) {
         score += 25;
         factors.push('✓ Perfect glucose level');
      } else if (bs >= 100 && bs <= 125) {
         score += 15;
         factors.push('↑ Slightly elevated glucose');
      } else if (bs >= 60 && bs < 70) {
         score += 10;
         factors.push('↓ Low glucose');
      } else {
         score += 5;
         factors.push('⚠ Concerning glucose level');
      }
   }

   // Data Completeness (20 points)
   maxScore += 20;
   let completeness = 0;
   if (latestRecord.bloodPressure) completeness += 5;
   if (latestRecord.heartRate) completeness += 5;
   if (latestRecord.bloodSugar) completeness += 5;
   if (latestRecord.weight) completeness += 5;
   score += completeness;
   
   if (completeness === 20) {
      factors.push('✓ Complete health tracking');
   }

   const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
   let status, icon, color;

   if (percentage >= 85) {
      status = 'Excellent';
      icon = 'fa-trophy';
      color = '#2ecc71';
   } else if (percentage >= 70) {
      status = 'Good';
      icon = 'fa-thumbs-up';
      color = '#3498db';
   } else if (percentage >= 50) {
      status = 'Fair';
      icon = 'fa-info-circle';
      color = '#f39c12';
   } else {
      status = 'Needs Attention';
      icon = 'fa-exclamation-circle';
      color = '#e74c3c';
   }

   return {
      title: `Overall Health Score: ${percentage}% - ${status}`,
      icon,
      color,
      message: factors.join(' • '),
      recommendation: percentage >= 70 
         ? 'You\'re doing great! Continue your healthy habits and stay consistent with monitoring.'
         : 'Focus on improving your vital signs. Consult your healthcare provider for personalized advice.'
   };
}

function displayInsights(insights) {
   const insightsContainer = document.getElementById('aiInsights');
   
   insightsContainer.innerHTML = insights.map(insight => `
      <div style="background: rgba(255, 255, 255, 0.15); border-radius: 10px; padding: 20px; margin-bottom: 15px; backdrop-filter: blur(10px);">
         <div style="display: flex; align-items: start; gap: 15px;">
            <div style="width: 40px; height: 40px; background: ${insight.color}; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
               <i class="fa ${insight.icon}" style="font-size: 20px; color: white;"></i>
            </div>
            <div style="flex: 1;">
               <h4 style="margin: 0 0 10px 0; color: white; font-size: 18px; font-weight: 600;">${insight.title}</h4>
               <p style="margin: 0 0 10px 0; font-size: 15px; opacity: 0.95;">${insight.message}</p>
               <p style="margin: 0; font-size: 14px; opacity: 0.85; font-style: italic;">
                  💡 ${insight.recommendation}
               </p>
            </div>
         </div>
      </div>
   `).join('');
}

function showNoDataInsights() {
   document.getElementById('insightsDate').textContent = 'Get Started with health+';
   document.getElementById('aiInsights').innerHTML = `
      <div style="text-align: center; padding: 30px;">
         <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.6;">
            <i class="fa fa-line-chart"></i>
         </div>
         <h4 style="color: white; margin-bottom: 15px;">No Health Data Yet</h4>
         <p style="opacity: 0.9; margin-bottom: 20px;">Start tracking your vitals to receive personalized AI-powered insights and recommendations!</p>
         <button onclick="document.querySelector('[data-tab=\\'input\\']').click()" 
            style="background: white; color: #667eea; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">
            <i class="fa fa-plus"></i> Add Your First Entry
         </button>
      </div>
   `;
}

// Update latest stats cards
function updateCharts(records) {
   const reversedRecords = [...records].reverse();
   
   // Get limited records for display
   const displayRecords = reversedRecords.slice(-30); // Show up to 30 records
   
   if (displayRecords.length === 0) {
      showEmptyCharts();
      return;
   }
   
   const labels = displayRecords.map(r => {
      const date = new Date(r.timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
   });

   // Helper function to calculate average
   const calculateAverage = (arr) => {
      const validValues = arr.filter(v => v !== null);
      if (validValues.length === 0) return null;
      return (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1);
   };

   // Helper function to get point colors based on danger zones
   const getPointColors = (data, thresholds) => {
      return data.map(value => {
         if (value === null) return 'rgba(0,0,0,0)';
         if (thresholds.danger && (value >= thresholds.danger.high || value <= thresholds.danger.low)) {
            return '#DC2626'; // Red for danger
         }
         if (thresholds.warning && (value >= thresholds.warning.high || value <= thresholds.warning.low)) {
            return '#F59E0B'; // Orange for warning
         }
         return thresholds.normal || '#10B981'; // Green for normal
      });
   };

   // Blood Pressure Chart
   const bpData = {
      systolic: displayRecords.map(r => r.bloodPressure?.systolic || null),
      diastolic: displayRecords.map(r => r.bloodPressure?.diastolic || null)
   };

   const hasBPData = bpData.systolic.some(v => v !== null) || bpData.diastolic.some(v => v !== null);
   
   if (hasBPData) {
      document.getElementById('bpChart').style.display = 'block';
      document.getElementById('bpEmpty').style.display = 'none';
      
      // Calculate and display average
      const sysAvg = calculateAverage(bpData.systolic);
      const diaAvg = calculateAverage(bpData.diastolic);
      if (sysAvg && diaAvg) {
         document.getElementById('bpAverage').textContent = `Avg: ${sysAvg}/${diaAvg} mmHg`;
      }

      if (bpChart) bpChart.destroy();
      const bpCtx = document.getElementById('bpChart').getContext('2d');
      
      // Dynamic colors for systolic based on values
      const systolicColors = getPointColors(bpData.systolic, {
         danger: { high: 140, low: 90 },
         normal: '#E74C3C'
      });
      
      const diastolicColors = getPointColors(bpData.diastolic, {
         danger: { high: 90, low: 60 },
         normal: '#3498DB'
      });

      bpChart = new Chart(bpCtx, {
         type: 'line',
         data: {
            labels: labels,
            datasets: [
               {
                  label: 'Systolic',
                  data: bpData.systolic,
                  borderColor: '#E74C3C',
                  backgroundColor: 'rgba(231, 76, 60, 0.1)',
                  borderWidth: 3,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: systolicColors,
                  pointBorderColor: systolicColors,
                  pointBorderWidth: 2,
                  tension: 0.4,
                  spanGaps: true,
                  fill: true
               },
               {
                  label: 'Diastolic',
                  data: bpData.diastolic,
                  borderColor: '#3498DB',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  borderWidth: 3,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: diastolicColors,
                  pointBorderColor: diastolicColors,
                  pointBorderWidth: 2,
                  tension: 0.4,
                  spanGaps: true,
                  fill: true
               }
            ]
         },
         options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
               duration: 750,
               easing: 'easeInOutQuart'
            },
            interaction: {
               mode: 'index',
               intersect: false,
            },
            plugins: {
               tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  padding: 15,
                  titleFont: { size: 15, weight: 'bold' },
                  bodyFont: { size: 14 },
                  bodySpacing: 8,
                  callbacks: {
                     title: function(context) {
                        const date = new Date(displayRecords[context[0].dataIndex].timestamp);
                        return date.toLocaleString('en-US', { 
                           month: 'short', 
                           day: 'numeric',
                           year: 'numeric',
                           hour: '2-digit', 
                           minute: '2-digit' 
                        });
                     },
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                           label += context.parsed.y + ' mmHg';
                           // Add status indicator
                           if (context.datasetIndex === 0) { // Systolic
                              if (context.parsed.y >= 140) label += ' ⚠️ High';
                              else if (context.parsed.y < 90) label += ' ⚠️ Low';
                           } else { // Diastolic
                              if (context.parsed.y >= 90) label += ' ⚠️ High';
                              else if (context.parsed.y < 60) label += ' ⚠️ Low';
                           }
                        }
                        return label;
                     }
                  }
               },
               legend: {
                  display: true,
                  position: window.innerWidth < 768 ? 'bottom' : 'top',
                  labels: {
                     padding: 15,
                     font: { size: 13 }
                  }
               }
            },
            scales: {
               y: {
                  beginAtZero: false,
                  min: 60,
                  max: 180,
                  ticks: {
                     callback: function(value) {
                        return value + ' mmHg';
                     },
                     font: { size: 12 }
                  },
                  grid: {
                     color: 'rgba(0, 0, 0, 0.05)'
                  }
               },
               x: {
                  ticks: {
                     maxRotation: 45,
                     minRotation: 45,
                     font: { size: 11 }
                  },
                  grid: {
                     display: false
                  }
               }
            }
         }
      });
   } else {
      document.getElementById('bpChart').style.display = 'none';
      document.getElementById('bpEmpty').style.display = 'block';
      document.getElementById('bpAverage').textContent = '';
   }

   // Heart Rate Chart
   const hrData = displayRecords.map(r => r.heartRate || null);
   const hasHRData = hrData.some(v => v !== null);
   
   if (hasHRData) {
      document.getElementById('hrChart').style.display = 'block';
      document.getElementById('hrEmpty').style.display = 'none';
      
      const hrAvg = calculateAverage(hrData);
      if (hrAvg) {
         document.getElementById('hrAverage').textContent = `Avg: ${hrAvg} bpm`;
      }

      const hrColors = getPointColors(hrData, {
         danger: { high: 100, low: 60 },
         warning: { high: 90, low: 70 },
         normal: '#3498DB'
      });

      if (hrChart) hrChart.destroy();
      const hrCtx = document.getElementById('hrChart').getContext('2d');
      hrChart = new Chart(hrCtx, {
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: 'Heart Rate',
               data: hrData,
               borderColor: '#3498DB',
               backgroundColor: 'rgba(52, 152, 219, 0.1)',
               borderWidth: 3,
               pointRadius: 6,
               pointHoverRadius: 8,
               pointBackgroundColor: hrColors,
               pointBorderColor: hrColors,
               pointBorderWidth: 2,
               tension: 0.4,
               spanGaps: true,
               fill: true
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
               duration: 750,
               easing: 'easeInOutQuart'
            },
            interaction: {
               mode: 'index',
               intersect: false,
            },
            plugins: {
               tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  padding: 15,
                  titleFont: { size: 15, weight: 'bold' },
                  bodyFont: { size: 14 },
                  callbacks: {
                     title: function(context) {
                        const date = new Date(displayRecords[context[0].dataIndex].timestamp);
                        return date.toLocaleString('en-US', { 
                           month: 'short', 
                           day: 'numeric',
                           year: 'numeric',
                           hour: '2-digit', 
                           minute: '2-digit' 
                        });
                     },
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                           label += context.parsed.y + ' bpm';
                           if (context.parsed.y >= 100) label += ' ⚠️ High';
                           else if (context.parsed.y < 60) label += ' ⚠️ Low';
                        }
                        return label;
                     }
                  }
               },
               legend: {
                  display: true,
                  position: window.innerWidth < 768 ? 'bottom' : 'top',
                  labels: {
                     padding: 15,
                     font: { size: 13 }
                  }
               }
            },
            scales: {
               y: {
                  beginAtZero: false,
                  min: 40,
                  max: 120,
                  ticks: {
                     callback: function(value) {
                        return value + ' bpm';
                     },
                     font: { size: 12 }
                  },
                  grid: {
                     color: 'rgba(0, 0, 0, 0.05)'
                  }
               },
               x: {
                  ticks: {
                     maxRotation: 45,
                     minRotation: 45,
                     font: { size: 11 }
                  },
                  grid: {
                     display: false
                  }
               }
            }
         }
      });
   } else {
      document.getElementById('hrChart').style.display = 'none';
      document.getElementById('hrEmpty').style.display = 'block';
      document.getElementById('hrAverage').textContent = '';
   }

   // Blood Sugar Chart
   const bsData = displayRecords.map(r => r.bloodSugar || null);
   const hasBSData = bsData.some(v => v !== null);
   
   if (hasBSData) {
      document.getElementById('bsChart').style.display = 'block';
      document.getElementById('bsEmpty').style.display = 'none';
      
      const bsAvg = calculateAverage(bsData);
      if (bsAvg) {
         document.getElementById('bsAverage').textContent = `Avg: ${bsAvg} mg/dL`;
      }

      const bsColors = getPointColors(bsData, {
         danger: { high: 180, low: 70 },
         warning: { high: 140, low: 80 },
         normal: '#9B59B6'
      });

      if (bsChart) bsChart.destroy();
      const bsCtx = document.getElementById('bsChart').getContext('2d');
      bsChart = new Chart(bsCtx, {
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: 'Blood Sugar',
               data: bsData,
               borderColor: '#9B59B6',
               backgroundColor: 'rgba(155, 89, 182, 0.1)',
               borderWidth: 3,
               pointRadius: 6,
               pointHoverRadius: 8,
               pointBackgroundColor: bsColors,
               pointBorderColor: bsColors,
               pointBorderWidth: 2,
               tension: 0.4,
               spanGaps: true,
               fill: true
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
               duration: 750,
               easing: 'easeInOutQuart'
            },
            interaction: {
               mode: 'index',
               intersect: false,
            },
            plugins: {
               tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  padding: 15,
                  titleFont: { size: 15, weight: 'bold' },
                  bodyFont: { size: 14 },
                  callbacks: {
                     title: function(context) {
                        const date = new Date(displayRecords[context[0].dataIndex].timestamp);
                        return date.toLocaleString('en-US', { 
                           month: 'short', 
                           day: 'numeric',
                           year: 'numeric',
                           hour: '2-digit', 
                           minute: '2-digit' 
                        });
                     },
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                           label += context.parsed.y + ' mg/dL';
                           if (context.parsed.y >= 180) label += ' ⚠️ High';
                           else if (context.parsed.y < 70) label += ' ⚠️ Low';
                        }
                        return label;
                     }
                  }
               },
               legend: {
                  display: true,
                  position: window.innerWidth < 768 ? 'bottom' : 'top',
                  labels: {
                     padding: 15,
                     font: { size: 13 }
                  }
               }
            },
            scales: {
               y: {
                  beginAtZero: false,
                  min: 60,
                  max: 200,
                  ticks: {
                     callback: function(value) {
                        return value + ' mg/dL';
                     },
                     font: { size: 12 }
                  },
                  grid: {
                     color: 'rgba(0, 0, 0, 0.05)'
                  }
               },
               x: {
                  ticks: {
                     maxRotation: 45,
                     minRotation: 45,
                     font: { size: 11 }
                  },
                  grid: {
                     display: false
                  }
               }
            }
         }
      });
   } else {
      document.getElementById('bsChart').style.display = 'none';
      document.getElementById('bsEmpty').style.display = 'block';
      document.getElementById('bsAverage').textContent = '';
   }

   // Weight Chart
   const weightData = displayRecords.map(r => r.weight || null);
   const hasWeightData = weightData.some(v => v !== null);
   
   if (hasWeightData) {
      document.getElementById('weightChart').style.display = 'block';
      document.getElementById('weightEmpty').style.display = 'none';
      
      const weightAvg = calculateAverage(weightData);
      if (weightAvg) {
         document.getElementById('weightAverage').textContent = `Avg: ${weightAvg} kg`;
      }

      const validWeights = weightData.filter(w => w !== null);
      const minWeight = Math.floor(Math.min(...validWeights) - 5);
      const maxWeight = Math.ceil(Math.max(...validWeights) + 5);

      if (weightChart) weightChart.destroy();
      const weightCtx = document.getElementById('weightChart').getContext('2d');
      weightChart = new Chart(weightCtx, {
         type: 'line',
         data: {
            labels: labels,
            datasets: [{
               label: 'Weight',
               data: weightData,
               borderColor: '#2ECC71',
               backgroundColor: 'rgba(46, 204, 113, 0.1)',
               borderWidth: 3,
               pointRadius: 6,
               pointHoverRadius: 8,
               pointBackgroundColor: '#2ECC71',
               pointBorderColor: '#2ECC71',
               pointBorderWidth: 2,
               tension: 0.4,
               spanGaps: true,
               fill: true
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
               duration: 750,
               easing: 'easeInOutQuart'
            },
            interaction: {
               mode: 'index',
               intersect: false,
            },
            plugins: {
               tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  padding: 15,
                  titleFont: { size: 15, weight: 'bold' },
                  bodyFont: { size: 14 },
                  callbacks: {
                     title: function(context) {
                        const date = new Date(displayRecords[context[0].dataIndex].timestamp);
                        return date.toLocaleString('en-US', { 
                           month: 'short', 
                           day: 'numeric',
                           year: 'numeric',
                           hour: '2-digit', 
                           minute: '2-digit' 
                        });
                     },
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                           label += context.parsed.y.toFixed(1) + ' kg';
                        }
                        return label;
                     }
                  }
               },
               legend: {
                  display: true,
                  position: window.innerWidth < 768 ? 'bottom' : 'top',
                  labels: {
                     padding: 15,
                     font: { size: 13 }
                  }
               }
            },
            scales: {
               y: {
                  beginAtZero: false,
                  min: minWeight,
                  max: maxWeight,
                  ticks: {
                     callback: function(value) {
                        return value.toFixed(1) + ' kg';
                     },
                     font: { size: 12 }
                  },
                  grid: {
                     color: 'rgba(0, 0, 0, 0.05)'
                  }
               },
               x: {
                  ticks: {
                     maxRotation: 45,
                     minRotation: 45,
                     font: { size: 11 }
                  },
                  grid: {
                     display: false
                  }
               }
            }
         }
      });
   } else {
      document.getElementById('weightChart').style.display = 'none';
      document.getElementById('weightEmpty').style.display = 'block';
      document.getElementById('weightAverage').textContent = '';
   }
}

function showEmptyCharts() {
   ['bp', 'hr', 'bs', 'weight'].forEach(type => {
      document.getElementById(`${type}Chart`).style.display = 'none';
      document.getElementById(`${type}Empty`).style.display = 'block';
      document.getElementById(`${type}Average`).textContent = '';
   });
}


// Reminders functionality
const reminderModal = document.getElementById('reminderModal');
const addReminderBtn = document.getElementById('addReminderBtn');
const closeReminderModal = document.getElementById('closeReminderModal');
const reminderForm = document.getElementById('reminderForm');

addReminderBtn.addEventListener('click', () => {
   reminderModal.style.display = 'block';
});

closeReminderModal.addEventListener('click', () => {
   reminderModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
   if (e.target === reminderModal) {
      reminderModal.style.display = 'none';
   }
});

reminderForm.addEventListener('submit', async (e) => {
   e.preventDefault();

   const reminderData = {
      userId: currentUser.uid,
      type: document.getElementById('reminderType').value,
      title: document.getElementById('reminderTitle').value,
      dateTime: new Date(document.getElementById('reminderDateTime').value).toISOString(),
      notes: document.getElementById('reminderNotes').value,
      createdAt: new Date().toISOString(),
      completed: false
   };

   try {
      await addDoc(collection(db, 'reminders'), reminderData);
      showToast('success', 'Reminder saved!', reminderData.title);
      reminderForm.reset();
      reminderModal.style.display = 'none';
      await loadReminders();
   } catch (error) {
      console.error('Error adding reminder:', error);
      showToast('error', 'Save failed', 'Could not save reminder. Please try again.');
   }
});

async function loadReminders() {
   try {
      const q = query(
         collection(db, 'reminders'),
         where('userId', '==', currentUser.uid),
         orderBy('dateTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const reminders = [];
      
      querySnapshot.forEach((doc) => {
         reminders.push({ id: doc.id, ...doc.data() });
      });

      displayReminders(reminders);
   } catch (error) {
      console.error('Error loading reminders:', error);
   }
}

function displayReminders(reminders) {
   const remindersList = document.getElementById('remindersList');
   
   if (reminders.length === 0) {
      remindersList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No reminders yet. Add your first reminder!</p>';
      return;
   }

   remindersList.innerHTML = reminders.map(reminder => {
      const date = new Date(reminder.dateTime);
      const isPast = date < new Date();
      const typeIcons = {
         medication: 'fa-medkit',
         measurement: 'fa-heartbeat',
         appointment: 'fa-calendar',
         exercise: 'fa-heartbeat',
         other: 'fa-bell'
      };

      return `
         <div style="padding: 15px; border-bottom: 1px solid #eee; ${reminder.completed ? 'opacity: 0.6;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: start;">
               <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                     <i class="fa ${typeIcons[reminder.type]}" style="color: #2895f1;"></i>
                     <strong style="${reminder.completed ? 'text-decoration: line-through;' : ''}">${reminder.title}</strong>
                  </div>
                  <div style="font-size: 14px; color: #666; margin-left: 24px;">
                     <i class="fa fa-clock-o"></i> ${date.toLocaleString()}
                  </div>
                  ${reminder.notes ? `<div style="font-size: 13px; color: #999; margin-left: 24px; margin-top: 5px;">${reminder.notes}</div>` : ''}
               </div>
               <div style="display: flex; gap: 10px;">
                  <button onclick="toggleReminder('${reminder.id}', ${!reminder.completed})" 
                     style="background: ${reminder.completed ? '#2ecc71' : '#f39c12'}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                     ${reminder.completed ? 'Undo' : 'Complete'}
                  </button>
                  <button onclick="deleteReminder('${reminder.id}')" 
                     style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                     Delete
                  </button>
               </div>
            </div>
         </div>
      `;
   }).join('');
}

window.toggleReminder = async (reminderId, completed) => {
   try {
      await updateDoc(doc(db, 'reminders', reminderId), { completed });
      await loadReminders();
   } catch (error) {
      console.error('Error updating reminder:', error);
   }
};

window.deleteReminder = async (reminderId) => {
   if (confirm('Are you sure you want to delete this reminder?')) {
      try {
         await deleteDoc(doc(db, 'reminders', reminderId));
         await loadReminders();
      } catch (error) {
         console.error('Error deleting reminder:', error);
      }
   }
};

// Health Tips
function loadHealthTips() {
   const healthTips = [
      {
         title: 'Monitor Your Blood Pressure',
         icon: 'fa-heartbeat',
         color: '#e74c3c',
         tips: [
            'Check your blood pressure at the same time each day',
            'Rest for 5 minutes before taking a reading',
            'Avoid caffeine 30 minutes before measurement',
            'Keep a consistent record of your readings'
         ]
      },
      {
         title: 'Manage Diabetes',
         icon: 'fa-tint',
         color: '#9b59b6',
         tips: [
            'Test blood sugar levels as recommended by your doctor',
            'Eat meals at regular times',
            'Stay hydrated throughout the day',
            'Exercise regularly to help control blood sugar'
         ]
      },
      {
         title: 'Heart Health',
         icon: 'fa-heart',
         color: '#3498db',
         tips: [
            'Engage in at least 30 minutes of exercise daily',
            'Reduce sodium intake to less than 2,300mg per day',
            'Eat plenty of fruits and vegetables',
            'Manage stress through relaxation techniques'
         ]
      },
      {
         title: 'General Wellness',
         icon: 'fa-smile-o',
         color: '#2ecc71',
         tips: [
            'Get 7-9 hours of quality sleep each night',
            'Stay connected with friends and family',
            'Take medications as prescribed',
            'Attend regular check-ups with your doctor'
         ]
      },
      {
         title: 'Healthy Eating',
         icon: 'fa-cutlery',
         color: '#f39c12',
         tips: [
            'Fill half your plate with vegetables',
            'Choose whole grains over refined grains',
            'Limit processed foods and added sugars',
            'Drink plenty of water throughout the day'
         ]
      },
      {
         title: 'Medication Management',
         icon: 'fa-medkit',
         color: '#e67e22',
         tips: [
            'Take medications at the same time each day',
            'Never skip doses without consulting your doctor',
            'Keep a list of all your medications',
            'Report any side effects to your healthcare provider'
         ]
      }
   ];

   const healthTipsList = document.getElementById('healthTipsList');
   healthTipsList.innerHTML = healthTips.map(tip => `
      <div class="col-md-6">
         <div class="card">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
               <div style="width: 50px; height: 50px; border-radius: 10px; background: ${tip.color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                  <i class="fa ${tip.icon}"></i>
               </div>
               <h3 style="margin: 0; font-size: 20px; color: #333;">${tip.title}</h3>
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
               ${tip.tips.map(t => `<li>${t}</li>`).join('')}
            </ul>
         </div>
      </div>
   `).join('');
}
