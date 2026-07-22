export const CONFIG = {
  BASE_URL: 'https://api.rezim.site',
  // Replace with your Web OAuth Client ID from Google Cloud Console
  // Create it under: APIs & Services > Credentials > OAuth 2.0 Client IDs > Web application
  // Android OAuth client must be created with:
  //   Package: com.soundcave_app
  //   SHA-1: D7:1E:36:B0:41:AC:71:55:69:BA:65:30:22:E0:5E:B0:8B:FA:38:25
  //   SHA-256: 5B:70:E4:DD:D2:3B:84:BF:FB:85:38:C9:E2:D1:87:02:88:27:CC:97:CA:44:79:9A:7E:9F:53:BD:A5:41:1D:56
  GOOGLE_WEB_CLIENT_ID:
    '309321457545-a5m6pr6s81vui2s3p8gic09n6kfchlck.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: undefined as string | undefined,
};
