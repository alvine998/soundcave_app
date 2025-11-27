import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';

const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Mohon isi semua field yang diperlukan.');
      return;
    }

    Alert.alert(
      'Pesan Terkirim',
      'Terima kasih! Tim SoundCave akan menghubungi Anda segera.',
      [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setMessage('');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(20),
        }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + normalize(10) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <FontAwesome6 name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="headset" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Butuh Bantuan?</Text>
          <Text style={styles.heroDescription}>
            Tim SoundCave siap membantu Anda. Hubungi kami atau kirim pesan
            langsung.
          </Text>
        </View>

        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontak Cepat</Text>
          <View style={styles.contactList}>
            <TouchableOpacity style={styles.contactCard} activeOpacity={0.8}>
              <View style={styles.contactIconContainer}>
                <FontAwesome6 name="envelope" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@soundcave.app</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} activeOpacity={0.8}>
              <View style={styles.contactIconContainer}>
                <FontAwesome6 name="globe" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>www.soundcave.site</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} activeOpacity={0.8}>
              <View style={styles.contactIconContainer}>
                <FontAwesome6 name="instagram" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Instagram</Text>
                <Text style={styles.contactValue}>@soundcave_music</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kirim Pesan</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama Anda"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pesan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tulis pesan Anda di sini..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleSubmit}>
              <FontAwesome6 name="paper-plane" size={16} color="#fff" />
              <Text style={styles.submitButtonText}>Kirim Pesan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pertanyaan Umum</Text>
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Bagaimana cara upgrade ke Premium?
              </Text>
              <Text style={styles.faqAnswer}>
                Buka menu Profile, lalu tap tombol "Join Premium" untuk melihat
                paket dan benefit yang tersedia.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Bagaimana cara menambah lagu ke playlist?
              </Text>
              <Text style={styles.faqAnswer}>
                Cari lagu di menu Search, lalu tap tombol "Add to Playlist" di
                samping lagu yang ingin ditambahkan.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Apakah bisa download lagu untuk offline?
              </Text>
              <Text style={styles.faqAnswer}>
                Fitur download offline tersedia untuk member Premium. Upgrade
                akun Anda untuk menikmati fitur ini.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Bagaimana cara menghapus lagu dari playlist?
              </Text>
              <Text style={styles.faqAnswer}>
                Buka menu Playlist, lalu tap tombol "Remove" di samping lagu
                yang ingin dihapus.
              </Text>
            </View>
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Jam Operasional</Text>
          <Text style={styles.footerText}>Senin - Jumat: 09:00 - 18:00 WIB</Text>
          <Text style={styles.footerText}>Sabtu - Minggu: 10:00 - 16:00 WIB</Text>
          <Text style={styles.footerNote}>
            Kami akan merespon pesan Anda dalam 1x24 jam
          </Text>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: normalize(32),
    paddingHorizontal: normalize(24),
    gap: normalize(12),
  },
  iconContainer: {
    width: normalize(96),
    height: normalize(96),
    borderRadius: normalize(48),
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(8),
  },
  heroTitle: {
    color: '#fff',
    fontSize: normalize(28),
    fontWeight: '700',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(15),
    textAlign: 'center',
    lineHeight: normalize(22),
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
  contactList: {
    gap: normalize(12),
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: normalize(16),
    borderRadius: normalize(16),
    gap: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  contactIconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: normalize(4),
  },
  contactLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  contactValue: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  formContainer: {
    gap: normalize(16),
  },
  inputGroup: {
    gap: normalize(8),
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: normalize(12),
    padding: normalize(16),
    color: '#fff',
    fontSize: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: {
    minHeight: normalize(120),
    paddingTop: normalize(16),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    marginTop: normalize(8),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  faqList: {
    gap: normalize(16),
  },
  faqItem: {
    backgroundColor: '#111',
    padding: normalize(20),
    borderRadius: normalize(16),
    gap: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  faqQuestion: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '700',
  },
  faqAnswer: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    lineHeight: normalize(22),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: normalize(32),
    paddingHorizontal: normalize(24),
    gap: normalize(8),
  },
  footerTitle: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
    marginBottom: normalize(8),
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  footerNote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
    marginTop: normalize(8),
    fontStyle: 'italic',
  },
});

export default HelpScreen;

