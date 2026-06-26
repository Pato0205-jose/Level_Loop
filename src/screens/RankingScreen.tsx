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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { BottomNav, bottomNavHeight, type MainTab } from '../components/BottomNav';
import { colors, spacing } from '../constants/theme';
import type { PublicUser } from '../services/auth';
import {
  fetchLeaderboard,
  type LeaderboardScope,
  type LeaderEntry,
  type LeaderboardData,
} from '../services/leaderboard';
import type { UserProgress } from '../services/progress';

type Props = {
  user?: PublicUser | null;
  progress?: UserProgress | null;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSettings?: () => void;
};

const HEADER_HEIGHT = 80;

const SCOPE_TABS: { id: LeaderboardScope; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'weekly', label: 'Semanal', icon: 'event' },
  { id: 'global', label: 'Global', icon: 'public' },
  { id: 'friends', label: 'Amigos', icon: 'group' },
];

function formatXp(value: number): string {
  return value.toLocaleString('es-MX');
}

export function RankingScreen({
  user,
  progress,
  activeTab,
  onTabChange,
  onOpenSettings,
}: Props) {
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<LeaderboardScope>('weekly');
  const [data, setData] = useState<LeaderboardData | null>(null);

  const userName = user?.name?.trim() || 'Tú';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await fetchLeaderboard(scope, userName, progress);
      if (!cancelled) {
        setData(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, userName, progress]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded || !data) {
    return <View style={styles.root} />;
  }

  const floatingCardHeight = 84;
  const reservedBottom = insets.bottom + bottomNavHeight + floatingCardHeight + spacing.md;

  return (
    <View style={styles.root}>
      <View style={styles.ambient} pointerEvents="none">
        <View style={styles.ambientA} />
        <View style={styles.ambientB} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.sm,
            paddingBottom: reservedBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScopeTabs current={scope} onChange={setScope} />
        {data.weeklyResetLabel && (
          <View style={styles.weeklyBanner}>
            <MaterialIcons name="schedule" size={16} color={colors.tertiaryBright} />
            <Text style={styles.weeklyBannerText}>{data.weeklyResetLabel}</Text>
          </View>
        )}
        <PodiumSection
          top3={data.top3}
          scope={scope}
        />
        <LeaderboardSection rows={data.rows} scope={scope} />
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
          <View style={styles.headerLeft}>
            <Avatar
              name={userName}
              size={40}
              borderColor={colors.tertiaryBright}
              borderWidth={2}
              glow
            />
            <View>
              <Text style={styles.brand}>Level Loop</Text>
              <Text style={styles.brandSubtitle}>
                {scope === 'weekly'
                  ? 'Ranking semanal'
                  : scope === 'global'
                    ? 'Ranking global'
                    : 'Ranking de amigos'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerStats}>
              <Text style={styles.headerXp}>
                {formatXp(data.you.totalXp)} XP
              </Text>
              <Text style={styles.headerLevel}>LVL {data.you.level}</Text>
            </View>
            <Pressable style={styles.settingsBtn} hitSlop={8} onPress={onOpenSettings}>
              <MaterialIcons name="settings" size={22} color={colors.primaryAccent} />
            </Pressable>
          </View>
        </View>
      </BlurView>

      <View
        style={[
          styles.floatingCardWrap,
          { bottom: insets.bottom + bottomNavHeight + 8 },
        ]}
        pointerEvents="box-none"
      >
        <CurrentUserCard you={data.you} scope={scope} />
      </View>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </View>
  );
}

