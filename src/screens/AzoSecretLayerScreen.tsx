import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Keyboard, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AzoSecretLayerScreenProps, RootStackParamList } from '../app/navigation';
import CollapsingTitleBar, { CollapsingBackTitle, useCollapsingTitle } from '../components/common/CollapsingTitleBar';
import ChunkyButton from '../components/common/ChunkyButton';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text, TextInput } from '../components/common/Text';
import SettingsGroup from '../components/settings/SettingsGroup';
import SettingsRow from '../components/settings/SettingsRow';
import { getPaywallReviewOfferings, PaywallPlacement } from '../services/paywall';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const SECRET_LAYER_PASSWORD = 'azo-review';
const TITLE = 'Azo’s Secret Layer';

type PaywallReview = NonNullable<RootStackParamList['ProPaywall']['review']>;
type ReviewOffering = Awaited<ReturnType<typeof getPaywallReviewOfferings>>[number];

const PAYWALL_VARIANTS: Array<{
  label: string;
  settings: Omit<PaywallReview, 'offeringIdentifier'>;
}> = [
  { label: 'Original offer', settings: {} },
  { label: 'Trial flow, stacked', settings: { paywallLayout: 'deck', planPicker: 'stacked', onlyPackageId: null } },
  { label: 'Plan selection, stacked', settings: { paywallLayout: 'deck', planPicker: 'stacked', onlyPackageId: null, initialStep: 'plan' } },
  { label: 'Plan selection, side by side', settings: { paywallLayout: 'deck', planPicker: 'side_by_side', onlyPackageId: null, initialStep: 'plan' } },
  { label: 'Long paywall', settings: { paywallLayout: 'long', onlyPackageId: null } },
  { label: 'Long paywall, cleaning', settings: { paywallLayout: 'long', cleaning: true, onlyPackageId: null } },
  { label: 'Long page and trial flow', settings: { paywallLayout: 'long_then_trial', onlyPackageId: null } },
  { label: 'First plan only', settings: { paywallLayout: 'deck', onlyPackageId: 'annual', initialStep: 'plan' } },
  { label: 'Short plan only', settings: { paywallLayout: 'deck', onlyPackageId: 'monthly', initialStep: 'plan' } },
];

