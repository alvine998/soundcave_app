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
import ImagePicker from 'react-native-image-crop-picker';
import DatePicker from 'react-native-date-picker';
import { COLORS } from '../../config/color';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';
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
  const { showToast } = useToast();
  
  const [ingestUrl, setIngestUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingToStream, setIsPreparingToStream] = useState(false);
  const [isWaitingForLive, setIsWaitingForLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoPosition, setVideoPosition] = useState<'front' | 'back'>('front');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [streamThumbnail, setStreamThumbnail] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<number | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [streamType, setStreamType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 3600000)); // Default to 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        // Slightly longer delay to ensure native surface is ready on real devices
        setTimeout(() => {
            if (publisherRef.current) {
                try {
                    // Safe practice: ensure any lingering broadcast is stopped
                    publisherRef.current.stop();
                    
                    // Brief pause between stop and start to allow native cleanup
                    setTimeout(() => {
                        if (publisherRef.current) {
                            console.log('Triggering native broadcast start...');
                            publisherRef.current.start();
                        }
                    }, 150);
                } catch (e) {
                    console.error('Failure in native publisher sequence:', e);
                    setIsStarting(false);
                    Alert.alert('Broadcast Error', 'Could not initialize camera for broadcast.');
                }
            } else {
                setIsStarting(false);
            }
        }, 300);
    }
  }, [isPreparingToStream, ingestUrl]);

  // Poll until stream goes live, then start publisher
  const waitForLive = async (streamId: number) => {
    let pollCount = 0;
    const maxPolls = 60; // Max 3 minutes (60 * 3s)
    const pollInterval = 3000; // 3 seconds

    while (pollCount < maxPolls) {
      try {
        const api = await getApiInstance();
        const response = await api.get(`/api/artist-streams/${streamId}`);
        const { data } = response.data;

        console.log(`[Poll ${pollCount + 1}] Stream status: ${data?.status}`);

        if (data?.status === 'live') {
          console.log('Stream is LIVE! Starting publisher...');
          setIsWaitingForLive(false);
          setIsPreparingToStream(true);
          return true;
        }

        // Not live yet, wait before polling again
        await new Promise(r => setTimeout(r, pollInterval));
        pollCount++;
      } catch (error) {
        console.error(`Poll error (attempt ${pollCount + 1}):`, error);
        // Continue polling even on error
        await new Promise(r => setTimeout(r, pollInterval));
        pollCount++;
      }
    }

    // Timeout reached
    console.error('Polling timeout: stream did not go live within 3 minutes');
    Alert.alert('Timeout', 'Stream did not go live. Please try again.');
    setIsWaitingForLive(false);
    setIsStarting(false);
    return false;
  };

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
                live_from: 'phone',
                ...(streamType === 'scheduled' ? { is_scheduled: true, scheduled_at: scheduledDate.toISOString() } : {}),
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
                    live_from: 'phone',
                    ...(streamType === 'scheduled' ? { is_scheduled: true, scheduled_at: scheduledDate.toISOString() } : {}),
                });
            } else {
                throw err;
            }
        }

        const newIngestUrl = response?.data?.data?.ingest_url;
        if (streamType === 'scheduled') {
            showToast({ message: 'Stream scheduled successfully!', type: 'success' });
            navigation.goBack();
            return;
        }

        if (newIngestUrl) {
            console.log('Stream registered with ingest url:', newIngestUrl);
            const newStreamId = response.data.data.id;
            setStreamId(newStreamId);
            setIngestUrl(newIngestUrl);
            
            // Start polling for stream to go live
            setIsWaitingForLive(true);
            const isLive = await waitForLive(newStreamId);
            
            if (!isLive) {
              // Polling failed or timed out, clean up
              try {
                await api.post(`/api/artist-streams/end/${newStreamId}`);
              } catch (e) {
                console.error('Error cleaning up failed stream:', e);
              }
            }
        } else {
            throw new Error('No ingest_url returned from API');
        }
    } catch (error) {
        console.error('Error preparing stream:', error);
        Alert.alert('Error', 'Failed to initialize stream with server.');
        setIsStarting(false);
    }
  };

  const handleSelectThumbnail = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 1280,
        height: 720,
        cropping: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      setIsUploading(true);
      const api = await getApiInstance();
      
      const formData = new FormData();
      formData.append('file', {
        uri: image.path,
        type: image.mime || 'image/jpeg',
        name: `thumbnail_${Date.now()}.jpg`,
      } as any);

      const response = await api.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.file_url;
      if (imageUrl) {
        setStreamThumbnail(imageUrl);
        showToast({ message: 'Thumbnail uploaded!', type: 'success' });
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error selecting/uploading thumbnail:', error);
        showToast({ 
          message: error.response?.data?.message || 'Failed to upload thumbnail', 
          type: 'error' 
        });
      }
    } finally {
      setIsUploading(false);
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
            // @ts-ignore
            keyFrameInterval={1} // 1 second keyframe interval for low latency
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
            <>
              {isWaitingForLive ? (
                <View style={styles.waitingContainer}>
                  <View style={styles.waitingContent}>
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: normalize(16) }} />
                    <Text style={styles.waitingTitle}>Starting Your Stream...</Text>
                    <Text style={styles.waitingSubtitle}>Please wait while we prepare your broadcast</Text>
                    <View style={styles.pulseAnimation} />
                  </View>
                </View>
              ) : (
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                  style={styles.setupContainer}
                >
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.setupScroll}
                  >
                    {/* Date Picker Modal */}
                    <DatePicker
                      modal
                      open={showDatePicker}
                      date={scheduledDate}
                      minimumDate={new Date()}
                      onConfirm={(date) => {
                        setShowDatePicker(false);
                        setScheduledDate(date);
                      }}
                      onCancel={() => {
                        setShowDatePicker(false);
                      }}
                      theme="dark"
                      title="Schedule Stream"
                      confirmText="Set Schedule"
                    />
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

                    {/* Stream Type Selector */}
                    <View style={styles.streamTypeContainer}>
                      <TouchableOpacity 
                        style={[styles.typeButton, streamType === 'now' && styles.activeTypeButton]}
                        onPress={() => setStreamType('now')}
                      >
                        <FontAwesome6 name="bolt" size={14} color={streamType === 'now' ? '#fff' : 'rgba(255,255,255,0.5)'} />
                        <Text style={[styles.typeButtonText, streamType === 'now' && styles.activeTypeButtonText]}>Go Live Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.typeButton, streamType === 'scheduled' && styles.activeTypeButton]}
                        onPress={() => setStreamType('scheduled')}
                      >
                        <FontAwesome6 name="calendar-days" size={14} color={streamType === 'scheduled' ? '#fff' : 'rgba(255,255,255,0.5)'} />
                        <Text style={[styles.typeButtonText, streamType === 'scheduled' && styles.activeTypeButtonText]}>Schedule</Text>
                      </TouchableOpacity>
                    </View>

                    {streamType === 'scheduled' && (
                      <View style={styles.scheduleInfoContainer}>
                        <Text style={styles.scheduleLabel}>Schedule for:</Text>
                        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                          <FontAwesome6 name="clock" size={16} color={COLORS.primary} />
                          <Text style={styles.dateText}>{scheduledDate.toLocaleString()}</Text>
                          <FontAwesome6 name="chevron-right" size={12} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                        <Text style={styles.scheduleHint}>Stream will be visible in your profile</Text>
                      </View>
                    )}
                    <View style={styles.thumbnailContainer}>
                      <Text style={styles.thumbnailLabel}>Stream Thumbnail</Text>
                      <TouchableOpacity 
                        style={styles.thumbnailButton} 
                        onPress={handleSelectThumbnail}
                        activeOpacity={0.8}
                        disabled={isUploading}
                      >
                        {streamThumbnail ? (
                          <View style={styles.thumbnailImageWrapper}>
                            <Image source={{ uri: streamThumbnail }} style={styles.thumbnailImage} />
                            <View style={styles.changeThumbnailBadge}>
                              <FontAwesome6 name="camera" size={12} color="#fff" />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.thumbnailPlaceholder}>
                            <FontAwesome6 name="image" size={32} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.thumbnailPlaceholderText}>Upload Thumbnail</Text>
                            <Text style={styles.thumbnailPlaceholderSubtext}>1280 x 720 (16:9)</Text>
                          </View>
                        )}
                        
                        {isUploading && (
                          <View style={styles.uploadOverlay}>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                            <Text style={styles.uploadText}>Uploading...</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <Text style={styles.hintText}>Ready to broadcast to SoundCave?</Text>
                </KeyboardAvoidingView>
              )}
            </>
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
              (isStarting || isWaitingForLive) && { opacity: 0.7 }
            ]} 
            onPress={isStreaming ? handleStopStream : handleStartStream}
            disabled={isStarting || isWaitingForLive}
          >
            {isStarting || isWaitingForLive ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.streamButtonText}>
                  {isWaitingForLive ? 'WAITING FOR LIVE...' : 'STARTING...'}
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <FontAwesome6 
                  name={isStreaming ? "stop" : (streamType === 'scheduled' ? "calendar-plus" : "video")} 
                  size={16} 
                  color="#fff" 
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.streamButtonText}>
                  {isStreaming ? 'STOP STREAM' : (streamType === 'scheduled' ? 'SCHEDULE STREAM' : 'GO LIVE')}
                </Text>
              </View>
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
  thumbnailContainer: {
    width: '100%',
    gap: normalize(8),
    marginTop: normalize(10),
  },
  thumbnailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    fontWeight: '600',
    marginLeft: normalize(10),
  },
  thumbnailButton: {
    width: '100%',
    height: normalize(150),
    borderRadius: normalize(16),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(128, 0, 255, 0.3)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(6),
  },
  thumbnailPlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    fontWeight: '700',
  },
  thumbnailPlaceholderSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: normalize(11),
  },
  thumbnailImageWrapper: {
    width: '100%',
    height: '100%',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeThumbnailBadge: {
    position: 'absolute',
    bottom: normalize(10),
    right: normalize(10),
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(8),
  },
  uploadText: {
    color: '#fff',
    fontSize: normalize(12),
    fontWeight: '600',
  },
  streamTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: normalize(12),
    padding: normalize(4),
    marginTop: normalize(10),
    gap: normalize(4),
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    height: normalize(44),
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(8),
  },
  activeTypeButton: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  scheduleInfoContainer: {
    backgroundColor: 'rgba(128, 0, 255, 0.1)',
    borderRadius: normalize(16),
    padding: normalize(15),
    marginTop: normalize(10),
    borderWidth: 1,
    borderColor: 'rgba(128, 0, 255, 0.2)',
  },
  scheduleLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    fontWeight: '600',
    marginBottom: normalize(10),
  },
  datePickerButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: normalize(12),
    height: normalize(52),
    paddingHorizontal: normalize(15),
    alignItems: 'center',
    gap: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(128, 0, 255, 0.3)',
  },
  dateText: {
    flex: 1,
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  scheduleHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: normalize(11),
    marginTop: normalize(10),
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  waitingContent: {
    alignItems: 'center',
    gap: normalize(8),
  },
  waitingTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
    textAlign: 'center',
  },
  waitingSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    textAlign: 'center',
    marginTop: normalize(4),
  },
  pulseAnimation: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: normalize(20),
  },
});



export default GoLiveScreen;
