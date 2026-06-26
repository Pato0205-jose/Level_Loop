import { Component, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: ReactNode;
  /** Si true (solo dev), muestra stack y mensaje técnico. */
  showDetails?: boolean;
  /** Override para el handler de reintentar. */
  onRetry?: () => void;
};

type State = {
  error: Error | null;
};

const isDev = typeof __DEV__ !== 'undefined' && !!__DEV__;

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error.message);
    if (isDev) {
      console.error(error.stack);
      if (info.componentStack) console.error(info.componentStack);
    }
  }

  private handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
      this.setState({ error: null });
      return;
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const details = this.props.showDetails ?? isDev;

    return (
      <View style={styles.root}>
        <LinearGradient
          colors={['#1a0c1c', '#2a1335', '#0d0a1a']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="sentiment-dissatisfied" size={56} color="#ffb4ab" />
          </View>
          <Text style={styles.title}>¡Vaya! Algo salió mal</Text>
          <Text style={styles.subtitle}>
            Tu progreso está a salvo. Vuelve a intentarlo y, si el problema
            continúa, reinicia la app.
          </Text>

          <Pressable
            onPress={this.handleRetry}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <MaterialIcons name="refresh" size={20} color="#1a0c1c" />
            <Text style={styles.ctaLabel}>Reintentar</Text>
          </Pressable>

          {details && (
            <View style={styles.devBox}>
              <Text style={styles.devLabel}>Detalles técnicos (solo dev)</Text>
              <Text style={styles.devMessage}>{error.message}</Text>
              {error.stack && (
                <Text style={styles.devStack}>{error.stack}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0c1c' },
  scroll: {
    padding: 24,
    paddingTop: 96,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,180,171,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 360,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#cfbdff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    color: '#1a0c1c',
    fontSize: 16,
    fontWeight: '700',
  },
  devBox: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: 600,
  },
  devLabel: {
    color: '#ffb4ab',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  devMessage: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'monospace' as never,
  },
  devStack: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'monospace' as never,
  },
});
