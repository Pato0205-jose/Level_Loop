import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { snackbar } from '../components/Snackbar';
import { colors, spacing } from '../constants/theme';
import type { PublicUser } from '../services/auth';
import {
  feedback,
  getFeedbackPrefs,
  loadFeedbackPrefs,
  setFeedbackPrefs,
} from '../services/feedback';
import {
  cancelStreakReminder,
  ensurePushPermission,
  REMINDER_DEFAULTS,
  scheduleDailyStreakReminder,
} from '../services/pushReminders';
import { StorageKeys } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';

type Props = {
  user?: PublicUser | null;
  onBack: () => void;
  onLogout: () => void;
  onEditProfile?: () => void;
};

const HEADER_HEIGHT = 64;

export function SettingsScreen({ user, onBack, onLogout, onEditProfile }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const initialPrefs = getFeedbackPrefs();
  const [sound, setSound] = useState(initialPrefs.sound);
  const [haptics, setHaptics] = useState(initialPrefs.haptics);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadFeedbackPrefs();
      if (!cancelled) {
        setSound(prefs.sound);
        setHaptics(prefs.haptics);
      }
      const savedReminder = await getItem<string>(StorageKeys.PUSH_REMINDER_TIME);
      if (!cancelled && savedReminder === null) {
        setNotifications(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNotificationsChange = async (next: boolean) => {
    setNotifications(next);
    if (next) {
      const granted = await ensurePushPermission();
      if (!granted) {
        setNotifications(false);
        snackbar.error(
          'Permiso denegado',
          'Activa las notificaciones desde los ajustes del sistema.',
        );
        return;
      }
      const ok = await scheduleDailyStreakReminder(
        REMINDER_DEFAULTS.hour,
        REMINDER_DEFAULTS.minute,
      );
      if (ok) {
        snackbar.success(
          'Recordatorio activado',
          `Te avisaremos cada día a las ${String(REMINDER_DEFAULTS.hour).padStart(2, '0')}:${String(REMINDER_DEFAULTS.minute).padStart(2, '0')}.`,
        );
      }
    } else {
      await cancelStreakReminder();
      await setItem(StorageKeys.PUSH_REMINDER_TIME, null);
      snackbar.success('Recordatorio desactivado', 'Ya no recibirás avisos diarios.');
    }
  };

  const handleSoundChange = (next: boolean) => {
    setSound(next);
    void setFeedbackPrefs({ sound: next });
    if (next) feedback('correct');
  };

  const handleHapticsChange = (next: boolean) => {
    setHaptics(next);
    void setFeedbackPrefs({ haptics: next });
    if (next) feedback('select');
  };

  const displayName = user?.name ?? 'Sin sesión';
  const accountId = user?.id ?? '—';

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AccountIdentity
          name={displayName}
          accountId={accountId}
          email={user?.email}
          onEdit={onEditProfile}
        />

        <View style={styles.bento}>
          <PreferenceCard
            icon="notifications-active"
            iconColor={colors.tertiaryBright}
            iconBg={`${colors.tertiaryBright}1A`}
            title="Alerts"
            description="Mantente al tanto de eventos de arena."
            switchLabel="Notificaciones Push"
            value={notifications}
            onValueChange={handleNotificationsChange}
            trackColor={colors.tertiaryBright}
          />
          <PreferenceCard
            icon="dark-mode"
            iconColor={colors.primaryAccent}
            iconBg={`${colors.primaryAccent}1A`}
            title="Interfaz"
            description="Optimizada para enfoque en bajo brillo."
            switchLabel="Modo Oscuro"
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={colors.primaryAccent}
          />
          <DualPreferenceCard
            icon="graphic-eq"
            iconColor={colors.tertiaryBright}
            iconBg={`${colors.tertiaryBright}1A`}
            title="Audio y vibración"
            description="Feedback al acertar, fallar y completar lecciones."
            trackColor={colors.tertiaryBright}
            rows={[
              {
                label: 'Efectos de sonido',
                value: sound,
                onValueChange: handleSoundChange,
              },
              {
                label: 'Vibración (haptics)',
                value: haptics,
                onValueChange: handleHapticsChange,
              },
            ]}
          />
          <DangerZone onLogout={onLogout} />
        </View>

        <SystemCard />
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
          <Pressable onPress={onBack} hitSlop={10} style={styles.headerIconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primaryAccent} />
          </Pressable>
          <Text style={styles.headerTitle}>Level Loop</Text>
          <Pressable onPress={onBack} hitSlop={10} style={styles.headerIconBtn}>
            <MaterialIcons name="account-circle" size={26} color={colors.primaryAccent} />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

function AccountIdentity({
  name,
  accountId,
  email,
  onEdit,
}: {
  name: string;
  accountId: string;
  email?: string;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Identidad de Cuenta</Text>
      <BlurView intensity={30} tint="dark" style={[styles.card, styles.identityCard]}>
        <View style={styles.identityAvatarWrap}>
          <View style={styles.identityAvatarBorder}>
            <Avatar name={name} size={88} />
          </View>
          <Pressable
            style={styles.editBtn}
            hitSlop={6}
            onPress={onEdit}
          >
            <MaterialIcons name="edit" size={16} color={colors.background} />
          </Pressable>
        </View>

        <View style={styles.identityFields}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <Text style={styles.fieldStatic} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldStatic} numberOfLines={1}>
              {email ?? '—'}
            </Text>
          </View>

          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [
              styles.identityEditCta,
              pressed && styles.identityEditCtaPressed,
            ]}
          >
            <MaterialIcons name="edit" size={16} color={colors.tertiaryBright} />
            <Text style={styles.identityEditCtaText}>Editar perfil</Text>
          </Pressable>
        </View>
      </BlurView>
      <Text style={styles.accountIdText}>ID: {accountId}</Text>
    </View>
  );
}

function PreferenceCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  switchLabel,
  value,
  onValueChange,
  trackColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  switchLabel: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  trackColor: string;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.bentoCard]}>
      <View style={styles.bentoHeader}>
        <View style={[styles.bentoIconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.bentoHeaderText}>
          <Text style={styles.bentoTitle}>{title}</Text>
          <Text style={styles.bentoDescription}>{description}</Text>
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{switchLabel}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: colors.surfaceVariant,
            true: trackColor,
          }}
          thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
          ios_backgroundColor={colors.surfaceVariant}
        />
      </View>
    </BlurView>
  );
}

function DualPreferenceCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  rows,
  trackColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  trackColor: string;
  rows: {
    label: string;
    value: boolean;
    onValueChange: (next: boolean) => void;
  }[];
}) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.bentoCard]}>
      <View style={styles.bentoHeader}>
        <View style={[styles.bentoIconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.bentoHeaderText}>
          <Text style={styles.bentoTitle}>{title}</Text>
          <Text style={styles.bentoDescription}>{description}</Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        {rows.map((row) => (
          <View key={row.label} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{row.label}</Text>
            <Switch
              value={row.value}
              onValueChange={row.onValueChange}
              trackColor={{
                false: colors.surfaceVariant,
                true: trackColor,
              }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              ios_backgroundColor={colors.surfaceVariant}
            />
          </View>
        ))}
      </View>
    </BlurView>
  );
}

function DangerZone({ onLogout }: { onLogout: () => void }) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.bentoCard, styles.dangerCard]}>
      <View style={styles.bentoHeader}>
        <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255, 180, 171, 0.12)' }]}>
          <MaterialIcons name="logout" size={22} color="#ffb4ab" />
        </View>
        <View style={styles.bentoHeaderText}>
          <Text style={[styles.bentoTitle, styles.dangerTitle]}>Sesión</Text>
          <Text style={styles.bentoDescription}>Finaliza la sesión actual.</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && styles.logoutBtnPressed,
        ]}
        onPress={onLogout}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </BlurView>
  );
}

function SystemCard() {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.systemCard]}>
      <View style={styles.systemContent}>
        <Text style={styles.systemTag}>Versión del Sistema</Text>
        <Text style={styles.systemVersion}>v2.0.26-ALPHA</Text>
        <View style={styles.systemStatusRow}>
          <View style={styles.systemDot} />
          <Text style={styles.systemStatus}>Todos los loops sincronizados</Text>
        </View>
      </View>
      <View style={styles.systemDecor} pointerEvents="none">
        <MaterialIcons name="loop" size={170} color={colors.primaryAccent} />
      </View>
    </BlurView>
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
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.primaryAccent,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: spacing.margin,
    gap: spacing.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.primaryAccent,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(80, 21, 189, 0.18)',
    overflow: 'hidden',
  },
  identityCard: {
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  identityAvatarWrap: {
    position: 'relative',
  },
  identityAvatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.tertiaryBright,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  identityFields: {
    flex: 1,
    gap: spacing.sm,
  },
  fieldRow: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}4D`,
    paddingVertical: 6,
  },
  identityEditCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: 10,
    backgroundColor: `${colors.tertiaryBright}1A`,
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}40`,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  identityEditCtaPressed: {
    opacity: 0.85,
  },
  identityEditCtaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.tertiaryBright,
    letterSpacing: 0.5,
  },
  accountIdText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.outline,
    paddingHorizontal: spacing.xs,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 17,
    color: colors.onSurface,
    paddingVertical: 4,
    outlineStyle: 'none' as never,
  },
  fieldStatic: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 4,
  },
  bento: {
    gap: spacing.md,
  },
  bentoCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bentoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoHeaderText: {
    flex: 1,
  },
  bentoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    lineHeight: 22,
  },
  bentoDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 17,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(28, 25, 46, 0.6)',
  },
  switchLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
    letterSpacing: 0.4,
  },
  dangerCard: {
    borderColor: 'rgba(255, 180, 171, 0.2)',
  },
  dangerTitle: {
    color: '#ffb4ab',
  },
  logoutBtn: {
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    alignItems: 'center',
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(255, 180, 171, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffb4ab',
    letterSpacing: 0.5,
  },
  systemCard: {
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  systemContent: {
    zIndex: 10,
    gap: spacing.xs,
  },
  systemTag: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.tertiaryBright,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  systemVersion: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: colors.onSurface,
  },
  systemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  systemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  systemStatus: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  systemDecor: {
    position: 'absolute',
    right: -30,
    top: -30,
    opacity: 0.1,
    transform: [{ rotate: '12deg' }],
  },
});
