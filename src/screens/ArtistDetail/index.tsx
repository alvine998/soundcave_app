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
    ScrollView,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';
import { usePlayer } from '../../components/Player';
import { Song } from '../../storage/songs';

type RootStackParamList = {
    ArtistDetail: {
        id: number;
        name: string;
        image: string | null;
    };
};

type ArtistDetailRouteProp = RouteProp<RootStackParamList, 'ArtistDetail'>;
type ArtistDetailNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'ArtistDetail'
>;

const FALLBACK_ARTIST_IMAGE =
    'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800';
const FALLBACK_SONG_COVER =
    'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

const ArtistDetailScreen: React.FC = () => {
    const navigation = useNavigation<ArtistDetailNavigationProp>();
    const route = useRoute<ArtistDetailRouteProp>();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { playSong, currentSong, isPlaying } = usePlayer();

    const { id, name, image } = route.params;

    const [songs, setSongs] = useState<Song[]>([]);
    const [artistData, setArtistData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    const mapApiDataToSong = useCallback((apiData: any): Song => {
        return {
            artist: apiData.artist?.name || apiData.artist_name || name || 'Unknown Artist',
            title: apiData.title || apiData.name || 'Unknown Title',
            url:
                apiData.url ||
                apiData.audio_file_url ||
                apiData.audio_url ||
                apiData.audio ||
                '',
            time: apiData.time || apiData.duration || apiData.length || '00:00',
            cover:
                apiData.cover ||
                apiData.cover_image_url ||
                apiData.image_url ||
                apiData.image ||
                apiData.cover_image ||
                FALLBACK_SONG_COVER,
            lyrics: apiData.lyrics || '',
        };
    }, [name]);

    const fetchArtistData = useCallback(async () => {
        try {
            setLoading(true);
            const api = await getApiInstance();

            // Fetch artist details
            const artistResponse = await api.get(`/api/artists/${id}`);
            if (artistResponse.data?.data) {
                setArtistData(artistResponse.data.data);
            }

            // Fetch artist tracks
            const songsResponse = await api.get(`/api/artists/${id}/songs`);
            const data = songsResponse.data?.data || songsResponse.data || [];

            if (Array.isArray(data)) {
                const mappedSongs = data.map(mapApiDataToSong).filter(s => s.url);
                setSongs(mappedSongs);
            }
        } catch (error: any) {
            console.error('Error fetching artist data:', error);
            // Fallback or empty state
            setSongs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, mapApiDataToSong]);

    useEffect(() => {
        fetchArtistData();
    }, [fetchArtistData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchArtistData();
    }, [fetchArtistData]);

    const handleFollow = () => {
        setIsFollowing(!isFollowing);
        showToast({
            message: isFollowing ? `Unfollowed ${name}` : `Following ${name}`,
            type: 'info',
        });
    };

    const handlePlayAll = () => {
        if (songs.length > 0) {
            playSong(songs[0], songs);
            showToast({
                message: `Playing ${name}'s popular tracks`,
                type: 'info',
            });
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
                <TouchableOpacity style={styles.moreButton}>
                    <FontAwesome6 name="ellipsis" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.topContainer}>
            <View style={styles.imageHeader}>
                <Image
                    source={{ uri: image || artistData?.profile_image || FALLBACK_ARTIST_IMAGE }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <View style={styles.headerOverlay} />
                <View style={styles.nameContainer}>
                    <Text style={styles.artistNameTitle}>{name}</Text>
                    {artistData?.followers_count && (
                        <Text style={styles.followersText}>
                            {artistData.followers_count.toLocaleString()} monthly listeners
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.controlsRow}>
                <View style={styles.leftControls}>
                    <TouchableOpacity
                        style={[styles.followButton, isFollowing && styles.followingButton]}
                        onPress={handleFollow}
                    >
                        <Text style={styles.followButtonText}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <FontAwesome6 name="bell" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <FontAwesome6 name="ellipsis" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
                    <FontAwesome6 name="play" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <Text style={styles.popularTitle}>Popular</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Back Button sticky */}
            <TouchableOpacity
                style={[styles.stickyBackButton, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
            >
                <FontAwesome6 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>

            <FlatList
                data={songs}
                renderItem={renderSongItem}
                ListHeaderComponent={renderHeader}
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
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No songs available</Text>
                        </View>
                    ) : null
                }
            />

            {loading && songs.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    stickyBackButton: {
        position: 'absolute',
        left: normalize(20),
        zIndex: 10,
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topContainer: {
        marginBottom: normalize(20),
    },
    imageHeader: {
        height: normalize(350),
        width: '100%',
        justifyContent: 'flex-end',
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    nameContainer: {
        padding: normalize(20),
        paddingBottom: normalize(15),
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    artistNameTitle: {
        fontSize: normalize(48),
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    followersText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: normalize(14),
        marginTop: normalize(5),
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(15),
    },
    leftControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(20),
    },
    followButton: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(8),
        borderRadius: normalize(5),
    },
    followingButton: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    followButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(13),
    },
    iconButton: {
        opacity: 0.7,
    },
    playButton: {
        width: normalize(56),
        height: normalize(56),
        borderRadius: normalize(28),
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    popularTitle: {
        color: '#fff',
        fontSize: normalize(20),
        fontWeight: '700',
        paddingHorizontal: normalize(20),
        marginTop: normalize(10),
        marginBottom: normalize(15),
    },
    listContent: {
        flexGrow: 1,
    },
    songRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(10),
        gap: normalize(12),
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
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(4),
    },
    songMeta: {
        flex: 1,
    },
    songTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(15),
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
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
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
});

export default ArtistDetailScreen;
