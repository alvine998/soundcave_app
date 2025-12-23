import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from 'react-native';
import Sound from 'react-native-sound';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// @ts-ignore: react-native-music-control lacks bundled types.
import MusicControl from 'react-native-music-control';

import { COLORS } from '../../config/color';
import { Song, SONGS } from '../../storage/songs';

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
};

type PlayerContextValue = {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playSong: (song: Song, playlist?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  nextSong: () => void;
  previousSong: () => void;
  stop: () => void;
  seek: (time: number) => void;
};

type PlayerProviderProps = {
  children: ReactNode;
  navigationRef?: React.RefObject<any>;
  onNavigationStateChange?: (callback: (routeName: string | null) => void) => void;
};

const PlayerContext = createContext<PlayerContextValue>({
  currentSong: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  playSong: () => {},
  pause: () => {},
  resume: () => {},
  nextSong: () => {},
  previousSong: () => {},
  stop: () => {},
  seek: () => {},
});

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ 
  children,
  navigationRef,
  onNavigationStateChange,
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
  });
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const soundRef = useRef<Sound | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingSongRef = useRef<boolean>(false); // Flag to prevent duplicate playSong calls
  const playlistQueueRef = useRef<Song[]>([]); // Queue untuk menyimpan playlist yang sedang diputar

  // Update full player visibility when route changes
  useEffect(() => {
    if (onNavigationStateChange) {
      // Register callback to be called when navigation state changes
      onNavigationStateChange((routeName: string | null) => {
        setIsFullPlayerVisible(routeName === 'FullPlayer');
      });
    }
  }, [onNavigationStateChange]);

  // Progress tracking interval
  useEffect(() => {
    const updateProgress = () => {
      if (soundRef.current && isPlayingRef.current) {
        soundRef.current.getCurrentTime((currentTime: number) => {
          if (soundRef.current && isPlayingRef.current) {
            const duration = soundRef.current.getDuration();
            setPlayerState(prev => ({
              ...prev,
              currentTime: isNaN(currentTime) ? 0 : currentTime,
              duration: isNaN(duration) || duration < 0 ? (prev.duration > 0 ? prev.duration : 0) : duration,
            }));
          }
        });
      }
    };

    // Clear existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Start progress tracking if playing
    if (playerState.isPlaying && soundRef.current) {
      progressIntervalRef.current = setInterval(updateProgress, 100); // Update every 100ms
      // Initial update
      updateProgress();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [playerState.isPlaying, playerState.currentSong]);

  // Initialize MusicControl and setup event listeners
  useEffect(() => {
    // Enable playback in silent mode for iOS
    Sound.setCategory('Playback', true);

    // Initialize MusicControl
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        MusicControl.enableBackgroundMode(true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('play', true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('pause', true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('next', true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('previous', true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('stop', true);
        // @ts-ignore: MusicControl API types
        MusicControl.enableControl('closeNotification', true, { when: 'always' });
      } catch (error) {
        console.warn('MusicControl initialization error:', error);
      }
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.stop(() => {
          soundRef.current?.release();
          soundRef.current = null;
        });
      }
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        MusicControl.stopControl();
      }
    };
  }, []);


  // Helper function to update MusicControl notification
  const updateMusicControl = useCallback((song: Song | null, playing: boolean) => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      if (song) {
        // @ts-ignore: MusicControl API types
        MusicControl.setNowPlaying({
          title: song.title,
          artist: song.artist,
          artwork: song.cover,
          duration: 0,
          elapsedTime: 0,
          isPlaying: playing,
        });
        // @ts-ignore: MusicControl API types
        MusicControl.updatePlayback({
          state: playing ? MusicControl.STATE_PLAYING : MusicControl.STATE_PAUSED,
        });
      } else {
        MusicControl.stopControl();
      }
    } catch (error) {
      console.warn('MusicControl update error:', error);
    }
  }, []);

  const stop = useCallback(() => {
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (soundRef.current) {
      soundRef.current.stop(() => {
        soundRef.current?.release();
        soundRef.current = null;
      });
    }
    const newState = {
      currentSong: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
    };
    setPlayerState(newState);
    currentSongRef.current = null;
    isPlayingRef.current = false;
    playlistQueueRef.current = []; // Clear playlist queue on stop
    updateMusicControl(null, false);
  }, [updateMusicControl]);

  const pause = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pause(() => {
        // Clear progress interval when paused
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setPlayerState(prev => {
          if (prev.isPlaying) {
            isPlayingRef.current = false;
            updateMusicControl(prev.currentSong, false);
            return { ...prev, isPlaying: false };
          }
          return prev;
        });
      });
    }
  }, [updateMusicControl]);

  const resume = useCallback(() => {
    if (!soundRef.current) {
      return;
    }

    // Check if sound is loaded
    if (!soundRef.current.isLoaded()) {
      return;
    }

    // Update state to playing BEFORE calling play() to update UI immediately
    isPlayingRef.current = true;
    updateMusicControl(currentSongRef.current, true);
    setPlayerState(prev => ({
      ...prev,
      isPlaying: true,
      isLoading: false,
    }));

    // Restart progress tracking when resumed
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      if (soundRef.current && isPlayingRef.current) {
        soundRef.current.getCurrentTime((currentTime: number) => {
          if (soundRef.current) {
            const duration = soundRef.current.getDuration();
            setPlayerState(prev => ({
              ...prev,
              currentTime: isNaN(currentTime) ? 0 : currentTime,
              duration: isNaN(duration) || duration < 0 ? prev.duration : duration,
            }));
          }
        });
      }
    }, 100);

    // Resume playback - the callback is called when playback finishes
    soundRef.current.play(success => {
      // When playback completes, set playing to false
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setPlayerState(prev => {
        isPlayingRef.current = false;
        updateMusicControl(prev.currentSong, false);
        return {
          ...prev,
          isPlaying: false,
          currentTime: 0,
        };
      });
    });
  }, [updateMusicControl]);

  const playSong = useCallback(
    (song: Song, playlist?: Song[]) => {
      // Prevent duplicate calls
      if (isPlayingSongRef.current) {
        console.log('playSong already in progress, skipping duplicate call');
        return;
      }

      // Validate song URL before attempting to play
      if (!song.url || song.url.trim() === '') {
        console.error('Cannot play song: URL is empty', {
          title: song.title,
          artist: song.artist,
          url: song.url,
        });
        Alert.alert(
          'Tidak Dapat Memutar',
          `URL audio untuk "${song.title}" tidak tersedia.`,
          [{ text: 'OK' }]
        );
        setPlayerState(prev => ({
          ...prev,
          isLoading: false,
        }));
        return;
      }

      // Use ref to get current song to avoid stale closure issues
      const currentSong = currentSongRef.current;
      
      // If same song is already playing, pause it
      if (
        soundRef.current &&
        currentSong?.url === song.url &&
        isPlayingRef.current
      ) {
        pause();
        return;
      }

      // If same song is paused, resume it
      if (
        soundRef.current &&
        currentSong?.url === song.url &&
        !isPlayingRef.current &&
        !playerState.isLoading
      ) {
        resume();
        return;
      }

      // Set flag to prevent duplicate calls
      isPlayingSongRef.current = true;

      // Update playlist queue if provided
      if (playlist && Array.isArray(playlist) && playlist.length > 0) {
        playlistQueueRef.current = [...playlist];
      }

      // Stop and release current sound before playing new one
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Stop and release current sound, then play new one
      const stopAndPlay = () => {
        if (soundRef.current) {
          soundRef.current.stop(() => {
            soundRef.current?.release();
            soundRef.current = null;
            // After stopping, load and play new song
            loadAndPlaySong();
          });
        } else {
          // No current sound, directly load and play new song
          loadAndPlaySong();
        }
      };

      const loadAndPlaySong = () => {
        setPlayerState(prev => ({
          ...prev,
          isLoading: true,
          isPlaying: false,
        }));

        const playback = new Sound(song.url, '', (error) => {
          if (error) {
            // Log error so we can see why audio failed to load (e.g. network / format issues)
          console.error('Failed to load sound:', {
            url: song.url,
            title: song.title,
            artist: song.artist,
            error: error,
          });
          Alert.alert(
            'Gagal Memuat Audio',
            `Tidak dapat memuat audio untuk "${song.title}".\n\nPastikan koneksi internet stabil dan URL audio valid.`,
            [{ text: 'OK' }]
          );
          setPlayerState({
            currentSong: null,
            isPlaying: false,
            isLoading: false,
            currentTime: 0,
            duration: 0,
          });
          isPlayingSongRef.current = false; // Reset flag on error
          return;
        }

        soundRef.current = playback;
        currentSongRef.current = song;
        
        // Get duration immediately
        const duration = playback.getDuration();
        setPlayerState({
          currentSong: song,
          isPlaying: false,
          isLoading: false,
          currentTime: 0,
          duration: isNaN(duration) || duration < 0 ? 0 : duration,
        });

        // Auto-play the song
        // Set playing state immediately after calling play
        isPlayingRef.current = true;
        updateMusicControl(song, true);
        setPlayerState(prev => ({
          ...prev,
          isPlaying: true,
        }));

        // Start progress tracking
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = setInterval(() => {
          if (soundRef.current && isPlayingRef.current) {
            soundRef.current.getCurrentTime((currentTime: number) => {
              if (soundRef.current) {
                const duration = soundRef.current.getDuration();
                setPlayerState(prev => ({
                  ...prev,
                  currentTime: isNaN(currentTime) ? 0 : currentTime,
                  duration: isNaN(duration) || duration < 0 ? prev.duration : duration,
                }));
              }
            });
          }
        }, 100);

        // Reset flag after a short delay to allow playback to start
        // This prevents duplicate calls during the transition period
        setTimeout(() => {
          isPlayingSongRef.current = false;
        }, 500);

        playback.play((success) => {
          if (!success) {
            console.error('Playback failed for song:', {
              title: song.title,
              artist: song.artist,
              url: song.url,
            });
            Alert.alert(
              'Gagal Memutar',
              `Tidak dapat memutar "${song.title}".\n\nFormat audio mungkin tidak didukung atau file rusak.`,
              [{ text: 'OK' }]
            );
            // Clear progress interval on error
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setPlayerState(prev => {
              isPlayingRef.current = false;
              updateMusicControl(prev.currentSong, false);
              return {
                ...prev,
                isPlaying: false,
              };
            });
            isPlayingSongRef.current = false; // Reset flag on error
            return;
          }
          // This callback is called when playback finishes
          // Clear progress interval when finished
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setPlayerState(prev => {
            isPlayingRef.current = false;
            updateMusicControl(prev.currentSong, false);
            return {
              ...prev,
              isPlaying: false,
              currentTime: 0,
            };
          });
        });
        }); // Close Sound constructor callback
      };

      // Start the stop and play process
      stopAndPlay();
    },
    // pause and resume are stable callbacks with their own dependency arrays, so we don't need them here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerState.currentSong, playerState.isPlaying, playerState.isLoading, updateMusicControl],
  );

  const nextSong = useCallback(() => {
    // Prevent duplicate calls
    if (isPlayingSongRef.current) {
      console.log('nextSong: playSong already in progress, skipping');
      return;
    }

    // Use both ref and state to ensure we have the current song
    const currentSong = currentSongRef.current || playerState.currentSong;
    
    // Use playlist queue if available, otherwise fallback to SONGS
    const playlist = playlistQueueRef.current.length > 0 ? playlistQueueRef.current : SONGS;
    
    if (!currentSong) {
      // If no song is playing, play the first song
      if (playlist.length > 0) {
        playSong(playlist[0], [...playlist]);
      }
      return;
    }

    const currentIndex = playlist.findIndex(s => s.url === currentSong.url);
    if (currentIndex === -1) {
      // Current song not found in list, play first song
      if (playlist.length > 0) {
        playSong(playlist[0], [...playlist]);
      }
      return;
    }

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSongToPlay = playlist[nextIndex];
    
    // Only play if next song is different from current song
    if (nextSongToPlay.url !== currentSong.url) {
      playSong(nextSongToPlay, [...playlist]);
    } else if (playlist.length <= 1) {
      // Only restart if there's only one song
      playSong(currentSong, [...playlist]);
    }
    // If next song is same as current and there are multiple songs, do nothing
  }, [playSong, playerState.currentSong]);

  const previousSong = useCallback(() => {
    // Prevent duplicate calls
    if (isPlayingSongRef.current) {
      console.log('previousSong: playSong already in progress, skipping');
      return;
    }

    // Use both ref and state to ensure we have the current song
    const currentSong = currentSongRef.current || playerState.currentSong;
    
    // Use playlist queue if available, otherwise fallback to SONGS
    const playlist = playlistQueueRef.current.length > 0 ? playlistQueueRef.current : SONGS;
    
    if (!currentSong) {
      // If no song is playing, play the last song
      if (playlist.length > 0) {
        playSong(playlist[playlist.length - 1], [...playlist]);
      }
      return;
    }

    const currentIndex = playlist.findIndex(s => s.url === currentSong.url);
    if (currentIndex === -1) {
      // Current song not found in list, play last song
      if (playlist.length > 0) {
        playSong(playlist[playlist.length - 1], [...playlist]);
      }
      return;
    }

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSongToPlay = playlist[prevIndex];
    
    // Only play if previous song is different from current song
    if (prevSongToPlay.url !== currentSong.url) {
      playSong(prevSongToPlay, [...playlist]);
    } else if (playlist.length <= 1) {
      // Only restart if there's only one song
      playSong(currentSong, [...playlist]);
    }
    // If previous song is same as current and there are multiple songs, do nothing
  }, [playSong, playerState.currentSong]);

  const seek = useCallback((time: number) => {
    if (soundRef.current && soundRef.current.isLoaded()) {
      // Clamp time between 0 and duration
      const duration = soundRef.current.getDuration();
      const clampedTime = Math.max(0, Math.min(time, duration));
      
      // Update currentTime immediately for UI responsiveness
      setPlayerState(prev => ({
        ...prev,
        currentTime: clampedTime,
      }));
      
      // Seek to the new position
      soundRef.current.setCurrentTime(clampedTime);
    }
  }, []);

  // Setup remote control event listeners after all functions are defined
  useEffect(() => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    const handleRemotePlay = () => {
      if (soundRef.current && currentSongRef.current && !isPlayingRef.current) {
        resume();
      }
    };

    const handleRemotePause = () => {
      if (soundRef.current && isPlayingRef.current) {
        pause();
      }
    };

    const handleRemoteNext = () => {
      // Use nextSong function instead of directly calling playSong
      nextSong();
    };

    const handleRemotePrevious = () => {
      // Use previousSong function instead of directly calling playSong
      previousSong();
    };

    const handleRemoteStop = () => {
      stop();
    };

    // @ts-ignore: MusicControl event types
    MusicControl.on('play', handleRemotePlay);
    // @ts-ignore: MusicControl event types
    MusicControl.on('pause', handleRemotePause);
    // @ts-ignore: MusicControl event types
    MusicControl.on('nextTrack', handleRemoteNext);
    // @ts-ignore: MusicControl event types
    MusicControl.on('previousTrack', handleRemotePrevious);
    // @ts-ignore: MusicControl event types
    MusicControl.on('stop', handleRemoteStop);

    return () => {
      // @ts-ignore: MusicControl event types
      MusicControl.off('play', handleRemotePlay);
      // @ts-ignore: MusicControl event types
      MusicControl.off('pause', handleRemotePause);
      // @ts-ignore: MusicControl event types
      MusicControl.off('nextTrack', handleRemoteNext);
      // @ts-ignore: MusicControl event types
      MusicControl.off('previousTrack', handleRemotePrevious);
      // @ts-ignore: MusicControl event types
      MusicControl.off('stop', handleRemoteStop);
    };
  }, [pause, resume, stop, nextSong, previousSong]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong: playerState.currentSong,
        isPlaying: playerState.isPlaying,
        isLoading: playerState.isLoading,
        currentTime: playerState.currentTime,
        duration: playerState.duration,
        playSong,
        pause,
        resume,
        nextSong,
        previousSong,
        stop,
        seek,
      }}>
          {children}
          {!isFullPlayerVisible && (
            <PlayerBar
              song={playerState.currentSong}
              isPlaying={playerState.isPlaying}
              isLoading={playerState.isLoading}
              onPause={pause}
              onResume={resume}
              onNext={nextSong}
              onPrevious={previousSong}
              onStop={stop}
              onOpenFullPlayer={() => {
                navigationRef?.current?.navigate('FullPlayer');
              }}
            />
          )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);

