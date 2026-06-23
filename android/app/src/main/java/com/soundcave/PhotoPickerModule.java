package com.soundcave;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import androidx.activity.result.ActivityResultRegistry;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

/**
 * Android 13+ Photo Picker Module
 * Uses native PhotoPicker API without requiring READ_MEDIA_IMAGES permission
 */
public class PhotoPickerModule extends ReactContextBaseJavaModule {
  private Promise currentPromise;

  public PhotoPickerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "PhotoPicker";
  }

  @ReactMethod
  public void pickPhoto(Promise promise) {
    try {
      currentPromise = promise;
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Android 13+: Use native PhotoPicker
        Intent intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
        intent.setType("image/*");
        
        FragmentActivity activity = (FragmentActivity) getCurrentActivity();
        if (activity != null) {
          activity.startActivityForResult(intent, 1001);
        }
      } else {
        // Fallback: Use file picker for older Android versions
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        
        FragmentActivity activity = (FragmentActivity) getCurrentActivity();
        if (activity != null) {
          activity.startActivityForResult(intent, 1001);
        }
      }
    } catch (Exception e) {
      promise.reject("ERROR", e.getMessage());
    }
  }

  public static void handlePickerResult(int requestCode, int resultCode, Intent data, Promise promise) {
    if (requestCode == 1001 && data != null) {
      Uri uri = data.getData();
      if (uri != null) {
        WritableMap result = Arguments.createMap();
        result.putString("uri", uri.toString());
        result.putString("type", "image/jpeg");
        promise.resolve(result);
      } else {
        promise.reject("NO_IMAGE", "No image selected");
      }
    } else {
      promise.reject("CANCELLED", "Photo picker cancelled");
    }
  }
}
