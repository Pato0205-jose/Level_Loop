import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { snackbar } from '../components/Snackbar';
import { colors, spacing } from '../constants/theme';
import {
  clearNotifications,
  formatRelative,
  getNotifications,
  markAllAsRead,
  markAsRead,
  type AppNotification,
} from '../services/notifications';

type Props = {
  onBack: () => void;
};

const HEADER_HEIGHT = 64;

export function NotificationsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const refresh = useCallback(async () => {
    const list = await getNotifications();
    setNotifications(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkAll = async () => {
    await markAllAsRead();
    refresh();
    snackbar.info('Listo', 'Todas las notificaciones se marcaron como leídas.');
  };

  const handleClear = async () => {
    await clearNotifications();
    refresh();
    snackbar.info('Bandeja vaciada', 'Eliminamos todas tus notificaciones.');
  };

  const handleTap = async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      refresh();
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!loaded ? null : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryCount}>{notifications.length}</Text>
                <Text style={styles.summaryLabel}>
                  {notifications.length === 1
                    ? 'notificación'
                    : 'notificaciones'}
                </Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount} sin leer
                    </Text>
                  </View>
                )}
              </View>
              {unreadCount > 0 && (
                <Pressable
                  onPress={handleMarkAll}
                  hitSlop={6}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.summaryAction}>Marcar todas</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.list}>
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onPress={() => handleTap(n)}
                />
              ))}
            </View>

            <Pressable
              onPress={handleClear}
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={18}
                color={colors.outline}
              />
              <Text style={styles.clearBtnText}>
                Limpiar todas las notificaciones
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <MaterialIcons
              name="arrow-back"
              size={26}
              color={colors.primaryAccent}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={{ width: 26 }} />
        </View>
      </BlurView>
    </View>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <BlurView
        intensity={30}
        tint="dark"
        style={[styles.card, !notification.read && styles.cardUnread]}
      >
        <View
          style={[
            styles.cardIconWrap,
            { backgroundColor: `${notification.color}1F` },
          ]}
        >
          <MaterialIcons
            name={notification.icon}
            size={24}
            color={notification.color}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.cardTime}>
            {formatRelative(notification.createdAt)}
          </Text>
        </View>
      </BlurView>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="notifications-none" size={48} color={colors.outline} />
      </View>
      <Text style={styles.emptyTitle}>Sin novedades</Text>
      <Text style={styles.emptyText}>
        Cuando recibas notificaciones aparecerán aquí.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    right: '20%',
    height: 240,
    borderRadius: 200,
    backgroundColor: `${colors.primaryAccent}14`,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.7)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.base,
  },
  summaryCount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  unreadBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: `${colors.tertiaryBright}1F`,
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}40`,
    marginLeft: spacing.base,
  },
  unreadBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.tertiaryBright,
    letterSpacing: 0.5,
  },
  summaryAction: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.tertiaryBright,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  cardUnread: {
    borderColor: `${colors.tertiaryBright}40`,
    backgroundColor: 'rgba(32, 29, 50, 0.7)',
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  cardMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 17,
  },
  cardTime: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  clearBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.outline,
    letterSpacing: 0.3,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
