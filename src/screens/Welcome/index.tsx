import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../../config/color';
// @ts-ignore
import logoImage from '../../assets/images/logo_s_white.png';
import normalize from 'react-native-normalize';

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* <View style={styles.glowOne} />
        <View style={styles.glowTwo} /> */}

        <View style={styles.logoBadge}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Welcome to SoundCave</Text>
        <Text style={styles.subtitle}>
          Curated playlists, immersive mixes, and sonic journeys crafted just
          for you.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.ctaButton}
          onPress={onGetStarted}>
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onSignIn}>
          <Text style={styles.secondaryAction}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  glowOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    top: -40,
    right: -80,
    opacity: 0.6,
  },
  glowTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    bottom: -30,
    left: -60,
    opacity: 0.5,
  },
  logoBadge: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(24),
  },
  logo: {
    width: normalize(100),
    height: normalize(100),
  },
  title: {
    color: COLORS.primaryText,
    fontSize: normalize(36),
    fontWeight: '700',
    marginBottom: normalize(12),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: normalize(16),
    lineHeight: 24,
    marginBottom: normalize(32),
  },
  ctaButton: {
    backgroundColor: COLORS.light,
    paddingVertical: normalize(16),
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  ctaText: {
    color: COLORS.primary,
    fontSize: normalize(16),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryAction: {
    color: COLORS.primaryText,
    textAlign: 'center',
    fontSize: normalize(16),
    fontWeight: '500',
  },
});

export default WelcomeScreen;