export default function AzoSecretLayerScreen({ navigation }: AzoSecretLayerScreenProps) {
  const { scrollY, onScroll } = useCollapsingTitle();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlockedUserId, setUnlockedUserId] = useState<string | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<ReviewOffering | null>(null);
  const isUnlocked = userId != null && unlockedUserId === userId;
  const variants = PAYWALL_VARIANTS.filter(({ settings }) => (
    settings.onlyPackageId !== 'annual' || selectedOffering?.hasFirstPlan
  ) && (
    settings.onlyPackageId !== 'monthly' || selectedOffering?.hasShortPlan
  ));

  useEffect(() => {
    setUnlockedUserId(null);
    setSelectedOffering(null);
    setPassword('');
    setPasswordError(null);
  }, [userId]);

  const offerings = useQuery({
    queryKey: ['paywallReviewOfferings', userId],
    queryFn: getPaywallReviewOfferings,
    enabled: isUnlocked,
  });

  const unlock = () => {
    if (userId == null) return;
    if (password !== SECRET_LAYER_PASSWORD) {
      setPasswordError('That password did not work. Try again.');
      return;
    }
    setUnlockedUserId(userId);
    setPassword('');
    setPasswordError(null);
    Keyboard.dismiss();
  };

  const openPaywall = (settings: Omit<PaywallReview, 'offeringIdentifier'>) => {
    if (!isUnlocked || selectedOffering == null) return;
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.ProfileUpgrade,
      sourceScreen: 'AzoSecretLayer',
      sourceAction: 'review_paywall',
      review: { offeringIdentifier: selectedOffering.identifier, ...settings },
    });
  };

  return (
    <View style={styles.screen}>
      <Animated.FlatList
        data={isUnlocked && selectedOffering == null ? offerings.data ?? [] : []}
        keyExtractor={(offering) => offering.identifier}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <CollapsingBackTitle title={TITLE} style={{ paddingBottom: spacing.lg }} />
            <ScreenContent width="grouped" style={styles.section}>
              {!isUnlocked ? (
                <View style={styles.form}>
                  <TextInput
                    accessibilityLabel="Secret layer password"
                    placeholder="Password"
                    placeholderTextColor={colors.text.tertiary}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setPasswordError(null);
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={unlock}
                    style={styles.input}
                  />
                  {passwordError != null ? (
                    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{passwordError}</Text>
                  ) : null}
                  {userId == null ? <Text style={styles.body}>Sign in to continue.</Text> : null}
                  <ChunkyButton label="Unlock" onPress={unlock} disabled={userId == null || password.length === 0} />
                </View>
              ) : (
                <>
                  <SectionHeader title="Offers" />
                  {offerings.isPending ? <ActivityIndicator color={colors.primary.blue500} /> : null}
                  {offerings.isError ? (
                    <View style={styles.form}>
                      <Text accessibilityRole="alert" style={styles.error}>The offers could not load. Please try again.</Text>
                      <ChunkyButton label="Try again" onPress={() => { void offerings.refetch(); }} loading={offerings.isFetching} />
                    </View>
                  ) : null}
                  {offerings.isSuccess && offerings.data.length === 0 ? <Text style={styles.body}>No offers are available right now.</Text> : null}
                  {selectedOffering != null ? (
                    <>
                      <SettingsGroup>
                        <SettingsRow label="Choose another offer" onPress={() => setSelectedOffering(null)} isLast />
                      </SettingsGroup>
                      <Text style={styles.offerTitle}>{selectedOffering.title}</Text>
                      <SettingsGroup>
                        {variants.map((variant, index) => (
                          <SettingsRow
                            key={variant.label}
                            label={variant.label}
                            onPress={() => openPaywall(variant.settings)}
                            isLast={index === variants.length - 1}
                          />
                        ))}
                      </SettingsGroup>
                    </>
                  ) : null}
                </>
              )}
            </ScreenContent>
          </>
        }
        renderItem={({ item }) => (
          <ScreenContent width="grouped" style={styles.offeringRow}>
            <SettingsGroup>
              <SettingsRow label={item.title} onPress={() => setSelectedOffering(item)} isLast />
            </SettingsGroup>
            <Text style={styles.offerDetail}>{item.packageCount} {item.packageCount === 1 ? 'plan' : 'plans'}</Text>
          </ScreenContent>
        )}
        ListFooterComponent={isUnlocked ? (
          <ScreenContent width="grouped" style={styles.section}>
            <SectionHeader title="Special offers" />
            <SettingsGroup>
              <SettingsRow label="Welcome gift" onPress={() => navigation.navigate('ExitOffer', { variant: 'gift' })} />
              <SettingsRow label="Price drop" onPress={() => navigation.navigate('ExitOffer', { variant: 'priceDrop' })} isLast />
            </SettingsGroup>
          </ScreenContent>
        ) : null}
      />
      <CollapsingTitleBar title={TITLE} scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  content: { paddingBottom: spacing['7xl'] + spacing.xl },
  section: { paddingHorizontal: padding.screen.horizontal, gap: spacing.md, marginBottom: spacing.lg },
  offeringRow: { paddingHorizontal: padding.screen.horizontal, marginBottom: spacing.md, gap: spacing.xs },
  form: { gap: spacing.md },
  body: { ...typography.body.medium, color: colors.text.secondary },
  input: {
    ...typography.body.medium,
    color: colors.text.primary,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  error: { ...typography.body.small, color: colors.error[700] },
  offerTitle: { ...typography.heading.heading1, fontFamily: fonts.semibold, color: colors.text.primary },
  offerDetail: { ...typography.caption.caption1, color: colors.text.secondary, paddingHorizontal: spacing.md },
});
