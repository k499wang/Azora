import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AccountManagementScreenProps } from '../app/navigation';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import { Text } from '../components/common/Text';
import SettingsGroup from '../components/settings/SettingsGroup';
import SettingsRow from '../components/settings/SettingsRow';
import { trackProfileAction } from '../services/analytics/tracking';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

export default function AccountManagementScreen({ navigation }: AccountManagementScreenProps) {
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const accountActionPending = signingOut || deletingAccount;

  const handleSignOut = () => {
    if (signingOut || deletingAccount) return;
    trackProfileAction('sign_out_prompt_opened');
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          trackProfileAction('sign_out_cancelled');
        },
      },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          trackProfileAction('sign_out_confirmed');
          setSigningOut(true);
          try {
            await signOut();
            trackProfileAction('sign_out_succeeded');
          } catch (err) {
            trackProfileAction('sign_out_failed', {
              error_message: err instanceof Error ? err.message : 'unknown_error',
            });
            const message = err instanceof Error ? err.message : 'Please try again.';
            Alert.alert('Sign out failed', message);
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (signingOut || deletingAccount) return;
    trackProfileAction('delete_account_prompt_opened');
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            trackProfileAction('delete_account_cancelled');
          },
        },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            trackProfileAction('delete_account_confirmed');
            Alert.alert(
              'Are you sure?',
              'All your sessions, stats, and progress will be gone forever.',
              [
                {
                  text: 'Keep my account',
                  style: 'cancel',
                  onPress: () => {
                    trackProfileAction('delete_account_second_cancelled');
                  },
                },
                {
                  text: 'Yes, delete everything',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await deleteAccount();
                      trackProfileAction('delete_account_succeeded');
                    } catch (err) {
                      trackProfileAction('delete_account_failed', {
                        error_message: err instanceof Error ? err.message : 'unknown_error',
                      });
                      const message = err instanceof Error ? err.message : 'Please try again.';
                      Alert.alert('Delete account failed', message);
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <View style={styles.topSection}>
            <AppTopBar
              showAvatar={false}
              showStreak={false}
              leftSlot={
                <View style={styles.headerLeft}>
                  <Pressable
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    hitSlop={12}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={28}
                      color={colors.text.primary}
                    />
                  </Pressable>
                  <Text style={styles.headerTitle}>Account management</Text>
                </View>
              }
            />
          </View>

          <View style={styles.section}>
            <SettingsGroup>
              <SettingsRow
                label={signingOut ? 'Signing out…' : 'Sign out'}
                onPress={accountActionPending ? undefined : handleSignOut}
                showChevron={false}
                centered
                isLast
              />
            </SettingsGroup>
            <SettingsGroup>
              <SettingsRow
                label={deletingAccount ? 'Deleting account…' : 'Delete account'}
                onPress={accountActionPending ? undefined : handleDeleteAccount}
                showChevron={false}
                destructive
                centered
                isLast
              />
            </SettingsGroup>
          </View>
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  topSection: {
    paddingBottom: spacing.xl,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.6,
  },
});
