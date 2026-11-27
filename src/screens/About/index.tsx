import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
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
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { getApiInstance } from '../../utils/api';

interface AppInfoData {
  id?: number;
  app_name: string;
  tagline?: string;
  description: string;
  version?: string | null;
  launch_date?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  social_media?: Record<string, string | undefined> | null;
  app_links?: Record<string, string | undefined> | null;
  legal?: Record<string, string | undefined> | null;
  features?: Record<string, boolean | unknown> | null;
  stats?: {
    total_users?: number;
    total_songs?: number;
    total_albums?: number;
  } | null;
}

const FEATURE_META: Record<string, { label: string; icon: string }> = {
  offline_mode: { label: 'Download untuk offline (Premium)', icon: 'download' },
  high_quality_audio: {
    label: 'Streaming musik berkualitas tinggi',
    icon: 'music',
  },
  unlimited_playlists: { label: 'Buat dan kelola playlist', icon: 'list' },
  ad_free: { label: 'Bebas iklan (Ad Free)', icon: 'shield-halved' },
};

const DEFAULT_FEATURES = [
  { key: 'high_quality_audio', label: 'Streaming musik berkualitas tinggi', icon: 'music' },
  { key: 'unlimited_playlists', label: 'Buat dan kelola playlist', icon: 'list' },
  { key: 'offline_mode', label: 'Download untuk offline (Premium)', icon: 'download' },
];

