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
const COVER_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

type Episode = {
  id: string;
  title: string;
  duration: string;
  date: string;
  description: string;
};

type RootStackParamList = {
  Home: undefined;
  PodcastDetail: {
    id: string;
    title: string;
    duration: string;
    cover: string;
    audioUrl?: string;
  };
};

type PodcastDetailRouteProp = RouteProp<RootStackParamList, 'PodcastDetail'>;
type PodcastDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastDetail'
>;

const MOCK_EPISODES: Episode[] = [
  {
    id: 'ep-1',
    title: 'Episode 1: Getting Started with Music Production',
    duration: '42 min',
    date: 'Nov 20, 2025',
    description: 'Learn the basics of music production and how to set up your first home studio.',
  },
  {
    id: 'ep-2',
    title: 'Episode 2: Finding Your Sound',
    duration: '38 min',
    date: 'Nov 13, 2025',
    description: 'Discover techniques to develop your unique musical identity and style.',
  },
  {
    id: 'ep-3',
    title: 'Episode 3: Mixing and Mastering Fundamentals',
    duration: '45 min',
    date: 'Nov 6, 2025',
    description: 'Essential tips for mixing and mastering your tracks to professional quality.',
  },
  {
    id: 'ep-4',
    title: 'Episode 4: Collaboration in the Digital Age',
    duration: '35 min',
    date: 'Oct 30, 2025',
    description: 'How to collaborate with other artists remotely and build your network.',
  },
  {
    id: 'ep-5',
    title: 'Episode 5: Marketing Your Music',
    duration: '40 min',
    date: 'Oct 23, 2025',
    description: 'Strategies for promoting your music and growing your fanbase online.',
  },
];

const PodcastDetailScreen: React.FC = () => {
  const navigation = useNavigation<PodcastDetailNavigationProp>();
  const route = useRoute<PodcastDetailRouteProp>();
  const insets = useSafeAreaInsets();

  const { title, duration, cover } = route.params;

  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const handlePlayPodcast = () => {
    Alert.alert(
      'Podcast Player Coming Soon',
      `Podcast "${title}" akan segera tersedia.\n\nFitur podcast player sedang dalam pengembangan.`,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    );
  };

  const handleEpisodePress = (episode: Episode) => {
    setSelectedEpisode(episode);
    Alert.alert(
      'Episode Player Coming Soon',
      `Episode "${episode.title}" akan segera tersedia.\n\nFitur episode player sedang dalam pengembangan.`,
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
          <Text style={styles.headerTitle}>Podcast</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <FontAwesome6 name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Podcast Cover */}
        <View style={styles.playerContainer}>
          <Image
            source={{ uri: cover }}
            style={styles.playerCover}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <View style={styles.podcastBadge}>
              <FontAwesome6 name="podcast" size={32} color="#fff" />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fullscreenButton}
              onPress={handlePlayPodcast}>
              <FontAwesome6 name="play" size={20} color="#fff" />
              <Text style={styles.fullscreenButtonText}>Putar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Podcast Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <View style={styles.infoText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.duration}>{duration} • Podcast Series</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.actionButton}
              onPress={() => setIsLiked(!isLiked)}>
              <FontAwesome6 
                name="heart" 
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
              <FontAwesome6 name="bell" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>
              {title} is a podcast series exploring the world of music, creativity, and innovation.
              {'\n\n'}
              Join us as we dive deep into conversations with artists, producers, and industry experts 
              sharing their insights and experiences.
            </Text>
          </View>

          {/* Episodes List */}
          <View style={styles.episodesContainer}>
            <Text style={styles.episodesTitle}>Episodes</Text>
            <View style={styles.episodesList}>
              {MOCK_EPISODES.map((episode, index) => (
                <TouchableOpacity
                  key={episode.id}
                  activeOpacity={0.85}
                  style={[
                    styles.episodeCard,
                    selectedEpisode?.id === episode.id && styles.episodeCardActive,
                  ]}
                  onPress={() => handleEpisodePress(episode)}>
                  <View style={styles.episodeNumber}>
                    <Text style={styles.episodeNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle} numberOfLines={2}>
                      {episode.title}
                    </Text>
                    <Text style={styles.episodeDescription} numberOfLines={2}>
                      {episode.description}
                    </Text>
                    <View style={styles.episodeMeta}>
                      <Text style={styles.episodeMetaText}>{episode.duration}</Text>
                      <Text style={styles.episodeMetaText}>•</Text>
                      <Text style={styles.episodeMetaText}>{episode.date}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.episodePlayButton}
                    onPress={() => handleEpisodePress(episode)}>
                    <FontAwesome6
                      name={selectedEpisode?.id === episode.id && isPlaying ? 'pause' : 'play'}
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
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
  playerContainer: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  playerCover: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: normalize(16),
  },
  podcastBadge: {
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
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: normalize(4),
  },
  title: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: '700',
  },
  duration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
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
  episodesContainer: {
    gap: normalize(16),
  },
  episodesTitle: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  episodesList: {
    gap: normalize(12),
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(12),
    alignItems: 'center',
  },
  episodeCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  episodeNumber: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  episodeInfo: {
    flex: 1,
    gap: normalize(4),
  },
  episodeTitle: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  episodeDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
  },
  episodeMeta: {
    flexDirection: 'row',
    gap: normalize(8),
    marginTop: normalize(4),
  },
  episodeMetaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  episodePlayButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PodcastDetailScreen;

