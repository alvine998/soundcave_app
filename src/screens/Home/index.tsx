import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    Image,
    SafeAreaView,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    Dimensions,
    Platform,
    ListRenderItem,
    InteractionManager,
} from 'react-native';
import Skeleton from '../../components/Skeleton';
import normalize from 'react-native-normalize';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { HomeTabParamList } from '../../navigation/HomeTabs';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';


import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SONGS, Song } from '../../storage/songs';
import { NEWS_BACKDROPS } from '../../storage/news';
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
    ArtistDetail: {
        id: number;
        name: string;
        image: string | null;
    };
    Profile: undefined;
    GoLive: undefined;
    LiveStreamDetail: {
        id: string;
        title: string;
        streamer: string;
        viewerCount: number;
        cover: string;
        avatar: string;
        playbackUrl?: string;
    };
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

type LiveStream = {
    id: string;
    title: string;
    streamer: string;
    viewerCount: number;
    cover: string;
    avatar: string;
    playbackUrl?: string;
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
    | 'news'
    | 'liveStreaming'
    | 'goLive';


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
                    {/* <View style={styles.bestSongBadge}>
                        <Text style={styles.bestSongRank}>#{rank}</Text>
                    </View> */}
                    {/* <View style={styles.bestSongInfo}>
                        <Text style={styles.bestSongTitle} numberOfLines={1}>
                            {song.title}
                        </Text>
                        <Text style={styles.bestSongArtist} numberOfLines={1}>
                            {song.artist}
                        </Text>
                    </View> */}
                </View>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.song.id === nextProps.song.id &&
            prevProps.song.cover === nextProps.song.cover &&
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
                    fadeDuration={0}
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
                    fadeDuration={0}
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
                    fadeDuration={0}
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
            prevProps.song.id === nextProps.song.id &&
            prevProps.song.cover === nextProps.song.cover &&
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
        const navigation = useNavigation<HomeScreenNavigationProp>();

        return (
            <TouchableOpacity
                style={styles.artistItem}
                onPress={() => navigation.navigate('ArtistDetail', {
                    id: artist.id,
                    name: artist.name,
                    image: artist.profile_image
                })}
            >
                {artist.profile_image ? (
                    <Image
                        source={{ uri: artist.profile_image }}
                        style={styles.artistAvatar}
                        resizeMode="cover"
                        fadeDuration={0}
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
            </TouchableOpacity>
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
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                style={styles.newsCard}
            >
                <Image
                    source={{ uri: news.image_url }}
                    style={styles.newsCardThumbnail}
                    resizeMode="cover"
                />
                <View style={styles.newsCardContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                        {news.title}
                    </Text>
                    <Text style={styles.newsDate}>{news.date}</Text>
                </View>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.news.id === nextProps.news.id
);

const LiveStreamCard = React.memo<{
    stream: LiveStream;
    onPress: () => void;
}>(
    ({ stream, onPress }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.liveCard}
                onPress={onPress}
            >
                <Image
                    source={{ uri: stream.cover }}
                    style={styles.liveCover}
                    resizeMode="cover"
                />
                <View style={styles.liveOverlay}>
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                    <View style={styles.viewerBadge}>
                        <Text style={styles.viewerBadgeText}>
                            {stream.viewerCount > 1000 ? `${(stream.viewerCount / 1000).toFixed(1)}k` : stream.viewerCount}
                        </Text>
                    </View>
                </View>
                <View style={styles.liveInfo}>
                    <Image source={{ uri: stream.avatar }} style={styles.liveAvatar} />
                    <View style={styles.liveTextContainer}>
                        <Text style={styles.liveTitle} numberOfLines={1}>
                            {stream.title}
                        </Text>
                        <Text style={styles.liveStreamer} numberOfLines={1}>
                            {stream.streamer}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    },
    (prevProps, nextProps) => prevProps.stream.id === nextProps.stream.id
);


// ============ MAIN COMPONENT ============

const HomeScreen: React.FC<HomeScreenProps> = ({ profile }) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { showToast } = useToast();
    const { playSong, currentSong, isPlaying } = usePlayer();
    const [refreshing, setRefreshing] = useState(false);
    const [top100Songs, setTop100Songs] = useState<readonly Song[]>([]);
    const [loadingTop100, setLoadingTop100] = useState(true);
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
    const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
    const [loadingLiveStreams, setLoadingLiveStreams] = useState(true);


    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    // Mapping functions (memoized)
    const mapApiDataToSong = useCallback((apiData: any): Song => {
        return {
            id: apiData.id,
            artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
            title: apiData.title || apiData.name || 'Unknown Title',
            url: apiData.url || apiData.audio_file_url || apiData.audio || '',
            time: apiData.time || apiData.duration || apiData.length || '00:00',
            cover: apiData.cover || apiData.cover_image_url || apiData.image_url || apiData.image || apiData.cover_image || FALLBACK_SONG_COVER,
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

    const mapApiDataToLiveStream = useCallback((apiData: any): LiveStream => {
        return {
            id: String(apiData.id || ''),
            title: apiData.title || 'Untitled Stream',
            streamer: apiData.artist?.name || 'Unknown Artist',
            viewerCount: apiData.viewer_count || 0,
            avatar: apiData.artist?.profile_image || FALLBACK_SONG_COVER,
            cover: apiData.artist?.profile_image || FALLBACK_SONG_COVER,
            // Fix: Override 'localhost' from backend with actual server IP
            playbackUrl: apiData.playback_url ? apiData.playback_url.replace('localhost', '154.26.137.37') : undefined,
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

    const fetchTop100Songs = useCallback(async () => {
        try {
            setLoadingTop100(true);
            const api = await getApiInstance();
            const response = await api.get('/api/musics?page=1&limit=100&is_top100=1&is_approved=1');

            const data = response.data?.data || response.data || [];
            console.log(data, "==> data");
            const mappedSongs: Song[] = Array.isArray(data)
                ? data.map(mapApiDataToSong)
                : [];

            setTop100Songs(mappedSongs);
        } catch (error: any) {
            console.error('Error fetching top 100 hits:', error);
            setTop100Songs([]);
        } finally {
            setLoadingTop100(false);
        }
    }, [mapApiDataToSong]);

    const fetchMusicVideos = useCallback(async () => {
        try {
            setLoadingMusicVideos(true);
            const api = await getApiInstance();
            const response = await api.get('/api/music-videos', {
                params: {
                    page: 1,
                    limit: 5,
                    is_highlight: 1
                },
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

    // Grouping top streamed songs for the horizontal FlatList
    const topStreamedGroups = useMemo(() => {
        if (topStreamedSongs.length === 0) return [];
        return [
            { id: 'group-large', type: 'large', songs: topStreamedSongs.slice(0, 1) },
            { id: 'group-col-1', type: 'column', songs: topStreamedSongs.slice(1, 3) },
            { id: 'group-col-2', type: 'column', songs: topStreamedSongs.slice(3, 5) },
        ];
    }, [topStreamedSongs]);

    const fetchPlaylists = useCallback(async () => {
        try {
            setLoadingPlaylists(true);
            const api = await getApiInstance();
            const response = await api.get('/api/playlists', {
                params: { page: 1, limit: 10, is_public: true, user_id: 0 },
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
            const response = await api.get('/api/artists', {
                params: {
                    limit: 10,
                    is_highlight: 1
                },
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

    const fetchLiveStreams = useCallback(async () => {
        try {
            setLoadingLiveStreams(true);
            const api = await getApiInstance();
            const response = await api.get('/api/artist-streams/active', {
                params: { page: 1, limit: 10 },
            });

            const data = response.data?.data || [];
            const mappedStreams: LiveStream[] = Array.isArray(data)
                ? data.map(mapApiDataToLiveStream)
                : [];

            setLiveStreams(mappedStreams);
        } catch (error: any) {
            console.error('Error fetching live streams:', error);
            setLiveStreams([]);
        } finally {
            setLoadingLiveStreams(false);
        }
    }, [mapApiDataToLiveStream]);

    useEffect(() => {
        // Defer data fetching until after UI is mounted for smoother initial load
        InteractionManager.runAfterInteractions(() => {
            fetchTop100Songs();
            fetchMusicVideos();
            fetchPodcasts();
            fetchNews();
            fetchTopStreamed();
            fetchPlaylists();
            fetchFeaturedArtists();
            fetchLiveStreams();
        });
    }, [fetchTop100Songs, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists, fetchFeaturedArtists, fetchLiveStreams]);

    // Prefetch critical images
    useEffect(() => {
        if (top100Songs.length > 0) {
            top100Songs.slice(0, 10).forEach(song => {
                if (song.cover) Image.prefetch(song.cover);
            });
        }
        if (topStreamedSongs.length > 0) {
            topStreamedSongs.slice(0, 5).forEach(song => {
                if (song.cover) Image.prefetch(song.cover);
            });
        }
    }, [top100Songs, topStreamedSongs]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([
            fetchTop100Songs(),
            fetchMusicVideos(),
            fetchPodcasts(),
            fetchNews(),
            fetchTopStreamed(),
            fetchPlaylists(),
            fetchFeaturedArtists(),
            fetchLiveStreams(),
        ]).finally(() => {
            setRefreshing(false);
            // showToast({ message: 'Home refreshed', type: 'info' });
        });
    }, [fetchTop100Songs, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists, fetchFeaturedArtists, fetchLiveStreams, showToast]);

    const selectedGenres = profile.selectedGenres ?? [];
    const paddingTop = Math.max(insets.top, normalize(24));
    const paddingBottom = Math.max(insets.bottom, normalize(10)) + normalize(30);


    // Build sections for FlatList
    const sections = useMemo<Section[]>(() => {
        const result: Section[] = [
            { id: 'header', type: 'header' },
        ];

        if (profile.role === 'artist' || profile.role === 'independent' || profile.role === 'label') {
            result.push({ id: 'goLive', type: 'goLive' });
        }
        if (topStreamedSongs.length > 0 || loadingTopStreamed) {
            result.push({ id: 'topStreamed', type: 'topStreamed', data: topStreamedSongs });
        }

        if (featuredArtists.length > 0 || loadingFeaturedArtists) {
            result.push({ id: 'artists', type: 'artists', data: featuredArtists });
        }

        if (liveStreams.length > 0 || loadingLiveStreams) {
            result.push({ id: 'liveStreaming', type: 'liveStreaming', data: liveStreams });
        }


        if (musicVideos.length > 0 || loadingMusicVideos) {
            result.push({ id: 'musicVideos', type: 'musicVideos', data: musicVideos });
        }

        if (podcasts.length > 0 || loadingPodcasts) {
            result.push({ id: 'podcasts', type: 'podcasts', data: podcasts });
        }

        if (selectedGenres.length > 0) {
            result.push({ id: 'genres', type: 'genres', data: selectedGenres });
        }

        if (top100Songs.length > 0 || loadingTop100) {
            result.push({ id: 'top100', type: 'top100', data: top100Songs });
        }

        if (playlists.length > 0 || loadingPlaylists) {
            result.push({ id: 'playlists', type: 'playlists', data: playlists });
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
        top100Songs,
        loadingTop100,
        playlists,
        loadingPlaylists,
        featuredArtists,
        loadingFeaturedArtists,
        liveStreams,
        loadingLiveStreams,
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
                                <View style={styles.headerRight}>
                                    <Image
                                        source={require('../../assets/images/home_soundcave.png')}
                                        style={{ width: normalize(100), height: normalize(40) }}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        </View>
                    );

                case 'goLive':
                    return (
                        <View style={styles.section}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={styles.goLiveBanner}
                                onPress={() => navigation.navigate('GoLive')}
                            >
                                <View style={styles.goLiveBannerContent}>
                                    <View style={styles.goLiveIconContainer}>
                                        <FontAwesome6 name="tower-broadcast" size={24} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={styles.goLiveTitle}>Start Broadcasting</Text>
                                        <Text style={styles.goLiveSubtitle}>Go live and connect with your fans now</Text>
                                    </View>
                                </View>
                                <FontAwesome6 name="chevron-right" size={16} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>
                    );

                case 'topStreamed':
                    return (
                        <View style={styles.section}>
                            {loadingTopStreamed && topStreamedSongs.length === 0 ? (
                                <View style={styles.bestSongsScrollContent}>
                                    <Skeleton width={normalize(200)} height={normalize(200)} borderRadius={normalize(10)} />
                                    <View style={styles.bestSongsVerticalColumn}>
                                        <Skeleton width={normalize(95)} height={normalize(95)} borderRadius={normalize(10)} />
                                        <Skeleton width={normalize(95)} height={normalize(95)} borderRadius={normalize(10)} />
                                    </View>
                                </View>
                            ) : topStreamedSongs.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={topStreamedGroups}
                                    renderItem={({ item: group }) => {
                                        if (group.type === 'large') {
                                            const song = group.songs[0];
                                            if (!song) return null;
                                            const isActive = (currentSong as any)?.id === song.id;
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
                                                        // showToast({
                                                        //     message: `Playing ${song.title}`,
                                                        //     type: 'info',
                                                        // });
                                                    }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <View style={styles.bestSongsVerticalColumn}>
                                                    {group.songs.map((song, index) => {
                                                        const rank = group.songs === topStreamedSongs.slice(1, 3) ? index + 2 : index + 4;
                                                        const isActive = (currentSong as any)?.id === song.id;
                                                        return (
                                                            <BestSongCard
                                                                key={song.url || `top-${rank}`}
                                                                song={song}
                                                                rank={rank}
                                                                isLarge={false}
                                                                isActive={isActive}
                                                                onPress={() => {
                                                                    playSong(song, [...topStreamedSongs]);
                                                                    // showToast({
                                                                    //     message: `Playing ${song.title}`,
                                                                    //     type: 'info',
                                                                    // });
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </View>
                                            );
                                        }
                                    }}
                                    keyExtractor={(item) => item.id}
                                    contentContainerStyle={styles.bestSongsScrollContent}
                                    removeClippedSubviews={false}
                                    maxToRenderPerBatch={5}
                                    windowSize={5}
                                    initialNumToRender={3}
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
                            <Text style={styles.sectionTitle}>Your Vibes</Text>
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
                            <Text style={styles.sectionTitle}>Podcast</Text>
                            {loadingPodcasts && podcasts.length === 0 ? (
                                <View style={styles.podcastScrollContent}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={styles.podcastCard}>
                                            <Skeleton width={normalize(120)} height={normalize(170)} borderRadius={normalize(16)} />
                                            <Skeleton width={normalize(100)} height={normalize(14)} borderRadius={normalize(4)} style={{ marginTop: 8 }} />
                                        </View>
                                    ))}
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
                                <View style={styles.musicVideoScrollContent}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={styles.musicVideoCard}>
                                            <Skeleton width={normalize(120)} height={normalize(120)} borderRadius={normalize(60)} />
                                            <Skeleton width={normalize(80)} height={normalize(14)} borderRadius={normalize(4)} style={{ marginTop: 8 }} />
                                        </View>
                                    ))}
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
                            {loadingTop100 && top100Songs.length === 0 ? (
                                <View style={styles.top100ScrollContent}>
                                    {[1, 2].map(i => (
                                        <View key={i} style={styles.top100Column}>
                                            {[1, 2, 3, 4].map(j => (
                                                <Skeleton key={j} width={TOP_100_CARD_WIDTH} height={normalize(68)} borderRadius={normalize(12)} />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            ) : top100Songs.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={Array.from({ length: Math.ceil(top100Songs.length / 4) })}
                                    renderItem={({ index: columnIndex }) => {
                                        const columnItems = top100Songs.slice(columnIndex * 4, columnIndex * 4 + 4);
                                        return (
                                            <View style={styles.top100Column}>
                                                {columnItems.map((song, itemIndex) => {
                                                    const isActive = !!(currentSong && (currentSong as any).id === song.id);
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
                                                                playSong(song, [...top100Songs]);
                                                                // showToast({
                                                                //     message: `Playing ${song.title}`,
                                                                //     type: 'info',
                                                                // });
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
                                <View style={styles.playlistGrid}>
                                    {[1, 2, 3, 4].map(i => (
                                        <View key={i} style={[styles.playlistCard, { backgroundColor: 'transparent' }]}>
                                            <Skeleton width="100%" height={normalize(120)} borderRadius={normalize(12)} />
                                            <Skeleton width="80%" height={normalize(14)} borderRadius={normalize(4)} style={{ marginTop: 8 }} />
                                        </View>
                                    ))}
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
                            <Text style={styles.sectionTitle}>Artist</Text>
                            {loadingFeaturedArtists && featuredArtists.length === 0 ? (
                                <View style={styles.artistRowScrollContent}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <View key={i} style={styles.artistItem}>
                                            <Skeleton width={normalize(64)} height={normalize(64)} borderRadius={normalize(32)} />
                                            <Skeleton width={normalize(50)} height={normalize(12)} borderRadius={normalize(4)} style={{ marginTop: 8 }} />
                                        </View>
                                    ))}
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

                case 'liveStreaming':
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Live Streaming</Text>
                            {loadingLiveStreams && liveStreams.length === 0 ? (
                                <View style={styles.liveScrollContent}>
                                    {[1, 2].map(i => (
                                        <View key={i} style={styles.liveCard}>
                                            <Skeleton width={normalize(280)} height={normalize(180)} borderRadius={normalize(12)} />
                                            <Skeleton width={normalize(150)} height={normalize(14)} borderRadius={normalize(4)} style={{ marginTop: 12 }} />
                                        </View>
                                    ))}
                                </View>
                            ) : liveStreams.length > 0 ? (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={liveStreams}
                                    renderItem={({ item: stream }) => (
                                        <LiveStreamCard
                                            stream={stream}
                                            onPress={() => {
                                                navigation.navigate('LiveStreamDetail', {
                                                    id: stream.id,
                                                    title: stream.title,
                                                    streamer: stream.streamer,
                                                    viewerCount: stream.viewerCount,
                                                    cover: stream.cover,
                                                    avatar: stream.avatar,
                                                    playbackUrl: stream.playbackUrl,
                                                });
                                            }}
                                        />
                                    )}
                                    keyExtractor={(stream) => stream.id}
                                    contentContainerStyle={styles.liveScrollContent}
                                    removeClippedSubviews={true}
                                    maxToRenderPerBatch={5}
                                    windowSize={3}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Tidak ada streaming aktif</Text>
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
                                <View style={styles.newsList}>
                                    {[1, 2].map(i => (
                                        <Skeleton key={i} width="100%" height={normalize(100)} borderRadius={normalize(14)} />
                                    ))}
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
            topStreamedGroups,
            currentSong,
            playSong,
            showToast,
            selectedGenres,
            loadingPodcasts,
            podcasts,
            loadingMusicVideos,
            musicVideos,
            loadingTop100,
            top100Songs,
            loadingPlaylists,
            playlists,
            loadingFeaturedArtists,
            loadingFeaturedArtists,
            featuredArtists,
            loadingLiveStreams,
            liveStreams,
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
                removeClippedSubviews={Platform.OS === 'android'}
                maxToRenderPerBatch={5}
                windowSize={5}
                initialNumToRender={4}
                updateCellsBatchingPeriod={50}
                getItemLayout={(data, index) => ({
                    length: normalize(320), // Approximate average height of sections
                    offset: normalize(320) * index,
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
    },
    goLiveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
        backgroundColor: COLORS.primary,
        paddingHorizontal: normalize(12),
        paddingVertical: normalize(8),
        borderRadius: normalize(20),
    },
    goLiveText: {
        color: '#fff',
        fontSize: normalize(12),
        fontWeight: '700',
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
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bestSongCardLarge: {
        width: normalize(200),
        height: normalize(200),
        borderRadius: normalize(10),
        overflow: 'hidden',
        backgroundColor: '#111',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'transparent',
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
    goLiveBanner: {
        backgroundColor: '#1E1E1E',
        borderRadius: normalize(16),
        padding: normalize(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    goLiveBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(16),
    },
    goLiveIconContainer: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(12),
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goLiveTitle: {
        color: '#fff',
        fontSize: normalize(18),
        fontWeight: '700',
    },
    goLiveSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: normalize(13),
        marginTop: normalize(2),
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
        backgroundColor: '#111',
        borderWidth: 2,
        borderColor: 'transparent',
        flexDirection: 'row',
        gap: normalize(12),
        alignItems: 'center',
        padding: normalize(8),
        width: TOP_100_CARD_WIDTH,
    },
    top100CardActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        flexDirection: 'row',
        borderRadius: normalize(12),
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        gap: normalize(12),
    },
    newsCardThumbnail: {
        width: normalize(120),
        height: normalize(90),
        backgroundColor: '#222',
    },
    newsCardContent: {
        flex: 1,
        justifyContent: 'center',
        gap: normalize(6),
        paddingVertical: normalize(12),
        paddingRight: normalize(12),
    },
    newsTitle: {
        color: '#fff',
        fontWeight: '600',
        fontSize: normalize(15),
        lineHeight: normalize(20),
    },
    newsDate: {
        color: 'rgba(255,255,255,0.5)',
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
        height: normalize(170),
        borderRadius: normalize(16),
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
    liveScrollContent: {
        gap: normalize(15),
        paddingRight: normalize(24),
    },
    liveCard: {
        width: normalize(200),
        height: normalize(240),
        borderRadius: normalize(15),
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
    },
    liveCover: {
        width: '100%',
        height: '100%',
    },
    liveOverlay: {
        position: 'absolute',
        top: normalize(10),
        left: normalize(10),
        right: normalize(10),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    liveBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(4),
    },
    liveBadgeText: {
        color: '#fff',
        fontSize: normalize(10),
        fontWeight: '800',
    },
    viewerBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(4),
    },
    viewerBadgeText: {
        color: '#fff',
        fontSize: normalize(10),
        fontWeight: '600',
    },
    liveInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: normalize(12),
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(10),
    },
    liveAvatar: {
        width: normalize(32),
        height: normalize(32),
        borderRadius: normalize(16),
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    liveTextContainer: {
        flex: 1,
    },
    liveTitle: {
        color: '#fff',
        fontSize: normalize(13),
        fontWeight: '700',
    },
    liveStreamer: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: normalize(11),
    },
});

export default HomeScreen;
