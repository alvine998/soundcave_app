import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import ImagePicker from 'react-native-image-crop-picker';

import { COLORS } from '../../config/color';
import { UserProfile, getUserProfile, updateUserProfile } from '../../storage/userStorage';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';

type RootStackParamList = {
  EditProfile: {
    profile: UserProfile;
    onSave: (updatedProfile: UserProfile) => void;
  };
};

type EditProfileRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const route = useRoute<EditProfileRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const { profile, onSave } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [profileImage, setProfileImage] = useState<string | null>(profile.profile_image || null);
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);

  // Fetch user profile dari API
  const fetchUserProfile = useCallback(async () => {
    if (!profile.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get(`/api/users/${profile.id}`);
      
      const userData = response.data?.data || response.data;
      
      if (userData) {
        setFullName(userData.full_name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setLocation(userData.location || '');
        setBio(userData.bio || '');
        setProfileImage(userData.profile_image || null);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal memuat profile';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [profile.id, showToast]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleChangePhoto = () => {
    ImagePicker.openPicker({
      width: 400,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true,
      mediaType: 'photo',
      compressImageQuality: 0.8,
      includeBase64: false,
    })
      .then(image => {
        setSelectedImagePath(image.path);
        setProfileImage(image.path);
      })
      .catch(error => {
        if (error.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Error', 'Gagal memilih foto. Silakan coba lagi.');
          console.error('ImagePicker Error:', error);
        }
      });
  };

  // Upload image ke API
  const uploadImage = useCallback(async (imagePath: string): Promise<string | null> => {
    try {
      const api = await getApiInstance();
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: imagePath,
        type: 'image/jpeg',
        name: 'profile_image.jpg',
      } as any);

      const response = await api.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Response structure: { success, message, data: { file_url, ... } }
      const imageUrl = response.data?.data?.file_url;
      return imageUrl || null;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengupload foto';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      return null;
    }
  }, [showToast]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Nama tidak boleh kosong.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email tidak boleh kosong.');
      return;
    }

    if (!profile.id) {
      Alert.alert('Error', 'User ID tidak ditemukan.');
      return;
    }

    try {
      setSaving(true);
      const api = await getApiInstance();

      // Upload image jika ada image baru yang dipilih
      let uploadedImageUrl = profileImage;
      if (selectedImagePath && selectedImagePath !== profile.profile_image) {
        const uploadedUrl = await uploadImage(selectedImagePath);
        if (uploadedUrl) {
          uploadedImageUrl = uploadedUrl;
        } else {
          // Jika upload gagal, tetap lanjutkan dengan image yang lama
          uploadedImageUrl = profile.profile_image || null;
        }
      }

      // Update profile via PUT API
      const updateData: any = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
      };

      // Hanya update profile_image jika ada perubahan
      if (uploadedImageUrl !== profile.profile_image) {
        updateData.profile_image = uploadedImageUrl;
      }

      const response = await api.put(`/api/users/${profile.id}`, updateData);
      const updatedUserData = response.data?.data || response.data;

      // Update local storage
      const updatedProfile: UserProfile = {
        ...profile,
        full_name: updatedUserData.full_name || fullName.trim(),
        email: updatedUserData.email || email.trim(),
        phone: updatedUserData.phone || phone.trim() || undefined,
        location: updatedUserData.location || location.trim() || undefined,
        bio: updatedUserData.bio || bio.trim() || undefined,
        profile_image: updatedUserData.profile_image || uploadedImageUrl || null,
      };

      await updateUserProfile(updatedProfile);
      onSave(updatedProfile);

      showToast({
        message: 'Profile berhasil diupdate!',
        type: 'success',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengupdate profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.7}
            disabled={saving || loading}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Picture Section */}
            <View style={styles.profilePictureSection}>
              <View style={styles.profilePictureContainer}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <FontAwesome6 name="user" size={48} color="#fff" />
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
                disabled={saving}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={fullName}
              onChangeText={setFullName}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor Telepon</Text>
            <TextInput
              style={styles.input}
              placeholder="+62 812 3456 7890"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lokasi</Text>
            <TextInput
              style={styles.input}
              placeholder="Jakarta, Indonesia"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={location}
              onChangeText={setLocation}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ceritakan tentang diri Anda..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
              editable={!saving}
            />
          </View>

          <Text style={styles.note}>* Field wajib diisi</Text>
        </View>
          </>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.8}>
              <View style={styles.settingLeft}>
                <FontAwesome6
                  name="lock"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.settingText}>Ubah Password</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.8}>
              <View style={styles.settingLeft}>
                <FontAwesome6
                  name="bell"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.settingText}>Notifikasi</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.8}>
              <View style={styles.settingLeft}>
                <FontAwesome6
                  name="shield-halved"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.settingText}>Privasi</Text>
              </View>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Hapus Akun',
                'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.',
                [
                  { text: 'Batal', style: 'cancel' },
                  {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert('Info', 'Fitur hapus akun sedang dalam pengembangan.');
                    },
                  },
                ],
              );
            }}>
            <FontAwesome6 name="trash-can" size={18} color="rgba(255,100,100,0.9)" />
            <Text style={styles.deleteButtonText}>Hapus Akun</Text>
          </TouchableOpacity>
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
  saveButton: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    backgroundColor: COLORS.primary,
    borderRadius: normalize(999),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: normalize(14),
    fontWeight: '700',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: normalize(32),
    gap: normalize(16),
  },
  profilePictureContainer: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(10),
    borderRadius: normalize(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: normalize(24),
    gap: normalize(20),
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
    minHeight: normalize(100),
    paddingTop: normalize(16),
  },
  note: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(16),
    gap: normalize(16),
  },
  sectionTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
  },
  settingsList: {
    gap: normalize(12),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  settingText: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    backgroundColor: 'rgba(255,100,100,0.1)',
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.3)',
  },
  deleteButtonText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: normalize(15),
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(60),
    gap: normalize(16),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;

