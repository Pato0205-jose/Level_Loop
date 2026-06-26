import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthTextField } from '../components/AuthTextField';
import { GlassPanel } from '../components/GlassPanel';
import { colors, spacing } from '../constants/theme';
import { useBackendReachable } from '../hooks/useBackendReachable';
import {
  requestRegisterCode,
  verifyRegisterCode,
  type PublicUser,
} from '../services/auth';
import { ensureApiReady } from '../config/backend';

type Step = 'form' | 'code';

type Props = {
  onSignIn?: () => void;
  onBack?: () => void;
  onSubmit?: (user: PublicUser) => void;
};

export function RegisterScreen({ onSignIn, onBack, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('form');
  const [pilotName, setPilotName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { status: backendStatus, message: backendMessage, recheck } = useBackendReachable();

  const handleSendCode = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await ensureApiReady();
      const result = await requestRegisterCode({
        name: pilotName,
        email,
        password,
      });
      if (!result.ok) {
        setError(result.error ?? 'No se pudo enviar el código.');
        return;
      }
      setDevCodeHint(result.devCode ?? null);
      setStep('code');
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await ensureApiReady();
      const result = await verifyRegisterCode({ email, code });
      if (result.error || !result.user) {
        setError(result.error ?? 'No se pudo crear la cuenta.');
        return;
      }
      if (onSubmit) {
        await onSubmit(result.user);
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleResendCode = async () => {
    setCode('');
    await handleSendCode();
  };

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.particleBg}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
        <ImageBackground
          source={require('../../assets/images/splash.png')}
          style={styles.mesh}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          ) : null}

          <View style={styles.branding}>
            <View style={styles.logoGlow} />
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="cover"
            />
            <Text style={styles.title}>
              {step === 'form' ? 'Crea tu cuenta' : 'Código de acceso'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'form'
                ? 'Completa tus datos para continuar'
                : 'Ingresa el código de acceso enviado a tu correo'}
            </Text>
          </View>

          <GlassPanel
            intensity={48}
            tint="dark"
            style={styles.panel}
            androidBackgroundColor="rgba(80, 21, 189, 0.92)"
          >
            <View style={styles.panelAccent} />
            <View style={styles.panelInner}>
              {step === 'form' && (
              <View style={styles.form}>
                {backendStatus === 'fail' && backendMessage ? (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="cloud-off" size={18} color="#ffb4ab" />
                    <Text style={styles.errorText}>{backendMessage}</Text>
                    <Pressable onPress={() => void recheck()} hitSlop={8}>
                      <MaterialIcons name="refresh" size={20} color={colors.tertiaryBright} />
                    </Pressable>
                  </View>
                ) : null}

                <AuthTextField
                  variant="register"
                  label="Nombre de Piloto"
                  icon="person"
                  placeholder="Ej. ZeroOne"
                  value={pilotName}
                  onChangeText={(v) => {
                    setPilotName(v);
                    if (error) setError(null);
                  }}
                  autoCapitalize="words"
                />
                <AuthTextField
                  variant="register"
                  label="Email de Cadete"
                  icon="alternate-email"
                  placeholder="cadete@levelloop.io"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <AuthTextField
                  variant="register"
                  label="Contraseña"
                  icon="lock"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setError(null);
                  }}
                  secureTextEntry
                />

                {error && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={18} color="#ffb4ab" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.submitWrap,
                    pressed && styles.btnPressed,
                    busy && styles.btnDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={busy}
                >
                  <LinearGradient
                    colors={[colors.secondary, colors.secondaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitTextCompact}>
                      {busy ? 'Enviando...' : 'Enviar código'}
                    </Text>
                    {!busy && (
                      <MaterialIcons
                        name="send"
                        size={22}
                        color={colors.onPrimary}
                      />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
              )}

              {step === 'code' && (
              <View style={styles.form}>
                <Text style={styles.codeHint}>
                  Revisa tu correo ({email.trim().toLowerCase()}) e ingresa el código de acceso de 6 dígitos.
                </Text>

                {devCodeHint ? (
                  <View style={styles.devCodeBox}>
                    <MaterialIcons name="developer-mode" size={18} color={colors.tertiaryBright} />
                    <Text style={styles.devCodeText}>
                      Modo desarrollo — código: {devCodeHint}
                    </Text>
                  </View>
                ) : null}

                <AuthTextField
                  variant="register"
                  label="Código de acceso"
                  icon="vpn-key"
                  placeholder="123456"
                  value={code}
                  onChangeText={(v) => {
                    setCode(v.replace(/\D/g, '').slice(0, 6));
                    if (error) setError(null);
                  }}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {error && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={18} color="#ffb4ab" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.submitWrap,
                    pressed && styles.btnPressed,
                    busy && styles.btnDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={busy}
                >
                  <LinearGradient
                    colors={[colors.secondary, colors.secondaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitText}>
                      {busy ? 'Verificando...' : 'Crear cuenta'}
                    </Text>
                    {!busy && (
                      <MaterialIcons
                        name="rocket-launch"
                        size={22}
                        color={colors.onPrimary}
                      />
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable onPress={() => void handleResendCode()} disabled={busy}>
                  <Text style={styles.footerLink}>Reenviar código</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setStep('form');
                    setCode('');
                    setError(null);
                  }}
                >
                  <Text style={styles.footerLink}>← Volver al formulario</Text>
                </Pressable>
              </View>
              )}

              {step === 'form' && (
              <Text style={styles.footer}>
                ¿Ya tienes una cuenta?{' '}
                <Text style={styles.footerLink} onPress={onSignIn}>
                  Iniciar sesión
                </Text>
              </Text>
              )}
            </View>
          </GlassPanel>

          <View style={styles.decor}>
            <View style={styles.decorLine} />
            <View style={styles.decorDots}>
              <View style={[styles.dot, styles.dotTertiary]} />
              <View style={[styles.dot, styles.dotPrimary]} />
              <View style={[styles.dot, styles.dotTertiary]} />
            </View>
            <View style={styles.decorLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  particleBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
  },
  orbTop: {
    position: 'absolute',
    top: -160,
    left: -80,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.primaryContainer,
    opacity: 0.4,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: `${colors.tertiaryBright}33`,
    opacity: 0.4,
  },
  mesh: {
    ...StyleSheet.absoluteFill,
    opacity: 0.1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.margin,
    alignItems: 'center',
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  branding: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  logoGlow: {
    position: 'absolute',
    top: 8,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: `${colors.tertiary}40`,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    lineHeight: 38,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 29,
    color: `${colors.onSurfaceVariant}CC`,
    textAlign: 'center',
  },
  panel: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.outline}33`,
    backgroundColor: 'rgba(80, 21, 189, 0.15)',
  },
  panelAccent: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: `${colors.tertiaryBright}0D`,
  },
  panelInner: {
    padding: spacing.md,
    gap: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  codeHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  devCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(155, 208, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(155, 208, 255, 0.35)',
  },
  devCodeText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.tertiaryBright,
    lineHeight: 18,
  },
  submitWrap: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#ffffff',
  },
  submitTextCompact: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.sm,
    borderRadius: 10,
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
    textAlign: 'center',
    paddingTop: spacing.base,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_700Bold',
  },
  decor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    opacity: 0.4,
    alignSelf: 'center',
  },
  decorLine: {
    width: 48,
    height: 1,
    backgroundColor: colors.outline,
  },
  decorDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotTertiary: {
    backgroundColor: colors.tertiaryBright,
  },
  dotPrimary: {
    backgroundColor: colors.primaryAccent,
  },
});
