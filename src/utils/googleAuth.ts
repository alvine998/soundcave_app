import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { getPublicApiInstance } from './api';
import { saveToken } from '../storage/tokenStorage';
import { saveUserProfile, UserProfile } from '../storage/userStorage';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: '845851208340-kob8a5vd8d5m6q2g5c9j0lq8n0j8k9l0.apps.googleusercontent.com', // Replace with your actual Web Client ID
    iosClientId: '845851208340-ios1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o.apps.googleusercontent.com', // Replace with your actual iOS Client ID
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

interface GoogleSignInResponse {
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    familyName?: string;
    givenName?: string;
  };
  idToken?: string;
  accessToken?: string;
  serverAuthCode?: string;
}

export const signInWithGoogle = async (): Promise<GoogleSignInResponse | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return userInfo as unknown as GoogleSignInResponse;
  } catch (error: any) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          console.log('User cancelled the login flow');
          return null;
        case statusCodes.IN_PROGRESS:
          console.log('Signin in progress');
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.log('Play services not available or outdated');
          return null;
        default:
          console.log('Some other error happened', error);
          return null;
      }
    } else {
      console.error('An unexpected error occurred:', error);
      return null;
    }
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Error signing out from Google:', error);
  }
};

interface GoogleLoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: UserProfile;
  };
}

export const handleGoogleAuth = async (
  googleUserInfo: GoogleSignInResponse,
  isRegister: boolean = false
): Promise<{
  success: boolean;
  message: string;
  userProfile?: UserProfile;
}> => {
  try {
    const api = getPublicApiInstance();

    const endpoint = isRegister ? '/api/auth/google-register' : '/api/auth/google-login';

    const payload = {
      email: googleUserInfo.user.email,
      full_name: googleUserInfo.user.name,
      google_id: googleUserInfo.user.id,
      profile_image: googleUserInfo.user.photo,
      id_token: googleUserInfo.idToken,
      access_token: googleUserInfo.accessToken,
    };

    const response = await api.post(endpoint, payload);
    const responseData = response.data as GoogleLoginResponse;

    if (responseData.success && responseData.data) {
      const { token, user } = responseData.data;

      if (!token) {
        return {
          success: false,
          message: 'Token not found in response',
        };
      }

      if (!user) {
        return {
          success: false,
          message: 'User data not found in response',
        };
      }

      // Save token
      await saveToken(token);

      // Save user profile
      const userProfile: UserProfile = {
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || undefined,
        location: user.location || undefined,
        bio: user.bio || undefined,
        profile_image: user.profile_image || null,
        role: user.role || 'user',
        created_at: user.created_at || undefined,
        updated_at: user.updated_at || undefined,
      };

      await saveUserProfile(userProfile);

      return {
        success: true,
        message: responseData.message || 'Google authentication successful!',
        userProfile,
      };
    } else {
      return {
        success: false,
        message: responseData.message || 'Google authentication failed',
      };
    }
  } catch (error: any) {
    console.error('Google auth error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return {
      success: false,
      message:
        error.response?.data?.message || error.message || 'Google authentication failed',
    };
  }
};
