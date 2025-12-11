/**
 * @format
 */

// Polyfill for window, document, and location objects to prevent errors in React Native
if (typeof global !== 'undefined') {
  if (typeof global.window === 'undefined') {
    global.window = global;
  }
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      createElementNS: () => ({}),
      createTextNode: () => ({}),
      getElementById: () => null,
      getElementsByTagName: () => [],
      getElementsByClassName: () => [],
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {},
    };
  }
  // Polyfill for location object (used by axios and other libraries)
  if (typeof global.location === 'undefined') {
    const locationPolyfill = {
      href: 'react-native://',
      protocol: 'react-native:',
      host: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
      origin: 'react-native://',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    };
    global.location = locationPolyfill;
    // Also add location to window if window exists
    if (global.window) {
      global.window.location = locationPolyfill;
    }
  } else if (global.window && typeof global.window.location === 'undefined') {
    global.window.location = global.location;
  }
  
  // Polyfill for navigator object (sometimes used by libraries)
  if (typeof global.navigator === 'undefined') {
    global.navigator = {
      userAgent: 'ReactNative',
      platform: 'ReactNative',
      language: 'en',
      languages: ['en'],
    };
  }
  if (global.window && typeof global.window.navigator === 'undefined') {
    global.window.navigator = global.navigator;
  }
}

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
