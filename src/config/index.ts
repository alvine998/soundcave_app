export const CONFIG = {
  BASE_URL: 'https://api.soundcave.pro',
  // Replace with your Web OAuth Client ID from Google Cloud Console
  // Create it under: APIs & Services > Credentials > OAuth 2.0 Client IDs > Web application
  // Android OAuth client must be created with:
  //   Package: com.soundcave_app
  //   SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
  //   SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
  GOOGLE_WEB_CLIENT_ID:
    // Web (client_type 3) OAuth client for com.soundcave_app — used as webClientId so the
    // returned idToken has the correct audience for backend verification. Do NOT use an
    // Android (client_type 1) client ID here, or sign-in will fail.
    '127371426849-bcutucb249p31oa0jfo35fku9nla9t9e.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: undefined as string | undefined,
};
