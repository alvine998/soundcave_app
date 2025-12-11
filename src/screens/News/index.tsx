import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { NEWS_BACKDROPS } from '../../storage/news';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type RootStackParamList = {
  Home: undefined;
  News: undefined;
  NewsDetail: {
    id: string;
  };
};

type NewsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'News'
>;

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

const NewsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsScreenNavigationProp>();
  const { showToast } = useToast();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recommend' | 'popular' | 'new'>('all');
  const [newsData, setNewsData] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(20);

  // Format date dari ISO string ke format yang lebih readable
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const fetchNews = useCallback(async (pageNum: number = 1, search: string = '', reset: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const api = await getApiInstance();
      const params: any = {
        page: pageNum,
        limit: 10,
      };

      // Add search query if provided
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get('/api/news', { params });
      
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      
      // Filter hanya yang is_published = true
      const publishedNews = Array.isArray(data)
        ? data.filter((item: NewsData) => item.is_published !== false)
        : [];

      if (reset || pageNum === 1) {
        setNewsData(publishedNews);
      } else {
        setNewsData(prev => [...prev, ...publishedNews]);
      }

      setTotalPages(pagination.pages || 1);
      setHasMore(pageNum < (pagination.pages || 1));
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching news:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat news';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      if (pageNum === 1) {
        setNewsData([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    fetchNews(1, searchQuery, true);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchNews(1, searchQuery, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filter by category (client-side filtering)
  const filteredNews = useMemo(() => {
    if (activeTab === 'all') {
      return newsData;
    }
    // Map category dari API ke tab
    // Asumsi: category dari API bisa berupa string apapun, kita filter berdasarkan category
    return newsData.filter(item => {
      const categoryLower = item.category?.toLowerCase() || '';
      if (activeTab === 'recommend') {
        return categoryLower.includes('recommend') || categoryLower.includes('featured');
      }
      if (activeTab === 'popular') {
        return categoryLower.includes('popular') || item.views > 100;
      }
      if (activeTab === 'new') {
        return categoryLower.includes('new') || categoryLower.includes('latest');
      }
      return true;
    });
  }, [newsData, activeTab]);

  // Headline news: ambil semua news yang is_headline === true
  const headlineNews = useMemo(
    () => filteredNews.filter(item => item.is_headline === true),
    [filteredNews],
  );

  // Rest news: semua news termasuk yang headline (headline juga muncul di list)
  const restNews = useMemo(
    () => filteredNews,
    [filteredNews],
  );

  const handleChangeTab = (tab: 'all' | 'recommend' | 'popular' | 'new') => {
    setActiveTab(tab);
  };

  const handleOpenDetail = (item: NewsData) => {
    navigation.navigate('NewsDetail', { id: String(item.id) });
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchNews(page + 1, searchQuery, false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews(1, searchQuery, true);
  }, [searchQuery, fetchNews]);

  if (loading && newsData.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>News</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceFromBottom =
            contentSize.height -
            (layoutMeasurement.height + contentOffset.y);

          if (distanceFromBottom < 200 && hasMore && !loadingMore) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>News</Text>
        </View>

        <View style={styles.searchContainer}>
          <FontAwesome6
            iconStyle="solid"
            name="magnifying-glass"
            size={18}
            color="rgba(255,255,255,0.6)"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari news..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}>
              <FontAwesome6
                iconStyle="solid"
                name="xmark"
                size={14}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          )}
        </View>

        {headlineNews.length > 0 && (
          <View style={styles.headlineSection}>
            <Text style={styles.headlineTitle}>Headline</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.headlineScroll}
            >
              {headlineNews.map((item, index) => {
                const coverUrl = item.image_url || NEWS_BACKDROPS[index % NEWS_BACKDROPS.length];
                const formattedDate = formatDate(item.published_at || item.created_at);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenDetail(item)}
                  >
                    <ImageBackground
                      source={{ uri: coverUrl }}
                      style={styles.headlineCard}
                      imageStyle={styles.cardBackgroundImage}
                    >
                      <View style={styles.cardOverlay} />
                      <View style={styles.cardContent}>
                        <Text style={styles.headlineDate}>{formattedDate}</Text>
                        <Text
                          style={styles.headlineCardTitle}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={styles.headlineCardSummary}
                          numberOfLines={2}
                        >
                          {item.summary}
                        </Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabChip,
              activeTab === 'all' && styles.tabChipActive,
            ]}
            onPress={() => handleChangeTab('all')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'all' && styles.tabLabelActive,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabChip,
              activeTab === 'recommend' && styles.tabChipActive,
            ]}
            onPress={() => handleChangeTab('recommend')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'recommend' && styles.tabLabelActive,
              ]}
            >
              Rekomendasi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabChip,
              activeTab === 'popular' && styles.tabChipActive,
            ]}
            onPress={() => handleChangeTab('popular')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'popular' && styles.tabLabelActive,
              ]}
            >
              Populer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabChip,
              activeTab === 'new' && styles.tabChipActive,
            ]}
            onPress={() => handleChangeTab('new')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'new' && styles.tabLabelActive,
              ]}
            >
              Terbaru
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {restNews.length > 0 ? (
          <>
            <View style={styles.newsList}>
              {restNews.map((item, index) => {
                const coverUrl = item.image_url || NEWS_BACKDROPS[(index + headlineNews.length) % NEWS_BACKDROPS.length];
                const formattedDate = formatDate(item.published_at || item.created_at);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenDetail(item)}
                  >
                    <ImageBackground
                      source={{ uri: coverUrl }}
                      style={styles.newsCard}
                      imageStyle={styles.cardBackgroundImage}
                    >
                      <View style={styles.cardOverlay} />
                      <View style={styles.cardContent}>
                        <View style={styles.newsMetaRow}>
                          <Text style={styles.newsDate}>{formattedDate}</Text>
                          {item.views > 0 && (
                            <Text style={styles.newsViews}>{item.views} views</Text>
                          )}
                        </View>
                        <Text style={styles.newsTitle}>{item.title}</Text>
                        <Text style={styles.newsSummary} numberOfLines={3}>
                          {item.summary}
                        </Text>
                        {item.category && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                          </View>
                        )}
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Memuat lebih banyak...</Text>
              </View>
            )}
            {!hasMore && restNews.length > 0 && (
              <View style={styles.endContainer}>
                <Text style={styles.endText}>Tidak ada news lagi</Text>
              </View>
            )}
          </>
        ) : !loading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Tidak ada news ditemukan untuk pencarian ini' : 'Tidak ada news'}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  scrollContent: {
    paddingHorizontal: normalize(24),
    gap: normalize(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(4),
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(14),
  },
  screenTitle: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(8),
    marginBottom: normalize(4),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  searchIcon: {
    marginRight: normalize(12),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: normalize(16),
    padding: 0,
  },
  clearButton: {
    padding: normalize(4),
    marginLeft: normalize(8),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(16),
    paddingVertical: normalize(40),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(12),
    paddingVertical: normalize(20),
  },
  loadingMoreText: {
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
    textAlign: 'center',
  },
  endContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(20),
  },
  endText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    fontStyle: 'italic',
  },
  newsViews: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(11),
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(12),
    marginTop: normalize(8),
  },
  categoryText: {
    color: '#fff',
    fontSize: normalize(11),
    fontWeight: '500',
  },
  tabRow: {
    gap: normalize(8),
    paddingVertical: normalize(4),
  },
  tabChip: {
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(6),
    borderRadius: normalize(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginRight: normalize(6),
  },
  tabChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: normalize(13),
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.purple,
  },
  headlineSection: {
    gap: normalize(10),
  },
  headlineTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  headlineScroll: {
    gap: normalize(12),
    paddingRight: normalize(24),
  },
  headlineCard: {
    width: normalize(220),
    borderRadius: normalize(16),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: normalize(6),
  },
  headlineDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(11),
  },
  headlineCardTitle: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  headlineCardSummary: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: normalize(12),
  },
  newsList: {
    gap: normalize(12),
  },
  newsCard: {
    borderRadius: normalize(16),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: normalize(8),
  },
  cardBackgroundImage: {
    borderRadius: normalize(16),
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: normalize(16),
  },
  cardContent: {
    gap: normalize(6),
  },
  newsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  newsTitle: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  newsSummary: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: normalize(13),
  },
});

export default NewsScreen;
