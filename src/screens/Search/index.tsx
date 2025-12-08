import React, { useState, useEffect } from 'react';
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';

type Genre = {
  id: string;
  name: string;
  image?: string;
  color?: string;
};

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get('/api/genres');
      setGenres(response.data.data || response.data || []);
    } catch (error: any) {
      console.error('Error fetching genres:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to load genres';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGenres = genres.filter(genre => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return genre.name.toLowerCase().includes(q);
  });

  const paddingBottom = normalize(100);

  const renderGenreItem = ({ item, index }: { item: Genre; index: number }) => {
    const isEven = index % 2 === 0;
    const genreColors = [
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#f9ca24',
      '#6c5ce7',
      '#a29bfe',
      '#fd79a8',
      '#fdcb6e',
      '#e17055',
      '#00b894',
      '#0984e3',
      '#d63031',
    ];
    const bgColor = item.color || genreColors[index % genreColors.length];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.genreCard,
          isEven && styles.genreCardLeft,
          !isEven && styles.genreCardRight,
        ]}
        onPress={() => {
          showToast({
            message: `Opening ${item.name}`,
            type: 'info',
          });
        }}>
        {item.image ? (
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.genreCardBackground}
            imageStyle={styles.genreCardImage}>
            <View style={styles.genreCardOverlay} />
            <Text style={styles.genreCardText}>{item.name}</Text>
          </ImageBackground>
        ) : (
          <View style={[styles.genreCardBackground, { backgroundColor: bgColor }]}>
            <Text style={styles.genreCardText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search genres..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={setQuery}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredGenres}
            keyExtractor={item => item.id || item.name}
            numColumns={2}
            contentContainerStyle={[styles.genreGrid, { paddingBottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={renderGenreItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No genres found</Text>
              </View>
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
  searchInput: {
    borderRadius: normalize(999),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    backgroundColor: '#111',
    color: '#fff',
    fontSize: normalize(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(100),
  },
  genreGrid: {
    gap: normalize(12),
    paddingTop: normalize(8),
  },
  genreCard: {
    flex: 1,
    height: normalize(100),
    borderRadius: normalize(8),
    overflow: 'hidden',
  },
  genreCardLeft: {
    marginRight: normalize(6),
  },
  genreCardRight: {
    marginLeft: normalize(6),
  },
  genreCardBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(16),
  },
  genreCardImage: {
    borderRadius: normalize(8),
  },
  genreCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: normalize(8),
  },
  genreCardText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    paddingVertical: normalize(60),
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
  },
});

export default SearchScreen;