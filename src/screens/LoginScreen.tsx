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
  requestLoginCode,
  verifyLoginCode,
  type PublicUser,
} from '../services/auth';
import { ensureApiReady } from '../config/backend';

type Step = 'credentials' | 'code';

type Props = {
  onRegister?: () => void;
  onBack?: () => void;
  onSubmit?: (user: PublicUser) => void;
  onForgotPassword?: () => void;
};

export function LoginScreen({
  onRegister,
  onBack,
  onSubmit,
  onForgotPassword,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('credentials');
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
      const result = await requestLoginCode({ email, password });
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
      const result = await verifyLoginCode({ email, code });
      if (result.error || !result.user) {
        setError(result.error ?? 'No se pudo iniciar sesión.');
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
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.mesh}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(61, 10, 73, 0.8)', colors.surfaceContainerLowest, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg },
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

          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <GlassPanel intensity={50} tint="dark" style={styles.panel}>
            <View style={styles.panelInner}>
              {step === 'credentials' && (
                <>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Bienvenido de nuevo</Text>
                <Text style={styles.panelSubtitle}>
                  Ingresa tu correo y contraseña. Te enviaremos un código de acceso.
                </Text>
              </View>

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

                <Pressable style={styles.forgotLink} onPress={onForgotPassword}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                {error && (
                  <View style={styles.errorBox}>
                    <MaterialIcons name="error-outline" size={18} color="#ffb4ab" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.submitBtn,
                    pressed && styles.btnPressed,
                    busy && styles.btnDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={busy}
                >
                  <Text style={styles.submitTextCompact}>
                    {busy ? 'Enviando...' : 'Enviar código'}
                  </Text>
                  {!busy && (
                    <MaterialIcons
                      name="send"
                      size={22}
                      color={colors.onSecondaryFixed}
                    />
                  )}
                </Pressable>
              </View>
                </>
              )}

              {step === 'code' && (
                <>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Código de acceso</Text>
                <Text style={styles.panelSubtitle}>
                  Revisa tu bandeja ({email.trim().toLowerCase()}) e ingresa el código de 6 dígitos.
                </Text>
              </View>

              {devCodeHint ? (
                <View style={styles.devCodeBox}>
                  <MaterialIcons name="developer-mode" size={18} color={colors.tertiaryBright} />
                  <Text style={styles.devCodeText}>
                    Modo desarrollo — código: {devCodeHint}
                  </Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <AuthTextField
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
                    styles.submitBtn,
                    pressed && styles.btnPressed,
                    busy && styles.btnDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={busy}
                >
                  <Text style={styles.submitText}>
                    {busy ? 'Verificando...' : 'Iniciar sesión'}
                  </Text>
                  {!busy && (
                    <MaterialIcons
                      name="bolt"
                      size={22}
                      color={colors.onSecondaryFixed}
                    />
                  )}
                </Pressable>

                <Pressable
                  style={styles.forgotLink}
                  onPress={() => void handleResendCode()}
                  disabled={busy}
                >
                  <Text style={styles.forgotText}>Reenviar código</Text>
                </Pressable>

                <Pressable
                  style={styles.forgotLink}
                  onPress={() => {
                    setStep('credentials');
                    setCode('');
                    setError(null);
                  }}
                >
                  <Text style={styles.forgotText}>← Cambiar credenciales</Text>
                </Pressable>
              </View>
                </>
              )}
            </View>
          </GlassPanel>

          <Text style={styles.footer}>
            ¿No tienes una cuenta?{' '}
            <Text style={styles.footerLink} onPress={onRegister}>
              Regístrate
            </Text>
          </Text>
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
  mesh: {
    ...StyleSheet.absoluteFill,
    opacity: 0.4,
  },
  glowTop: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: `${colors.primaryAccent}33`,
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: `${colors.tertiaryBright}1A`,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.margin,
    alignItems: 'center',
    justifyContent: Platform.OS === 'android' ? 'flex-start' : 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 448,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.4)',
  },
  panelInner: {
    padding: spacing.lg,
  },
  panelHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  panelTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    lineHeight: 38,
    color: colors.primaryAccent,
    letterSpacing: -0.3,
  },
  panelSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    letterSpacing: 0.7,
    color: colors.onSurfaceVariant,
  },
  form: {
    gap: spacing.md,
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
    marginBottom: spacing.sm,
  },
  devCodeText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.tertiaryBright,
    lineHeight: 18,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.tertiaryBright,
  },
  submitBtn: {
    marginTop: spacing.sm,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 8,
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.onSecondaryFixed,
  },
  submitTextCompact: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSecondaryFixed,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
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
    marginTop: spacing.lg,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_600SemiBold',
  },
});
