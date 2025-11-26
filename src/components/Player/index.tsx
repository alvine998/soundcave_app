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
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
};

type PlayerContextValue = {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  playSong: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  nextSong: () => void;
  previousSong: () => void;
  stop: () => void;
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
  playSong: () => {},
  pause: () => {},
  resume: () => {},
  nextSong: () => {},
  previousSong: () => {},
  stop: () => {},
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
  });
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const soundRef = useRef<Sound | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Update full player visibility when route changes
  useEffect(() => {
    if (onNavigationStateChange) {
      // Register callback to be called when navigation state changes
      onNavigationStateChange((routeName: string | null) => {
        setIsFullPlayerVisible(routeName === 'FullPlayer');
      });
    }
  }, [onNavigationStateChange]);

  // Initialize MusicControl and setup event listeners
  useEffect(() => {
    Sound.setCategory('Playback');

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
    };
    setPlayerState(newState);
    currentSongRef.current = null;
    isPlayingRef.current = false;
    updateMusicControl(null, false);
  }, [updateMusicControl]);

  const pause = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pause(() => {
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
    setPlayerState(prev => {
      isPlayingRef.current = true;
      updateMusicControl(prev.currentSong, true);
      return {
        currentSong: prev.currentSong,
        isPlaying: true,
        isLoading: false,
      };
    });

    // Resume playback - the callback is called when playback finishes
    soundRef.current.play(success => {
      // When playback completes, set playing to false
      setPlayerState(prev => {
        isPlayingRef.current = false;
        updateMusicControl(prev.currentSong, false);
        return {
          ...prev,
          isPlaying: false,
        };
      });
    });
  }, [updateMusicControl]);

  const playSong = useCallback(
    (song: Song, forceRestart: boolean = false) => {
      // Use ref to get current song to avoid stale closure issues
      const currentSong = currentSongRef.current;
      
      // If same song is already playing and not forcing restart, pause it
      if (
        !forceRestart &&
        soundRef.current &&
        currentSong?.url === song.url &&
        isPlayingRef.current
      ) {
        pause();
        return;
      }

      // If same song is paused and not forcing restart, resume it
      if (
        !forceRestart &&
        soundRef.current &&
        currentSong?.url === song.url &&
        !isPlayingRef.current &&
        !playerState.isLoading
      ) {
        resume();
        return;
      }

      // Stop and release current sound before playing new one
      if (soundRef.current) {
        soundRef.current.stop(() => {
          soundRef.current?.release();
          soundRef.current = null;
        });
      }

      setPlayerState(prev => ({
        ...prev,
        isLoading: true,
        isPlaying: false,
      }));

      const playback = new Sound(song.url, '', error => {
        if (error) {
          // Log error so we can see why audio failed to load (e.g. network / format issues)
          // eslint-disable-next-line no-console
          console.warn('Failed to load sound', song.url, error);
          setPlayerState({
            currentSong: null,
            isPlaying: false,
            isLoading: false,
          });
          return;
        }

        soundRef.current = playback;
        currentSongRef.current = song;
        setPlayerState({
          currentSong: song,
          isPlaying: false,
          isLoading: false,
        });

        // Auto-play the song
        // Set playing state immediately after calling play
        setPlayerState(prev => {
          isPlayingRef.current = true;
          updateMusicControl(song, true);
          return {
            ...prev,
            isPlaying: true,
          };
        });

        playback.play(success => {
          // This callback is called when playback finishes
          setPlayerState(prev => {
            isPlayingRef.current = false;
            updateMusicControl(prev.currentSong, false);
            return {
              ...prev,
              isPlaying: false,
            };
          });
        });
      });
    },
    [playerState.currentSong, playerState.isPlaying, playerState.isLoading, pause, resume],
  );

  const nextSong = useCallback(() => {
    // Use both ref and state to ensure we have the current song
    const currentSong = currentSongRef.current || playerState.currentSong;
    if (!currentSong) {
      // If no song is playing, play the first song
      if (SONGS.length > 0) {
        playSong(SONGS[0]);
      }
      return;
    }

    const currentIndex = SONGS.findIndex(s => s.url === currentSong.url);
    if (currentIndex === -1) {
      // Current song not found in list, play first song
      if (SONGS.length > 0) {
        playSong(SONGS[0]);
      }
      return;
    }

    const nextIndex = (currentIndex + 1) % SONGS.length;
    const nextSongToPlay = SONGS[nextIndex];
    
    // If only one song or next song is the same, restart from beginning
    if (SONGS.length <= 1 || nextSongToPlay.url === currentSong.url) {
      // Restart current song from beginning - force restart to avoid pause/resume logic
      playSong(currentSong, true);
    } else {
      playSong(nextSongToPlay);
    }
  }, [playSong, playerState.currentSong]);

  const previousSong = useCallback(() => {
    // Use both ref and state to ensure we have the current song
    const currentSong = currentSongRef.current || playerState.currentSong;
    if (!currentSong) {
      // If no song is playing, play the last song
      if (SONGS.length > 0) {
        playSong(SONGS[SONGS.length - 1]);
      }
      return;
    }

    const currentIndex = SONGS.findIndex(s => s.url === currentSong.url);
    if (currentIndex === -1) {
      // Current song not found in list, play last song
      if (SONGS.length > 0) {
        playSong(SONGS[SONGS.length - 1]);
      }
      return;
    }

    const prevIndex = currentIndex === 0 ? SONGS.length - 1 : currentIndex - 1;
    const prevSongToPlay = SONGS[prevIndex];
    
    // If only one song or previous song is the same, restart from beginning
    if (SONGS.length <= 1 || prevSongToPlay.url === currentSong.url) {
      // Restart current song from beginning - force restart to avoid pause/resume logic
      playSong(currentSong, true);
    } else {
      playSong(prevSongToPlay);
    }
  }, [playSong, playerState.currentSong]);

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
      const currentSong = currentSongRef.current;
      if (currentSong) {
        const currentIndex = SONGS.findIndex(s => s.url === currentSong.url);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % SONGS.length;
          playSong(SONGS[nextIndex]);
        }
      }
    };

    const handleRemotePrevious = () => {
      const currentSong = currentSongRef.current;
      if (currentSong) {
        const currentIndex = SONGS.findIndex(s => s.url === currentSong.url);
        if (currentIndex !== -1) {
          const prevIndex = currentIndex === 0 ? SONGS.length - 1 : currentIndex - 1;
          playSong(SONGS[prevIndex]);
        }
      }
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
  }, [playSong, pause, resume, stop]);

  return (
    <PlayerContext.Provider
      value={{
        currentSong: playerState.currentSong,
        isPlaying: playerState.isPlaying,
        isLoading: playerState.isLoading,
        playSong,
        pause,
        resume,
        nextSong,
        previousSong,
        stop,
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
  onOpenFullPlayer,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (song) {
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
  }, [song, translateY, opacity]);

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
          transform: [{ translateY }],
        },
      ]}>
      <View style={styles.playerBar}>
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

