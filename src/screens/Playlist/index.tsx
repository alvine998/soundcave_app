import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';
import { getUserProfile } from '../../storage/userStorage';
import { HomeTabParamList } from '../../navigation/HomeTabs';

type RootStackParamList = {
  PlaylistSongs: {
    playlistId: number;
    playlistName?: string;
    playlistCover?: string;
  };
};

type PlaylistScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'Playlist'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Playlist = {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};

const PlaylistScreen = () => {
  const navigation = useNavigation<PlaylistScreenNavigationProp>();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | undefined>(undefined);

  useEffect(() => {
    getUserProfile().then(profile => {
      if (profile?.id) setUserId(profile.id);
    });
  }, []);

  const fetchPlaylists = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get(`/api/playlists?user_id=${userId}`);
      const data = response.data?.data || response.data || [];
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching playlists:', error);
      showToast({
        message: error.response?.data?.message || 'Gagal memuat playlist',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    if (userId) {
      fetchPlaylists();
    }
  }, [userId, fetchPlaylists]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaylists();
  }, [fetchPlaylists]);

  const paddingBottom = normalize(100);

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistRow}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('PlaylistSongs', {
          playlistId: item.id,
          playlistName: item.name,
          playlistCover: item.cover_image || undefined,
        })
      }
    >
      {item.cover_image ? (
        <Image
          source={{ uri: item.cover_image }}
          style={styles.playlistBadge}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.playlistBadge, styles.playlistBadgePlaceholder]}>
          <FontAwesome6 name="music" size={22} color="rgba(255,255,255,0.4)" />
        </View>
      )}
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.playlistMeta} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <FontAwesome6 name="chevron-right" size={14} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Playlist</Text>
        <Text style={styles.subtitle}>
          Koleksi playlist kamu
        </Text>

        {loading && playlists.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom, flexGrow: 1 }
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={renderPlaylistItem}
            ListHeaderComponent={
              playlists.length > 0 ? (
                <View style={styles.headerRow}>
                  <Text style={styles.countText}>{playlists.length} playlist</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="folder-open" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>
                    Belum ada playlist.{'\n'}Tambahkan lagu dari SoundCave.
                  </Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
    paddingTop: normalize(24),
  },
  container: {
    flex: 1,
    padding: normalize(24),
    gap: normalize(16),
  },
  title: {
    fontSize: normalize(30),
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: normalize(16),
    color: 'rgba(255,255,255,0.65)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    marginTop: normalize(8),
    gap: normalize(12),
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(14),
    gap: normalize(12),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  playlistBadge: {
    width: normalize(54),
    height: normalize(54),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  playlistBadgePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
  playlistMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(12),
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: normalize(14),
    lineHeight: normalize(22),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
});

export default PlaylistScreen;
