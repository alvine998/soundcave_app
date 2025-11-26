import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';

import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { updateUserProfile, UserProfile } from '../../storage/userStorage';

const GENRES = [
  'Pop',
  'R&B',
  'Hip Hop',
  'Electronic',
  'House',
  'Indie',
  'Rock',
  'Jazz',
  'Classical',
  'K-Pop',
  'Latin',
  'Afrobeats',
] as const;

type GenresScreenProps = {
  profile: UserProfile;
  onComplete: (profile: UserProfile) => void;
};

const GenresScreen: React.FC<GenresScreenProps> = ({ profile, onComplete }) => {
  const preselected = useMemo(
    () => new Set(profile.selectedGenres || []),
    [profile.selectedGenres],
  );
  const [selected, setSelected] = useState<Set<string>>(preselected);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const toggleGenre = (genre: string) => {
    const next = new Set(selected);
    if (selected.has(genre)) {
      next.delete(genre);
      setSelected(next);
      return;
    }

    if (selected.size === 5) {
      showToast({
        message: 'You can pick up to five favorite genres.',
        type: 'error',
      });
      return;
    }

    next.add(genre);
    setSelected(next);
  };

  const handleContinue = async () => {
    if (!selected.size) {
      showToast({ message: 'Choose at least one genre.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const updatedProfile = await updateUserProfile({
        selectedGenres: Array.from(selected),
      });
      showToast({ message: 'Preferences saved.', type: 'success' });
      onComplete(updatedProfile);
    } catch (error) {
      showToast({
        message: 'Unable to save your preferences right now.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose your vibe</Text>
        <Text style={styles.subtitle}>
          Pick up to five genres you want us to recommend.
        </Text>

        <View style={styles.genreGrid}>
          {GENRES.map(genre => {
            const isActive = selected.has(genre);
            return (
              <TouchableOpacity
                key={genre}
                activeOpacity={0.85}
                onPress={() => toggleGenre(genre)}
                style={[
                  styles.genreChip,
                  isActive && styles.genreChipActive,
                ]}>
                <Text
                  style={[
                    styles.genreChipText,
                    isActive && styles.genreChipTextActive,
                  ]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.primaryButton,
            (!selected.size || saving) && styles.primaryButtonDisabled,
          ]}
          disabled={!selected.size || saving}
          onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  container: {
    flex: 1,
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(32),
    gap: normalize(16),
  },
  title: {
    fontSize: normalize(32),
    fontWeight: '700',
    color: COLORS.light,
  },
  subtitle: {
    fontSize: normalize(16),
    color: COLORS.light,
    marginBottom: normalize(8),
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(12),
    marginTop: normalize(12),
  },
  genreChip: {
    borderRadius: normalize(999),
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(20),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: '#fff',
  },
  genreChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  genreChipText: {
    color: COLORS.dark,
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: COLORS.light,
  },
  primaryButton: {
    marginTop: 'auto',
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(999),
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.primaryText,
    fontSize: normalize(16),
    fontWeight: '600',
  },
});

export default GenresScreen;


