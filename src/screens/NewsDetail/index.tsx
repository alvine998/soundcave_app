import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { NEWS, NewsItem, NEWS_BACKDROPS } from '../../storage/news';
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

const NewsDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewsDetailNavigationProp>();
  const route = useRoute<NewsDetailRouteProp>();

  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(20);

  const news = NEWS.find(item => item.id === route.params?.id) as
    | NewsItem
    | undefined;

  const newsIndex = NEWS.findIndex(item => item.id === route.params?.id);
  const coverUrl =
    newsIndex >= 0
      ? NEWS_BACKDROPS[newsIndex % NEWS_BACKDROPS.length]
      : NEWS_BACKDROPS[0];

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
        <View style={{ width: 'auto' }} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {news && (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: coverUrl }} style={styles.thumbnail} />
          </View>
        )}
        {news ? (
          <View style={styles.contentWrapper}>
            <Text style={styles.newsDate}>{news.date}</Text>
            <Text style={styles.newsTitle}>{news.title}</Text>
            <Text style={styles.newsBody}>{news.content}</Text>
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            <Text style={styles.emptyText}>News tidak ditemukan.</Text>
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
    gap: normalize(10)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: COLORS.light,
    padding: normalize(16),
    borderTopEndRadius: normalize(25),
    borderTopStartRadius: normalize(25),
    height: '100%',
  },
  newsDate: {
    color: COLORS.secondaryText,
    fontSize: normalize(12),
  },
  newsTitle: {
    color: COLORS.secondaryText,
    fontSize: normalize(22),
    fontWeight: '700',
  },
  newsBody: {
    color: COLORS.secondaryText,
    fontSize: normalize(14),
    lineHeight: normalize(20),
  },
  emptyText: {
    color: COLORS.secondaryText,
    fontSize: normalize(14),
  },
});

export default NewsDetailScreen;
