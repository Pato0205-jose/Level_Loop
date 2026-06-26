import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { androidTextInputProps } from '../components/GlassPanel';
import { colors, spacing } from '../constants/theme';
import {
  updateCurrentUser,
  validateName,
  type PublicUser,
} from '../services/auth';

type Props = {
  user: PublicUser;
  onBack: () => void;
  onSaved: (user: PublicUser) => void;
};

const GOAL_OPTIONS = [5, 10, 20, 30];
const BIO_MAX = 160;

export function ProfileEditorScreen({ user, onBack, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [dailyGoalMin, setDailyGoalMin] = useState(user.dailyGoalMin);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const handleSave = async () => {
    if (busy) return;
    const nameErr = validateName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    if (bio.length > BIO_MAX) {
      setError(`La bio no puede pasar de ${BIO_MAX} caracteres.`);
      return;
    }
    setError(null);
    setBusy(true);
    const updated = await updateCurrentUser({
      name: name.trim(),
      bio: bio.trim(),
      dailyGoalMin,
    });
    setBusy(false);
    if (!updated) {
      setError('No se pudo guardar el perfil.');
      return;
    }
    onSaved(updated);
  };

  const headerHeight = 64;
  const dirty =
    name.trim() !== user.name ||
    bio.trim() !== (user.bio ?? '') ||
    dailyGoalMin !== user.dailyGoalMin;

  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + headerHeight + spacing.md,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <Avatar name={name || 'A'} size={104} />
            </View>
            <Pressable style={styles.avatarEditBtn} hitSlop={6}>
              <MaterialIcons name="edit" size={16} color="#ffffff" />
            </Pressable>
          </View>
          <Text style={styles.avatarHelp}>
            El avatar se genera con tus iniciales.{'\n'}Subir foto pronto.
          </Text>

          <Section title="Identidad">
            <Field
              label="Nombre"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError(null);
              }}
              placeholder="Cómo quieres que te llamen"
              icon="person"
            />
            <Field
              label="Email"
              value={user.email}
              icon="alternate-email"
              editable={false}
              helper="El email no se puede modificar."
            />
          </Section>

          <Section title="Sobre ti">
            <BioField
              value={bio}
              onChangeText={(v) => {
                if (v.length <= BIO_MAX) {
                  setBio(v);
                  if (error) setError(null);
                }
              }}
            />
          </Section>

          <Section title="Meta diaria">
            <Text style={styles.sectionHelper}>
              Cuántos minutos quieres dedicar a Level Loop cada día.
            </Text>
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((min) => {
                const active = min === dailyGoalMin;
                return (
                  <Pressable
                    key={min}
                    onPress={() => setDailyGoalMin(min)}
                    style={({ pressed }) => [
                      styles.goalChip,
                      active && styles.goalChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.goalChipValue,
                        active && styles.goalChipValueActive,
                      ]}
                    >
                      {min}
                    </Text>
                    <Text
                      style={[
                        styles.goalChipUnit,
                        active && styles.goalChipUnitActive,
                      ]}
                    >
                      min
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color="#ffb4ab" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <Pressable
            onPress={handleSave}
            disabled={!dirty || busy}
            style={({ pressed }) => [
              styles.cta,
              (!dirty || busy) && styles.ctaDisabled,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name={busy ? 'sync' : 'check'}
              size={22}
              color="#ffffff"
            />
            <Text style={styles.ctaText}>
              {busy ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + headerHeight },
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
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <View style={{ width: 26 }} />
        </View>
      </BlurView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  editable = true,
  helper,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  editable?: boolean;
  helper?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          focused && styles.fieldBoxFocused,
          !editable && styles.fieldBoxDisabled,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={20}
          color={focused ? colors.tertiaryBright : colors.outline}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={`${colors.outline}80`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
          autoCapitalize="words"
          autoCorrect={false}
          {...androidTextInputProps}
        />
      </View>
      {helper && <Text style={styles.fieldHelper}>{helper}</Text>}
    </View>
  );
}

function BioField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.bioHeader}>
        <Text style={styles.fieldLabel}>Bio</Text>
        <Text style={styles.bioCount}>
          {value.length} / {BIO_MAX}
        </Text>
      </View>
      <View
        style={[
          styles.fieldBox,
          styles.bioBox,
          focused && styles.fieldBoxFocused,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Cuéntale al mundo en pocas palabras qué te apasiona."
          placeholderTextColor={`${colors.outline}80`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.fieldInput, styles.bioInput]}
          multiline
          maxLength={BIO_MAX}
          {...androidTextInputProps}
        />
      </View>
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
    top: '15%',
    left: '15%',
    right: '15%',
    height: 260,
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
    gap: spacing.lg,
  },
  avatarWrap: {
    alignSelf: 'center',
    width: 112,
    height: 112,
    position: 'relative',
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: colors.tertiaryBright,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  avatarEditBtn: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHelp: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 17,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.tertiaryBright,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.base,
  },
  sectionHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.base,
    lineHeight: 18,
  },
  sectionBody: {
    gap: spacing.sm,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.base,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
  },
  fieldBoxFocused: {
    borderColor: `${colors.tertiaryBright}80`,
  },
  fieldBoxDisabled: {
    opacity: 0.6,
  },
  fieldInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 4,
    outlineStyle: 'none' as never,
  },
  fieldHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.outline,
    paddingHorizontal: spacing.base,
    marginTop: 2,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  bioCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
  },
  bioBox: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  bioInput: {
    minHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'top',
  },
  goalGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  goalChip: {
    flex: 1,
    aspectRatio: 1.1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(207, 189, 255, 0.15)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  goalChipActive: {
    borderColor: colors.tertiaryBright,
    backgroundColor: `${colors.tertiaryBright}1F`,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  goalChipValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
  },
  goalChipValueActive: {
    color: colors.tertiaryBright,
  },
  goalChipUnit: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  goalChipUnitActive: {
    color: colors.tertiaryBright,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 180, 171, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
  },
  errorText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#ffd2cc',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: `${colors.background}E6`,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207, 189, 255, 0.05)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
