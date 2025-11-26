const fs = require('fs');
const path = require('path');

function patchReactNativeSound() {
  const targetPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-sound',
    'sound.js',
  );

  if (!fs.existsSync(targetPath)) {
    return;
  }

  const original = fs.readFileSync(targetPath, 'utf8');
  const marker = 'var resolveAssetSource = require("react-native/Libraries/Image/resolveAssetSource");';

  if (!original.includes(marker)) {
    // already patched or different version
    return;
  }

  const patched = original.replace(
    marker,
    `var resolveAssetSourceModule = require('react-native/Libraries/Image/resolveAssetSource');\nvar resolveAssetSource =\n  typeof resolveAssetSourceModule === 'function'\n    ? resolveAssetSourceModule\n    : resolveAssetSourceModule && resolveAssetSourceModule.default\n    ? resolveAssetSourceModule.default\n    : function() {\n        return null;\n      };`
  );

  fs.writeFileSync(targetPath, patched);
  console.log('Applied resolveAssetSource patch to react-native-sound.');
}

function patchMusicControl() {
  const targetPath = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-music-control',
    'android',
    'src',
    'main',
    'java',
    'com',
    'tanguyantoine',
    'react',
    'MusicControlModule.java',
  );

  if (!fs.existsSync(targetPath)) {
    return;
  }

  const original = fs.readFileSync(targetPath, 'utf8');
  
  // Check if already patched
  if (original.includes('Context.RECEIVER_NOT_EXPORTED')) {
    return;
  }

  const marker = 'receiver = new MusicControlReceiver(this, context);\n        context.registerReceiver(receiver, filter);';

  if (!original.includes(marker)) {
    // Different version or already modified
    return;
  }

  const patched = original.replace(
    marker,
    `receiver = new MusicControlReceiver(this, context);
        // Android 13+ requires RECEIVER_EXPORTED or RECEIVER_NOT_EXPORTED flag
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(receiver, filter);
        }`
  );

  fs.writeFileSync(targetPath, patched);
  console.log('Applied Android 13+ receiver patch to react-native-music-control.');
}

patchReactNativeSound();
patchMusicControl();

