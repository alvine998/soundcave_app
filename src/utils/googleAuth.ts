import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import { getPublicApiInstance } from './api';
import { saveToken } from '../storage/tokenStorage';
import { saveUserProfile, UserProfile } from '../storage/userStorage';
import { CONFIG } from '../config';

// ponyfill: v16 returns { type:'success', data:{ user, idToken } } not flat object
type GoogleUser = {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
};
type NormalizedGoogleInfo = {
  user: GoogleUser;
  idToken: string | null;
};

// ponytail: ceiling = manual Web Client ID entry. Upgrade: env/remote-config if multi-flavor needed
export const configureGoogleSignIn = () => {
  if (
    !CONFIG.GOOGLE_WEB_CLIENT_ID ||
    CONFIG.GOOGLE_WEB_CLIENT_ID.includes('YOUR_WEB_CLIENT_ID')
  ) {
    console.warn(
      '[googleAuth] GOOGLE_WEB_CLIENT_ID not set in src/config/index.ts — Google login will fail. ' +
        'Create Web OAuth client in Google Cloud Console.'
    );
  }
  GoogleSignin.configure({
    webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID,
    iosClientId: CONFIG.GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

export const signInWithGoogle = async (): Promise<NormalizedGoogleInfo | null> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) {
      console.log('User cancelled Google sign-in');
      return null;
    }

    if (!isSuccessResponse(response)) {
      // noSavedCredentialFound or other non-success (shouldn't happen for signIn, but guard)
      console.log('Google sign-in no saved credential / not success:', response.type);
      return null;
    }

    const user = response.data.user as GoogleUser;
    const idToken = (response.data as any).idToken ?? (response.data as any).id_token ?? null;

    // fallback: try getTokens if idToken missing
    let finalIdToken = idToken;
    if (!finalIdToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        finalIdToken = tokens.idToken ?? null;
      } catch (_) {
        // ignore
      }
    }

    return { user, idToken: finalIdToken };
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
          console.log('Google sign-in error', error.code, error);
          return null;
      }
    } else {
      console.error('Unexpected Google sign-in error:', error);
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
  googleUserInfo: NormalizedGoogleInfo,
  isRegister: boolean = false
): Promise<{ success: boolean; message: string; userProfile?: UserProfile }> => {
  try {
    const api = getPublicApiInstance();
    const endpoint = isRegister ? '/api/auth/google-register' : '/api/auth/google-login';

    if (!googleUserInfo.idToken) {
      return { success: false, message: 'Google idToken missing — check webClientId config' };
    }

    const payload = {
      email: googleUserInfo.user.email,
      full_name: googleUserInfo.user.name ?? googleUserInfo.user.givenName ?? googleUserInfo.user.email,
      google_id: googleUserInfo.user.id,
      profile_image: googleUserInfo.user.photo,
      id_token: googleUserInfo.idToken,
    };

    const response = await api.post(endpoint, payload);
    const responseData = response.data as GoogleLoginResponse;

    if (responseData.success && responseData.data) {
      const { token, user } = responseData.data;
      if (!token) return { success: false, message: 'Token not found in response' };
      if (!user) return { success: false, message: 'User data not found in response' };

      await saveToken(token);
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
      message: error.response?.data?.message || error.message || 'Google authentication failed',
    };
  }
};