const formatFeatureLabel = (key: string): string => {
  if (FEATURE_META[key]) return FEATURE_META[key].label;
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const formatLaunchDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr.split('T')[0];
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const openExternalUrl = async (url?: string) => {
  if (!url) return;
  const normalizedUrl =
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
      ? url
      : `https://${url}`;
  try {
    await Linking.openURL(normalizedUrl);
  } catch (err) {
    console.warn('Unable to open URL:', normalizedUrl, err);
  }
};

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [appInfo, setAppInfo] = useState<AppInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLatestAppInfo = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const api = await getApiInstance();
      const response = await api.get('/api/app-info/latest');
      if (response.data?.success && response.data?.data) {
        setAppInfo(response.data.data);
      }
    } catch (err: any) {
      // Fallback to static defaults when no app_info record exists or network fails
      console.warn('Failed to fetch latest app info:', err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestAppInfo(false);
  }, [fetchLatestAppInfo]);

  const appName = appInfo?.app_name || 'SoundCave';
  const versionText = appInfo?.version ? `Version ${appInfo.version}` : 'Version 1.0.8';
  const launchDateText = formatLaunchDate(appInfo?.launch_date);
  const description =
    appInfo?.description ||
    'SoundCave adalah aplikasi streaming musik yang dirancang untuk memberikan pengalaman mendengarkan musik terbaik. Temukan lagu favorit Anda, buat playlist, dan nikmati musik berkualitas tinggi kapan saja, di mana saja.';

  const enabledFeatures = appInfo?.features
    ? Object.entries(appInfo.features)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => ({
          key,
          label: formatFeatureLabel(key),
          icon: FEATURE_META[key]?.icon || 'circle-check',
        }))
    : [];

  const featuresToRender =
    enabledFeatures.length > 0 ? enabledFeatures : DEFAULT_FEATURES;

  const email = appInfo?.email || 'support@soundcave.app';
  const phone = appInfo?.phone;
  const address = appInfo?.address;
  const webUrl = appInfo?.app_links?.web || 'www.soundcave.site';
  const iosUrl = appInfo?.app_links?.ios;
  const androidUrl = appInfo?.app_links?.android;

  const socialEntries = [
    { key: 'instagram', icon: 'instagram', value: appInfo?.social_media?.instagram },
    { key: 'facebook', icon: 'facebook', value: appInfo?.social_media?.facebook },
    { key: 'twitter', icon: 'x-twitter', value: appInfo?.social_media?.twitter },
    { key: 'youtube', icon: 'youtube', value: appInfo?.social_media?.youtube },
  ].filter(item => Boolean(item.value));

  const legalEntries = [
    { label: 'Privacy Policy', value: appInfo?.legal?.privacy_policy },
    { label: 'Terms of Service', value: appInfo?.legal?.terms_of_service },
    { label: 'Cookie Policy', value: appInfo?.legal?.cookie_policy },
  ].filter(item => Boolean(item.value));

  const stats = appInfo?.stats;
  const hasStats =
    stats &&
    ((stats.total_users ?? 0) > 0 ||
      (stats.total_songs ?? 0) > 0 ||
      (stats.total_albums ?? 0) > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(20),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchLatestAppInfo(true)}
            tintColor="#fff"
          />
        }
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <>
            {/* Logo & App Identity */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo_s_white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>{appName}</Text>
              {appInfo?.tagline ? (
                <Text style={styles.tagline}>{appInfo.tagline}</Text>
              ) : null}
              <Text style={styles.version}>
                {versionText}
                {launchDateText ? ` • ${launchDateText}` : ''}
              </Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About {appName}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Stats */}
            {hasStats && (
              <View style={styles.section}>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {(stats?.total_users ?? 0).toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.statLabel}>Users</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {(stats?.total_songs ?? 0).toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.statLabel}>Songs</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {(stats?.total_albums ?? 0).toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.statLabel}>Albums</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitur Utama</Text>
              <View style={styles.featuresList}>
                {featuresToRender.map(feature => (
                  <View key={feature.key} style={styles.featureItem}>
                    <FontAwesome6
                      name={feature.icon}
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.featureText}>{feature.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Developer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Developer</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Developed by</Text>
                <Text style={styles.infoValue}>{appName} Team</Text>
                {address ? (
                  <Text style={styles.infoSubValue}>{address}</Text>
                ) : null}
              </View>
            </View>

            {/* Contact & Social */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kontak</Text>
              <View style={styles.contactList}>
                <TouchableOpacity
                  style={styles.contactItem}
                  activeOpacity={0.8}
                  onPress={() => openExternalUrl(`mailto:${email}`)}
                >
                  <FontAwesome6
                    name="envelope"
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.contactText}>{email}</Text>
                </TouchableOpacity>

                {phone ? (
                  <TouchableOpacity
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => openExternalUrl(`tel:${phone}`)}
                  >
                    <FontAwesome6
                      name="phone"
                      size={18}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.contactText}>{phone}</Text>
                  </TouchableOpacity>
                ) : null}

                {webUrl ? (
                  <TouchableOpacity
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => openExternalUrl(webUrl)}
                  >
                    <FontAwesome6
                      name="globe"
                      size={18}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.contactText}>{webUrl}</Text>
                  </TouchableOpacity>
                ) : null}

                {iosUrl ? (
                  <TouchableOpacity
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => openExternalUrl(iosUrl)}
                  >
                    <FontAwesome6
                      name="apple"
                      size={18}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.contactText}>App Store</Text>
                  </TouchableOpacity>
                ) : null}

                {androidUrl ? (
                  <TouchableOpacity
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => openExternalUrl(androidUrl)}
                  >
                    <FontAwesome6
                      name="google-play"
                      size={18}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.contactText}>Google Play</Text>
                  </TouchableOpacity>
                ) : null}

                {socialEntries.map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.contactItem}
                    activeOpacity={0.8}
                    onPress={() => openExternalUrl(item.value)}
                  >
                    <FontAwesome6
                      name={item.icon}
                      size={18}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.contactText} numberOfLines={1}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Legal */}
            {legalEntries.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Legal</Text>
                <View style={styles.contactList}>
                  {legalEntries.map(item => (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.contactItem}
                      activeOpacity={0.8}
                      onPress={() => openExternalUrl(item.value)}
                    >
                      <FontAwesome6
                        name="file-lines"
                        size={18}
                        color="rgba(255,255,255,0.7)"
                      />
                      <Text style={styles.contactText}>{item.label}</Text>
                      <FontAwesome6
                        name="arrow-up-right-from-square"
                        size={14}
                        color="rgba(255,255,255,0.5)"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Copyright */}
            <View style={styles.footer}>
              <Text style={styles.copyright}>
                © {new Date().getFullYear()} {appName}. All rights reserved.
              </Text>
              <Text style={styles.footerText}>
                Made with ❤️ for music lovers
              </Text>
            </View>
          </>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: normalize(120),
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: normalize(24),
    gap: normalize(10),
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
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: normalize(15),
    textAlign: 'center',
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
  statsRow: {
    flexDirection: 'row',
    gap: normalize(12),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: normalize(4),
  },
  statValue: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
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
  infoSubValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
    marginTop: normalize(2),
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
