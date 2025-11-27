import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';

type ProfileScreenProps = {
  profile: UserProfile;
  onLogout: () => void;
};

const PREMIUM_BENEFITS = [
  'Unlimited access to every song on SoundCave',
  'Studio-grade audio quality on all devices',
  'Download playlists for offline listening',
  'Ad-free sessions with unlimited skips',
  'Early access to exclusive drops & live sets',
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onLogout }) => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const insets = useSafeAreaInsets();

  const paddingBottom = normalize(100);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom }]}>
      <View style={styles.container}>
        {/* Header with Profile Picture */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{profile.fullName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.profilePicture}>
            <FontAwesome6 name="user" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{profile.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.selectedGenres?.length || 0}</Text>
            <Text style={styles.statLabel}>Genres</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5h</Text>
            <Text style={styles.statLabel}>This week</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.premiumButton}
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.premiumLabel}>Join Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.logoutButton}
            onPress={onLogout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent
        visible={showPremiumModal}
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SoundCave Premium</Text>
            {PREMIUM_BENEFITS.map(item => (
              <View key={item} style={styles.benefitRow}>
                <View style={styles.benefitDot} />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalActionJoin}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.modalActionLabel}>Join now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.modalAction}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.modalActionLabel}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(40),
    gap: normalize(24),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    flex: 1,
    gap: normalize(4),
  },
  greeting: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
  },
  name: {
    color: '#fff',
    fontSize: normalize(32),
    fontWeight: '700',
  },
  profilePicture: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(32),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: normalize(18),
    padding: normalize(20),
    gap: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  cardValue: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: normalize(12),
    // Optionally adjust minHeight for placeholder space if no statCard
    minHeight: normalize(0),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: normalize(16),
    padding: normalize(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  actions: {
    marginTop: 'auto',
    gap: normalize(12),
  },
  premiumButton: {
    backgroundColor: COLORS.primary,
    borderRadius: normalize(18),
    paddingVertical: normalize(16),
    alignItems: 'center',
  },
  premiumLabel: {
    color: COLORS.primaryText,
    fontSize: normalize(16),
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  logoutButton: {
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderRadius: normalize(999),
    paddingVertical: normalize(14),
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(24),
  },
  modalCard: {
    width: '100%',
    borderRadius: normalize(24),
    backgroundColor: '#141414',
    padding: normalize(24),
    gap: normalize(12),
  },
  modalTitle: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: '700',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  benefitText: {
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  modalAction: {
    marginTop: normalize(8),
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderRadius: normalize(12),
    paddingVertical: normalize(12),
    alignItems: 'center',
  },
  modalActionJoin: {
    marginTop: normalize(8),
    backgroundColor: COLORS.primary,
    borderRadius: normalize(12),
    paddingVertical: normalize(12),
    alignItems: 'center',
  },
  modalActionLabel: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default ProfileScreen;
