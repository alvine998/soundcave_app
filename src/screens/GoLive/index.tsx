import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  FlatList,
  Image,
  PermissionsAndroid,
  ActivityIndicator,
  ScrollView,
  BackHandler,
} from 'react-native';


import { NodePublisher } from 'react-native-nodemediaclient';
import normalize from 'react-native-normalize';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../config/color';
import { getApiInstance } from '../../utils/api';
import { 
  connectSocket, 
  joinStreamRoom, 
  leaveStreamRoom, 
  getSocket 
} from '../../utils/socket';



const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 9:16 vertical video ratio for modern live streaming
const TARGET_ASPECT_RATIO = 16 / 9; 

// Make publisher fill the entire screen for an immersive experience
const PUBLISHER_WIDTH = SCREEN_WIDTH;
const PUBLISHER_HEIGHT = SCREEN_HEIGHT;

const GoLiveScreen: React.FC = () => {
  const navigation = useNavigation();
  const publisherRef = useRef<any>(null);
  
  const [ingestUrl, setIngestUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPreparingToStream, setIsPreparingToStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoPosition, setVideoPosition] = useState<'front' | 'back'>('front');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamThumbnail, setStreamThumbnail] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  // Handle back/exit with confirmation if streaming
  const handleGoBack = () => {
    if (isStreaming) {
      Alert.alert(
        'End Stream?',
        'You are currently live. Are you sure you want to stop the stream and go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Stream',
            style: 'destructive',
            onPress: () => {
              if (publisherRef.current) {
                publisherRef.current.stop();
              }
              setIsStreaming(false);
              if (streamId) {
                getApiInstance().then(api => {
                  api.post(`/api/artist-streams/end/${streamId}`)
                    .catch((e: any) => console.error('Stop API error:', e));
                });
              }
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Intercept Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoBack();
      return true; // Prevent default back behavior
    });
    return () => backHandler.remove();
  }, [isStreaming, streamId]);

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);

          if (
            granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            setHasPermissions(true);
          } else {
            setHasPermissions(false);
            Alert.alert(
              'Permissions Required',
              'GoLive needs camera and microphone access to broadcast your stream.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } catch (err) {
          console.warn(err);
          setHasPermissions(false);
        }
      } else {
        setHasPermissions(true);
      }
    };

    checkPermissions();
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;

    if (isStreaming && streamId) {
      const setupSocket = async () => {
        try {
          await connectSocket();
          joinStreamRoom(streamId); // Use numeric DB ID, not string key

          const socket = await getSocket();
          socket.on('new_comment', (comment: any) => {
            if (isMounted) {
              setComments(prev => [...prev, comment]);
            }
          });

          socket.on('viewer_count_update', (data: { stream_id: string | number; viewer_count: number }) => {
            if (isMounted) {
              setViewerCount(data.viewer_count);
            }
          });
        } catch (error) {
          console.error('Socket error in GoLive:', error);
        }
      };
      setupSocket();
    }

    return () => {
      isMounted = false;
      if (isStreaming && streamId) {
        leaveStreamRoom(streamId);
      }
    };
  }, [isStreaming, streamId]);

  // Effect to trigger native start ONLY AFTER the ingestUrl prop has updated
  useEffect(() => {
    if (isPreparingToStream && ingestUrl) {
        setIsPreparingToStream(false);
        setTimeout(() => {
            if (publisherRef.current) {
                publisherRef.current.start();
            }
        }, 200);
    }
  }, [isPreparingToStream, ingestUrl]);

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for your stream');
      return;
    }

    setIsStarting(true);

    try {
        const api = await getApiInstance();
        let response;
        try {
            response = await api.post('/api/artist-streams/start', {
                title: streamTitle,
                description: streamDescription || streamTitle,
                ...(streamThumbnail ? { thumbnail: streamThumbnail } : {}),
                stream_url: 'rtmp://154.26.137.37:1935/live',
            });
        } catch (err: any) {
            if (err?.response?.status === 409) {
                console.log('Existing stream found, stopping first...');
                const existingId = err?.response?.data?.data?.id || err?.response?.data?.stream_id;
                if (existingId) {
                    await api.post(`/api/artist-streams/end/${existingId}`);
                }
                response = await api.post('/api/artist-streams/start', {
                    title: streamTitle,
                    description: streamDescription || streamTitle,
                    ...(streamThumbnail ? { thumbnail: streamThumbnail } : {}),
                    stream_url: 'rtmp://154.26.137.37:1935/live',
                });
            } else {
                throw err;
            }
        }

        const newIngestUrl = response?.data?.data?.ingest_url;
        if (newIngestUrl) {
            console.log('Stream registered with ingest url:', newIngestUrl);
            setStreamId(response.data.data.id);
            setIngestUrl(newIngestUrl);
            setIsPreparingToStream(true); // Triggers the useEffect
        } else {
            throw new Error('No ingest_url returned from API');
        }
    } catch (error) {
        console.error('Error preparing stream:', error);
        Alert.alert('Error', 'Failed to initialize stream with server.');
        setIsStarting(false);
    }
  };


  const handleStopStream = async () => {
    try {
      if (publisherRef.current) {
        publisherRef.current.stop();
        setIsStreaming(false);

        // Notify backend
        if (streamId) {
          getApiInstance().then(api => {
            api.post(`/api/artist-streams/end/${streamId}`)
              .catch((e: any) => console.error('Stop API error:', e));
          });
        }

        // Navigate back to Home
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  const toggleCamera = () => {
    setVideoPosition(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const toggleMute = () => {
    Alert.alert('Notice', 'Voice Muting is coming soon!');
  };

  return (
    <View style={styles.container}>
      {hasPermissions === true ? (
        <View style={styles.cameraFrame}>
          <NodePublisher
            style={styles.publisher}
            ref={publisherRef}
            url={ingestUrl}
            frontCamera={videoPosition === 'front'}
            audioParam={{
              codecid: NodePublisher.NMC_CODEC_ID_AAC,
              profile: NodePublisher.NMC_PROFILE_AAC_LC,
              samplerate: 44100,
              channels: 1,
              bitrate: 32000,
            }}
            videoParam={{
              codecid: NodePublisher.NMC_CODEC_ID_H264,
              profile: NodePublisher.NMC_PROFILE_H264_MAIN,
              width: 720,
              height: 1280,
              fps: 30,
              bitrate: 1500000,
            }}
            videoOrientation={1} // 1 = Portrait mode for streamer and viewer
            onEvent={(code: number, msg: string) => {
              console.log('NodePublisher Event:', code, msg);
              if (code === 2001) {
                setIsStreaming(true);
                setIsStarting(false);
              } else if (code === 2002 || code === 2004) {
                setIsStreaming(false);
                setIsStarting(false);
                // Clean up on backend if it fails immediately after starting
                if (streamId && code === 2002) {
                  getApiInstance().then(api => {
                    api.post(`/api/artist-streams/end/${streamId}`).catch(() => {});
                  });
                }
              }
            }}
          />
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          {hasPermissions === null ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Text style={styles.errorText}>Camera access denied</Text>
          )}
        </View>
      )}

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleGoBack}
          >
            <FontAwesome6 name="xmark" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.liveBadgeWrapper}>
            {isStreaming && (
              <View style={styles.liveBadgeContainer}>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <View style={styles.viewerCountBadge}>
                  <FontAwesome6 name="eye" size={10} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.viewerCountText}>{viewerCount}</Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
            <FontAwesome6 name="camera-rotate" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!isStreaming ? (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.setupContainer}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.setupScroll}
              >
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.titleInput}
                    placeholder="Stream title *"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={streamTitle}
                    onChangeText={setStreamTitle}
                    maxLength={50}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.titleInput, styles.descriptionInput]}
                    placeholder="Description (optional)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={streamDescription}
                    onChangeText={setStreamDescription}
                    maxLength={200}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.titleInput}
                    placeholder="Thumbnail URL (optional)"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={streamThumbnail}
                    onChangeText={setStreamThumbnail}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              </ScrollView>
              <Text style={styles.hintText}>Ready to broadcast to SoundCave?</Text>
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.streamingOverlay}>
              <FlatList
                data={comments}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image source={{ uri: item.profile_image }} style={styles.commentAvatar} />
                    <View>
                      <Text style={styles.commentUser}>{item.username}</Text>
                      <Text style={styles.commentText}>{item.message}</Text>
                    </View>
                  </View>
                )}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>


        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.iconButton, isMuted && styles.activeIconButton]} 
            onPress={toggleMute}
          >
            <FontAwesome6 name={isMuted ? "microphone-slash" : "microphone"} size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.streamButton, 
              isStreaming ? styles.stopButton : styles.startButton,
              isStarting && { opacity: 0.7 }
            ]} 
            onPress={isStreaming ? handleStopStream : handleStartStream}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.streamButtonText}>
                {isStreaming ? 'STOP STREAM' : 'GO LIVE'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome6 name="gear" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cameraFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publisher: {
    width: PUBLISHER_WIDTH,
    height: PUBLISHER_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconButton: {
    backgroundColor: COLORS.primary,
  },
  liveBadgeWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  liveBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: normalize(4),
    overflow: 'hidden',
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  viewerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  viewerCountText: {
    color: '#fff',
    fontSize: normalize(11),
    fontWeight: '600',
  },
  liveBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: normalize(12),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  setupContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: normalize(-50),
  },
  setupScroll: {
    width: '100%',
    gap: normalize(12),
    paddingBottom: normalize(10),
  },
  inputWrapper: {
    width: '100%',
    padding: 2,
    borderRadius: normalize(30),
    backgroundColor: 'rgba(128, 0, 255, 0.2)',
  },
  titleInput: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: normalize(28),
    height: normalize(56),
    paddingHorizontal: normalize(25),
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(128, 0, 255, 0.5)',
  },
  descriptionInput: {
    height: normalize(80),
    textAlignVertical: 'top',
    paddingTop: normalize(15),
    textAlign: 'left',
  },
  hintText: {
    marginTop: normalize(15),
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: normalize(30),
    paddingHorizontal: normalize(20),
  },
  streamButton: {
    paddingHorizontal: normalize(40),
    height: normalize(56),
    borderRadius: normalize(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  streamButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '800',
    letterSpacing: 1,
  },
  streamingOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: normalize(20),
  },
  commentsList: {
    maxHeight: normalize(250),
  },
  commentsContent: {
    gap: normalize(8),
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: normalize(8),
    borderRadius: normalize(12),
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  commentAvatar: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
  },
  commentUser: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: normalize(11),
  },
  commentText: {
    color: '#fff',
    fontSize: normalize(13),
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: normalize(16),
    marginTop: normalize(10),
  },
});



export default GoLiveScreen;
