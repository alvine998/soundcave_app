import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../../config/color';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  showToast: (payload: { message: string; type?: ToastType }) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const ICON_MAP: Record<ToastType, string> = {
  success: 'circle-check',
  error: 'circle-exclamation',
  info: 'circle-info',
};

const COLOR_MAP: Record<ToastType, { bg: string; fg: string }> = {
  success: { bg: 'rgba(0, 128, 0, 0.15)', fg: COLORS.success },
  error: { bg: 'rgba(255, 59, 48, 0.15)', fg: COLORS.danger },
  info: { bg: 'rgba(0, 122, 255, 0.15)', fg: COLORS.info },
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    setToast(current => ({ ...current, visible: false }));
  }, []);

  const showToast = useCallback(
    ({ message, type = 'info' }: { message: string; type?: ToastType }) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      setToast({ visible: true, message, type });

      hideTimer.current = setTimeout(() => {
        hideToast();
        hideTimer.current = null;
      }, 2600);
    },
    [hideToast],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastView toast={toast} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

type ToastViewProps = {
  toast: ToastState;
  onHide: () => void;
};

const ToastView: React.FC<ToastViewProps> = ({ toast, onHide }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { type, visible, message } = toast;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, translateY, visible]);

  if (!message) {
    return null;
  }

  const colors = COLOR_MAP[type];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onHide}
        style={styles.touchable}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.bg }]}>
          <FontAwesome6 name={ICON_MAP[type]} size={18} color={colors.fg} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  touchable: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    width: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '600',
  },
});


