# Google Login/Register Implementation Guide

This guide provides instructions for completing the Google OAuth implementation in your SoundCave app.

## 📋 What's Been Implemented

✅ **Google Sign-In Library** - `@react-native-google-signin/google-signin` installed
✅ **Google Auth Utility** - `src/utils/googleAuth.ts` created with:
   - Google Sign-In configuration
   - Sign-in handler
   - Auth API integration
   - Token and profile saving

✅ **Login Screen Updates** - Google login button integrated
✅ **Register Screen Updates** - Google register button integrated  
✅ **App Initialization** - Google Sign-In configured on app startup

## 🔧 Setup Steps Required

### Step 1: Get Google OAuth Credentials

#### For Android:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Go to Credentials > Create Credentials > OAuth client ID
   - Select "Android"
   - Get your SHA-1 fingerprint:
     ```bash
     cd android
     ./gradlew signingReport
     ```
   - Add the SHA-1 and your package name (com.soundcave_app or similar)
   - Save the Client ID

#### For iOS:
1. In Google Cloud Console, create OAuth 2.0 credentials:
   - Go to Credentials > Create Credentials > OAuth client ID
   - Select "iOS"
   - Enter your Bundle ID (check in ios/soundcave_app/Info.plist)
   - Save the Client ID and add to your app

#### For Web (Backend API calls):
1. Create OAuth 2.0 credentials for Web
2. This is your Web Client ID
3. Save all credentials securely

### Step 2: Update Google Auth Configuration

Edit `src/utils/googleAuth.ts` line 13-18 and replace with your actual credentials:

```typescript
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
```

### Step 3: Update Backend API Endpoints

Your backend API needs to handle these new endpoints:

**POST** `/api/auth/google-login`
- Request body:
  ```json
  {
    "email": "user@example.com",
    "full_name": "User Name",
    "google_id": "google_user_id",
    "profile_image": "https://...",
    "id_token": "google_id_token",
    "access_token": "google_access_token"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "your_jwt_token",
      "user": {
        "id": "user_id",
        "full_name": "User Name",
        "email": "user@example.com",
        "phone": null,
        "location": null,
        "bio": null,
        "profile_image": "https://...",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    }
  }
  ```

**POST** `/api/auth/google-register`
- Same request/response structure as google-login
- Should create new user if doesn't exist
- Should log in existing user if already registered with that email

### Step 4: Android Setup (Native Configuration)

1. Update `android/build.gradle`:
   ```gradle
   buildscript {
       ext {
           buildToolsVersion = "34.0.0"
           minSdkVersion = 24
           compileSdkVersion = 34
           targetSdkVersion = 34
       }
   }
   ```

2. Ensure Google Play Services are available in your project

### Step 5: iOS Setup (Native Configuration)

1. Update `ios/soundcave_app/Info.plist` - add URL schemes:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
           </array>
       </dict>
   </array>
   ```

2. Install pods:
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Step 6: Test the Implementation

1. **Android:**
   ```bash
   npm run android
   ```
   - Tap "Register with Google" or login Google button
   - Authenticate with Google
   - Verify user is created and logged in

2. **iOS:**
   ```bash
   npm run ios
   ```
   - Same testing as Android

## 📁 Files Modified/Created

### New Files:
- `src/utils/googleAuth.ts` - Google authentication utility

### Modified Files:
- `src/screens/Login/index.tsx` - Added Google login button and handler
- `src/screens/Register/index.tsx` - Added Google register button and handler
- `App.tsx` - Initialize Google Sign-In on app startup

## 🔗 API Integration Points

The implementation handles:
1. ✅ User sign-in with Google via `signInWithGoogle()`
2. ✅ API call to backend with Google credentials via `handleGoogleAuth()`
3. ✅ Token storage via existing `saveToken()`
4. ✅ User profile storage via existing `saveUserProfile()`
5. ✅ Navigation to home screen after successful auth

## 🛡️ Security Notes

1. **Never commit real credentials** - use environment variables:
   ```typescript
   export const configureGoogleSignIn = () => {
     GoogleSignin.configure({
       webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
       iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
       offlineAccess: true,
       forceCodeForRefreshToken: true,
     });
   };
   ```

2. **Backend Verification** - Always verify the `id_token` on your backend:
   - Verify token signature
   - Verify token hasn't expired
   - Verify the audience matches your app

3. **HTTPS Only** - Ensure all API calls use HTTPS in production

## 🐛 Troubleshooting

### "Play Services not available"
- Ensure Google Play Services are installed on device
- Update Google Play Services via Play Store

### "Sign-in cancelled"
- User dismissed the Google sign-in dialog
- This is handled gracefully in the code

### Token not found in response
- Verify backend is returning the correct response structure
- Check backend logs for errors

### Profile not saving
- Verify `saveUserProfile()` is working
- Check local storage permissions

## 📚 Related Documentation

- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Google Identity Services](https://developers.google.com/identity)
- [Google Cloud Console](https://console.cloud.google.com)

## ✉️ Next Steps

1. ✅ Implement backend endpoints for Google auth
2. ✅ Add your Google OAuth credentials
3. ✅ Test authentication flow on device
4. ✅ Deploy to production
