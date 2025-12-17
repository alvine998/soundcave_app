import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { NEWS_BACKDROPS } from '../../storage/news';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type RootStackParamList = {
  NewsDetail: {
    id: string;
  };
};

type NewsDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NewsDetail'
>;

type NewsDetailRouteProp = {
  key: string;
  name: 'NewsDetail';
  params: {
    id: string;
  };
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

const NewsDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsDetailNavigationProp>();
  const route = useRoute<NewsDetailRouteProp>();
  const { showToast } = useToast();

  const { id } = route.params;

  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);

  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(20);

  // Format date dari ISO string ke format yang lebih readable
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const fetchNewsDetail = useCallback(async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get(`/api/news/${id}`);
      
      if (response.data?.success && response.data?.data) {
        setNewsData(response.data.data);
      } else {
        showToast({
          message: 'Gagal memuat detail news',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error fetching news detail:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat detail news';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchNewsDetail();
  }, [fetchNewsDetail]);

  // Gunakan image_url dari API atau fallback ke NEWS_BACKDROPS
  const coverUrl = newsData?.image_url || NEWS_BACKDROPS[0];
  const formattedDate = newsData
    ? formatDate(newsData.published_at || newsData.created_at)
    : '';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <FontAwesome6
              iconStyle="solid"
              name="arrow-left"
              size={20}
              color={COLORS.light}
            />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>News</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat detail news...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!newsData) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <FontAwesome6
              iconStyle="solid"
              name="arrow-left"
              size={20}
              color={COLORS.light}
            />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>News</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>News tidak ditemukan.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchNewsDetail}
            activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <FontAwesome6
            iconStyle="solid"
            name="arrow-left"
            size={20}
            color={COLORS.light}
          />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>News</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: normalize(10), paddingHorizontal:normalize(20) }}>
          <Text style={styles.newsTitle}>{newsData.title}</Text>
          <View style={styles.metaRow}>
            {formattedDate && (
              <Text style={[styles.newsDate, { marginTop: normalize(10) }]}>
                {formattedDate}
              </Text>
            )}
            {newsData.author && (
              <Text style={[styles.newsAuthor, { marginTop: normalize(10) }]}>
                • {newsData.author}
              </Text>
            )}
            {newsData.category && (
              <Text style={[styles.newsCategory, { marginTop: normalize(10) }]}>
                • {newsData.category}
              </Text>
            )}
          </View>
          {newsData.views > 0 && (
            <Text style={[styles.newsViews, { marginTop: normalize(5) }]}>
              {newsData.views} views
            </Text>
          )}
        </View>
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: coverUrl }} style={styles.thumbnail} />
        </View>
        <View style={styles.contentWrapper}>
          {newsData.summary && (
            <Text style={styles.newsSummary}>{newsData.summary}</Text>
          )}
          <Text style={styles.newsBody}>{newsData.content}</Text>
          {newsData.tags && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Tags: </Text>
              <Text style={styles.tagsText}>{newsData.tags}</Text>
            </View>
          )}
        </View>
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
    gap: normalize(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(10),
    padding: normalize(16),
  },
  thumbnailContainer: {
    marginTop: normalize(0),
  },
  thumbnail: {
    width: '100%',
    height: normalize(200),
    borderRadius: normalize(10),
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
  contentWrapper: {
    gap: normalize(12),
    backgroundColor: COLORS.purple,
    padding: normalize(16),
    paddingHorizontal:normalize(20),
    borderTopEndRadius: normalize(25),
    borderTopStartRadius: normalize(25),
    height: '100%',
  },
  newsDate: {
    color: COLORS.light,
    fontSize: normalize(12),
  },
  newsTitle: {
    color: COLORS.light,
    fontSize: normalize(22),
    fontWeight: '700',
  },
  newsBody: {
    color: COLORS.light,
    fontSize: normalize(18),
    lineHeight: normalize(20),
  },
  emptyText: {
    color: COLORS.light,
    fontSize: normalize(14),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(16),
    paddingVertical: normalize(40),
  },
  loadingText: {
    color: COLORS.light,
    fontSize: normalize(14),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(999),
    marginTop: normalize(16),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: normalize(8),
  },
  newsAuthor: {
    color: COLORS.light,
    fontSize: normalize(12),
    opacity: 0.8,
  },
  newsCategory: {
    color: COLORS.light,
    fontSize: normalize(12),
    opacity: 0.8,
  },
  newsViews: {
    color: COLORS.light,
    fontSize: normalize(11),
    opacity: 0.6,
  },
  newsSummary: {
    color: COLORS.light,
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(16),
    lineHeight: normalize(22),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: normalize(20),
    paddingTop: normalize(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tagsLabel: {
    color: COLORS.light,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  tagsText: {
    color: COLORS.light,
    fontSize: normalize(14),
    opacity: 0.8,
  },
});

export default NewsDetailScreen;
