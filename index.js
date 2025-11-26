/**
 * @format
 */

// Polyfill for performance.now() to prevent errors in production builds
if (typeof global !== 'undefined' && !global.performance) {
  global.performance = {
    now: function() {
      if (global.nativePerformanceNow) {
        return global.nativePerformanceNow();
      }
      return Date.now();
    },
    mark: function() {},
    measure: function() {},
  };
} else if (typeof global !== 'undefined' && global.performance && !global.performance.now) {
  global.performance.now = function() {
    if (global.nativePerformanceNow) {
      return global.nativePerformanceNow();
    }
    return Date.now();
  };
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
