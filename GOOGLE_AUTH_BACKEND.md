# Google OAuth Backend Implementation Example

This document provides backend API implementation examples for Google authentication endpoints.

## Backend Endpoints Required

### 1. Google Login Endpoint

**Endpoint:** `POST /api/auth/google-login`

#### Example Node.js/Express Implementation:

```javascript
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  try {
    const { email, full_name, google_id, profile_image, id_token } = req.body;

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Verify email matches
    if (payload.email !== email) {
      return res.status(401).json({
        success: false,
        message: 'Email mismatch with Google account',
      });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        full_name,
        google_id,
        profile_image,
        role: 'user',
      });
      await user.save();
    } else if (!user.google_id) {
      // Link Google ID to existing account
      user.google_id = google_id;
      if (profile_image && !user.profile_image) {
        user.profile_image = profile_image;
      }
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          profile_image: user.profile_image,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Google login failed',
    });
  }
});
```

### 2. Google Register Endpoint

**Endpoint:** `POST /api/auth/google-register`

#### Example Implementation:

```javascript
router.post('/google-register', async (req, res) => {
  try {
    const { email, full_name, google_id, profile_image, id_token } = req.body;

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (payload.email !== email) {
      return res.status(401).json({
        success: false,
        message: 'Email mismatch with Google account',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User already exists, just log them in
      if (!user.google_id) {
        user.google_id = google_id;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email,
        full_name,
        google_id,
        profile_image,
        role: 'user',
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: user ? 'Account created successfully' : 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          bio: user.bio,
          profile_image: user.profile_image,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Google register error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Google registration failed',
    });
  }
});
```

## Environment Variables Required

Create a `.env` file with:

```
GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
JWT_SECRET=your_jwt_secret_key
```

## User Model Schema

```javascript
const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    // Not required for Google users
  },
  phone: String,
  location: String,
  bio: String,
  profile_image: String,
  google_id: String,
  // Add other OAuth providers as needed
  facebook_id: String,
  apple_id: String,
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'artist', 'admin'],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});
```

## Security Best Practices

### 1. Verify Google ID Token

Always verify the ID token signature:

```javascript
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2. Rate Limiting

Implement rate limiting on auth endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
});

router.post('/google-login', authLimiter, async (req, res) => {
  // ... handler
});
```

### 3. HTTPS Enforcement

```javascript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 4. CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
}));
```

## Testing the Endpoints

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "John Doe",
    "google_id": "google_123456",
    "profile_image": "https://example.com/image.jpg",
    "id_token": "your_google_id_token"
  }'
```

### Using Postman:

1. Create new POST request to `http://localhost:3000/api/auth/google-login`
2. Set header: `Content-Type: application/json`
3. Add body:
   ```json
   {
     "email": "user@example.com",
     "full_name": "John Doe",
     "google_id": "google_123456",
     "profile_image": "https://example.com/image.jpg",
     "id_token": "your_google_id_token"
   }
   ```
4. Click Send

## Error Handling

```javascript
const handleGoogleAuthError = (error) => {
  if (error.message.includes('Invalid token')) {
    return {
      status: 401,
      message: 'Invalid Google token. Please sign in again.',
    };
  }

  if (error.message.includes('Email mismatch')) {
    return {
      status: 401,
      message: 'Email mismatch. Please use the same email.',
    };
  }

  if (error.code === 11000) {
    // MongoDB duplicate key error
    return {
      status: 409,
      message: 'Email already registered with another account.',
    };
  }

  return {
    status: 500,
    message: 'Authentication failed. Please try again.',
  };
};
```

## Additional OAuth Providers (Future)

The same pattern can be used for:

- **Facebook Login**
- **Apple Sign In**
- **GitHub Auth**

Just add similar endpoints for each provider.
