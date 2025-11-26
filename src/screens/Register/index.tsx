import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';
// @ts-expect-error: No types for FontAwesome6, see lint_context_0.
import Icon from 'react-native-vector-icons/FontAwesome6';

import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { saveUserProfile } from '../../storage/userStorage';

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
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
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
      await saveUserProfile({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setFullName('');
      setEmail('');
      setPassword('');
      setAgreed(false);
      showToast({ message: 'Account created! You can sign in now.', type: 'success' });
      onLogin();
    } catch (error) {
      showToast({
        message: 'Unable to save your account right now. Please try again shortly.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

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
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: COLORS.light,
    backgroundColor: 'rgba(98, 0, 130, 0.12)',
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


