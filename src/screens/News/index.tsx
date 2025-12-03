import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { NEWS, NewsItem, NEWS_BACKDROPS } from '../../storage/news';
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

const NewsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recommend' | 'popular' | 'new'>(
    'recommend',
  );
  const [visibleCount, setVisibleCount] = useState(5);

  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(20);

  const searchFiltered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return NEWS;
    }
    return NEWS.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const filteredNews = useMemo(
    () => searchFiltered.filter(item => item.category === activeTab),
    [activeTab, searchFiltered],
  );

  const headlineNews = useMemo(
    () => searchFiltered.slice(0, 3),
    [searchFiltered],
  );

  const restNews = useMemo(() => filteredNews, [filteredNews]);

  const visibleNews = useMemo(
    () => restNews.slice(0, visibleCount),
    [restNews, visibleCount],
  );

  const handleChangeTab = (tab: 'recommend' | 'popular' | 'new') => {
    setActiveTab(tab);
    setVisibleCount(5);
  };

  const handleOpenDetail = (item: NewsItem) => {
    navigation.navigate('NewsDetail', { id: item.id });
  };

  useEffect(() => {
    // Reset limit when search changes
    setVisibleCount(5);
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceFromBottom =
            contentSize.height -
            (layoutMeasurement.height + contentOffset.y);

          if (distanceFromBottom < 80 && restNews.length > visibleCount) {
            setVisibleCount(prev =>
              Math.min(prev + 5, restNews.length),
            );
          }
        }}
        scrollEventThrottle={16}
      >
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
          <View style={{ width: 'auto' }} />
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search news..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {headlineNews.length > 0 && (
          <View style={styles.headlineSection}>
            <Text style={styles.headlineTitle}>Headline</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.headlineScroll}
            >
              {headlineNews.map((item, index) => {
                const backdrop =
                  NEWS_BACKDROPS[index % NEWS_BACKDROPS.length];
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenDetail(item)}
                  >
                    <ImageBackground
                      source={{ uri: backdrop }}
                      style={styles.headlineCard}
                      imageStyle={styles.cardBackgroundImage}
                    >
                      <View style={styles.cardOverlay} />
                      <View style={styles.cardContent}>
                        <Text style={styles.headlineDate}>{item.date}</Text>
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
              Recommend
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
              Popular
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
              New
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.newsList}>
          {visibleNews.map((item, index) => {
            const globalIndex = NEWS.findIndex(n => n.id === item.id);
            const indexForCover =
              globalIndex >= 0 ? globalIndex : index + headlineNews.length;
            const backdrop =
              NEWS_BACKDROPS[indexForCover % NEWS_BACKDROPS.length];
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => handleOpenDetail(item)}
              >
                <ImageBackground
                  source={{ uri: backdrop }}
                  style={styles.newsCard}
                  imageStyle={styles.cardBackgroundImage}
                >
                  <View style={styles.cardOverlay} />
                  <View style={styles.cardContent}>
                    <View style={styles.newsMetaRow}>
                      <Text style={styles.newsDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text style={styles.newsSummary} numberOfLines={3}>
                      {item.summary}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
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
  searchInput: {
    marginTop: normalize(8),
    marginBottom: normalize(4),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(14),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#fff',
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
