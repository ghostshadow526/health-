# Firebase Security Rules

## Firestore Rules

To ensure proper security for your health+ application, configure these Firestore security rules in your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Health data collection - users can only access their own health data
    match /healthData/{dataId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Reminders collection - users can only access their own reminders
    match /reminders/{reminderId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## How to Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (milliniem-86b63)
3. Navigate to **Firestore Database** → **Rules**
4. Copy and paste the rules above
5. Click **Publish**

## Authentication Rules

Make sure Email/Password authentication is enabled:

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Save changes

## Storage Rules (Optional)

If you plan to add profile pictures or document uploads in the future:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the Rules

After applying the rules, test them in the Firebase Console:
- Go to **Firestore Database** → **Rules**
- Click on **Rules Playground**
- Test different scenarios to ensure security is working correctly
