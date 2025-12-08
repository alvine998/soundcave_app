import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';
// @ts-expect-error: No types for FontAwesome6, see lint_context_0.
import Icon from 'react-native-vector-icons/FontAwesome6';

import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { saveUserProfile, UserProfile } from '../../storage/userStorage';
import { getPublicApiInstance } from '../../utils/api';
import { CONFIG } from '../../config';

type RegisterScreenProps = {
  onBack: () => void;
  onLogin: () => void;
  onGoogle: () => void;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onLogin,
  onGoogle,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      showToast({ message: 'Please complete all fields.', type: 'error' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      showToast({ message: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (!agreed) {
      showToast({
        message:
          'Please agree to the Terms & Conditions and Privacy Policy to continue.',
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      const api = getPublicApiInstance();
      
      const requestData = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      };
      
      console.log('Register request:', requestData);
      
      const response = await api.post('/api/auth/register', requestData);
      
      console.log('Register response:', response.data);

      // Simpan user profile ke local storage
      const userData = response.data.data || response.data;
      await saveUserProfile({
        id: userData.id,
        full_name: userData.fullName || userData.full_name || fullName.trim(),
        email: userData.email || email.trim().toLowerCase(),
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        profile_image: userData.profileImage || userData.profile_image,
        role: userData.role || 'user',
        created_at: userData.createdAt || userData.created_at,
        updated_at: userData.updatedAt || userData.updated_at,
      });

      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setAgreed(false);
      showToast({ message: 'Account created! You can sign in now.', type: 'success' });
      onLogin();
    } catch (error: any) {
      console.error('Register error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        request: error.config,
      });
      
      let errorMessage = 'Unable to create your account right now. Please try again shortly.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (status === 400) {
          errorMessage = 'Invalid data. Please check your input and try again.';
        } else if (status === 409) {
          errorMessage = 'Email or phone number already exists. Please use different credentials.';
        } else {
          errorMessage = `Error ${status}: ${error.response.statusText || 'Request failed'}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join SoundCave to discover hand-picked mixes and sonic adventures.
        </Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAgreed(prev => !prev)}
            style={[
              styles.checkbox,
              agreed && styles.checkboxChecked,
            ]}>
            {agreed && (
              <Icon iconStyle="solid" name="check" size={normalize(14)} color={COLORS.primary} />
            )}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text style={styles.linkText}>Terms & Conditions</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.primaryButton,
            (!agreed || submitting) && styles.primaryButtonDisabled,
          ]}
          disabled={!agreed || submitting}
          onPress={handleRegister}>
          <Text style={styles.primaryText}>
            {submitting ? 'Saving...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.googleButton}
          onPress={onGoogle}>
          <Icon iconStyle="brand" name="google" size={normalize(18)} color="#EA4335" />
          <Text style={styles.googleText}>Register with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onLogin}>
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.switchHighlight}>Sign in</Text>
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
    justifyContent: 'center',
    gap: normalize(16),
  },
  backButton: {
    position: 'absolute',
    top: normalize(32),
    left: normalize(24),
    padding: normalize(8),
  },
  backText: {
    color: COLORS.light,
    fontSize: normalize(14),
  },
  title: {
    color: COLORS.light,
    fontSize: normalize(32),
    fontWeight: '700',
    marginBottom: normalize(8),
  },
  subtitle: {
    color: COLORS.light,
    fontSize: normalize(16),
    lineHeight: normalize(24),
    marginBottom: normalize(16),
  },
  form: {
    gap: normalize(12),
    marginBottom: normalize(24),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    fontSize: normalize(16),
    color: COLORS.dark,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(999),
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: COLORS.light,
    fontSize: normalize(16),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    marginBottom: normalize(12),
  },
  checkbox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(6),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    borderColor: COLORS.light,
  },
  checkboxChecked: {
    borderColor: COLORS.light,
    backgroundColor: COLORS.light,
  },
  checkboxLabel: {
    flex: 1,
    color: COLORS.light,
    fontSize: normalize(14),
    lineHeight: normalize(20),
  },
  linkText: {
    color: COLORS.successText,
    fontWeight: '600',
  },
  googleButton: {
    marginTop: normalize(8),
    paddingVertical: normalize(14),
    borderRadius: normalize(999),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    backgroundColor: '#fff',
  },
  googleText: {
    color: COLORS.dark,
    fontSize: normalize(15),
    fontWeight: '600',
  },
  switchText: {
    color: COLORS.light,
    textAlign: 'center',
    marginTop: normalize(12),
    fontSize: normalize(14),
  },
  switchHighlight: {
    color: COLORS.successText,
    fontWeight: '600',
  },
});

export default RegisterScreen;


