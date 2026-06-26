import { BlurView, type BlurViewProps } from 'expo-blur';
import { Platform, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  intensity?: number;
  tint?: BlurViewProps['tint'];
  androidBackgroundColor?: string;
  children: React.ReactNode;
};

/**
 * En Android, BlurView dentro de formularios puede bloquear el foco del TextInput
 * (teclado no aparece / vibración repetida). Usamos fondo sólido semitransparente.
 */
export function GlassPanel({
  intensity = 40,
  tint = 'dark',
  androidBackgroundColor = 'rgba(32, 29, 50, 0.94)',
  style,
  children,
  ...rest
}: Props) {
  if (Platform.OS === 'android') {
    return (
      <View style={[style, { backgroundColor: androidBackgroundColor }]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...rest}>
      {children}
    </BlurView>
  );
}

export const androidTextInputProps = Platform.select({
  android: {
    textAlignVertical: 'center' as const,
    underlineColorAndroid: 'transparent',
    importantForAutofill: 'yes' as const,
  },
  default: {},
});