function ScopeTabs({
  current,
  onChange,
}: {
  current: LeaderboardScope;
  onChange: (s: LeaderboardScope) => void;
}) {
  return (
    <View style={styles.tabsRow}>
      {SCOPE_TABS.map((tab) => {
        const active = current === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.tabBtn,
              active && styles.tabBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name={tab.icon}
              size={16}
              color={active ? '#001f28' : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.tabBtnText,
                active && styles.tabBtnTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PodiumSection({
  top3,
  scope,
}: {
  top3: LeaderEntry[];
  scope: LeaderboardScope;
}) {
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  if (!rank1 || !rank2 || !rank3) return null;

  return (
    <View style={styles.podium}>
      <PodiumItem player={rank2} variant="side" scope={scope} />
      <PodiumItem player={rank1} variant="center" scope={scope} />
      <PodiumItem player={rank3} variant="side" scope={scope} />
    </View>
  );
}

function PodiumItem({
  player,
  variant,
  scope,
}: {
  player: LeaderEntry;
  variant: 'side' | 'center';
  scope: LeaderboardScope;
}) {
  const isCenter = variant === 'center';
  const size = isCenter ? 84 : 64;
  const badgeColor = isCenter ? colors.tertiaryBright : colors.secondary;
  const badgeTextColor = isCenter ? '#003544' : colors.onSurface;
  const xpToShow = scope === 'weekly' ? player.weeklyXp : player.totalXp;

  return (
    <View style={[styles.podiumItem, isCenter && styles.podiumCenter]}>
      {isCenter ? (
        <MaterialIcons
          name="workspace-premium"
          size={26}
          color={colors.tertiaryBright}
          style={styles.crown}
        />
      ) : null}
      <View style={styles.podiumAvatarWrap}>
        <Avatar
          name={player.name}
          size={size}
          borderColor={isCenter ? colors.tertiaryBright : `${colors.outlineVariant}80`}
          borderWidth={isCenter ? 2 : 1}
          glow={isCenter}
        />
        {player.isYou && (
          <View style={styles.youDot}>
            <Text style={styles.youDotText}>TÚ</Text>
          </View>
        )}
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: badgeColor,
              width: isCenter ? 30 : 24,
              height: isCenter ? 30 : 24,
              borderRadius: isCenter ? 15 : 12,
              bottom: isCenter ? -10 : -6,
              right: isCenter ? undefined : -4,
              left: isCenter ? '50%' : undefined,
              marginLeft: isCenter ? -15 : 0,
            },
            isCenter && styles.rankBadgeCenter,
          ]}
        >
          <Text
            style={[
              styles.rankBadgeText,
              { color: badgeTextColor, fontSize: isCenter ? 14 : 11 },
            ]}
          >
            {player.rank}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.podiumName, isCenter && styles.podiumNameCenter]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      <Text style={[styles.podiumXp, isCenter && styles.podiumXpCenter]}>
        {formatXp(xpToShow)} XP
      </Text>
    </View>
  );
}

function LeaderboardSection({
  rows,
  scope,
}: {
  rows: LeaderEntry[];
  scope: LeaderboardScope;
}) {
  const visible = rows.slice(3, 20);
  return (
    <View style={styles.leaderboard}>
      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderText, styles.colRank]}>Rango</Text>
        <Text style={[styles.listHeaderText, styles.colUser]}>Usuario</Text>
        <Text style={[styles.listHeaderText, styles.colXp]}>XP</Text>
      </View>
      <View style={styles.listBody}>
        {visible.map((row) => (
          <LeaderboardRow key={row.id} row={row} scope={scope} />
        ))}
        {!visible.some((r) => r.isYou) && (
          <YouOutOfRange row={rows.find((r) => r.isYou)!} scope={scope} />
        )}
      </View>
    </View>
  );
}

function LeaderboardRow({
  row,
  scope,
}: {
  row: LeaderEntry;
  scope: LeaderboardScope;
}) {
  const xp = scope === 'weekly' ? row.weeklyXp : row.totalXp;
  return (
    <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
      <BlurView
        intensity={30}
        tint="dark"
        style={[styles.row, row.isYou && styles.rowYou]}
      >
        <Text
          style={[
            styles.rowRank,
            styles.colRank,
            row.isYou && styles.rowRankYou,
          ]}
        >
          {row.rank.toString().padStart(2, '0')}
        </Text>
        <View style={styles.rowUser}>
          <Avatar
            name={row.name}
            size={40}
            borderWidth={row.isYou ? 2 : 1}
            borderColor={row.isYou ? colors.tertiaryBright : undefined}
            glow={row.isYou}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.rowNameRow}>
              <Text style={styles.rowName} numberOfLines={1}>
                {row.name}
              </Text>
              {row.isYou && (
                <View style={styles.youInlineBadge}>
                  <Text style={styles.youInlineBadgeText}>TÚ</Text>
                </View>
              )}
            </View>
            <Text style={styles.rowLevel}>LVL {row.level}</Text>
          </View>
        </View>
        <Text style={[styles.rowXp, styles.colXp]}>{formatXp(xp)}</Text>
      </BlurView>
    </Pressable>
  );
}

