import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  View as SafeAreaViewFallback,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NodePlayer } from 'react-native-nodemediaclient';
import normalize from 'react-native-normalize';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../config/color';
import {
  connectSocket,
  disconnectSocket,
  joinStreamRoom,
  leaveStreamRoom,
  sendLiveComment,
  getSocket,
} from '../../utils/socket';
import { getUserProfile, UserProfile } from '../../storage/userStorage';
import { getApiInstance } from '../../utils/api';

type RootStackParamList = {
  LiveStreamDetail: {
    id: string;
    title: string;
    streamer: string;
    viewerCount: number;
    cover: string;
    thumbnail: string;
    avatar: string;
    playbackUrl?: string;
    liveFrom?: string;
  };
};

type LiveStreamDetailRouteProp = RouteProp<
  RootStackParamList,
  'LiveStreamDetail'
>;

interface Comment {
  id?: string;
  stream_id?: number;
  username: string;
  message: string;
  profile_image: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LiveStreamDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<LiveStreamDetailRouteProp>();
  const {
    title,
    streamer,
    viewerCount,
    cover,
    thumbnail,
    avatar,
    playbackUrl,
    liveFrom,
  } = route.params;
  const isWebStream = liveFrom === 'web';

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentViewerCount, setCurrentViewerCount] = useState(
    viewerCount || 0,
  );
  const [playerUrl, setPlayerUrl] = useState<string>('');
  const [streamError, setStreamError] = useState(false);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const insets = useSafeAreaInsets();

  const startConnectionTimeout = () => {
    if (connectionTimeoutRef.current)
      clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setStreamError(true);
        setIsLoading(false);
      }
    }, 30000);
  };

  const clearConnectionTimeout = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchStreamUrl = async (): Promise<string> => {
    try {
      const api = await getApiInstance();
      const response = await api.get(`/api/artist-streams/${route.params.id}`);
      const data = response.data?.data;
      const url: string = data?.playback_url
        ? data.playback_url.replace('localhost', '154.26.137.37')
        : playbackUrl || '';
      console.log('Fetched fresh playback_url from API');
      return url;
    } catch (error) {
      console.warn(
        'Failed to fetch stream URL from API, falling back to route param:',
        error,
      );
      return playbackUrl || '';
    }
  };

  // Connect to Socket and join room
  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      try {
        // Get user profile first
        const profile = await getUserProfile();
        if (isMounted) setUserProfile(profile);

        // Fetch initial comments from DB (if endpoint exists)
        try {
          const api = await getApiInstance();
          const response = await api.get(
            `/api/live-streams/${route.params.id}/comments`,
          );
          const dbComments = response.data?.data || [];
          if (isMounted) setComments(dbComments);
        } catch (commentError) {
          console.log('Comments endpoint not available, starting fresh');
          if (isMounted) setComments([]);
        }

        // Setup socket
        await connectSocket();
        joinStreamRoom(route.params.id);

        const socket = await getSocket();
        socket.on('new_comment', (comment: Comment) => {
          if (isMounted) {
            setComments(prev => [...prev, comment]);
          }
        });

        socket.on('viewer_count_update', (data: any) => {
          const eventStreamId = data.stream_id || data.streamId;
          if (
            isMounted &&
            eventStreamId?.toString() === route.params.id.toString()
          ) {
            setCurrentViewerCount(data.viewer_count);
          }
        });

        socket.on('stream_ended', (data: any) => {
          const eventStreamId = data.stream_id || data.streamId;
          if (
            isMounted &&
            eventStreamId?.toString() === route.params.id.toString()
          ) {
            console.log('Stream ended event received, navigating home');
            Alert.alert(
              'Stream Ended',
              'The broadcast has ended. Returning to home screen.',
              [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
              { cancelable: false },
            );
          }
        });
      } catch (error) {
        console.error('Error setting up live stream:', error);
        if (isMounted) setComments([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    setupSocket();
    // Fetch fresh playback URL from API on mount, then start connection timeout
    fetchStreamUrl().then(url => {
      if (isMounted) {
        setPlayerUrl(url);
        startConnectionTimeout();
      }
    });

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      clearConnectionTimeout();
      leaveStreamRoom(route.params.id);
      // We might not want to disconnect globally if other parts use it,
      // but for now let's keep it simple.
    };
  }, [route.params.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const handleSendComment = () => {
    if (newComment.trim().length === 0) return;

    const commentData = {
      username: userProfile?.full_name || 'Anonymous',
      message: newComment,
      profile_image:
        userProfile?.profile_image || 'https://i.pravatar.cc/150?u=anon',
    };

    // Emit via socket
    sendLiveComment(route.params.id, commentData);

    setNewComment('');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.profile_image }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentTextContainer}>
        <Text style={styles.commentUser}>{item.username}</Text>
        <Text style={styles.commentText}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Live Stream Video Player */}
      {playerUrl ? (
        <View
          style={[
            styles.backgroundStream,
            isWebStream && styles.backgroundStreamLandscape,
          ]}
        >
          <NodePlayer
            style={
              isWebStream
                ? ({ width: "100%", height: 400 } as any)
                : ({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT } as any)
            }
            url={playerUrl}
            bufferTime={300}
            maxBufferTime={1000}
            autoplay={true}
            onEvent={(code, msg) => {
              console.log('NodePlayer event=' + code + ' msg=' + msg);
              if (code === 1001) {
                // Successfully playing — clear timeout and show stream
                clearConnectionTimeout();
                setIsLoading(false);
                setStreamError(false);
              } else if (code === 1003) {
                // NodePlayer native reconnect — let it handle retrying, just stay loading
                setIsLoading(true);
              } else if (
                code === 1002 ||
                code === 1004 ||
                code === 1005 ||
                code === 1006
              ) {
                setIsLoading(true);
              }
            }}
          />
        </View>
      ) : null}
      {isLoading && !streamError && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Stream is starting, please wait...
          </Text>
          <Text style={styles.loadingSubText}>
            HLS segments may take a few seconds to appear
          </Text>
        </View>
      )}
      {streamError && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <Text style={styles.errorText}>Stream unavailable</Text>
          <Text style={styles.errorSubText}>
            The stream may have ended or is temporarily offline.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setStreamError(false);
              setIsLoading(true);
              const freshUrl = await fetchStreamUrl();
              setPlayerUrl(freshUrl);
              startConnectionTimeout();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.3)' },
        ]}
      />

      <SafeAreaViewFallback
        style={
          isWebStream
            ? styles.safeAreaLandscape
            : [styles.safeArea, { paddingTop: insets.top }]
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.streamerInfo}>
            <Image source={{ uri: avatar }} style={styles.streamerAvatar} />
            <View>
              <Text style={styles.streamerName}>{streamer}</Text>
              <View style={styles.viewCountContainer}>
                <Animated.View
                  style={[
                    styles.liveIndicator,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={styles.viewCountText}>
                  {currentViewerCount.toLocaleString()} viewers
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome6 name="xmark" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Main Content Area (Flexible) */}
        {/* <View style={styles.flexArea}>
          <View style={styles.titleContainer}>
            <Text style={styles.streamTitle}>{title}</Text>
          </View>
        </View> */}

        {/* Comments Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          style={[
            styles.bottomSection,
            { paddingBottom: Math.max(insets.bottom, normalize(20)) },
          ]}
        >
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item, index) => item.id || index.toString()}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.commentsContent}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Say something..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleSendComment}>
                <FontAwesome6
                  name="paper-plane"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.likedButton]}
              onPress={() => setIsLiked(!isLiked)}
            >
              <FontAwesome6
                name="heart"
                size={20}
                color="#fff"
                solid={isLiked}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome6 name="share" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaViewFallback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundStream: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  // Web/webcam streams are landscape — rotate 90° and scale to fill the screen
  backgroundStreamLandscape: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    position: 'absolute',
    top: (SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
    left: -(SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
    transform: [{ rotate: '90deg' }],
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: normalize(10),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    marginTop: normalize(8),
  },
  loadingSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: normalize(11),
    marginTop: normalize(4),
    textAlign: 'center',
    paddingHorizontal: normalize(40),
  },
  errorText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
  },
  errorSubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
    textAlign: 'center',
    paddingHorizontal: normalize(40),
  },
  retryButton: {
    marginTop: normalize(16),
    paddingHorizontal: normalize(32),
    paddingVertical: normalize(12),
    backgroundColor: COLORS.primary,
    borderRadius: normalize(24),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
  },
  safeAreaLandscape: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    position: 'absolute',
    top: (SCREEN_HEIGHT - SCREEN_WIDTH) / 2 - 20, // Adjust for header
    left: -(SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
    transform: [{ rotate: '90deg' }],
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(15),
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: normalize(8),
    borderRadius: normalize(30),
  },
  streamerAvatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  streamerName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalize(14),
  },
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(5),
  },
  liveIndicator: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: '#FF3B30',
  },
  viewCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(11),
  },
  closeButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: normalize(20),
  },
  titleContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: normalize(15),
    borderRadius: normalize(12),
    alignSelf: 'flex-start',
  },
  streamTitle: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  bottomSection: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(20),
  },
  commentsList: {
    maxHeight: normalize(200),
    marginBottom: normalize(15),
  },
  commentsContent: {
    gap: normalize(10),
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: normalize(10),
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: normalize(8),
    borderRadius: normalize(10),
  },
  commentAvatar: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
  },
  commentTextContainer: {
    flex: 1,
  },
  commentUser: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: normalize(12),
  },
  commentText: {
    color: '#fff',
    fontSize: normalize(13),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    marginTop: normalize(-50),
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: normalize(25),
    paddingHorizontal: normalize(15),
    height: normalize(50),
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: normalize(14),
  },
  actionButton: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedButton: {
    backgroundColor: COLORS.primary,
  },
});

export default LiveStreamDetail;
