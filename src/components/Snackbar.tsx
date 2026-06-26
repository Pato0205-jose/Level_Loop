import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';

export type SnackbarVariant =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'achievement';

export type SnackbarOptions = {
  /** Texto principal corto. */
  title: string;
  /** Texto secundario opcional. */
  description?: string;
  variant?: SnackbarVariant;
  /** Duración en ms (default 3200; null para no auto-cerrar). */
  duration?: number | null;
  /** Acción a la derecha (opcional). */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Icono personalizado (sobrescribe el del variant). */
  icon?: keyof typeof MaterialIcons.glyphMap;
};

type SnackbarItem = SnackbarOptions & {
  id: number;
};

type ContextValue = {
  show: (opts: SnackbarOptions) => number;
  hide: (id: number) => void;
};

const SnackbarContext = createContext<ContextValue | null>(null);

export function useSnackbar(): ContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar debe usarse dentro de <SnackbarProvider>');
  }
  return ctx;
}

/**
 * Referencia global imperativa para disparar snackbars desde cualquier lugar
 * (servicios, handlers fuera de React). Sólo funciona después de que el
 * SnackbarProvider esté montado.
 */
export const snackbar = {
  show(opts: SnackbarOptions): number {
    if (!globalRef) {
      console.warn('Snackbar.show() llamado antes de montar SnackbarProvider.');
      return -1;
    }
    return globalRef.show(opts);
  },
  hide(id: number): void {
    globalRef?.hide(id);
  },
  success(title: string, description?: string): number {
    return this.show({ title, description, variant: 'success' });
  },
  error(title: string, description?: string): number {
    return this.show({ title, description, variant: 'error' });
  },
  info(title: string, description?: string): number {
    return this.show({ title, description, variant: 'info' });
  },
  warning(title: string, description?: string): number {
    return this.show({ title, description, variant: 'warning' });
  },
  achievement(title: string, description?: string): number {
    return this.show({ title, description, variant: 'achievement' });
  },
};

let globalRef: ContextValue | null = null;
let nextId = 1;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([]);

  const hide = useCallback((id: number) => {
    setItems((curr) => curr.filter((it) => it.id !== id));
  }, []);

  const show = useCallback(
    (opts: SnackbarOptions) => {
      const id = nextId++;
      const item: SnackbarItem = { ...opts, id };
      // Máx 3 visibles a la vez; el más viejo desaparece.
      setItems((curr) => {
        const next = [...curr, item];
        if (next.length > 3) next.shift();
        return next;
      });
      return id;
    },
    [],
  );

  const value = useMemo<ContextValue>(() => ({ show, hide }), [show, hide]);

  useEffect(() => {
    globalRef = value;
    return () => {
      if (globalRef === value) globalRef = null;
    };
  }, [value]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarStack items={items} onHide={hide} />
    </SnackbarContext.Provider>
  );
}

function SnackbarStack({
  items,
  onHide,
}: {
  items: SnackbarItem[];
  onHide: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.stack,
        {
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      {items.map((item) => (
        <SnackbarToast key={item.id} item={item} onHide={() => onHide(item.id)} />
      ))}
    </View>
  );
}

function SnackbarToast({
  item,
  onHide,
}: {
  item: SnackbarItem;
  onHide: () => void;
}) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissed = useRef(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -30,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }, [onHide, opacity, translateY]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const ms = item.duration === null ? null : (item.duration ?? 3200);
    if (ms !== null) {
      const timer = setTimeout(dismiss, ms);
      return () => clearTimeout(timer);
    }
  }, [dismiss, item.duration, opacity, translateY]);

  if (!fontsLoaded) return null;

  const variant: SnackbarVariant = item.variant ?? 'info';
  const meta = VARIANT_META[variant];
  const iconName: keyof typeof MaterialIcons.glyphMap = item.icon ?? meta.icon;

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderColor: meta.border, transform: [{ translateY }], opacity },
      ]}
    >
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.toastInner, { backgroundColor: meta.bg }]}>
        <View style={[styles.iconWrap, { backgroundColor: meta.iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={meta.iconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          )}
        </View>

        {item.action && (
          <Pressable
            onPress={() => {
              item.action?.onPress();
              dismiss();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: meta.iconColor },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.actionText, { color: meta.iconColor }]}>
              {item.action.label}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={dismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="close" size={18} color={colors.outline} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const VARIANT_META: Record<
  SnackbarVariant,
  {
    icon: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    iconBg: string;
    bg: string;
    border: string;
  }
> = {
  success: {
    icon: 'check-circle',
    iconColor: colors.tertiaryBright,
    iconBg: `${colors.tertiaryBright}26`,
    bg: 'rgba(19, 17, 37, 0.92)',
    border: `${colors.tertiaryBright}66`,
  },
  error: {
    icon: 'error',
    iconColor: '#ffb4ab',
    iconBg: 'rgba(255, 180, 171, 0.18)',
    bg: 'rgba(33, 12, 16, 0.92)',
    border: 'rgba(255, 180, 171, 0.5)',
  },
  warning: {
    icon: 'warning',
    iconColor: '#ffb86b',
    iconBg: 'rgba(255, 184, 107, 0.18)',
    bg: 'rgba(33, 22, 12, 0.92)',
    border: 'rgba(255, 184, 107, 0.5)',
  },
  info: {
    icon: 'info',
    iconColor: colors.primaryAccent,
    iconBg: `${colors.primaryAccent}1f`,
    bg: 'rgba(19, 17, 37, 0.92)',
    border: `${colors.primaryAccent}55`,
  },
  achievement: {
    icon: 'emoji-events',
    iconColor: '#ffd57b',
    iconBg: 'rgba(255, 213, 123, 0.2)',
    bg: 'rgba(33, 27, 12, 0.95)',
    border: 'rgba(255, 213, 123, 0.6)',
  },
};

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    gap: spacing.sm,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 18,
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