type PlayerBarProps = {
  song: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStop: () => void;
  onOpenFullPlayer?: () => void;
};

const PlayerBar: React.FC<PlayerBarProps> = ({
  song,
  isPlaying,
  isLoading,
  onPause,
  onResume,
  onNext,
  onPrevious,
  onStop,
  onOpenFullPlayer,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to swipes (not taps)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward and horizontal swipes
        if (gestureState.dy > 0 || Math.abs(gestureState.dx) > 20) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 80;
        const velocityThreshold = 0.5;

        // Swipe down to dismiss
        if (
          gestureState.dy > swipeThreshold ||
          gestureState.vy > velocityThreshold
        ) {
          dismissPlayerBar();
          return;
        }

        // Swipe left or right to dismiss
        if (
          Math.abs(gestureState.dx) > swipeThreshold ||
          Math.abs(gestureState.vx) > velocityThreshold
        ) {
          dismissPlayerBar();
          return;
        }

        // Reset position if swipe wasn't strong enough
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      },
    }),
  ).current;

  const dismissPlayerBar = () => {
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: 150 },
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Stop the song after animation completes
      onStop();
      // Reset pan position for next time
      pan.setValue({ x: 0, y: 0 });
    });
  };

  useEffect(() => {
    if (song) {
      // Reset pan position when new song starts
      pan.setValue({ x: 0, y: 0 });
      
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [song, translateY, opacity, pan]);

  if (!song) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          // Handle foldable devices like Samsung Z Fold - add extra padding for gesture navigation
          bottom: Math.max(insets.bottom, normalize(8)) + normalize(70),
          opacity,
          transform: [
            { translateY },
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}>
      <View style={styles.playerBar} {...panResponder.panHandlers}>
        <TouchableOpacity
          onPress={onOpenFullPlayer}
          activeOpacity={0.8}
          disabled={!onOpenFullPlayer}
          style={styles.coverContainer}>
          <Image source={{ uri: song.cover }} style={styles.cover} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onOpenFullPlayer}
          activeOpacity={0.8}
          disabled={!onOpenFullPlayer}
          style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </TouchableOpacity>
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={onPrevious}
            activeOpacity={0.7}
            style={styles.controlButton}>
            <FontAwesome6 name="backward" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={isPlaying ? onPause : onResume}
            activeOpacity={0.7}
            disabled={isLoading}
            style={[styles.playButton, isLoading && styles.playButtonDisabled]}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#050505" />
            ) : isPlaying ? (
              <FontAwesome6 name="pause" size={20} color="#050505" />
            ) : (
              <FontAwesome6 name="play" size={20} color="#050505" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.7}
            style={styles.controlButton}>
            <FontAwesome6 name="forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: normalize(16),
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: normalize(16),
    padding: normalize(12),
    gap: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coverContainer: {
    borderRadius: normalize(8),
  },
  cover: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(8),
    backgroundColor: '#222',
  },
  songInfo: {
    flex: 1,
    gap: normalize(4),
  },
  title: {
    color: '#fff',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  controlButton: {
    width: normalize(36),
    height: normalize(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
});

