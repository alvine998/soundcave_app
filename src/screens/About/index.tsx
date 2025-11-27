import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(20),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + normalize(10) }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo_s_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>SoundCave</Text>
          <Text style={styles.version}>Version 1.0.8</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About SoundCave</Text>
          <Text style={styles.description}>
            SoundCave adalah aplikasi streaming musik yang dirancang untuk
            memberikan pengalaman mendengarkan musik terbaik. Temukan lagu
            favorit Anda, buat playlist, dan nikmati musik berkualitas tinggi
            kapan saja, di mana saja.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitur Utama</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <FontAwesome6 name="music" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>
                Streaming musik berkualitas tinggi
              </Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome6 name="list" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Buat dan kelola playlist</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome6
                name="magnifying-glass"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.featureText}>
                Cari lagu dan artist favorit
              </Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome6 name="podcast" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Podcast dan music video</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome6 name="heart" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Simpan lagu favorit</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome6 name="download" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>
                Download untuk offline (Premium)
              </Text>
            </View>
          </View>
        </View>

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Developed by</Text>
            <Text style={styles.infoValue}>SoundCave Team</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontak</Text>
          <View style={styles.contactList}>
            <TouchableOpacity style={styles.contactItem} activeOpacity={0.8}>
              <FontAwesome6
                name="envelope"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.contactText}>support@soundcave.app</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem} activeOpacity={0.8}>
              <FontAwesome6
                name="globe"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.contactText}>www.soundcave.site</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem} activeOpacity={0.8}>
              <FontAwesome6
                name="instagram"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.contactText}>@soundcave_music</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2025 SoundCave. All rights reserved.
          </Text>
          <Text style={styles.footerText}>Made with ❤️ for music lovers</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  headerButton: {
    width: normalize(40),
    height: normalize(40),
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: normalize(40),
    gap: normalize(12),
  },
  logo: {
    width: normalize(120),
    height: normalize(120),
  },
  appName: {
    color: '#fff',
    fontSize: normalize(32),
    fontWeight: '700',
  },
  version: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
  },
  section: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(16),
    gap: normalize(16),
  },
  sectionTitle: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(15),
    lineHeight: normalize(24),
  },
  featuresList: {
    gap: normalize(16),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16),
    backgroundColor: '#111',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: normalize(14),
  },
  infoCard: {
    backgroundColor: '#111',
    padding: normalize(20),
    borderRadius: normalize(16),
    gap: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  infoValue: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  contactList: {
    gap: normalize(12),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16),
    backgroundColor: '#111',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  contactText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: normalize(14),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: normalize(32),
    gap: normalize(8),
  },
  copyright: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
});

export default AboutScreen;
