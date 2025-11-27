import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';

const SCREEN_WIDTH = Dimensions.get('screen').width;
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

type RootStackParamList = {
  Home: undefined;
  MusicVideoDetail: {
    id: string;
    title: string;
    artist: string;
    cover: string;
    videoUrl?: string;
  };
};

type MusicVideoDetailRouteProp = RouteProp<RootStackParamList, 'MusicVideoDetail'>;
type MusicVideoDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MusicVideoDetail'
>;

const MusicVideoDetailScreen: React.FC = () => {
  const navigation = useNavigation<MusicVideoDetailNavigationProp>();
  const route = useRoute<MusicVideoDetailRouteProp>();
  const insets = useSafeAreaInsets();

  const { title, artist, cover } = route.params;

  const [isLiked, setIsLiked] = useState(false);

  const handlePlayVideo = () => {
    Alert.alert(
      'Video Player Coming Soon',
      `Video "${title}" akan segera tersedia.\n\nFitur video player sedang dalam pengembangan.`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(20) }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + normalize(10) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <FontAwesome6 name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Music Video</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <FontAwesome6 name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Video Cover */}
        <View style={styles.videoContainer}>
          <Image
            source={{ uri: cover }}
            style={styles.video}
            resizeMode="cover"
          />
          <View style={styles.controlsOverlay}>
            <View style={styles.playPauseButton}>
              <FontAwesome6
                name="play"
                size={40}
                color="#fff"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fullscreenButton}
              onPress={handlePlayVideo}>
              <FontAwesome6 name="play" size={20} color="#fff" />
              <Text style={styles.fullscreenButtonText}>Putar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Image source={{ uri: cover }} style={styles.coverImage} />
            <View style={styles.infoText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.artist}>{artist}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.actionButton}
              onPress={() => setIsLiked(!isLiked)}>
              <FontAwesome6 
                name={isLiked ? "heart" : "heart"} 
                size={24} 
                color={isLiked ? COLORS.primary : "rgba(255,255,255,0.7)"} 
                solid={isLiked}
              />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="share-nodes" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="download" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="list" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Add to</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>
              Official music video for "{title}" by {artist}.{'\n\n'}
              Experience the visual storytelling that brings this track to life. 
              Watch, enjoy, and share with your friends!
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.2M</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45K</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2.3K</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  headerButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: normalize(16),
  },
  playPauseButton: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(999),
  },
  fullscreenButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  infoContainer: {
    padding: normalize(20),
    gap: normalize(24),
  },
  infoHeader: {
    flexDirection: 'row',
    gap: normalize(16),
  },
  coverImage: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(12),
    backgroundColor: '#222',
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: normalize(4),
  },
  title: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(16),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: normalize(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    alignItems: 'center',
    gap: normalize(8),
  },
  actionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  descriptionContainer: {
    gap: normalize(12),
  },
  descriptionTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    lineHeight: normalize(22),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(20),
  },
  statItem: {
    alignItems: 'center',
    gap: normalize(4),
  },
  statNumber: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
});

export default MusicVideoDetailScreen;

