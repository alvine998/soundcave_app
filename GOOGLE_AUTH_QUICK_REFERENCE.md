# Google OAuth Quick Reference

## 🚀 Quick Start Checklist

- [ ] Get Google OAuth credentials from Google Cloud Console
- [ ] Update `src/utils/googleAuth.ts` with your Client IDs
- [ ] Implement backend endpoints (`/api/auth/google-login`, `/api/auth/google-register`)
- [ ] Update iOS `Info.plist` with URL schemes
- [ ] Test on Android device/emulator
- [ ] Test on iOS device/simulator
- [ ] Deploy to production

## 📱 What Users See

### Login Screen
```
┌─────────────────────────────┐
│  Sign In                    │
│                             │
│  [Email Input]              │
│  [Password Input]           │
│                             │
│  [Masuk Button]             │
│  [Google Button] ← NEW      │
│  Don't have account?        │
└─────────────────────────────┘
```

### Register Screen
```
┌─────────────────────────────┐
│  Create Account             │
│                             │
│  [Full Name Input]          │
│  [Email Input]              │
│  [Phone Input]              │
│  [Password Input]           │
│  [☐ Terms checkbox]         │
│  [Register Button]          │
│  [Google Button] ← NEW      │
│  Already have account?      │
└─────────────────────────────┘
```

## 🔄 Authentication Flow

```
User Taps Google Button
        ↓
signInWithGoogle() triggered
        ↓
Google Sign-In Dialog Opens
        ↓
User Authenticates with Google
        ↓
Get Google User Info + Tokens
        ↓
handleGoogleAuth() calls backend
        ↓
POST /api/auth/google-login (or register)
        ↓
Backend verifies Google token
        ↓
Backend creates/finds user
        ↓
Backend returns JWT token + user profile
        ↓
Save token & profile locally
        ↓
Navigate to Home Screen
```

## 📂 File Structure

```
soundcave_app/
├── src/
│   ├── utils/
│   │   ├── googleAuth.ts           ← NEW (Google auth logic)
│   │   ├── api.ts
│   │   └── navigationService.ts
│   ├── screens/
│   │   ├── Login/
│   │   │   └── index.tsx           ← UPDATED (Added Google button)
│   │   ├── Register/
│   │   │   └── index.tsx           ← UPDATED (Added Google button)
│   └── ...
├── App.tsx                         ← UPDATED (Init Google Sign-In)
├── GOOGLE_AUTH_SETUP.md            ← NEW (Setup guide)
├── GOOGLE_AUTH_BACKEND.md          ← NEW (Backend examples)
└── ...
```

## 🔐 Environment Setup

### Step 1: Get Credentials
Visit: https://console.cloud.google.com/apis/credentials

Create 3 OAuth 2.0 credentials:
1. **Web** → Copy Web Client ID
2. **Android** → Get your SHA-1, enter package name
3. **iOS** → Enter your Bundle ID

### Step 2: Update Code
```typescript
// src/utils/googleAuth.ts (line 13-18)
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
```

### Step 3: Backend Endpoints
Your API needs these endpoints:

**POST /api/auth/google-login**
```
Request: {
  email, full_name, google_id, 
  profile_image, id_token, access_token
}

Response: {
  success: true,
  message: "Login successful",
  data: {
    token: "jwt_token",
    user: { id, full_name, email, ... }
  }
}
```

**POST /api/auth/google-register**
```
Same as google-login
(Creates new user if doesn't exist)
```

## 🧪 Testing Steps

### Local Testing
1. Start the app: `npm run android` or `npm run ios`
2. Navigate to Login/Register screen
3. Click Google button
4. Authenticate with your Google account
5. Verify you're logged in

### Production Testing
1. Use real Google OAuth credentials
2. Test with multiple Google accounts
3. Test on real devices (not just emulators)
4. Verify tokens are properly stored
5. Check backend logs for errors

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Play Services not available" | Update Google Play Services on device |
| "Invalid Client ID" | Verify Client ID matches your app |
| "Sign-in cancelled" | User dismissed dialog - this is normal |
| "Token not found" | Check backend response structure |
| "User not saving" | Verify saveUserProfile() works |
| "Network timeout" | Check API endpoint is accessible |

## 📚 Key Functions

### In `googleAuth.ts`:

```typescript
// Initialize Google Sign-In
configureGoogleSignIn()

// Start Google sign-in flow
signInWithGoogle() → GoogleSignInResponse | null

// Handle auth with backend
handleGoogleAuth(googleUserInfo, isRegister) → {
  success: boolean,
  message: string,
  userProfile?: UserProfile
}

// Sign out
signOutGoogle() → void
```

## 💾 Data Flow

```
Google Account
      ↓
Google Sign-In Library
      ↓
{id, name, email, photo, id_token}
      ↓
handleGoogleAuth()
      ↓
POST /api/auth/google-login
      ↓
Backend (verify token, find/create user, generate JWT)
      ↓
{token, user}
      ↓
saveToken() → AsyncStorage
      ↓
saveUserProfile() → AsyncStorage
      ↓
Navigation Context Updated
      ↓
User Navigated to Home
```

## 🎯 Next Steps After Implementation

1. **Backend Integration**
   - Implement endpoints
   - Test with Postman
   - Verify token verification

2. **Device Testing**
   - Test on Android device
   - Test on iOS device
   - Check different Google accounts

3. **Error Handling**
   - Test network failures
   - Test invalid tokens
   - Test edge cases

4. **Security Review**
   - Verify HTTPS usage
   - Check token storage
   - Review backend validation

5. **Production Deployment**
   - Use production OAuth credentials
   - Enable monitoring/logging
   - Set up error tracking

## 📞 Support Resources

- [Google Identity Docs](https://developers.google.com/identity)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2)

## 💡 Pro Tips

✅ Store OAuth credentials in environment variables, not hardcoded
✅ Always verify tokens on the backend
✅ Use refresh tokens for long-lived sessions
✅ Log authentication events for debugging
✅ Test with multiple Google accounts
✅ Implement proper error boundaries
✅ Use secure token storage
✅ Implement logout functionality
