import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';

export type MainTab = 'missions' | 'explore' | 'ranking' | 'profile';

const ITEMS: { id: MainTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'missions', label: 'Misiones', icon: 'assignment' },
  { id: 'explore', label: 'Explorar', icon: 'explore' },
  { id: 'ranking', label: 'Ranking', icon: 'leaderboard' },
  { id: 'profile', label: 'Perfil', icon: 'person' },
];

type Props = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
};

export function BottomNav({ activeTab, onTabChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={[styles.wrap, { paddingBottom: insets.bottom + 6 }]}
    >
      {ITEMS.map((item) => {
        const active = item.id === activeTab;
        return (
          <Pressable
            key={item.id}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onTabChange(item.id)}
          >
            <MaterialIcons
              name={item.icon}
              size={24}
              color={active ? colors.onSurface : `${colors.onSurfaceVariant}99`}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${colors.outlineVariant}1A`,
    backgroundColor: 'rgba(14, 11, 32, 0.85)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 2,
  },
  itemActive: {
    backgroundColor: `${colors.secondaryContainer}CC`,
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    letterSpacing: 0.4,
    color: `${colors.onSurfaceVariant}99`,
  },
  labelActive: {
    color: colors.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export const bottomNavHeight = 76;
