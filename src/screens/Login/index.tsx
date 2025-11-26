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
import { getUserProfile, UserProfile } from '../../storage/userStorage';

type LoginScreenProps = {
  onBack: () => void;
  onRegister: () => void;
  onGoogle: () => void;
  onSuccess: (profile: UserProfile) => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onRegister,
  onGoogle,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast({ message: 'Please enter both email and password.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const storedProfile = await getUserProfile();
      if (!storedProfile) {
        showToast({ message: 'No account found. Please register first.', type: 'error' });
        return;
      }

      if (
        storedProfile.email !== email.trim().toLowerCase() ||
        storedProfile.password !== password
      ) {
        showToast({ message: 'Email or password is incorrect.', type: 'error' });
        return;
      }

      showToast({ message: 'Welcome back!', type: 'success' });
      onSuccess(storedProfile);
    } catch (error) {
      showToast({
        message: 'Unable to verify your credentials right now. Please try again later.',
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

        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Enter your credentials to continue exploring curated sounds.
        </Text>

        <View style={styles.form}>
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

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.primaryButton,
            submitting && styles.primaryButtonDisabled,
          ]}
          disabled={submitting}
          onPress={handleLogin}
        >
          <Text style={styles.primaryText}>
            {submitting ? 'Checking...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.googleButton}
          onPress={onGoogle}
        >
          <Icon
            iconStyle="brand"
            name="google"
            size={normalize(18)}
            color="#EA4335"
          />
          <Text style={styles.googleText}>Login with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={onRegister}>
          <Text style={styles.switchText}>
            Don't have an account?{' '}
            <Text style={styles.switchHighlight}>Register</Text>
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
    color: COLORS.purple,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(999),
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: COLORS.light,
    fontSize: normalize(16),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryText: {
    color: COLORS.light,
    textAlign: 'center',
    fontSize: normalize(16),
    fontWeight: '500',
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

export default LoginScreen;
