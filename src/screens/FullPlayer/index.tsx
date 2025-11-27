import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { usePlayer } from '../../components/Player';
import { COLORS } from '../../config/color';
import { Song } from '../../storage/songs';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Genres: undefined;
  Home: undefined;
  FullPlayer: undefined;
};

type FullPlayerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FullPlayer'
>;

const FullPlayerScreen: React.FC = () => {
  const navigation = useNavigation<FullPlayerScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, isLoading, pause, resume, nextSong, previousSong } = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!currentSong) {
    return null;
  }

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const contentPaddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(40);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: currentSong.cover }}
        style={styles.backgroundImage}
        blurRadius={50}>
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerButton}
              activeOpacity={0.7}>
              <FontAwesome6 name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Now Playing</Text>
            </View>
            <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
              <FontAwesome6 name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Animated.ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false },
            )}
            scrollEventThrottle={16}>
            {/* Cover Image */}
            <Animated.View
              style={[
                styles.coverContainer,
                {
                  opacity: imageOpacity,
                },
              ]}>
              <Image source={{ uri: currentSong.cover }} style={styles.coverImage} />
            </Animated.View>

            {/* Song Info */}
            <View style={styles.songInfo}>
              <Text style={styles.title}>{currentSong.title}</Text>
              <Text style={styles.artist}>{currentSong.artist}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={previousSong}
                activeOpacity={0.7}
                style={styles.controlButton}>
                <FontAwesome6 name="backward" size={28} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={isPlaying ? pause : resume}
                activeOpacity={0.7}
                disabled={isLoading}
                style={[styles.playButton, isLoading && styles.playButtonDisabled]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#050505" />
                ) : isPlaying ? (
                  <FontAwesome6 name="pause" size={32} color="#050505" />
                ) : (
                  <FontAwesome6 name="play" size={32} color="#050505" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={nextSong}
                activeOpacity={0.7}
                style={styles.controlButton}>
                <FontAwesome6 name="forward" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Additional Controls */}
            <View style={styles.additionalControls}>
              <TouchableOpacity activeOpacity={0.7} style={styles.additionalButton}>
                <FontAwesome6 name="shuffle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.additionalButton}>
                <FontAwesome6 name="repeat" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Lyrics */}
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsTitle}>Lyrics</Text>
              <Text style={styles.lyricsText}>
                {currentSong.lyrics
                  ? currentSong.lyrics
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => line.length > 0)
                      .join('\n')
                  : 'No lyrics available for this song.'}
              </Text>
            </View>
          </Animated.ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  headerButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  coverContainer: {
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(30),
  },
  coverImage: {
    width: normalize(320),
    height: normalize(320),
    borderRadius: normalize(20),
    backgroundColor: '#222',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: normalize(30),
    paddingHorizontal: normalize(20),
  },
  title: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: normalize(8),
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(18),
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: normalize(20),
    marginBottom: normalize(30),
  },
  progressBar: {
    width: '100%',
    height: normalize(4),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: normalize(2),
    marginBottom: normalize(10),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: normalize(2),
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(40),
    marginBottom: normalize(30),
    paddingHorizontal: normalize(20),
  },
  controlButton: {
    width: normalize(50),
    height: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(50),
    marginBottom: normalize(40),
    paddingHorizontal: normalize(20),
  },
  additionalButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsContainer: {
    paddingHorizontal: normalize(20),
  },
  lyricsTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
    marginBottom: normalize(16),
  },
  lyricsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(16),
    lineHeight: normalize(28),
    textAlign: 'center',
  },
});

export default FullPlayerScreen;