function YouOutOfRange({
  row,
  scope,
}: {
  row: LeaderEntry;
  scope: LeaderboardScope;
}) {
  if (!row) return null;
  return (
    <>
      <View style={styles.dotsRow}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <LeaderboardRow row={row} scope={scope} />
    </>
  );
}

function CurrentUserCard({
  you,
  scope,
}: {
  you: LeaderEntry;
  scope: LeaderboardScope;
}) {
  const xp = scope === 'weekly' ? you.weeklyXp : you.totalXp;
  return (
    <BlurView intensity={40} tint="dark" style={styles.userCard}>
      <Text style={styles.userRank}>{you.rank}</Text>
      <View style={styles.userCardBody}>
        <View style={styles.userAvatarWrap}>
          <Avatar
            name={you.name}
            size={48}
            borderColor={colors.tertiaryBright}
            borderWidth={2}
            glow
          />
          <View style={styles.checkBadge}>
            <MaterialIcons name="check" size={12} color={colors.background} />
          </View>
        </View>
        <View>
          <Text style={styles.userName}>{you.name}</Text>
          <Text style={styles.userTag}>Tú (Nivel {you.level})</Text>
        </View>
      </View>
      <View style={styles.userXpBlock}>
        <Text style={styles.userXp}>{formatXp(xp)}</Text>
        <Text style={styles.userXpLabel}>
          {scope === 'weekly' ? 'XP esta semana' : 'XP totales'}
        </Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  flex: {
    flex: 1,
  },
  ambient: {
    ...StyleSheet.absoluteFill,
  },
  ambientA: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: 'rgba(61, 10, 73, 0.55)',
  },
  ambientB: {
    position: 'absolute',
    top: -100,
    right: -60,
    width: 360,
    height: 360,
    borderRadius: 200,
    backgroundColor: 'rgba(80, 21, 189, 0.4)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(14, 11, 32, 0.85)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.margin,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.primaryAccent,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  brandSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.tertiaryBright,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  headerXp: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.tertiaryBright,
  },
  headerLevel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 54, 77, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32, 29, 50, 0.65)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}33`,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: colors.tertiaryBright,
  },
  tabBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  tabBtnTextActive: {
    color: '#001f28',
  },
  weeklyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}55`,
    backgroundColor: `${colors.tertiaryBright}1a`,
    alignSelf: 'flex-start',
  },
  weeklyBannerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.tertiaryBright,
    letterSpacing: 0.4,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
    height: 240,
    paddingBottom: spacing.md,
  },
  podiumItem: {
    width: 96,
    alignItems: 'center',
  },
  podiumCenter: {
    width: 112,
    transform: [{ translateY: -16 }],
  },
  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  crown: {
    marginBottom: 6,
    textShadowColor: colors.tertiaryBright,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rankBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  rankBadgeCenter: {
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  rankBadgeText: {
    fontFamily: 'Poppins_700Bold',
  },
  youDot: {
    position: 'absolute',
    top: -10,
    right: -10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.tertiaryBright,
    zIndex: 2,
  },
  youDotText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#001f28',
  },
  podiumName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
    textAlign: 'center',
    width: '100%',
  },
  podiumNameCenter: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  podiumXp: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  podiumXpCenter: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  leaderboard: {
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  listHeaderText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  listBody: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.08)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  rowYou: {
    borderColor: `${colors.tertiaryBright}88`,
    backgroundColor: 'rgba(81, 213, 255, 0.12)',
  },
  rowRank: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.secondary,
  },
  rowRankYou: {
    color: colors.tertiaryBright,
  },
  colRank: {
    width: 44,
  },
  colUser: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  rowUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  rowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: colors.onSurface,
    flexShrink: 1,
  },
  rowLevel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  youInlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.tertiaryBright,
  },
  youInlineBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#001f28',
  },
  colXp: {
    width: 80,
    textAlign: 'right',
  },
  rowXp: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  dotsRow: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.6,
  },
  floatingCardWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}33`,
    backgroundColor: 'rgba(80, 21, 189, 0.25)',
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  userRank: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.tertiaryBright,
    width: 40,
    textAlign: 'center',
  },
  userCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  userAvatarWrap: {
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.tertiaryBright,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  userName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: colors.onSurface,
  },
  userTag: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.tertiaryBright,
  },
  userXpBlock: {
    alignItems: 'flex-end',
  },
  userXp: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  userXpLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
