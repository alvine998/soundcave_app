import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    Image,
    ImageBackground,
    SafeAreaView,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    ListRenderItem,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { HomeTabParamList } from '../../navigation/HomeTabs';

import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SONGS, Song } from '../../storage/songs';
import { NEWS, NEWS_BACKDROPS } from '../../storage/news';
import { getApiInstance } from '../../utils/api';
import { getFeaturedArtists, saveFeaturedArtists, Artist } from '../../storage/artistsStorage';

type RootStackParamList = {
    Home: undefined;
    News: undefined;
    NewsDetail: {
        id: string;
    };
    MusicVideoDetail: {
        id: string;
        title: string;
        artist: string;
        cover: string;
        videoUrl?: string;
    };
    PodcastDetail: {
        id: string;
        title: string;
        duration: string;
        cover: string;
        audioUrl?: string;
    };
    PlaylistSongs: {
        playlistId: number;
        playlistName?: string;
        playlistCover?: string;
    };
    Profile: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<HomeTabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
    profile: UserProfile;
    onLogout: () => void;
};

const FALLBACK_SONG_COVER =
    'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

type MusicVideo = {
    id: string;
    title: string;
    artist: string;
    cover: string;
    videoUrl?: string;
};

type Podcast = {
    id: string;
    title: string;
    duration: string;
    cover: string;
    audioUrl?: string;
};

