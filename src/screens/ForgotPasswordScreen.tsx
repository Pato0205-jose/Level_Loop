import {
  Poppins_400Regular,
  Poppins_500Medium,
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
import { requestPasswordReset, confirmPasswordReset } from '../services/auth';

type Step = 'email' | 'code' | 'done';

type Props = {
  onBack: () => void;
  onBackToLogin: () => void;
};

export function ForgotPasswordScreen({ onBack, onBackToLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSendCode = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo procesar la solicitud.');
      return;
    }
    setStep('code');
  };

  const handleConfirmReset = async () => {
    if (busy) return;
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    const result = await confirmPasswordReset({ email, code, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo restablecer la contraseña.');
      return;
    }
    setStep('done');
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.mesh}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(61, 10, 73, 0.8)',
          colors.surfaceContainerLowest,
          colors.background,
        ]}
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
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>

          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <GlassPanel intensity={50} tint="dark" style={styles.panel}>
            <View style={styles.panelInner}>
              {step === 'email' && (
                <>
                  <View style={styles.panelHeader}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons
                        name="lock-reset"
                        size={36}
                        color={colors.primaryAccent}
                      />
                    </View>
                    <Text style={styles.panelTitle}>Recuperar acceso</Text>
                    <Text style={styles.panelSubtitle}>
                      Ingresa el email de tu cuenta. Te enviaremos un código de
                      verificación de 6 dígitos.
                    </Text>
                  </View>

                  <View style={styles.form}>
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

                    {error && (
                      <View style={styles.errorBox}>
                        <MaterialIcons
                          name="error-outline"
                          size={18}
                          color="#ffb4ab"
                        />
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
                      <Text style={styles.submitText}>
                        {busy ? 'Enviando...' : 'Enviar código'}
                      </Text>
                      {!busy && (
                        <MaterialIcons
                          name="send"
                          size={20}
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
                    <View style={styles.iconCircle}>
                      <MaterialIcons
                        name="pin"
                        size={36}
                        color={colors.primaryAccent}
                      />
                    </View>
                    <Text style={styles.panelTitle}>Ingresa el código</Text>
                    <Text style={styles.panelSubtitle}>
                      Revisa tu correo ({email.trim().toLowerCase()}) e ingresa el
                      código de 6 dígitos junto con tu nueva contraseña.
                    </Text>
                  </View>

                  <View style={styles.form}>
                    <AuthTextField
                      label="Código de verificación"
                      icon="pin"
                      placeholder="123456"
                      value={code}
                      onChangeText={(v) => {
                        setCode(v.replace(/\D/g, '').slice(0, 6));
                        if (error) setError(null);
                      }}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={6}
                    />
                    <AuthTextField
                      label="Nueva contraseña"
                      icon="lock"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        if (error) setError(null);
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <AuthTextField
                      label="Confirmar contraseña"
                      icon="lock-outline"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChangeText={(v) => {
                        setConfirmPassword(v);
                        if (error) setError(null);
                      }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    {error && (
                      <View style={styles.errorBox}>
                        <MaterialIcons
                          name="error-outline"
                          size={18}
                          color="#ffb4ab"
                        />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <Pressable
                      style={({ pressed }) => [
                        styles.submitBtn,
                        pressed && styles.btnPressed,
                        busy && styles.btnDisabled,
                      ]}
                      onPress={handleConfirmReset}
                      disabled={busy}
                    >
                      <Text style={styles.submitText}>
                        {busy ? 'Guardando...' : 'Restablecer contraseña'}
                      </Text>
                      {!busy && (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={colors.onSecondaryFixed}
                        />
                      )}
                    </Pressable>

                    <Pressable
                      onPress={handleSendCode}
                      disabled={busy}
                      style={({ pressed }) => [styles.resendBtn, pressed && styles.btnPressed]}
                    >
                      <Text style={styles.resendText}>Reenviar código</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {step === 'done' && (
                <View style={styles.successBlock}>
                  <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                    <MaterialIcons
                      name="mark-email-read"
                      size={42}
                      color={colors.tertiaryBright}
                    />
                  </View>
                  <Text style={styles.panelTitle}>Contraseña actualizada</Text>
                  <Text style={styles.panelSubtitle}>
                    Tu contraseña se restableció correctamente. Ya puedes iniciar
                    sesión con tu nueva clave de acceso.
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.submitBtn,
                      styles.successBtn,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={onBackToLogin}
                  >
                    <Text style={styles.submitText}>Volver a iniciar sesión</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color={colors.onSecondaryFixed}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          </GlassPanel>

          {step === 'email' && (
            <Text style={styles.footer}>
              ¿Lo recordaste?{' '}
              <Text style={styles.footerLink} onPress={onBackToLogin}>
                Iniciar sesión
              </Text>
            </Text>
          )}
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
    width: 96,
    height: 96,
    marginBottom: spacing.md,
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
    gap: spacing.md,
  },
  panelHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.primaryAccent}66`,
    backgroundColor: `${colors.primaryAccent}1A`,
    marginBottom: spacing.sm,
  },
  iconCircleSuccess: {
    borderColor: `${colors.tertiaryBright}66`,
    backgroundColor: `${colors.tertiaryBright}1A`,
  },
  panelTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.onSurface,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  panelSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
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
  successBtn: {
    backgroundColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
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
  successBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.tertiaryBright,
  },
  footer: {
    marginTop: spacing.lg,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_600SemiBold',
  },
});
