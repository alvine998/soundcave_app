import React, { useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';
import { usePlayer } from '../../components/Player';
import { Song } from '../../storage/songs';
import AddToPlaylistModal from '../../components/AddToPlaylistModal';
import { getUserProfile, UserProfile } from '../../storage/userStorage';
import { Modal } from 'react-native';

const FALLBACK_SONG_COVER =
    'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

type RootStackParamList = {
    AlbumSongs: {
        albumId: number;
        albumTitle: string;
        albumImage: string | null;
    };
};

type AlbumSongsRouteProp = RouteProp<RootStackParamList, 'AlbumSongs'>;
type AlbumSongsNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'AlbumSongs'
>;

const AlbumSongsScreen: React.FC = () => {
    const navigation = useNavigation<AlbumSongsNavigationProp>();
    const route = useRoute<AlbumSongsRouteProp>();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { playSong, currentSong, isPlaying } = usePlayer();

    const { albumId, albumTitle, albumImage } = route.params;

    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const profile = await getUserProfile();
            setUser(profile);
        };
        fetchUser();
    }, []);

    const mapApiDataToSong = useCallback((apiData: any): Song => {
        return {
            id: apiData.id,
            artist: apiData.artist?.name || apiData.artist_name || apiData.artist || 'Unknown Artist',
            title: apiData.title || apiData.name || 'Unknown Title',
            url: apiData.url || apiData.audio_file_url || apiData.audio_url || apiData.audio || '',
            time: apiData.time || apiData.duration || apiData.length || '00:00',
            cover: apiData.cover || apiData.cover_image_url || apiData.image_url || apiData.image || apiData.cover_image || albumImage || FALLBACK_SONG_COVER,
            lyrics: apiData.lyrics || '',
            is_liked: apiData.is_liked || false,
        };
    }, [albumImage]);

    const fetchAlbumSongs = useCallback(async () => {
        try {
            setLoading(true);
            const api = await getApiInstance();
            const response = await api.get(`/api/musics`, {
                params: {
                    album_id: albumId,
                    limit: 50,
                },
            });

            const data = response.data?.data || response.data || [];
            if (Array.isArray(data)) {
                const mappedSongs = data.map(mapApiDataToSong).filter(s => s.url);
                setSongs(mappedSongs);
            } else {
                setSongs([]);
            }
        } catch (error: any) {
            console.error('Error fetching album songs:', error);
            showToast({
                message: 'Gagal memuat lagu album',
                type: 'error',
            });
            setSongs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [albumId, mapApiDataToSong, showToast]);

    useEffect(() => {
        fetchAlbumSongs();
    }, [fetchAlbumSongs]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAlbumSongs();
    }, [fetchAlbumSongs]);

    const handleToggleLike = async (song: Song) => {
        try {
            const api = await getApiInstance();
            const endpoint = song.is_liked ? `/api/musics/${song.id}/unlike` : `/api/musics/${song.id}/like`;

            await api.post(endpoint);

            // Update local state
            setSongs(prevSongs => prevSongs.map(s =>
                s.id === song.id ? { ...s, is_liked: !s.is_liked } : s
            ));

            showToast({
                message: song.is_liked ? 'Removed from favorites' : 'Added to favorites',
                type: 'success',
            });
        } catch (error: any) {
            console.error('Error toggling like:', error);
            showToast({
                message: 'Gagal memperbarui status suka',
                type: 'error',
            });
        } finally {
            setShowOptions(false);
        }
    };

    const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
        const isActive = currentSong?.url === item.url && isPlaying;

        return (
            <TouchableOpacity
                style={[styles.songRow, isActive && styles.songRowActive]}
                activeOpacity={0.85}
                onPress={() => {
                    playSong(item, songs);
                }}
            >
                <Text style={styles.songRank}>{index + 1}</Text>
                <Image
                    source={{ uri: item.cover }}
                    style={styles.songCover}
                    resizeMode="cover"
                />
                <View style={styles.songMeta}>
                    <Text style={[styles.songTitle, isActive && styles.songTitleActive]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                        {item.artist}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => {
                        setSelectedSong(item);
                        setShowOptions(true);
                    }}
                >
                    <FontAwesome6 name="ellipsis" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderOptionsModal = () => (
        <Modal
            visible={showOptions}
            transparent
            animationType="fade"
            onRequestClose={() => setShowOptions(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowOptions(false)}
            >
                <View style={styles.optionsContainer}>
                    <View style={styles.optionsHeader}>
                        <Image
                            source={{ uri: selectedSong?.cover || FALLBACK_SONG_COVER }}
                            style={styles.optionsCover}
                        />
                        <View style={styles.optionsInfo}>
                            <Text style={styles.optionsTitle} numberOfLines={1}>{selectedSong?.title}</Text>
                            <Text style={styles.optionsArtist} numberOfLines={1}>{selectedSong?.artist}</Text>
                        </View>
                    </View>

                    <View style={styles.optionsList}>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => selectedSong && handleToggleLike(selectedSong)}
                        >
                            <FontAwesome6
                                name="heart"
                                size={20}
                                color={selectedSong?.is_liked ? COLORS.primary : "#fff"}
                                style={styles.optionIcon}
                                solid={selectedSong?.is_liked}
                            />
                            <Text style={styles.optionText}>{selectedSong?.is_liked ? 'Unlike' : 'Like'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                setShowOptions(false);
                                setShowPlaylistModal(true);
                            }}
                        >
                            <FontAwesome6 name="circle-plus" size={20} color="#fff" style={styles.optionIcon} />
                            <Text style={styles.optionText}>Add to Playlist</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => setShowOptions(false)}
                        >
                            <FontAwesome6 name="share-nodes" size={20} color="#fff" style={styles.optionIcon} />
                            <Text style={styles.optionText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <FontAwesome6 name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {albumTitle}
                    </Text>
                    <View style={styles.backButtonPlaceholder} />
                </View>

                <FlatList
                    data={songs}
                    renderItem={renderSongItem}
                    keyExtractor={(item, index) => item.url || `song-${index}`}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + normalize(100) },
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#ffffff"
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.albumHeader}>
                            <Image
                                source={{ uri: albumImage || FALLBACK_SONG_COVER }}
                                style={styles.albumImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.albumTitleLarge}>{albumTitle}</Text>
                            <Text style={styles.songCount}>{songs.length} Tracks</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No songs in this album</Text>
                            </View>
                        ) : null
                    }
                />

                {loading && songs.length === 0 && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
                {renderOptionsModal()}
                <AddToPlaylistModal
                    visible={showPlaylistModal}
                    onClose={() => setShowPlaylistModal(false)}
                    musicId={selectedSong?.id}
                    userId={user?.id}
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(15),
    },
    backButton: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonPlaceholder: {
        width: normalize(40),
    },
    headerTitle: {
        flex: 1,
        fontSize: normalize(18),
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginHorizontal: normalize(10),
    },
    albumHeader: {
        alignItems: 'center',
        paddingVertical: normalize(30),
        paddingHorizontal: normalize(20),
    },
    albumImage: {
        width: normalize(200),
        height: normalize(200),
        borderRadius: normalize(12),
        backgroundColor: '#222',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    albumTitleLarge: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: '#fff',
        marginTop: normalize(20),
        textAlign: 'center',
    },
    songCount: {
        fontSize: normalize(14),
        color: 'rgba(255,255,255,0.6)',
        marginTop: normalize(5),
    },
    listContent: {
        flexGrow: 1,
    },
    songRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(12),
        gap: normalize(15),
    },
    songRowActive: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    songRank: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(14),
        width: normalize(20),
        textAlign: 'center',
    },
    songCover: {
        width: normalize(50),
        height: normalize(50),
        borderRadius: normalize(6),
        backgroundColor: '#222',
    },
    songMeta: {
        flex: 1,
    },
    songTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(16),
    },
    songTitleActive: {
        color: COLORS.primary,
    },
    songArtist: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(13),
        marginTop: normalize(2),
    },
    moreButton: {
        padding: normalize(5),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: normalize(50),
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: normalize(14),
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
        paddingBottom: normalize(40),
        paddingTop: normalize(20),
    },
    optionsHeader: {
        flexDirection: 'row',
        paddingHorizontal: normalize(20),
        paddingBottom: normalize(20),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    optionsCover: {
        width: normalize(60),
        height: normalize(60),
        borderRadius: normalize(8),
        backgroundColor: '#222',
    },
    optionsInfo: {
        flex: 1,
        marginLeft: normalize(15),
    },
    optionsTitle: {
        color: '#fff',
        fontSize: normalize(18),
        fontWeight: '700',
    },
    optionsArtist: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(14),
        marginTop: normalize(2),
    },
    optionsList: {
        paddingTop: normalize(10),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: normalize(15),
        paddingHorizontal: normalize(20),
    },
    optionIcon: {
        width: normalize(30),
    },
    optionText: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: '500',
        marginLeft: normalize(10),
    },
});

export default AlbumSongsScreen;
