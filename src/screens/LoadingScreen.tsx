import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, splashDurationMs } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Props = {
  onFinish: () => void;
};

export function LoadingScreen({ onFinish }: Props) {
  const hideSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Splash already hidden
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await hideSplash();
      await new Promise((resolve) => setTimeout(resolve, splashDurationMs));
      if (!cancelled) {
        onFinish();
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [hideSplash, onFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/splash.png')}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