type NewsData = {
    id: number;
    title: string;
    content: string;
    summary: string;
    author: string;
    category: string;
    image_url: string;
    published_at: string | null;
    is_published: boolean;
    is_headline: boolean;
    views: number;
    tags: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = normalize(24) * 2;
const GAP_BETWEEN_COLUMNS = normalize(12);
const TOP_100_CARD_WIDTH = normalize(280);
const TOP_100_COLUMN_WIDTH = TOP_100_CARD_WIDTH;

// Section types for FlatList
type SectionType =
    | 'header'
    | 'topStreamed'
    | 'genres'
    | 'podcasts'
    | 'musicVideos'
    | 'top100'
    | 'playlists'
    | 'artists'
    | 'news';

type Section = {
    id: string;
    type: SectionType;
    data?: any;
};

// ============ MEMOIZED COMPONENTS ============

const BestSongCoverImage = React.memo<{ uri: string }>(({ uri }) => {
    const [failed, setFailed] = useState(false);

    return (
        <Image
            key={failed ? `fallback-${uri}` : uri}
            source={{ uri: failed ? FALLBACK_SONG_COVER : uri }}
            style={styles.bestSongCover}
            resizeMode="cover"
            onError={() => {
                if (!failed) {
                    setFailed(true);
                }
            }}
        />
    );
});

const BestSongCard = React.memo<{
    song: Song;
    rank: number;
    isLarge: boolean;
    isActive: boolean;
    onPress: () => void;
}>(
    ({ song, rank, isLarge, isActive, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={[
                    isLarge ? styles.bestSongCardLarge : styles.bestSongCardSmall,
                    isActive && styles.bestSongCardActive,
                ]}
                onPress={onPress}
            >
                <BestSongCoverImage uri={song.cover} />
                <View style={styles.bestSongOverlay}>
                    <View style={styles.bestSongBadge}>
                        <Text style={styles.bestSongRank}>#{rank}</Text>
                    </View>
                    <View style={styles.bestSongInfo}>
                        <Text style={styles.bestSongTitle} numberOfLines={1}>
                            {song.title}
                        </Text>
                        <Text style={styles.bestSongArtist} numberOfLines={1}>
                            {song.artist}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.song.url === nextProps.song.url &&
            prevProps.isActive === nextProps.isActive &&
            prevProps.rank === nextProps.rank
        );
    }
);

const PodcastCard = React.memo<{
    podcast: Podcast;
    onPress: () => void;
}>(
    ({ podcast, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.podcastCard}
                onPress={onPress}
            >
                <Image
                    source={{ uri: podcast.cover }}
                    style={styles.podcastCover}
                    resizeMode="cover"
                />
                <Text style={styles.podcastTitle} numberOfLines={2}>
                    {podcast.title}
                </Text>
                <Text style={styles.podcastDuration}>{podcast.duration}</Text>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.podcast.id === nextProps.podcast.id
);

const MusicVideoCard = React.memo<{
    video: MusicVideo;
    onPress: () => void;
}>(
    ({ video, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.musicVideoCard}
                onPress={onPress}
            >
                <Image
                    source={{ uri: video.cover }}
                    style={styles.musicVideoCover}
                    resizeMode="cover"
                />
                <Text style={styles.musicVideoTitle} numberOfLines={1}>
                    {video.title}
                </Text>
                <Text style={styles.musicVideoArtist} numberOfLines={1}>
                    {video.artist}
                </Text>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.video.id === nextProps.video.id
);

const Top100Card = React.memo<{
    song: Song;
    isActive: boolean;
    onPress: () => void;
}>(
    ({ song, isActive, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.top100Card, isActive && styles.top100CardActive]}
                onPress={onPress}
            >
                <Image
                    source={{ uri: song.cover }}
                    style={styles.top100Cover}
                    resizeMode="cover"
                />
                <View style={styles.top100Meta}>
                    <Text style={styles.top100Title} numberOfLines={1} ellipsizeMode="tail">
                        {song.title}
                    </Text>
                    <Text style={styles.top100Artist} numberOfLines={1} ellipsizeMode="tail">
                        {song.artist}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.song.url === nextProps.song.url &&
            prevProps.isActive === nextProps.isActive
        );
    }
);

const PlaylistCard = React.memo<{
    playlist: any;
    onPress: () => void;
}>(
    ({ playlist, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.playlistCard}
                onPress={onPress}
            >
                {playlist.cover_image ? (
                    <Image
                        source={{ uri: playlist.cover_image }}
                        style={styles.playlistCoverImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.playlistCoverPlaceholder}>
                        <Text style={styles.playlistCoverText}>
                            {playlist.name?.charAt(0)?.toUpperCase() || 'P'}
                        </Text>
                    </View>
                )}
                <Text style={styles.playlistTitle} numberOfLines={1}>
                    {playlist.name}
                </Text>
                <Text style={styles.playlistSubtitle} numberOfLines={2}>
                    {playlist.description || 'No description'}
                </Text>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.playlist.id === nextProps.playlist.id
);

const ArtistCard = React.memo<{
    artist: Artist;
}>(
    ({ artist }) => {
        return (
            <View style={styles.artistItem}>
                {artist.profile_image ? (
                    <Image
                        source={{ uri: artist.profile_image }}
                        style={styles.artistAvatar}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.artistAvatarPlaceholder}>
                        <Text style={styles.artistAvatarText}>
                            {artist.name?.charAt(0)?.toUpperCase() || 'A'}
                        </Text>
                    </View>
                )}
                <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                </Text>
            </View>
        );
    },
    (prevProps, nextProps) => prevProps.artist.id === nextProps.artist.id
);

const NewsCard = React.memo<{
    news: any;
    onPress: () => void;
}>(
    ({ news, onPress }) => {
        return (
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <ImageBackground
                    source={{ uri: news.image_url }}
                    style={styles.newsCard}
                    imageStyle={styles.newsCardBackgroundImage}
                >
                    <View style={styles.newsCardOverlay} />
                    <View style={styles.newsCardContent}>
                        <View style={styles.newsMetaRow}>
                            <Text style={styles.newsDate}>{news.date}</Text>
                        </View>
                        <Text style={styles.newsTitle} numberOfLines={2}>
                            {news.title}
                        </Text>
                        <Text style={styles.newsSummary} numberOfLines={2}>
                            {news.summary}
                        </Text>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.news.id === nextProps.news.id
);

// ============ MAIN COMPONENT ============

const HomeScreen: React.FC<HomeScreenProps> = ({ profile }) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { showToast } = useToast();
    const { playSong, currentSong, isPlaying } = usePlayer();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery] = useState('');
    const [latestDrops, setLatestDrops] = useState<readonly Song[]>([]);
    const [loadingLatestDrops, setLoadingLatestDrops] = useState(true);
    const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
    const [loadingMusicVideos, setLoadingMusicVideos] = useState(true);
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(true);
    const [newsData, setNewsData] = useState<NewsData[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [topStreamedSongs, setTopStreamedSongs] = useState<readonly Song[]>([]);
    const [loadingTopStreamed, setLoadingTopStreamed] = useState(true);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(true);
    const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
    const [loadingFeaturedArtists, setLoadingFeaturedArtists] = useState(true);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    // Mapping functions (memoized)
    const mapApiDataToSong = useCallback((apiData: any): Song => {
        return {
            artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
            title: apiData.title || apiData.name || 'Unknown Title',
            url: apiData.url || apiData.audio_file_url || apiData.audio || '',
            time: apiData.time || apiData.duration || apiData.length || '00:00',
            cover: apiData.cover || apiData.cover_image_url || apiData.image || apiData.cover_image || FALLBACK_SONG_COVER,
            lyrics: apiData.lyrics || '',
        };
    }, []);

    const mapApiDataToMusicVideo = useCallback((apiData: any): MusicVideo => {
        return {
            id: String(apiData.id || ''),
            title: apiData.title || 'Unknown Title',
            artist: apiData.artist || 'Unknown Artist',
            cover: apiData.thumbnail || apiData.cover || FALLBACK_SONG_COVER,
            videoUrl: apiData.video_url || apiData.videoUrl || undefined,
        };
    }, []);

    const mapApiDataToPodcast = useCallback((apiData: any): Podcast => {
        let formattedDuration = apiData.duration || '0:00';
        if (formattedDuration.includes(':') && formattedDuration.split(':').length === 2) {
            const [minutes, seconds] = formattedDuration.split(':');
            const totalMinutes = parseInt(minutes, 10);
            formattedDuration = `${totalMinutes} min`;
        }

        return {
            id: String(apiData.id || ''),
            title: apiData.title || 'Unknown Title',
            duration: formattedDuration,
            cover: apiData.thumbnail || apiData.cover || FALLBACK_SONG_COVER,
            audioUrl: apiData.audio_url || apiData.audioUrl || apiData.video_url || undefined,
        };
    }, []);

    const mapApiDataToNewsItem = useCallback((apiData: NewsData, index: number) => {
        const dateString = apiData.published_at || apiData.created_at;
        let formattedDate = '';
        if (dateString) {
            try {
                const date = new Date(dateString);
                formattedDate = date.toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            } catch {
                formattedDate = dateString;
            }
        }

        const backdrop = apiData.image_url || NEWS_BACKDROPS[index % NEWS_BACKDROPS.length];

        return {
            id: String(apiData.id),
            title: apiData.title || 'Untitled',
            summary: apiData.summary || '',
            date: formattedDate,
            category: (apiData.category?.toLowerCase() as 'recommend' | 'popular' | 'new') || 'new',
            content: apiData.content || '',
            image_url: backdrop,
        };
    }, []);

    // Fetch functions (same as before, but using memoized mappers)
    const fetchLatestDrops = useCallback(async () => {
        try {
            setLoadingLatestDrops(true);
            const api = await getApiInstance();
            const response = await api.get('/api/musics?page=1&limit=100');

            const data = response.data?.data || response.data || [];
            const mappedSongs: Song[] = Array.isArray(data)
                ? data.map(mapApiDataToSong)
                : [];

            setLatestDrops(mappedSongs);
        } catch (error: any) {
            console.error('Error fetching latest drops:', error);
            setLatestDrops([...SONGS]);
        } finally {
            setLoadingLatestDrops(false);
        }
    }, [mapApiDataToSong]);

    const fetchMusicVideos = useCallback(async () => {
        try {
            setLoadingMusicVideos(true);
            const api = await getApiInstance();
            const response = await api.get('/api/music-videos', {
                params: { page: 1, limit: 5 },
            });

            const data = response.data?.data || [];
            const mappedVideos: MusicVideo[] = Array.isArray(data)
                ? data.map(mapApiDataToMusicVideo)
                : [];

            setMusicVideos(mappedVideos);
        } catch (error: any) {
            console.error('Error fetching music videos:', error);
            setMusicVideos([]);
        } finally {
            setLoadingMusicVideos(false);
        }
    }, [mapApiDataToMusicVideo]);

    const fetchPodcasts = useCallback(async () => {
        try {
            setLoadingPodcasts(true);
            const api = await getApiInstance();
            const response = await api.get('/api/podcasts', {
                params: { page: 1, limit: 5 },
            });

            const data = response.data?.data || [];
            const mappedPodcasts: Podcast[] = Array.isArray(data)
                ? data.map(mapApiDataToPodcast)
                : [];

            setPodcasts(mappedPodcasts);
        } catch (error: any) {
            console.error('Error fetching podcasts:', error);
            setPodcasts([]);
        } finally {
            setLoadingPodcasts(false);
        }
    }, [mapApiDataToPodcast]);

    const fetchNews = useCallback(async () => {
        try {
            setLoadingNews(true);
            const api = await getApiInstance();
            const response = await api.get('/api/news', {
                params: { page: 1, limit: 3 },
            });

            const data = response.data?.data || [];
            const publishedNews = Array.isArray(data)
                ? data.filter((item: NewsData) => item.is_published !== false)
                : [];

            setNewsData(publishedNews);
        } catch (error: any) {
            console.error('Error fetching news:', error);
            setNewsData([]);
        } finally {
            setLoadingNews(false);
        }
    }, []);

    const fetchTopStreamed = useCallback(async () => {
        try {
            setLoadingTopStreamed(true);
            const api = await getApiInstance();
            const response = await api.get('/api/musics/top-streamed');

            const data = response.data?.data || [];
            const mappedSongs: Song[] = Array.isArray(data)
                ? data.map(mapApiDataToSong).filter(song => song.url && song.url.trim() !== '')
                : [];

            setTopStreamedSongs(mappedSongs);
        } catch (error: any) {
            console.error('Error fetching top streamed:', error);
            setTopStreamedSongs([...SONGS].slice(0, 5));
        } finally {
            setLoadingTopStreamed(false);
        }
    }, [mapApiDataToSong]);

    const fetchPlaylists = useCallback(async () => {
        try {
            setLoadingPlaylists(true);
            const api = await getApiInstance();
            const response = await api.get('/api/playlists', {
                params: { page: 1, limit: 10, is_public: true },
            });

            const data = response.data?.data || [];
            setPlaylists(data);
        } catch (error: any) {
            console.error('Error fetching playlists:', error);
            setPlaylists([]);
        } finally {
            setLoadingPlaylists(false);
        }
    }, []);

    const fetchFeaturedArtists = useCallback(async () => {
        let cachedArtists: Artist[] | null = null;
        try {
            setLoadingFeaturedArtists(true);

            cachedArtists = await getFeaturedArtists();
            if (cachedArtists && cachedArtists.length > 0) {
                setFeaturedArtists(cachedArtists);
            }

            const api = await getApiInstance();
            const response = await api.get('/api/artists/random', {
                params: { limit: 10 },
            });

            const data = response.data?.data || [];
            const mappedArtists: Artist[] = Array.isArray(data)
                ? data.map((artist: any) => ({
                    id: artist.id,
                    name: artist.name || 'Unknown Artist',
                    profile_image: artist.profile_image || null,
                }))
                : [];

            setFeaturedArtists(mappedArtists);
            await saveFeaturedArtists(mappedArtists);
        } catch (error: any) {
            console.error('Error fetching featured artists:', error);

            if (!cachedArtists || cachedArtists.length === 0) {
                const fallbackCache = await getFeaturedArtists();
                if (fallbackCache && fallbackCache.length > 0) {
                    setFeaturedArtists(fallbackCache);
                } else {
                    setFeaturedArtists([]);
                }
            }
        } finally {
            setLoadingFeaturedArtists(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestDrops();
        fetchMusicVideos();
        fetchPodcasts();
        fetchNews();
        fetchTopStreamed();
        fetchPlaylists();
        fetchFeaturedArtists();
    }, [fetchLatestDrops, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists, fetchFeaturedArtists]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([
            fetchLatestDrops(),
            fetchMusicVideos(),
            fetchPodcasts(),
            fetchNews(),
            fetchTopStreamed(),
            fetchPlaylists(),
            fetchFeaturedArtists(),
        ]).finally(() => {
            setRefreshing(false);
            showToast({ message: 'Home refreshed', type: 'info' });
        });
    }, [fetchLatestDrops, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists, fetchFeaturedArtists, showToast]);

    const selectedGenres = profile.selectedGenres ?? [];
    const paddingTop = Math.max(insets.top, normalize(24));
    const paddingBottom = Math.max(insets.bottom, normalize(10)) + normalize(30);

    const filteredSongs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const songsToFilter = latestDrops.length > 0 ? latestDrops : SONGS;
        if (!query) {
            return songsToFilter;
        }
        return songsToFilter.filter(song => {
            return (
                song.title.toLowerCase().includes(query) ||
                song.artist.toLowerCase().includes(query)
            );
        });
    }, [searchQuery, latestDrops]);

    // Build sections for FlatList
    const sections = useMemo<Section[]>(() => {
        const result: Section[] = [
            { id: 'header', type: 'header' },
        ];

        if (topStreamedSongs.length > 0 || loadingTopStreamed) {
            result.push({ id: 'topStreamed', type: 'topStreamed', data: topStreamedSongs });
        }

        if (selectedGenres.length > 0) {
            result.push({ id: 'genres', type: 'genres', data: selectedGenres });
        }

        if (podcasts.length > 0 || loadingPodcasts) {
            result.push({ id: 'podcasts', type: 'podcasts', data: podcasts });
        }

        if (musicVideos.length > 0 || loadingMusicVideos) {
            result.push({ id: 'musicVideos', type: 'musicVideos', data: musicVideos });
        }

        if (filteredSongs.length > 0 || loadingLatestDrops) {
            result.push({ id: 'top100', type: 'top100', data: filteredSongs });
        }

        if (playlists.length > 0 || loadingPlaylists) {
            result.push({ id: 'playlists', type: 'playlists', data: playlists });
        }

        if (featuredArtists.length > 0 || loadingFeaturedArtists) {
            result.push({ id: 'artists', type: 'artists', data: featuredArtists });
        }

        if (newsData.length > 0 || loadingNews) {
            result.push({ id: 'news', type: 'news', data: newsData });
        }

        return result;
    }, [
        topStreamedSongs,
        loadingTopStreamed,
        selectedGenres,
        podcasts,
        loadingPodcasts,
        musicVideos,
        loadingMusicVideos,
        filteredSongs,
        loadingLatestDrops,
        playlists,
        loadingPlaylists,
        featuredArtists,
        loadingFeaturedArtists,
        newsData,
        loadingNews,
    ]);

    // Render section
    const renderSection: ListRenderItem<Section> = useCallback(
        ({ item }) => {
            switch (item.type) {
                case 'header':
                    return (
                        <View style={styles.section}>
                            <View style={styles.header}>
                                <View style={styles.headerLeft}>
                                    <View style={styles.profileInfo}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => navigation.navigate('Profile')}
                                        >
                                            {profile.profile_image ? (
                                                <Image
                                                    source={{ uri: profile.profile_image }}
                                                    style={styles.profileImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={styles.profileImagePlaceholder}>
                                                    <Text style={styles.profileImageText}>
                                                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        <View style={styles.profileTextContainer}>
                                            <Text style={styles.greeting}>{greeting}</Text>
                                            <Text style={styles.name}>
                                                {profile.full_name || 'User'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Image
                                    source={require('../../assets/images/home_soundcave.png')}
                                    style={{ width: normalize(100), height: normalize(50) }}
                                />
                            </View>
                        </View>
                    );

                case 'topStreamed':
                    return (
                        <View style={styles.section}>
                            {loadingTopStreamed && topStreamedSongs.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat top streamed...</Text>
                                </View>
                            ) : topStreamedSongs.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={[
                                        { type: 'large', songs: topStreamedSongs.slice(0, 1) },
                                        { type: 'column', songs: topStreamedSongs.slice(1, 3) },
                                        { type: 'column', songs: topStreamedSongs.slice(3, 5) },
                                    ]}
                                    renderItem={({ item: group }) => {
                                        if (group.type === 'large') {
                                            const song = group.songs[0];
                                            if (!song) return null;
                                            const isActive = currentSong?.url === song.url && isPlaying;
                                            return (
                                                <BestSongCard
                                                    song={song}
                                                    rank={1}
                                                    isLarge={true}
                                                    isActive={isActive}
                                                    onPress={() => {
                                                        if (!song.url || song.url.trim() === '') {
                                                            showToast({
                                                                message: `Audio tidak tersedia untuk ${song.title}`,
                                                                type: 'error',
                                                            });
                                                            return;
                                                        }
                                                        playSong(song, [...topStreamedSongs]);
                                                        showToast({
                                                            message: `Playing ${song.title}`,
                                                            type: 'info',
                                                        });
                                                    }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <View style={styles.bestSongsVerticalColumn}>
                                                    {group.songs.map((song, index) => {
                                                        const rank = group.songs === topStreamedSongs.slice(1, 3) ? index + 2 : index + 4;
                                                        const isActive = currentSong?.url === song.url && isPlaying;
                                                        return (
                                                            <BestSongCard
                                                                key={song.url || `top-${rank}`}
                                                                song={song}
                                                                rank={rank}
                                                                isLarge={false}
                                                                isActive={isActive}
                                                                onPress={() => {
                                                                    playSong(song, [...topStreamedSongs]);
                                                                    showToast({
                                                                        message: `Playing ${song.title}`,
                                                                        type: 'info',
                                                                    });
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </View>
                                            );
                                        }
                                    }}
                                    keyExtractor={(item, index) => `top-group-${index}`}
                                    contentContainerStyle={styles.bestSongsScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={3}
                                    windowSize={3}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada top streamed</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'genres':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Your vibe</Text>
                            {selectedGenres.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={selectedGenres}
                                    renderItem={({ item: genre }) => (
                                        <View style={styles.genreChip}>
                                            <Text style={styles.genreChipText}>{genre}</Text>
                                        </View>
                                    )}
                                    keyExtractor={(genre) => genre}
                                    contentContainerStyle={styles.chipRowScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={10}
                                    windowSize={5}
                                />
                            ) : (
                                <Text style={styles.emptyGenres}>
                                    You haven't picked any genres yet.
                                </Text>
                            )}
                        </View>
                    );

                case 'podcasts':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Podcasts</Text>
                            {loadingPodcasts && podcasts.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat podcasts...</Text>
                                </View>
                            ) : podcasts.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={podcasts}
                                    renderItem={({ item: podcast }) => (
                                        <PodcastCard
                                            podcast={podcast}
                                            onPress={() => {
                                                navigation.navigate('PodcastDetail', {
                                                    id: podcast.id,
                                                    title: podcast.title,
                                                    duration: podcast.duration,
                                                    cover: podcast.cover,
                                                    audioUrl: podcast.audioUrl,
                                                });
                                            }}
                                        />
                                    )}
                                    keyExtractor={(podcast) => podcast.id}
                                    contentContainerStyle={styles.podcastScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={5}
                                    windowSize={3}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada podcasts</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'musicVideos':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Music Video</Text>
                            {loadingMusicVideos && musicVideos.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat music videos...</Text>
                                </View>
                            ) : musicVideos.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={musicVideos}
                                    renderItem={({ item: video }) => (
                                        <MusicVideoCard
                                            video={video}
                                            onPress={() => {
                                                navigation.navigate('MusicVideoDetail', {
                                                    id: video.id,
                                                    title: video.title,
                                                    artist: video.artist,
                                                    cover: video.cover,
                                                    videoUrl: video.videoUrl,
                                                });
                                            }}
                                        />
                                    )}
                                    keyExtractor={(video) => video.id}
                                    contentContainerStyle={styles.musicVideoScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={5}
                                    windowSize={3}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada music videos</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'top100':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Top 100</Text>
                            {loadingLatestDrops && latestDrops.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat top 100...</Text>
                                </View>
                            ) : filteredSongs.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={Array.from({ length: Math.ceil(filteredSongs.length / 4) })}
                                    renderItem={({ index: columnIndex }) => {
                                        const columnItems = filteredSongs.slice(columnIndex * 4, columnIndex * 4 + 4);
                                        return (
                                            <View style={styles.top100Column}>
                                                {columnItems.map((song, itemIndex) => {
                                                    const isActive = currentSong?.url === song.url && isPlaying;
                                                    return (
                                                        <Top100Card
                                                            key={song.url || `song-${columnIndex * 4 + itemIndex}`}
                                                            song={song}
                                                            isActive={isActive}
                                                            onPress={() => {
                                                                if (!song.url || song.url.trim() === '') {
                                                                    showToast({
                                                                        message: `Audio tidak tersedia untuk ${song.title}`,
                                                                        type: 'error',
                                                                    });
                                                                    return;
                                                                }
                                                                playSong(song, [...filteredSongs]);
                                                                showToast({
                                                                    message: `Playing ${song.title}`,
                                                                    type: 'info',
                                                                });
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </View>
                                        );
                                    }}
                                    keyExtractor={(_, index) => `column-${index}`}
                                    contentContainerStyle={styles.top100ScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={3}
                                    windowSize={5}
                                    initialNumToRender={2}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada top 100</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'playlists':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Top playlists</Text>
                            {loadingPlaylists && playlists.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat playlists...</Text>
                                </View>
                            ) : playlists.length > 0 ? (
                                <View style={styles.playlistGrid}>
                                    {playlists.map(item => (
                                        <PlaylistCard
                                            key={item.id}
                                            playlist={item}
                                            onPress={() => {
                                                navigation.navigate('PlaylistSongs', {
                                                    playlistId: item.id,
                                                    playlistName: item.name,
                                                    playlistCover: item.cover_image || undefined,
                                                });
                                            }}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada playlists</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'artists':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Featured artists</Text>
                            {loadingFeaturedArtists && featuredArtists.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat featured artists...</Text>
                                </View>
                            ) : featuredArtists.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={featuredArtists}
                                    renderItem={({ item: artist }) => <ArtistCard artist={artist} />}
                                    keyExtractor={(artist) => String(artist.id)}
                                    contentContainerStyle={styles.artistRowScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={10}
                                    windowSize={5}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada featured artists</Text>
                                </View>
                            )}
                        </View>
                    );

                case 'news':
                    return (
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>News</Text>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('News')}
                                >
                                    <Text style={styles.viewAllText}>View all</Text>
                                </TouchableOpacity>
                            </View>
                            {loadingNews && newsData.length === 0 ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.loadingText}>Memuat news...</Text>
                                </View>
                            ) : newsData.length > 0 ? (
                                <View style={styles.newsList}>
                                    {newsData.map((item, index) => {
                                        const mappedNews = mapApiDataToNewsItem(item, index);
                                        return (
                                            <NewsCard
                                                key={item.id}
                                                news={mappedNews}
                                                onPress={() =>
                                                    navigation.navigate('NewsDetail', {
                                                        id: mappedNews.id,
                                                    })
                                                }
                                            />
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada news</Text>
                                </View>
                            )}
                        </View>
                    );

                default:
                    return null;
            }
        },
        [
            profile,
            greeting,
            navigation,
            loadingTopStreamed,
            topStreamedSongs,
            currentSong,
            isPlaying,
            playSong,
            showToast,
            selectedGenres,
            loadingPodcasts,
            podcasts,
            loadingMusicVideos,
            musicVideos,
            loadingLatestDrops,
            latestDrops,
            filteredSongs,
            loadingPlaylists,
            playlists,
            loadingFeaturedArtists,
            featuredArtists,
            loadingNews,
            newsData,
            mapApiDataToNewsItem,
        ]
    );

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
            <FlatList
                data={sections}
                renderItem={renderSection}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#ffffff"
                        colors={['#ffffff']}
                        progressBackgroundColor={COLORS.purple}
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
                initialNumToRender={3}
                getItemLayout={(data, index) => ({
                    length: normalize(300), // Approximate height
                    offset: normalize(300) * index,
                    index,
                })}
            />
        </SafeAreaView>
    );
};

// Styles remain the same as original
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.purple,
    },
    scrollContent: {
        paddingHorizontal: normalize(24),
        gap: normalize(28),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: normalize(14),
    },
    headerLeft: {
        flex: 1,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
    },
    profileImage: {
        width: normalize(50),
        height: normalize(50),
        borderRadius: normalize(25),
        backgroundColor: '#222',
    },
    profileImagePlaceholder: {
        width: normalize(50),
        height: normalize(50),
        borderRadius: normalize(25),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageText: {
        color: '#fff',
        fontSize: normalize(20),
        fontWeight: '700',
    },
    profileTextContainer: {
        flex: 1,
        gap: normalize(2),
    },
    greeting: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(14),
    },
    name: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: '#fff',
    },
    bestSongsScrollContent: {
        gap: normalize(10),
        paddingRight: normalize(24),
    },
    bestSongsVerticalColumn: {
        flexDirection: 'column',
        gap: normalize(10),
    },
    bestSongCardSmall: {
        width: normalize(95),
        height: normalize(95),
        borderRadius: normalize(10),
        overflow: 'hidden',
        backgroundColor: '#111',
        position: 'relative',
    },
    bestSongCardLarge: {
        width: normalize(200),
        height: normalize(200),
        borderRadius: normalize(10),
        overflow: 'hidden',
        backgroundColor: '#111',
        position: 'relative',
    },
    bestSongCardActive: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    bestSongCover: {
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
    },
    bestSongOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: normalize(16),
        justifyContent: 'space-between',
    },
    bestSongBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary,
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(6),
        borderRadius: normalize(999),
    },
    bestSongRank: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(14),
    },
    bestSongInfo: {
        gap: normalize(4),
    },
    bestSongTitle: {
        color: '#fff',
        fontSize: normalize(16),
        fontWeight: '700',
    },
    bestSongArtist: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: normalize(13),
    },
    section: {
        gap: normalize(12),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: normalize(22),
        fontWeight: '600',
    },
    chipRowScrollContent: {
        gap: normalize(10),
        paddingRight: normalize(24),
    },
    genreChip: {
        borderRadius: normalize(999),
        paddingVertical: normalize(8),
        paddingHorizontal: normalize(16),
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    genreChipText: {
        color: '#fff',
        fontWeight: '500',
    },
    emptyGenres: {
        color: 'rgba(255,255,255,0.6)',
        fontStyle: 'italic',
    },
    top100ScrollContent: {
        gap: normalize(12),
        paddingRight: normalize(24),
    },
    top100Column: {
        flexDirection: 'column',
        gap: normalize(12),
        width: TOP_100_COLUMN_WIDTH,
    },
    top100Card: {
        borderRadius: normalize(12),
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        gap: normalize(12),
        alignItems: 'center',
        padding: normalize(8),
        width: TOP_100_CARD_WIDTH,
    },
    top100CardActive: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    top100Cover: {
        width: normalize(52),
        height: normalize(52),
        borderRadius: normalize(8),
        backgroundColor: '#222',
    },
    top100Meta: {
        flex: 1,
        gap: normalize(4),
        minWidth: 0,
    },
    top100Title: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(16),
    },
    top100Artist: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(14),
    },
    playlistGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: normalize(10),
    },
    playlistCard: {
        flexBasis: '48%',
        borderRadius: normalize(18),
        padding: normalize(16),
        backgroundColor: '#181818',
        gap: normalize(12),
    },
    playlistCoverImage: {
        width: '100%',
        height: normalize(120),
        borderRadius: normalize(12),
        backgroundColor: '#222',
    },
    playlistCoverPlaceholder: {
        width: '100%',
        height: normalize(120),
        borderRadius: normalize(12),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playlistCoverText: {
        color: '#fff',
        fontSize: normalize(32),
        fontWeight: '700',
    },
    playlistTitle: {
        color: '#fff',
        fontWeight: '700',
        fontSize: normalize(14),
        marginBottom: normalize(4),
    },
    playlistSubtitle: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: normalize(12),
        lineHeight: normalize(16),
    },
    artistRowScrollContent: {
        flexDirection: 'row',
        gap: normalize(16),
        paddingRight: normalize(24),
    },
    artistItem: {
        alignItems: 'center',
        gap: normalize(8),
        width: normalize(80),
    },
    artistAvatar: {
        width: normalize(64),
        height: normalize(64),
        borderRadius: normalize(32),
        backgroundColor: '#222',
    },
    artistAvatarPlaceholder: {
        width: normalize(64),
        height: normalize(64),
        borderRadius: normalize(32),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    artistAvatarText: {
        color: '#fff',
        fontSize: normalize(24),
        fontWeight: '700',
    },
    artistName: {
        color: '#fff',
        fontWeight: '500',
        textAlign: 'center',
    },
    podcastScrollContent: {
        gap: normalize(5),
        paddingRight: normalize(24),
    },
    podcastCard: {
        width: normalize(140),
        gap: normalize(8),
    },
    podcastCover: {
        width: normalize(120),
        height: normalize(170),
        borderRadius: normalize(16),
        backgroundColor: '#222',
    },
    podcastTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(14),
    },
    podcastDuration: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(12),
    },
    viewAllText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: normalize(14),
        fontWeight: '500',
    },
    newsList: {
        gap: normalize(10),
    },
    newsCard: {
        borderRadius: normalize(14),
        padding: normalize(14),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: normalize(6),
    },
    newsCardBackgroundImage: {
        borderRadius: normalize(14),
    },
    newsCardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: normalize(14),
    },
    newsCardContent: {
        gap: normalize(6),
    },
    newsMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: normalize(4),
    },
    newsDate: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(11),
    },
    newsTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(14),
    },
    newsSummary: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: normalize(12),
    },
    musicVideoScrollContent: {
        gap: normalize(20),
        paddingRight: normalize(24),
    },
    musicVideoCard: {
        width: normalize(120),
        alignItems: 'center',
        gap: normalize(8),
    },
    musicVideoCover: {
        width: normalize(120),
        height: normalize(120),
        borderRadius: normalize(60),
        backgroundColor: '#222',
    },
    musicVideoTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(14),
        textAlign: 'center',
    },
    musicVideoArtist: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(12),
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(40),
        gap: normalize(12),
    },
    loadingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: normalize(14),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(40),
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: normalize(14),
        fontStyle: 'italic',
    },
});

export default HomeScreen;
