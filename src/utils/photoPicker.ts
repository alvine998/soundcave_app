import { Platform, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Open native photo picker for thumbnail selection
 * Uses Android's PhotoPicker API on Android 13+ (no READ_MEDIA_IMAGES permission needed)
 * Falls back to image library on older Android/iOS
 */
export const selectPhotoForThumbnail = (): Promise<{
  uri: string;
  type: string;
  name: string;
}> => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        assetRepresentationMode: 'current',
      },
      (response) => {
        if (response.didCancel) {
          reject({ code: 'E_PICKER_CANCELLED' });
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage || 'Photo picker error'));
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          resolve({
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `thumbnail_${Date.now()}.jpg`,
          });
        } else {
          reject(new Error('No photo selected'));
        }
      }
    );
  });
};
