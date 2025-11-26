import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import normalize from 'react-native-normalize';

// @ts-ignore
import logoImage from '../../assets/images/logo_s_white.png';
import { COLORS } from '../../config/color';

type SplashScreenProps = {
  onFinish: (routeName: string) => void;
  profile: any;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, profile }) => {
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Wait for minimum 1.5 seconds, then navigate based on profile
    const timer = setTimeout(() => {
      if (hasFinishedRef.current) {
        return;
      }
      hasFinishedRef.current = true;

      // Determine target route based on profile
      let targetRoute = 'Welcome';
      if (profile) {
        targetRoute =
          profile.selectedGenres && profile.selectedGenres.length
            ? 'Home'
            : 'Genres';
      }
      onFinish(targetRoute);
    }, 1500); // 1.5 seconds

    return () => clearTimeout(timer);
  }, [onFinish, profile]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: normalize(100),
    height: normalize(100),
  },
});

export default SplashScreen;
